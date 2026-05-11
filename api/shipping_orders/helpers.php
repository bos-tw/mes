<?php
/**
 * 出貨單管理 API - 輔助函式
 *
 * 本檔案包含出貨單模組的驗證、查詢等共用函式：
 *
 * @module shipping_orders
 * @table shipping_orders
 *
 * @functions
 * - readShippingOrderPayload(): 讀取請求資料
 * - validateShippingOrderData(): 驗證並正規化出貨單輸入資料
 * - transformShippingOrder(): 轉換 API 回應格式
 * - findShippingOrder(): 依 ID 查詢出貨單（含關聯資料）
 * - shippingOrderExists(): 檢查出貨單是否存在
 * - handleShippingOrderWriteException(): 處理寫入 PDO 例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 讀取請求資料
 *
 * 支援 JSON (Content-Type: application/json) 及 FormData 兩種格式。
 * 優先讀取 JSON，若無 JSON 則讀取 $_POST。
 *
 * @return array<string,mixed> 請求資料
 */
function readShippingOrderPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化出貨單輸入資料
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 *
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateShippingOrderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 客戶 ID - 新增時必填
    if (!$isUpdate || array_key_exists('customer_id', $payload)) {
        $customerId = $payload['customer_id'] ?? null;
        if (!$isUpdate && ($customerId === null || $customerId === '')) {
            $errors['customer_id'] = '客戶為必填。';
        } elseif ($customerId !== null && $customerId !== '') {
            $customerIdInt = filter_var($customerId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($customerIdInt === false) {
                $errors['customer_id'] = '客戶 ID 必須為正整數。';
            } else {
                $data['customer_id'] = $customerIdInt;
            }
        }
    }

    // 訂單 ID (選填)
    if (array_key_exists('order_id', $payload)) {
        $orderId = $payload['order_id'] ?? null;
        if ($orderId !== null && $orderId !== '') {
            $orderIdInt = filter_var($orderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderIdInt === false) {
                $errors['order_id'] = '訂單 ID 必須為正整數。';
            } else {
                $data['order_id'] = $orderIdInt;
            }
        } else {
            $data['order_id'] = null;
        }
    }

    // 出貨日期
    if (array_key_exists('shipping_date', $payload)) {
        $shippingDate = trim((string)($payload['shipping_date'] ?? ''));
        if ($shippingDate !== '') {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $shippingDate)) {
                $errors['shipping_date'] = '出貨日期格式須為 YYYY-MM-DD。';
            } else {
                $data['shipping_date'] = $shippingDate;
            }
        } else {
            $data['shipping_date'] = null;
        }
    }

    // 配送方式
    if (array_key_exists('delivery_method', $payload)) {
        $deliveryMethod = trim((string)($payload['delivery_method'] ?? ''));
        $data['delivery_method'] = $deliveryMethod !== '' ? mb_substr($deliveryMethod, 0, 50) : null;
    }

    // 物流追蹤編號
    if (array_key_exists('tracking_number', $payload)) {
        $trackingNumber = trim((string)($payload['tracking_number'] ?? ''));
        $data['tracking_number'] = $trackingNumber !== '' ? mb_substr($trackingNumber, 0, 100) : null;
    }

    // 收貨人姓名
    if (array_key_exists('consignee_name', $payload)) {
        $consigneeName = trim((string)($payload['consignee_name'] ?? ''));
        $data['consignee_name'] = $consigneeName !== '' ? mb_substr($consigneeName, 0, 100) : null;
    }

    // 收貨地址
    if (array_key_exists('consignee_address', $payload)) {
        $consigneeAddress = trim((string)($payload['consignee_address'] ?? ''));
        $data['consignee_address'] = $consigneeAddress !== '' ? mb_substr($consigneeAddress, 0, 500) : null;
    }

    // 狀態
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? ''));
        $allowedStatuses = ['draft', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled'];
        if ($status !== '' && !in_array($status, $allowedStatuses, true)) {
            $errors['status'] = '狀態值無效。';
        } else {
            $data['status'] = $status !== '' ? $status : 'draft';
        }
    }

    // 備註
    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 轉換出貨單為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫原始資料
 * @return array<string,mixed>
 */
