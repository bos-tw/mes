<?php
/**
 * 工單管理 API - 更新
 *
 * 更新指定工單資料，包含篩選不良記錄、首件尺寸、生產記錄等。
 *
 * @endpoint PUT/PATCH /api/work_orders/update.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 工單 ID |
 *
 * @input JSON Body:
 * | 參數                    | 類型     | 必填 | 說明                  |
 * |------------------------|----------|-----|----------------------|
 * | machine_id             | int      | 否  | 機台 ID               |
 * | machine_sequence       | int      | 否  | 機台內排序序號         |
 * | assigned_employee_id   | int      | 否  | 指定員工 ID           |
 * | actual_start_date      | datetime | 否  | 實際開始日期            |
 * | actual_end_date        | datetime | 否  | 實際結束日期            |
 * | status_lookup_id       | int      | 否  | 狀態 lookup ID        |
 * | screening_defects      | array    | 否  | 篩選不良記錄            |
 * | first_piece_dimensions | object   | 否  | 首件尺寸資料            |
 * | production_records     | array    | 否  | 生產記錄              |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "工單更新成功。",
 *   "data": { ... }
 * }
 * ```
 *
 * @error 400 ID 無效 / 沒有可更新的資料
 * @error 404 工單不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

/**
 * Work Order Update API Endpoint
 *
 * PUT/PATCH - Update work order
 */

requireAuth();

requireMethod(['PUT', 'PATCH']);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
}

$payload = readWorkOrderPayload();

