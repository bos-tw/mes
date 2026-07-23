<?php
/**
 * 出貨單 API - 加入庫存項目
 *
 * 從庫存品項加入出貨單，可加入現有出貨單或建立新出貨單。
 *
 * @endpoint POST /api/shipping_orders/add_item.php
 *
 * @auth 必須登入
 *
 * @input JSON Body:
 * | 參數              | 類型   | 必填 | 說明                        |
 * |-------------------|--------|-----|-----------------------------|
 * | inventory_item_id | int    | 是  | 庫存品項 ID                  |
 * | shipping_order_id | int    | 否  | 現有出貨單 ID               |
 * | create_new        | bool   | 否  | 是否建立新出貨單             |
 * | shipped_quantity  | int    | 否  | 出貨數量                    |
 * | shipped_unit      | string | 否  | 單位 (預設: "支")           |
 *
 * @logic 加入流程:
 * 1. 驗證庫存品項存在且可出貨
 * 2. 檢查品質狀態是否為 qualified
 * 3. 建立或更新出貨單
 * 4. 建立出貨項目
 * 5. 更新庫存 quantity_allocated
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "庫存項目已加入出貨單。",
 *   "shipping_order_id": 1,
 *   "shipping_order_item_id": 10
 * }
 * ```
 *
 * @error 400 庫存已出貨 / 未通過品檢
 * @error 404 庫存品項不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

/**
 * Shipping Orders API - Add Item from Inventory
 * 從庫存項目加入出貨單
 */

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

requireMethod('POST');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
}

$inventoryItemId = $data['inventory_item_id'] ?? null;
$shippingOrderId = $data['shipping_order_id'] ?? null;
$createNew = $data['create_new'] ?? false;
$shippedQuantity = $data['shipped_quantity'] ?? ($data['quantity'] ?? null);
$shippedUnit = $data['shipped_unit'] ?? '支';
$packageIds = is_array($data['package_ids'] ?? null)
    ? array_values(array_unique(array_filter(array_map('intval', $data['package_ids']))))
    : [];

if (!$inventoryItemId) {
    jsonResponse(['success' => false, 'message' => '請提供庫存項目 ID。'], 400);
}

$pdo = db();

