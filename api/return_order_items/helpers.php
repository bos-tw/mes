<?php
/**
 * 退貨品項 API 共用函式。
 *
 * @module return_order_items
 * @table return_order_items
 */
declare(strict_types=1);

function readReturnOrderItemPayload(): array
{
    return readRequestPayload();
}

/**
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateReturnOrderItemData(array $payload, bool $isUpdate = false): array
{
    $data = [];
    $errors = [];

    if (!$isUpdate) {
        foreach ([
            'return_order_id' => '退貨單',
            'shipping_order_item_id' => '原出貨品項',
        ] as $field => $label) {
            $value = filter_var($payload[$field] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($value === false) {
                $errors[$field] = "{$label}為必填且必須是正整數。";
            } else {
                $data[$field] = $value;
            }
        }
    }

    if (!$isUpdate || array_key_exists('returned_quantity', $payload)) {
        $quantity = filter_var($payload['returned_quantity'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($quantity === false || $quantity <= 0) {
            $errors['returned_quantity'] = '退貨數量必須大於 0。';
        } else {
            $data['returned_quantity'] = round((float)$quantity, 2);
        }
    }

    if (!$isUpdate || array_key_exists('returned_unit', $payload)) {
        $unit = trim((string)($payload['returned_unit'] ?? ''));
        $data['returned_unit'] = $unit !== '' ? mb_substr($unit, 0, 50) : '支';
    }

    if (array_key_exists('reason', $payload)) {
        $reason = trim((string)($payload['reason'] ?? ''));
        $data['reason'] = $reason !== '' ? mb_substr($reason, 0, 255) : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

function transformReturnOrderItem(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'return_order_id' => (int)$row['return_order_id'],
        'return_order_number' => $row['return_order_number'] ?? null,
        'processing_status' => $row['processing_status'] ?? null,
        'shipping_order_item_id' => (int)$row['shipping_order_item_id'],
        'shipping_order_id' => isset($row['shipping_order_id']) ? (int)$row['shipping_order_id'] : null,
        'shipping_order_number' => $row['shipping_order_number'] ?? null,
        'inventory_number' => $row['inventory_number'] ?? null,
        'customer_batch_number' => $row['customer_batch_number'] ?? null,
        'part_number' => $row['part_number'] ?? null,
        'sub_item_number' => $row['sub_item_number'] ?? null,
        'screening_item_name' => $row['screening_item_name'] ?? null,
        'shipped_quantity' => isset($row['shipped_quantity']) ? (float)$row['shipped_quantity'] : null,
        'shipped_unit' => $row['shipped_unit'] ?? null,
        'returned_quantity' => (float)$row['returned_quantity'],
        'returned_unit' => $row['returned_unit'] ?? null,
        'reason' => $row['reason'] ?? null,
        'created_at' => $row['created_at'] ?? null,
    ];
}

function getReturnOrderItemSelectSql(): string
{
    return "
        SELECT
            roi.*,
            ro.return_order_number,
            ro.processing_status,
            ro.original_shipping_order_id,
            soi.shipping_order_id,
            soi.shipped_quantity,
            soi.shipped_unit,
            so.shipping_order_number,
            ii.inventory_number,
            ii.customer_batch_number,
            oi.part_number,
            oi.sub_item_number,
            si.name AS screening_item_name
        FROM return_order_items roi
        INNER JOIN return_orders ro ON ro.id = roi.return_order_id
        INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
        INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id
        LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
        LEFT JOIN order_items oi ON oi.id = soi.order_item_id
        LEFT JOIN screening_items si ON si.id = ii.screening_item_id
    ";
}

function findReturnOrderItem(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare(getReturnOrderItemSelectSql() . ' WHERE roi.id = :id AND ro.deleted_at IS NULL');
    $stmt->execute(['id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

/**
 * 驗證退貨單與原出貨品項關係及可退數量。
 *
 * @return array{source: array<string,mixed>|null, errors: array<string,string>}
 */
