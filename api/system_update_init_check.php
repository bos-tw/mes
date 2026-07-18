<?php
/**
 * 系統更新初始化檢查 API
 *
 * @endpoint GET /api/system_update_init_check.php
 *
 * @auth 必須登入
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

requireAuth();
requirePermission('manage_system_parameters');
requireMethod('GET');

try {
    $pdo = db();

    $storageRoot = systemUpdateStorageRoot();
    $maintenanceFlag = systemUpdateMaintenanceFlagPath();
    $maintenanceFlagDir = dirname($maintenanceFlag);
    $dbBackupDir = $storageRoot . '/db_backups';
    $jobsMigration = systemUpdateProjectRoot() . '/migrations/2026_05_09_create_system_update_jobs.sql';
    $logsMigration = systemUpdateProjectRoot() . '/migrations/2026_05_09_create_system_update_logs.sql';

    $checks = [
        [
            'key' => 'zip_archive',
            'label' => 'ZipArchive 擴充套件',
            'ok' => class_exists('ZipArchive'),
            'detail' => class_exists('ZipArchive') ? '可用。' : '未啟用 ZipArchive，無法解析更新壓縮檔。',
        ],
        [
            'key' => 'system_update_jobs_table',
            'label' => 'system_update_jobs 資料表',
            'ok' => systemUpdateTableExists($pdo, 'system_update_jobs'),
            'detail' => systemUpdateTableExists($pdo, 'system_update_jobs')
                ? '已建立。'
                : '尚未建立，請先執行 migration：2026_05_09_create_system_update_jobs.sql。',
        ],
        [
            'key' => 'system_update_logs_table',
            'label' => 'system_update_logs 資料表',
            'ok' => systemUpdateTableExists($pdo, 'system_update_logs'),
            'detail' => systemUpdateTableExists($pdo, 'system_update_logs')
                ? '已建立。'
                : '尚未建立，關於系統版本更新內容可能無法顯示。',
        ],
        [
            'key' => 'storage_root_exists',
            'label' => '更新暫存目錄',
            'ok' => is_dir($storageRoot),
            'detail' => is_dir($storageRoot)
                ? '目錄已存在：' . str_replace(systemUpdateProjectRoot() . '/', '', $storageRoot)
                : '目錄不存在，首次上傳時會自動建立。',
        ],
        [
            'key' => 'storage_root_writable',
            'label' => '更新暫存目錄寫入權限',
            'ok' => (!is_dir($storageRoot)) || is_writable($storageRoot),
            'detail' => (!is_dir($storageRoot)) || is_writable($storageRoot)
                ? '可寫入。'
                : '目錄不可寫入，請調整檔案權限。',
        ],
        [
            'key' => 'maintenance_flag_dir_writable',
            'label' => '維護模式狀態檔目錄寫入權限',
            'ok' => (!is_dir($maintenanceFlagDir)) || is_writable($maintenanceFlagDir),
            'detail' => (!is_dir($maintenanceFlagDir)) || is_writable($maintenanceFlagDir)
                ? '可寫入。'
                : '維護模式狀態檔目錄不可寫入：' . toProjectRelativePath($maintenanceFlagDir),
        ],
        [
            'key' => 'db_backup_dir_writable',
            'label' => 'DB 快照目錄寫入權限',
            'ok' => (!is_dir($dbBackupDir)) || is_writable($dbBackupDir),
            'detail' => (!is_dir($dbBackupDir)) || is_writable($dbBackupDir)
                ? '可寫入。'
                : 'DB 快照目錄不可寫入：' . toProjectRelativePath($dbBackupDir),
        ],
        [
            'key' => 'jobs_migration_exists',
            'label' => 'jobs migration 檔案',
            'ok' => is_file($jobsMigration),
            'detail' => is_file($jobsMigration)
                ? '已找到 migration 檔案。'
                : '找不到 migration 檔案：migrations/2026_05_09_create_system_update_jobs.sql。',
        ],
        [
            'key' => 'logs_migration_exists',
            'label' => 'logs migration 檔案',
            'ok' => is_file($logsMigration),
            'detail' => is_file($logsMigration)
                ? '已找到 migration 檔案。'
                : '找不到 migration 檔案：migrations/2026_05_09_create_system_update_logs.sql。',
        ],
    ];

    $allPassed = true;
    foreach ($checks as $check) {
        if (!$check['ok']) {
            $allPassed = false;
            break;
        }
    }

    $message = $allPassed
        ? '初始化檢查通過。'
        : '初始化檢查未通過，請先修正未通過項目。';

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => [
            'initialized' => $allPassed,
            'checks' => $checks,
        ],
    ]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '初始化檢查失敗。'),
    ], 500);
}
