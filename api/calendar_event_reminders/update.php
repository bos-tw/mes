<?php
/**
 * 行事曆提醒 API - 更新端點
 *
 * @endpoint PUT /api/calendar_event_reminders/update.php?id={id}
 *
 * @auth 必須登入
 * @table calendar_event_reminders
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

$existing = findReminder($id, $currentEmployeeId);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的提醒。',
    ], 404);
}

$payload = getJsonInput();
$validated = validateReminderData($payload, true);

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

if (array_key_exists('employee_id', $data) && (int)$data['employee_id'] !== $currentEmployeeId) {
    jsonResponse([
        'success' => false,
        'message' => '只能修改自己的提醒資料。',
    ], 403);
}

if (array_key_exists('event_id', $data)) {
    $targetEvent = findOwnedCalendarEvent((int)$data['event_id'], $currentEmployeeId);
    if ($targetEvent === null) {
        jsonResponse([
            'success' => false,
            'message' => '找不到可操作的行事曆事件。',
        ], 404);
    }
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

if (array_key_exists('is_sent', $data)) {
    $existingIsSent = isset($existing['is_sent']) ? (int)$existing['is_sent'] : 0;
    $newIsSent = (int)$data['is_sent'];

    if ($newIsSent === 1 && $existingIsSent !== 1) {
        $setClauses[] = 'sent_at = NOW()';
    } elseif ($newIsSent === 0) {
        $setClauses[] = 'sent_at = NULL';
    }
}

$setClauses[] = 'updated_at = NOW()';
$sql = 'UPDATE calendar_event_reminders SET ' . implode(', ', $setClauses)
    . ' WHERE id = :id AND employee_id = :current_employee_id';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '更新提醒失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Updated calendar event reminder', 'CalendarEventReminders', $id, $data);

jsonResponse([
    'success' => true,
    'message' => '提醒已更新。',
]);
