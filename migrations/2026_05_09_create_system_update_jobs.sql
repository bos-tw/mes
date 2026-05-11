-- ============================================================
-- Migration: 新增系統更新任務表
-- 日期: 2026-05-09
-- 用途: 記錄更新包上傳、驗證與套用狀態
-- ============================================================

USE `yucyuan`;

CREATE TABLE IF NOT EXISTS `system_update_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_name` VARCHAR(255) NOT NULL,
    `package_path` VARCHAR(500) NOT NULL,
    `package_sha256` CHAR(64) NOT NULL,
    `package_size` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'uploaded',
    `version_number` VARCHAR(32) NOT NULL,
    `file_version` VARCHAR(32) NOT NULL,
    `release_date` DATE NOT NULL,
    `change_summary` TEXT NOT NULL,
    `files_root` VARCHAR(120) NOT NULL DEFAULT 'files',
    `migration_files` TEXT NULL,
    `file_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `backup_dir` VARCHAR(500) NULL,
    `extract_dir` VARCHAR(500) NULL,
    `result_message` TEXT NULL,
    `created_by` VARCHAR(100) NOT NULL DEFAULT '',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_system_update_jobs_status` (`status`),
    KEY `idx_system_update_jobs_release_date` (`release_date`),
    KEY `idx_system_update_jobs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
