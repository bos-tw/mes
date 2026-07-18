<?php
/**
 * 系統更新套用 API
 *
 * @endpoint POST /api/system_update_apply.php
 *
 * @auth 必須登入
 * @table system_update_jobs, system_update_logs
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

$employee = requireAuth();
requirePermission('manage_system_parameters');
requireMethod('POST');

$payload = getJsonInput();
$jobId = filter_var($payload['job_id'] ?? 0, FILTER_VALIDATE_INT);
if ($jobId === false || $jobId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的更新任務編號。',
    ], 400);
}

/**
 * 刪除指定目錄底下的所有內容（保留目錄本身）。
 */
function clearDirectoryContents(string $directory): void
{
    if (!is_dir($directory)) {
        return;
    }

    $items = scandir($directory);
    if ($items === false) {
        return;
    }

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }

        $path = $directory . '/' . $item;
        if (is_dir($path)) {
            clearDirectoryContents($path);
            @rmdir($path);
        } else {
            @unlink($path);
        }
    }
}

/**
 * 將檔案還原到套用前狀態。
 *
 * @param array<int,array<string,string>> $operations
 */
function rollbackCopiedFiles(array $operations): void
{
    for ($i = count($operations) - 1; $i >= 0; $i--) {
        $op = $operations[$i];
        $type = $op['type'] ?? '';
        $target = $op['target'] ?? '';

        if ($target === '') {
            continue;
        }

        if ($type === 'overwrite') {
            $backup = $op['backup'] ?? '';
            if ($backup !== '' && is_file($backup)) {
                $targetDir = dirname($target);
                if (!is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }
                @copy($backup, $target);
            }
        } elseif ($type === 'delete') {
            $backup = $op['backup'] ?? '';
            if ($backup !== '' && is_file($backup)) {
                $targetDir = dirname($target);
                if (!is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }
                @copy($backup, $target);
            }
        } elseif ($type === 'create') {
            if (is_file($target)) {
                @unlink($target);
            }
        }
    }
}

/**
 * 嘗試執行 rollback migration（依已執行 migration 反向回滾）。
 *
 * @param array<int,string> $executedMigrationFiles
 * @param array<string,string> $rollbackMap migration => rollback migration
 * @return array<string,mixed>
 */
function rollbackExecutedMigrations(
    PDO $pdo,
    string $extractDir,
    array $executedMigrationFiles,
    array $rollbackMap
): array {
    $report = [
        'attempted' => 0,
        'executed' => 0,
        'statement_count' => 0,
        'missing' => [],
        'errors' => [],
    ];

    if ($executedMigrationFiles === []) {
        return $report;
    }

    for ($i = count($executedMigrationFiles) - 1; $i >= 0; $i--) {
        $migrationFile = normalizeRelativePath((string)$executedMigrationFiles[$i]);
        if ($migrationFile === '') {
            continue;
        }

        $report['attempted']++;
        $rollbackFile = normalizeRelativePath((string)($rollbackMap[$migrationFile] ?? ''));
        if ($rollbackFile === '') {
            $report['missing'][] = $migrationFile;
            continue;
        }

        $rollbackFullPath = $extractDir . '/' . $rollbackFile;
        if (!is_file($rollbackFullPath)) {
            $report['missing'][] = $rollbackFile;
            continue;
        }

        try {
            $statementCount = executeSqlMigrationFile($pdo, $rollbackFullPath);
            $report['executed']++;
            $report['statement_count'] += $statementCount;
        } catch (Throwable $exception) {
            $report['errors'][] = sprintf(
                '%s：%s',
                $rollbackFile,
                $exception->getMessage()
            );
        }
    }

    return $report;
}

/**
 * 將健康檢查失敗項目摘要為單行訊息。
 */
function summarizeHealthCheckFailures(array $healthCheck): string
{
    $failedLabels = [];
    foreach ($healthCheck['checks'] ?? [] as $check) {
        $severity = (string)($check['severity'] ?? 'error');
        $ok = (bool)($check['ok'] ?? false);
        if ($severity === 'error' && !$ok) {
            $failedLabels[] = (string)($check['label'] ?? $check['key'] ?? '未命名檢查項目');
        }
    }

    if ($failedLabels === []) {
        return '未知錯誤';
    }

    return implode('、', $failedLabels);
}

$projectRoot = systemUpdateProjectRoot();
$storageRoot = systemUpdateStorageRoot();
$workspaceDir = '';
$extractDir = '';
$backupDir = '';
$copyOperations = [];
$copiedRelativeFiles = [];
$deletedRelativeFiles = [];
$rollbackMigrationMap = [];
$executedMigrationFiles = [];
$maintenanceEnabledByThisApply = false;
$maintenanceWarning = '';
$dbBackupInfo = null;
$cacheVersionStamp = null;
$runtimeCacheInfo = null;
$healthCheck = null;
$rollbackReport = null;
$applyStage = '初始化';

