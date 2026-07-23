<?php
/**
 * 出貨單 API - 刪除
 *
 * 刪除指定出貨單，同時釋放庫存已分配數量。
 *
 * @endpoint DELETE /api/shipping_orders/delete.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 出貨單 ID |
 *
 * @logic 刪除流程:
 * 1. 取得所有出貨項目
 * 2. 釋放庫存 quantity_allocated
 * 3. 刪除出貨項目 (shipping_order_items)
 * 4. 刪除出貨單 (shipping_orders)
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "出貨單已刪除。"
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 出貨單不存在
 *
 * @warning 此操作為硬刪除，無法復原
 */
declare(strict_types=1);

/**
 * 刪除出貨單 API
 * DELETE /api/shipping_orders/delete.php?id={id}
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
requireAuth();

requireMethod('DELETE');

// 取得 ID
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    jsonResponse(['success' => false, 'message' => '缺少出貨單 ID。'], 400);
}

try {
    $pdo = db();

    // 檢查出貨單是否存在
    $stmt = $pdo->prepare("SELECT * FROM shipping_orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['success' => false, 'message' => '找不到該出貨單。'], 404);
    }
    if ((string)$order['status'] !== 'draft') {
        jsonResponse([
            'success' => false,
            'message' => '只有草稿出貨單可以刪除。',
        ], 409);
    }

    $workflowGuard = getWorkflowDeleteAssessment($pdo, 'shipping_orders', $id);
    if (!$workflowGuard['allowed']) {
        jsonResponse([
            'success' => false,
            'message' => $workflowGuard['message'],
            'workflow_guard' => $workflowGuard,
        ], 409);
    }

    // 檢查是否有關聯資料（品質檢驗、退貨單）
    $relatedTables = [
        ['table' => 'shipping_quality_inspections', 'column' => 'shipping_order_id', 'label' => '出貨品質檢驗'],
        ['table' => 'return_orders', 'column' => 'original_shipping_order_id', 'label' => '退貨單'],
    ];
    $relatedLabels = [];
    foreach ($relatedTables as $rel) {
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?");
        $checkStmt->execute([$id]);
        if ((int)$checkStmt->fetchColumn() > 0) {
            $relatedLabels[] = $rel['label'];
        }
    }
    if (!empty($relatedLabels)) {
        jsonResponse([
            'success' => false,
            'message' => '此出貨單有相關的' . implode('、', $relatedLabels) . '資料，請先處理相關資料後再刪除。',
        ], 409);
    }

    // 開始交易
    $pdo->beginTransaction();

    try {
        // 取得所有出貨項目以釋放已分配的數量
        $stmt = $pdo->prepare("
            SELECT id, inventory_item_id, shipped_quantity, order_item_id
            FROM shipping_order_items
            WHERE shipping_order_id = ? AND inventory_item_id IS NOT NULL
        ");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        require_once __DIR__ . '/helpers.php';

        // 如果出貨單已出貨（shipped），需要回沖庫存
        $isShipped = ($order['status'] === 'shipped');
        $currentUserId = getCurrentEmployeeId();

        foreach ($items as $item) {
            $qty = (float)$item['shipped_quantity'];
            $invId = (int)$item['inventory_item_id'];

            if ($isShipped) {
                // 回沖已出貨的庫存
                $pdo->prepare("
                    UPDATE inventory_items SET
                        quantity_on_hand = quantity_on_hand + ?,
                        quantity_shipped = GREATEST(0, quantity_shipped - ?)
                    WHERE id = ?
                ")->execute([$qty, $qty, $invId]);

                // 取得回沖後的在庫數量
                $afterStmt = $pdo->prepare("SELECT quantity_on_hand FROM inventory_items WHERE id = ?");
                $afterStmt->execute([$invId]);
                $afterQty = (float)$afterStmt->fetchColumn();

                createInventoryTransaction(
                    $pdo, $invId, 'shipping_order', $id,
                    'inbound', $qty, $afterQty,
                    "出貨單 {$order['shipping_order_number']} 刪除，庫存回沖",
                    $currentUserId
                );
            } else {
                // 只釋放已分配數量（草稿/確認狀態）
                $pdo->prepare("
                    UPDATE inventory_items
                    SET quantity_allocated = GREATEST(0, quantity_allocated - ?)
                    WHERE id = ?
                ")->execute([$qty, $invId]);
            }

            recalculateInventoryStatus($pdo, $invId);
            $pdo->prepare("
                UPDATE inventory_packages package_row
                JOIN shipping_order_item_packages link
                  ON link.inventory_package_id = package_row.id
                SET package_row.package_status = 'available'
                WHERE link.shipping_order_item_id = ?
            ")->execute([(int)$item['id']]);
        }

        // 重新計算相關訂單品項的出貨統計
        $affectedOrderItemIds = array_unique(array_filter(array_column($items, 'order_item_id')));
        foreach ($affectedOrderItemIds as $oiId) {
            recalculateOrderItemShipping($pdo, (int)$oiId);
        }

        // 軟刪出貨單，保留出貨品項供追溯；列表透過 shipping_orders.deleted_at 排除。
        $stmt = $pdo->prepare("UPDATE shipping_orders SET deleted_at = NOW(), delete_token = id WHERE id = ? AND deleted_at IS NULL");
        $stmt->execute([$id]);

        // 軟刪後以仍有效的待出貨單重算，消除歷史增量配貨可能產生的漂移。
        foreach (array_unique(array_filter(array_map('intval', array_column($items, 'inventory_item_id')))) as $inventoryItemId) {
            recalculateInventoryAllocation($pdo, $inventoryItemId);
            recalculateInventoryStatus($pdo, $inventoryItemId);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '出貨單已刪除，相關品項已保留供追溯。'
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log('Shipping order delete failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')
    ], 500);
}
