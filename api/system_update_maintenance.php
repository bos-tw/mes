<?php
/**
 * 系統更新維護模式 API
 *
 * @endpoint GET /api/system_update_maintenance.php
 * @endpoint POST /api/system_update_maintenance.php
 *
 * @auth 必須登入
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

$employee = requireAuth();
$method = requireMethod(['GET', 'POST']);

if ($method === 'GET') {
    jsonResponse([
        'success' => true,
        'data' => [
            'maintenance' => getSystemUpdateMaintenanceState(),
        ],
    ]);
}

$payload = getJsonInput();
$enabled = filter_var($payload['enabled'] ?? null, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
if ($enabled === null) {
    jsonResponse([
        'success' => false,
        'message' => '請提供 enabled=true/false。',
    ], 400);
}

$reason = trim((string)($payload['reason'] ?? ''));
$actor = (string)($employee['name'] ?? $employee['account'] ?? 'system');
$jobId = max(0, (int)($payload['job_id'] ?? 0));

try {
    $state = setSystemUpdateMaintenanceState(
        $enabled,
        $actor,
        $enabled ? $reason : '',
        'manual',
        $jobId
    );

    logAuditAction(
        $enabled ? '啟用維護模式' : '關閉維護模式',
        'system_update_jobs',
        $jobId > 0 ? $jobId : null,
        [
            'reason' => $reason,
            'state' => $state,
        ]
    );

    jsonResponse([
        'success' => true,
        'message' => $enabled ? '已啟用維護模式。' : '已關閉維護模式。',
        'data' => [
            'maintenance' => $state,
        ],
    ]);
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage(
            $exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()),
            '維護模式切換失敗。'
        ),
    ], 500);
}

