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
        } elseif ($type === 'create') {
            if (is_file($target)) {
                @unlink($target);
            }
        }
    }
}

try {
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

    $projectRoot = systemUpdateProjectRoot();
    $storageRoot = systemUpdateStorageRoot();
    $workspaceDir = $storageRoot . '/jobs/job_' . $job['id'];
    $extractDir = $workspaceDir . '/extract';
    $backupDir = $workspaceDir . '/backup_' . date('Ymd_His');

    ensureDirectoryExists($workspaceDir);
    ensureDirectoryExists($extractDir);
    ensureDirectoryExists($backupDir);
    clearDirectoryContents($extractDir);

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'applying',
        'extract_dir' => str_replace($projectRoot . '/', '', $extractDir),
        'backup_dir' => str_replace($projectRoot . '/', '', $backupDir),
        'result_message' => '套用更新中，請稍候。',
    ]);

    $packagePath = $projectRoot . '/' . ltrim((string)$job['package_path'], '/');
    if (!is_file($packagePath)) {
        throw new RuntimeException('找不到更新壓縮檔，請重新上傳。');
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

    $filesRoot = normalizeRelativePath((string)$job['files_root']);
    if ($filesRoot === '') {
        $filesRoot = 'files';
    }

    $sourceRoot = $extractDir . '/' . $filesRoot;
    if (!is_dir($sourceRoot)) {
        throw new RuntimeException('更新包缺少 files_root 目錄：' . $filesRoot);
    }

    $copyOperations = [];
    $copiedFileCount = 0;

    $sourceRootNormalized = str_replace('\\', '/', realpath($sourceRoot) ?: $sourceRoot);
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceRoot, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo->isFile()) {
            continue;
        }

        $sourcePath = str_replace('\\', '/', $fileInfo->getPathname());
        $relative = substr($sourcePath, strlen($sourceRootNormalized));
        $relative = ltrim(str_replace('\\', '/', (string)$relative), '/');
        $relative = normalizeRelativePath($relative);

        if ($relative === '') {
            continue;
        }

        if (isProtectedUpdatePath($relative)) {
            throw new RuntimeException('更新包包含受保護路徑：' . $relative);
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

        $copiedFileCount++;
    }

    $migrationFiles = is_array($job['migration_files']) ? $job['migration_files'] : [];
    $executedMigrationFiles = 0;
    $executedMigrationStatements = 0;

    foreach ($migrationFiles as $migrationFile) {
        $migrationFile = normalizeRelativePath((string)$migrationFile);
        if ($migrationFile === '') {
            continue;
        }

        $fullPath = $extractDir . '/' . $migrationFile;
        $executedMigrationStatements += executeSqlMigrationFile($pdo, $fullPath);
        $executedMigrationFiles++;
    }

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
            ':created_by' => (string)($employee['name'] ?? $employee['account'] ?? 'system'),
        ]);
    } catch (PDOException $exception) {
        $updateLogWarning = '（更新紀錄寫入失敗，請稍後手動確認）';
    }

    $message = sprintf(
        '更新套用完成，共覆蓋 %d 個檔案，執行 %d 個 migration 檔（%d 條語句）%s。',
        $copiedFileCount,
        $executedMigrationFiles,
        $executedMigrationStatements,
        $updateLogWarning
    );

    updateSystemUpdateJob($pdo, (int)$job['id'], [
        'status' => 'success',
        'file_count' => $copiedFileCount,
        'result_message' => $message,
    ]);

    logAuditAction('套用系統更新', 'system_update_jobs', (int)$job['id'], [
        'version_number' => $job['version_number'],
        'copied_file_count' => $copiedFileCount,
        'migration_file_count' => $executedMigrationFiles,
        'migration_statement_count' => $executedMigrationStatements,
    ]);

    $latestJob = getSystemUpdateJob($pdo, (int)$job['id']);

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => [
            'job' => $latestJob,
            'copied_file_count' => $copiedFileCount,
            'migration_file_count' => $executedMigrationFiles,
            'migration_statement_count' => $executedMigrationStatements,
        ],
    ]);
} catch (Throwable $exception) {
    $message = safeErrorMessage(
        $exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()),
        '套用更新失敗。'
    );

    if (isset($copyOperations) && is_array($copyOperations)) {
        rollbackCopiedFiles($copyOperations);
    }

    try {
        $pdo = db();
        updateSystemUpdateJob($pdo, (int)$jobId, [
            'status' => 'failed',
            'result_message' => $message,
        ]);

        logAuditAction('套用系統更新失敗', 'system_update_jobs', (int)$jobId, [
            'message' => $message,
        ]);
    } catch (Throwable $ignore) {
        // 避免錯誤處理再次拋例外
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
    ], 500);
}
