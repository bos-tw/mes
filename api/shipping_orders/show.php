<?php
/**
 * 出貨單 API - 單筆查詢
 *
 * 取得指定出貨單的完整資料，包含出貨項目明細。
 *
 * @endpoint GET /api/shipping_orders/show.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 出貨單 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "shipping_order_number": "SO-20250115-0001",
 *     "customer_name": "測試客戶",
 *     "status": "draft",
 *     "items": [{
 *       "id": 1,
 *       "inventory_number": "INV-20250115-0001",
 *       "shipped_quantity": 5000
 *     }]
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 出貨單不存在
 */
declare(strict_types=1);

/**
 * Shipping Orders API - Show single order with items
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
requireAuth();

requireMethod('GET');

$id = $_GET['id'] ?? null;

if (!$id) {
    jsonResponse(['success' => false, 'message' => '請提供出貨單 ID。'], 400);
}

$pdo = db();

try {
    // Get shipping order
    $sql = "
        SELECT
            so.*,
            c.name AS customer_name,
            c.address AS customer_address,
            c.contact_person AS customer_contact,
            c.phone AS customer_phone,
            o.order_number,
            lv.value_label AS status_label
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN orders o ON so.order_id = o.id
        LEFT JOIN lookup_values lv ON so.status = lv.value_key
            AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'shipping_status')
        WHERE so.id = :id AND so.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['success' => false, 'message' => '找不到出貨單。'], 404);
    }

    // Get shipping order items with return quantities
    $itemsSql = "
        SELECT
            soi.*,
            ii.inventory_number,
            ii.receipt_type,
            ii.customer_batch_number,
            ii.internal_lot_number,
            ii.quantity_on_hand,
            ii.net_weight_kg,
            ii.gross_weight_kg,
            ii.total_defect_units,
            ii.weight_per_unit_g,
            ii.tool_statistics,
            ii.total_tool_quantity,
            ii.quality_status,
            si.name AS screening_item_name,
            si.item_number AS screening_item_number,
            wo.work_order_number,
            wopr.receipt_number AS partial_receipt_number,
            wopr.receipt_status AS partial_receipt_status,
            wopr.shipping_tool_details AS partial_receipt_shipping_tool_details,
            CASE
                WHEN wopr.id IS NULL THEN NULL
                WHEN wopr.machine_run_id IS NULL THEN '一般工單'
                WHEN COALESCE(wopr_run.run_label, '') <> '' THEN wopr_run.run_label
                WHEN COALESCE(wopr_machine.name, '') <> '' THEN wopr_machine.name
                ELSE '拆分機台'
            END AS partial_receipt_source_label,
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
        WHERE soi.shipping_order_id = :shipping_order_id
        ORDER BY soi.id ASC
    ";

    $itemsStmt = $pdo->prepare($itemsSql);
    $itemsStmt->execute(['shipping_order_id' => $id]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    $order['items'] = $items;

    // Calculate totals
    $totalQuantity = 0;
    $totalWeight = 0;
    $totalReturned = 0;
    foreach ($items as $item) {
        $totalQuantity += (float)$item['shipped_quantity'];
        $totalWeight += (float)$item['net_weight_kg'];
        $totalReturned += (float)$item['total_returned'];
    }
    $order['total_quantity'] = $totalQuantity;
    $order['total_weight_kg'] = $totalWeight;
    $order['item_count'] = count($items);
    $order['total_returned'] = $totalReturned;
    $order['has_returns'] = ($totalReturned > 0);

    // Get related return orders if any
    $returnOrdersSql = "
        SELECT
            ro.id,
            ro.return_order_number,
            ro.return_date,
            ro.processing_status,
            COALESCE(SUM(roi.returned_quantity), 0) AS total_quantity
        FROM return_orders ro
        LEFT JOIN return_order_items roi ON roi.return_order_id = ro.id
        WHERE ro.original_shipping_order_id = :shipping_order_id
          AND ro.deleted_at IS NULL
        GROUP BY ro.id
        ORDER BY ro.return_date DESC, ro.id DESC
    ";
    $returnOrdersStmt = $pdo->prepare($returnOrdersSql);
    $returnOrdersStmt->execute(['shipping_order_id' => $id]);
    $returnOrders = $returnOrdersStmt->fetchAll(PDO::FETCH_ASSOC);
    $order['return_orders'] = $returnOrders;
    $defectSummary = fetchShippingOrderDefectSummary($pdo, (int)$id);
    $toolSummaries = fetchShippingOrderToolSummaries($pdo, (int)$id);
    $summarySuggestions = fetchShippingOrderSummarySuggestions($pdo, (int)$id);
    $effectiveDefectSummary = $defectSummary ?: ($summarySuggestions['defect_summary'] ?? null);
    $effectiveToolSummaries = $toolSummaries !== [] ? $toolSummaries : ($summarySuggestions['tool_summaries'] ?? []);

    $order['shipment_purpose'] = $order['shipment_purpose'] ?? 'normal';
    $order['defect_summary'] = $effectiveDefectSummary;
    $order['tool_summaries'] = $effectiveToolSummaries;
    $order['defect_quantity'] = $effectiveDefectSummary['defect_quantity'] ?? null;
    $order['defect_weight_per_unit_g'] = $effectiveDefectSummary['weight_per_unit_g'] ?? null;
    $order['defect_total_weight_kg'] = $effectiveDefectSummary['total_weight_kg'] ?? null;
    $order['defect_notes'] = $effectiveDefectSummary['notes'] ?? null;
    $order['defect_source_shipping_order_id'] = $effectiveDefectSummary['source_shipping_order_id'] ?? null;
    $order['defect_source_work_order_id'] = $effectiveDefectSummary['source_work_order_id'] ?? null;
    $order['defect_source_inventory_item_id'] = $effectiveDefectSummary['source_inventory_item_id'] ?? null;

    jsonResponse([
        'success' => true,
        'order' => $order,
        'items' => $items,
        'defect_summary' => $effectiveDefectSummary,
        'tool_summaries' => $effectiveToolSummaries,
        'suggested_defect_summary' => $summarySuggestions['defect_summary'],
        'suggested_tool_summaries' => $summarySuggestions['tool_summaries'],
    ]);

} catch (Exception $e) {
    error_log('Show shipping order error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '查詢失敗，請稍後重試。')], 500);
}
