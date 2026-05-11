<?php
/**
 * Domain Event Outbox API - 領域事件 Outbox
 * 
 * GET  /api/domain_event_outbox/          - 取得列表
 * POST /api/domain_event_outbox/          - 新增事件
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleGetList();
        break;
    case 'POST':
        handleCreate();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/**
 * 取得事件列表
 */
function handleGetList(): void
{
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 10)));
    $offset = ($page - 1) * $perPage;

    $pdo = db();

    // 篩選條件
    $conditions = [];
    $params = [];

    if (!empty($_GET['aggregate_type'])) {
        $conditions[] = 'aggregate_type LIKE :aggregate_type';
        $params[':aggregate_type'] = '%' . $_GET['aggregate_type'] . '%';
    }

    if (!empty($_GET['event_type'])) {
        $conditions[] = 'event_type LIKE :event_type';
        $params[':event_type'] = '%' . $_GET['event_type'] . '%';
    }

    if (!empty($_GET['process_status'])) {
        $conditions[] = 'process_status = :process_status';
        $params[':process_status'] = $_GET['process_status'];
    }

    $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';

    // 計算總數
    $countSql = "SELECT COUNT(*) FROM domain_event_outbox {$whereClause}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // 取得資料
    $sql = "SELECT * FROM domain_event_outbox {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $data = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $data[] = transformEvent($row);
    }

    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ]);
}

/**
 * 新增事件
 */
function handleCreate(): void
{
    $input = getJsonInput();
    $errors = validateEventData($input);

    if (!empty($errors)) {
        jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
    }

    $pdo = db();

    // 產生新 ID
    $stmt = $pdo->query("SELECT COALESCE(MAX(id), 0) + 1 FROM domain_event_outbox");
    $newId = (int)$stmt->fetchColumn();

    $sql = "INSERT INTO domain_event_outbox 
            (id, aggregate_type, aggregate_id, event_type, payload, process_status, retry_count, last_error) 
            VALUES (:id, :aggregate_type, :aggregate_id, :event_type, :payload, :process_status, :retry_count, :last_error)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $newId,
        ':aggregate_type' => $input['aggregate_type'],
        ':aggregate_id' => $input['aggregate_id'],
        ':event_type' => $input['event_type'],
        ':payload' => $input['payload'] ?? '{}',
        ':process_status' => $input['process_status'] ?? 'pending',
        ':retry_count' => 0,
        ':last_error' => null,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '事件已新增',
        'data' => ['id' => $newId],
    ], 201);
}
