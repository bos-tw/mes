<?php
/**
 * 庫存品項 API - 列表與新增
 *
 * 管理工單完成後產生的庫存品項，追蹤數量、重量、品質狀態等。
 *
 * @endpoint GET  /api/inventory_items           取得庫存列表（篩選、分頁、排序）
 * @endpoint POST /api/inventory_items           建立新庫存品項
 *
 * @auth 必須登入
 *
 * @table inventory_items  主表 - 庫存品項
 * @table work_orders      關聯 - 工單
 * @table screening_items  關聯 - 受篩產品
 * @table customers        關聯 - 客戶
 *
 * @input GET 參數:
 * | 參數              | 類型   | 必填 | 預設 | 說明                    |
 * |-------------------|--------|-----|------|-----------------------|
 * | keyword           | string | 否  |      | 搜尋庫存編號/工單號/客戶批號 |
 * | customer_id       | int    | 否  |      | 客戶 ID               |
 * | screening_item_id | int    | 否  |      | 受篩產品 ID            |
 * | status            | string | 否  |      | 庫存狀態               |
 * | quality_status    | string | 否  |      | 品質狀態               |
 * | start_date        | date   | 否  |      | 入庫日期起             |
 * | end_date          | date   | 否  |      | 入庫日期迄             |
 * | page              | int    | 否  | 1    | 頁碼                  |
 * | perPage           | int    | 否  | 20   | 每頁筆數 (1-100)      |
 * | sortBy            | string | 否  | id   | 排序欄位              |
 * | sortOrder         | string | 否  | DESC | ASC/DESC              |
 *
 * @input POST JSON:
 * | 參數              | 類型   | 必填 | 說明              |
 * |-------------------|--------|-----|-----------------|
 * | work_order_id     | int    | 是  | 工單 ID          |
 * | screening_item_id | int    | 是  | 受篩產品 ID       |
 * | total_good_units  | float  | 是  | 良品總支數 (≥0)   |
 * | net_weight_kg     | float  | 是  | 淨重 (kg) (>0)  |
 * | gross_weight_kg   | float  | 是  | 總重 (kg) (>0)  |
 * | weight_per_unit_g | float  | 是  | 產品單支重 (g) (>0)|
 *
 * @output 成功 (GET):
 * ```json
 * {
 *   "success": true,
 *   "data": [{...}],
 *   "pagination": {"page": 1, "perPage": 20, "total": 100}
 * }
 * ```
 *
 * @see /api/inventory_items/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleGetInventoryItems($pdo);
        break;
    case 'POST':
        handleCreateInventoryItem($pdo);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * Handle GET request - List inventory items with filtering
 */
