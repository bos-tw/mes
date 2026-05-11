<?php
/**
 * 庫存品項 API - 單筆查詢
 *
 * 取得指定庫存品項的完整資料，包含異動記錄。
 *
 * @endpoint GET /api/inventory_items/show.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 庫存品項 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "item": {
 *     "id": 1,
 *     "inventory_number": "INV-20250115-0001",
 *     "quantity_on_hand": 10000,
 *     "net_weight_kg": 45.00,
 *     "quality_status": "passed",
 *     ...
 *   },
 *   "transactions": [
 *     {"id": 1, "transaction_type": "inbound", "quantity": 12500, ...}
 *   ]
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 庫存品項不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

/**
 * Inventory Item Show API Endpoint
 *
 * GET - Get single inventory item details
 */

requireAuth();

$pdo = db();

requireMethod('GET');

$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
}

try {
    $item = getInventoryItemDetails($pdo, $id);

    if (!$item) {
        jsonResponse(['success' => false, 'message' => '庫存項目不存在。'], 404);
    }

    // Get inventory transaction history
    $transStmt = $pdo->prepare("
        SELECT
            it.*,
            e.name AS operator_name
        FROM inventory_transactions it
        LEFT JOIN employees e ON it.created_by_employee_id = e.id
        WHERE it.inventory_item_id = :inventory_item_id
        ORDER BY it.created_at DESC
        LIMIT 50
    ");
    $transStmt->execute(['inventory_item_id' => $id]);
    $transactions = $transStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'item' => $item,
        'transactions' => $transactions,
    ]);

} catch (Throwable $e) {
    error_log('Inventory item show failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '載入失敗，請稍後重試。')], 500);
}
