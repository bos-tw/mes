-- P1: make status_lookup_id the only persisted work-order status and add
-- an immutable, shared transition history for all workflow modules.

CREATE TABLE IF NOT EXISTS workflow_status_transitions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    module_name VARCHAR(64) NOT NULL,
    entity_id BIGINT UNSIGNED NOT NULL,
    from_status VARCHAR(64) NOT NULL,
    to_status VARCHAR(64) NOT NULL,
    reason VARCHAR(500) NULL,
    metadata JSON NULL,
    changed_by_employee_id BIGINT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_workflow_transition_entity (module_name, entity_id, changed_at),
    KEY idx_workflow_transition_actor (changed_by_employee_id, changed_at),
    CONSTRAINT fk_workflow_transition_actor
        FOREIGN KEY (changed_by_employee_id) REFERENCES employees(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @backfill_work_order_status = IF(
    EXISTS(SELECT 1 FROM information_schema.columns
           WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'status'),
    'UPDATE work_orders wo JOIN lookup_domains ld ON ld.domain_key = ''status_work_order'' JOIN lookup_values lv ON lv.domain_id = ld.id AND (LOWER(TRIM(lv.value_key)) = LOWER(TRIM(wo.status)) OR TRIM(lv.value_label) = TRIM(wo.status)) SET wo.status_lookup_id = lv.id WHERE (wo.status_lookup_id IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_values current_lv JOIN lookup_domains current_ld ON current_ld.id = current_lv.domain_id AND current_ld.domain_key = ''status_work_order'' WHERE current_lv.id = wo.status_lookup_id)) AND wo.status IS NOT NULL AND TRIM(wo.status) <> ''''',
    'DO 0'
);
PREPARE stmt FROM @backfill_work_order_status;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Repair legacy NULL/invalid lookup references before enforcing NOT NULL.
-- Lifecycle dates provide a deterministic fallback when the legacy status is empty.
UPDATE work_orders wo
JOIN lookup_domains ld
  ON ld.domain_key = 'status_work_order'
JOIN lookup_values fallback_status
  ON fallback_status.domain_id = ld.id
 AND fallback_status.value_key = CASE
      WHEN wo.actual_end_date IS NOT NULL THEN 'completed'
      WHEN wo.actual_start_date IS NOT NULL THEN 'in_progress'
      ELSE 'pending'
    END
SET wo.status_lookup_id = fallback_status.id
WHERE wo.status_lookup_id IS NULL
   OR NOT EXISTS (
      SELECT 1
      FROM lookup_values current_status
      JOIN lookup_domains current_domain
        ON current_domain.id = current_status.domain_id
       AND current_domain.domain_key = 'status_work_order'
      WHERE current_status.id = wo.status_lookup_id
   );

-- Drop only a legacy/incompatible FK; do not assume its constraint name.
SET @legacy_work_order_status_fk = (
    SELECT kcu.constraint_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_schema = kcu.constraint_schema
     AND rc.constraint_name = kcu.constraint_name
     AND rc.table_name = kcu.table_name
    WHERE kcu.table_schema = DATABASE()
      AND kcu.table_name = 'work_orders'
      AND kcu.column_name = 'status_lookup_id'
      AND (
        kcu.referenced_table_name <> 'lookup_values'
        OR rc.update_rule <> 'CASCADE'
        OR rc.delete_rule <> 'RESTRICT'
      )
    ORDER BY kcu.constraint_name
    LIMIT 1
);
SET @drop_legacy_work_order_status_fk = IF(
    @legacy_work_order_status_fk IS NULL,
    'DO 0'
    , CONCAT(
        'ALTER TABLE `work_orders` DROP FOREIGN KEY `',
        REPLACE(@legacy_work_order_status_fk, '`', '``'),
        '`'
    )
);
PREPARE stmt FROM @drop_legacy_work_order_status_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Preserve the deployed integer type while changing only nullability.
SET @work_order_status_column_type = (
    SELECT column_type
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'work_orders'
      AND column_name = 'status_lookup_id'
    LIMIT 1
);
SET @make_work_order_status_not_null = IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'work_orders'
        AND column_name = 'status_lookup_id'
        AND is_nullable = 'YES'
    ),
    CONCAT(
      'ALTER TABLE `work_orders` MODIFY COLUMN `status_lookup_id` ',
      @work_order_status_column_type,
      ' NOT NULL'
    ),
    'DO 0'
);
PREPARE stmt FROM @make_work_order_status_not_null;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_legacy_work_order_status_column = IF(
    EXISTS(
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'work_orders'
        AND column_name = 'status'
    ),
    'ALTER TABLE `work_orders` DROP COLUMN `status`',
    'DO 0'
);
PREPARE stmt FROM @drop_legacy_work_order_status_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_order_status_fk = IF(
    EXISTS(
      SELECT 1
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.referential_constraints rc
        ON rc.constraint_schema = kcu.constraint_schema
       AND rc.constraint_name = kcu.constraint_name
       AND rc.table_name = kcu.table_name
      WHERE kcu.table_schema = DATABASE()
        AND kcu.table_name = 'work_orders'
        AND kcu.column_name = 'status_lookup_id'
        AND kcu.referenced_table_name = 'lookup_values'
        AND rc.update_rule = 'CASCADE'
        AND rc.delete_rule = 'RESTRICT'
    ),
    'DO 0',
    'ALTER TABLE `work_orders` ADD CONSTRAINT `WorkOrders_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT'
);
PREPARE stmt FROM @add_work_order_status_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DELETE duplicate_source
FROM inventory_item_sources duplicate_source
JOIN inventory_item_sources keep_source
  ON keep_source.inventory_item_id = duplicate_source.inventory_item_id
 AND keep_source.source_type = duplicate_source.source_type
 AND keep_source.source_id <=> duplicate_source.source_id
 AND keep_source.id < duplicate_source.id;

INSERT INTO inventory_item_sources (
    inventory_item_id, source_type, source_id,
    source_order_id, source_order_item_id, source_work_order_id, notes
)
SELECT
    ii.id,
    CASE
        WHEN ii.receipt_type = 'partial' THEN 'partial_receipt'
        WHEN ii.receipt_type = 'final' THEN 'final_receipt'
        ELSE 'work_order_receipt'
    END,
    ii.id,
    ii.order_id,
    ii.order_item_id,
    ii.work_order_id,
    'P1 歷史來源鏈回填'
FROM inventory_items ii
WHERE ii.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM inventory_item_sources iis
      WHERE iis.inventory_item_id = ii.id
  );

SET @drop_inventory_source_unique = IF(
    EXISTS(SELECT 1 FROM information_schema.statistics
           WHERE table_schema = DATABASE()
             AND table_name = 'inventory_item_sources'
             AND index_name = 'uq_inventory_item_source'),
    'ALTER TABLE inventory_item_sources DROP INDEX uq_inventory_item_source',
    'DO 0'
);
PREPARE stmt FROM @drop_inventory_source_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE inventory_item_sources
    ADD UNIQUE KEY uq_inventory_item_source (inventory_item_id, source_type, source_id);

ALTER TABLE calendar_event_reminders MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE daily_machine_inspection_items MODIFY id BIGINT NOT NULL AUTO_INCREMENT;

SET SESSION sql_mode = CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'NO_AUTO_VALUE_ON_ZERO');

ALTER TABLE daily_machine_inspection_items DROP FOREIGN KEY fk_inspection_items_inspection;
ALTER TABLE calendar_event_participants DROP FOREIGN KEY fk_event_participants_event;
ALTER TABLE calendar_event_reminders DROP FOREIGN KEY fk_event_reminders_event;
ALTER TABLE lookup_values DROP FOREIGN KEY fk_lookup_values_domain;
ALTER TABLE inventory_item_sources DROP FOREIGN KEY fk_inventory_item_sources_return_order_item;
ALTER TABLE rescreen_batch_defects DROP FOREIGN KEY fk_rescreen_batch_defects_return_item;
ALTER TABLE rescreen_batch_items DROP FOREIGN KEY fk_rescreen_batch_items_return_order_item;
ALTER TABLE inventory_item_sources DROP FOREIGN KEY fk_inventory_item_sources_return_order;
ALTER TABLE rescreen_batches DROP FOREIGN KEY fk_rescreen_batches_return_order;
ALTER TABLE return_order_items DROP FOREIGN KEY fk_roi_return_order;
ALTER TABLE inventory_item_sources DROP FOREIGN KEY fk_inventory_item_sources_shipping_order_item;
ALTER TABLE rescreen_batch_items DROP FOREIGN KEY fk_rescreen_batch_items_shipping_order_item;
ALTER TABLE return_order_items DROP FOREIGN KEY fk_roi_shipping_order_item;
ALTER TABLE inventory_item_sources DROP FOREIGN KEY fk_inventory_item_sources_shipping_order;
ALTER TABLE rescreen_batches DROP FOREIGN KEY fk_rescreen_batches_shipping_order;
ALTER TABLE return_orders DROP FOREIGN KEY fk_return_orders_original_shipping_order;
ALTER TABLE shipping_order_defect_summaries DROP FOREIGN KEY fk_sods_shipping_order;
ALTER TABLE shipping_order_defect_summaries DROP FOREIGN KEY fk_sods_source_shipping_order;
ALTER TABLE shipping_order_items DROP FOREIGN KEY fk_shipping_order_items_order;
ALTER TABLE shipping_order_tool_summaries DROP FOREIGN KEY fk_sots_shipping_order;
ALTER TABLE shipping_quality_inspections DROP FOREIGN KEY fk_sqi_shipping_order;

ALTER TABLE daily_machine_inspections MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE dashboard_calendar_events MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE domain_event_outbox MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE inventory_transactions MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE lookup_domains MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE machine_maintenance_tasks MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE number_sequences MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE production_quality_records MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE quality_issue_reports MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE return_order_items MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE return_orders MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE shipping_order_items MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE shipping_orders MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE shipping_quality_inspections MODIFY id BIGINT NOT NULL AUTO_INCREMENT;
ALTER TABLE system_parameters MODIFY id BIGINT NOT NULL AUTO_INCREMENT;

ALTER TABLE daily_machine_inspection_items ADD CONSTRAINT fk_inspection_items_inspection FOREIGN KEY (inspection_id) REFERENCES daily_machine_inspections(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE calendar_event_participants ADD CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id) REFERENCES dashboard_calendar_events(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE calendar_event_reminders ADD CONSTRAINT fk_event_reminders_event FOREIGN KEY (event_id) REFERENCES dashboard_calendar_events(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE lookup_values ADD CONSTRAINT fk_lookup_values_domain FOREIGN KEY (domain_id) REFERENCES lookup_domains(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE inventory_item_sources ADD CONSTRAINT fk_inventory_item_sources_return_order_item FOREIGN KEY (source_return_order_item_id) REFERENCES return_order_items(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rescreen_batch_defects ADD CONSTRAINT fk_rescreen_batch_defects_return_item FOREIGN KEY (source_return_order_item_id) REFERENCES return_order_items(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rescreen_batch_items ADD CONSTRAINT fk_rescreen_batch_items_return_order_item FOREIGN KEY (return_order_item_id) REFERENCES return_order_items(id) ON UPDATE CASCADE;
ALTER TABLE inventory_item_sources ADD CONSTRAINT fk_inventory_item_sources_return_order FOREIGN KEY (source_return_order_id) REFERENCES return_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rescreen_batches ADD CONSTRAINT fk_rescreen_batches_return_order FOREIGN KEY (source_return_order_id) REFERENCES return_orders(id) ON UPDATE CASCADE;
ALTER TABLE return_order_items ADD CONSTRAINT fk_roi_return_order FOREIGN KEY (return_order_id) REFERENCES return_orders(id) ON DELETE CASCADE;
ALTER TABLE inventory_item_sources ADD CONSTRAINT fk_inventory_item_sources_shipping_order_item FOREIGN KEY (source_shipping_order_item_id) REFERENCES shipping_order_items(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rescreen_batch_items ADD CONSTRAINT fk_rescreen_batch_items_shipping_order_item FOREIGN KEY (shipping_order_item_id) REFERENCES shipping_order_items(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE return_order_items ADD CONSTRAINT fk_roi_shipping_order_item FOREIGN KEY (shipping_order_item_id) REFERENCES shipping_order_items(id);
ALTER TABLE inventory_item_sources ADD CONSTRAINT fk_inventory_item_sources_shipping_order FOREIGN KEY (source_shipping_order_id) REFERENCES shipping_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE rescreen_batches ADD CONSTRAINT fk_rescreen_batches_shipping_order FOREIGN KEY (source_shipping_order_id) REFERENCES shipping_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE return_orders ADD CONSTRAINT fk_return_orders_original_shipping_order FOREIGN KEY (original_shipping_order_id) REFERENCES shipping_orders(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE shipping_order_defect_summaries ADD CONSTRAINT fk_sods_shipping_order FOREIGN KEY (shipping_order_id) REFERENCES shipping_orders(id) ON DELETE CASCADE;
ALTER TABLE shipping_order_defect_summaries ADD CONSTRAINT fk_sods_source_shipping_order FOREIGN KEY (source_shipping_order_id) REFERENCES shipping_orders(id) ON DELETE SET NULL;
ALTER TABLE shipping_order_items ADD CONSTRAINT fk_shipping_order_items_order FOREIGN KEY (shipping_order_id) REFERENCES shipping_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE shipping_order_tool_summaries ADD CONSTRAINT fk_sots_shipping_order FOREIGN KEY (shipping_order_id) REFERENCES shipping_orders(id) ON DELETE CASCADE;
ALTER TABLE shipping_quality_inspections ADD CONSTRAINT fk_sqi_shipping_order FOREIGN KEY (shipping_order_id) REFERENCES shipping_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;
