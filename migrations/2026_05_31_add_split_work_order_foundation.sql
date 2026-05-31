-- 拆分工單基礎資料結構：主工單類型、機台執行明細、不良明細、部分入庫追蹤。

SET @add_work_order_type_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'work_order_type'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `work_order_type` VARCHAR(20) NOT NULL DEFAULT ''normal'' COMMENT ''工單類型(normal=一般, split=拆分)'' AFTER `work_order_number`',
    'DO 0'
);

PREPARE stmt FROM @add_work_order_type_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_order_type_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `INDEX_NAME` = 'idx_work_orders_type'
    ) = 0,
    'ALTER TABLE `work_orders` ADD KEY `idx_work_orders_type` (`work_order_type`)',
    'DO 0'
);

PREPARE stmt FROM @add_work_order_type_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `work_order_machine_runs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL COMMENT '主工單ID',
    `run_label` VARCHAR(50) NULL COMMENT '機台頁籤顯示名稱',
    `machine_id` BIGINT NULL COMMENT '機台ID',
    `machine_sequence` INT NULL COMMENT '機台內排程序號',
    `assigned_employee_id` BIGINT NULL COMMENT '負責員工ID',
    `calibration_employee_id` BIGINT NULL COMMENT '校機人員ID',
    `scheduled_start_date` DATETIME NULL COMMENT '預定開始日期',
    `scheduled_end_date` DATETIME NULL COMMENT '預定結束日期',
    `actual_start_date` DATETIME NULL COMMENT '實際開始日期',
    `actual_end_date` DATETIME NULL COMMENT '實際結束日期',
    `quantity_to_produce` DECIMAL(14,2) NULL COMMENT '生產數量',
    `screening_speed` VARCHAR(50) NULL COMMENT '篩選速度',
    `planned_net_weight_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '分配內容物淨重(kg)',
    `completed_net_weight_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '完成內容物淨重(kg)',
    `weight_per_unit_g` DECIMAL(10,3) NOT NULL DEFAULT 0.000 COMMENT '產品單支重(g)',
    `planned_units` DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '分配換算支數',
    `completed_units` DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '完成換算支數',
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending' COMMENT '執行狀態(pending/scheduled/in_progress/completed/cancelled)',
    `notes` TEXT NULL COMMENT '備註',
    `created_by_employee_id` BIGINT NULL COMMENT '建立者員工ID',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT '刪除時間',
    PRIMARY KEY (`id`),
    KEY `idx_womr_work_order` (`work_order_id`),
    KEY `idx_womr_machine_sequence` (`machine_id`, `machine_sequence`),
    KEY `idx_womr_status` (`status`),
    KEY `idx_womr_scheduled_start` (`scheduled_start_date`),
    KEY `idx_womr_deleted_at` (`deleted_at`),
    KEY `fk_womr_assigned_employee` (`assigned_employee_id`),
    KEY `fk_womr_calibration_employee` (`calibration_employee_id`),
    KEY `fk_womr_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_womr_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_womr_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_womr_assigned_employee` FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_womr_calibration_employee` FOREIGN KEY (`calibration_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_womr_created_by` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='拆分工單機台執行明細';

SET @add_womr_calibration_employee_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_machine_runs'
          AND `COLUMN_NAME` = 'calibration_employee_id'
    ) = 0,
    'ALTER TABLE `work_order_machine_runs` ADD COLUMN `calibration_employee_id` BIGINT NULL COMMENT ''校機人員ID'' AFTER `assigned_employee_id`',
    'DO 0'
);

PREPARE stmt FROM @add_womr_calibration_employee_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_womr_quantity_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_machine_runs'
          AND `COLUMN_NAME` = 'quantity_to_produce'
    ) = 0,
    'ALTER TABLE `work_order_machine_runs` ADD COLUMN `quantity_to_produce` DECIMAL(14,2) NULL COMMENT ''生產數量'' AFTER `actual_end_date`',
    'DO 0'
);

PREPARE stmt FROM @add_womr_quantity_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_womr_screening_speed_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_machine_runs'
          AND `COLUMN_NAME` = 'screening_speed'
    ) = 0,
    'ALTER TABLE `work_order_machine_runs` ADD COLUMN `screening_speed` VARCHAR(50) NULL COMMENT ''篩選速度'' AFTER `quantity_to_produce`',
    'DO 0'
);

PREPARE stmt FROM @add_womr_screening_speed_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_womr_calibration_employee_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_machine_runs'
          AND `INDEX_NAME` = 'fk_womr_calibration_employee'
    ) = 0,
    'ALTER TABLE `work_order_machine_runs` ADD KEY `fk_womr_calibration_employee` (`calibration_employee_id`)',
    'DO 0'
);

PREPARE stmt FROM @add_womr_calibration_employee_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_womr_calibration_employee_fk = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLE_CONSTRAINTS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_machine_runs'
          AND `CONSTRAINT_NAME` = 'fk_womr_calibration_employee'
    ) = 0,
    'ALTER TABLE `work_order_machine_runs` ADD CONSTRAINT `fk_womr_calibration_employee` FOREIGN KEY (`calibration_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL',
    'DO 0'
);

