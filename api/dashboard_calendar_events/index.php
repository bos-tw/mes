<?php
/**
 * 行事曆事件 API - 列表與新增端點
 *
 * @endpoint GET  /api/dashboard_calendar_events/    取得行事曆事件列表
 * @endpoint POST /api/dashboard_calendar_events/    新增行事曆事件
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

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListCalendarEvents();
        break;
    case 'POST':
        handleCreateCalendarEvent();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListCalendarEvents(): void
{
    $pdo = db();
    $currentEmployeeId = getCurrentEmployeeIdOrFail();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $eventType = trim((string)($_GET['event_type'] ?? ''));
    $status = trim((string)($_GET['status'] ?? ''));
    $startDate = trim((string)($_GET['start_date'] ?? ''));
    $endDate = trim((string)($_GET['end_date'] ?? ''));

    $conditions = ['e.deleted_at IS NULL', 'e.created_by_employee_id = :current_employee_id'];
    $params = ['current_employee_id' => $currentEmployeeId];

    if ($keyword !== '') {
        $conditions[] = '(e.title LIKE :keyword OR e.description LIKE :keyword_desc)';
        $params['keyword'] = '%' . $keyword . '%';
        $params['keyword_desc'] = '%' . $keyword . '%';
    }

    if ($eventType !== '') {
        $conditions[] = 'e.event_type = :event_type';
        $params['event_type'] = $eventType;
    }

    if ($status !== '') {
        $conditions[] = 'e.status = :status';
        $params['status'] = $status;
    }

    if ($startDate !== '') {
        $conditions[] = 'e.start_datetime >= :start_date';
        $params['start_date'] = $startDate . ' 00:00:00';
    }

    if ($endDate !== '') {
        $conditions[] = 'e.start_datetime <= :end_date';
        $params['end_date'] = $endDate . ' 23:59:59';
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM dashboard_calendar_events e WHERE ' . $where;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT e.*, emp.name AS creator_name '
        . 'FROM dashboard_calendar_events e '
        . 'LEFT JOIN employees emp ON emp.id = e.created_by_employee_id '
        . 'WHERE ' . $where . ' '
        . 'ORDER BY e.start_datetime DESC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $events = array_map(static fn(array $row): array => transformCalendarEvent($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $events,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateCalendarEvent(): void
{
    $pdo = db();
    $currentEmployeeId = getCurrentEmployeeIdOrFail();
    $payload = getJsonInput();

    // 調試：記錄收到的資料
    error_log('dashboard_calendar_events POST payload: ' . json_encode($payload));

    $validated = validateCalendarEventData($payload, false);
    if ($validated['errors'] !== []) {
        // 調試：記錄驗證錯誤
        error_log('dashboard_calendar_events validation errors: ' . json_encode($validated['errors']));

        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 取得新 ID
    $maxIdStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM dashboard_calendar_events');
    $newId = (int)$maxIdStmt->fetchColumn();

    $columns = ['id', 'created_by_employee_id', 'created_at', 'updated_at'];
    $placeholders = [':id', ':created_by_employee_id', 'NOW()', 'NOW()'];
    $params = [
        'id' => $newId,
        'created_by_employee_id' => $currentEmployeeId,
    ];

    foreach ($data as $column => $value) {
        $columns[] = $column;
        $placeholders[] = ':' . $column;
        $params[$column] = $value;
    }

    $sql = 'INSERT INTO dashboard_calendar_events (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增行事曆事件失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added new calendar event', 'DashboardCalendarEvents', $newId, $data);

    jsonResponse([
        'success' => true,
        'message' => '行事曆事件已新增。',
        'data' => ['id' => $newId],
    ], 201);
}
