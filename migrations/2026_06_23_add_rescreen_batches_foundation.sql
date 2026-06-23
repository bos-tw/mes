SET @create_rescreen_batches = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
    ),
    'DO 0',
    "CREATE TABLE `rescreen_batches` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `rescreen_batch_number` VARCHAR(50) NOT NULL COMMENT '二次重篩案件編號',
        `source_return_order_id` BIGINT NOT NULL COMMENT '來源退貨單ID',
        `source_shipping_order_id` BIGINT DEFAULT NULL COMMENT '來源出貨單ID',
        `customer_id` BIGINT NOT NULL COMMENT '客戶ID',
        `source_order_id` BIGINT DEFAULT NULL COMMENT '原始訂單ID',
        `source_order_item_id` BIGINT DEFAULT NULL COMMENT '主來源訂單品項ID',
        `source_work_order_id` BIGINT DEFAULT NULL COMMENT '主來源工單ID',
        `rescreen_work_order_id` BIGINT DEFAULT NULL COMMENT '執行用二次重篩工單ID',
        `rescreen_type` VARCHAR(30) NOT NULL DEFAULT 'strict_rescreen' COMMENT 'strict_rescreen / relaxed_rescreen',
        `request_reason_code` VARCHAR(50) DEFAULT NULL COMMENT '建立原因代碼',
        `result_category` VARCHAR(30) DEFAULT NULL COMMENT '結果分類',
        `status` VARCHAR(30) NOT NULL DEFAULT 'draft' COMMENT 'draft / planned / in_progress / completed / cancelled',
        `rescreen_round` INT NOT NULL DEFAULT 1 COMMENT '重篩輪次',
        `source_item_count` INT NOT NULL DEFAULT 0 COMMENT '來源明細數',
        `source_work_order_count` INT NOT NULL DEFAULT 0 COMMENT '來源工單數',
        `received_total_quantity` DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '退回總數量',
        `received_total_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT '退回總重量(估)',
        `rescreen_output_good_units` DECIMAL(14,2) DEFAULT NULL COMMENT '重篩後可再出貨支數',
        `rescreen_output_defect_units` DECIMAL(14,2) DEFAULT NULL COMMENT '重篩後再次不良支數',
        `rescreen_output_scrap_units` DECIMAL(14,2) DEFAULT NULL COMMENT '報廢支數',
        `notes` TEXT COMMENT '案件備註',
        `created_by_employee_id` BIGINT DEFAULT NULL COMMENT '建立人員',
        `started_at` DATETIME DEFAULT NULL COMMENT '開始時間',
        `completed_at` DATETIME DEFAULT NULL COMMENT '完成時間',
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `deleted_at` TIMESTAMP NULL DEFAULT NULL,
        `delete_token` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_rescreen_batch_number_active` (`rescreen_batch_number`, `delete_token`),
        UNIQUE KEY `uk_rescreen_source_return_order_active` (`source_return_order_id`, `delete_token`),
        KEY `idx_rescreen_batches_customer_id` (`customer_id`),
        KEY `idx_rescreen_batches_status` (`status`),
        KEY `idx_rescreen_batches_type` (`rescreen_type`),
        KEY `idx_rescreen_batches_source_order_id` (`source_order_id`),
        KEY `idx_rescreen_batches_source_order_item_id` (`source_order_item_id`),
        KEY `idx_rescreen_batches_source_work_order_id` (`source_work_order_id`),
        KEY `idx_rescreen_batches_rescreen_work_order_id` (`rescreen_work_order_id`),
        KEY `idx_rescreen_batches_deleted_at` (`deleted_at`),
        CONSTRAINT `fk_rescreen_batches_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_return_order` FOREIGN KEY (`source_return_order_id`) REFERENCES `return_orders` (`id`) ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_shipping_order` FOREIGN KEY (`source_shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_order` FOREIGN KEY (`source_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_order_item` FOREIGN KEY (`source_order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_work_order` FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batches_created_by` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='退貨後二次重篩案件主檔'"
);
PREPARE stmt FROM @create_rescreen_batches;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_rescreen_batch_items = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_items'
    ),
    'DO 0',
    "CREATE TABLE `rescreen_batch_items` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `rescreen_batch_id` BIGINT NOT NULL,
        `return_order_item_id` BIGINT NOT NULL COMMENT '來源退貨明細ID',
        `shipping_order_item_id` BIGINT DEFAULT NULL COMMENT '來源出貨明細ID',
        `source_shipping_order_id` BIGINT DEFAULT NULL COMMENT '來源出貨單ID',
        `source_inventory_item_id` BIGINT DEFAULT NULL COMMENT '來源庫存ID',
        `source_order_id` BIGINT DEFAULT NULL COMMENT '來源訂單ID',
        `source_order_item_id` BIGINT DEFAULT NULL COMMENT '來源訂單品項ID',
        `source_work_order_id` BIGINT DEFAULT NULL COMMENT '來源工單ID',
        `source_defect_history_record_id` BIGINT DEFAULT NULL COMMENT '來源不良歷史ID(虛擬追溯ID)',
        `returned_quantity` DECIMAL(14,2) NOT NULL DEFAULT 0,
        `returned_unit` VARCHAR(50) DEFAULT NULL,
        `estimated_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0,
        `source_notes` TEXT,
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_rescreen_batch_items_batch_id` (`rescreen_batch_id`),
        KEY `idx_rescreen_batch_items_return_order_item_id` (`return_order_item_id`),
        KEY `idx_rescreen_batch_items_order_item_id` (`source_order_item_id`),
        KEY `idx_rescreen_batch_items_work_order_id` (`source_work_order_id`),
        CONSTRAINT `fk_rescreen_batch_items_batch` FOREIGN KEY (`rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_return_order_item` FOREIGN KEY (`return_order_item_id`) REFERENCES `return_order_items` (`id`) ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_shipping_order_item` FOREIGN KEY (`shipping_order_item_id`) REFERENCES `shipping_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_inventory_item` FOREIGN KEY (`source_inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_order` FOREIGN KEY (`source_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_order_item` FOREIGN KEY (`source_order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_items_work_order` FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='二次重篩來源明細'"
);
PREPARE stmt FROM @create_rescreen_batch_items;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_rescreen_batch_rules = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_rules'
    ),
    'DO 0',
    "CREATE TABLE `rescreen_batch_rules` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `rescreen_batch_id` BIGINT NOT NULL,
        `rule_stage` VARCHAR(20) NOT NULL DEFAULT 'original' COMMENT 'original / rescreen',
        `screening_service_id` BIGINT DEFAULT NULL,
        `service_name` VARCHAR(255) NOT NULL,
        `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
        `tolerance_plus_value` DECIMAL(10,3) DEFAULT NULL,
        `tolerance_plus_over` VARCHAR(50) DEFAULT NULL,
        `tolerance_minus_value` DECIMAL(10,3) DEFAULT NULL,
        `tolerance_minus_over` VARCHAR(50) DEFAULT NULL,
        `ppm_standard` DECIMAL(10,2) DEFAULT NULL,
        `notes` TEXT,
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `uk_rescreen_batch_rules_stage_service` (`rescreen_batch_id`, `rule_stage`, `service_name`(120)),
        KEY `idx_rescreen_batch_rules_service_id` (`screening_service_id`),
        CONSTRAINT `fk_rescreen_batch_rules_batch` FOREIGN KEY (`rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_rules_service` FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='二次重篩規則快照'"
);
PREPARE stmt FROM @create_rescreen_batch_rules;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_rescreen_batch_defects = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_defects'
    ),
    'DO 0',
    "CREATE TABLE `rescreen_batch_defects` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `rescreen_batch_id` BIGINT NOT NULL,
        `rescreen_batch_item_id` BIGINT DEFAULT NULL,
        `screening_service_id` BIGINT DEFAULT NULL,
        `service_name` VARCHAR(255) NOT NULL,
        `defect_quantity` DECIMAL(14,2) NOT NULL DEFAULT 0,
        `defect_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0,
        `defect_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
        `source_return_order_item_id` BIGINT DEFAULT NULL,
        `source_defect_history_record_id` BIGINT DEFAULT NULL,
        `rescreen_round` INT NOT NULL DEFAULT 1,
        `notes` TEXT,
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_rescreen_batch_defects_batch_id` (`rescreen_batch_id`),
        KEY `idx_rescreen_batch_defects_item_id` (`rescreen_batch_item_id`),
        CONSTRAINT `fk_rescreen_batch_defects_batch` FOREIGN KEY (`rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_defects_item` FOREIGN KEY (`rescreen_batch_item_id`) REFERENCES `rescreen_batch_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_defects_service` FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_rescreen_batch_defects_return_item` FOREIGN KEY (`source_return_order_item_id`) REFERENCES `return_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='二次重篩再次發生的不良'"
);
PREPARE stmt FROM @create_rescreen_batch_defects;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_inventory_item_sources = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'inventory_item_sources'
    ),
    'DO 0',
    "CREATE TABLE `inventory_item_sources` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `inventory_item_id` BIGINT NOT NULL,
        `source_type` VARCHAR(50) NOT NULL,
        `source_id` BIGINT DEFAULT NULL,
        `source_order_id` BIGINT DEFAULT NULL,
        `source_order_item_id` BIGINT DEFAULT NULL,
        `source_work_order_id` BIGINT DEFAULT NULL,
        `source_shipping_order_id` BIGINT DEFAULT NULL,
        `source_shipping_order_item_id` BIGINT DEFAULT NULL,
        `source_return_order_id` BIGINT DEFAULT NULL,
        `source_return_order_item_id` BIGINT DEFAULT NULL,
        `source_rescreen_batch_id` BIGINT DEFAULT NULL,
        `source_rescreen_batch_item_id` BIGINT DEFAULT NULL,
        `source_defect_history_record_id` BIGINT DEFAULT NULL,
        `notes` TEXT,
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_inventory_item_sources_inventory_item_id` (`inventory_item_id`),
        KEY `idx_inventory_item_sources_source_type` (`source_type`),
        KEY `idx_inventory_item_sources_rescreen_batch_id` (`source_rescreen_batch_id`),
        CONSTRAINT `fk_inventory_item_sources_inventory_item` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_order` FOREIGN KEY (`source_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_order_item` FOREIGN KEY (`source_order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_work_order` FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_shipping_order` FOREIGN KEY (`source_shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_shipping_order_item` FOREIGN KEY (`source_shipping_order_item_id`) REFERENCES `shipping_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_return_order` FOREIGN KEY (`source_return_order_id`) REFERENCES `return_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_return_order_item` FOREIGN KEY (`source_return_order_item_id`) REFERENCES `return_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_rescreen_batch` FOREIGN KEY (`source_rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT `fk_inventory_item_sources_rescreen_batch_item` FOREIGN KEY (`source_rescreen_batch_item_id`) REFERENCES `rescreen_batch_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='庫存正式來源鏈'"
);
PREPARE stmt FROM @create_inventory_item_sources;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_source_rescreen_batch_id = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'work_orders'
          AND COLUMN_NAME = 'source_rescreen_batch_id'
    ),
    'DO 0',
    "ALTER TABLE `work_orders`
        ADD COLUMN `source_rescreen_batch_id` BIGINT NOT NULL DEFAULT 0 COMMENT '來源二次重篩案件ID；0 表示一般工單' AFTER `order_item_id`"
);
PREPARE stmt FROM @add_work_orders_source_rescreen_batch_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_source_rescreen_batch_idx = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'work_orders'
          AND INDEX_NAME = 'idx_work_orders_source_rescreen_batch_id'
    ),
    'DO 0',
    "ALTER TABLE `work_orders`
        ADD KEY `idx_work_orders_source_rescreen_batch_id` (`source_rescreen_batch_id`)"
);
PREPARE stmt FROM @add_work_orders_source_rescreen_batch_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `work_orders`
SET `source_rescreen_batch_id` = 0
WHERE `source_rescreen_batch_id` IS NULL;

SET @drop_work_orders_order_item_unique = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'work_orders'
          AND INDEX_NAME = 'uk_work_orders_order_item_active'
    ),
    'ALTER TABLE `work_orders` DROP INDEX `uk_work_orders_order_item_active`',
    'DO 0'
);
PREPARE stmt FROM @drop_work_orders_order_item_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_order_item_source_unique = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'work_orders'
          AND INDEX_NAME = 'uk_work_orders_order_item_source_active'
    ),
    'DO 0',
    "ALTER TABLE `work_orders`
        ADD UNIQUE KEY `uk_work_orders_order_item_source_active` (`order_item_id`, `source_rescreen_batch_id`, `delete_token`)"
);
PREPARE stmt FROM @add_work_orders_order_item_source_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO `number_sequences` (`id`, `seq_key`, `seq_prefix`, `active_from`, `current_value`, `last_generated_on`)
SELECT `next_id`, 'RB', 'RB', '2026-06-23 00:00:00', 0, NULL
FROM (
    SELECT COALESCE(MAX(`id`), 0) + 1 AS `next_id`
    FROM `number_sequences`
) AS `next_sequence`
WHERE NOT EXISTS (
    SELECT 1
    FROM `number_sequences`
    WHERE `seq_key` = 'RB'
);
