<?php
/**
 * 退貨單 API - 單筆查詢
 *
 * @endpoint GET /api/return_orders/show.php?id={id}
 *
 * @auth 必須登入
 * @table return_orders, return_order_items
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明          |
 * |---------|------|------|---------------|
 * | id      | int  | 是   | 退貨單 ID     |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": {
 *         "id": 1,
 *         "return_order_number": "RO-20260122-0001",
 *         "customer_name": "...",
 *         "items": [...]
 *     }
 * }
 *
 * @error 400 缺少 id
 * @error 404 找不到退貨單
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數: id。'], 400);
}

$pdo = db();

$order = getReturnOrderDetails($pdo, $id);

if (!$order) {
    jsonResponse(['success' => false, 'message' => '找不到指定的退貨單。'], 404);
}

// 取得退貨品項
$order['items'] = getReturnOrderItems($pdo, $id);

jsonResponse([
    'success' => true,
    'data' => $order,
]);
