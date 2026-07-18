<?php
/**
 * 系統更新任務狀態 API
 *
 * @endpoint GET /api/system_update_status.php?id={job_id}
 * @endpoint GET /api/system_update_status.php?latest=1&limit=10
 *
 * @auth 必須登入
 * @table system_update_jobs
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

/**
 * 格式化更新任務資料。
 */
function formatUpdateStatusRow(array $row): array
{
    $migrationFiles = [];
    $raw = $row['migration_files'] ?? '[]';

    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            $migrationFiles = array_values(array_filter(array_map('strval', $decoded), static fn(string $v): bool => $v !== ''));
        }
    }

    return [
        'id' => (int)($row['id'] ?? 0),
        'package_name' => (string)($row['package_name'] ?? ''),
        'package_path' => (string)($row['package_path'] ?? ''),
        'package_sha256' => (string)($row['package_sha256'] ?? ''),
        'package_size' => (int)($row['package_size'] ?? 0),
        'status' => (string)($row['status'] ?? ''),
        'version_number' => (string)($row['version_number'] ?? ''),
        'file_version' => (string)($row['file_version'] ?? ''),
        'release_date' => (string)($row['release_date'] ?? ''),
        'change_summary' => (string)($row['change_summary'] ?? ''),
        'files_root' => (string)($row['files_root'] ?? 'files'),
        'migration_files' => $migrationFiles,
        'migration_count' => count($migrationFiles),
        'file_count' => (int)($row['file_count'] ?? 0),
        'backup_dir' => (string)($row['backup_dir'] ?? ''),
        'extract_dir' => (string)($row['extract_dir'] ?? ''),
        'result_message' => (string)($row['result_message'] ?? ''),
        'created_by' => (string)($row['created_by'] ?? ''),
        'created_at' => (string)($row['created_at'] ?? ''),
        'updated_at' => (string)($row['updated_at'] ?? ''),
    ];
}

/**
 * 取得單筆更新任務。
 */
function fetchUpdateJob(PDO $pdo, int $jobId): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM system_update_jobs WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $jobId]);
    $row = $stmt->fetch();

    return $row ? formatUpdateStatusRow($row) : null;
}

/**
 * 取得更新任務清單。
 *
 * @return array<int,array<string,mixed>>
 */
function fetchUpdateJobs(PDO $pdo, int $limit): array
{
    $stmt = $pdo->prepare('SELECT * FROM system_update_jobs ORDER BY id DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    return array_map(static fn(array $row): array => formatUpdateStatusRow($row), $rows ?: []);
}

requireAuth();
requirePermission('manage_system_parameters');
requireMethod('GET');

$pdo = db();

if (!systemUpdateTableExists($pdo, 'system_update_jobs')) {
    $maintenanceState = getSystemUpdateMaintenanceState();
    jsonResponse([
        'success' => true,
        'data' => [],
        'latest' => null,
        'initialized' => false,
        'maintenance' => $maintenanceState,
        'message' => '系統更新模組尚未初始化，請先執行 migration：2026_05_09_create_system_update_jobs.sql。',
    ]);
}

$jobId = filter_var($_GET['id'] ?? 0, FILTER_VALIDATE_INT);
try {
    if ($jobId !== false && $jobId > 0) {
        $job = fetchUpdateJob($pdo, (int)$jobId);
        if ($job === null) {
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的更新任務。',
            ], 404);
        }

        jsonResponse([
            'success' => true,
            'data' => $job,
            'maintenance' => getSystemUpdateMaintenanceState(),
        ]);
    }

    $limit = filter_var($_GET['limit'] ?? 10, FILTER_VALIDATE_INT);
    if ($limit === false || $limit <= 0) {
        $limit = 10;
    }
    $limit = min($limit, 30);

    $jobs = fetchUpdateJobs($pdo, $limit);

    jsonResponse([
        'success' => true,
        'data' => $jobs,
        'latest' => $jobs[0] ?? null,
        'initialized' => true,
        'maintenance' => getSystemUpdateMaintenanceState(),
    ]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '讀取更新任務失敗。'),
    ], 500);
}
