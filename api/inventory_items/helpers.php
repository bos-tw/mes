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
 * @return list<array<string,mixed>>
 */
function fetchInventoryPartialReceiptToolDetails(PDO $pdo, int $partialReceiptId): array
{
    if ($partialReceiptId <= 0) {
        return [];
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            order_item_tool_id,
            tool_id,
            tool_name,
            tool_type,
            unit_weight_kg,
            quantity,
            total_weight_kg
        FROM work_order_partial_receipt_tools
        WHERE partial_receipt_id = :partial_receipt_id
        ORDER BY id ASC
    ");
    $stmt->execute(['partial_receipt_id' => $partialReceiptId]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_map(static function (array $row): array {
        return [
            'id' => (int)($row['id'] ?? 0),
            'order_item_tool_id' => isset($row['order_item_tool_id']) ? (int)$row['order_item_tool_id'] : null,
            'tool_id' => isset($row['tool_id']) ? (int)$row['tool_id'] : null,
            'tool_name' => (string)($row['tool_name'] ?? ''),
            'tool_type' => $row['tool_type'] !== null ? (string)$row['tool_type'] : null,
            'unit_weight_kg' => round((float)($row['unit_weight_kg'] ?? 0), 3),
            'quantity' => (int)round((float)($row['quantity'] ?? 0)),
            'total_weight_kg' => round((float)($row['total_weight_kg'] ?? 0), 3),
        ];
    }, $rows);
}

function inventoryUnitsToWeightKg(float $units, float $weightPerUnitG): float
{
    if ($units <= 0 || $weightPerUnitG <= 0) {
        return 0.0;
    }

    return round(($units * $weightPerUnitG) / 1000, 2);
}

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
            work_order_status.value_key AS work_order_status,
            oi.sub_item_number,
            oi.part_number,
            oi.drawing_number,
            o.order_number,
            o.customer_po_number,
            c.name AS customer_name,
            inspector.name AS inspector_name,
            creator.name AS creator_name,
            wopr.id AS partial_receipt_id,
            wopr.receipt_number AS partial_receipt_number,
            wopr.receipt_status AS partial_receipt_status,
            wopr.shipping_tool_details AS partial_receipt_shipping_tool_details,
            wopr.notes AS partial_receipt_notes,
            wopr.created_at AS partial_receipt_created_at,
            CASE
                WHEN wopr.id IS NULL THEN NULL
                WHEN wopr.machine_run_id IS NULL THEN '一般工單'
                WHEN COALESCE(wopr_run.run_label, '') <> '' THEN wopr_run.run_label
                WHEN COALESCE(wopr_machine.name, '') <> '' THEN wopr_machine.name
                ELSE '拆分機台'
            END AS partial_receipt_source_label
        FROM inventory_items ii
        LEFT JOIN screening_items si ON ii.screening_item_id = si.id
        LEFT JOIN work_orders wo ON ii.work_order_id = wo.id
        LEFT JOIN lookup_values work_order_status ON wo.status_lookup_id = work_order_status.id
        LEFT JOIN order_items oi ON ii.order_item_id = oi.id
        LEFT JOIN orders o ON ii.order_id = o.id
        LEFT JOIN customers c ON ii.customer_id = c.id
        LEFT JOIN employees inspector ON ii.inspector_employee_id = inspector.id
        LEFT JOIN employees creator ON ii.created_by_employee_id = creator.id
        LEFT JOIN work_order_partial_receipts wopr ON wopr.inventory_item_id = ii.id
        LEFT JOIN work_order_machine_runs wopr_run ON wopr_run.id = wopr.machine_run_id
        LEFT JOIN machines wopr_machine ON wopr_machine.id = wopr_run.machine_id
        WHERE ii.id = :id AND ii.deleted_at IS NULL
    ");

    $stmt->execute(['id' => $id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($item) {
        $receiptType = (string)($item['receipt_type'] ?? 'standard');
        $item['receipt_type_label'] = match ($receiptType) {
            'partial' => '部分入庫',
            'final' => '最終補入',
            default => '一般入庫',
        };

        $partialReceiptStatus = (string)($item['partial_receipt_status'] ?? '');
        $item['partial_receipt_status_label'] = match ($partialReceiptStatus) {
            'partial' => '有效',
            'settled' => '已結清',
            'reversed' => '已沖銷',
            default => '',
        };

        $partialReceiptId = (int)($item['partial_receipt_id'] ?? 0);
        $partialReceiptTools = fetchInventoryPartialReceiptToolDetails($pdo, $partialReceiptId);
        $partialReceiptToolTotalWeightKg = 0.0;
        $partialReceiptToolBreakdown = [];
        foreach ($partialReceiptTools as $tool) {
            $partialReceiptToolTotalWeightKg += (float)($tool['total_weight_kg'] ?? 0);
            $toolLabel = trim((string)($tool['tool_name'] ?? ''));
            $toolType = trim((string)($tool['tool_type'] ?? ''));
            if ($toolType !== '' && $toolType !== $toolLabel) {
                $toolLabel .= ' / ' . $toolType;
            }
            $partialReceiptToolBreakdown[] = sprintf(
                '%s x %d（%.3f kg/個，小計 %.3f kg）',
                $toolLabel !== '' ? $toolLabel : ('載具#' . (int)($tool['id'] ?? 0)),
                (int)($tool['quantity'] ?? 0),
                round((float)($tool['unit_weight_kg'] ?? 0), 3),
                round((float)($tool['total_weight_kg'] ?? 0), 3)
            );
        }

        $item['partial_receipt_tool_details'] = $partialReceiptTools;
        $item['partial_receipt_tool_total_weight_kg'] = round($partialReceiptToolTotalWeightKg, 3);
        $item['partial_receipt_tool_breakdown'] = implode("\n", $partialReceiptToolBreakdown);

        $weightPerUnitG = round((float)($item['weight_per_unit_g'] ?? 0), 3);
        $originalUnits = round((float)($item['total_good_units'] ?? 0), 0);
        $unshippedUnits = round((float)($item['quantity_on_hand'] ?? 0), 0);
        $allocatedUnits = round((float)($item['quantity_allocated'] ?? 0), 0);
        $reservedUnits = round((float)($item['quantity_reserved'] ?? 0), 0);
        $shippedUnits = round((float)($item['quantity_shipped'] ?? 0), 0);
        $availableToShipUnits = round(max($unshippedUnits - $allocatedUnits, 0), 0);

        $item['partial_receipt_original_units'] = $originalUnits;
        $item['partial_receipt_original_net_weight_kg'] = round((float)($item['net_weight_kg'] ?? 0), 2);
        $item['partial_receipt_unshipped_units'] = $unshippedUnits;
        $item['partial_receipt_unshipped_net_weight_kg'] = inventoryUnitsToWeightKg($unshippedUnits, $weightPerUnitG);
        $item['partial_receipt_allocated_pending_ship_units'] = $allocatedUnits;
        $item['partial_receipt_allocated_pending_ship_net_weight_kg'] = inventoryUnitsToWeightKg($allocatedUnits, $weightPerUnitG);
        $item['partial_receipt_reserved_units'] = $reservedUnits;
        $item['partial_receipt_reserved_net_weight_kg'] = inventoryUnitsToWeightKg($reservedUnits, $weightPerUnitG);
        $item['partial_receipt_available_to_ship_units'] = $availableToShipUnits;
        $item['partial_receipt_available_to_ship_net_weight_kg'] = inventoryUnitsToWeightKg($availableToShipUnits, $weightPerUnitG);
        $item['partial_receipt_shipped_units'] = $shippedUnits;
        $item['partial_receipt_shipped_net_weight_kg'] = inventoryUnitsToWeightKg($shippedUnits, $weightPerUnitG);
    }

    return $item ?: null;
}

/**
 * @return list<array<string,mixed>>
 */
function getInventoryItemSourceChain(PDO $pdo, int $inventoryItemId): array
{
    if ($inventoryItemId <= 0) {
        return [];
    }

    $stmt = $pdo->prepare("
        SELECT
            iis.source_type,
            iis.source_id,
            iis.source_order_id,
            o.order_number,
            iis.source_order_item_id,
            iis.source_work_order_id,
            wo.work_order_number,
            iis.source_stage_id,
            stage.stage_type AS source_stage_type,
            stage.secondary_mode AS source_stage_secondary_mode,
            stage.source_quality AS source_stage_quality,
            stage.image_requirement AS source_image_requirement,
            stage.image_min_count AS source_image_min_count,
            iis.source_machine_result_id,
            result_row.result_revision AS source_machine_result_revision,
            result_row.machine_run_id AS source_machine_run_id,
            COALESCE(run.run_label, machine.name) AS source_machine_label,
            result_row.machine_good_units AS source_machine_good_units,
            result_row.machine_defect_units AS source_machine_defect_units,
            result_row.defect_weight_kg AS source_defect_weight_kg,
            result_row.weight_per_unit_g AS source_weight_per_unit_g,
            result_row.settled_defect_units AS source_settled_defect_units,
            result_row.defect_difference_units AS source_defect_difference_units,
            (
                SELECT COUNT(*)
                FROM work_order_machine_result_images image_row
                WHERE image_row.machine_result_id = result_row.id
                  AND image_row.deleted_at IS NULL
            ) AS source_machine_image_count,
            (
                SELECT GROUP_CONCAT(image_row.file_path ORDER BY image_row.sort_order, image_row.id SEPARATOR '|')
                FROM work_order_machine_result_images image_row
                WHERE image_row.machine_result_id = result_row.id
                  AND image_row.deleted_at IS NULL
            ) AS source_machine_image_paths,
            iis.source_stage_transfer_id,
            transfer_row.source_quality AS source_transfer_quality,
            transfer_row.route AS source_transfer_route,
            transfer_row.secondary_mode AS source_transfer_secondary_mode,
            iis.source_shipping_order_id,
            so.shipping_order_number,
            iis.source_return_order_id,
            ro.return_order_number,
            iis.source_rescreen_batch_id,
            rb.rescreen_batch_number,
            rb.second_screening_reason,
            rb.rescreen_type,
            iis.notes
        FROM inventory_item_sources iis
        LEFT JOIN orders o ON o.id = iis.source_order_id
        LEFT JOIN work_orders wo ON wo.id = iis.source_work_order_id
        LEFT JOIN work_order_stages stage ON stage.id = iis.source_stage_id
        LEFT JOIN work_order_machine_results result_row ON result_row.id = iis.source_machine_result_id
        LEFT JOIN work_order_machine_runs run ON run.id = result_row.machine_run_id
        LEFT JOIN machines machine ON machine.id = run.machine_id
        LEFT JOIN work_order_stage_transfers transfer_row ON transfer_row.id = iis.source_stage_transfer_id
        LEFT JOIN shipping_orders so ON so.id = iis.source_shipping_order_id
        LEFT JOIN return_orders ro ON ro.id = iis.source_return_order_id
        LEFT JOIN rescreen_batches rb ON rb.id = iis.source_rescreen_batch_id
        WHERE iis.inventory_item_id = :inventory_item_id
        ORDER BY iis.id ASC
    ");
    $stmt->execute(['inventory_item_id' => $inventoryItemId]);

    $sources = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($sources !== []) {
        return $sources;
    }

    // Migration 前的相容 fallback：至少以庫存既有直接關聯提供可追溯節點。
    $fallbackStmt = $pdo->prepare("SELECT ii.order_id AS source_order_id, o.order_number,
        ii.order_item_id AS source_order_item_id, ii.work_order_id AS source_work_order_id,
        wo.work_order_number
        FROM inventory_items ii
        LEFT JOIN orders o ON o.id = ii.order_id
        LEFT JOIN work_orders wo ON wo.id = ii.work_order_id
        WHERE ii.id = :id AND ii.deleted_at IS NULL");
    $fallbackStmt->execute(['id' => $inventoryItemId]);
    $fallback = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
    if (!$fallback) {
        return [];
    }
    return [array_merge([
        'source_type' => 'legacy_direct_relation',
        'source_id' => $inventoryItemId,
        'notes' => '由既有直接關聯提供的相容來源鏈',
    ], $fallback)];
}

/** @param array<string,int|null> $links */
function ensureInventoryItemSource(
    PDO $pdo,
    int $inventoryItemId,
    string $sourceType,
    ?int $sourceId,
    array $links = [],
    ?string $notes = null
): void {
    if ($inventoryItemId <= 0 || trim($sourceType) === '') {
        throw new InvalidArgumentException('庫存來源鏈缺少必要識別。');
    }
    $sourceId ??= $inventoryItemId;
    $stmt = $pdo->prepare("INSERT INTO inventory_item_sources (
        inventory_item_id, source_type, source_id, source_order_id,
        source_order_item_id, source_work_order_id, source_stage_id,
        source_machine_result_id, source_stage_transfer_id, source_shipping_order_id,
        source_shipping_order_item_id, source_return_order_id,
        source_return_order_item_id, source_rescreen_batch_id,
        source_rescreen_batch_item_id, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE id = id");
    $stmt->execute([
        $inventoryItemId, trim($sourceType), $sourceId,
        $links['source_order_id'] ?? null,
        $links['source_order_item_id'] ?? null,
        $links['source_work_order_id'] ?? null,
        $links['source_stage_id'] ?? null,
        $links['source_machine_result_id'] ?? null,
        $links['source_stage_transfer_id'] ?? null,
        $links['source_shipping_order_id'] ?? null,
        $links['source_shipping_order_item_id'] ?? null,
        $links['source_return_order_id'] ?? null,
        $links['source_return_order_item_id'] ?? null,
        $links['source_rescreen_batch_id'] ?? null,
        $links['source_rescreen_batch_item_id'] ?? null,
        $notes,
    ]);
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
                     OR oi.order_item_number LIKE :keyword_order_item
                     OR o.order_number LIKE :keyword_order
                     OR c.name LIKE :keyword_customer
                     OR si.name LIKE :keyword_item)";
        $keyword = "%{$filters['keyword']}%";
        $params['keyword'] = $keyword;
        $params['keyword_batch'] = $keyword;
        $params['keyword_wo'] = $keyword;
        $params['keyword_order_item'] = $keyword;
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

    if (!empty($filters['stock_category'])) {
        $stockCategory = strtolower(trim((string)$filters['stock_category']));
        if (in_array($stockCategory, ['good', 'defect'], true)) {
            $where[] = 'ii.stock_category = :stock_category';
            $params['stock_category'] = $stockCategory;
        }
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
