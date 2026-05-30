<?php
/**
 * 工單管理 API - 列表與新增
 *
 * 管理生產工單，關聯訂單品項、機台、員工等資訊。
 *
 * @endpoint GET  /api/work_orders           取得工單列表（支援篩選、分頁、排序）
 * @endpoint POST /api/work_orders           建立新工單
 *
 * @auth 必須登入
 *
 * @table work_orders    主表
 * @table order_items    關聯 - 訂單品項
 * @table orders         關聯 - 訂單
 * @table customers      關聯 - 客戶
 * @table machines       關聯 - 機台
 * @table employees      關聯 - 員工
 *
 * @input GET 參數:
 * | 參數       | 類型   | 必填 | 預設 | 說明                        |
 * |------------|--------|-----|------|-----------------------------|
 * | keyword    | string | 否  |      | 搜尋工單號/訂單號/客戶/產品   |
 * | machine_id | int    | 否  |      | 機台 ID                     |
 * | status     | string | 否  |      | 狀態代碼                      |
 * | start_date | date   | 否  |      | 實際開始日期起                |
 * | end_date   | date   | 否  |      | 實際開始日期迄                |
 * | page       | int    | 否  | 1    | 頁碼                        |
 * | perPage    | int    | 否  | 20   | 每頁筆數 (1-100)            |
 * | sortBy     | string | 否  | id   | 排序欄位                      |
 * | sortOrder  | string | 否  | DESC | ASC/DESC                    |
 *
 * @input POST JSON:
 * | 參數                    | 類型     | 必填 | 說明                  |
 * |------------------------|----------|-----|----------------------|
 * | order_item_id          | int      | 是  | 訂單品項 ID            |
 * | machine_id             | int      | 否  | 機台 ID               |
 * | machine_sequence       | int      | 否  | 機台內排序序號         |
 * | assigned_employee_id   | int      | 否  | 指定員工 ID           |
 * | calibration_employee_id| int      | 否  | 校機人員 ID           |
 * | scheduled_start_date   | datetime | 否  | 預定開始日期            |
 * | scheduled_end_date     | datetime | 否  | 預定結束日期            |
 * | quantity_to_produce    | float    | 否  | 生產數量              |
 *
 * @output 成功 (GET):
 * ```json
 * {
 *   "success": true,
 *   "data": [{...}],
 *   "pagination": {"page": 1, "perPage": 20, "total": 100, "totalPages": 5}
 * }
 * ```
 *
 * @see /api/work_orders/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListWorkOrders($pdo);
        break;
    case 'POST':
        handleCreateWorkOrder($pdo);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * Handle GET request - List work orders with filtering
 */