PREPARE stmt FROM @add_womr_calibration_employee_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `work_order_machine_defects` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `machine_run_id` BIGINT NOT NULL COMMENT '機台執行明細ID',
    `work_order_id` BIGINT NOT NULL COMMENT '主工單ID',
    `screening_service_id` BIGINT NOT NULL COMMENT '篩分服務ID',
    `service_name` VARCHAR(255) NULL COMMENT '服務名稱(冗餘儲存)',
    `defect_quantity` INT NOT NULL DEFAULT 0 COMMENT '不良分布支數',
    `recorded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '記錄時間',
    `recorded_by_employee_id` BIGINT NULL COMMENT '記錄人員ID',
    `notes` TEXT NULL COMMENT '備註',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_womd_run_service` (`machine_run_id`, `screening_service_id`),
    KEY `idx_womd_work_order` (`work_order_id`),
    KEY `idx_womd_service` (`screening_service_id`),
    KEY `idx_womd_recorded_at` (`recorded_at`),
    KEY `fk_womd_recorded_by` (`recorded_by_employee_id`),
    CONSTRAINT `fk_womd_machine_run` FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_womd_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_womd_service` FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_womd_recorded_by` FOREIGN KEY (`recorded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='拆分工單機台不良明細';

CREATE TABLE IF NOT EXISTS `work_order_partial_receipts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL COMMENT '主工單ID',
    `machine_run_id` BIGINT NULL COMMENT '拆分工單來源機台執行明細ID；一般工單部分入庫可為 NULL',
    `inventory_item_id` BIGINT NULL COMMENT '關聯庫存項目ID',
    `receipt_number` VARCHAR(50) NULL COMMENT '部分入庫追蹤編號',
    `net_weight_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '內容物淨重(kg)',
    `weight_per_unit_g` DECIMAL(10,3) NOT NULL DEFAULT 0.000 COMMENT '產品單支重(g)',
    `calculated_units` DECIMAL(14,2) NOT NULL DEFAULT 0.00 COMMENT '淨重反推支數',
    `receipt_status` VARCHAR(30) NOT NULL DEFAULT 'partial' COMMENT '入庫狀態(partial/settled/reversed)',
    `settled_at` DATETIME NULL COMMENT '結清時間',
    `settled_by_employee_id` BIGINT NULL COMMENT '結清人員ID',
    `notes` TEXT NULL COMMENT '備註',
    `created_by_employee_id` BIGINT NULL COMMENT '建立者員工ID',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_wopr_receipt_number` (`receipt_number`),
    KEY `idx_wopr_work_order` (`work_order_id`),
    KEY `idx_wopr_machine_run` (`machine_run_id`),
    KEY `idx_wopr_inventory_item` (`inventory_item_id`),
    KEY `idx_wopr_receipt_status` (`receipt_status`),
    KEY `fk_wopr_settled_by` (`settled_by_employee_id`),
    KEY `fk_wopr_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_wopr_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wopr_machine_run` FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_wopr_inventory_item` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_wopr_settled_by` FOREIGN KEY (`settled_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_wopr_created_by` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='拆分工單部分完工入庫追蹤';

SET @allow_wopr_machine_run_null = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'machine_run_id'
          AND `IS_NULLABLE` = 'NO'
    ) > 0,
    'ALTER TABLE `work_order_partial_receipts` MODIFY COLUMN `machine_run_id` BIGINT NULL COMMENT ''拆分工單來源機台執行明細ID；一般工單部分入庫可為 NULL''',
    'DO 0'
);

PREPARE stmt FROM @allow_wopr_machine_run_null;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_production_records_machine_run_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `COLUMN_NAME` = 'machine_run_id'
    ) = 0,
    'ALTER TABLE `production_records` ADD COLUMN `machine_run_id` BIGINT NULL COMMENT ''拆分工單機台執行明細ID'' AFTER `work_order_id`',
    'DO 0'
);

PREPARE stmt FROM @add_production_records_machine_run_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_production_records_machine_run_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `INDEX_NAME` = 'idx_production_records_machine_run'
    ) = 0,
    'ALTER TABLE `production_records` ADD KEY `idx_production_records_machine_run` (`machine_run_id`)',
    'DO 0'
);

PREPARE stmt FROM @add_production_records_machine_run_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_production_records_machine_run_fk = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLE_CONSTRAINTS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `CONSTRAINT_NAME` = 'fk_production_records_machine_run'
    ) = 0,
    'ALTER TABLE `production_records` ADD CONSTRAINT `fk_production_records_machine_run` FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'DO 0'
);

PREPARE stmt FROM @add_production_records_machine_run_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_inventory_receipt_type_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'inventory_items'
          AND `COLUMN_NAME` = 'receipt_type'
    ) = 0,
    'ALTER TABLE `inventory_items` ADD COLUMN `receipt_type` VARCHAR(30) NOT NULL DEFAULT ''standard'' COMMENT ''入庫類型(standard=一般, partial=部分完工, final=最終補入)'' AFTER `inventory_number`',
    'DO 0'
);

PREPARE stmt FROM @add_inventory_receipt_type_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_inventory_receipt_type_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'inventory_items'
          AND `INDEX_NAME` = 'idx_inventory_receipt_type'
    ) = 0,
    'ALTER TABLE `inventory_items` ADD KEY `idx_inventory_receipt_type` (`receipt_type`)',
    'DO 0'
);

PREPARE stmt FROM @add_inventory_receipt_type_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `work_orders`
SET `work_order_type` = 'normal'
WHERE `work_order_type` IS NULL OR TRIM(`work_order_type`) = '';

UPDATE `inventory_items`
SET `receipt_type` = 'standard'
WHERE `receipt_type` IS NULL OR TRIM(`receipt_type`) = '';

