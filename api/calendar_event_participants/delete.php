<?php
/**
 * 行事曆事件參與者 API - 刪除端點
 *
 * @endpoint DELETE /api/calendar_event_participants/delete.php?event_id={event_id}&employee_id={employee_id}
 *
 * @auth 必須登入
 * @table calendar_event_participants
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$eventId = (int)($_GET['event_id'] ?? 0);
$employeeId = (int)($_GET['employee_id'] ?? 0);

if ($eventId <= 0 || $employeeId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的事件 ID 或員工 ID。',
    ], 400);
}

$existing = findParticipant($eventId, $employeeId);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的參與者記錄。',
    ], 404);
}

$pdo = db();

try {
    $stmt = $pdo->prepare('DELETE FROM calendar_event_participants WHERE event_id = :event_id AND employee_id = :employee_id');
    $stmt->execute(['event_id' => $eventId, 'employee_id' => $employeeId]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除參與者失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted calendar event participant', 'CalendarEventParticipants', $eventId, $existing);

jsonResponse([
    'success' => true,
    'message' => '參與者已移除。',
]);
