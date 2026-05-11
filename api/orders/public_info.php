<?php
/**
 * 訂單公開資訊 API（供列印頁面使用）
 *
 * 此 API 不需要登入認證，僅回傳訂單基本公開資訊。
 *
 * @endpoint GET /api/orders/public_info.php?id={id}
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// 此 API 不需要登入認證，但限制 HTTP 方法
requireMethod('GET');

// 防止被嵌入 iframe
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();

$stmt = $pdo->prepare('
    SELECT id, order_number, order_date, expected_delivery_date, customer_id, status, total_amount, final_quote_per_m, single_ppm, notes
    FROM orders
    WHERE id = ? AND deleted_at IS NULL
');
$stmt->execute([$id]);

$order = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$order) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的訂單。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => [
        'id' => (int)$order['id'],
        'order_number' => $order['order_number'],
        'order_date' => $order['order_date'],
        'expected_delivery_date' => $order['expected_delivery_date'],
        'customer_id' => (int)$order['customer_id'],
        'status' => $order['status'],
        'total_amount' => $order['total_amount'] !== null ? (float)$order['total_amount'] : null,
        'final_quote_per_m' => $order['final_quote_per_m'] !== null ? (float)$order['final_quote_per_m'] : null,
        'single_ppm' => $order['single_ppm'] !== null ? (int)$order['single_ppm'] : null,
        'notes' => $order['notes'],
    ],
]);
