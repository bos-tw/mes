<?php
/**
 * 系統更新 DB 快照 API
 *
 * @endpoint POST /api/system_update_backup.php
 *
 * @auth 必須登入
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

$employee = requireAuth();
requirePermission('manage_system_parameters');
requireMethod('POST');

$payload = getJsonInput();
$jobId = max(0, (int)($payload['job_id'] ?? 0));
$note = trim((string)($payload['note'] ?? ''));

try {
    $pdo = db();
    $backupInfo = createDailyDatabaseSnapshot($pdo, 7);

    logAuditAction('建立 DB 快照', 'system_update_jobs', $jobId > 0 ? $jobId : null, [
        'note' => $note,
        'backup' => $backupInfo,
    ]);

    jsonResponse([
        'success' => true,
        'message' => ((bool)($backupInfo['reused'] ?? false))
            ? '今日 DB 快照已存在，已重用同日檔案。'
            : 'DB 快照建立完成。',
        'data' => [
            'backup' => $backupInfo,
        ],
    ]);
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage(
            $exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()),
            '建立 DB 快照失敗。'
        ),
    ], 500);
}
