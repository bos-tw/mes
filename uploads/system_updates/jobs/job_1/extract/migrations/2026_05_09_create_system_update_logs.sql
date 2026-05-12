-- ============================================================
-- Migration: 新增系統更新紀錄表
-- 日期: 2026-05-09
-- 用途: 提供「關於系統」彈窗顯示版本號與更新內容
-- ============================================================

USE `yucyuan`;

CREATE TABLE IF NOT EXISTS `system_update_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `version_number` VARCHAR(32) NOT NULL,
    `file_version` VARCHAR(32) NOT NULL,
    `release_date` DATE NOT NULL,
    `change_summary` TEXT NOT NULL,
    `created_by` VARCHAR(100) NOT NULL DEFAULT '',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_system_update_logs_version` (`version_number`),
    KEY `idx_system_update_logs_release_date` (`release_date`),
    KEY `idx_system_update_logs_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_update_logs` (
    `version_number`,
    `file_version`,
    `release_date`,
    `change_summary`,
    `created_by`,
    `is_active`
)
SELECT
    'v1.0.0',
    'v1.0.0',
    '2026-02-10',
    CONCAT(
        '初始版本上線。', '\n',
        '完成訂單管理、生產工單、庫存與出貨核心流程。', '\n',
        '完成權限控管、公告與訊息中心。'
    ),
    'system',
    1
WHERE NOT EXISTS (
    SELECT 1
    FROM `system_update_logs`
    WHERE `version_number` = 'v1.0.0'
);