try {
    // 取得庫存項目資訊
    $invSql = "
        SELECT
            ii.*,
            c.name AS customer_name,
            si.name AS screening_item_name
        FROM inventory_items ii
        LEFT JOIN customers c ON ii.customer_id = c.id
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        WHERE ii.id = :id AND ii.deleted_at IS NULL
    ";
    $invStmt = $pdo->prepare($invSql);
    $invStmt->execute(['id' => $inventoryItemId]);
    $inventoryItem = $invStmt->fetch(PDO::FETCH_ASSOC);

    if (!$inventoryItem) {
        jsonResponse(['success' => false, 'message' => '找不到庫存項目。'], 404);
    }

    // 檢查庫存狀態
    if ($inventoryItem['status'] === 'shipped') {
        jsonResponse(['success' => false, 'message' => '該庫存項目已完全出貨。'], 400);
    }

    $receiptType = strtolower(trim((string)($inventoryItem['receipt_type'] ?? 'standard')));
    $stockCategory = strtolower(trim((string)($inventoryItem['stock_category'] ?? 'good')));
    if ($inventoryItem['quality_status'] !== 'qualified' && $receiptType !== 'partial') {
        jsonResponse(['success' => false, 'message' => '該庫存項目未通過品質檢驗，無法出貨。'], 400);
    }

    // 檢查出貨數量
    $availableQty = (float)$inventoryItem['quantity_on_hand'] - (float)$inventoryItem['quantity_allocated'];
    if ($availableQty <= 0) {
        jsonResponse(['success' => false, 'message' => '該庫存項目無可用庫存。'], 400);
    }

    // 預設出貨數量 = 可用庫存
    if ($shippedQuantity === null) {
        $shippedQuantity = $availableQty;
    }

    // 檢查出貨數量
    if ($shippedQuantity > $availableQty) {
        jsonResponse([
            'success' => false,
            'message' => "出貨數量超過可用庫存。可用數量: {$availableQty}"
        ], 400);
    }

    if ($shippedQuantity <= 0) {
        jsonResponse(['success' => false, 'message' => '出貨數量必須大於 0。'], 400);
    }

    $pdo->beginTransaction();

    // 鎖定庫存後重算可用量，避免多張草稿出貨單同時配貨超額。
    $lockedInventoryStmt = $pdo->prepare("
        SELECT *
        FROM inventory_items
        WHERE id = ? AND deleted_at IS NULL
        FOR UPDATE
    ");
    $lockedInventoryStmt->execute([(int)$inventoryItemId]);
    $lockedInventory = $lockedInventoryStmt->fetch(PDO::FETCH_ASSOC);
    if (!$lockedInventory) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '庫存項目已不存在，請重新載入。'], 409);
    }
    $lockedAvailableQty = (float)$lockedInventory['quantity_on_hand'] - (float)$lockedInventory['quantity_allocated'];
    if ($lockedAvailableQty <= 0 || (float)$shippedQuantity > $lockedAvailableQty) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => "庫存已被其他出貨單配用，目前可用數量: {$lockedAvailableQty}",
        ], 409);
    }
    if ((string)$lockedInventory['status'] === 'shipped') {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '該庫存項目已完全出貨。'], 409);
    }

    // 如果需要建立新的出貨單
    if ($createNew || !$shippingOrderId) {
        $shipmentPurpose = $stockCategory === 'defect' ? 'defect_return' : 'normal';
        // Generate shipping order number
        $prefix = 'SO';
        $date = date('Ymd');
        $seqSql = "
            SELECT shipping_order_number
            FROM shipping_orders
            WHERE shipping_order_number LIKE :pattern
            ORDER BY shipping_order_number DESC
            LIMIT 1
        ";
        $seqStmt = $pdo->prepare($seqSql);
        $seqStmt->execute(['pattern' => "{$prefix}-{$date}-%"]);
        $last = $seqStmt->fetchColumn();
        $seq = $last ? ((int)explode('-', $last)[2] + 1) : 1;
        $shippingOrderNumber = sprintf('%s-%s-%04d', $prefix, $date, $seq);

        $createSql = "
            INSERT INTO shipping_orders (
                shipping_order_number, customer_id, order_id, shipping_date,
                shipment_purpose, status, status_lookup_id
            ) VALUES (
                :shipping_order_number, :customer_id, :order_id, :shipping_date,
                :shipment_purpose, :status, :status_lookup_id
            )
        ";
        $createStmt = $pdo->prepare($createSql);
        $createStmt->execute([
            'shipping_order_number' => $shippingOrderNumber,
            'customer_id' => $inventoryItem['customer_id'],
            'order_id' => $inventoryItem['order_id'],
            'shipping_date' => date('Y-m-d'),
            'shipment_purpose' => $shipmentPurpose,
            'status' => 'draft',
            'status_lookup_id' => getShippingOrderStatusLookupId($pdo, 'draft'),
        ]);
        $shippingOrderId = (int)$pdo->lastInsertId();
    } else {
        // 驗證出貨單存在且為草稿狀態
        $checkSql = "SELECT id, status, customer_id, shipment_purpose FROM shipping_orders WHERE id = :id AND deleted_at IS NULL";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute(['id' => $shippingOrderId]);
        $shippingOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$shippingOrder) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '找不到出貨單。'], 404);
        }

        if ($shippingOrder['status'] !== 'draft') {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '出貨單已確認，無法新增品項。'], 400);
        }

        // 檢查客戶是否一致
        if ($shippingOrder['customer_id'] != $inventoryItem['customer_id']) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '庫存項目的客戶與出貨單的客戶不一致。'], 400);
        }
        $shipmentPurpose = (string)($shippingOrder['shipment_purpose'] ?? 'normal');
    }

    $allowedCategory = match ($shipmentPurpose) {
        'normal' => $stockCategory === 'good',
        'defect_return' => $stockCategory === 'defect',
        'mixed' => in_array($stockCategory, ['good', 'defect'], true),
        default => false,
    };
    if (!$allowedCategory) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => match ($shipmentPurpose) {
                'normal' => '一般出貨只允許加入良品庫存。',
                'defect_return' => '不良回送只允許加入不良品庫存。',
                'tool_return' => '載具歸還不可加入產品庫存。',
                default => '此出貨性質不允許加入該庫存類別。',
            },
        ], 409);
    }

    $selectedPackages = [];
    if ($stockCategory === 'defect') {
        if ($packageIds === []) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '不良品出貨必須選擇實際包／袋。'], 400);
        }
        $placeholders = implode(',', array_fill(0, count($packageIds), '?'));
        $packageStmt = $pdo->prepare("
            SELECT *
            FROM inventory_packages
            WHERE id IN ({$placeholders})
              AND inventory_item_id = ?
              AND package_status = 'available'
            FOR UPDATE
        ");
        $packageStmt->execute([...$packageIds, (int)$inventoryItemId]);
        $selectedPackages = $packageStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if (count($selectedPackages) !== count($packageIds)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '所選不良品包裝已被使用或不屬於此庫存。'], 409);
        }
        $packageUnits = array_sum(array_map(
            static fn(array $package): float => (float)$package['contained_units'],
            $selectedPackages
        ));
        if (abs($packageUnits - (float)$shippedQuantity) > 0.0001) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '不良品出貨數量必須等於所選包／袋的實際支數，不可拆袋估算。',
                'package_units' => $packageUnits,
                'shipped_quantity' => (float)$shippedQuantity,
            ], 409);
        }
    }

    // 檢查是否已經加入過
    $existSql = "
        SELECT id FROM shipping_order_items
        WHERE shipping_order_id = :shipping_order_id AND inventory_item_id = :inventory_item_id
    ";
    $existStmt = $pdo->prepare($existSql);
    $existStmt->execute([
        'shipping_order_id' => $shippingOrderId,
        'inventory_item_id' => $inventoryItemId,
    ]);

    if ($existStmt->fetch()) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '該庫存項目已在此出貨單中。'], 400);
    }

    // 新增出貨品項
    $insertSql = "
        INSERT INTO shipping_order_items (
            shipping_order_id, order_item_id, inventory_item_id,
            stock_category_snapshot, shipped_quantity, shipped_unit
        ) VALUES (
            :shipping_order_id, :order_item_id, :inventory_item_id,
            :stock_category_snapshot, :shipped_quantity, :shipped_unit
        )
    ";
    $insertStmt = $pdo->prepare($insertSql);
    $insertStmt->execute([
        'shipping_order_id' => $shippingOrderId,
        'order_item_id' => $inventoryItem['order_item_id'],
        'inventory_item_id' => $inventoryItemId,
        'stock_category_snapshot' => $stockCategory,
        'shipped_quantity' => $shippedQuantity,
        'shipped_unit' => $shippedUnit,
    ]);
    $itemId = (int)$pdo->lastInsertId();

    if ($stockCategory === 'defect') {
        $packageLinkStmt = $pdo->prepare("
            INSERT INTO shipping_order_item_packages (
                shipping_order_item_id, inventory_package_id,
                shipped_units, shipped_package_quantity
            ) VALUES (
                :shipping_order_item_id, :inventory_package_id,
                :shipped_units, :shipped_package_quantity
            )
        ");
        $reservePackageStmt = $pdo->prepare("
            UPDATE inventory_packages
            SET package_status = 'reserved'
            WHERE id = :id
              AND package_status = 'available'
        ");
        foreach ($selectedPackages as $package) {
            $packageLinkStmt->execute([
                'shipping_order_item_id' => $itemId,
                'inventory_package_id' => (int)$package['id'],
                'shipped_units' => (float)$package['contained_units'],
                'shipped_package_quantity' => (int)$package['package_quantity'],
            ]);
            $reservePackageStmt->execute(['id' => (int)$package['id']]);
        }
    }

    // 更新庫存項目的配貨數量
    $updateInvSql = "
        UPDATE inventory_items
        SET quantity_allocated = quantity_allocated + :qty
        WHERE id = :id
    ";
    $updateInvStmt = $pdo->prepare($updateInvSql);
    $updateInvStmt->execute([
        'qty' => $shippedQuantity,
        'id' => $inventoryItemId,
    ]);

    // 重新計算庫存狀態
    require_once __DIR__ . '/helpers.php';
    recalculateInventoryStatus($pdo, (int)$inventoryItemId);
    saveShippingOrderDefectSummary(
        $pdo,
        (int)$shippingOrderId,
        fetchShippingOrderActualDefectSummary($pdo, (int)$shippingOrderId)
    );

    // 注意：order_items.total_shipped_quantity 不在此更新
    // 只有在出貨單確認（status → shipped）時才更新
    // 避免草稿階段提前計入訂單出貨統計（修復 G6）

    $pdo->commit();

    // 取得出貨單資訊
    $resultSql = "
        SELECT so.*, c.name AS customer_name
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.id = :id
    ";
    $resultStmt = $pdo->prepare($resultSql);
    $resultStmt->execute(['id' => $shippingOrderId]);
    $shippingOrder = $resultStmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'message' => '已成功加入出貨單。',
        'shipping_order_id' => $shippingOrderId,
        'shipping_order_item_id' => $itemId,
        'data' => [
            'shipping_order_id' => $shippingOrderId,
            'shipping_order_item_id' => $itemId,
            'shipping_order' => $shippingOrder,
            'item_id' => $itemId,
        ],
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Add to shipping order error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '加入出貨單失敗，請稍後重試。')], 500);
}
