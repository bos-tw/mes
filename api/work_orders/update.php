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

if (empty($data) && empty($screeningDefects) && empty($firstPieceDimensions) && empty($productionRecords)) {
    jsonResponse(['success' => false, 'message' => '沒有可更新的資料。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    // Check if work order exists and get current status
    $checkStmt = $pdo->prepare("SELECT id, status_lookup_id, order_item_id, total_units, total_weight_kg, weight_per_unit_g, tool_statistics FROM work_orders WHERE id = :id AND deleted_at IS NULL");
    $checkStmt->execute(['id' => $id]);
    $existingWorkOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$existingWorkOrder) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }

    $oldStatusLookupId = (int)$existingWorkOrder['status_lookup_id'];
    $newStatusLookupId = isset($data['status_lookup_id']) ? (int)$data['status_lookup_id'] : $oldStatusLookupId;

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

    // 處理生產紀錄 (Production Records)
    if (is_array($productionRecords)) {
        // 先刪除現有的生產紀錄
        $deletePrStmt = $pdo->prepare("DELETE FROM production_records WHERE work_order_id = :work_order_id");
        $deletePrStmt->execute(['work_order_id' => $id]);

        // 重新插入新的生產紀錄
        if (!empty($productionRecords)) {
            $currentEmployee = $_SESSION['employee'] ?? null;
            $currentUserId = $currentEmployee ? $currentEmployee['id'] : null;

            $prodRecordSql = "
                INSERT INTO production_records
                (work_order_id, card_number, weight_kg, production_date, production_time, machine_id, machine_type, employee_id, notes)
                VALUES (:work_order_id, :card_number, :weight_kg, :production_date, :production_time, :machine_id, :machine_type, :employee_id, :notes)
            ";
            $prodRecordStmt = $pdo->prepare($prodRecordSql);

            foreach ($productionRecords as $record) {
                // 驗證必要欄位 (卡號是自動生成的，應該要有)
                if (empty($record['card_number'])) {
                    continue;
                }

                $machineId = !empty($record['machine_id']) ? (int)$record['machine_id'] : null;
                $machineType = '';

                // 如果有選擇機台,自動帶入機台種類
                if ($machineId) {
                    $machineStmt = $pdo->prepare("SELECT name FROM machines WHERE id = :id");
                    $machineStmt->execute(['id' => $machineId]);
                    $machineType = $machineStmt->fetchColumn() ?: '';
                }

                $prodRecordStmt->execute([
                    'work_order_id' => $id,
                    'card_number' => $record['card_number'],
                    'weight_kg' => !empty($record['weight_kg']) ? (float)$record['weight_kg'] : null,
                    'production_date' => !empty($record['production_date']) ? $record['production_date'] : null,
                    'production_time' => !empty($record['production_time']) ? $record['production_time'] : null,
                    'machine_id' => $machineId,
                    'machine_type' => $machineType,
                    'employee_id' => $currentUserId, // 登錄者
                    'notes' => $record['notes'] ?? null
                ]);
            }
        }
    }

    $createdInventoryItemId = null;
    $deletedInventoryItemId = null;

    // ===== 工單完工 → 依使用者選擇建立庫存品項 =====
    // status_lookup_id = 28 = completed (已完成)
    $isCompletingNow = ($newStatusLookupId === 28 && $oldStatusLookupId !== 28);
    $isReopeningCompleted = ($oldStatusLookupId === 28 && $newStatusLookupId !== 28);

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
            $canDelete = canDeleteInventoryItem($pdo, $inventoryItemId);
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
        $checkInvStmt = $pdo->prepare("SELECT id FROM inventory_items WHERE work_order_id = :woid AND deleted_at IS NULL LIMIT 1");
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
                // 計算良品/不良品數量
                $defectStmt = $pdo->prepare("
                    SELECT COALESCE(SUM(defect_quantity), 0) FROM work_order_screening_defects WHERE work_order_id = :woid
                ");
                $defectStmt->execute(['woid' => $id]);
                $totalDefects = (float)$defectStmt->fetchColumn();

                $totalUnits = (float)($existingWorkOrder['total_units'] ?? 0);
                $totalGoodUnits = max(0, $totalUnits - $totalDefects);

                // 取得重量資料（可能從最新的 data 或既有欄位）
                $totalWeightKg = (float)($data['total_weight_kg'] ?? $existingWorkOrder['total_weight_kg'] ?? 0);
                $weightPerUnitG = (float)($data['weight_per_unit_g'] ?? $existingWorkOrder['weight_per_unit_g'] ?? 0);
                $toolStatistics = $data['tool_statistics'] ?? $existingWorkOrder['tool_statistics'] ?? null;

                // 計算淨重（良品重量）
                $netWeightKg = $weightPerUnitG > 0 ? round($totalGoodUnits * $weightPerUnitG / 1000, 2) : $totalWeightKg;
                $grossWeightKg = $totalWeightKg > 0 ? $totalWeightKg : $netWeightKg;

                // 產生庫存編號
                require_once __DIR__ . '/../inventory_items/helpers.php';
                $inventoryNumber = generateInventoryNumber($pdo);

                $currentEmployee = $_SESSION['employee'] ?? null;
                $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;

                // 建立庫存品項
                $insertInvSql = "
                    INSERT INTO inventory_items (
                        screening_item_id, inventory_number, work_order_id,
                        order_item_id, order_id, customer_id, customer_batch_number,
                        total_good_units, total_defect_units,
                        quantity_on_hand, quantity_allocated, quantity_reserved, quantity_shipped,
                        net_weight_kg, gross_weight_kg, tool_weight_kg, weight_per_unit_g,
                        tool_statistics, total_tool_quantity,
                        quality_status, status, received_at, created_by_employee_id
                    ) VALUES (
                        :screening_item_id, :inventory_number, :work_order_id,
                        :order_item_id, :order_id, :customer_id, :customer_batch_number,
                        :total_good_units, :total_defect_units,
                        :quantity_on_hand, 0, 0, 0,
                        :net_weight_kg, :gross_weight_kg, 0, :weight_per_unit_g,
                        :tool_statistics, 0,
                        'pending', 'in_stock', NOW(), :created_by
                    )
                ";
                $insertInvStmt = $pdo->prepare($insertInvSql);
                $insertInvStmt->execute([
                    'screening_item_id' => (int)$orderItemInfo['screening_item_id'],
                    'inventory_number' => $inventoryNumber,
                    'work_order_id' => $id,
                    'order_item_id' => (int)$orderItemInfo['order_item_id'],
                    'order_id' => (int)$orderItemInfo['order_id'],
                    'customer_id' => (int)$orderItemInfo['customer_id'],
                    'customer_batch_number' => $orderItemInfo['customer_batch_number'],
                    'total_good_units' => $totalGoodUnits,
                    'total_defect_units' => $totalDefects,
                    'quantity_on_hand' => $totalGoodUnits,
                    'net_weight_kg' => $netWeightKg,
                    'gross_weight_kg' => $grossWeightKg,
                    'weight_per_unit_g' => $weightPerUnitG,
                    'tool_statistics' => $toolStatistics,
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
                        'work_order', :ref_id, 'inbound', :qty, :after_qty,
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
                    'ref_id' => $id,
                    'qty' => $totalGoodUnits,
                    'after_qty' => $totalGoodUnits,
                    'notes' => "工單完工自動入庫，良品 {$totalGoodUnits}，不良品 {$totalDefects}",
                    'created_by' => $currentUserId,
                ]);
            }
        }
    }

    // Log audit
    logAuditAction('Updated work order', 'work_orders', $id, array_merge($data, [
        'screening_defects_count' => count($screeningDefects),
        'production_records_count' => count($productionRecords)
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
