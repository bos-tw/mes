<?php
/**
 * 訂單管理 API - 單筆查詢
 *
 * @endpoint GET /api/orders/show.php?id={id}
 *
 * @auth 需要登入
 * @table orders
 * @related customers, order_items, lookup_values
 *
 * 查詢單一訂單的完整資料，可透過 include 參數包含關聯資料。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型   | 必填 | 說明                                           |
 * |---------|--------|------|-----------------------------------------------|
 * | id      | int    | 是   | 訂單 ID，必須 > 0 且資料存在                    |
 * | include | string | 否   | 包含關聯資料，多個以逗號分隔（可用值：customer, items）|
 *
 * @input include 可用值:
 * - customer: 包含完整客戶資訊（地址、電話、傳真等）
 * - items: 包含訂單明細（order_items）及其關聯的工具、篩選詳情、圖面、附件
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": {
 *         "id": 1,
 *         "order_number": "ORDER-20240101-0001",
 *         "customer": {
 *             "id": 1,
 *             "name": "測試客戶",
 *             "customer_number": "C001"
 *         },
 *         "order_date": "2024-01-01",
 *         "expected_delivery_date": "2024-01-15",
 *         "customer_po_number": "PO-2024-001",
 *         "status": "pending",
 *         "status_label": "待處理",
 *         "total_amount": 15000.00,
 *         "notes": "備註內容",
 *         "created_at": "2024-01-01 12:00:00",
 *         "updated_at": "2024-01-02 15:30:00",
 *         "deleted_at": null,
 *         // include=customer 時追加
 *         "customer": {
 *             "id": 1,
 *             "name": "測試客戶",
 *             "customer_number": "C001",
 *             "address": "台北市...",
 *             "phone": "02-12345678",
 *             "fax": "02-12345679",
 *             "email": "test@example.com",
 *             "contact_person": "王小明",
 *             "is_active": true
 *         },
 *         // include=items 時追加
 *         "items": [
 *             {
 *                 "id": 1,
 *                 "customer_lot_number": "LOT-001",
 *                 "product_name": "M8x20 螺絲",
 *                 ...
 *             }
 *         ]
 *     }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                    |
 * |------------|------------------|----------------------------|
 * | 400        | id 參數無效       | "請提供有效的訂單 ID。"     |
 * | 401        | 未登入           | "尚未登入或登入已過期。"    |
 * | 404        | 訂單不存在或已刪除 | "找不到對應的訂單資料。"   |
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
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();
$order = findOrder($pdo, (int)$id);

if (!$order) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單資料。',
    ], 404);
}

// 檢查是否需要包含額外資料（用於列印等場景）
$include = isset($_GET['include']) ? explode(',', $_GET['include']) : [];

$responseData = transformOrder($order);

// 包含完整客戶資訊
if (in_array('customer', $include, true) && !empty($order['customer_id'])) {
    $customerStmt = $pdo->prepare(
        'SELECT id, name, customer_number, address, phone, fax, email, contact_person, is_active,
                minimum_order_amount, weight_tolerance_percentage
         FROM customers WHERE id = :id AND deleted_at IS NULL'
    );
    $customerStmt->execute(['id' => $order['customer_id']]);
    $customerRow = $customerStmt->fetch();

    if ($customerRow) {
        $responseData['customer'] = [
            'id' => (int)$customerRow['id'],
            'name' => $customerRow['name'],
            'customer_number' => $customerRow['customer_number'],
            'address' => $customerRow['address'],
            'phone' => $customerRow['phone'],
            'fax' => $customerRow['fax'],
            'email' => $customerRow['email'],
            'contact_person' => $customerRow['contact_person'],
            'is_active' => (bool)$customerRow['is_active'],
            'minimum_order_amount' => $customerRow['minimum_order_amount'] !== null ? (float)$customerRow['minimum_order_amount'] : null,
            'weight_tolerance_percentage' => $customerRow['weight_tolerance_percentage'] !== null ? (float)$customerRow['weight_tolerance_percentage'] : 3.0,
        ];
    }
}

// 包含訂單明細 (order_items)
if (in_array('items', $include, true)) {
    require_once __DIR__ . '/../order_items/helpers.php';

    $rows = findOrderItemsByOrder($pdo, (int)$id);
    $orderItemIds = array_map(static fn(array $row): int => (int)$row['id'], $rows);

    $toolsMap = getOrderItemTools($pdo, $orderItemIds);
    $detailsMap = getOrderItemScreeningDetails($pdo, $orderItemIds);
    $drawingsMap = getOrderItemDrawings($pdo, $orderItemIds);
    $attachmentsMap = getOrderItemAttachments($pdo, $orderItemIds);

    $items = array_map(
        static function (array $row) use ($toolsMap, $detailsMap, $drawingsMap, $attachmentsMap): array {
            $itemId = (int)$row['id'];
            $tools = $toolsMap[$itemId] ?? [];
            $details = $detailsMap[$itemId] ?? [];
            $drawings = $drawingsMap[$itemId] ?? [];
            $attachments = $attachmentsMap[$itemId] ?? [];
            return transformOrderItem($row, $tools, $details, $drawings, $attachments);
        },
        $rows
    );

    $responseData['items'] = $items;
}

jsonResponse([
    'success' => true,
    'data' => $responseData,
]);