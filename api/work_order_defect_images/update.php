<?php
declare(strict_types=1);

require_once __DIR__ . '/../work_order_execution_image_common.php';

requireAuth();
requireMethod('PUT');

$pdo = db();
$tableName = 'work_order_defect_images';
$input = getJsonInput();
if ($input === [] && !empty($_POST)) {
    $input = $_POST;
}

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的圖片ID。'], 400);
}

$record = findExecutionImageRecord($pdo, $tableName, $id);
if (!$record) {
    jsonResponse(['success' => false, 'message' => '找不到該圖片。'], 404);
}

$fields = [];
$params = ['id' => $id];
if (array_key_exists('description', $input)) {
    $fields[] = 'description = :description';
    $params['description'] = trim((string)$input['description']) ?: null;
}
if (array_key_exists('sort_order', $input)) {
    $fields[] = 'sort_order = :sort_order';
    $params['sort_order'] = (int)$input['sort_order'];
}
if ($fields === []) {
    jsonResponse(['success' => false, 'message' => '沒有提供要更新的欄位。'], 400);
}

try {
    $stmt = $pdo->prepare("UPDATE {$tableName} SET " . implode(', ', $fields) . " WHERE id = :id");
    $stmt->execute($params);
    logAuditAction('Updated defect work order image', $tableName, $id, $params);
    $updated = findExecutionImageRecord($pdo, $tableName, $id);
    jsonResponse([
        'success' => true,
        'message' => '不良品圖片資訊更新成功。',
        'data' => $updated ? transformExecutionImageRecord($updated) : null,
    ]);
} catch (Exception $e) {
    error_log('Update defect image failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
