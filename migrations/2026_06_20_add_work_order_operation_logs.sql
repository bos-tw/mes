SET @create_work_order_operation_logs = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_operation_logs'
    ) = 0,
    'CREATE TABLE `work_order_operation_logs` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `work_order_id` BIGINT NOT NULL COMMENT ''工單ID'',
        `action_key` VARCHAR(64) NOT NULL COMMENT ''操作代碼'',
        `action_label` VARCHAR(100) NOT NULL COMMENT ''操作名稱'',
        `status_from_key` VARCHAR(64) DEFAULT NULL COMMENT ''操作前狀態代碼'',
        `status_from_label` VARCHAR(100) DEFAULT NULL COMMENT ''操作前狀態名稱'',
        `status_to_key` VARCHAR(64) DEFAULT NULL COMMENT ''操作後狀態代碼'',
        `status_to_label` VARCHAR(100) DEFAULT NULL COMMENT ''操作後狀態名稱'',
        `related_table` VARCHAR(100) DEFAULT NULL COMMENT ''關聯資料表'',
        `related_id` BIGINT DEFAULT NULL COMMENT ''關聯資料ID'',
        `notes` TEXT NULL COMMENT ''操作說明'',
        `payload_json` JSON DEFAULT NULL COMMENT ''操作補充資料(JSON)'',
        `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''建立時間'',
        `created_by_employee_id` BIGINT DEFAULT NULL COMMENT ''操作人員ID'',
        PRIMARY KEY (`id`),
        KEY `idx_wool_work_order_id` (`work_order_id`),
        KEY `idx_wool_action_key` (`action_key`),
        KEY `idx_wool_created_at` (`created_at`),
        KEY `idx_wool_related_table_id` (`related_table`, `related_id`),
        KEY `idx_wool_created_by_employee_id` (`created_by_employee_id`),
        CONSTRAINT `fk_wool_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_wool_created_by_employee` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT=''工單操作紀錄表''',
    'DO 0'
);

PREPARE stmt FROM @create_work_order_operation_logs;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
