<?php
/**
 * 系統更新手動回滾 API
 *
 * @endpoint GET /api/system_update_rollback.php?limit=20
 * @endpoint POST /api/system_update_rollback.php
 *
 * @auth 必須登入
 * @table system_update_jobs
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

$employee = requireAuth();
$method = requireMethod(['GET', 'POST']);

/**
 * 清空目錄內容（保留目錄本身）。
 */
function clearDirectoryContentsForRollback(string $directory): void
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
            clearDirectoryContentsForRollback($path);
            @rmdir($path);
            continue;
        }

        @unlink($path);
    }
}

/**
 * 回滾失敗時，恢復檔案回滾前狀態。
 *
 * @param array<int,array<string,string>> $restoreOperations
 */
function restoreFilesAfterRollbackFailure(array $restoreOperations): void
{
    for ($i = count($restoreOperations) - 1; $i >= 0; $i--) {
        $operation = $restoreOperations[$i];
        $type = $operation['type'] ?? '';
        $target = $operation['target'] ?? '';

        if ($target === '') {
            continue;
        }

        if ($type === 'overwrite') {
            $backup = $operation['backup'] ?? '';
            if ($backup !== '' && is_file($backup)) {
                $targetDir = dirname($target);
                if (!is_dir($targetDir)) {
                    @mkdir($targetDir, 0755, true);
                }
                @copy($backup, $target);
            }
            continue;
        }

        if ($type === 'create' && is_file($target)) {
            @unlink($target);
        }
    }
}

/**
 * 執行 rollback migration（依 migration 反向順序）。
 *
 * @param array<int,string> $migrationFiles
 * @param array<string,string> $rollbackMap
 * @return array{executed_files: int, executed_statements: int, missing_files: array<int,string>}
 */
function executeRollbackMigrations(
    PDO $pdo,
    string $extractDir,
    array $migrationFiles,
    array $rollbackMap
): array {
    $executedFiles = 0;
    $executedStatements = 0;
    $missingFiles = [];

    for ($i = count($migrationFiles) - 1; $i >= 0; $i--) {
        $migrationFile = normalizeRelativePath((string)$migrationFiles[$i]);
        if ($migrationFile === '') {
            continue;
        }

        $rollbackFile = normalizeRelativePath((string)($rollbackMap[$migrationFile] ?? ''));
        if ($rollbackFile === '') {
            $missingFiles[] = $migrationFile;
            continue;
        }

        $rollbackFullPath = $extractDir . '/' . $rollbackFile;
        if (!is_file($rollbackFullPath)) {
            $missingFiles[] = $rollbackFile;
            continue;
        }

        $executedStatements += executeSqlMigrationFile($pdo, $rollbackFullPath);
        $executedFiles++;
    }

    return [
        'executed_files' => $executedFiles,
        'executed_statements' => $executedStatements,
        'missing_files' => $missingFiles,
    ];
}

/**
 * 判斷回滾準備度。
 */
function evaluateRollbackReadiness(array $job, string $projectRoot): array
{
    $errors = [];
    $packagePath = $projectRoot . '/' . ltrim((string)($job['package_path'] ?? ''), '/');
    if (!is_file($packagePath)) {
        $errors[] = '更新包不存在';
    }

    $backupDir = $projectRoot . '/' . ltrim((string)($job['backup_dir'] ?? ''), '/');
    if ((string)($job['backup_dir'] ?? '') === '' || !is_dir($backupDir)) {
        $errors[] = '檔案備份不存在';
    }

    if ($errors !== []) {
        return ['ready' => false, 'errors' => $errors];
    }

    try {
        $manifest = parseSystemUpdateManifestFromZip($packagePath);
        $migrationFiles = is_array($job['migration_files'] ?? null) ? $job['migration_files'] : [];
        if ($migrationFiles === []) {
            $migrationFiles = is_array($manifest['migrations'] ?? null) ? $manifest['migrations'] : [];
        }

        $rollbackFiles = is_array($manifest['rollback_migrations'] ?? null)
            ? $manifest['rollback_migrations']
            : [];
        $rollbackMap = buildRollbackMigrationMap($migrationFiles, $rollbackFiles);

        foreach ($migrationFiles as $migrationFileRaw) {
            $migrationFile = normalizeRelativePath((string)$migrationFileRaw);
            if ($migrationFile === '') {
                continue;
            }
            if (!array_key_exists($migrationFile, $rollbackMap)) {
                $errors[] = '缺少 rollback 對應：' . $migrationFile;
            }
        }
    } catch (Throwable $exception) {
        $errors[] = 'manifest 檢查失敗：' . $exception->getMessage();
    }

    return ['ready' => $errors === [], 'errors' => $errors];
}

