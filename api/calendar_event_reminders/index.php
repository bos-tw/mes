<?php
/**
 * 行事曆提醒 API - 列表與新增端點
 *
 * @endpoint GET  /api/calendar_event_reminders/    取得提醒列表
 * @endpoint POST /api/calendar_event_reminders/    新增提醒
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

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListReminders();
        break;
    case 'POST':
        handleCreateReminder();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListReminders(): void
{
    $pdo = db();
    $currentEmployeeId = getCurrentEmployeeIdOrFail();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $eventId = (int)($_GET['event_id'] ?? 0);
    $employeeId = (int)($_GET['employee_id'] ?? 0);
    $isSent = isset($_GET['is_sent']) ? ((int)$_GET['is_sent']) : null;

    $conditions = ['r.employee_id = :current_employee_id'];
    $params = ['current_employee_id' => $currentEmployeeId];

    if ($eventId > 0) {
        $conditions[] = 'r.event_id = :event_id';
        $params['event_id'] = $eventId;
    }

    if ($employeeId > 0) {
        if ($employeeId !== $currentEmployeeId) {
            jsonResponse([
                'success' => false,
                'message' => '只能查詢自己的提醒資料。',
            ], 403);
        }
    }

    if ($isSent !== null) {
        $conditions[] = 'r.is_sent = :is_sent';
        $params['is_sent'] = $isSent;
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM calendar_event_reminders r '
        . 'INNER JOIN dashboard_calendar_events e ON e.id = r.event_id AND e.deleted_at IS NULL '
        . 'WHERE ' . $where;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT r.*, e.title AS event_title, e.start_datetime AS event_start, emp.name AS employee_name '
        . 'FROM calendar_event_reminders r '
        . 'INNER JOIN dashboard_calendar_events e ON e.id = r.event_id AND e.deleted_at IS NULL '
        . 'LEFT JOIN employees emp ON emp.id = r.employee_id '
        . 'WHERE ' . $where . ' '
        . 'ORDER BY r.reminder_datetime ASC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $reminders = array_map(static fn(array $row): array => transformReminder($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $reminders,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateReminder(): void
{
    $pdo = db();
    $currentEmployeeId = getCurrentEmployeeIdOrFail();
    $payload = getJsonInput();

    $validated = validateReminderData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    $requestedEmployeeId = isset($data['employee_id']) ? (int)$data['employee_id'] : $currentEmployeeId;
    if ($requestedEmployeeId !== $currentEmployeeId) {
        jsonResponse([
            'success' => false,
            'message' => '只能建立自己的提醒資料。',
        ], 403);
    }

    $data['employee_id'] = $currentEmployeeId;

    // 檢查事件是否存在且屬於目前登入者
    $event = findOwnedCalendarEvent((int)$data['event_id'], $currentEmployeeId);
    if ($event === null) {
        jsonResponse([
            'success' => false,
            'message' => '找不到可操作的行事曆事件。',
        ], 404);
    }

    // 取得新 ID
    $maxIdStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM calendar_event_reminders');
    $newId = (int)$maxIdStmt->fetchColumn();

    $sql = 'INSERT INTO calendar_event_reminders (id, event_id, employee_id, reminder_datetime, reminder_type, is_sent, created_at, updated_at) '
        . 'VALUES (:id, :event_id, :employee_id, :reminder_datetime, :reminder_type, 0, NOW(), NOW())';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $newId,
            'event_id' => $data['event_id'],
            'employee_id' => $data['employee_id'],
            'reminder_datetime' => $data['reminder_datetime'],
            'reminder_type' => $data['reminder_type'] ?? null,
        ]);
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增提醒失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added calendar event reminder', 'CalendarEventReminders', $newId, $data);

    jsonResponse([
        'success' => true,
        'message' => '提醒已新增。',
        'data' => ['id' => $newId],
    ], 201);
}
