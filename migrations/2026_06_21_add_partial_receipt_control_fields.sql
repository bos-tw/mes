SET @add_work_orders_shortage_net_weight_kg = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_net_weight_kg'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_net_weight_kg` DECIMAL(10,2) NULL DEFAULT NULL COMMENT ''真實短缺淨重(kg)'' AFTER `completed_at`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_net_weight_kg;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_units = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_units'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_units` DECIMAL(14,0) NULL DEFAULT NULL COMMENT ''真實短缺支數'' AFTER `shortage_net_weight_kg`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_units;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_reason_code = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_reason_code'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_reason_code` VARCHAR(50) NULL DEFAULT NULL COMMENT ''真實短缺原因代碼'' AFTER `shortage_units`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_reason_code;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_notes = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_notes'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_notes` TEXT NULL COMMENT ''真實短缺補充說明'' AFTER `shortage_reason_code`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_notes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_confirmed_by = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_confirmed_by'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_confirmed_by` BIGINT NULL COMMENT ''真實短缺確認人員ID'' AFTER `shortage_notes`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_confirmed_by;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_confirmed_at = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'shortage_confirmed_at'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `shortage_confirmed_at` DATETIME NULL COMMENT ''真實短缺確認時間'' AFTER `shortage_confirmed_by`',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_confirmed_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_confirmed_by_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `INDEX_NAME` = 'idx_work_orders_shortage_confirmed_by'
    ) = 0,
    'CREATE INDEX `idx_work_orders_shortage_confirmed_by` ON `work_orders` (`shortage_confirmed_by`)',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_confirmed_by_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_work_orders_shortage_confirmed_by_fk = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLE_CONSTRAINTS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `CONSTRAINT_NAME` = 'fk_work_orders_shortage_confirmed_by'
    ) = 0,
    'ALTER TABLE `work_orders` ADD CONSTRAINT `fk_work_orders_shortage_confirmed_by` FOREIGN KEY (`shortage_confirmed_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL',
    'DO 0'
);
PREPARE stmt FROM @add_work_orders_shortage_confirmed_by_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_shipping_tool_details = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'shipping_tool_details'
    ) = 0,
    'ALTER TABLE `work_order_partial_receipts` ADD COLUMN `shipping_tool_details` VARCHAR(255) NULL DEFAULT NULL COMMENT ''本次出貨載具說明'' AFTER `notes`',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_shipping_tool_details;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_reversed_at = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'reversed_at'
    ) = 0,
    'ALTER TABLE `work_order_partial_receipts` ADD COLUMN `reversed_at` DATETIME NULL COMMENT ''沖銷時間'' AFTER `settled_at`',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_reversed_at;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_reversed_by_employee_id = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'reversed_by_employee_id'
    ) = 0,
    'ALTER TABLE `work_order_partial_receipts` ADD COLUMN `reversed_by_employee_id` BIGINT NULL COMMENT ''沖銷人員ID'' AFTER `reversed_at`',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_reversed_by_employee_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_reverse_reason = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'reverse_reason'
    ) = 0,
    'ALTER TABLE `work_order_partial_receipts` ADD COLUMN `reverse_reason` TEXT NULL COMMENT ''沖銷原因'' AFTER `reversed_by_employee_id`',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_reverse_reason;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_reversed_by_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `INDEX_NAME` = 'idx_wopr_reversed_by'
    ) = 0,
    'CREATE INDEX `idx_wopr_reversed_by` ON `work_order_partial_receipts` (`reversed_by_employee_id`)',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_reversed_by_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_wopr_reversed_by_fk = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLE_CONSTRAINTS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `CONSTRAINT_NAME` = 'fk_wopr_reversed_by'
    ) = 0,
    'ALTER TABLE `work_order_partial_receipts` ADD CONSTRAINT `fk_wopr_reversed_by` FOREIGN KEY (`reversed_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL',
    'DO 0'
);
PREPARE stmt FROM @add_wopr_reversed_by_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

START TRANSACTION;

INSERT INTO permissions (name, description, created_at, updated_at)
SELECT
    'work_orders.partial_receipt',
    'Technical key: work_orders.partial_receipt; allow creating work-order partial receipts.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'work_orders.partial_receipt'
);

INSERT INTO permissions (name, description, created_at, updated_at)
SELECT
    'work_orders.reverse_partial_receipt',
    'Technical key: work_orders.reverse_partial_receipt; allow reversing work-order partial receipts.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'work_orders.reverse_partial_receipt'
);

INSERT INTO permissions (name, description, created_at, updated_at)
SELECT
    'work_orders.confirm_shortage',
    'Technical key: work_orders.confirm_shortage; allow confirming work-order shortage settlement.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'work_orders.confirm_shortage'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT DISTINCT
    rp.role_id,
    p_new.id
FROM permissions AS p_new
JOIN permissions AS p_legacy
    ON p_legacy.name IN ('manage_work_orders', '生產工單')
JOIN role_permissions AS rp
    ON rp.permission_id = p_legacy.id
WHERE p_new.name IN (
    'work_orders.partial_receipt',
    'work_orders.reverse_partial_receipt',
    'work_orders.confirm_shortage'
);

COMMIT;