function handleListWorkOrders(PDO $pdo): void
{
    $keyword = $_GET['keyword'] ?? '';
    $machineId = $_GET['machine_id'] ?? '';
    $status = $_GET['status'] ?? '';
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(500, (int)($_GET['perPage'] ?? 20)));
    $sortBy = $_GET['sortBy'] ?? 'id';
    $sortOrder = strtoupper($_GET['sortOrder'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
    $excludeHasInventory = ($_GET['exclude_has_inventory'] ?? '') === '1';

    $offset = ($page - 1) * $perPage;

    // Build WHERE clause
    $where = ['wo.deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $where[] = "(wo.work_order_number LIKE :keyword_wo_number
                     OR o.order_number LIKE :keyword_order_number
                     OR c.name LIKE :keyword_customer
                     OR si.name LIKE :keyword_screening_item)";
        $params['keyword_wo_number'] = "%{$keyword}%";
        $params['keyword_order_number'] = "%{$keyword}%";
        $params['keyword_customer'] = "%{$keyword}%";
        $params['keyword_screening_item'] = "%{$keyword}%";
    }

    if ($machineId !== '') {
        $where[] = "wo.machine_id = :machine_id";
        $params['machine_id'] = $machineId;
    }

    if ($status !== '') {
        $where[] = "lv.value_key = :status";
        $params['status'] = $status;
    }

    if ($startDate !== '') {
        $where[] = "wo.actual_start_date >= :start_date";
        $params['start_date'] = $startDate . ' 00:00:00';
    }

    if ($endDate !== '') {
        $where[] = "wo.actual_start_date <= :end_date";
        $params['end_date'] = $endDate . ' 23:59:59';
    }

    if ($excludeHasInventory) {
        $where[] = "ii_check.id IS NULL";
    }

    $whereClause = implode(' AND ', $where);

    // Valid sort columns
    $validSortColumns = [
        'id' => 'wo.id',
        'work_order_number' => 'wo.work_order_number',
        'order_number' => 'o.order_number',
        'customer_name' => 'c.name',
        'screening_item' => 'si.name',
        'machine_name' => 'm.name',
        'machine_sequence' => 'wo.machine_sequence',
        'actual_start_date' => 'wo.actual_start_date',
        'actual_end_date' => 'wo.actual_end_date',
        'status_label' => 'lv.value_label'
    ];

    $orderBy = $validSortColumns[$sortBy] ?? 'wo.id';

    // Get total count
    $countSql = "
        SELECT COUNT(*)
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        LEFT JOIN inventory_items ii_check ON ii_check.work_order_id = wo.id AND ii_check.deleted_at IS NULL
        WHERE {$whereClause}
    ";

    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Get paginated data
    $sql = "
        SELECT
            wo.id,
            wo.work_order_number,
            wo.order_item_id,
            wo.machine_id,
            wo.machine_sequence,
            wo.assigned_employee_id,
            wo.calibration_employee_id,
            wo.scheduled_start_date,
            wo.scheduled_end_date,
            wo.actual_start_date,
            wo.actual_end_date,
            wo.quantity_to_produce,
            wo.screening_speed,
            wo.customer_instructions,
            wo.other_notes,
            wo.status,
            wo.status_lookup_id,
            wo.completed_at,
            wo.is_printed,
            wo.created_at,
            wo.updated_at,
            o.order_number,
            o.customer_po_number,
            c.name AS customer_name,
            c.is_active AS customer_is_active,
            si.name AS screening_item_name,
            m.name AS machine_name,
            e1.name AS assigned_employee_name,
            e2.name AS calibration_employee_name,
            lv.value_label AS status_label,
            lv.value_key AS status_key,
            CASE WHEN wo.completed_at IS NOT NULL THEN 1 ELSE 0 END AS lifecycle_locked,
            CASE WHEN ii_check.id IS NOT NULL THEN 1 ELSE 0 END AS has_inventory
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN employees e1 ON wo.assigned_employee_id = e1.id
        LEFT JOIN employees e2 ON wo.calibration_employee_id = e2.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        LEFT JOIN inventory_items ii_check ON ii_check.work_order_id = wo.id AND ii_check.deleted_at IS NULL
        WHERE {$whereClause}
        ORDER BY {$orderBy} {$sortOrder}
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $workOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $workOrders,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage)
        ]
    ]);
}

/**
 * Handle POST request - Create new work order
 */
