<?php
/**
 * 退貨品項 API - 單筆查詢端點
 *
 * 取得單一退貨品項的詳細資料。
 *
 * @endpoint GET /api/return_order_items/show.php?id={id}
 *
 * @auth 必須登入
 * @table return_order_items, return_orders, shipping_order_items
 *
 * @input GET (Query string)
 * | 參數 | 類型 | 必填 | 說明        |
 * |------|------|------|-------------|
 * | id   | int  | Y    | 退貨品項 ID |
 *
 * @output 成功回應 (200)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "return_order_id": 1,
 *     "return_order_number": "RO20240101001",
 *     "order_item_id": 1,
 *     "sub_item_number": "001",
 *     "part_number": "PN001",
 *     "customer_batch_number": "CB001",
 *     "screening_item_name": "篩選品項A",
 *     "returned_quantity": 100.00,
 *     "returned_unit": "支",
 *     "return_reason": "品質問題",
 *     "notes": null,
 *     "created_at": "2024-01-01 00:00:00",
 *     "updated_at": "2024-01-01 00:00:00"
 *   }
 * }
 * ```
 *
 * @error 400 無效的 ID
 * @error 404 找不到指定的退貨品項
 * @error 405 不支援的請求方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的退貨品項 ID。',
    ], 400);
}

$pdo = db();
$row = findReturnOrderItem($pdo, $id);

if (!$row) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的退貨品項。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformReturnOrderItem($row),
]);
