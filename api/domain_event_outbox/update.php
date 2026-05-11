<?php
declare(strict_types=1);
/**
 * Domain Event Outbox API - 更新事件
 * 
 * PUT /api/domain_event_outbox/update.php?id={id}
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('PUT');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的事件 ID'], 400);
}

$pdo = db();
$existing = findEvent($pdo, $id);

if (!$existing) {
    jsonResponse(['success' => false, 'message' => '找不到指定的事件'], 404);
}

$input = getJsonInput();
$errors = validateEventData($input, true);

if (!empty($errors)) {
    jsonResponse(['success' => false, 'message' => implode(', ', $errors)], 400);
}

// 建立更新欄位
$updates = [];
$params = [':id' => $id];

if (isset($input['aggregate_type'])) {
    $updates[] = 'aggregate_type = :aggregate_type';
    $params[':aggregate_type'] = $input['aggregate_type'];
}

if (isset($input['aggregate_id'])) {
    $updates[] = 'aggregate_id = :aggregate_id';
    $params[':aggregate_id'] = $input['aggregate_id'];
}

if (isset($input['event_type'])) {
    $updates[] = 'event_type = :event_type';
    $params[':event_type'] = $input['event_type'];
}

if (isset($input['payload'])) {
    $updates[] = 'payload = :payload';
    $params[':payload'] = $input['payload'];
}

if (isset($input['process_status'])) {
    $updates[] = 'process_status = :process_status';
    $params[':process_status'] = $input['process_status'];
    
    // 如果狀態變為 processed，記錄處理時間
    if ($input['process_status'] === 'processed') {
        $updates[] = 'processed_at = NOW()';
    }
}

if (isset($input['retry_count'])) {
    $updates[] = 'retry_count = :retry_count';
    $params[':retry_count'] = (int)$input['retry_count'];
}

if (array_key_exists('last_error', $input)) {
    $updates[] = 'last_error = :last_error';
    $params[':last_error'] = $input['last_error'];
}

if (empty($updates)) {
    jsonResponse(['success' => false, 'message' => '沒有要更新的欄位'], 400);
}

$sql = "UPDATE domain_event_outbox SET " . implode(', ', $updates) . " WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

jsonResponse([
    'success' => true,
    'message' => '事件已更新',
]);