function transformShippingOrder(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'shipping_order_number' => $row['shipping_order_number'],
        'customer_id' => $row['customer_id'] ? (int)$row['customer_id'] : null,
        'customer_name' => $row['customer_name'] ?? null,
        'order_id' => $row['order_id'] ? (int)$row['order_id'] : null,
        'order_number' => $row['order_number'] ?? null,
        'shipping_date' => $row['shipping_date'],
        'delivery_method' => $row['delivery_method'],
        'tracking_number' => $row['tracking_number'] ?? null,
        'consignee_name' => $row['consignee_name'],
        'consignee_address' => $row['consignee_address'],
        'status' => $row['status'],
        'status_label' => $row['status_label'] ?? null,
        'notes' => $row['notes'],
        'item_count' => isset($row['item_count']) ? (int)$row['item_count'] : 0,
        'total_quantity' => isset($row['total_quantity']) ? (float)$row['total_quantity'] : 0,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * 依 ID 查詢出貨單（含關聯資料）
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findShippingOrder(PDO $pdo, int $id): ?array
{
    $sql = "
        SELECT
            so.*,
            c.name AS customer_name,
            o.order_number,
            lv.value_label AS status_label,
            (SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS item_count,
            (SELECT SUM(soi.shipped_quantity) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS total_quantity
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN orders o ON so.order_id = o.id
        LEFT JOIN lookup_values lv ON so.status = lv.value_key
            AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'shipping_status')
        WHERE so.id = :id AND so.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 檢查出貨單是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function shippingOrderExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM shipping_orders WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 重新計算庫存品項狀態
 *
 * 根據 quantity_on_hand、quantity_allocated、quantity_shipped 自動判斷狀態：
 * - shipped:   全部出貨完畢（在庫為 0 且有出貨紀錄）
 * - allocated: 有配貨中的數量
 * - in_stock:  正常在庫
 *
 * @param PDO $pdo
 * @param int $inventoryItemId 庫存品項 ID
 * @return string|null 更新後的狀態，找不到品項時回傳 null
 */
function recalculateInventoryStatus(PDO $pdo, int $inventoryItemId): ?string
{
    $stmt = $pdo->prepare("
        SELECT quantity_on_hand, quantity_allocated, quantity_shipped
        FROM inventory_items
        WHERE id = ? AND deleted_at IS NULL
    ");
    $stmt->execute([$inventoryItemId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        return null;
    }

    $onHand = (float)$item['quantity_on_hand'];
    $allocated = (float)$item['quantity_allocated'];
    $shipped = (float)$item['quantity_shipped'];

    if ($onHand <= 0 && $shipped > 0) {
        $newStatus = 'shipped';
    } elseif ($allocated > 0) {
        $newStatus = 'allocated';
    } else {
        $newStatus = 'in_stock';
    }

    $pdo->prepare("UPDATE inventory_items SET status = ? WHERE id = ?")
        ->execute([$newStatus, $inventoryItemId]);

    return $newStatus;
}

/**
 * 重新計算訂單品項的出貨統計
 *
 * 以 shipping_order_items 中對應已出貨（shipped）出貨單為真實來源，
 * 重新計算 total_shipped_quantity 與 shipping_status。
 * 避免增量更新造成的冪等性問題。
 *
 * @param PDO $pdo
 * @param int $orderItemId 訂單品項 ID
 * @return void
 */
function recalculateOrderItemShipping(PDO $pdo, int $orderItemId): void
{
    // 以已出貨的出貨單品項合計為真實來源
    $sumStmt = $pdo->prepare("
        SELECT COALESCE(SUM(soi.shipped_quantity), 0) AS total_shipped
        FROM shipping_order_items soi
        JOIN shipping_orders so ON soi.shipping_order_id = so.id
        WHERE soi.order_item_id = ?
          AND so.status = 'shipped'
          AND so.deleted_at IS NULL
    ");
    $sumStmt->execute([$orderItemId]);
    $totalShipped = (float)$sumStmt->fetchColumn();

    // 取得訂單品項的總數量
    $oiStmt = $pdo->prepare("SELECT total_units FROM order_items WHERE id = ?");
    $oiStmt->execute([$orderItemId]);
    $totalUnits = (float)$oiStmt->fetchColumn();

    // 推導出貨狀態
    if ($totalShipped <= 0) {
        $shippingStatus = 'not_shipped';
    } elseif ($totalUnits > 0 && $totalShipped >= $totalUnits) {
        $shippingStatus = 'fully_shipped';
    } else {
        $shippingStatus = 'partial_shipped';
    }

    $pdo->prepare("
        UPDATE order_items
        SET total_shipped_quantity = ?,
            shipping_status = ?
        WHERE id = ?
    ")->execute([$totalShipped, $shippingStatus, $orderItemId]);
}

/**
 * 建立庫存異動紀錄
 *
 * @param PDO    $pdo
 * @param int    $inventoryItemId 庫存品項 ID
 * @param string $refType         參照類型 (shipping_order / return_order / work_order / adjustment)
 * @param int    $refId           參照 ID
 * @param string $direction       方向 (inbound / outbound / adjustment)
 * @param float  $quantity        異動數量（正數）
 * @param float  $afterQuantity   異動後在庫數量
 * @param string $notes           備註
 * @param int|null $createdByEmployeeId 操作人員 ID
 * @return void
 */
function createInventoryTransaction(
    PDO $pdo,
    int $inventoryItemId,
    string $refType,
    int $refId,
    string $direction,
    float $quantity,
    float $afterQuantity,
    string $notes = '',
    ?int $createdByEmployeeId = null
): void {
    // 取得庫存品項的關聯資料
    $invStmt = $pdo->prepare("
        SELECT order_id, order_item_id, work_order_id
        FROM inventory_items WHERE id = ?
    ");
    $invStmt->execute([$inventoryItemId]);
    $inv = $invStmt->fetch(PDO::FETCH_ASSOC);

    // 取得下一個交易 ID
    require_once __DIR__ . '/../inventory_items/helpers.php';
    $transactionId = getNextInventoryTransactionId($pdo);

    $pdo->prepare("
        INSERT INTO inventory_transactions
            (id, inventory_item_id, order_id, order_item_id, work_order_id,
             ref_type, ref_id, direction, quantity, after_quantity,
             notes, created_by_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $transactionId,
        $inventoryItemId,
        $inv['order_id'] ?? null,
        $inv['order_item_id'] ?? null,
        $inv['work_order_id'] ?? null,
        $refType,
        $refId,
        $direction,
        $quantity,
        max(0, $afterQuantity),
        $notes,
        $createdByEmployeeId
    ]);
}

/**
 * 取得當前登入使用者 ID
 *
 * @return int|null
 */
function getCurrentEmployeeId(): ?int
{
    $employee = $_SESSION['employee'] ?? null;
    return $employee ? (int)$employee['id'] : null;
}

/**
 * 處理寫入 PDO 例外
 *
 * @param PDOException $e
 * @return array<string,mixed>
 */
function handleShippingOrderWriteException(PDOException $e): array
{
    $code = $e->getCode();
    $message = $e->getMessage();

    error_log("ShippingOrder PDO Exception: [{$code}] {$message}");

    // 唯一約束
    if ($code === '23000' && str_contains($message, 'Duplicate entry')) {
        if (str_contains($message, 'shipping_order_number')) {
            return [
                'success' => false,
                'message' => '出貨單編號已存在，請勿重複。',
            ];
        }
        return [
            'success' => false,
            'message' => '資料重複或違反完整性約束，請確認輸入資料。',
        ];
    }

    // 外鍵約束
    if ($code === '23000' && str_contains($message, 'foreign key constraint')) {
        return [
            'success' => false,
            'message' => '關聯資料不存在或已刪除，請確認資料正確。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}