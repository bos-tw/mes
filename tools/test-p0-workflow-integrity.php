<?php
/**
 * P0 權限、出貨狀態機與退貨品項完整性回歸測試。
 *
 * 所有資料庫驗證均在交易內執行並強制回滾，不留下測試資料。
 */
declare(strict_types=1);

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/shipping_orders/helpers.php';
require_once __DIR__ . '/../api/return_orders/helpers.php';
require_once __DIR__ . '/../api/return_order_items/helpers.php';

$assertions = 0;

function assertP0(bool $condition, string $message): void
{
    global $assertions;
    $assertions++;
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

assertP0(
    resolveAutomaticPermissionContext('/mes/api/orders/index.php', 'GET') === ['module' => 'orders', 'action' => 'read'],
    'GET 必須解析為 read 權限。'
);
assertP0(!isAutomaticPermissionGranted([], 'orders', 'read'), '空權限不得讀取業務模組。');
assertP0(!isAutomaticPermissionGranted([], 'orders', 'create'), '空權限不得寫入業務模組。');
assertP0(!isAutomaticPermissionGranted([], 'dashboard', 'read'), '空權限不得讀取儀表板業務資料。');
assertP0(isAutomaticPermissionGranted(['orders.read'], 'dashboard', 'read'), '具業務權限帳號必須可讀取共用儀表板。');
assertP0(!isAutomaticPermissionGranted(['boss'], 'orders', 'read'), '有角色但無模組權限仍不得讀取。');
assertP0(isAutomaticPermissionGranted(['orders.read'], 'orders', 'read'), '唯讀權限必須可讀取。');
assertP0(!isAutomaticPermissionGranted(['orders.read'], 'orders', 'edit'), '唯讀權限不得編輯。');
assertP0(isAutomaticPermissionGranted(['orders.edit'], 'orders', 'edit'), '編輯權限必須可編輯。');
assertP0(!isAutomaticPermissionGranted(['orders.edit'], 'orders', 'delete'), '編輯權限不得刪除。');
assertP0(isAutomaticPermissionGranted(['訂單主表管理'], 'orders', 'read'), '舊中文權限必須可讀取對應模組。');
assertP0(isAutomaticPermissionGranted(['訂單主表管理'], 'orders', 'delete'), '管理員舊權限必須涵蓋模組操作。');
assertP0(isAutomaticPermissionGranted(['退貨單'], 'shipping_orders', 'read'), '退貨流程必須可唯讀原出貨單。');
assertP0(!isAutomaticPermissionGranted(['退貨單'], 'shipping_orders', 'edit'), '相依權限不得擴張為寫入權限。');
assertP0(isAutomaticPermissionGranted([], 'lookup_values', 'read'), '登入使用者必須可讀取共用代碼表。');

assertP0(canTransitionShippingOrderStatus('draft', 'confirmed'), '草稿必須可確認。');
assertP0(canTransitionShippingOrderStatus('packed', 'shipped'), '已包裝必須可出貨。');
assertP0(canTransitionShippingOrderStatus('shipped', 'cancelled'), '已出貨必須可取消並回沖。');
assertP0(!canTransitionShippingOrderStatus('draft', 'shipped'), '草稿不得跳過流程直接出貨。');
assertP0(!canTransitionShippingOrderStatus('shipped', 'draft'), '已出貨不得退回草稿。');
assertP0(!canTransitionShippingOrderStatus('delivered', 'cancelled'), '已送達必須走退貨流程，不得直接取消。');
assertP0(getAllowedShippingOrderTransitions('cancelled') === [], '已取消必須是終態。');
assertP0(getShippingOrderInventoryEffect('packed', 'shipped') === 'ship', '正常出貨必須產生一次扣庫作用。');
assertP0(getShippingOrderInventoryEffect('shipped', 'cancelled') === 'reverse_shipment', '取消出貨必須產生一次回沖作用。');
assertP0(getShippingOrderInventoryEffect('shipped', 'shipped') === 'none', '重複送出相同狀態不得重複扣庫。');
assertP0(canTransitionReturnOrderStatus('pending', 'processing'), '待處理退貨單必須可進入處理中。');
assertP0(canTransitionReturnOrderStatus('processing', 'completed'), '處理中退貨單必須可完成。');
assertP0(!canTransitionReturnOrderStatus('pending', 'completed'), '待處理退貨單不得跳過處理直接完成。');
assertP0(!canTransitionReturnOrderStatus('completed', 'pending'), '已完成退貨單不得重新開啟後修改品項。');

$pdo = db();
$columns = $pdo->query('DESCRIBE return_order_items')->fetchAll(PDO::FETCH_COLUMN);
assertP0(in_array('shipping_order_item_id', $columns, true), '退貨品項必須使用 shipping_order_item_id。');
assertP0(!in_array('order_item_id', $columns, true), '退貨品項不得依賴不存在的 order_item_id。');

$fixtureStmt = $pdo->query("
    SELECT
        roi.id AS return_order_item_id,
        roi.return_order_id,
        roi.shipping_order_item_id,
        soi.shipping_order_id,
        soi.inventory_item_id,
        soi.shipped_quantity,
        so.status AS original_shipping_status
    FROM return_order_items roi
    INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
    INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
    INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id AND so.deleted_at IS NULL
    WHERE ro.processing_status IN ('pending', 'processing')
    ORDER BY roi.id
    LIMIT 1
");
$fixture = $fixtureStmt->fetch(PDO::FETCH_ASSOC);

if ($fixture) {
    $pdo->beginTransaction();
    try {
        $shippedQuantity = (float)$fixture['shipped_quantity'];
        $existingQuantity = max(0.01, round($shippedQuantity / 4, 2));
        $newQuantity = max(0.01, round($shippedQuantity / 4, 2));

        $pdo->prepare("UPDATE shipping_orders SET status = 'shipped' WHERE id = ?")
            ->execute([(int)$fixture['shipping_order_id']]);
        $pdo->prepare('UPDATE return_order_items SET returned_quantity = ? WHERE id = ?')
            ->execute([$existingQuantity, (int)$fixture['return_order_item_id']]);

        $valid = validateReturnOrderItemBusinessRules(
            $pdo,
            (int)$fixture['return_order_id'],
            (int)$fixture['shipping_order_item_id'],
            $newQuantity
        );
        assertP0($valid['errors'] === [], '合法累計退貨數量應通過驗證。');

        $invalid = validateReturnOrderItemBusinessRules(
            $pdo,
            (int)$fixture['return_order_id'],
            (int)$fixture['shipping_order_item_id'],
            $shippedQuantity
        );
        assertP0(isset($invalid['errors']['returned_quantity']), '超退必須被拒絕。');

        $status = recalculateShippingOrderReturnStatus($pdo, (int)$fixture['shipping_order_id']);
        assertP0($status['return_status'] === 'partial', '部分退貨必須同步為 partial。');

        if ((int)$fixture['inventory_item_id'] > 0) {
            $expectedStmt = $pdo->prepare("
                SELECT COALESCE(SUM(soi.shipped_quantity), 0)
                FROM shipping_order_items soi
                INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id
                WHERE soi.inventory_item_id = ?
                  AND so.deleted_at IS NULL
                  AND so.status IN ('draft', 'confirmed', 'preparing', 'packed')
            ");
            $expectedStmt->execute([(int)$fixture['inventory_item_id']]);
            $expectedAllocation = (float)$expectedStmt->fetchColumn();
            $actualAllocation = recalculateInventoryAllocation($pdo, (int)$fixture['inventory_item_id']);
            assertP0(abs($actualAllocation - $expectedAllocation) < 0.00001, '配貨量必須由有效待出貨品項重算。');
        }
    } finally {
        $pdo->rollBack();
    }
}

echo "P0 workflow integrity tests passed: {$assertions} assertions.\n";
