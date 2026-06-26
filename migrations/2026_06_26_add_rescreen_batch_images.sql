START TRANSACTION;

CREATE TABLE IF NOT EXISTS `rescreen_batch_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `rescreen_batch_id` BIGINT NOT NULL COMMENT '二次篩選案件ID',
    `image_type` VARCHAR(30) NOT NULL DEFAULT 'site' COMMENT '圖片類型',
    `file_name` VARCHAR(255) NOT NULL COMMENT '原始檔名',
    `file_path` VARCHAR(500) NOT NULL COMMENT '檔案路徑',
    `file_size` BIGINT DEFAULT NULL COMMENT '檔案大小',
    `mime_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME 類型',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `description` TEXT DEFAULT NULL COMMENT '圖片說明',
    `uploaded_by_employee_id` BIGINT DEFAULT NULL COMMENT '上傳人員',
    `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_rescreen_batch_images_batch_id` (`rescreen_batch_id`),
    KEY `idx_rescreen_batch_images_uploaded_by` (`uploaded_by_employee_id`),
    KEY `idx_rescreen_batch_images_deleted_at` (`deleted_at`),
    CONSTRAINT `fk_rescreen_batch_images_batch`
        FOREIGN KEY (`rescreen_batch_id`) REFERENCES `rescreen_batches` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rescreen_batch_images_uploaded_by`
        FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='二次篩選現場圖片回傳';

COMMIT;
