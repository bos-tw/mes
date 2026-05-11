<?php
/**
 * 出貨單 API - 刪除出貨項目
 *
 * 刪除指定的出貨項目，釋放庫存已分配數量。
 *
 * @endpoint DELETE /api/shipping_orders/delete_item.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 出貨項目 ID |
 *
 * @logic 刪除流程:
 * 1. 檢查出貨單狀態是否為 draft
 * 2. 釋放庫存 quantity_allocated
 * 3. 刪除出貨項目
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "出貨項目已刪除。"
 * }
 * ```
 *
 * @error 400 ID 無效 / 出貨單非草稿狀態
 * @error 404 出貨項目不存在
 */
declare(strict_types=1);

/**
 * 刪除出貨項目 API
 * DELETE /api/shipping_orders/delete_item.php?id={item_id}
 */

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

// 只接受 DELETE 請求
requireMethod('DELETE');

// 取得項目 ID
$itemId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$itemId) {
    jsonResponse(['success' => false, 'message' => '缺少項目 ID。'], 400);
}

try {
    $pdo = db();

    // 取得項目資訊
    $stmt = $pdo->prepare("
        SELECT soi.*, so.status as order_status
        FROM shipping_order_items soi
        JOIN shipping_orders so ON soi.shipping_order_id = so.id
        WHERE soi.id = ?
    ");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        jsonResponse(['success' => false, 'message' => '找不到該出貨項目。'], 404);
    }

    // 只有草稿狀態才能刪除項目
    if ($item['order_status'] !== 'draft') {
        jsonResponse(['success' => false, 'message' => '只有草稿狀態的出貨單才能刪除項目。'], 400);
    }

    $pdo->beginTransaction();

    try {
        // 釋放庫存已分配數量
        if ($item['inventory_item_id']) {
            $stmt = $pdo->prepare("
                UPDATE inventory_items
                SET quantity_allocated = GREATEST(0, quantity_allocated - ?)
                WHERE id = ?
            ");
            $stmt->execute([$item['shipped_quantity'], $item['inventory_item_id']]);

            // 重新計算庫存狀態
            require_once __DIR__ . '/helpers.php';
            recalculateInventoryStatus($pdo, (int)$item['inventory_item_id']);
        }

        // 刪除出貨項目
        $stmt = $pdo->prepare("DELETE FROM shipping_order_items WHERE id = ?");
        $stmt->execute([$itemId]);

        // 注意：order_items.total_shipped_quantity 不在此更新
        // 只有出貨確認/取消時才重新計算（與 add_item 對稱）

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '出貨項目已刪除。'
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log('Shipping order delete item failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')
    ], 500);
}
