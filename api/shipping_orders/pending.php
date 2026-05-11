<?php
/**
 * 出貨單 API - 待處理出貨單列表
 *
 * 取得指定客戶的草稿狀態出貨單，用於從庫存加入出貨項目。
 *
 * @endpoint GET /api/shipping_orders/pending.php?customer_id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數        | 類型 | 必填 | 說明   |
 * |-------------|------|-----|-------|
 * | customer_id | int  | 是  | 客戶 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "shipping_order_number": "SO-20250115-0001",
 *     "status": "draft",
 *     "item_count": 3,
 *     "total_quantity": 15000
 *   }]
 * }
 * ```
 *
 * @note 只回傳 status = 'draft' 的出貨單
 */
declare(strict_types=1);

/**
 * Shipping Orders API - Get pending shipping orders for a customer
 * 取得客戶的待處理出貨單（用於選擇加入）
 */

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

requireMethod('GET');

$customerId = $_GET['customer_id'] ?? null;

if (!$customerId) {
    jsonResponse(['success' => false, 'message' => '請提供客戶 ID。'], 400);
}

$pdo = db();

try {
    $sql = "
        SELECT
            so.id,
            so.shipping_order_number,
            so.shipping_date,
            so.status,
            so.consignee_name,
            so.notes,
            so.created_at,
            c.name AS customer_name,
            (SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS item_count,
            (SELECT SUM(soi.shipped_quantity) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS total_quantity
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.customer_id = :customer_id
          AND so.status = 'draft'
          AND so.deleted_at IS NULL
        ORDER BY so.created_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['customer_id' => $customerId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $orders,
    ]);

} catch (Exception $e) {
    error_log('Get pending shipping orders error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '查詢失敗，請稍後重試。')], 500);
}
