START TRANSACTION;

SET @add_rescreen_batch_defects_disposition = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
          AND COLUMN_NAME = 'disposition'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batch_defects`
        ADD COLUMN `disposition` VARCHAR(30) DEFAULT NULL COMMENT '二次篩選後處置' AFTER `defect_units`"
);
PREPARE stmt FROM @add_rescreen_batch_defects_disposition;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_batch_defects_recorded_at = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
          AND COLUMN_NAME = 'recorded_at'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batch_defects`
        ADD COLUMN `recorded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '二次篩分服務結果記錄時間' AFTER `notes`"
);
PREPARE stmt FROM @add_rescreen_batch_defects_recorded_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_batch_defects_recorded_by = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
          AND COLUMN_NAME = 'recorded_by_employee_id'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batch_defects`
        ADD COLUMN `recorded_by_employee_id` BIGINT DEFAULT NULL COMMENT '二次篩分服務結果記錄人員' AFTER `recorded_at`"
);
PREPARE stmt FROM @add_rescreen_batch_defects_recorded_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_batch_defects_recorded_by_idx = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
          AND INDEX_NAME = 'idx_rescreen_batch_defects_recorded_by'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batch_defects`
        ADD KEY `idx_rescreen_batch_defects_recorded_by` (`recorded_by_employee_id`)"
);
PREPARE stmt FROM @add_rescreen_batch_defects_recorded_by_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_batch_defects_recorded_by_fk = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
          AND CONSTRAINT_NAME = 'fk_rescreen_batch_defects_recorded_by'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batch_defects`
        ADD CONSTRAINT `fk_rescreen_batch_defects_recorded_by`
        FOREIGN KEY (`recorded_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @add_rescreen_batch_defects_recorded_by_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `rescreen_batch_production_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rescreen_batch_id` BIGINT NOT NULL COMMENT '二次篩選案件ID',
    `source_work_order_id` BIGINT DEFAULT NULL COMMENT '來源原始工單ID',
    `production_source_mode` VARCHAR(20) NOT NULL DEFAULT 'preset' COMMENT '生產記錄來源模式',
    `card_number` VARCHAR(50) DEFAULT NULL COMMENT '卡號/桶號',
    `weight_kg` DECIMAL(10,2) DEFAULT NULL COMMENT '重量(kg)',
    `production_date` DATE DEFAULT NULL COMMENT '生產日期',
    `production_time` TIME DEFAULT NULL COMMENT '生產時間',
    `machine_id` BIGINT DEFAULT NULL COMMENT '機台ID',
    `machine_type` VARCHAR(100) DEFAULT NULL COMMENT '機台名稱快照',
    `tool_name` VARCHAR(100) DEFAULT NULL COMMENT '載具種類',
    `tool_weight_kg` DECIMAL(10,3) DEFAULT NULL COMMENT '載具重量(kg)',
    `employee_id` BIGINT DEFAULT NULL COMMENT '記錄人員',
    `notes` TEXT DEFAULT NULL COMMENT '備註',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_rescreen_batch_production_records_batch_id` (`rescreen_batch_id`),
    KEY `idx_rescreen_batch_production_records_source_work_order_id` (`source_work_order_id`),
    KEY `idx_rescreen_batch_production_records_machine_id` (`machine_id`),
    KEY `idx_rescreen_batch_production_records_employee_id` (`employee_id`),
    CONSTRAINT `fk_rescreen_batch_production_records_batch`
        FOREIGN KEY (`rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rescreen_batch_production_records_source_work_order`
        FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_rescreen_batch_production_records_machine`
        FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_rescreen_batch_production_records_employee`
        FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二次篩選生產記錄';

COMMIT;
