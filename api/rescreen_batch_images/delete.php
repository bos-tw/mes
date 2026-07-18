<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requirePermission('manage_return_orders');
requireMethod('DELETE');

$payload = getJsonInput();
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

try {
    $pdo->beginTransaction();
    $deleteStmt = $pdo->prepare('UPDATE rescreen_batch_images SET deleted_at = NOW() WHERE id = :id');
    $deleteStmt->execute(['id' => $id]);
    logAuditAction('Delete rescreen batch image', 'rescreen_batch_images', $id, ['old_data' => $image]);
    $pdo->commit();
    jsonResponse(['success' => true, 'message' => '二次篩選圖片已刪除。']);
} catch (Exception $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Delete rescreen batch image failed: ' . $exception->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($exception, '圖片刪除失敗，請稍後重試。')], 500);
}
