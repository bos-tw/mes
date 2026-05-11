<?php
/**
 * 客戶公開資訊 API（供列印頁面使用）
 *
 * 此 API 不需要登入認證，僅回傳客戶基本公開資訊。
 *
 * @endpoint GET /api/customers/public_info.php?id={id}
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
        'message' => '請提供有效的客戶 ID。',
    ], 400);
}

$pdo = db();

$stmt = $pdo->prepare('
    SELECT id, name, address, shipping_address, phone, fax, contact_person, email, tax_id
    FROM customers
    WHERE id = ? AND deleted_at IS NULL
');
$stmt->execute([$id]);

$customer = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$customer) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的客戶。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => [
        'id' => (int)$customer['id'],
        'name' => $customer['name'],
        'address' => $customer['address'],
        'shipping_address' => $customer['shipping_address'],
        'phone' => $customer['phone'],
        'fax' => $customer['fax'],
        'contact_person' => $customer['contact_person'],
        'email' => $customer['email'],
        'tax_id' => $customer['tax_id'],
    ],
]);
