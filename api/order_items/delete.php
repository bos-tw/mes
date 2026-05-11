<?php
/**
 * 訂單品項 API - 刪除
 *
 * 永久刪除指定訂單品項（硬刪除），同時重新計算訂單總金額。
 *
 * @endpoint DELETE /api/order_items/delete.php?id={int}
 * @method POST + _method=delete (表單提交時使用)
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明       |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 訂單品項 ID |
 *
 * @logic 刪除流程:
 * 1. 驗證 ID 和品項存在性
 * 2. 從 order_items 表刪除記錄
 * 3. 重新計算訂單總金額 (recalculateOrderTotalAmount)
 * 4. 記錄稽核日誌
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "訂單品項已刪除。"
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 訂單品項不存在
 * @error 500 刪除過程發生錯誤
 *
 * @warning 此操作為硬刪除，無法復原
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單品項 ID。',
    ], 400);
}

$pdo = db();

$orderItem = findOrderItem($pdo, $id);
if (!$orderItem) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單品項資料。',
    ], 404);
}

$orderId = (int)$orderItem['order_id'];

// 檢查是否有關聯資料
$relatedTables = [
    ['table' => 'work_orders', 'column' => 'order_item_id', 'label' => '工單', 'softDelete' => true],
    ['table' => 'shipping_order_items', 'column' => 'order_item_id', 'label' => '出貨品項'],
    ['table' => 'return_order_items', 'column' => 'order_item_id', 'label' => '退貨品項'],
    ['table' => 'order_item_screening_details', 'column' => 'order_item_id', 'label' => '篩分服務明細'],
    ['table' => 'order_item_tools', 'column' => 'order_item_id', 'label' => '載具配置'],
];
$relatedLabels = [];
foreach ($relatedTables as $rel) {
    $softDeleteCondition = isset($rel['softDelete']) && $rel['softDelete'] ? ' AND deleted_at IS NULL' : '';
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?{$softDeleteCondition}");
    $checkStmt->execute([$id]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        $relatedLabels[] = $rel['label'];
    }
}
if (!empty($relatedLabels)) {
    jsonResponse([
        'success' => false,
        'message' => '此訂單品項有相關的' . implode('、', $relatedLabels) . '資料，請先刪除相關資料。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('DELETE FROM order_items WHERE id = :id');
    $stmt->execute(['id' => $id]);

    recalculateOrderTotalAmount($pdo, $orderId);

    logAuditAction('刪除訂單品項', 'OrderItems', $id, [
        'order_id' => $orderId,
    ]);
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除訂單品項時發生錯誤。',
        'error' => $exception->getMessage(),
    ], 500);
}

jsonResponse([
    'success' => true,
    'message' => '訂單品項已刪除。',
]);
