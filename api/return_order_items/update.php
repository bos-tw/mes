<?php
/**
 * 更新退貨品項。
 *
 * @endpoint PUT /api/return_order_items/update.php?id={id}
 * @auth 必須登入且具退貨單權限
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('PUT');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的退貨品項 ID。'], 400);
}

$validation = validateReturnOrderItemData(readReturnOrderItemPayload(), true);
if ($validation['errors'] !== []) {
    jsonResponse(['success' => false, 'message' => '欄位驗證失敗。', 'errors' => $validation['errors']], 422);
}
$data = $validation['data'];
if ($data === []) {
    jsonResponse(['success' => false, 'message' => '沒有可更新的欄位。'], 400);
}

$pdo = db();
try {
    $pdo->beginTransaction();
    $currentStmt = $pdo->prepare("
        SELECT roi.*, ro.processing_status, ro.original_shipping_order_id, soi.shipping_order_id
        FROM return_order_items roi
        INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
        INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
        WHERE roi.id = ?
        FOR UPDATE
    ");
    $currentStmt->execute([$id]);
    $current = $currentStmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的退貨品項。'], 404);
    }

    $nextQuantity = (float)($data['returned_quantity'] ?? $current['returned_quantity']);
    $business = validateReturnOrderItemBusinessRules(
        $pdo,
        (int)$current['return_order_id'],
        (int)$current['shipping_order_item_id'],
        $nextQuantity,
        $id
    );
    if ($business['errors'] !== []) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => implode('；', array_values($business['errors'])), 'errors' => $business['errors']], 409);
    }

    $setParts = [];
    $params = [];
    foreach (['returned_quantity', 'returned_unit', 'reason'] as $field) {
        if (array_key_exists($field, $data)) {
            $setParts[] = "{$field} = ?";
            $params[] = $data[$field];
        }
    }
    $params[] = $id;
    $pdo->prepare('UPDATE return_order_items SET ' . implode(', ', $setParts) . ' WHERE id = ?')->execute($params);
    recordReturnOrderItemInventorySource($pdo, $id, $business['source'] ?? []);

    recalculateShippingOrderReturnStatus($pdo, (int)$current['shipping_order_id']);
    $pdo->commit();
    logAuditAction('update', 'return_order_items', $id, $data);

    jsonResponse([
        'success' => true,
        'message' => '退貨品項已更新。',
        'data' => transformReturnOrderItem(findReturnOrderItem($pdo, $id)),
    ]);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(handleReturnOrderItemWriteException($exception), 500);
}