function handleCreateWorkOrder(PDO $pdo): void
{
    $payload = readWorkOrderPayload();

    // 提取 screening_defects (如果存在)
    $screeningDefects = $payload['screening_defects'] ?? [];
    unset($payload['screening_defects']); // 從主 payload 中移除

    // 提取 production_records (如果存在)
    $productionRecords = $payload['production_records'] ?? [];
    unset($payload['production_records']); // 從主 payload 中移除
    $productionRecords = is_array($productionRecords) ? filterMeaningfulProductionRecords($productionRecords) : [];

    $validation = validateWorkOrderData($payload, false);

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
    unset($data['first_piece_dimensions']); // 從主 data 中移除，避免插入 WorkOrders 表失敗
    if (!is_array($firstPieceDimensions) || !isMeaningfulFirstPieceDimension($firstPieceDimensions)) {
        $firstPieceDimensions = null;
    }

    // Check if order item exists and keep order metrics as a fallback.
    $orderItemDetails = fetchOrderItemDetailsForWorkOrder($pdo, (int)$data['order_item_id']);
    if (!$orderItemDetails) {
        jsonResponse([
            'success' => false,
            'message' => '客戶批號不存在。'
        ], 404);
        return;
    }

    if (!array_key_exists('total_weight_kg', $data) || $data['total_weight_kg'] === null) {
        $data['total_weight_kg'] = (float)($orderItemDetails['net_weight'] ?? 0);
    }
    if (!array_key_exists('weight_per_unit_g', $data) || $data['weight_per_unit_g'] === null) {
        $data['weight_per_unit_g'] = (float)($orderItemDetails['weight_per_unit_g'] ?? 0);
    }
    if (!array_key_exists('total_units', $data) || $data['total_units'] === null) {
        $data['total_units'] = (float)($orderItemDetails['total_units'] ?? 0);
    }
    if (!array_key_exists('tool_statistics', $data) || $data['tool_statistics'] === null) {
        $data['tool_statistics'] = $orderItemDetails['tool_statistics'] ?? null;
    }

    // Prevent duplicate work orders for the same order item
    $dupStmt = $pdo->prepare(
        "SELECT work_order_number FROM work_orders WHERE order_item_id = :order_item_id AND deleted_at IS NULL LIMIT 1"
    );
    $dupStmt->execute(['order_item_id' => $data['order_item_id']]);
    $existingWorkOrderNumber = $dupStmt->fetchColumn();
    if ($existingWorkOrderNumber !== false) {
        jsonResponse([
            'success' => false,
            'message' => '此客戶批號已建立工單，請勿重複建立。',
            'work_order_number' => $existingWorkOrderNumber,
        ], 409);
        return;
    }

    try {
        $pdo->beginTransaction();

        // Generate work order number
        $workOrderNumber = generateWorkOrderNumber($pdo);
        $data['work_order_number'] = $workOrderNumber;

        // Build INSERT query
        // 使用反引號包裹列名,避免與 MySQL 保留字衝突 (如 status)
        $columns = array_keys($data);
        $columnNames = array_map(function($col) { return "`{$col}`"; }, $columns);
        $placeholders = array_map(function($col) { return ":{$col}"; }, $columns);

        $sql = sprintf(
            "INSERT INTO work_orders (%s) VALUES (%s)",
            implode(', ', $columnNames),
            implode(', ', $placeholders)
        );

        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);

        $workOrderId = (int)$pdo->lastInsertId();
        $machineIdForSequence = isset($data['machine_id']) && $data['machine_id'] !== null
            ? (int)$data['machine_id']
            : null;
        $requestedMachineSequence = isset($data['machine_sequence']) && $data['machine_sequence'] !== null
            ? (int)$data['machine_sequence']
            : null;
        $machineSequence = placeWorkOrderInMachineSequence(
            $pdo,
            $workOrderId,
            $machineIdForSequence,
            $requestedMachineSequence
        );

        // 處理首件尺寸檢驗 (First Piece Dimensions)
        if (!empty($firstPieceDimensions)) {
            $fpColumns = array_keys($firstPieceDimensions);
            $fpColumns[] = 'work_order_id';
            $firstPieceDimensions['work_order_id'] = $workOrderId;

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

        // 處理篩分服務缺陷數量
        if (!empty($screeningDefects) && is_array($screeningDefects)) {
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
                    continue; // 跳過無效資料
                }

                $serviceId = (int)$defect['screening_service_id'];
                $defectQuantity = (int)$defect['defect_quantity'];

                // 查詢 service_name
                $serviceStmt = $pdo->prepare("SELECT name FROM screening_services WHERE id = :id");
                $serviceStmt->execute(['id' => $serviceId]);
                $serviceName = $serviceStmt->fetchColumn() ?: '';

                $defectStmt->execute([
                    'work_order_id' => $workOrderId,
                    'screening_service_id' => $serviceId,
                    'service_name' => $serviceName,
                    'defect_quantity' => $defectQuantity,
                    'recorded_at' => $currentTime,
                    'recorded_by_employee_id' => $currentUserId
                ]);
            }
        }

        // 處理生產紀錄 (Production Records)
        if (!empty($productionRecords) && is_array($productionRecords)) {
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

                // 如果有選擇機台，自動帶入機台種類
                if ($machineId) {
                    $machineStmt = $pdo->prepare("SELECT name FROM machines WHERE id = :id");
                    $machineStmt->execute(['id' => $machineId]);
                    $machineType = $machineStmt->fetchColumn() ?: '';
                }

                $prodRecordStmt->execute([
                    'work_order_id' => $workOrderId,
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

        // Log audit
        logAuditAction('Added new work order', 'WorkOrders', $workOrderId, [
            'work_order_number' => $workOrderNumber,
            'screening_defects_count' => count($screeningDefects),
            'production_records_count' => count($productionRecords)
        ]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '工單新增成功。',
            'id' => $workOrderId,
            'work_order_number' => $workOrderNumber,
            'machine_sequence' => $machineSequence,
        ], 201);

    } catch (Throwable $t) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        // 記錄詳細錯誤資訊到 error_log
        error_log('Create work order error: ' . $t->getMessage());
        error_log('File: ' . $t->getFile() . ' Line: ' . $t->getLine());
        error_log('Data: ' . json_encode($data));

        // 嘗試記錄 audit log (可能失敗但不影響錯誤回應)
        try {
            logAuditAction('Error: 新增工單失敗。', 'WorkOrders', null, [
                'error' => $t->getMessage(),
                'data' => $data
            ]);
        } catch (Exception $auditError) {
            error_log('Audit log error: ' . $auditError->getMessage());
        }

        jsonResponse([
            'success' => false,
            'message' => '新增工單失敗。',
            'error' => $t->getMessage(),
            'file' => basename($t->getFile()),
            'line' => $t->getLine()
        ], 500);
    }
}
