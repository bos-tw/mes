<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的客戶 ID。',
    ], 400);
}

try {
    $pdo = db();

    // 檢查客戶是否存在
    $checkStmt = $pdo->prepare("SELECT id, customer_number, name FROM customers WHERE id = :id AND deleted_at IS NULL");
    $checkStmt->execute([':id' => $id]);
    $customer = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$customer) {
        jsonResponse([
            'success' => false,
            'message' => '找不到該客戶資料。',
        ], 404);
    }

    // 查詢關聯的訂單數量
    $orderStmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE customer_id = :id AND deleted_at IS NULL");
    $orderStmt->execute([':id' => $id]);
    $orderCount = (int)$orderStmt->fetchColumn();

    // 查詢關聯的工單數量（透過訂單關聯）
    $workOrderStmt = $pdo->prepare("
        SELECT COUNT(DISTINCT wo.id)
        FROM work_orders wo
        INNER JOIN order_items oi ON wo.order_item_id = oi.id
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = :id
        AND wo.deleted_at IS NULL
        AND o.deleted_at IS NULL
    ");
    $workOrderStmt->execute([':id' => $id]);
    $workOrderCount = (int)$workOrderStmt->fetchColumn();

    // 查詢關聯的訂單品項數量
    $orderItemStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = :id
        AND o.deleted_at IS NULL
    ");
    $orderItemStmt->execute([':id' => $id]);
    $orderItemCount = (int)$orderItemStmt->fetchColumn();

    // 查詢關聯的庫存品項數量
    $inventoryStmt = $pdo->prepare("SELECT COUNT(*) FROM inventory_items WHERE customer_id = :id AND deleted_at IS NULL");
    $inventoryStmt->execute([':id' => $id]);
    $inventoryCount = (int)$inventoryStmt->fetchColumn();

    jsonResponse([
        'success' => true,
        'data' => [
            'customer' => $customer,
            'stats' => [
                'orders' => $orderCount,
                'order_items' => $orderItemCount,
                'work_orders' => $workOrderCount,
                'inventory_items' => $inventoryCount,
            ],
            'has_related_data' => ($orderCount + $workOrderCount + $inventoryCount) > 0,
        ],
    ]);
} catch (Exception $e) {
    error_log('Customer stats error: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '查詢關聯資料時發生錯誤。',
    ], 500);
}
