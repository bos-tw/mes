<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requirePermission('manage_return_orders');
requireMethod('POST');

$payload = getJsonInput();
if ($payload === [] && !empty($_POST)) {
    $payload = $_POST;
}

$id = (int)($payload['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少有效的圖片 ID。'], 400);
}

$pdo = db();
$stmt = $pdo->prepare('SELECT * FROM rescreen_batch_images WHERE id = :id AND deleted_at IS NULL');
$stmt->execute(['id' => $id]);
$image = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$image) {
    jsonResponse(['success' => false, 'message' => '找不到指定的二次篩選圖片。'], 404);
}

$fields = [];
$params = ['id' => $id];
if (array_key_exists('image_type', $payload)) {
    $fields[] = 'image_type = :image_type';
    $params['image_type'] = mb_substr(trim((string)$payload['image_type']), 0, 30) ?: 'site';
}
if (array_key_exists('description', $payload)) {
    $fields[] = 'description = :description';
    $description = trim((string)$payload['description']);
    $params['description'] = $description !== '' ? $description : null;
}
if (array_key_exists('sort_order', $payload)) {
    $fields[] = 'sort_order = :sort_order';
    $params['sort_order'] = (int)$payload['sort_order'];
}
if ($fields === []) {
    jsonResponse(['success' => false, 'message' => '沒有可更新的欄位。'], 400);
}

try {
    $pdo->beginTransaction();
    $updateStmt = $pdo->prepare('UPDATE rescreen_batch_images SET ' . implode(', ', $fields) . ' WHERE id = :id');
    $updateStmt->execute($params);
    logAuditAction('Update rescreen batch image', 'rescreen_batch_images', $id, ['old_data' => $image, 'new_data' => $params]);
    $pdo->commit();
    jsonResponse(['success' => true, 'message' => '二次篩選圖片已更新。']);
} catch (Exception $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Update rescreen batch image failed: ' . $exception->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($exception, '圖片更新失敗，請稍後重試。')], 500);
}
