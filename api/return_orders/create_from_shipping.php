<?php
/**
 * 退貨單 API - 從出貨單建立退貨單
 *
 * 基於指定出貨單的品項建立退貨單，支援整單退貨或部分品項退貨
 *
 * @endpoint POST /api/return_orders/create_from_shipping.php
 *
 * @auth 必須登入
 *
 * @input Body Parameters (JSON):
 * | 參數                  | 類型   | 必填 | 說明                           |
 * |----------------------|--------|------|-------------------------------|
 * | shipping_order_id    | int    | 是   | 出貨單 ID                      |
 * | return_date          | date   | 是   | 退貨日期 (YYYY-MM-DD)          |
 * | return_reason        | string | 否   | 退貨原因                       |
 * | notes                | string | 否   | 備註                          |
 * | items                | array  | 是   | 退貨品項列表（至少一個）        |
 * | items[].shipping_order_item_id | int | 是 | 出貨品項 ID         |
 * | items[].returned_quantity | number | 是 | 退貨數量              |
 * | items[].returned_unit | string | 否 | 退貨單位                |
 * | items[].reason        | string | 否 | 品項退貨原因            |
 *
 * @output 成功 (201):
 * ```json
 * {
 *   "success": true,
 *   "message": "退貨單已成功建立。",
 *   "data": {
 *     "id": 123,
 *     "return_order_number": "RO-20260205-0001",
 *     "shipping_order_id": 1,
 *     "item_count": 2
 *   }
 * }
 * ```
 *
 * @error 400 參數驗證失敗
 * @error 404 出貨單不存在
 * @error 422 退貨數量超過可退數量
 *
 * @note
 * - 自動關聯客戶（從出貨單取得）
 * - 自動計算並更新出貨單的 return_status 和 has_return
 * - 驗證退貨數量不超過可退數量
 * - 事務處理確保資料一致性
 *
 * @version 1.0.0
 * @since 2026-02-05
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../return_order_items/helpers.php';
require_once __DIR__ . '/helpers.php';

$currentEmployee = requireAuth();
requireMethod('POST');

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
}

// === 參數驗證 ===
$errors = [];

if (empty($input['shipping_order_id']) || !is_numeric($input['shipping_order_id'])) {
    $errors[] = '出貨單 ID 為必填且必須為數字。';
}

if (empty($input['return_date'])) {
    $errors[] = '退貨日期為必填。';
} else {
    $date = DateTime::createFromFormat('Y-m-d', $input['return_date']);
    if (!$date || $date->format('Y-m-d') !== $input['return_date']) {
        $errors[] = '退貨日期格式無效，請使用 YYYY-MM-DD 格式。';
    }
}

if (empty($input['items']) || !is_array($input['items']) || count($input['items']) === 0) {
    $errors[] = '至少需要提供一個退貨品項。';
}

if (!empty($errors)) {
    jsonResponse(['success' => false, 'message' => implode(' ', $errors)], 400);
}

$shippingOrderId = (int)$input['shipping_order_id'];
$pdo = db();

try {
    // === 查詢出貨單 ===
    $shippingOrderSql = "
        SELECT
            so.id,
            so.shipping_order_number,
            so.customer_id,
            so.status,
            c.name AS customer_name
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.id = :id AND so.deleted_at IS NULL
    ";

    $soStmt = $pdo->prepare($shippingOrderSql);
    $soStmt->execute(['id' => $shippingOrderId]);
    $shippingOrder = $soStmt->fetch(PDO::FETCH_ASSOC);

    if (!$shippingOrder) {
        jsonResponse(['success' => false, 'message' => '找不到指定的出貨單。'], 404);
    }

    if (empty($shippingOrder['customer_id'])) {
        jsonResponse(['success' => false, 'message' => '出貨單沒有關聯的客戶。'], 400);
    }
    if (!in_array((string)$shippingOrder['status'], ['shipped', 'delivered'], true)) {
        jsonResponse(['success' => false, 'message' => '只有已出貨或已送達的出貨單可以建立退貨單。'], 409);
    }

    // === 查詢並驗證退貨品項 ===
    $itemIds = array_column($input['items'], 'shipping_order_item_id');
    $itemIdsStr = implode(',', array_map('intval', $itemIds));

    $itemsSql = "
        SELECT
            soi.id,
            soi.shipped_quantity,
            soi.shipped_unit,
            ii.inventory_number,
            si.name AS screening_item_name,
            COALESCE((
                SELECT SUM(roi.returned_quantity)
                FROM return_order_items roi
                INNER JOIN return_orders ro ON roi.return_order_id = ro.id
                WHERE roi.shipping_order_item_id = soi.id
                  AND ro.deleted_at IS NULL
            ), 0) AS total_returned,
            (soi.shipped_quantity - COALESCE((
                SELECT SUM(roi2.returned_quantity)
                FROM return_order_items roi2
                INNER JOIN return_orders ro2 ON roi2.return_order_id = ro2.id
                WHERE roi2.shipping_order_item_id = soi.id
                  AND ro2.deleted_at IS NULL
            ), 0)) AS returnable_quantity
        FROM shipping_order_items soi
        LEFT JOIN inventory_items ii ON soi.inventory_item_id = ii.id
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        WHERE soi.id IN ({$itemIdsStr})
          AND soi.shipping_order_id = :shipping_order_id
    ";

    $itemsStmt = $pdo->prepare($itemsSql);
    $itemsStmt->execute(['shipping_order_id' => $shippingOrderId]);
    $existingItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 建立 ID 對應表
    $itemsMap = [];
    foreach ($existingItems as $item) {
        $itemsMap[$item['id']] = $item;
    }

    // 驗證退貨品項
    $validationErrors = [];
    foreach ($input['items'] as $idx => $item) {
        $itemId = (int)$item['shipping_order_item_id'];
        $returnQty = (float)$item['returned_quantity'];

        if (!isset($itemsMap[$itemId])) {
            $validationErrors[] = "品項 #{$idx}: 出貨品項 ID {$itemId} 不存在於此出貨單。";
            continue;
        }

        if ($returnQty <= 0) {
            $validationErrors[] = "品項 #{$idx}: 退貨數量必須大於 0。";
            continue;
        }

        $returnableQty = (float)$itemsMap[$itemId]['returnable_quantity'];
        if ($returnQty > $returnableQty) {
            $itemName = $itemsMap[$itemId]['screening_item_name'] ?? $itemsMap[$itemId]['inventory_number'];
            $validationErrors[] = "品項「{$itemName}」: 退貨數量 ({$returnQty}) 超過可退數量 ({$returnableQty})。";
        }
    }

    if (!empty($validationErrors)) {
        jsonResponse([
            'success' => false,
            'message' => '退貨品項驗證失敗。',
            'errors' => $validationErrors,
        ], 422);
    }

    // === 開始事務 ===
    $pdo->beginTransaction();

    try {
        $shippingLockStmt = $pdo->prepare("
            SELECT status
            FROM shipping_orders
            WHERE id = ? AND deleted_at IS NULL
            FOR UPDATE
        ");
        $shippingLockStmt->execute([$shippingOrderId]);
        $lockedShippingStatus = $shippingLockStmt->fetchColumn();
        if (!in_array((string)$lockedShippingStatus, ['shipped', 'delivered'], true)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '出貨單狀態已變更，無法建立退貨單。'], 409);
        }

        // 建立退貨單
        $returnOrderNumber = generateReturnOrderNumber($pdo);

        $insertOrderSql = "
            INSERT INTO return_orders (
                return_order_number,
                customer_id,
                original_shipping_order_id,
                return_date,
                return_reason,
                processing_status,
                notes,
                created_at
            ) VALUES (
                :return_order_number,
                :customer_id,
                :original_shipping_order_id,
                :return_date,
                :return_reason,
                :processing_status,
                :notes,
                NOW()
            )
        ";

        $insertOrderStmt = $pdo->prepare($insertOrderSql);
        $insertOrderStmt->execute([
            'return_order_number' => $returnOrderNumber,
            'customer_id' => $shippingOrder['customer_id'],
            'original_shipping_order_id' => $shippingOrderId,
            'return_date' => $input['return_date'],
            'return_reason' => $input['return_reason'] ?? null,
            'processing_status' => 'pending',
            'notes' => $input['notes'] ?? null,
        ]);
        $returnOrderId = (int)$pdo->lastInsertId();

        // 新增退貨品項
        $insertItemSql = "
            INSERT INTO return_order_items (
                return_order_id,
                shipping_order_item_id,
                returned_quantity,
                returned_unit,
                reason,
                created_at
            ) VALUES (
                :return_order_id,
                :shipping_order_item_id,
                :returned_quantity,
                :returned_unit,
                :reason,
                NOW()
            )
        ";

        $insertItemStmt = $pdo->prepare($insertItemSql);
        $itemCount = 0;

        foreach ($input['items'] as $item) {
            $business = validateReturnOrderItemBusinessRules(
                $pdo,
                $returnOrderId,
                (int)$item['shipping_order_item_id'],
                (float)$item['returned_quantity']
            );
            if ($business['errors'] !== []) {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'message' => implode('；', array_values($business['errors'])),
                    'errors' => $business['errors'],
                ], 409);
            }

            $insertItemStmt->execute([
                'return_order_id' => $returnOrderId,
                'shipping_order_item_id' => (int)$item['shipping_order_item_id'],
                'returned_quantity' => (float)$item['returned_quantity'],
                'returned_unit' => $item['returned_unit'] ?? $itemsMap[(int)$item['shipping_order_item_id']]['shipped_unit'] ?? null,
                'reason' => $item['reason'] ?? null,
            ]);
            $itemId = (int)$pdo->lastInsertId();
            recordReturnOrderItemInventorySource($pdo, $itemId, $business['source'] ?? []);
            $itemCount++;
        }

        // 更新出貨單退貨狀態
        updateShippingReturnStatus($pdo, $shippingOrderId);

        $pdo->commit();

        // 記錄稽核日誌
        logAuditAction('從出貨單建立退貨單', 'ReturnOrders', $returnOrderId, [
            'return_order_number' => $returnOrderNumber,
            'shipping_order_id' => $shippingOrderId,
            'shipping_order_number' => $shippingOrder['shipping_order_number'],
            'customer_id' => $shippingOrder['customer_id'],
            'item_count' => $itemCount,
        ]);

        jsonResponse([
            'success' => true,
            'message' => '退貨單已成功建立。',
            'data' => [
                'id' => $returnOrderId,
                'return_order_number' => $returnOrderNumber,
                'shipping_order_id' => $shippingOrderId,
                'item_count' => $itemCount,
            ],
        ], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log('Create return order from shipping error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '建立退貨單失敗，請稍後重試。')], 500);
}

/**
 * 更新出貨單的退貨狀態
 *
 * @param PDO $pdo
 * @param int $shippingOrderId
 */