try {
    if (function_exists('set_time_limit')) {
        @set_time_limit(0);
    }

    $pdo = db();

    if (!systemUpdateTableExists($pdo, 'system_update_jobs')) {
        jsonResponse([
            'success' => false,
            'message' => '系統更新模組尚未初始化，請先執行 migration：2026_05_09_create_system_update_jobs.sql。',
        ], 503);
    }

    $job = getSystemUpdateJob($pdo, (int)$jobId);
    if ($job === null) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的更新任務。',
        ], 404);
    }

    if (!in_array($job['status'], ['validated', 'uploaded', 'failed'], true)) {
        jsonResponse([
            'success' => false,
            'message' => '目前狀態不可套用更新。',
            'data' => ['job' => $job],
        ], 409);
    }

    $workspaceDir = $storageRoot . '/jobs/job_' . $job['id'];
    $extractDir = $workspaceDir . '/extract';
    $backupDir = $workspaceDir . '/backup_' . date('Ymd_His');

    ensureDirectoryExists($workspaceDir);
    ensureDirectoryExists($extractDir);
    ensureDirectoryExists($backupDir);
    clearDirectoryContents($extractDir);

    $actor = (string)($employee['name'] ?? $employee['account'] ?? 'system');
    $maintenanceState = getSystemUpdateMaintenanceState();
    if (!$maintenanceState['enabled']) {
        setSystemUpdateMaintenanceState(
            true,
            $actor,
            '系統更新套用中（批次 #' . $job['id'] . '）',
            'system_update_apply',
            (int)$job['id']
        );
        $maintenanceEnabledByThisApply = true;
    }

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'applying',
        'extract_dir' => toProjectRelativePath($extractDir),
        'backup_dir' => toProjectRelativePath($backupDir),
        'result_message' => '套用更新中，系統已進入維護模式。',
    ]);

    $packagePath = $projectRoot . '/' . ltrim((string)$job['package_path'], '/');
    if (!is_file($packagePath)) {
        throw new RuntimeException('找不到更新壓縮檔，請重新上傳。');
    }

    $manifest = parseSystemUpdateManifestFromZip($packagePath);
    $migrationFiles = is_array($job['migration_files']) ? $job['migration_files'] : [];
    if ($migrationFiles === []) {
        $migrationFiles = is_array($manifest['migrations'] ?? null) ? $manifest['migrations'] : [];
    }
    $rollbackMigrations = is_array($manifest['rollback_migrations'] ?? null)
        ? $manifest['rollback_migrations']
        : [];
    $rollbackMigrationMap = buildRollbackMigrationMap($migrationFiles, $rollbackMigrations);

    $applyStage = '建立資料庫快照';
    $dbBackupInfo = createDailyDatabaseSnapshot($pdo, 7);

    $applyStage = '解壓縮更新包';
    $zip = new ZipArchive();
    $openResult = $zip->open($packagePath);
    if ($openResult !== true) {
        throw new RuntimeException('無法開啟更新壓縮檔。');
    }

    try {
        validateZipEntriesSafe($zip);
        if (!$zip->extractTo($extractDir)) {
            throw new RuntimeException('解壓縮更新包失敗。');
        }
    } finally {
        $zip->close();
    }

    $filesRoot = normalizeRelativePath((string)$job['files_root']);
    if ($filesRoot === '') {
        $filesRoot = 'files';
    }

    $sourceRoot = $extractDir . '/' . $filesRoot;
    if (!is_dir($sourceRoot)) {
        throw new RuntimeException('更新包缺少 files_root 目錄：' . $filesRoot);
    }

    $packageFiles = collectExtractedPackageFiles($extractDir, $filesRoot);
    if ($packageFiles === []) {
        throw new RuntimeException('更新包未包含可套用檔案。');
    }

    $applyStage = '覆蓋更新檔案';
    $copiedFileCount = 0;
    foreach ($packageFiles as $relative) {
        $sourcePath = $sourceRoot . '/' . $relative;
        if (!is_file($sourcePath)) {
            throw new RuntimeException('更新包檔案不存在：' . $relative);
        }

        $targetPath = $projectRoot . '/' . $relative;
        $targetDir = dirname($targetPath);
        ensureDirectoryExists($targetDir);

        if (is_file($targetPath)) {
            $backupPath = $backupDir . '/' . $relative;
            ensureDirectoryExists(dirname($backupPath));
            if (!copy($targetPath, $backupPath)) {
                throw new RuntimeException('備份檔案失敗：' . $relative);
            }

            $copyOperations[] = [
                'type' => 'overwrite',
                'target' => $targetPath,
                'backup' => $backupPath,
            ];
        } else {
            $copyOperations[] = [
                'type' => 'create',
                'target' => $targetPath,
                'backup' => '',
            ];
        }

        if (!copy($sourcePath, $targetPath)) {
            throw new RuntimeException('覆蓋檔案失敗：' . $relative);
        }

        clearstatcache(true, $targetPath);
        $copiedRelativeFiles[] = $relative;
        $copiedFileCount++;
    }

    $applyStage = '刪除舊版檔案';
    $deleteFiles = is_array($manifest['delete_files'] ?? null)
        ? $manifest['delete_files']
        : [];
    $deletedFileCount = 0;
    foreach ($deleteFiles as $deleteFileRaw) {
        $relative = normalizeRelativePath((string)$deleteFileRaw);
        if ($relative === '' || isProtectedUpdatePath($relative)) {
            throw new RuntimeException('更新包包含無效的刪除路徑：' . (string)$deleteFileRaw);
        }

        $targetPath = $projectRoot . '/' . $relative;
        if (!file_exists($targetPath)) {
            $deletedRelativeFiles[] = $relative;
            continue;
        }
        if (!is_file($targetPath)) {
            throw new RuntimeException('更新包刪除目標不是檔案：' . $relative);
        }

        $backupPath = $backupDir . '/' . $relative;
        ensureDirectoryExists(dirname($backupPath));
        if (!copy($targetPath, $backupPath)) {
            throw new RuntimeException('備份待刪除檔案失敗：' . $relative);
        }
        $copyOperations[] = [
            'type' => 'delete',
            'target' => $targetPath,
            'backup' => $backupPath,
        ];
        if (!unlink($targetPath)) {
            throw new RuntimeException('刪除舊版檔案失敗：' . $relative);
        }

        clearstatcache(true, $targetPath);
        $deletedRelativeFiles[] = $relative;
        $deletedFileCount++;
    }

    $runtimeCacheInfo = invalidateSystemUpdateRuntimeCaches(array_merge(
        $copiedRelativeFiles,
        $deletedRelativeFiles
    ));

    $executedMigrationFilesCount = 0;
    $executedMigrationStatements = 0;

    $applyStage = '執行資料庫 migration';
    foreach ($migrationFiles as $migrationFileRaw) {
        $migrationFile = normalizeRelativePath((string)$migrationFileRaw);
        if ($migrationFile === '') {
            continue;
        }

        $fullPath = $extractDir . '/' . $migrationFile;
        $executedMigrationStatements += executeSqlMigrationFile($pdo, $fullPath);
        $executedMigrationFiles[] = $migrationFile;
        $executedMigrationFilesCount++;
    }

    $applyStage = '套用後健康檢查';
    $healthCheck = performPostUpdateHealthCheck($pdo, $copiedRelativeFiles);
    if (!(bool)($healthCheck['passed'] ?? false)) {
        throw new RuntimeException('套用後健康檢查未通過：' . summarizeHealthCheckFailures($healthCheck));
    }

    $cacheVersionStamp = writeSystemUpdateCacheVersionStamp($job);

    $updateLogWarning = '';
    try {
        $upsert = $pdo->prepare(
            'INSERT INTO system_update_logs (
                version_number,
                file_version,
                release_date,
                change_summary,
                created_by,
                is_active
            ) VALUES (
                :version_number,
                :file_version,
                :release_date,
                :change_summary,
                :created_by,
                1
            )
            ON DUPLICATE KEY UPDATE
                file_version = VALUES(file_version),
                release_date = VALUES(release_date),
                change_summary = VALUES(change_summary),
                updated_at = NOW(),
                is_active = 1'
        );

        $upsert->execute([
            ':version_number' => (string)$job['version_number'],
            ':file_version' => (string)$job['file_version'],
            ':release_date' => (string)$job['release_date'],
            ':change_summary' => (string)$job['change_summary'],
            ':created_by' => $actor,
        ]);
    } catch (PDOException $exception) {
        $updateLogWarning = '（更新紀錄寫入失敗，請稍後手動確認）';
    }

    if ($maintenanceEnabledByThisApply) {
        try {
            setSystemUpdateMaintenanceState(false, $actor, '', 'system_update_apply', (int)$job['id']);
        } catch (Throwable $exception) {
            $maintenanceWarning = '（維護模式關閉失敗，請手動關閉）';
        }
    }

    $message = sprintf(
        '更新套用完成，共覆蓋 %d 個檔案、刪除 %d 個舊檔，執行 %d 個 migration 檔（%d 條語句），DB 快照%s：%s（保留 %d 天）%s%s。',
        $copiedFileCount,
        $deletedFileCount,
        $executedMigrationFilesCount,
        $executedMigrationStatements,
        ((bool)($dbBackupInfo['reused'] ?? false)) ? '重用當日檔案' : '已建立',
        (string)($dbBackupInfo['file_path'] ?? '-'),
        (int)($dbBackupInfo['retention_days'] ?? 7),
        $updateLogWarning,
        $maintenanceWarning
    );

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'success',
        'file_count' => $copiedFileCount,
        'result_message' => $message,
    ]);

    logAuditAction('套用系統更新', 'system_update_jobs', (int)$job['id'], [
        'version_number' => $job['version_number'],
        'copied_file_count' => $copiedFileCount,
        'deleted_file_count' => $deletedFileCount,
        'migration_file_count' => $executedMigrationFilesCount,
        'migration_statement_count' => $executedMigrationStatements,
        'db_backup' => $dbBackupInfo,
        'cache_version_stamp' => $cacheVersionStamp,
        'runtime_cache' => $runtimeCacheInfo,
        'health_check_passed' => true,
    ]);

    $latestJob = getSystemUpdateJob($pdo, (int)$job['id']);

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => [
            'job' => $latestJob,
            'copied_file_count' => $copiedFileCount,
            'deleted_file_count' => $deletedFileCount,
            'migration_file_count' => $executedMigrationFilesCount,
            'migration_statement_count' => $executedMigrationStatements,
            'db_backup' => $dbBackupInfo,
            'cache_version_stamp' => $cacheVersionStamp,
            'runtime_cache' => $runtimeCacheInfo,
            'health_check' => $healthCheck,
            'maintenance' => getSystemUpdateMaintenanceState(),
        ],
    ]);
} catch (Throwable $exception) {
    $errorReference = strtoupper(substr(hash('sha256', implode('|', [
        (string)$jobId,
        $applyStage,
        $exception->getMessage(),
        (string)microtime(true),
    ])), 0, 12));
    error_log(sprintf(
        '[system-update][%s][job:%d][stage:%s] %s in %s:%d',
        $errorReference,
        (int)$jobId,
        $applyStage,
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine()
    ));
    $message = safeErrorMessage(
        $exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()),
        sprintf('套用更新失敗（階段：%s，錯誤編號：%s）。', $applyStage, $errorReference)
    );

    if ($copyOperations !== []) {
        rollbackCopiedFiles($copyOperations);
    }

    try {
        $pdoForRollback = isset($pdo) && $pdo instanceof PDO ? $pdo : db();
        $rollbackReport = rollbackExecutedMigrations(
            $pdoForRollback,
            $extractDir,
            $executedMigrationFiles,
            $rollbackMigrationMap
        );
    } catch (Throwable $rollbackException) {
        $rollbackReport = [
            'attempted' => 0,
            'executed' => 0,
            'statement_count' => 0,
            'missing' => [],
            'errors' => ['rollback 程序失敗：' . $rollbackException->getMessage()],
        ];
    }

    if ($maintenanceEnabledByThisApply) {
        try {
            $actor = (string)($employee['name'] ?? $employee['account'] ?? 'system');
            setSystemUpdateMaintenanceState(false, $actor, '', 'system_update_apply', (int)$jobId);
        } catch (Throwable $maintenanceException) {
            $maintenanceWarning = '維護模式關閉失敗：' . $maintenanceException->getMessage();
        }
    }

    try {
        $pdoForUpdate = isset($pdo) && $pdo instanceof PDO ? $pdo : db();

        $rollbackSummary = '';
        if (is_array($rollbackReport)) {
            $missing = (int)count($rollbackReport['missing'] ?? []);
            $errors = (int)count($rollbackReport['errors'] ?? []);
            $rollbackSummary = sprintf(
                '（已嘗試 rollback migration %d 個，成功 %d 個，缺少 %d 個，錯誤 %d 個）',
                (int)($rollbackReport['attempted'] ?? 0),
                (int)($rollbackReport['executed'] ?? 0),
                $missing,
                $errors
            );
        }

        if ($maintenanceWarning !== '') {
            $rollbackSummary .= '（' . $maintenanceWarning . '）';
        }

        updateSystemUpdateJob($pdoForUpdate, (int)$jobId, [
            'status' => 'failed',
            'result_message' => $message . $rollbackSummary,
        ]);

        logAuditAction('套用系統更新失敗', 'system_update_jobs', (int)$jobId, [
            'message' => $message,
            'stage' => $applyStage,
            'error_reference' => $errorReference,
            'rollback_report' => $rollbackReport,
            'db_backup' => $dbBackupInfo,
        ]);
    } catch (Throwable $ignore) {
        // 避免錯誤處理再次拋例外
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
        'data' => [
            'rollback_report' => $rollbackReport,
            'stage' => $applyStage,
            'error_reference' => $errorReference,
            'db_backup' => $dbBackupInfo,
            'health_check' => $healthCheck,
            'runtime_cache' => $runtimeCacheInfo,
            'maintenance' => getSystemUpdateMaintenanceState(),
            'maintenance_warning' => $maintenanceWarning,
        ],
    ], 500);
}