if ($method === 'GET') {
    $pdo = db();
    if (!systemUpdateTableExists($pdo, 'system_update_jobs')) {
        jsonResponse([
            'success' => true,
            'data' => [
                'candidates' => [],
                'maintenance' => getSystemUpdateMaintenanceState(),
            ],
            'message' => '系統更新模組尚未初始化。',
        ]);
    }

    $limit = filter_var($_GET['limit'] ?? 20, FILTER_VALIDATE_INT);
    if ($limit === false || $limit <= 0) {
        $limit = 20;
    }
    $limit = min($limit, 50);

    $stmt = $pdo->prepare(
        'SELECT * FROM system_update_jobs
         WHERE status IN ("success", "rolled_back", "rollback_failed")
         ORDER BY id DESC
         LIMIT :limit'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll() ?: [];

    $projectRoot = systemUpdateProjectRoot();
    $candidates = [];
    foreach ($rows as $row) {
        $job = formatSystemUpdateJob($row);
        $readiness = evaluateRollbackReadiness($job, $projectRoot);

        $candidates[] = [
            'id' => (int)$job['id'],
            'version_number' => (string)$job['version_number'],
            'file_version' => (string)$job['file_version'],
            'release_date' => (string)$job['release_date'],
            'status' => (string)$job['status'],
            'updated_at' => (string)$job['updated_at'],
            'backup_dir' => (string)$job['backup_dir'],
            'rollback_ready' => (bool)$readiness['ready'],
            'rollback_errors' => $readiness['errors'],
        ];
    }

    jsonResponse([
        'success' => true,
        'data' => [
            'candidates' => $candidates,
            'maintenance' => getSystemUpdateMaintenanceState(),
        ],
    ]);
}

$payload = getJsonInput();
$targetJobId = filter_var($payload['job_id'] ?? 0, FILTER_VALIDATE_INT);
if ($targetJobId === false || $targetJobId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的回滾批次編號。',
    ], 400);
}

$projectRoot = systemUpdateProjectRoot();
$storageRoot = systemUpdateStorageRoot();
$extractDir = '';
$runtimeBackupDir = '';
$maintenanceEnabledByThisRollback = false;
$maintenanceWarning = '';
$dbBackupInfo = null;
$fileRestoreOperations = [];
$healthCheck = null;