// 控制狀態改為已完成時，是否同步建立庫存項目。未傳入時沿用既有行為：自動建立。
$autoCreateInventory = true;
if (array_key_exists('auto_create_inventory', $payload)) {
    $autoCreateInventory = filter_var($payload['auto_create_inventory'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    $autoCreateInventory = $autoCreateInventory !== false ? true : false;
    unset($payload['auto_create_inventory']);
}

$deleteInventoryOnReopen = false;
if (array_key_exists('delete_inventory_on_reopen', $payload)) {
    $deleteInventoryOnReopen = filter_var($payload['delete_inventory_on_reopen'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === true;
    unset($payload['delete_inventory_on_reopen']);
}

// 提取 screening_defects (如果存在)
$screeningDefects = $payload['screening_defects'] ?? [];
unset($payload['screening_defects']); // 從主 payload 中移除

// 提取 production_records (如果存在)
$productionRecords = $payload['production_records'] ?? [];
unset($payload['production_records']); // 從主 payload 中移除
$productionRecords = is_array($productionRecords) ? filterMeaningfulProductionRecords($productionRecords) : [];

$machineRunsProvided = array_key_exists('machine_runs', $payload);
$machineRunsPayload = $payload['machine_runs'] ?? [];
unset($payload['machine_runs']);
$machineRunsPayload = is_array($machineRunsPayload) ? $machineRunsPayload : [];

$validation = validateWorkOrderData($payload, true);

if (!empty($validation['errors'])) {
    jsonResponse([
        'success' => false,
        'message' => '資料驗證失敗。',
        'errors' => $validation['errors']
    ], 400);
    return;
}

$data = $validation['data'];

// 提取 first_piece_dimensions (如果存在)
$firstPieceDimensions = $data['first_piece_dimensions'] ?? null;
unset($data['first_piece_dimensions']); // 從主 data 中移除
if (!is_array($firstPieceDimensions) || !isMeaningfulFirstPieceDimension($firstPieceDimensions)) {
    $firstPieceDimensions = null;
}

if (empty($data) && empty($screeningDefects) && empty($firstPieceDimensions) && empty($productionRecords) && !$machineRunsProvided) {
    jsonResponse(['success' => false, 'message' => '沒有可更新的資料。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    // Check if work order exists and get current status
    $checkStmt = $pdo->prepare("SELECT id, status, status_lookup_id, completed_at, order_item_id, work_order_type, total_units, total_weight_kg, weight_per_unit_g, tool_statistics, machine_id, machine_sequence FROM work_orders WHERE id = :id AND deleted_at IS NULL");
    $checkStmt->execute(['id' => $id]);
    $existingWorkOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existingWorkOrder) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }

    $oldStatusLookupId = (int)$existingWorkOrder['status_lookup_id'];
    $newStatusLookupId = isset($data['status_lookup_id']) ? (int)$data['status_lookup_id'] : $oldStatusLookupId;
    $oldIsCompleted = isCompletedWorkOrderStatus($pdo, $oldStatusLookupId, $existingWorkOrder['status'] ?? null);
    $newIsCompleted = isCompletedWorkOrderStatus($pdo, $newStatusLookupId, $data['status'] ?? $existingWorkOrder['status'] ?? null);
    $hasCompletedAt = !empty($existingWorkOrder['completed_at']);

    if ($newIsCompleted && !$hasCompletedAt) {
        $data['completed_at'] = date('Y-m-d H:i:s');
        $hasCompletedAt = true;
    }

    $targetWorkOrderType = (string)($data['work_order_type'] ?? $existingWorkOrder['work_order_type'] ?? 'normal');
    $validatedMachineRuns = [];
    if ($machineRunsProvided || $targetWorkOrderType === 'split') {
        $expectedNetWeightKg = (float)($data['total_weight_kg'] ?? $existingWorkOrder['total_weight_kg'] ?? 0);
        $unitWeightG = (float)($data['weight_per_unit_g'] ?? $existingWorkOrder['weight_per_unit_g'] ?? 0);
        $machineRunValidation = validateWorkOrderMachineRuns($machineRunsPayload, $expectedNetWeightKg, $unitWeightG);
        if (!empty($machineRunValidation['errors'])) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '拆分機台資料驗證失敗。',
                'errors' => $machineRunValidation['errors'],
            ], 400);
            return;
        }
        $validatedMachineRuns = $machineRunValidation['runs'];
        if ($targetWorkOrderType === 'split' && $validatedMachineRuns === []) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '拆分工單至少需要 1 個機台頁籤。',
            ], 400);
            return;
        }
    }

    // Build UPDATE query (只有在有工單欄位資料時才執行)
    if (!empty($data)) {
        // 使用反引號包裹列名,避免與 MySQL 保留字衝突 (如 status)
        $setClauses = [];
        foreach (array_keys($data) as $column) {
            $setClauses[] = "`{$column}` = :{$column}";
        }

        $sql = sprintf(
            "UPDATE work_orders SET %s WHERE id = :id",
            implode(', ', $setClauses)
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($data, ['id' => $id]));
    }

    $oldMachineId = isset($existingWorkOrder['machine_id']) && $existingWorkOrder['machine_id'] !== null
        ? (int)$existingWorkOrder['machine_id']
        : null;
    $newMachineId = array_key_exists('machine_id', $data)
        ? ($data['machine_id'] !== null ? (int)$data['machine_id'] : null)
        : $oldMachineId;
    $requestedMachineSequence = array_key_exists('machine_sequence', $data)
        ? ($data['machine_sequence'] !== null ? (int)$data['machine_sequence'] : null)
        : null;
    $machineIdWasUpdated = array_key_exists('machine_id', $data);
    $sequenceWasUpdated = array_key_exists('machine_sequence', $data);

    $resolvedMachineSequence = syncWorkOrderMachineSequence(
        $pdo,
        $id,
        $oldMachineId,
        $newMachineId,
        $requestedMachineSequence,
        $machineIdWasUpdated,
        $sequenceWasUpdated
    );

    // 處理首件尺寸檢驗 (First Piece Dimensions)
    if ($firstPieceDimensions !== null && !empty($firstPieceDimensions)) {
        // Check if record exists
        $checkFpStmt = $pdo->prepare("SELECT id FROM work_order_first_piece_dimensions WHERE work_order_id = :work_order_id");
        $checkFpStmt->execute(['work_order_id' => $id]);
        $fpId = $checkFpStmt->fetchColumn();

        if ($fpId) {
            // Update
            $fpSetClauses = [];
            foreach (array_keys($firstPieceDimensions) as $col) {
                $fpSetClauses[] = "`{$col}` = :{$col}";
            }
            $fpSql = sprintf(
                "UPDATE work_order_first_piece_dimensions SET %s WHERE id = :id",
                implode(', ', $fpSetClauses)
            );
            $fpStmt = $pdo->prepare($fpSql);
            $firstPieceDimensions['id'] = $fpId;
            $fpStmt->execute($firstPieceDimensions);
        } else {
            // Insert
            $fpColumns = array_keys($firstPieceDimensions);
            $fpColumns[] = 'work_order_id';
            $firstPieceDimensions['work_order_id'] = $id;

            $fpColumnNames = array_map(function($col) { return "`{$col}`"; }, $fpColumns);
            $fpPlaceholders = array_map(function($col) { return ":{$col}"; }, $fpColumns);

            $fpSql = sprintf(
                "INSERT INTO work_order_first_piece_dimensions (%s) VALUES (%s)",
                implode(', ', $fpColumnNames),
                implode(', ', $fpPlaceholders)
            );
            $fpStmt = $pdo->prepare($fpSql);
            $fpStmt->execute($firstPieceDimensions);
        }
    }

    // 處理篩分服務缺陷數量更新
    if (is_array($screeningDefects)) {
        // 先刪除現有的缺陷記錄
        $deleteStmt = $pdo->prepare("DELETE FROM work_order_screening_defects WHERE work_order_id = :work_order_id");
        $deleteStmt->execute(['work_order_id' => $id]);

        // 重新插入新的缺陷數量
        if (!empty($screeningDefects)) {
            $currentEmployee = $_SESSION['employee'] ?? null;
            $currentUserId = $currentEmployee ? $currentEmployee['id'] : null;
            $currentTime = date('Y-m-d H:i:s');

            $defectSql = "
                INSERT INTO work_order_screening_defects
                (work_order_id, screening_service_id, service_name, defect_quantity, recorded_at, recorded_by_employee_id)
                VALUES (:work_order_id, :screening_service_id, :service_name, :defect_quantity, :recorded_at, :recorded_by_employee_id)
            ";
            $defectStmt = $pdo->prepare($defectSql);

            foreach ($screeningDefects as $defect) {
                if (!isset($defect['screening_service_id']) || !isset($defect['defect_quantity'])) {
                    continue;
                }

                $serviceId = (int)$defect['screening_service_id'];
                $defectQuantity = (int)$defect['defect_quantity'];

                // 查詢 service_name
                $serviceStmt = $pdo->prepare("SELECT name FROM screening_services WHERE id = :id");
                $serviceStmt->execute(['id' => $serviceId]);
                $serviceName = $serviceStmt->fetchColumn() ?: '';

                $defectStmt->execute([
                    'work_order_id' => $id,
                    'screening_service_id' => $serviceId,
                    'service_name' => $serviceName,
                    'defect_quantity' => $defectQuantity,
                    'recorded_at' => $currentTime,
                    'recorded_by_employee_id' => $currentUserId
                ]);
            }
        }
    }

    // 處理一般工單生產紀錄；拆分工單的履歷由各機台頁籤明細寫入。
    $productionRecordCount = 0;
    if (is_array($productionRecords)) {
        // 先刪除現有的生產紀錄
        $deletePrStmt = $pdo->prepare("DELETE FROM production_records WHERE work_order_id = :work_order_id");
        $deletePrStmt->execute(['work_order_id' => $id]);

        // 重新插入新的生產紀錄
        if ($targetWorkOrderType !== 'split' && !empty($productionRecords)) {
            $productionRecordCount = insertWorkOrderProductionRecords($pdo, $id, $productionRecords);
        }
    }

    if ($machineRunsProvided || $targetWorkOrderType === 'split' || (array_key_exists('work_order_type', $data) && $targetWorkOrderType === 'normal')) {
        $machineRunReplacement = canReplaceWorkOrderMachineRuns($pdo, $id);
        if (!$machineRunReplacement['allowed']) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => $machineRunReplacement['message'],
                'workflow_guard' => [
                    'allowed' => false,
                    'recommended_action' => 'partial_receipt_reversal_or_settlement',
                    'impacts' => $machineRunReplacement['details'],
                ],
            ], 409);
            return;
        }

        replaceWorkOrderMachineRuns($pdo, $id, $validatedMachineRuns);
        if ($targetWorkOrderType === 'split') {
            foreach ($validatedMachineRuns as $machineRun) {
                $productionRecordCount += count(filterMeaningfulProductionRecords($machineRun['production_records'] ?? []));
            }
        }
        if (($existingWorkOrder['work_order_type'] ?? 'normal') !== 'split' && $targetWorkOrderType === 'split') {
            logAuditAction('Converted work order to split mode', 'work_orders', $id, [
                'previous_work_order_type' => $existingWorkOrder['work_order_type'] ?? 'normal',
                'target_work_order_type' => $targetWorkOrderType,
                'machine_runs_count' => count($validatedMachineRuns),
            ]);
        }
        logAuditAction('Updated split work order machine runs', 'work_orders', $id, [
            'previous_work_order_type' => $existingWorkOrder['work_order_type'] ?? 'normal',
            'target_work_order_type' => $targetWorkOrderType,
            'machine_runs_count' => count($validatedMachineRuns),
        ]);
    }

    $createdInventoryItemId = null;
    $deletedInventoryItemId = null;

    // ===== 工單完工 → 依使用者選擇建立庫存品項 =====
    $isCompletingNow = ($newIsCompleted && !$oldIsCompleted);
    $isReopeningCompleted = ($oldIsCompleted && !$newIsCompleted);

    if ($isReopeningCompleted && $deleteInventoryOnReopen) {
        require_once __DIR__ . '/../inventory_items/helpers.php';

        $inventoryStmt = $pdo->prepare("
            SELECT id
            FROM inventory_items
            WHERE work_order_id = :work_order_id AND deleted_at IS NULL
            LIMIT 1
        ");
        $inventoryStmt->execute(['work_order_id' => $id]);
        $inventoryItemId = (int)($inventoryStmt->fetchColumn() ?: 0);

        if ($inventoryItemId > 0) {
            $canDelete = canDeleteInventoryItem($pdo, $inventoryItemId, [
                'allow_work_order_source_delete' => true,
            ]);
            if (!$canDelete['can_delete']) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => $canDelete['reason']], 400);
            }

            $deleteInventoryStmt = $pdo->prepare("
                UPDATE inventory_items
                SET deleted_at = NOW(), delete_token = id
                WHERE id = :id AND deleted_at IS NULL
            ");
            $deleteInventoryStmt->execute(['id' => $inventoryItemId]);
            $deletedInventoryItemId = $inventoryItemId;
        }
    }

    if ($isCompletingNow && $autoCreateInventory) {
        // 檢查是否已為此工單建立過庫存（避免重複）
        $checkInvSql = $targetWorkOrderType === 'split'
            ? "SELECT id FROM inventory_items WHERE work_order_id = :woid AND deleted_at IS NULL AND receipt_type IN ('standard', 'final') LIMIT 1"
            : "SELECT id FROM inventory_items WHERE work_order_id = :woid AND deleted_at IS NULL LIMIT 1";
        $checkInvStmt = $pdo->prepare($checkInvSql);
        $checkInvStmt->execute(['woid' => $id]);
        $existingInv = $checkInvStmt->fetchColumn();

        if (!$existingInv) {
            // 取得訂單項目和客戶資訊
            $orderItemStmt = $pdo->prepare("
                SELECT oi.id AS order_item_id, oi.order_id, oi.screening_item_id,
                       oi.customer_batch_number, o.customer_id
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.id = :oiid
            ");
            $orderItemStmt->execute(['oiid' => $existingWorkOrder['order_item_id']]);
            $orderItemInfo = $orderItemStmt->fetch(PDO::FETCH_ASSOC);

            if ($orderItemInfo) {
                $orderItemMetrics = fetchOrderItemDetailsForWorkOrder($pdo, (int)$existingWorkOrder['order_item_id']) ?? [];

                // 計算良品/不良品數量
                $defectStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(defect_quantity), 0) FROM work_order_screening_defects WHERE work_order_id = :woid
                ");
                $defectStmt->execute(['woid' => $id]);
                $totalDefects = (float)$defectStmt->fetchColumn();

                $totalUnits = (float)(
                    $data['total_units']
                    ?? $existingWorkOrder['total_units']
                    ?? $orderItemMetrics['total_units']
                    ?? 0
                );
                $totalGoodUnits = max(0, $totalUnits - $totalDefects);

                // 取得重量資料（可能從最新的 data 或既有欄位）
                $totalWeightKg = (float)(
                    $data['total_weight_kg']
                    ?? $existingWorkOrder['total_weight_kg']
                    ?? $orderItemMetrics['net_weight']
                    ?? 0
                );
                $weightPerUnitG = (float)(
                    $data['weight_per_unit_g']
                    ?? $existingWorkOrder['weight_per_unit_g']
                    ?? $orderItemMetrics['weight_per_unit_g']
                    ?? 0
                );
                $toolStatistics = $data['tool_statistics']
                    ?? $existingWorkOrder['tool_statistics']
                    ?? $orderItemMetrics['tool_statistics']
                    ?? null;
                $toolWeightKg = (float)($orderItemMetrics['total_tool_weight'] ?? 0);
                $totalToolQuantity = (int)($orderItemMetrics['tool_quantity'] ?? 0);

                $receiptType = $targetWorkOrderType === 'split' ? 'final' : 'standard';
                $partialReceivedNetWeightKg = 0.0;
                $partialReceivedUnits = 0.0;
                if ($targetWorkOrderType === 'split') {
                    $partialStmt = $pdo->prepare("
                        SELECT
                            COALESCE(SUM(net_weight_kg), 0) AS received_net_weight_kg,
                            COALESCE(SUM(calculated_units), 0) AS received_units
                        FROM work_order_partial_receipts
                        WHERE work_order_id = :work_order_id
                          AND receipt_status != 'reversed'
                    ");
                    $partialStmt->execute(['work_order_id' => $id]);
                    $partialSummary = $partialStmt->fetch(PDO::FETCH_ASSOC) ?: [];
                    $partialReceivedNetWeightKg = round((float)($partialSummary['received_net_weight_kg'] ?? 0), 2);
                    $partialReceivedUnits = round((float)($partialSummary['received_units'] ?? 0), 2);

                    if ($partialReceivedNetWeightKg - $totalWeightKg > 0.0001) {
                        $pdo->rollBack();
                        jsonResponse([
                            'success' => false,
                            'message' => "部分入庫淨重 {$partialReceivedNetWeightKg} kg 已超過主工單預期淨重 {$totalWeightKg} kg，無法完成工單。",
                        ], 409);
                        return;
                    }
                }

                // 計算淨重（良品重量）。拆分工單最終入庫只補入尚未部分入庫的剩餘淨重。
                if ($targetWorkOrderType === 'split') {
                    $netWeightKg = round(max(0, $totalWeightKg - $partialReceivedNetWeightKg), 2);
                    $totalGoodUnits = $weightPerUnitG > 0 ? round($netWeightKg * 1000 / $weightPerUnitG, 2) : max(0, $totalGoodUnits - $partialReceivedUnits);
                    $totalDefectsForInventory = 0.0;
                } else {
                    $netWeightKg = $weightPerUnitG > 0 ? round($totalGoodUnits * $weightPerUnitG / 1000, 2) : $totalWeightKg;
                    $totalDefectsForInventory = $totalDefects;
                }
                $grossWeightKg = round($netWeightKg + $toolWeightKg, 2);

                $currentEmployee = $_SESSION['employee'] ?? null;
                $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;

                if ($netWeightKg > 0.0001 && $totalGoodUnits > 0.0001) {
                    // 產生庫存編號
                    require_once __DIR__ . '/../inventory_items/helpers.php';
                    $inventoryNumber = generateInventoryNumber($pdo);

                    // 建立庫存品項
                    $insertInvSql = "
                        INSERT INTO inventory_items (
                            screening_item_id, inventory_number, receipt_type, work_order_id,
                            order_item_id, order_id, customer_id, customer_batch_number,
                            total_good_units, total_defect_units,
                            quantity_on_hand, quantity_allocated, quantity_reserved, quantity_shipped,
                            net_weight_kg, gross_weight_kg, tool_weight_kg, weight_per_unit_g,
                            tool_statistics, total_tool_quantity,
                            quality_status, status, received_at, created_by_employee_id
                        ) VALUES (
                            :screening_item_id, :inventory_number, :receipt_type, :work_order_id,
                            :order_item_id, :order_id, :customer_id, :customer_batch_number,
                            :total_good_units, :total_defect_units,
                            :quantity_on_hand, 0, 0, 0,
                            :net_weight_kg, :gross_weight_kg, :tool_weight_kg, :weight_per_unit_g,
                            :tool_statistics, :total_tool_quantity,
                            'pending', 'in_stock', NOW(), :created_by
                        )
                    ";
                    $insertInvStmt = $pdo->prepare($insertInvSql);
                    $insertInvStmt->execute([
                        'screening_item_id' => (int)$orderItemInfo['screening_item_id'],
                        'inventory_number' => $inventoryNumber,
                        'receipt_type' => $receiptType,
                        'work_order_id' => $id,
                        'order_item_id' => (int)$orderItemInfo['order_item_id'],
                        'order_id' => (int)$orderItemInfo['order_id'],
                        'customer_id' => (int)$orderItemInfo['customer_id'],
                        'customer_batch_number' => $orderItemInfo['customer_batch_number'],
                        'total_good_units' => $totalGoodUnits,
                        'total_defect_units' => $totalDefectsForInventory,
                        'quantity_on_hand' => $totalGoodUnits,
                        'net_weight_kg' => $netWeightKg,
                        'gross_weight_kg' => $grossWeightKg,
                        'tool_weight_kg' => $targetWorkOrderType === 'split' ? 0 : $toolWeightKg,
                        'weight_per_unit_g' => $weightPerUnitG,
                        'tool_statistics' => $toolStatistics,
                        'total_tool_quantity' => $targetWorkOrderType === 'split' ? 0 : $totalToolQuantity,
                        'created_by' => $currentUserId,
                    ]);

                    $invId = (int)$pdo->lastInsertId();
                    $createdInventoryItemId = $invId;

                    // 建立入庫交易記錄
                    $txnId = getNextInventoryTransactionId($pdo);
                    $txnSql = "
                        INSERT INTO inventory_transactions (
                            id, inventory_item_id, order_id, order_item_id, work_order_id,
                            ref_type, ref_id, direction, quantity, after_quantity,
                            notes, created_by_employee_id
                        ) VALUES (
                            :id, :inv_id, :order_id, :order_item_id, :work_order_id,
                            :ref_type, :ref_id, 'inbound', :qty, :after_qty,
                            :notes, :created_by
                        )
                    ";
                    $txnStmt = $pdo->prepare($txnSql);
                    $txnStmt->execute([
                        'id' => $txnId,
                        'inv_id' => $invId,
                        'order_id' => (int)$orderItemInfo['order_id'],
                        'order_item_id' => (int)$orderItemInfo['order_item_id'],
                        'work_order_id' => $id,
                        'ref_type' => $targetWorkOrderType === 'split' ? 'work_order_final_receipt' : 'work_order',
                        'ref_id' => $id,
                        'qty' => $totalGoodUnits,
                        'after_qty' => $totalGoodUnits,
                        'notes' => $targetWorkOrderType === 'split'
                            ? "拆分工單最終補入庫，剩餘淨重 {$netWeightKg} kg / {$totalGoodUnits} 支，已部分入庫 {$partialReceivedNetWeightKg} kg / {$partialReceivedUnits} 支"
                            : "工單完工自動入庫，良品 {$totalGoodUnits}，不良品 {$totalDefects}",
                        'created_by' => $currentUserId,
                    ]);
                }

                if ($targetWorkOrderType === 'split') {
                    $settleStmt = $pdo->prepare("
                        UPDATE work_order_partial_receipts
                        SET receipt_status = 'settled',
                            settled_at = COALESCE(settled_at, NOW()),
                            settled_by_employee_id = COALESCE(settled_by_employee_id, :employee_id)
                        WHERE work_order_id = :work_order_id
                          AND receipt_status = 'partial'
                    ");
                    $settleStmt->execute([
                        'employee_id' => $currentUserId,
                        'work_order_id' => $id,
                    ]);
                    logAuditAction('Settled split work order partial receipts', 'work_orders', $id, [
                        'settled_receipt_count' => $settleStmt->rowCount(),
                        'final_net_weight_kg' => $netWeightKg,
                        'partial_received_net_weight_kg' => $partialReceivedNetWeightKg,
                    ]);
                }
            }
        }
    }

    // Log audit
    logAuditAction('Updated work order', 'work_orders', $id, array_merge($data, [
        'screening_defects_count' => count($screeningDefects),
        'production_records_count' => $productionRecordCount,
        'machine_runs_count' => count($validatedMachineRuns),
    ]));

    $pdo->commit();

    $inventoryStmt = $pdo->prepare("
        SELECT id
        FROM inventory_items
        WHERE work_order_id = :work_order_id AND deleted_at IS NULL
        LIMIT 1
    ");
    $inventoryStmt->execute(['work_order_id' => $id]);
    $currentInventoryItemId = $inventoryStmt->fetchColumn();

    jsonResponse([
        'success' => true,
        'message' => '工單更新成功。',
        'data' => [
            'id' => $id,
            'machine_id' => $newMachineId,
            'machine_sequence' => $resolvedMachineSequence,
            'status_lookup_id' => $newStatusLookupId,
            'inventory_created' => $createdInventoryItemId !== null,
            'inventory_deleted' => $deletedInventoryItemId !== null,
            'inventory_item_id' => $currentInventoryItemId ? (int)$currentInventoryItemId : null,
            'deleted_inventory_item_id' => $deletedInventoryItemId,
            'has_inventory' => $currentInventoryItemId ? 1 : 0,
        ],
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    logAuditAction('Error: 更新工單失敗。', 'WorkOrders', $id, $data);
    error_log('Work order update failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '更新工單失敗，請稍後重試。')
    ], 500);
}
