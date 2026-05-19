<?php
/**
 * 行事曆提醒 API - 刪除端點
 *
 * @endpoint DELETE /api/calendar_event_reminders/delete.php?id={id}
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

requireMethod('DELETE');

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

$pdo = db();

try {
    $stmt = $pdo->prepare('DELETE FROM calendar_event_reminders WHERE id = :id AND employee_id = :current_employee_id');
    $stmt->execute([
        'id' => $id,
        'current_employee_id' => $currentEmployeeId,
    ]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除提醒失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted calendar event reminder', 'CalendarEventReminders', $id, $existing);

jsonResponse([
    'success' => true,
    'message' => '提醒已刪除。',
]);
