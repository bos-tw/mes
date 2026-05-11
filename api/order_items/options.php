<?php
/**
 * 訂單品項 API - 選項資料
 *
 * 提供訂單品項表單所需的下拉選項資料。
 *
 * @endpoint GET /api/order_items/options.php?mode={string}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型   | 必填 | 預設    | 說明                      |
 * |------|--------|-----|---------|---------------------------|
 * | mode | string | 否  | options | 模式: options / order_items_list |
 *
 * @output mode=options (預設):
 * ```json
 * {
 *   "success": true,
 *   "screening_items": [{"id": 1, "item_number": "SI-001", "name": "M3x10", "weight_per_unit_g": 0.25}],
 *   "tools": [{"id": 1, "tool_number": "T-001", "name": "贉具A", "weight_kg": 2.5}],
 *   "screening_services": [{"id": 1, "name": "全檢", "default_price_per_unit": 0.05}],
 *   "customer_sample_statuses": [{"value": "pending", "label": "待確認"}],
 *   "statuses": [{"value": "processing", "label": "處理中"}]
 * }
 * ```
 *
 * @output mode=order_items_list (工單用):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "order_id": 10,
 *     "order_number": "ORDER-20250115-0001",
 *     "screening_item_name": "SI-001 - M3x10",
 *     "total_weight_kg": 50.00,
 *     "expected_delivery_date": "2025-01-30"
 *   }],
 *   "count": 1
 * }
 * ```
 *
 * @see fetchOrderItemOptions() helpers.php 中的選項查詢函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

// 檢查是否要取得客戶批號列表 (用於工單下拉選單)
$mode = $_GET['mode'] ?? 'options';

requireMethod('GET');

$pdo = db();

if ($mode === 'order_items_list') {
    // 取得客戶批號列表,用於工單的客戶批號下拉選單
    try {
        $stmt = $pdo->prepare("
            SELECT
                oi.id,
                oi.order_id,
                o.order_number,
                o.expected_delivery_date,
                si.item_number AS screening_item_number,
                si.name AS screening_item_name,
                oi.total_weight_kg,
                oi.total_units
            FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            LEFT JOIN screening_items si ON oi.screening_item_id = si.id
            WHERE o.deleted_at IS NULL
            ORDER BY o.order_number DESC, oi.id ASC
        ");

        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 格式化資料
        $orderItems = array_map(function($item) {
            $screeningName = $item['screening_item_name'] ?? '未設定';
            if ($item['screening_item_number']) {
                $screeningName = $item['screening_item_number'] . ' - ' . $screeningName;
            }

            return [
                'id' => (int)$item['id'],
                'order_id' => (int)$item['order_id'],
                'order_number' => $item['order_number'],
                'screening_item_name' => $screeningName,
                'total_weight_kg' => $item['total_weight_kg'] ? (float)$item['total_weight_kg'] : null,
                'total_units' => $item['total_units'] ? (int)$item['total_units'] : null,
                'expected_delivery_date' => $item['expected_delivery_date']
            ];
        }, $items);

        jsonResponse([
            'success' => true,
            'data' => $orderItems,
            'count' => count($orderItems)
        ]);

    } catch (Exception $e) {
        error_log('Order Items List API Error: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => safeErrorMessage($e, '載入客戶批號列表失敗，請稍後重試。')
        ], 500);
    }
} else {
    // 原有的 options 模式
    $options = fetchOrderItemOptions($pdo);

    jsonResponse([
        'success' => true,
        'data' => $options,
    ]);
}

