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
    SELECT
        o.id,
        o.order_number,
        o.order_date,
        o.expected_delivery_date,
        o.expected_delivery_period,
        o.customer_po_number,
        o.customer_id,
        o.status,
        o.total_amount,
        o.final_quote_per_m,
        o.single_ppm,
        o.notes,
        c.minimum_order_amount AS customer_minimum_order_amount
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id AND c.deleted_at IS NULL
    WHERE o.id = ? AND o.deleted_at IS NULL
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
        'expected_delivery_period' => $order['expected_delivery_period'],
        'customer_po_number' => $order['customer_po_number'],
        'customer_id' => (int)$order['customer_id'],
        'status' => $order['status'],
        'total_amount' => $order['total_amount'] !== null ? (float)$order['total_amount'] : null,
        'customer_minimum_order_amount' => $order['customer_minimum_order_amount'] !== null ? (float)$order['customer_minimum_order_amount'] : null,
        'final_quote_per_m' => $order['final_quote_per_m'] !== null ? (float)$order['final_quote_per_m'] : null,
        'single_ppm' => $order['single_ppm'] !== null ? (int)$order['single_ppm'] : null,
        'notes' => $order['notes'],
    ],
]);
