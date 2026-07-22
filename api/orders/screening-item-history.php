<?php
/**
 * 訂單管理 API - 同客戶歷史受篩產品
 *
 * @endpoint GET /api/orders/screening-item-history.php?order_id={id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

$orderId = filter_input(INPUT_GET, 'order_id', FILTER_VALIDATE_INT);
if (!$orderId || $orderId <= 0) {
    jsonResponse(['success' => false, 'message' => '請提供有效的訂單 ID。'], 400);
}

$history = findCustomerScreeningItemHistory(db(), $orderId);
if ($history === null) {
    jsonResponse(['success' => false, 'message' => '找不到對應的訂單資料。'], 404);
}

jsonResponse(['success' => true, 'data' => $history]);
