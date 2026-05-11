<?php
/**
 * 訂單品項 API - 單筆查詢
 *
 * 取得指定品項的完整資料，包含載具、篩分服務、圖面、附件等關聯資料。
 *
 * @endpoint GET /api/order_items/show.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明       |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 訂單品項 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "order_id": 10,
 *     "screening_item": {
 *       "id": 5,
 *       "item_number": "SI-001",
 *       "name": "M3x10",
 *       "weight_per_unit_g": 0.25
 *     },
 *     "total_weight_kg": 50.00,
 *     "total_units": 12500,
 *     "total_price": 1875.00,
 *     "unit_price_per_thousand": 150.00,
 *     "status": "pending",
 *     "status_label": "待處理",
 *     "has_work_order": true,
 *     "work_order_number": "WO-20250115-0001",
 *     "tools": [...],
 *     "screening_details": [...],
 *     "drawings": [...],
 *     "attachments": [...],
 *     "totals": {
 *       "tool_weight_kg": 5.00,
 *       "net_weight_kg": 45.00,
 *       "service_unit_price_sum": 0.15
 *     }
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 訂單品項不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的客戶批號 ID。',
    ], 400);
}

$pdo = db();

$orderItem = findOrderItem($pdo, $id);
if (!$orderItem) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的客戶批號資料。',
    ], 404);
}

$toolsMap = getOrderItemTools($pdo, [$id]);
$detailsMap = getOrderItemScreeningDetails($pdo, [$id]);
$drawingsMap = getOrderItemDrawings($pdo, [$id]);
$attachmentsMap = getOrderItemAttachments($pdo, [$id]);

jsonResponse([
    'success' => true,
    'data' => transformOrderItem($orderItem, $toolsMap[$id] ?? [], $detailsMap[$id] ?? [], $drawingsMap[$id] ?? [], $attachmentsMap[$id] ?? []),
]);
