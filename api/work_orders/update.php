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
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

/**
 * Work Order Update API Endpoint
 *
 * PUT/PATCH - Update work order
 */

requireAuth();

requireMethod(['PUT', 'PATCH']);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$employeePermissions = (array)(($_SESSION['employee']['permissions'] ?? []));

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

$shortagePayload = [];
if (isset($payload['completion_shortage']) && is_array($payload['completion_shortage'])) {
    $shortagePayload = $payload['completion_shortage'];
}
foreach ([
    'completion_shortage',
    'shortage_reason_code',
    'shortage_notes',
    'shortage_net_weight_kg',
    'shortage_units',
    'shortage_confirmed_by',
    'shortage_confirmed_at',
] as $shortageField) {
    if (array_key_exists($shortageField, $payload)) {
        if ($shortageField !== 'completion_shortage') {
            $shortagePayload[$shortageField] = $payload[$shortageField];
        }
        unset($payload[$shortageField]);
    }
}

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
    $oldStatusSnapshot = resolveWorkOrderStatusSnapshot($pdo, $oldStatusLookupId, $existingWorkOrder['status'] ?? null);
    $newStatusSnapshot = resolveWorkOrderStatusSnapshot($pdo, $newStatusLookupId, $data['status'] ?? $existingWorkOrder['status'] ?? null);
    $oldIsCompleted = isCompletedWorkOrderStatus($pdo, $oldStatusLookupId, $existingWorkOrder['status'] ?? null);
    $newIsCompleted = isCompletedWorkOrderStatus($pdo, $newStatusLookupId, $data['status'] ?? $existingWorkOrder['status'] ?? null);
    $hasCompletedAt = !empty($existingWorkOrder['completed_at']);

    if ($newIsCompleted && !$hasCompletedAt) {
        $data['completed_at'] = date('Y-m-d H:i:s');
        $hasCompletedAt = true;
    } elseif (!$newIsCompleted && $hasCompletedAt) {
        $data['completed_at'] = null;
        $hasCompletedAt = false;
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
                (work_order_id, screening_service_id, service_name, defect_quantity, recorded_at, recorded_by_employee_id, notes)
                VALUES (:work_order_id, :screening_service_id, :service_name, :defect_quantity, :recorded_at, :recorded_by_employee_id, :notes)
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
                $notes = trim((string)($defect['notes'] ?? ''));

                $defectStmt->execute([
                    'work_order_id' => $id,
                    'screening_service_id' => $serviceId,
                    'service_name' => $serviceName,
                    'defect_quantity' => $defectQuantity,
                    'recorded_at' => $currentTime,
                    'recorded_by_employee_id' => $currentUserId,
                    'notes' => $notes === '' ? null : $notes
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
    $completionSummary = null;

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
        $reopenReceiptStmt = $pdo->prepare("
            UPDATE work_order_partial_receipts
            SET
                receipt_status = 'partial',
                settled_at = NULL,
                settled_by_employee_id = NULL
            WHERE work_order_id = :work_order_id
              AND receipt_status = 'settled'
        ");
        $reopenReceiptStmt->execute(['work_order_id' => $id]);

        $clearShortageStmt = $pdo->prepare("
            UPDATE work_orders
            SET
                shortage_net_weight_kg = NULL,
                shortage_units = NULL,
                shortage_reason_code = NULL,
                shortage_notes = NULL,
                shortage_confirmed_by = NULL,
                shortage_confirmed_at = NULL
            WHERE id = :id
        ");
        $clearShortageStmt->execute(['id' => $id]);
    }

    if ($isCompletingNow) {
        $orderItemStmt = $pdo->prepare("
            SELECT oi.id AS order_item_id, oi.order_id, oi.screening_item_id,
                   oi.customer_batch_number, o.customer_id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = :oiid
        ");
        $orderItemStmt->execute(['oiid' => $existingWorkOrder['order_item_id']]);
        $orderItemInfo = $orderItemStmt->fetch(PDO::FETCH_ASSOC);

        if (!$orderItemInfo) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '找不到工單對應的訂單品項，無法完成工單。'], 409);
            return;
        }

        $orderItemMetrics = fetchOrderItemDetailsForWorkOrder($pdo, (int)$existingWorkOrder['order_item_id']) ?? [];
        $expectedNetWeightKg = round((float)(
            $data['total_weight_kg']
            ?? $existingWorkOrder['total_weight_kg']
            ?? $orderItemMetrics['net_weight']
            ?? 0
        ), 2);
        $weightPerUnitG = round((float)(
            $data['weight_per_unit_g']
            ?? $existingWorkOrder['weight_per_unit_g']
            ?? $orderItemMetrics['weight_per_unit_g']
            ?? 0
        ), 3);
        if ($expectedNetWeightKg <= 0 || $weightPerUnitG <= 0) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '工單缺少預期淨重或單支重，無法完成工單。'], 400);
            return;
        }

        $productionSummary = fetchWorkOrderProductionSummary($pdo, $id, $targetWorkOrderType, $weightPerUnitG);
        $partialReceiptLedger = fetchWorkOrderPartialReceiptLedger($pdo, $id);
        $partialSummary = $partialReceiptLedger['summary'];
        $partialReceivedNetWeightKg = round((float)($partialSummary['partial_received_net_weight_kg'] ?? 0), 2);
        $partialReceivedUnits = (float)round((float)($partialSummary['partial_received_units'] ?? 0), 0);
        $producedNetWeightKg = round((float)($productionSummary['produced_net_weight_kg'] ?? 0), 2);

        if ($producedNetWeightKg - $expectedNetWeightKg > 0.0001) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => "本次完工良品淨重 {$producedNetWeightKg} kg 超過工單預期淨重 {$expectedNetWeightKg} kg。請先檢查生產紀錄或機台完成重量。",
            ], 409);
            return;
        }

        if ($partialReceivedNetWeightKg - $producedNetWeightKg > 0.0001) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => "已部分入庫淨重 {$partialReceivedNetWeightKg} kg 超過本次完工良品淨重 {$producedNetWeightKg} kg，無法完成工單。請先檢查生產紀錄或走部分入庫更正流程。",
            ], 409);
            return;
        }

        $shortageNetWeightKg = round(max($expectedNetWeightKg - $producedNetWeightKg, 0), 2);
        $shortageUnits = workOrderUnitsFromWeight($shortageNetWeightKg, $weightPerUnitG);
        $shortageReasonCode = trim((string)($shortagePayload['shortage_reason_code'] ?? ''));
        $shortageNotes = trim((string)($shortagePayload['shortage_notes'] ?? ''));
        $allowedShortageReasonCodes = ['material_loss', 'mixed_material', 'damaged', 'count_error', 'other'];

        if ($shortageNetWeightKg > 0.0001) {
            if ($employeePermissions !== [] && !hasAnyPermission(['work_orders.confirm_shortage', 'manage_work_orders'])) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '您沒有確認工單短缺的權限。'], 403);
                return;
            }
            if ($shortageReasonCode === '' || !in_array($shortageReasonCode, $allowedShortageReasonCodes, true)) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '真實短缺必須選擇有效原因。'], 400);
                return;
            }
            if ($shortageReasonCode === 'other' && $shortageNotes === '') {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '短缺原因選擇其他時，請補充說明。'], 400);
                return;
            }
        } else {
            $shortageReasonCode = '';
            $shortageNotes = '';
        }

        $finalNetWeightKg = round(max($producedNetWeightKg - $partialReceivedNetWeightKg, 0), 2);
        $finalUnits = workOrderUnitsFromWeight($finalNetWeightKg, $weightPerUnitG);

        if (!$autoCreateInventory && $finalNetWeightKg > 0.0001) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => "此工單尚有 {$finalNetWeightKg} kg / {$finalUnits} 支需建立最終入庫，不可只更新工單狀態。請改用自動入庫完成結案。",
            ], 409);
            return;
        }

        if ($autoCreateInventory) {
            $checkInvSql = $targetWorkOrderType === 'split'
                ? "SELECT id FROM inventory_items WHERE work_order_id = :woid AND deleted_at IS NULL AND receipt_type IN ('standard', 'final') LIMIT 1"
                : "SELECT id FROM inventory_items WHERE work_order_id = :woid AND deleted_at IS NULL AND receipt_type IN ('standard', 'final') LIMIT 1";
            $checkInvStmt = $pdo->prepare($checkInvSql);
            $checkInvStmt->execute(['woid' => $id]);
            $existingInv = $checkInvStmt->fetchColumn();

            if (!$existingInv && $finalNetWeightKg > 0.0001 && $finalUnits > 0) {
                require_once __DIR__ . '/../inventory_items/helpers.php';
                $inventoryNumber = generateInventoryNumber($pdo);
                $toolStatistics = $data['tool_statistics']
                    ?? $existingWorkOrder['tool_statistics']
                    ?? $orderItemMetrics['tool_statistics']
                    ?? null;
                $toolWeightKg = (float)($orderItemMetrics['total_tool_weight'] ?? 0);
                $totalToolQuantity = (int)($orderItemMetrics['tool_quantity'] ?? 0);
                $receiptType = $partialReceivedNetWeightKg > 0.0001 ? 'final' : 'standard';
                $inventoryToolWeightKg = $receiptType === 'standard' && $targetWorkOrderType !== 'split'
                    ? $toolWeightKg
                    : 0.0;
                $inventoryToolStatistics = $receiptType === 'standard' ? $toolStatistics : null;
                $inventoryToolQuantity = $receiptType === 'standard' ? $totalToolQuantity : 0;
                $grossWeightKg = round($finalNetWeightKg + $inventoryToolWeightKg, 2);

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
                        :total_good_units, 0,
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
                    'total_good_units' => $finalUnits,
                    'quantity_on_hand' => $finalUnits,
                    'net_weight_kg' => $finalNetWeightKg,
                    'gross_weight_kg' => $grossWeightKg,
                    'tool_weight_kg' => $inventoryToolWeightKg,
                    'weight_per_unit_g' => $weightPerUnitG,
                    'tool_statistics' => $inventoryToolStatistics,
                    'total_tool_quantity' => $inventoryToolQuantity,
                    'created_by' => $_SESSION['employee']['id'] ?? null,
                ]);

                $invId = (int)$pdo->lastInsertId();
                $createdInventoryItemId = $invId;

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
                    'qty' => $finalUnits,
                    'after_qty' => $finalUnits,
                    'notes' => $partialReceivedNetWeightKg > 0.0001
                        ? "工單最終補入庫，剩餘淨重 {$finalNetWeightKg} kg / {$finalUnits} 支，已部分入庫 {$partialReceivedNetWeightKg} kg / {$partialReceivedUnits} 支"
                        : "工單完工自動入庫，良品 {$finalUnits} 支 / {$finalNetWeightKg} kg",
                    'created_by' => $_SESSION['employee']['id'] ?? null,
                ]);
            }
        }

        if ($partialReceivedNetWeightKg > 0.0001) {
            $settleStmt = $pdo->prepare("
                UPDATE work_order_partial_receipts
                SET receipt_status = 'settled',
                    settled_at = COALESCE(settled_at, NOW()),
                    settled_by_employee_id = COALESCE(settled_by_employee_id, :employee_id)
                WHERE work_order_id = :work_order_id
                  AND receipt_status = 'partial'
            ");
            $settleStmt->execute([
                'employee_id' => $_SESSION['employee']['id'] ?? null,
                'work_order_id' => $id,
            ]);
            logAuditAction('Settled work order partial receipts', 'work_orders', $id, [
                'settled_receipt_count' => $settleStmt->rowCount(),
                'final_net_weight_kg' => $finalNetWeightKg,
                'partial_received_net_weight_kg' => $partialReceivedNetWeightKg,
            ]);
        }

        $shortageUpdateStmt = $pdo->prepare("
            UPDATE work_orders
            SET
                shortage_net_weight_kg = :shortage_net_weight_kg,
                shortage_units = :shortage_units,
                shortage_reason_code = :shortage_reason_code,
                shortage_notes = :shortage_notes,
                shortage_confirmed_by = :shortage_confirmed_by,
                shortage_confirmed_at = :shortage_confirmed_at
            WHERE id = :id
        ");
        $shortageUpdateStmt->execute([
            'shortage_net_weight_kg' => $shortageNetWeightKg > 0.0001 ? $shortageNetWeightKg : null,
            'shortage_units' => $shortageNetWeightKg > 0.0001 ? $shortageUnits : null,
            'shortage_reason_code' => $shortageReasonCode !== '' ? $shortageReasonCode : null,
            'shortage_notes' => $shortageNotes !== '' ? $shortageNotes : null,
            'shortage_confirmed_by' => $shortageNetWeightKg > 0.0001 ? ($_SESSION['employee']['id'] ?? null) : null,
            'shortage_confirmed_at' => $shortageNetWeightKg > 0.0001 ? date('Y-m-d H:i:s') : null,
            'id' => $id,
        ]);

        if ($shortageNetWeightKg > 0.0001) {
            appendWorkOrderOperationLog($pdo, $id, 'confirm_shortage', '確認工單短缺', [
                'notes' => $shortageNotes !== '' ? $shortageNotes : null,
                'payload' => [
                    'shortage_net_weight_kg' => $shortageNetWeightKg,
                    'shortage_units' => $shortageUnits,
                    'shortage_reason_code' => $shortageReasonCode,
                ],
            ]);
            logAuditAction('Confirmed work order shortage', 'work_orders', $id, [
                'shortage_net_weight_kg' => $shortageNetWeightKg,
                'shortage_units' => $shortageUnits,
                'shortage_reason_code' => $shortageReasonCode,
            ]);
        }

        $completionSummary = [
            'expected_net_weight_kg' => $expectedNetWeightKg,
            'produced_net_weight_kg' => $producedNetWeightKg,
            'partial_received_net_weight_kg' => $partialReceivedNetWeightKg,
            'final_received_net_weight_kg' => $finalNetWeightKg,
            'final_received_units' => $finalUnits,
            'shortage_net_weight_kg' => $shortageNetWeightKg,
            'shortage_units' => $shortageUnits,
            'shortage_reason_code' => $shortageReasonCode !== '' ? $shortageReasonCode : null,
            'shortage_notes' => $shortageNotes !== '' ? $shortageNotes : null,
            'balance_difference_net_weight_kg' => round(
                $expectedNetWeightKg - $partialReceivedNetWeightKg - $finalNetWeightKg - $shortageNetWeightKg,
                2
            ),
        ];
    }

    if ($newStatusLookupId !== $oldStatusLookupId) {
        $actionKey = 'status_changed';
        $actionLabel = '工單狀態更新';

        if (($oldStatusSnapshot['key'] ?? '') === 'pending' && ($newStatusSnapshot['key'] ?? '') === 'in_progress') {
            $actionKey = 'start';
            $actionLabel = '工單開工';
        } elseif (($oldStatusSnapshot['key'] ?? '') === 'paused' && ($newStatusSnapshot['key'] ?? '') === 'in_progress') {
            $actionKey = 'resume';
            $actionLabel = '工單恢復';
        } elseif (($newStatusSnapshot['key'] ?? '') === 'paused') {
            $actionKey = 'pause';
            $actionLabel = '工單暫停';
        } elseif (($newStatusSnapshot['key'] ?? '') === 'completed') {
            $actionKey = 'complete';
            $actionLabel = '工單完工';
        }

        $statusNotes = null;
        if ($actionKey === 'complete') {
            $statusNotes = $autoCreateInventory ? '依既有流程自動入庫。' : '本次僅更新工單狀態，不自動入庫。';
        }

        appendWorkOrderOperationLog($pdo, $id, $actionKey, $actionLabel, [
            'status_from_key' => $oldStatusSnapshot['key'],
            'status_from_label' => $oldStatusSnapshot['label'],
            'status_to_key' => $newStatusSnapshot['key'],
            'status_to_label' => $newStatusSnapshot['label'],
            'notes' => $statusNotes,
            'payload' => [
                'auto_create_inventory' => $autoCreateInventory,
                'inventory_created' => $createdInventoryItemId !== null,
                'inventory_deleted' => $deletedInventoryItemId !== null,
            ],
        ]);
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
            'completion_summary' => $completionSummary,
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
