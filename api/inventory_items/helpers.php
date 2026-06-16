<?php
/**
 * 庫存品項 API - 共用輔助函式
 *
 * 提供庫存品項模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module inventory_items
 * @table inventory_items
 *
 * @functions
 * - generateInventoryNumber(): 產生庫存編號 (INV-YYYYMMDD-XXXX)
 * - validateInventoryItemData(): 驗證庫存資料
 * - getInventoryItemDetails(): 取得庫存詳細
 * - canDeleteInventoryItem(): 檢查是否可刪除
 * - updateInventoryQuantities(): 更新庫存數量
 * - getNextInventoryTransactionId(): 取得下一筆庫存異動 ID
 * - getInventoryStatistics(): 取得庫存統計
 * - buildInventoryWhereClause(): 建立查詢條件
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../number_sequences/helpers.php';

/**
 * Inventory Items Helper Functions
 */

/**
 * Generate unique inventory number
 * Format: INV-YYYYMMDD-XXXX
 */
function generateInventoryNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'INV');
}

/**
 * Validate inventory item data
 */
function validateInventoryItemData(array $data, bool $isUpdate = false): array
{
    $errors = [];

    // Required fields for create
    if (!$isUpdate) {
        if (empty($data['work_order_id'])) {
            $errors[] = '生產工單ID為必填';
        }
        if (empty($data['screening_item_id'])) {
            $errors[] = '篩分品項ID為必填';
        }
        if (!isset($data['total_good_units']) || $data['total_good_units'] < 0) {
            $errors[] = '良品總支數必須大於等於0';
        }
        if (!isset($data['net_weight_kg']) || $data['net_weight_kg'] <= 0) {
            $errors[] = '淨重必須大於0';
        }
        if (!isset($data['gross_weight_kg']) || $data['gross_weight_kg'] <= 0) {
            $errors[] = '總重必須大於0';
        }
        if (!isset($data['weight_per_unit_g']) || $data['weight_per_unit_g'] <= 0) {
            $errors[] = '產品單支重必須大於0';
        }
    }

    // Validate numeric fields
    $numericFields = [
        'total_good_units', 'total_defect_units', 'quantity_on_hand',
        'quantity_allocated', 'quantity_reserved', 'quantity_shipped',
        'net_weight_kg', 'gross_weight_kg', 'tool_weight_kg', 'weight_per_unit_g'
    ];

    foreach ($numericFields as $field) {
        if (isset($data[$field]) && !is_numeric($data[$field])) {
            $errors[] = "{$field} 必須為數字";
        }
    }

    // Validate status
    $validStatuses = ['in_stock', 'allocated', 'shipped', 'consumed'];
    if (isset($data['status']) && !in_array($data['status'], $validStatuses)) {
        $errors[] = '無效的庫存狀態';
    }

    // Validate quality status
    $validQualityStatuses = ['qualified', 'quarantine', 'rejected'];
    if (isset($data['quality_status']) && !in_array($data['quality_status'], $validQualityStatuses)) {
        $errors[] = '無效的質量狀態';
    }

    return $errors;
}

/**
 * Get inventory item details by ID with related data
 */
