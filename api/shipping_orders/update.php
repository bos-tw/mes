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
    $oldStatus = $order['status'];
    $newStatus = $input['status'] ?? $oldStatus;
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
        // ──────────────────────────────────────────────
        // 狀態轉換連動邏輯
        // ──────────────────────────────────────────────

        // 取得所有出貨品項（狀態轉換時需要）
        $itemsStmt = $pdo->prepare("
            SELECT soi.*, ii.quantity_on_hand, ii.inventory_number
            FROM shipping_order_items soi
            LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
            WHERE soi.shipping_order_id = ?
        ");
        $itemsStmt->execute([$id]);
        $shippingItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        $currentUserId = getCurrentEmployeeId();

        // ── 情境 A：出貨確認 (任何狀態 → shipped) ──
        if ($oldStatus !== 'shipped' && $newStatus === 'shipped') {

            foreach ($shippingItems as $si) {
                $qty = (float)$si['shipped_quantity'];
                $invId = (int)$si['inventory_item_id'];

                if (!$invId || $qty <= 0) {
                    continue;
                }

                // 前置檢查：庫存是否足夠
                $onHand = (float)$si['quantity_on_hand'];
                if ($onHand < $qty) {
                    $pdo->rollBack();
                    jsonResponse([
                        'success' => false,
                        'message' => "庫存不足：{$si['inventory_number']}，在庫 {$onHand}，需出貨 {$qty}。"
                    ], 400);
                }

                // 1. 更新庫存數量
                $pdo->prepare("
                    UPDATE inventory_items SET
                        quantity_on_hand = quantity_on_hand - ?,
                        quantity_allocated = GREATEST(0, quantity_allocated - ?),
                        quantity_shipped = quantity_shipped + ?
                    WHERE id = ? AND deleted_at IS NULL
                ")->execute([$qty, $qty, $qty, $invId]);

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

            // 4. 重新計算所有相關訂單品項的出貨統計
            $affectedOrderItemIds = array_unique(array_filter(array_column($shippingItems, 'order_item_id')));
            foreach ($affectedOrderItemIds as $oiId) {
                recalculateOrderItemShipping($pdo, (int)$oiId);
            }
        }

        // ── 情境 B：出貨取消 (shipped → cancelled) ──
        if ($oldStatus === 'shipped' && $newStatus === 'cancelled') {

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

            // 5. 重新計算所有相關訂單品項的出貨統計
            $affectedOrderItemIds = array_unique(array_filter(array_column($shippingItems, 'order_item_id')));
            foreach ($affectedOrderItemIds as $oiId) {
                recalculateOrderItemShipping($pdo, (int)$oiId);
            }
        }

        // ── 情境 C：退回草稿 (confirmed/其他 → draft) ──
        //    釋放已分配的庫存（原有邏輯保留並增強）
        if ($oldStatus !== 'draft' && $newStatus === 'draft') {
            foreach ($shippingItems as $si) {
                $qty = (float)$si['shipped_quantity'];
                $invId = (int)$si['inventory_item_id'];

                if (!$invId || $qty <= 0) {
                    continue;
                }

                $pdo->prepare("
                    UPDATE inventory_items
                    SET quantity_allocated = GREATEST(0, quantity_allocated - ?)
                    WHERE id = ?
                ")->execute([$qty, $invId]);

                recalculateInventoryStatus($pdo, $invId);
            }

            // 重新計算所有相關訂單品項的出貨統計
            $affectedOrderItemIds = array_unique(array_filter(array_column($shippingItems, 'order_item_id')));
            foreach ($affectedOrderItemIds as $oiId) {
                recalculateOrderItemShipping($pdo, (int)$oiId);
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

        if ($hasDefectSummaryInput) {
            saveShippingOrderDefectSummary($pdo, $id, $defectSummaryResult['summary']);
        }

        if ($hasToolSummariesInput) {
            replaceShippingOrderToolSummaries($pdo, $id, $toolSummaryResult['summaries']);
        }

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