function handleGetInventoryItems(PDO $pdo): void
{
    $keyword = $_GET['keyword'] ?? '';
    $customerId = $_GET['customer_id'] ?? '';
    $screeningItemId = $_GET['screening_item_id'] ?? '';
    $status = $_GET['status'] ?? '';
    $qualityStatus = $_GET['quality_status'] ?? '';
    $stockCategory = $_GET['stock_category'] ?? '';
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $sortBy = $_GET['sortBy'] ?? 'id';
    $sortOrder = strtoupper($_GET['sortOrder'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

    $offset = ($page - 1) * $perPage;

    // Build WHERE clause
    $filters = [
        'keyword' => $keyword,
        'customer_id' => $customerId,
        'screening_item_id' => $screeningItemId,
        'status' => $status,
        'quality_status' => $qualityStatus,
        'stock_category' => $stockCategory,
        'start_date' => $startDate,
        'end_date' => $endDate,
    ];

    $whereData = buildInventoryWhereClause($filters);
    $whereClause = implode(' AND ', $whereData['where']);
    $params = $whereData['params'];

    // Validate sort column
    $allowedSortColumns = [
        'id', 'inventory_number', 'customer_name', 'screening_item_name',
        'work_order_number', 'order_item_number', 'customer_batch_number', 'quantity_on_hand',
        'net_weight_kg', 'stock_category', 'status', 'quality_status', 'received_at'
    ];

    $sortColumn = in_array($sortBy, $allowedSortColumns) ? $sortBy : 'id';

    // Map frontend sort names to SQL columns
    $sortMap = [
        'customer_name' => 'c.name',
        'screening_item_name' => 'si.name',
        'work_order_number' => 'wo.work_order_number',
        'order_item_number' => 'oi.order_item_number',
        'inventory_number' => 'ii.inventory_number',
        'customer_batch_number' => 'ii.customer_batch_number',
        'quantity_on_hand' => 'ii.quantity_on_hand',
        'net_weight_kg' => 'ii.net_weight_kg',
        'stock_category' => 'ii.stock_category',
        'status' => 'ii.status',
        'quality_status' => 'ii.quality_status',
        'received_at' => 'ii.received_at',
    ];

    $orderByColumn = $sortMap[$sortColumn] ?? "ii.{$sortColumn}";

    // Count total records
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM inventory_items ii
        LEFT JOIN customers c ON ii.customer_id = c.id
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        LEFT JOIN work_orders wo ON ii.work_order_id = wo.id
        LEFT JOIN orders o ON ii.order_id = o.id
        LEFT JOIN order_items oi ON ii.order_item_id = oi.id
        WHERE {$whereClause}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Fetch data
    $stmt = $pdo->prepare("
        SELECT
            ii.id,
            ii.inventory_number,
            ii.receipt_type,
            ii.stock_category,
            ii.screening_item_id,
            si.name AS screening_item_name,
            ii.work_order_id,
            wo.work_order_number,
            ii.order_item_id,
            oi.order_item_number,
            oi.customer_batch_number AS order_item_batch_number,
            ii.order_id,
            o.order_number,
            ii.customer_id,
            c.name AS customer_name,
            c.is_active AS customer_is_active,
            wopr.receipt_number AS partial_receipt_number,
            wopr.receipt_status AS partial_receipt_status,
            wopr.shipping_tool_details AS partial_receipt_shipping_tool_details,
            CASE
                WHEN wopr.id IS NULL THEN NULL
                WHEN wopr.machine_run_id IS NULL THEN '一般工單'
                WHEN COALESCE(wopr_run.run_label, '') <> '' THEN wopr_run.run_label
                WHEN COALESCE(wopr_machine.name, '') <> '' THEN wopr_machine.name
                ELSE '拆分機台'
            END AS partial_receipt_source_label,
            ii.customer_batch_number,
            ii.internal_lot_number,
            ii.total_good_units,
            ii.total_defect_units,
            ii.quantity_on_hand,
            ii.quantity_allocated,
            ii.quantity_reserved,
            ii.quantity_shipped,
            ii.net_weight_kg,
            ii.gross_weight_kg,
            ii.tool_weight_kg,
            ii.weight_per_unit_g,
            ii.tool_statistics,
            ii.total_tool_quantity,
            ii.quality_status,
            ii.status,
            ii.warehouse_location,
            ii.storage_zone,
            ii.shelf_number,
            ii.received_at,
            ii.created_at
            ,
            COALESCE(packages.package_count, 0) AS package_count,
            COALESCE(packages.package_quantity, 0) AS package_quantity
        FROM inventory_items ii
        LEFT JOIN customers c ON ii.customer_id = c.id
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        LEFT JOIN work_orders wo ON ii.work_order_id = wo.id
        LEFT JOIN orders o ON ii.order_id = o.id
        LEFT JOIN order_items oi ON ii.order_item_id = oi.id
        LEFT JOIN work_order_partial_receipts wopr ON wopr.inventory_item_id = ii.id
        LEFT JOIN work_order_machine_runs wopr_run ON wopr_run.id = wopr.machine_run_id
        LEFT JOIN machines wopr_machine ON wopr_machine.id = wopr_run.machine_id
        LEFT JOIN (
            SELECT inventory_item_id,
                   COUNT(*) AS package_count,
                   COALESCE(SUM(package_quantity), 0) AS package_quantity
            FROM inventory_packages
            WHERE package_status <> 'voided'
            GROUP BY inventory_item_id
        ) packages ON packages.inventory_item_id = ii.id
        WHERE {$whereClause}
        ORDER BY {$orderByColumn} {$sortOrder}
        LIMIT :limit OFFSET :offset
    ");

    foreach ($params as $key => $value) {
        $stmt->bindValue(":{$key}", $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $items,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ]);
}

/**
 * Handle POST request - Create new inventory item
 */
function handleCreateInventoryItem(PDO $pdo): void
{
    $data = getJsonInput();

    // Validate required fields
    $errors = validateInventoryItemData($data);
    if (!empty($errors)) {
        jsonResponse(['success' => false, 'message' => '驗證失敗。', 'errors' => $errors], 400);
    }

    try {
        $pdo->beginTransaction();

        // Generate inventory number
        $inventoryNumber = generateInventoryNumber($pdo);

        // Get work order details to populate related IDs
        $woStmt = $pdo->prepare("
            SELECT
                wo.order_item_id,
                oi.order_id,
                oi.customer_batch_number,
                o.customer_id
            FROM work_orders wo
            JOIN order_items oi ON wo.order_item_id = oi.id
            JOIN orders o ON oi.order_id = o.id
            WHERE wo.id = :work_order_id AND wo.deleted_at IS NULL
        ");
        $woStmt->execute(['work_order_id' => $data['work_order_id']]);
        $woData = $woStmt->fetch(PDO::FETCH_ASSOC);

        if (!$woData) {
            throw new Exception('生產工單不存在');
        }

        // Prevent duplicate inventory item for the same work order
        $dupStmt = $pdo->prepare(
            'SELECT id, inventory_number FROM inventory_items WHERE work_order_id = :work_order_id AND deleted_at IS NULL LIMIT 1'
        );
        $dupStmt->execute(['work_order_id' => $data['work_order_id']]);
        $existingInventory = $dupStmt->fetch(PDO::FETCH_ASSOC);
        if ($existingInventory) {
            jsonResponse([
                'success' => false,
                'message' => '此工單已轉入庫存，請勿重複建立。',
                'inventory_item_id' => (int)$existingInventory['id'],
                'inventory_number' => $existingInventory['inventory_number']
            ], 409);
        }

        // Get current user
        $currentUser = requireAuth();

        // Prepare insert data
        $received_at = $data['received_at'] ?? date('Y-m-d H:i:s');
        $quantity_on_hand = $data['quantity_on_hand'] ?? $data['total_good_units'];
        $status = $data['status'] ?? 'in_stock';
        $quality_status = $data['quality_status'] ?? 'qualified';

        // Insert inventory item
        $stmt = $pdo->prepare("
            INSERT INTO inventory_items (
                screening_item_id,
                inventory_number,
                work_order_id,
                order_item_id,
                order_id,
                customer_id,
                customer_batch_number,
                internal_lot_number,
                total_good_units,
                total_defect_units,
                quantity_on_hand,
                quantity_allocated,
                quantity_reserved,
                quantity_shipped,
                net_weight_kg,
                gross_weight_kg,
                tool_weight_kg,
                weight_per_unit_g,
                tool_statistics,
                total_tool_quantity,
                quality_status,
                inspection_date,
                inspector_employee_id,
                quality_notes,
                warehouse_location,
                storage_zone,
                shelf_number,
                status,
                notes,
                received_at,
                created_by_employee_id
            ) VALUES (
                :screening_item_id,
                :inventory_number,
                :work_order_id,
                :order_item_id,
                :order_id,
                :customer_id,
                :customer_batch_number,
                :internal_lot_number,
                :total_good_units,
                :total_defect_units,
                :quantity_on_hand,
                :quantity_allocated,
                :quantity_reserved,
                :quantity_shipped,
                :net_weight_kg,
                :gross_weight_kg,
                :tool_weight_kg,
                :weight_per_unit_g,
                :tool_statistics,
                :total_tool_quantity,
                :quality_status,
                :inspection_date,
                :inspector_employee_id,
                :quality_notes,
                :warehouse_location,
                :storage_zone,
                :shelf_number,
                :status,
                :notes,
                :received_at,
                :created_by_employee_id
            )
        ");

        $stmt->execute([
            'screening_item_id' => $data['screening_item_id'],
            'inventory_number' => $inventoryNumber,
            'work_order_id' => $data['work_order_id'],
            'order_item_id' => $woData['order_item_id'],
            'order_id' => $woData['order_id'],
            'customer_id' => $woData['customer_id'],
            'customer_batch_number' => $woData['customer_batch_number'],
            'internal_lot_number' => $data['internal_lot_number'] ?? null,
            'total_good_units' => $data['total_good_units'],
            'total_defect_units' => $data['total_defect_units'] ?? 0,
            'quantity_on_hand' => $quantity_on_hand,
            'quantity_allocated' => $data['quantity_allocated'] ?? 0,
            'quantity_reserved' => $data['quantity_reserved'] ?? 0,
            'quantity_shipped' => $data['quantity_shipped'] ?? 0,
            'net_weight_kg' => $data['net_weight_kg'],
            'gross_weight_kg' => $data['gross_weight_kg'],
            'tool_weight_kg' => $data['tool_weight_kg'] ?? 0,
            'weight_per_unit_g' => $data['weight_per_unit_g'],
            'tool_statistics' => $data['tool_statistics'] ?? null,
            'total_tool_quantity' => $data['total_tool_quantity'] ?? 0,
            'quality_status' => $quality_status,
            'inspection_date' => $data['inspection_date'] ?? null,
            'inspector_employee_id' => $data['inspector_employee_id'] ?? null,
            'quality_notes' => $data['quality_notes'] ?? null,
            'warehouse_location' => $data['warehouse_location'] ?? null,
            'storage_zone' => $data['storage_zone'] ?? null,
            'shelf_number' => $data['shelf_number'] ?? null,
            'status' => $status,
            'notes' => $data['notes'] ?? null,
            'received_at' => $received_at,
            'created_by_employee_id' => $currentUser['id'] ?? null,
        ]);

        $inventoryItemId = (int)$pdo->lastInsertId();
        ensureInventoryItemSource($pdo, $inventoryItemId, 'manual_receipt', $inventoryItemId, [
            'source_order_id' => (int)$woData['order_id'],
            'source_order_item_id' => (int)$woData['order_item_id'],
            'source_work_order_id' => (int)$data['work_order_id'],
        ], '庫存模組手動入庫');

        // Create inventory transaction record
        $transStmt = $pdo->prepare("
            INSERT INTO inventory_transactions (
                inventory_item_id,
                ref_type,
                ref_id,
                direction,
                quantity,
                after_quantity,
                notes,
                created_by_employee_id
            ) VALUES (
                :inventory_item_id,
                'work_order',
                :ref_id,
                'inbound',
                :quantity,
                :after_quantity,
                :notes,
                :created_by_employee_id
            )
        ");

        $transStmt->execute([
            'inventory_item_id' => $inventoryItemId,
            'ref_id' => $data['work_order_id'],
            'quantity' => $data['total_good_units'],
            'after_quantity' => $quantity_on_hand,
            'notes' => '生產工單入庫',
            'created_by_employee_id' => $currentUser['id'] ?? null,
        ]);

        $pdo->commit();

        // Fetch the created item
        $item = getInventoryItemDetails($pdo, $inventoryItemId);

        logAuditAction('新增庫存品項', 'inventory_items', (int)$inventoryItemId, ['work_order_id' => $data['work_order_id'] ?? null]);

        jsonResponse([
            'success' => true,
            'message' => '庫存項目建立成功。',
            'item' => $item,
            'data' => $item,
        ], 201);

    } catch (Throwable $e) {
        $pdo->rollBack();
        error_log('Inventory item create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '建立失敗，請稍後重試。')], 500);
    }
}
