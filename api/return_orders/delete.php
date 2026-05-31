<?php
/**
 * 退貨單 API - 刪除
 *
 * 軟刪除指定退貨單及其品項。
 *
 * @endpoint DELETE /api/return_orders/delete.php?id={id}
 *
 * @auth 必須登入
 * @table return_orders
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 退貨單 ID |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "退貨單已刪除。"
 * }
 *
 * @error 400 ID 無效 / 無法刪除
 * @error 404 退貨單不存在
 *
 * @note 此操作為軟刪除
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
require_once __DIR__ . '/helpers.php';

/**
 * 更新出貨單的退貨狀態
 * 重新計算指定出貨單的退貨狀態並更新
 */
function updateShippingOrderReturnStatus(PDO $pdo, int $shippingOrderId): void
{
    // 計算退貨狀態（只計算未刪除的退貨單品項）
    // 使用子查詢確保只計算未刪除的退貨單品項
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
            ), 0) AS total_returned
        FROM shipping_order_items soi
        WHERE soi.shipping_order_id = :shipping_order_id
    ";

    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute(['shipping_order_id' => $shippingOrderId]);
    $items = $statsStmt->fetchAll(PDO::FETCH_ASSOC);

    $totalItems = count($items);
    $fullyReturnedItems = 0;
    $partialReturnedItems = 0;

    foreach ($items as $item) {
        $shippedQty = (float)$item['shipped_quantity'];
        $totalReturned = (float)$item['total_returned'];
        $returnableQty = $shippedQty - $totalReturned;

        if ($totalReturned > 0) {
            if ($returnableQty <= 0) {
                $fullyReturnedItems++;
            } else {
                $partialReturnedItems++;
            }
        }
    }

    // 判斷整體退貨狀態
    if ($fullyReturnedItems === 0 && $partialReturnedItems === 0) {
        $returnStatus = 'none';
        $hasReturn = false;
    } elseif ($fullyReturnedItems === $totalItems) {
        $returnStatus = 'full';
        $hasReturn = true;
    } else {
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
}

requireAuth();

requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數: id。'], 400);
}

$pdo = db();

$workflowGuard = getWorkflowDeleteAssessment($pdo, 'return_orders', $id);
if (!$workflowGuard['allowed']) {
    jsonResponse([
        'success' => false,
        'message' => $workflowGuard['message'],
        'workflow_guard' => $workflowGuard,
    ], 409);
}

// 檢查是否可刪除
$canDelete = canDeleteReturnOrder($pdo, $id);
if (!$canDelete['can_delete']) {
    jsonResponse([
        'success' => false,
        'message' => $canDelete['reason'],
        'workflow_guard' => $workflowGuard,
    ], 409);
}

try {
    // 先取得退貨單的關聯出貨單 ID（用於後續更新狀態）
    $getShippingOrderStmt = $pdo->prepare("
        SELECT original_shipping_order_id
        FROM return_orders
        WHERE id = :id AND deleted_at IS NULL
    ");
    $getShippingOrderStmt->execute(['id' => $id]);
    $returnOrder = $getShippingOrderStmt->fetch(PDO::FETCH_ASSOC);
    $originalShippingOrderId = $returnOrder ? $returnOrder['original_shipping_order_id'] : null;

    // 軟刪除退貨單
    $stmt = $pdo->prepare("
        UPDATE return_orders
        SET deleted_at = NOW(), delete_token = id
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'message' => '退貨單不存在或已被刪除。'], 404);
    }

    // 注意：return_order_items 沒有 deleted_at 欄位
    // 退貨單軟刪除後，關聯品項會因為 JOIN return_orders.deleted_at IS NULL 條件自動被排除

    // 如果有關聯的出貨單，更新其退貨狀態
    if ($originalShippingOrderId) {
        updateShippingOrderReturnStatus($pdo, (int)$originalShippingOrderId);
    }

    logAuditAction('刪除退貨單', 'ReturnOrders', $id);

    jsonResponse(['success' => true, 'message' => '退貨單已刪除。']);

} catch (Exception $e) {
    error_log('Return order delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除退貨單失敗，請稍後重試。')], 500);
}