function getInventoryItemDetails(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            ii.*,
            si.name AS screening_item_name,
            si.material AS screening_item_material,
            si.thread_type AS screening_item_thread_type,
            wo.work_order_number,
            wo.status AS work_order_status,
            oi.sub_item_number,
            oi.part_number,
            oi.drawing_number,
            o.order_number,
            o.customer_po_number,
            c.name AS customer_name,
            inspector.name AS inspector_name,
            creator.name AS creator_name
        FROM inventory_items ii
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        LEFT JOIN work_orders wo ON ii.work_order_id = wo.id
        LEFT JOIN order_items oi ON ii.order_item_id = oi.id
        LEFT JOIN orders o ON ii.order_id = o.id
        LEFT JOIN customers c ON ii.customer_id = c.id
        LEFT JOIN employees inspector ON ii.inspector_employee_id = inspector.id
        LEFT JOIN employees creator ON ii.created_by_employee_id = creator.id
        WHERE ii.id = :id AND ii.deleted_at IS NULL
    ");

    $stmt->execute(['id' => $id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    return $item ?: null;
}

/**
 * Check if inventory item can be deleted
 */
function canDeleteInventoryItem(PDO $pdo, int $id, array $options = []): array
{
    $allowWorkOrderSourceDelete = (bool)($options['allow_work_order_source_delete'] ?? false);

    $stmt = $pdo->prepare("
        SELECT id, work_order_id, quantity_allocated, quantity_shipped
        FROM inventory_items
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        return ['can_delete' => false, 'reason' => '庫存項目不存在。'];
    }

    if ((float)$item['quantity_allocated'] > 0) {
        return ['can_delete' => false, 'reason' => '此庫存已有配貨，無法刪除。'];
    }

    if ((float)$item['quantity_shipped'] > 0) {
        return ['can_delete' => false, 'reason' => '此庫存已有出貨記錄，無法刪除。'];
    }

    // P1-002: 檢查是否有關聯的出貨單品項
    $shippingStmt = $pdo->prepare("
        SELECT COUNT(*) FROM shipping_order_items WHERE inventory_item_id = :id
    ");
    $shippingStmt->execute(['id' => $id]);
    if ($shippingStmt->fetchColumn() > 0) {
        return ['can_delete' => false, 'reason' => '此庫存項目已被出貨單引用，無法刪除。'];
    }

    $transactionStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM inventory_transactions
        WHERE inventory_item_id = :id
          AND NOT (ref_type = 'work_order' AND direction = 'inbound')
    ");
    $transactionStmt->execute(['id' => $id]);
    if ((int)$transactionStmt->fetchColumn() > 0) {
        return ['can_delete' => false, 'reason' => '此庫存已有入庫以外的異動紀錄，無法刪除。'];
    }

    if (!$allowWorkOrderSourceDelete && !empty($item['work_order_id'])) {
        return [
            'can_delete' => false,
            'reason' => '此庫存由生產工單轉入，請回到生產工單調整狀態並選擇「刪除庫存並變更狀態」，避免工單與庫存追溯中斷。'
        ];
    }

    return ['can_delete' => true];
}

/**
 * Update inventory quantities
 */
function updateInventoryQuantities(PDO $pdo, int $id, array $changes): bool
{
    $allowedFields = [
        'quantity_on_hand', 'quantity_allocated',
        'quantity_reserved', 'quantity_shipped'
    ];

    $updates = [];
    $params = ['id' => $id];

    foreach ($changes as $field => $value) {
        if (in_array($field, $allowedFields)) {
            $updates[] = "{$field} = :{$field}";
            $params[$field] = $value;
        }
    }

    if (empty($updates)) {
        return false;
    }

    $sql = "UPDATE inventory_items SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);

    return $stmt->execute($params);
}

function getNextInventoryTransactionId(PDO $pdo): int
{
    $query = '
        SELECT COALESCE(MAX(id), 0) + 1 AS next_id
        FROM inventory_transactions
    ';

    if ($pdo->inTransaction()) {
        $query .= ' FOR UPDATE';
    }

    $stmt = $pdo->query($query);

    if ($stmt === false) {
        throw new RuntimeException('無法取得庫存交易序號');
    }

    $nextId = $stmt->fetchColumn();
    if ($nextId === false) {
        return 1;
    }

    return max(1, (int)$nextId);
}

/**
 * Get inventory statistics
 */
function getInventoryStatistics(PDO $pdo, array $filters = []): array
{
    $where = ['ii.deleted_at IS NULL'];
    $params = [];

    if (!empty($filters['customer_id'])) {
        $where[] = 'ii.customer_id = :customer_id';
        $params['customer_id'] = $filters['customer_id'];
    }

    if (!empty($filters['screening_item_id'])) {
        $where[] = 'ii.screening_item_id = :screening_item_id';
        $params['screening_item_id'] = $filters['screening_item_id'];
    }

    $whereClause = implode(' AND ', $where);

    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_items,
            SUM(quantity_on_hand) AS total_on_hand,
            SUM(quantity_allocated) AS total_allocated,
            SUM(quantity_shipped) AS total_shipped,
            SUM(net_weight_kg) AS total_net_weight,
            SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) AS in_stock_count,
            SUM(CASE WHEN quality_status = 'qualified' THEN quantity_on_hand ELSE 0 END) AS qualified_quantity
        FROM inventory_items ii
        WHERE {$whereClause}
    ");

    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Build WHERE clause for inventory items list
 */
function buildInventoryWhereClause(array $filters): array
{
    $where = ['ii.deleted_at IS NULL'];
    $params = [];

    // Keyword search
    if (!empty($filters['keyword'])) {
        $where[] = "(ii.inventory_number LIKE :keyword
                     OR ii.customer_batch_number LIKE :keyword_batch
                     OR wo.work_order_number LIKE :keyword_wo
                     OR o.order_number LIKE :keyword_order
                     OR c.name LIKE :keyword_customer
                     OR si.name LIKE :keyword_item)";
        $keyword = "%{$filters['keyword']}%";
        $params['keyword'] = $keyword;
        $params['keyword_batch'] = $keyword;
        $params['keyword_wo'] = $keyword;
        $params['keyword_order'] = $keyword;
        $params['keyword_customer'] = $keyword;
        $params['keyword_item'] = $keyword;
    }

    // Customer filter
    if (!empty($filters['customer_id'])) {
        $where[] = 'ii.customer_id = :customer_id';
        $params['customer_id'] = $filters['customer_id'];
    }

    // Screening item filter
    if (!empty($filters['screening_item_id'])) {
        $where[] = 'ii.screening_item_id = :screening_item_id';
        $params['screening_item_id'] = $filters['screening_item_id'];
    }

    // Status filter
    if (!empty($filters['status'])) {
        $where[] = 'ii.status = :status';
        $params['status'] = $filters['status'];
    }

    // Quality status filter
    if (!empty($filters['quality_status'])) {
        if ($filters['quality_status'] === 'qualified') {
            $where[] = "(ii.quality_status = :quality_status OR ii.receipt_type = 'partial')";
        } else {
            $where[] = 'ii.quality_status = :quality_status';
        }
        $params['quality_status'] = $filters['quality_status'];
    }

    // Date range filter
    if (!empty($filters['start_date'])) {
        $where[] = 'DATE(ii.received_at) >= :start_date';
        $params['start_date'] = $filters['start_date'];
    }

    if (!empty($filters['end_date'])) {
        $where[] = 'DATE(ii.received_at) <= :end_date';
        $params['end_date'] = $filters['end_date'];
    }

    return ['where' => $where, 'params' => $params];
}