try {
    if (function_exists('set_time_limit')) {
        @set_time_limit(0);
    }

    $pdo = db();
    if (!systemUpdateTableExists($pdo, 'system_update_jobs')) {
        jsonResponse([
            'success' => false,
            'message' => '系統更新模組尚未初始化。',
        ], 503);
    }

    $job = getSystemUpdateJob($pdo, (int)$targetJobId);
    if ($job === null) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定更新批次。',
        ], 404);
    }

    if ((string)$job['status'] !== 'success') {
        jsonResponse([
            'success' => false,
            'message' => '僅能回滾狀態為 success 的更新批次。',
        ], 409);
    }

    $readiness = evaluateRollbackReadiness($job, $projectRoot);
    if (!(bool)$readiness['ready']) {
        jsonResponse([
            'success' => false,
            'message' => '此版本尚未具備回滾條件：' . implode('、', $readiness['errors']),
        ], 409);
    }

    $actor = (string)($employee['name'] ?? $employee['account'] ?? 'system');
    $maintenanceState = getSystemUpdateMaintenanceState();
    if (!$maintenanceState['enabled']) {
        setSystemUpdateMaintenanceState(
            true,
            $actor,
            '系統版本回滾中（批次 #' . $job['id'] . '）',
            'system_update_rollback',
            (int)$job['id']
        );
        $maintenanceEnabledByThisRollback = true;
    }

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'rolling_back',
        'result_message' => '手動回滾執行中。',
    ]);

    $dbBackupInfo = createDailyDatabaseSnapshot($pdo, 7);

    $workspaceDir = $storageRoot . '/jobs/job_' . $job['id'];
    $extractDir = $workspaceDir . '/rollback_extract';
    $runtimeBackupDir = $workspaceDir . '/rollback_runtime_backup_' . date('Ymd_His');
    ensureDirectoryExists($workspaceDir);
    ensureDirectoryExists($extractDir);
    ensureDirectoryExists($runtimeBackupDir);
    clearDirectoryContentsForRollback($extractDir);

    $packagePath = $projectRoot . '/' . ltrim((string)$job['package_path'], '/');
    $manifest = parseSystemUpdateManifestFromZip($packagePath);
    $filesRoot = normalizeRelativePath((string)$job['files_root']);
    if ($filesRoot === '') {
        $filesRoot = normalizeRelativePath((string)($manifest['files_root'] ?? 'files'));
    }
    if ($filesRoot === '') {
        $filesRoot = 'files';
    }

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

    $packageFiles = collectExtractedPackageFiles($extractDir, $filesRoot);
    if ($packageFiles === []) {
        throw new RuntimeException('更新包未包含可回滾檔案清單。');
    }

    $backupDirRelative = normalizeRelativePath((string)$job['backup_dir']);
    if ($backupDirRelative === '') {
        throw new RuntimeException('找不到更新批次備份目錄資訊。');
    }
    $backupDirAbsolute = $projectRoot . '/' . $backupDirRelative;
    if (!is_dir($backupDirAbsolute)) {
        throw new RuntimeException('更新批次備份目錄不存在：' . $backupDirRelative);
    }

    foreach ($packageFiles as $relativeFile) {
        $targetPath = $projectRoot . '/' . $relativeFile;
        $runtimeBackupPath = $runtimeBackupDir . '/' . $relativeFile;
        $backupSourcePath = $backupDirAbsolute . '/' . $relativeFile;

        if (is_file($targetPath)) {
            ensureDirectoryExists(dirname($runtimeBackupPath));
            if (!copy($targetPath, $runtimeBackupPath)) {
                throw new RuntimeException('建立回滾前保護備份失敗：' . $relativeFile);
            }

            $fileRestoreOperations[] = [
                'type' => 'overwrite',
                'target' => $targetPath,
                'backup' => $runtimeBackupPath,
            ];
        } else {
            $fileRestoreOperations[] = [
                'type' => 'create',
                'target' => $targetPath,
                'backup' => '',
            ];
        }

        if (is_file($backupSourcePath)) {
            ensureDirectoryExists(dirname($targetPath));
            if (!copy($backupSourcePath, $targetPath)) {
                throw new RuntimeException('還原檔案失敗：' . $relativeFile);
            }
            continue;
        }

        if (is_file($targetPath) && !@unlink($targetPath)) {
            throw new RuntimeException('刪除新增檔案失敗：' . $relativeFile);
        }
    }

    $migrationFiles = is_array($job['migration_files']) ? $job['migration_files'] : [];
    if ($migrationFiles === []) {
        $migrationFiles = is_array($manifest['migrations'] ?? null) ? $manifest['migrations'] : [];
    }
    $rollbackMigrations = is_array($manifest['rollback_migrations'] ?? null)
        ? $manifest['rollback_migrations']
        : [];
    $rollbackMap = buildRollbackMigrationMap($migrationFiles, $rollbackMigrations);

    foreach ($migrationFiles as $migrationFileRaw) {
        $migrationFile = normalizeRelativePath((string)$migrationFileRaw);
        if ($migrationFile === '') {
            continue;
        }

        $rollbackFile = normalizeRelativePath((string)($rollbackMap[$migrationFile] ?? ''));
        if ($rollbackFile === '') {
            throw new RuntimeException('缺少 rollback 對應 migration：' . $migrationFile);
        }

        if (!is_file($extractDir . '/' . $rollbackFile)) {
            throw new RuntimeException('缺少 rollback migration 檔案：' . $rollbackFile);
        }
    }

    $migrationRollbackResult = executeRollbackMigrations($pdo, $extractDir, $migrationFiles, $rollbackMap);
    if ($migrationRollbackResult['missing_files'] !== []) {
        throw new RuntimeException(
            '回滾 migration 缺少檔案：' . implode('、', array_slice($migrationRollbackResult['missing_files'], 0, 5))
        );
    }

    $healthCheck = performPostUpdateHealthCheck($pdo, []);
    if (!(bool)($healthCheck['passed'] ?? false)) {
        throw new RuntimeException('回滾後健康檢查未通過。');
    }

    if ($maintenanceEnabledByThisRollback) {
        try {
            setSystemUpdateMaintenanceState(false, $actor, '', 'system_update_rollback', (int)$job['id']);
        } catch (Throwable $exception) {
            $maintenanceWarning = '（維護模式關閉失敗，請手動關閉）';
        }
    }

    $message = sprintf(
        '版本 %s（批次 #%d）回滾完成，還原 %d 個檔案，執行 rollback migration %d 個（%d 條語句），DB 快照%s：%s（保留 %d 天）%s。',
        (string)$job['version_number'],
        (int)$job['id'],
        count($packageFiles),
        (int)$migrationRollbackResult['executed_files'],
        (int)$migrationRollbackResult['executed_statements'],
        ((bool)($dbBackupInfo['reused'] ?? false)) ? '重用當日檔案' : '已建立',
        (string)($dbBackupInfo['file_path'] ?? '-'),
        (int)($dbBackupInfo['retention_days'] ?? 7),
        $maintenanceWarning
    );

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'rolled_back',
        'result_message' => $message,
    ]);

    logAuditAction('手動回滾系統更新', 'system_update_jobs', (int)$job['id'], [
        'version_number' => $job['version_number'],
        'rolled_back_file_count' => count($packageFiles),
        'migration_rollback' => $migrationRollbackResult,
        'db_backup' => $dbBackupInfo,
    ]);

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => [
            'job' => getSystemUpdateJob($pdo, (int)$job['id']),
            'rolled_back_file_count' => count($packageFiles),
            'migration_rollback' => $migrationRollbackResult,
            'db_backup' => $dbBackupInfo,
            'health_check' => $healthCheck,
            'maintenance' => getSystemUpdateMaintenanceState(),
        ],
    ]);
} catch (Throwable $exception) {
    $message = safeErrorMessage(
        $exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()),
        '手動回滾失敗。'
    );

    if ($fileRestoreOperations !== []) {
        restoreFilesAfterRollbackFailure($fileRestoreOperations);
    }

    if ($maintenanceEnabledByThisRollback) {
        try {
            $actor = (string)($employee['name'] ?? $employee['account'] ?? 'system');
            setSystemUpdateMaintenanceState(false, $actor, '', 'system_update_rollback', (int)$targetJobId);
        } catch (Throwable $maintenanceException) {
            $maintenanceWarning = '維護模式關閉失敗：' . $maintenanceException->getMessage();
        }
    }

    try {
        $pdo = db();
        updateSystemUpdateJob($pdo, (int)$targetJobId, [
            'status' => 'rollback_failed',
            'result_message' => $message . ($maintenanceWarning !== '' ? ('（' . $maintenanceWarning . '）') : ''),
        ]);

        logAuditAction('手動回滾系統更新失敗', 'system_update_jobs', (int)$targetJobId, [
            'message' => $message,
            'maintenance_warning' => $maintenanceWarning,
            'db_backup' => $dbBackupInfo,
        ]);
    } catch (Throwable $ignore) {
        // 避免錯誤處理再次拋例外
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
        'data' => [
            'maintenance' => getSystemUpdateMaintenanceState(),
            'maintenance_warning' => $maintenanceWarning,
            'db_backup' => $dbBackupInfo,
            'health_check' => $healthCheck,
        ],
    ], 500);
}
