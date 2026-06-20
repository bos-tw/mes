SET @create_work_order_completion_images = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_completion_images'
    ) = 0,
    'CREATE TABLE `work_order_completion_images` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `work_order_id` BIGINT NOT NULL COMMENT ''工單ID'',
        `file_name` VARCHAR(255) NOT NULL COMMENT ''檔案名稱'',
        `file_path` VARCHAR(500) NOT NULL COMMENT ''檔案路徑'',
        `file_size` BIGINT DEFAULT NULL COMMENT ''檔案大小(bytes)'',
        `mime_type` VARCHAR(100) DEFAULT NULL COMMENT ''MIME類型'',
        `sort_order` INT DEFAULT 0 COMMENT ''排序順序'',
        `description` TEXT NULL COMMENT ''描述'',
        `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''上傳時間'',
        `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT ''刪除時間'',
        `uploaded_by_employee_id` BIGINT DEFAULT NULL COMMENT ''上傳人員ID'',
        PRIMARY KEY (`id`),
        KEY `idx_woci_work_order_id` (`work_order_id`),
        KEY `idx_woci_uploaded_by_employee_id` (`uploaded_by_employee_id`),
        CONSTRAINT `fk_woci_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_woci_uploaded_by_employee` FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT=''工單完工圖片表''',
    'DO 0'
);

PREPARE stmt FROM @create_work_order_completion_images;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_work_order_defect_images = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_defect_images'
    ) = 0,
    'CREATE TABLE `work_order_defect_images` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `work_order_id` BIGINT NOT NULL COMMENT ''工單ID'',
        `file_name` VARCHAR(255) NOT NULL COMMENT ''檔案名稱'',
        `file_path` VARCHAR(500) NOT NULL COMMENT ''檔案路徑'',
        `file_size` BIGINT DEFAULT NULL COMMENT ''檔案大小(bytes)'',
        `mime_type` VARCHAR(100) DEFAULT NULL COMMENT ''MIME類型'',
        `sort_order` INT DEFAULT 0 COMMENT ''排序順序'',
        `description` TEXT NULL COMMENT ''描述'',
        `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''上傳時間'',
        `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT ''刪除時間'',
        `uploaded_by_employee_id` BIGINT DEFAULT NULL COMMENT ''上傳人員ID'',
        PRIMARY KEY (`id`),
        KEY `idx_wodi_work_order_id` (`work_order_id`),
        KEY `idx_wodi_uploaded_by_employee_id` (`uploaded_by_employee_id`),
        CONSTRAINT `fk_wodi_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_wodi_uploaded_by_employee` FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT=''工單不良品圖片表''',
    'DO 0'
);

PREPARE stmt FROM @create_work_order_defect_images;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @create_work_order_tool_condition_images = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`TABLES`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_tool_condition_images'
    ) = 0,
    'CREATE TABLE `work_order_tool_condition_images` (
        `id` BIGINT NOT NULL AUTO_INCREMENT,
        `work_order_id` BIGINT NOT NULL COMMENT ''工單ID'',
        `file_name` VARCHAR(255) NOT NULL COMMENT ''檔案名稱'',
        `file_path` VARCHAR(500) NOT NULL COMMENT ''檔案路徑'',
        `file_size` BIGINT DEFAULT NULL COMMENT ''檔案大小(bytes)'',
        `mime_type` VARCHAR(100) DEFAULT NULL COMMENT ''MIME類型'',
        `sort_order` INT DEFAULT 0 COMMENT ''排序順序'',
        `description` TEXT NULL COMMENT ''描述'',
        `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT ''上傳時間'',
        `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT ''刪除時間'',
        `uploaded_by_employee_id` BIGINT DEFAULT NULL COMMENT ''上傳人員ID'',
        PRIMARY KEY (`id`),
        KEY `idx_wotci_work_order_id` (`work_order_id`),
        KEY `idx_wotci_uploaded_by_employee_id` (`uploaded_by_employee_id`),
        CONSTRAINT `fk_wotci_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT `fk_wotci_uploaded_by_employee` FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT=''工單載具狀況圖片表''',
    'DO 0'
);

PREPARE stmt FROM @create_work_order_tool_condition_images;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
