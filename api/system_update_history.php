<?php
/**
 * 系統更新紀錄 API - 列表端點
 *
 * @endpoint GET /api/system_update_history.php?limit=3
 *
 * @auth 必須登入
 * @table system_update_logs
 *
 * @return JSON
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "version_number": "v1.0.0",
 *     "file_version": "v1.0.0",
 *     "release_date": "2026-02-10",
 *     "change_summary": "..."
 *   }],
 *   "latest": { ... }
 * }
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

requireAuth();
requirePermission('manage_system_parameters');
requireMethod('GET');

$pdo = db();

$limit = filter_var($_GET['limit'] ?? 3, FILTER_VALIDATE_INT);
if ($limit === false || $limit <= 0) {
    $limit = 3;
}
$limit = min($limit, 3);

$sql = 'SELECT id, version_number, file_version, release_date, change_summary, created_by, created_at, updated_at
        FROM system_update_logs
        WHERE is_active = 1
        ORDER BY release_date DESC, id DESC
        LIMIT :limit';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $records = array_map(static function (array $row): array {
        return [
            'id' => (int)($row['id'] ?? 0),
            'version_number' => (string)($row['version_number'] ?? ''),
            'file_version' => (string)($row['file_version'] ?? ''),
            'release_date' => (string)($row['release_date'] ?? ''),
            'change_summary' => (string)($row['change_summary'] ?? ''),
            'created_by' => (string)($row['created_by'] ?? ''),
            'created_at' => (string)($row['created_at'] ?? ''),
            'updated_at' => (string)($row['updated_at'] ?? ''),
        ];
    }, $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $records,
        'latest' => $records[0] ?? null,
    ]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '取得版本更新紀錄失敗。'),
    ], 500);
}