function updateShippingReturnStatus(PDO $pdo, int $shippingOrderId): void
{
    // 計算出貨單的退貨狀態 - 使用子查詢先計算每個品項的退貨總量（排除已刪除的退貨單）
    $sql = "
        SELECT
            COUNT(*) AS total_items,
            SUM(CASE WHEN item_stats.returnable_qty <= 0 THEN 1 ELSE 0 END) AS fully_returned_items,
            SUM(CASE WHEN item_stats.returnable_qty > 0 AND item_stats.total_returned > 0 THEN 1 ELSE 0 END) AS partial_returned_items
        FROM (
            SELECT
                soi.id,
                soi.shipped_quantity,
                COALESCE((
                    SELECT SUM(roi.returned_quantity)
                    FROM return_order_items roi
                    INNER JOIN return_orders ro ON roi.return_order_id = ro.id
                    WHERE roi.shipping_order_item_id = soi.id
                      AND ro.deleted_at IS NULL
                ), 0) AS total_returned,
                soi.shipped_quantity - COALESCE((
                    SELECT SUM(roi2.returned_quantity)
                    FROM return_order_items roi2
                    INNER JOIN return_orders ro2 ON roi2.return_order_id = ro2.id
                    WHERE roi2.shipping_order_item_id = soi.id
                      AND ro2.deleted_at IS NULL
                ), 0) AS returnable_qty
            FROM shipping_order_items soi
            WHERE soi.shipping_order_id = :shipping_order_id
        ) AS item_stats
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['shipping_order_id' => $shippingOrderId]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);

    $totalItems = (int)$stats['total_items'];
    $fullyReturnedItems = (int)$stats['fully_returned_items'];
    $partialReturnedItems = (int)$stats['partial_returned_items'];

    // 判斷退貨狀態
    if ($fullyReturnedItems === 0 && $partialReturnedItems === 0) {
        $returnStatus = 'none';
        $hasReturn = false;
    } elseif ($fullyReturnedItems === $totalItems) {
        $returnStatus = 'full';
        $hasReturn = true;
    } else {
        $returnStatus = 'partial';
        $hasReturn = true;
    }

    // 更新出貨單
    $updateSql = "
        UPDATE shipping_orders
        SET
            return_status = :return_status,
            has_return = :has_return,
            updated_at = NOW()
        WHERE id = :id
    ";

    $updateStmt = $pdo->prepare($updateSql);
    $updateStmt->execute([
        'return_status' => $returnStatus,
        'has_return' => $hasReturn ? 1 : 0,
        'id' => $shippingOrderId,
    ]);
}
