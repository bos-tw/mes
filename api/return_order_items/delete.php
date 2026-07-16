<?php
/**
 * 刪除退貨品項。
 *
 * @endpoint DELETE /api/return_order_items/delete.php?id={id}
 * @auth 必須登入且具退貨單權限
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的退貨品項 ID。'], 400);
}

$pdo = db();
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("
        SELECT roi.*, ro.processing_status, soi.shipping_order_id
        FROM return_order_items roi
        INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
        INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
        WHERE roi.id = ?
        FOR UPDATE
    ");
    $stmt->execute([$id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$item) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的退貨品項。'], 404);
    }
    if (!in_array((string)$item['processing_status'], ['pending', 'processing'], true)) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '只有待處理或處理中的退貨單可以刪除品項。'], 409);
    }

    $pdo->prepare('DELETE FROM return_order_items WHERE id = ?')->execute([$id]);
    recalculateShippingOrderReturnStatus($pdo, (int)$item['shipping_order_id']);
    $pdo->commit();
    logAuditAction('delete', 'return_order_items', $id, $item);

    jsonResponse(['success' => true, 'message' => '退貨品項已刪除。']);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(handleReturnOrderItemWriteException($exception), 500);
}
