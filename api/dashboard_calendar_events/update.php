<?php
/**
 * 行事曆事件 API - 更新端點
 *
 * @endpoint PUT /api/dashboard_calendar_events/update.php?id={id}
 *
 * @auth 必須登入
 * @table dashboard_calendar_events
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireCsrfForWrite();

requireMethod('PUT');

$currentEmployeeId = getCurrentEmployeeIdOrFail();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$existing = findCalendarEvent($id, $currentEmployeeId);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的行事曆事件。',
    ], 404);
}

$payload = getJsonInput();
$validated = validateCalendarEventData($payload, true);

if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];
if (empty($data)) {
    jsonResponse([
        'success' => false,
        'message' => '沒有需要更新的欄位。',
    ], 400);
}

$pdo = db();
$setClauses = [];
$params = [
    'id' => $id,
    'current_employee_id' => $currentEmployeeId,
];

foreach ($data as $column => $value) {
    $setClauses[] = $column . ' = :' . $column;
    $params[$column] = $value;
}

$setClauses[] = 'updated_at = NOW()';
$sql = 'UPDATE dashboard_calendar_events SET ' . implode(', ', $setClauses)
    . ' WHERE id = :id AND deleted_at IS NULL AND created_by_employee_id = :current_employee_id';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '更新行事曆事件失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Updated calendar event', 'DashboardCalendarEvents', $id, $data);

jsonResponse([
    'success' => true,
    'message' => '行事曆事件已更新。',
]);
