<?php
/**
 * 退貨單 API - 更新出貨單退貨狀態
 *
 * 重新計算並更新指定出貨單的退貨狀態（return_status, has_return）
 *
 * @endpoint POST /api/return_orders/update_shipping_status.php
 *
 * @auth 必須登入
 *
 * @input Body Parameters (JSON):
 * | 參數               | 類型 | 必填 | 說明       |
 * |-------------------|------|------|-----------|
 * | shipping_order_id | int  | 是   | 出貨單 ID  |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "出貨單退貨狀態已更新。",
 *   "data": {
 *     "shipping_order_id": 1,
 *     "return_status": "partial",
 *     "has_return": true,
 *     "total_items": 5,
 *     "fully_returned_items": 2,
 *     "partial_returned_items": 1,
 *     "not_returned_items": 2
 *   }
 * }
 * ```
 *
 * @error 400 參數錯誤
 * @error 404 出貨單不存在
 *
 * @note
 * - 通常由退貨單的新增/編輯/刪除操作自動呼叫
 * - 也可手動呼叫以確保狀態同步
 * - return_status 值：none（無退貨）、partial（部分退貨）、full（全部退貨）
 *
 * @version 1.0.0
 * @since 2026-02-05
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('POST');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
}

if (empty($input['shipping_order_id']) || !is_numeric($input['shipping_order_id'])) {
    jsonResponse(['success' => false, 'message' => '請提供有效的出貨單 ID。'], 400);
}

$shippingOrderId = (int)$input['shipping_order_id'];
$pdo = db();

try {
    // 檢查出貨單是否存在
    $checkSql = "SELECT id FROM shipping_orders WHERE id = :id AND deleted_at IS NULL";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute(['id' => $shippingOrderId]);

    if (!$checkStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '找不到指定的出貨單。'], 404);
    }

    // 計算退貨狀態（只計算未刪除的退貨單品項）
    // 使用子查詢確保已刪除的退貨單不被計算
    $statsSql = "
        SELECT
            soi.id,
            soi.shipped_quantity,
            COALESCE((
                SELECT SUM(roi.returned_quantity)
                FROM return_order_items roi
                INNER JOIN return_orders ro ON roi.return_order_id = ro.id
                WHERE roi.shipping_order_item_id = soi.id
                  AND ro.deleted_at IS NULL
            ), 0) AS total_returned,
            (soi.shipped_quantity - COALESCE((
                SELECT SUM(roi2.returned_quantity)
                FROM return_order_items roi2
                INNER JOIN return_orders ro2 ON roi2.return_order_id = ro2.id
                WHERE roi2.shipping_order_item_id = soi.id
                  AND ro2.deleted_at IS NULL
            ), 0)) AS returnable_quantity
        FROM shipping_order_items soi
        WHERE soi.shipping_order_id = :shipping_order_id
    ";

    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute(['shipping_order_id' => $shippingOrderId]);
    $items = $statsStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalItems = count($items);
    $fullyReturnedItems = 0;
    $partialReturnedItems = 0;
    $notReturnedItems = 0;

    foreach ($items as $item) {
        $returnableQty = (float)$item['returnable_quantity'];
        $shippedQty = (float)$item['shipped_quantity'];
        $totalReturned = (float)$item['total_returned'];

        if ($totalReturned === 0) {
            $notReturnedItems++;
        } elseif ($returnableQty <= 0) {
            $fullyReturnedItems++;
        } else {
            $partialReturnedItems++;
        }
    }

    // 判斷整體退貨狀態
    if ($fullyReturnedItems === 0 && $partialReturnedItems === 0) {
        // 所有品項都沒退貨
        $returnStatus = 'none';
        $hasReturn = false;
    } elseif ($fullyReturnedItems === $totalItems) {
        // 所有品項都全部退貨
        $returnStatus = 'full';
        $hasReturn = true;
    } else {
        // 部分品項退貨或部分數量退貨
        $returnStatus = 'partial';
        $hasReturn = true;
    }

    // 更新出貨單
    $updateSql = "
        UPDATE shipping_orders
        SET
            return_status = :return_status,
            has_return = :has_return,
            updated_at = NOW()
        WHERE id = :id
    ";

    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([
        'return_status' => $returnStatus,
        'has_return' => $hasReturn ? 1 : 0,
        'id' => $shippingOrderId,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '出貨單退貨狀態已更新。',
        'data' => [
            'shipping_order_id' => $shippingOrderId,
            'return_status' => $returnStatus,
            'has_return' => $hasReturn,
            'total_items' => $totalItems,
            'fully_returned_items' => $fullyReturnedItems,
            'partial_returned_items' => $partialReturnedItems,
            'not_returned_items' => $notReturnedItems,
        ],
    ]);

} catch (Exception $e) {
    error_log('Update shipping return status error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新狀態失敗，請稍後重試。')], 500);
}
