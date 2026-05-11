<?php
/**
 * 行事曆事件參與者 API - 列表與新增端點
 *
 * @endpoint GET  /api/calendar_event_participants/    取得參與者列表
 * @endpoint POST /api/calendar_event_participants/    新增參與者
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

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListParticipants();
        break;
    case 'POST':
        handleCreateParticipant();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListParticipants(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $eventId = (int)($_GET['event_id'] ?? 0);
    $employeeId = (int)($_GET['employee_id'] ?? 0);
    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($eventId > 0) {
        $conditions[] = 'p.event_id = :event_id';
        $params['event_id'] = $eventId;
    }

    if ($employeeId > 0) {
        $conditions[] = 'p.employee_id = :employee_id';
        $params['employee_id'] = $employeeId;
    }

    if ($keyword !== '') {
        $conditions[] = '(e.title LIKE :keyword OR emp.name LIKE :keyword_emp)';
        $params['keyword'] = '%' . $keyword . '%';
        $params['keyword_emp'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM calendar_event_participants p '
        . 'INNER JOIN dashboard_calendar_events e ON e.id = p.event_id AND e.deleted_at IS NULL '
        . 'INNER JOIN employees emp ON emp.id = p.employee_id '
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

    $sql = 'SELECT p.event_id, p.employee_id, e.title AS event_title, e.start_datetime, emp.name AS employee_name, emp.employee_number '
        . 'FROM calendar_event_participants p '
        . 'INNER JOIN dashboard_calendar_events e ON e.id = p.event_id AND e.deleted_at IS NULL '
        . 'INNER JOIN employees emp ON emp.id = p.employee_id '
        . 'WHERE ' . $where . ' '
        . 'ORDER BY p.event_id DESC, p.employee_id ASC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $participants = array_map(static fn(array $row): array => transformParticipant($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $participants,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateParticipant(): void
{
    $pdo = db();
    $payload = getJsonInput();

    $validated = validateParticipantData($payload);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查事件是否存在
    $eventStmt = $pdo->prepare('SELECT id FROM dashboard_calendar_events WHERE id = :id AND deleted_at IS NULL');
    $eventStmt->execute(['id' => $data['event_id']]);
    if (!$eventStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的行事曆事件。',
        ], 404);
    }

    // 檢查員工是否存在
    $empStmt = $pdo->prepare('SELECT id FROM employees WHERE id = :id AND deleted_at IS NULL');
    $empStmt->execute(['id' => $data['employee_id']]);
    if (!$empStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的員工。',
        ], 404);
    }

    // 檢查是否已存在
    $checkStmt = $pdo->prepare('SELECT event_id FROM calendar_event_participants WHERE event_id = :event_id AND employee_id = :employee_id');
    $checkStmt->execute(['event_id' => $data['event_id'], 'employee_id' => $data['employee_id']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '此員工已是該事件的參與者。',
        ], 409);
    }

    $sql = 'INSERT INTO calendar_event_participants (event_id, employee_id) VALUES (:event_id, :employee_id)';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增參與者失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added calendar event participant', 'CalendarEventParticipants', $data['event_id'], $data);

    jsonResponse([
        'success' => true,
        'message' => '參與者已新增。',
    ], 201);
}
