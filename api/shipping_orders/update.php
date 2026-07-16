<?php
/**
 * 出貨單 API - 更新
 *
 * 更新指定出貨單的資料。
 *
 * @endpoint PUT /api/shipping_orders/update.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 出貨單 ID |
 *
 * @input JSON Body:
 * | 參數              | 類型   | 必填 | 說明              |
 * |-------------------|--------|-----|-----------------|
 * | shipping_date     | date   | 否  | 出貨日期          |
 * | delivery_method   | string | 否  | 配送方式          |
 * | consignee_name    | string | 否  | 取貨人姓名        |
 * | consignee_address | string | 否  | 取貨地址          |
 * | carrier           | string | 否  | 貨運公司          |
 * | tracking_number   | string | 否  | 物流單號          |
 * | status            | string | 否  | 狀態              |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "出貨單更新成功。"
 * }
 * ```
 *
 * @error 400 ID 無效 / 無可更新欄位
 * @error 404 出貨單不存在
 */
declare(strict_types=1);

/**
 * 更新出貨單 API
 * PUT /api/shipping_orders/update.php?id={id}
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
requireAuth();

// 只接受 PUT 請求
requireMethod('PUT');

// 取得 ID
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    jsonResponse(['success' => false, 'message' => '缺少出貨單 ID。'], 400);
}

// 取得請求資料
$input = readShippingOrderPayload();

try {
    $pdo = db();

    // 檢查出貨單是否存在
    $stmt = $pdo->prepare("SELECT * FROM shipping_orders WHERE id = ?");
    $stmt->execute([$id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['success' => false, 'message' => '找不到該出貨單。'], 404);
    }

    $validation = validateShippingOrderData($input, true);
    if (!empty($validation['errors'])) {
        jsonResponse([
            'success' => false,
            'message' => implode('；', array_values($validation['errors'])),
            'errors' => $validation['errors'],
        ], 400);
    }

    $defectSummaryResult = normalizeShippingOrderDefectSummary($input);
    $toolSummaryResult = normalizeShippingOrderToolSummaries($input['tool_summaries'] ?? []);
    $nextShipmentPurpose = (string)($validation['data']['shipment_purpose'] ?? $order['shipment_purpose'] ?? 'normal');
    $businessRuleErrors = validateShippingPhase1BusinessRules($nextShipmentPurpose, $defectSummaryResult['summary']);
    $allErrors = $defectSummaryResult['errors'] + $toolSummaryResult['errors'] + $businessRuleErrors;
    if (!empty($allErrors)) {
        jsonResponse([
            'success' => false,
            'message' => implode('；', array_values($allErrors)),
            'errors' => $allErrors,
        ], 400);
    }

    // 準備更新欄位
    $updateFields = [];
    $params = [];
    $oldStatus = (string)$order['status'];
    $newStatus = (string)($validation['data']['status'] ?? $oldStatus);
    if (!canTransitionShippingOrderStatus($oldStatus, $newStatus)) {
        jsonResponse([
            'success' => false,
            'message' => "不允許將出貨單由 {$oldStatus} 變更為 {$newStatus}。",
            'current_status' => $oldStatus,
            'requested_status' => $newStatus,
            'allowed_status_transitions' => getAllowedShippingOrderTransitions($oldStatus),
            'suggested_action' => '重新載入出貨單，並選擇 allowed_status_transitions 中的下一狀態。',
        ], 409);
    }
    if ($oldStatus !== 'draft') {
        foreach (['customer_id', 'order_id'] as $immutableField) {
            if (
                array_key_exists($immutableField, $validation['data'])
                && (string)($validation['data'][$immutableField] ?? '') !== (string)($order[$immutableField] ?? '')
            ) {
                jsonResponse([
                    'success' => false,
                    'message' => '出貨單離開草稿後不可變更客戶或來源訂單。',
                    'current_status' => $oldStatus,
                    'field' => $immutableField,
                ], 409);
            }
        }
    }
    $hasDefectSummaryInput = array_key_exists('defect_quantity', $input)
        || array_key_exists('defect_weight_per_unit_g', $input)
        || array_key_exists('defect_total_weight_kg', $input)
        || array_key_exists('defect_notes', $input)
        || array_key_exists('defect_source_shipping_order_id', $input)
        || array_key_exists('defect_source_work_order_id', $input)
        || array_key_exists('defect_source_inventory_item_id', $input);
    $hasToolSummariesInput = array_key_exists('tool_summaries', $input);

    $allowedFields = [
        'shipping_order_number', 'order_id', 'customer_id', 'shipping_date',
        'delivery_method', 'consignee_name', 'consignee_address',
        'carrier', 'shipment_purpose', 'tracking_number', 'status', 'notes'
    ];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $validation['data'])) {
            $value = $validation['data'][$field];
            // 空字串轉為 NULL
            if ($value === '') {
                $value = null;
            }
            $updateFields[] = "$field = ?";
            $params[] = $value;
        }
    }

    if (empty($updateFields) && !$hasDefectSummaryInput && !$hasToolSummariesInput) {
        jsonResponse(['success' => false, 'message' => '沒有要更新的欄位。'], 400);
    }

    $pdo->beginTransaction();

    try {
        // 鎖定出貨單，避免兩個狀態請求同時通過舊狀態檢查。
        $lockedOrderStmt = $pdo->prepare("
            SELECT *
            FROM shipping_orders
            WHERE id = ? AND deleted_at IS NULL
            FOR UPDATE
        ");
        $lockedOrderStmt->execute([$id]);
        $lockedOrder = $lockedOrderStmt->fetch(PDO::FETCH_ASSOC);
        if (!$lockedOrder) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '找不到該出貨單。'], 404);
        }
        if ((string)$lockedOrder['status'] !== $oldStatus) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '出貨單狀態已被其他操作更新，請重新載入後再試。',
                'current_status' => (string)$lockedOrder['status'],
            ], 409);
        }

        // ──────────────────────────────────────────────
        // 狀態轉換連動邏輯
        // ──────────────────────────────────────────────

        // 取得所有出貨品項（狀態轉換時需要）
        $itemsStmt = $pdo->prepare("
            SELECT soi.*, ii.inventory_number
            FROM shipping_order_items soi
            LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
            WHERE soi.shipping_order_id = ?
            ORDER BY soi.inventory_item_id ASC, soi.id ASC
        ");
        $itemsStmt->execute([$id]);
        $shippingItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        $currentUserId = getCurrentEmployeeId();
        $inventoryEffect = getShippingOrderInventoryEffect($oldStatus, $newStatus);

        // ── 情境 A：已包裝 → 已出貨 ──
        if ($inventoryEffect === 'ship') {
            if ($shippingItems === []) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '出貨單沒有任何品項，無法出貨。'], 409);
            }

            foreach ($shippingItems as $si) {
                $qty = (float)$si['shipped_quantity'];
                $invId = (int)$si['inventory_item_id'];

                if (!$invId || $qty <= 0) {
                    $pdo->rollBack();
                    jsonResponse(['success' => false, 'message' => '出貨品項缺少有效庫存或數量，無法出貨。'], 409);
                }

                $inventoryStmt = $pdo->prepare("
                    SELECT inventory_number, quantity_on_hand
                    FROM inventory_items
                    WHERE id = ? AND deleted_at IS NULL
                    FOR UPDATE
                ");
                $inventoryStmt->execute([$invId]);
                $inventory = $inventoryStmt->fetch(PDO::FETCH_ASSOC);
                if (!$inventory) {
                    $pdo->rollBack();
                    jsonResponse([
                        'success' => false,
                        'message' => "出貨品項對應的庫存不存在：{$si['inventory_number']}。",
                    ], 409);
                }

                // 扣除其他待出貨單已保留的數量後，本單仍須有足夠庫存。
                $otherAllocationStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(other_soi.shipped_quantity), 0)
                    FROM shipping_order_items other_soi
                    INNER JOIN shipping_orders other_so ON other_so.id = other_soi.shipping_order_id
                    WHERE other_soi.inventory_item_id = ?
                      AND other_soi.shipping_order_id <> ?
                      AND other_so.deleted_at IS NULL
                      AND other_so.status IN ('draft', 'confirmed', 'preparing', 'packed')
                ");
                $otherAllocationStmt->execute([$invId, $id]);
                $otherAllocated = (float)$otherAllocationStmt->fetchColumn();
                $onHand = (float)$inventory['quantity_on_hand'];
                if (($onHand - $otherAllocated) < $qty) {
                    $pdo->rollBack();
                    jsonResponse([
                        'success' => false,
                        'message' => "庫存不足：{$inventory['inventory_number']}，本單可用 " . max(0, $onHand - $otherAllocated) . "，需出貨 {$qty}。",
                    ], 409);
                }

                // 1. 更新庫存數量
                $pdo->prepare("
                    UPDATE inventory_items SET
                        quantity_on_hand = quantity_on_hand - ?,
                        quantity_shipped = quantity_shipped + ?
                    WHERE id = ? AND deleted_at IS NULL
                ")->execute([$qty, $qty, $invId]);

                // 2. 建立庫存異動記錄 (outbound)
                $newOnHand = $onHand - $qty;
                createInventoryTransaction(
                    $pdo,
                    $invId,
                    'shipping_order',
                    $id,
                    'outbound',
                    $qty,
                    $newOnHand,
                    "出貨單 {$order['shipping_order_number']} 出貨",
                    $currentUserId
                );

                // 3. 重新計算庫存狀態
                recalculateInventoryStatus($pdo, $invId);
            }

        }

        // ── 情境 B：出貨取消 (shipped → cancelled) ──
        if ($inventoryEffect === 'reverse_shipment') {
            $returnCountStmt = $pdo->prepare("
                SELECT COUNT(*)
                FROM return_orders
                WHERE original_shipping_order_id = ? AND deleted_at IS NULL
            ");
            $returnCountStmt->execute([$id]);
            if ((int)$returnCountStmt->fetchColumn() > 0) {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'message' => '此出貨單已有退貨紀錄，無法取消出貨；請先依退貨流程完成處理。',
                ], 409);
            }

            foreach ($shippingItems as $si) {
                $qty = (float)$si['shipped_quantity'];
                $invId = (int)$si['inventory_item_id'];

                if (!$invId || $qty <= 0) {
                    continue;
                }

                // 1. 回沖庫存數量
                $pdo->prepare("
                    UPDATE inventory_items SET
                        quantity_on_hand = quantity_on_hand + ?,
                        quantity_shipped = GREATEST(0, quantity_shipped - ?)
                    WHERE id = ? AND deleted_at IS NULL
                ")->execute([$qty, $qty, $invId]);

                // 2. 取得回沖後的在庫數量
                $afterStmt = $pdo->prepare("SELECT quantity_on_hand FROM inventory_items WHERE id = ?");
                $afterStmt->execute([$invId]);
                $afterQty = (float)$afterStmt->fetchColumn();

                // 3. 建立庫存異動記錄 (inbound/沖銷)
                createInventoryTransaction(
                    $pdo,
                    $invId,
                    'shipping_order',
                    $id,
                    'inbound',
                    $qty,
                    $afterQty,
                    "出貨單 {$order['shipping_order_number']} 取消，庫存回沖",
                    $currentUserId
                );

                // 4. 重新計算庫存狀態
                recalculateInventoryStatus($pdo, $invId);
            }

        }

        // ──────────────────────────────────────────────
        // 執行出貨單本身的更新
        // ──────────────────────────────────────────────

        // 加入 updated_at
        $updateFields[] = "updated_at = NOW()";
        $params[] = $id;

        $sql = "UPDATE shipping_orders SET " . implode(', ', $updateFields) . " WHERE id = ?";
        if (!empty($updateFields)) {
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        // 出貨單狀態更新後，再以真實來源重算配貨與訂單出貨統計。
        $affectedInventoryItemIds = array_unique(array_filter(array_map(
            'intval',
            array_column($shippingItems, 'inventory_item_id')
        )));
        foreach ($affectedInventoryItemIds as $inventoryItemId) {
            recalculateInventoryAllocation($pdo, $inventoryItemId);
            recalculateInventoryStatus($pdo, $inventoryItemId);
        }

        $affectedOrderItemIds = array_unique(array_filter(array_map(
            'intval',
            array_column($shippingItems, 'order_item_id')
        )));
        foreach ($affectedOrderItemIds as $orderItemId) {
            recalculateOrderItemShipping($pdo, $orderItemId);
        }

        if ($hasDefectSummaryInput) {
            saveShippingOrderDefectSummary($pdo, $id, $defectSummaryResult['summary']);
        }

        if ($hasToolSummariesInput) {
            replaceShippingOrderToolSummaries($pdo, $id, $toolSummaryResult['summaries']);
        }

        recordWorkflowStatusTransition(
            $pdo,
            'shipping_orders',
            $id,
            $oldStatus,
            $newStatus,
            $currentUserId,
            trim((string)($input['transition_reason'] ?? $input['status_reason'] ?? $input['notes'] ?? '')) ?: null,
            ['inventory_effect' => $inventoryEffect]
        );

        $pdo->commit();

        // 回傳更新後的資料
        $updatedOrder = findShippingOrder($pdo, $id);
        $responseOrder = $updatedOrder ? transformShippingOrder($updatedOrder) : null;
        if ($responseOrder) {
            $responseOrder['defect_summary'] = fetchShippingOrderDefectSummary($pdo, $id);
            $responseOrder['tool_summaries'] = fetchShippingOrderToolSummaries($pdo, $id);
        }

        jsonResponse([
            'success' => true,
            'message' => '出貨單已更新。',
            'order' => $responseOrder,
            'data' => $responseOrder,
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    error_log('Shipping order update failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')
    ], 500);
}
