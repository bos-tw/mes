<?php
/**
 * 出貨單 API - 取得可退貨品項
 *
 * 查詢指定出貨單的所有品項，計算可退貨數量（已出貨數量 - 已退貨數量）
 *
 * @endpoint GET /api/shipping_orders/get_returnable_items.php?shipping_order_id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數               | 類型 | 必填 | 說明        |
 * |-------------------|------|-----|------------|
 * | shipping_order_id | int  | 是  | 出貨單 ID   |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "shipping_order": {
 *     "id": 1,
 *     "shipping_order_number": "SO-20260205-0001",
 *     "customer_name": "測試客戶"
 *   },
 *   "items": [{
 *     "shipping_order_item_id": 1,
 *     "inventory_number": "INV-001",
 *     "screening_item_name": "螺絲 M3x10",
 *     "shipped_quantity": 1000,
 *     "shipped_unit": "pcs",
 *     "total_returned": 200,
 *     "returnable_quantity": 800
 *   }]
 * }
 * ```
 *
 * @error 400 參數錯誤
 * @error 404 出貨單不存在
 *
 * @note
 * - 只回傳可退數量 > 0 的品項
 * - total_returned: 該品項已累計退貨數量
 * - returnable_quantity: 可退貨數量 = shipped_quantity - total_returned
 *
 * @version 1.0.0
 * @since 2026-02-05
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('GET');

$shippingOrderId = $_GET['shipping_order_id'] ?? null;

if (!$shippingOrderId || !is_numeric($shippingOrderId)) {
    jsonResponse(['success' => false, 'message' => '請提供有效的出貨單 ID。'], 400);
}

$shippingOrderId = (int)$shippingOrderId;

$pdo = db();

try {
    // 檢查出貨單是否存在
    $orderSql = "
        SELECT
            so.id,
            so.shipping_order_number,
            so.status,
            so.return_status,
            c.name AS customer_name,
            c.customer_number
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.id = :id AND so.deleted_at IS NULL
    ";

    $orderStmt = $pdo->prepare($orderSql);
    $orderStmt->execute(['id' => $shippingOrderId]);
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['success' => false, 'message' => '找不到出貨單。'], 404);
    }

    // 查詢可退貨品項
    $itemsSql = "
        SELECT
            soi.id AS shipping_order_item_id,
            soi.shipped_quantity,
            soi.shipped_unit,
            ii.inventory_number,
            ii.receipt_type,
            ii.customer_batch_number,
            ii.internal_lot_number,
            ii.net_weight_kg,
            si.name AS screening_item_name,
            si.item_number AS screening_item_number,
            si.specification,
            wo.work_order_number,
            wopr.receipt_number AS partial_receipt_number,
            wopr.shipping_tool_details AS partial_receipt_shipping_tool_details,
            CASE
                WHEN wopr.id IS NULL THEN NULL
                WHEN wopr.machine_run_id IS NULL THEN '一般工單'
                WHEN COALESCE(wopr_run.run_label, '') <> '' THEN wopr_run.run_label
                WHEN COALESCE(wopr_machine.name, '') <> '' THEN wopr_machine.name
                ELSE '拆分機台'
            END AS partial_receipt_source_label,
            oi.sub_item_number,
            oi.part_number,
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
        LEFT JOIN inventory_items ii ON soi.inventory_item_id = ii.id
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        LEFT JOIN work_orders wo ON ii.work_order_id = wo.id
        LEFT JOIN work_order_partial_receipts wopr ON wopr.inventory_item_id = ii.id
        LEFT JOIN work_order_machine_runs wopr_run ON wopr_run.id = wopr.machine_run_id
        LEFT JOIN machines wopr_machine ON wopr_machine.id = wopr_run.machine_id
        LEFT JOIN order_items oi ON soi.order_item_id = oi.id
        WHERE soi.shipping_order_id = :shipping_order_id
        HAVING returnable_quantity > 0
        ORDER BY soi.id ASC
    ";

    $itemsStmt = $pdo->prepare($itemsSql);
    $itemsStmt->execute(['shipping_order_id' => $shippingOrderId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 格式化數值
    foreach ($items as &$item) {
        $item['shipped_quantity'] = (float)$item['shipped_quantity'];
        $item['total_returned'] = (float)$item['total_returned'];
        $item['returnable_quantity'] = (float)$item['returnable_quantity'];
        $item['net_weight_kg'] = $item['net_weight_kg'] ? (float)$item['net_weight_kg'] : null;
    }
    unset($item);

    jsonResponse([
        'success' => true,
        'shipping_order' => [
            'id' => (int)$order['id'],
            'shipping_order_number' => $order['shipping_order_number'],
            'customer_name' => $order['customer_name'],
            'customer_number' => $order['customer_number'],
            'status' => $order['status'],
            'return_status' => $order['return_status'],
        ],
        'items' => $items,
        'item_count' => count($items),
    ]);

} catch (Exception $e) {
    error_log('Get returnable items error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '查詢失敗，請稍後重試。')], 500);
}