function validateReturnOrderItemBusinessRules(
    PDO $pdo,
    int $returnOrderId,
    int $shippingOrderItemId,
    float $returnedQuantity,
    int $excludeItemId = 0
): array {
    $stmt = $pdo->prepare("
        SELECT
            ro.id AS return_order_id,
            ro.processing_status,
            ro.original_shipping_order_id,
            soi.id AS shipping_order_item_id,
            soi.shipping_order_id,
            soi.inventory_item_id,
            soi.order_item_id,
            so.order_id,
            soi.shipped_quantity,
            soi.shipped_unit,
            so.status AS shipping_status
        FROM return_orders ro
        INNER JOIN shipping_order_items soi ON soi.id = ?
        INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id AND so.deleted_at IS NULL
        WHERE ro.id = ? AND ro.deleted_at IS NULL
        FOR UPDATE
    ");
    $stmt->execute([$shippingOrderItemId, $returnOrderId]);
    $source = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    if (!$source) {
        return ['source' => null, 'errors' => ['source' => '退貨單或原出貨品項不存在。']];
    }

    $errors = [];
    if (!in_array((string)$source['processing_status'], ['pending', 'processing'], true)) {
        $errors['processing_status'] = '只有待處理或處理中的退貨單可以修改品項。';
    }
    if ((int)$source['original_shipping_order_id'] !== (int)$source['shipping_order_id']) {
        $errors['shipping_order_item_id'] = '原出貨品項不屬於此退貨單指定的出貨單。';
    }
    if (!in_array((string)$source['shipping_status'], ['shipped', 'delivered'], true)) {
        $errors['shipping_status'] = '只有已出貨或已送達的品項可以退貨。';
    }

    $sumStmt = $pdo->prepare("
        SELECT COALESCE(SUM(roi.returned_quantity), 0)
        FROM return_order_items roi
        INNER JOIN return_orders ro ON ro.id = roi.return_order_id
        WHERE roi.shipping_order_item_id = ?
          AND roi.id <> ?
          AND ro.deleted_at IS NULL
    ");
    $sumStmt->execute([$shippingOrderItemId, $excludeItemId]);
    $alreadyReturned = (float)$sumStmt->fetchColumn();
    $maximum = (float)$source['shipped_quantity'];
    if (($alreadyReturned + $returnedQuantity) > ($maximum + 0.00001)) {
        $errors['returned_quantity'] = '退貨數量超過可退數量；目前最多可退 ' . max(0, $maximum - $alreadyReturned) . '。';
    }

    return ['source' => $source, 'errors' => $errors];
}

/** @param array<string,mixed> $source */
function recordReturnOrderItemInventorySource(PDO $pdo, int $returnOrderItemId, array $source): void
{
    $inventoryItemId = (int)($source['inventory_item_id'] ?? 0);
    if ($inventoryItemId <= 0 || $returnOrderItemId <= 0) {
        return;
    }
    $pdo->prepare("DELETE FROM inventory_item_sources
        WHERE source_type = 'return_order_item' AND source_id = ?")->execute([$returnOrderItemId]);
    $pdo->prepare("INSERT INTO inventory_item_sources (
        inventory_item_id, source_type, source_id, source_order_id,
        source_order_item_id, source_shipping_order_id,
        source_shipping_order_item_id, source_return_order_id,
        source_return_order_item_id, notes
    ) VALUES (?, 'return_order_item', ?, ?, ?, ?, ?, ?, ?, ?)")->execute([
        $inventoryItemId,
        $returnOrderItemId,
        !empty($source['order_id']) ? (int)$source['order_id'] : null,
        !empty($source['order_item_id']) ? (int)$source['order_item_id'] : null,
        !empty($source['shipping_order_id']) ? (int)$source['shipping_order_id'] : null,
        !empty($source['shipping_order_item_id']) ? (int)$source['shipping_order_item_id'] : null,
        !empty($source['return_order_id']) ? (int)$source['return_order_id'] : null,
        $returnOrderItemId,
        '原出貨品項退貨追溯',
    ]);
}

/**
 * 依退貨明細真實值更新出貨單的退貨旗標。
 *
 * @return array<string,mixed>
 */
function recalculateShippingOrderReturnStatus(PDO $pdo, int $shippingOrderId): array
{
    $stmt = $pdo->prepare("
        SELECT
            soi.shipped_quantity,
            COALESCE(SUM(CASE WHEN ro.deleted_at IS NULL THEN roi.returned_quantity ELSE 0 END), 0) AS returned_quantity
        FROM shipping_order_items soi
        LEFT JOIN return_order_items roi ON roi.shipping_order_item_id = soi.id
        LEFT JOIN return_orders ro ON ro.id = roi.return_order_id
        WHERE soi.shipping_order_id = ?
        GROUP BY soi.id, soi.shipped_quantity
    ");
    $stmt->execute([$shippingOrderId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $returnedItems = 0;
    $fullyReturnedItems = 0;
    foreach ($items as $item) {
        $returned = (float)$item['returned_quantity'];
        if ($returned > 0) {
            $returnedItems++;
        }
        if ($returned > 0 && $returned >= (float)$item['shipped_quantity']) {
            $fullyReturnedItems++;
        }
    }

    $totalItems = count($items);
    if ($returnedItems === 0) {
        $status = 'none';
    } elseif ($totalItems > 0 && $fullyReturnedItems === $totalItems) {
        $status = 'full';
    } else {
        $status = 'partial';
    }

    $pdo->prepare("
        UPDATE shipping_orders
        SET return_status = ?, has_return = ?, updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
    ")->execute([$status, $status === 'none' ? 0 : 1, $shippingOrderId]);

    return [
        'shipping_order_id' => $shippingOrderId,
        'return_status' => $status,
        'has_return' => $status !== 'none',
        'total_items' => $totalItems,
        'returned_items' => $returnedItems,
        'fully_returned_items' => $fullyReturnedItems,
    ];
}

function handleReturnOrderItemWriteException(PDOException $exception): array
{
    error_log('ReturnOrderItem PDO Exception: ' . $exception->getMessage());
    if ($exception->getCode() === '23000') {
        return ['success' => false, 'message' => '關聯資料不存在或資料違反完整性限制。'];
    }
    return ['success' => false, 'message' => '資料庫操作失敗，請稍後再試。'];
}
