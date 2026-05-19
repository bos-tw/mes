<?php
/**
 * 行事曆事件 API - 刪除端點（軟刪除）
 *
 * @endpoint DELETE /api/dashboard_calendar_events/delete.php?id={id}
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

requireMethod('DELETE');

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

$pdo = db();

try {
    // 軟刪除
    $stmt = $pdo->prepare('UPDATE dashboard_calendar_events SET deleted_at = NOW() WHERE id = :id AND created_by_employee_id = :current_employee_id');
    $stmt->execute([
        'id' => $id,
        'current_employee_id' => $currentEmployeeId,
    ]);

    // 同時刪除關聯的參與者和提醒
    $pdo->prepare('DELETE FROM calendar_event_participants WHERE event_id = :event_id')->execute(['event_id' => $id]);
    $pdo->prepare('DELETE FROM calendar_event_reminders WHERE event_id = :event_id')->execute(['event_id' => $id]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除行事曆事件失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted calendar event', 'DashboardCalendarEvents', $id, $existing);

jsonResponse([
    'success' => true,
    'message' => '行事曆事件已刪除。',
]);
