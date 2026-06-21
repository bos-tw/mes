<?php
/**
 * 工單管理 - 輔助函式
 *
 * 本檔案包含工單模組的共用函式：
 *
 * ## 資料讀取與驗證
 * - readWorkOrderPayload()      讀取請求資料 (JSON/FormData)
 * - validateWorkOrderData()     驗證輸入資料
 *
 * ## 工單號碼生成
 * - generateWorkOrderNumber()   產生工單號碼 (WO-YYYYMMDD-NNNN)
 *
 * ## 驗證欄位說明
 * - order_item_id:              訂單品項 ID，新增時必填
 * - work_order_type:            工單類型 normal/split，可選
 * - machine_id:                 機台 ID，可選
 * - machine_sequence:           機台內排序序號，可選
 * - assigned_employee_id:       指定員工 ID，可選
 * - calibration_employee_id:    校機人員 ID，可選
 * - scheduled_start_date:       預定開始日期 (Y-m-d\TH:i)
 * - scheduled_end_date:         預定結束日期
 * - actual_start_date:          實際開始日期
 * - actual_end_date:            實際結束日期
 * - quantity_to_produce:        生產數量，非負數
 * - screening_speed:            篩選速度
 * - customer_instructions:      客戶交辦事項
 * - other_notes:                其他說明備註
 *
 * @see /api/work_orders/index.php   列表與新增
 * @see /api/work_orders/show.php    單筆查詢
 * @see /api/work_orders/update.php  更新
 * @see /api/work_orders/delete.php  刪除
 */
declare(strict_types=1);

require_once __DIR__ . '/../number_sequences/helpers.php';

/**
 * Check if table has a specific column (cached per-request).
 */
function workOrderTableHasColumn(PDO $pdo, string $table, string $column): bool
{
    static $cache = [];
    $key = $table . '.' . $column;
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }

    $stmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name
    ");
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);

    $cache[$key] = ((int)$stmt->fetchColumn()) > 0;
    return $cache[$key];
}

/**
 * Fetch order-item tool details for work order preset production records.
 *
 * @return array<int,array<string,mixed>>
 */
function fetchWorkOrderToolDetails(PDO $pdo, int $orderItemId): array
{
    $stmt = $pdo->prepare("
        SELECT
            oit.id,
            oit.tool_id,
            t.tool_number,
            t.name AS tool_name,
            oit.tool_type,
            oit.quantity,
            oit.total_weight
        FROM order_item_tools oit
        LEFT JOIN tools t ON t.id = oit.tool_id
        WHERE oit.order_item_id = :order_item_id
        ORDER BY t.name ASC, oit.id ASC
    ");
    $stmt->execute(['order_item_id' => $orderItemId]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $result = [];
    foreach ($rows as $row) {
        $quantity = (float)($row['quantity'] ?? 0);
        $totalWeight = (float)($row['total_weight'] ?? 0);
        $unitWeight = $quantity > 0 ? round($totalWeight / $quantity, 3) : 0.0;

        $result[] = [
            'id' => (int)($row['id'] ?? 0),
            'tool_id' => (int)($row['tool_id'] ?? 0),
            'tool_number' => (string)($row['tool_number'] ?? ''),
            'tool_name' => (string)($row['tool_name'] ?: ($row['tool_type'] ?? '')),
            'tool_type' => (string)($row['tool_type'] ?? ''),
            'quantity' => $quantity,
            'total_weight_kg' => round($totalWeight, 3),
            'unit_weight_kg' => $unitWeight,
        ];
    }

    return $result;
}

/**
 * Validate and normalise partial-receipt shipping tools against order-item tools.
 *
 * @param mixed $payloadTools
 * @param list<array<string,mixed>> $availableTools
 * @return array{
 *     items:list<array<string,mixed>>,
 *     summary:string,
 *     total_weight_kg:float
 * }
 */
function normalisePartialReceiptShippingTools($payloadTools, array $availableTools): array
{
    if (!is_array($payloadTools)) {
        throw new InvalidArgumentException('本次出貨載具資料格式不正確。');
    }

    $availableById = [];
    foreach ($availableTools as $tool) {
        $availableId = isset($tool['id']) ? (int)$tool['id'] : 0;
        if ($availableId > 0) {
            $availableById[$availableId] = $tool;
        }
    }

    if ($availableById === []) {
        throw new InvalidArgumentException('此工單尚未設定可用載具，請先到訂單品項維護載具資料。');
    }

    $aggregatedQuantities = [];
    foreach ($payloadTools as $index => $toolRow) {
        if (!is_array($toolRow)) {
            throw new InvalidArgumentException('第 ' . ($index + 1) . ' 筆出貨載具資料格式不正確。');
        }

        $orderItemToolId = filter_var(
            $toolRow['order_item_tool_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        if ($orderItemToolId === false || !isset($availableById[(int)$orderItemToolId])) {
            throw new InvalidArgumentException('第 ' . ($index + 1) . ' 筆出貨載具不存在或已失效。');
        }

        $quantity = filter_var(
            $toolRow['quantity'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        if ($quantity === false) {
            throw new InvalidArgumentException('第 ' . ($index + 1) . ' 筆出貨載具數量必須為正整數。');
        }

        $normalizedToolId = (int)$orderItemToolId;
        if (!isset($aggregatedQuantities[$normalizedToolId])) {
            $aggregatedQuantities[$normalizedToolId] = 0;
        }
        $aggregatedQuantities[$normalizedToolId] += (int)$quantity;
    }

    if ($aggregatedQuantities === []) {
        throw new InvalidArgumentException('請至少選擇一種本次出貨載具。');
    }

    $items = [];
    $summaryParts = [];
    $totalWeightKg = 0.0;

    foreach ($aggregatedQuantities as $orderItemToolId => $quantity) {
        $tool = $availableById[$orderItemToolId];
        $toolName = trim((string)($tool['tool_name'] ?? ''));
        $toolType = trim((string)($tool['tool_type'] ?? ''));
        $toolLabel = $toolName !== '' ? $toolName : ($toolType !== '' ? $toolType : ('載具#' . $orderItemToolId));
        if ($toolType !== '' && $toolType !== $toolLabel) {
            $toolLabel .= ' / ' . $toolType;
        }

        $unitWeightKg = round((float)($tool['unit_weight_kg'] ?? 0), 3);
        $lineWeightKg = round($unitWeightKg * (int)$quantity, 3);
        $totalWeightKg += $lineWeightKg;

        $items[] = [
            'order_item_tool_id' => (int)$orderItemToolId,
            'tool_id' => isset($tool['tool_id']) ? (int)$tool['tool_id'] : null,
            'tool_number' => trim((string)($tool['tool_number'] ?? '')) ?: null,
            'tool_name' => $toolName !== '' ? $toolName : $toolLabel,
            'tool_type' => $toolType !== '' ? $toolType : null,
            'unit_weight_kg' => $unitWeightKg,
            'quantity' => (int)$quantity,
            'total_weight_kg' => $lineWeightKg,
        ];

        $summaryParts[] = sprintf(
            '%s x %d（%.3f kg/個，小計 %.3f kg）',
            $toolLabel,
            (int)$quantity,
            $unitWeightKg,
            $lineWeightKg
        );
    }

    $totalWeightKg = round($totalWeightKg, 3);
    $summary = implode('；', $summaryParts);
    if ($summary !== '') {
        $summary .= sprintf('；參考載具總重 %.3f kg', $totalWeightKg);
    }

    return [
        'items' => $items,
        'summary' => $summary,
        'total_weight_kg' => $totalWeightKg,
    ];
}

/**
 * @param list<int> $partialReceiptIds
 * @return array<int,list<array<string,mixed>>>
 */
function fetchPartialReceiptToolDetailsMap(PDO $pdo, array $partialReceiptIds): array
{
    $normalizedIds = array_values(array_filter(array_map('intval', $partialReceiptIds), static fn(int $id): bool => $id > 0));
    if ($normalizedIds === []) {
        return [];
    }

    $placeholders = implode(', ', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            woprt.id,
            woprt.partial_receipt_id,
            woprt.order_item_tool_id,
            woprt.tool_id,
            woprt.tool_name,
            woprt.tool_type,
            woprt.unit_weight_kg,
            woprt.quantity,
            woprt.total_weight_kg
        FROM work_order_partial_receipt_tools woprt
        WHERE woprt.partial_receipt_id IN ({$placeholders})
        ORDER BY woprt.partial_receipt_id ASC, woprt.id ASC
    ");
    $stmt->execute($normalizedIds);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $grouped = [];
    foreach ($rows as $row) {
        $partialReceiptId = (int)($row['partial_receipt_id'] ?? 0);
        if ($partialReceiptId <= 0) {
            continue;
        }

        if (!isset($grouped[$partialReceiptId])) {
            $grouped[$partialReceiptId] = [];
        }

        $grouped[$partialReceiptId][] = [
            'id' => (int)($row['id'] ?? 0),
            'partial_receipt_id' => $partialReceiptId,
            'order_item_tool_id' => isset($row['order_item_tool_id']) ? (int)$row['order_item_tool_id'] : null,
            'tool_id' => isset($row['tool_id']) ? (int)$row['tool_id'] : null,
            'tool_name' => (string)($row['tool_name'] ?? ''),
            'tool_type' => $row['tool_type'] !== null ? (string)$row['tool_type'] : null,
            'unit_weight_kg' => round((float)($row['unit_weight_kg'] ?? 0), 3),
            'quantity' => (int)round((float)($row['quantity'] ?? 0)),
            'total_weight_kg' => round((float)($row['total_weight_kg'] ?? 0), 3),
        ];
    }

    return $grouped;
}

/**
 * Fetch drawings bound to the source order item.
 *
 * @return array<int,array<string,mixed>>
 */
function fetchWorkOrderDrawings(PDO $pdo, int $orderItemId): array
{
    $stmt = $pdo->prepare("
        SELECT
            id,
            drawing_number,
            file_name,
            file_path,
            file_size,
            mime_type,
            created_at
        FROM order_item_drawings
        WHERE order_item_id = :order_item_id
        ORDER BY id ASC
    ");
    $stmt->execute(['order_item_id' => $orderItemId]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_map(static function (array $row): array {
        return [
            'id' => (int)($row['id'] ?? 0),
            'drawing_number' => (string)($row['drawing_number'] ?? ''),
            'file_name' => (string)($row['file_name'] ?? ''),
            'file_path' => (string)($row['file_path'] ?? ''),
            'file_size' => isset($row['file_size']) ? (int)$row['file_size'] : 0,
            'mime_type' => (string)($row['mime_type'] ?? ''),
            'uploaded_at' => $row['created_at'] ?? null,
        ];
    }, $rows);
}

function workOrderUnitsFromWeight(float $netWeightKg, float $weightPerUnitG): float
{
    if ($netWeightKg <= 0 || $weightPerUnitG <= 0) {
        return 0.0;
    }

    $rawUnits = ($netWeightKg * 1000) / $weightPerUnitG;
    return (float)max((int)floor($rawUnits + 0.000001), 0);
}

function workOrderWeightFromUnits(float $units, float $weightPerUnitG): float
{
    if ($units <= 0 || $weightPerUnitG <= 0) {
        return 0.0;
    }

    return round(($units * $weightPerUnitG) / 1000, 2);
}

function workOrderDefectUnitsFromWeight(float $defectWeightKg, float $weightPerUnitG): float
{
    if ($defectWeightKg <= 0 || $weightPerUnitG <= 0) {
        return 0.0;
    }

    return (float)max((int)round(($defectWeightKg * 1000) / $weightPerUnitG), 0);
}

/**
 * @return array<string,mixed>
 */
function fetchWorkOrderProductionSummary(PDO $pdo, int $workOrderId, string $workOrderType, float $weightPerUnitG): array
{
    $toolWeightSql = workOrderTableHasColumn($pdo, 'production_records', 'tool_weight_kg')
        ? 'COALESCE(SUM(COALESCE(tool_weight_kg, 0)), 0)'
        : '0';

    $recordStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS record_count,
            COALESCE(SUM(COALESCE(weight_kg, 0)), 0) AS total_weight_kg,
            {$toolWeightSql} AS total_tool_weight_kg
        FROM production_records
        WHERE work_order_id = :work_order_id
    ");
    $recordStmt->execute(['work_order_id' => $workOrderId]);
    $recordSummary = $recordStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $recordNetWeightKg = round(max(
        0,
        (float)($recordSummary['total_weight_kg'] ?? 0) - (float)($recordSummary['total_tool_weight_kg'] ?? 0)
    ), 2);

    $machineCompletedNetWeightKg = 0.0;
    if ($workOrderType === 'split' && workOrderTableHasColumn($pdo, 'work_order_machine_runs', 'completed_net_weight_kg')) {
        $machineStmt = $pdo->prepare("
            SELECT COALESCE(SUM(COALESCE(completed_net_weight_kg, 0)), 0)
            FROM work_order_machine_runs
            WHERE work_order_id = :work_order_id
              AND deleted_at IS NULL
        ");
        $machineStmt->execute(['work_order_id' => $workOrderId]);
        $machineCompletedNetWeightKg = round((float)$machineStmt->fetchColumn(), 2);
    }

    $producedNetWeightKg = $workOrderType === 'split' && $machineCompletedNetWeightKg > 0.0001
        ? $machineCompletedNetWeightKg
        : $recordNetWeightKg;

    return [
        'record_count' => (int)($recordSummary['record_count'] ?? 0),
        'record_net_weight_kg' => $recordNetWeightKg,
        'machine_completed_net_weight_kg' => $machineCompletedNetWeightKg,
        'produced_net_weight_kg' => $producedNetWeightKg,
        'produced_units' => workOrderUnitsFromWeight($producedNetWeightKg, $weightPerUnitG),
    ];
}

/**
 * @return array<string,mixed>
 */
function fetchWorkOrderFinalInventorySummary(PDO $pdo, int $workOrderId, float $weightPerUnitG): array
{
    $stmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(net_weight_kg), 0) AS final_received_net_weight_kg,
            COALESCE(SUM(total_good_units), 0) AS final_received_units
        FROM inventory_items
        WHERE work_order_id = :work_order_id
          AND deleted_at IS NULL
          AND receipt_type IN ('standard', 'final')
    ");
    $stmt->execute(['work_order_id' => $workOrderId]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $finalNetWeightKg = round((float)($summary['final_received_net_weight_kg'] ?? 0), 2);
    $finalUnits = (float)round((float)($summary['final_received_units'] ?? 0), 0);
    if ($finalUnits <= 0 && $finalNetWeightKg > 0.0001) {
        $finalUnits = workOrderUnitsFromWeight($finalNetWeightKg, $weightPerUnitG);
    }

    return [
        'final_received_net_weight_kg' => $finalNetWeightKg,
        'final_received_units' => $finalUnits,
    ];
}

/**
 * @return array{summary: array<string,mixed>, partial_receipts: array<int,array<string,mixed>>}
 */
function fetchWorkOrderPartialReceiptLedger(PDO $pdo, int $workOrderId): array
{
    $shippingSummarySql = "
        SELECT
            soi.inventory_item_id,
            COALESCE(SUM(COALESCE(soi.shipped_quantity, 0)), 0) AS shipped_units,
            COUNT(DISTINCT soi.shipping_order_id) AS shipping_order_count,
            GROUP_CONCAT(
                DISTINCT CONCAT(
                    COALESCE(so.id, 0), '::',
                    COALESCE(so.shipping_order_number, ''), '::',
                    COALESCE(so.status, '')
                )
                ORDER BY so.shipping_date DESC, so.id DESC
                SEPARATOR '||'
            ) AS shipping_order_refs
        FROM shipping_order_items soi
        LEFT JOIN shipping_orders so ON so.id = soi.shipping_order_id
        GROUP BY soi.inventory_item_id
    ";

    $stmt = $pdo->prepare("
        SELECT
            wopr.*,
            ii.inventory_number,
            COALESCE(ii.quantity_on_hand, 0) AS quantity_on_hand,
            COALESCE(ii.quantity_allocated, 0) AS quantity_allocated,
            COALESCE(ii.quantity_reserved, 0) AS quantity_reserved,
            COALESCE(ii.quantity_shipped, 0) AS inventory_quantity_shipped,
            womr.run_label,
            womr.status AS machine_run_status,
            m.name AS machine_name,
            creator.name AS created_by_name,
            settler.name AS settled_by_name,
            reverser.name AS reversed_by_name,
            COALESCE(shipping.shipped_units, 0) AS shipped_units,
            COALESCE(shipping.shipping_order_count, 0) AS shipping_order_count,
            shipping.shipping_order_refs
        FROM work_order_partial_receipts wopr
        LEFT JOIN inventory_items ii ON ii.id = wopr.inventory_item_id
        LEFT JOIN work_order_machine_runs womr ON womr.id = wopr.machine_run_id
        LEFT JOIN machines m ON m.id = womr.machine_id
        LEFT JOIN employees creator ON creator.id = wopr.created_by_employee_id
        LEFT JOIN employees settler ON settler.id = wopr.settled_by_employee_id
        LEFT JOIN employees reverser ON reverser.id = wopr.reversed_by_employee_id
        LEFT JOIN (
            {$shippingSummarySql}
        ) shipping ON shipping.inventory_item_id = wopr.inventory_item_id
        WHERE wopr.work_order_id = :work_order_id
        ORDER BY wopr.created_at DESC, wopr.id DESC
    ");
    $stmt->execute(['work_order_id' => $workOrderId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $toolDetailsByReceiptId = fetchPartialReceiptToolDetailsMap(
        $pdo,
        array_map(static fn(array $row): int => (int)($row['id'] ?? 0), $rows)
    );

    $receipts = [];
    $summary = [
        'partial_receipt_count' => 0,
        'partial_received_net_weight_kg' => 0.0,
        'partial_received_units' => 0.0,
        'partial_shipped_units' => 0.0,
        'partial_in_stock_units' => 0.0,
        'partial_allocated_units' => 0.0,
        'partial_reserved_units' => 0.0,
        'partial_available_to_ship_units' => 0.0,
        'partial_unshipped_net_weight_kg' => 0.0,
        'partial_allocated_net_weight_kg' => 0.0,
        'partial_reserved_net_weight_kg' => 0.0,
        'partial_available_to_ship_net_weight_kg' => 0.0,
        'partial_shipped_net_weight_kg' => 0.0,
    ];

    foreach ($rows as $row) {
        $receiptStatus = (string)($row['receipt_status'] ?? 'partial');
        $netWeightKg = round((float)($row['net_weight_kg'] ?? 0), 2);
        $weightPerUnitG = round((float)($row['weight_per_unit_g'] ?? 0), 3);
        $calculatedUnits = (float)round((float)($row['calculated_units'] ?? 0), 0);
        $quantityOnHand = (float)round((float)($row['quantity_on_hand'] ?? 0), 0);
        $quantityAllocated = (float)round((float)($row['quantity_allocated'] ?? 0), 0);
        $quantityReserved = (float)round((float)($row['quantity_reserved'] ?? 0), 0);
        $quantityShipped = (float)round(max(
            (float)($row['shipped_units'] ?? 0),
            (float)($row['inventory_quantity_shipped'] ?? 0)
        ), 0);
        $quantityAvailableToShip = (float)round(max($quantityOnHand - $quantityAllocated, 0), 0);
        $unshippedNetWeightKg = workOrderWeightFromUnits($quantityOnHand, $weightPerUnitG);
        $allocatedNetWeightKg = workOrderWeightFromUnits($quantityAllocated, $weightPerUnitG);
        $reservedNetWeightKg = workOrderWeightFromUnits($quantityReserved, $weightPerUnitG);
        $availableToShipNetWeightKg = workOrderWeightFromUnits($quantityAvailableToShip, $weightPerUnitG);
        $shippedNetWeightKg = workOrderWeightFromUnits($quantityShipped, $weightPerUnitG);

        $shippingOrders = [];
        $shippingRefs = trim((string)($row['shipping_order_refs'] ?? ''));
        if ($shippingRefs !== '') {
            foreach (explode('||', $shippingRefs) as $ref) {
                [$shippingOrderId, $shippingOrderNumber, $shippingOrderStatus] = array_pad(explode('::', $ref), 3, '');
                $shippingOrders[] = [
                    'shipping_order_id' => (int)$shippingOrderId,
                    'shipping_order_number' => $shippingOrderNumber !== '' ? $shippingOrderNumber : null,
                    'shipping_order_status' => $shippingOrderStatus !== '' ? $shippingOrderStatus : null,
                ];
            }
        }

        if ($receiptStatus !== 'reversed') {
            $summary['partial_receipt_count']++;
            $summary['partial_received_net_weight_kg'] += $netWeightKg;
            $summary['partial_received_units'] += $calculatedUnits;
            $summary['partial_shipped_units'] += $quantityShipped;
            $summary['partial_in_stock_units'] += $quantityOnHand;
            $summary['partial_allocated_units'] += $quantityAllocated;
            $summary['partial_reserved_units'] += $quantityReserved;
            $summary['partial_available_to_ship_units'] += $quantityAvailableToShip;
            $summary['partial_unshipped_net_weight_kg'] += $unshippedNetWeightKg;
            $summary['partial_allocated_net_weight_kg'] += $allocatedNetWeightKg;
            $summary['partial_reserved_net_weight_kg'] += $reservedNetWeightKg;
            $summary['partial_available_to_ship_net_weight_kg'] += $availableToShipNetWeightKg;
            $summary['partial_shipped_net_weight_kg'] += $shippedNetWeightKg;
        }

        $sourceLabel = $row['machine_run_id']
            ? (trim((string)($row['run_label'] ?? '')) !== ''
                ? (string)$row['run_label']
                : (trim((string)($row['machine_name'] ?? '')) !== '' ? (string)$row['machine_name'] : '拆分機台'))
            : '一般工單';
        $receiptId = (int)($row['id'] ?? 0);
        $shippingTools = $toolDetailsByReceiptId[$receiptId] ?? [];
        $shippingToolTotalWeightKg = 0.0;
        foreach ($shippingTools as $shippingTool) {
            $shippingToolTotalWeightKg += (float)($shippingTool['total_weight_kg'] ?? 0);
        }

        $receipts[] = [
            'id' => $receiptId,
            'work_order_id' => (int)($row['work_order_id'] ?? 0),
            'machine_run_id' => isset($row['machine_run_id']) ? (int)$row['machine_run_id'] : null,
            'source_label' => $sourceLabel,
            'inventory_item_id' => isset($row['inventory_item_id']) ? (int)$row['inventory_item_id'] : null,
            'inventory_number' => $row['inventory_number'] ?? null,
            'receipt_number' => $row['receipt_number'] ?? null,
            'net_weight_kg' => $netWeightKg,
            'weight_per_unit_g' => $weightPerUnitG,
            'calculated_units' => $calculatedUnits,
            'quantity_shipped' => $quantityShipped,
            'quantity_allocated' => $quantityAllocated,
            'quantity_reserved' => $quantityReserved,
            'quantity_on_hand' => $quantityOnHand,
            'quantity_available_to_ship' => $quantityAvailableToShip,
            'unshipped_net_weight_kg' => $unshippedNetWeightKg,
            'allocated_net_weight_kg' => $allocatedNetWeightKg,
            'reserved_net_weight_kg' => $reservedNetWeightKg,
            'available_to_ship_net_weight_kg' => $availableToShipNetWeightKg,
            'shipped_net_weight_kg' => $shippedNetWeightKg,
            'shipping_order_count' => (int)($row['shipping_order_count'] ?? 0),
            'shipping_orders' => $shippingOrders,
            'receipt_status' => $receiptStatus,
            'notes' => $row['notes'] ?? null,
            'shipping_tool_details' => $row['shipping_tool_details'] ?? null,
            'shipping_tools' => $shippingTools,
            'shipping_tool_total_weight_kg' => round($shippingToolTotalWeightKg, 3),
            'created_by_name' => $row['created_by_name'] ?? null,
            'created_at' => $row['created_at'] ?? null,
            'settled_at' => $row['settled_at'] ?? null,
            'settled_by_name' => $row['settled_by_name'] ?? null,
            'reversed_at' => $row['reversed_at'] ?? null,
            'reversed_by_name' => $row['reversed_by_name'] ?? null,
            'reverse_reason' => $row['reverse_reason'] ?? null,
        ];
    }

    foreach ($summary as $key => $value) {
        if ($key === 'partial_receipt_count') {
            continue;
        }
        if (str_ends_with((string)$key, '_net_weight_kg')) {
            $summary[$key] = round((float)$value, 2);
            continue;
        }
        $summary[$key] = (float)round((float)$value, 0);
    }
    $summary['partial_received_net_weight_kg'] = round((float)$summary['partial_received_net_weight_kg'], 2);

    return [
        'summary' => $summary,
        'partial_receipts' => $receipts,
    ];
}

/**
 * @param array<string,mixed> $workOrder
 * @param array<string,mixed> $productionSummary
 * @param array<string,mixed> $partialReceiptSummary
 * @param array<string,mixed> $finalInventorySummary
 * @return array<string,mixed>
 */
function buildWorkOrderPartialReceiptSummary(
    array $workOrder,
    array $productionSummary,
    array $partialReceiptSummary,
    array $finalInventorySummary
): array {
    $weightPerUnitG = round((float)($workOrder['weight_per_unit_g'] ?? 0), 3);
    $expectedNetWeightKg = round((float)($workOrder['total_weight_kg'] ?? 0), 2);
    $expectedUnits = workOrderUnitsFromWeight($expectedNetWeightKg, $weightPerUnitG);
    $producedNetWeightKg = round((float)($productionSummary['produced_net_weight_kg'] ?? 0), 2);
    $producedUnits = (float)round((float)($productionSummary['produced_units'] ?? 0), 0);
    $partialReceivedNetWeightKg = round((float)($partialReceiptSummary['partial_received_net_weight_kg'] ?? 0), 2);
    $partialReceivedUnits = (float)round((float)($partialReceiptSummary['partial_received_units'] ?? 0), 0);
    $partialShippedUnits = (float)round((float)($partialReceiptSummary['partial_shipped_units'] ?? 0), 0);
    $partialInStockUnits = (float)round((float)($partialReceiptSummary['partial_in_stock_units'] ?? 0), 0);
    $partialAllocatedUnits = (float)round((float)($partialReceiptSummary['partial_allocated_units'] ?? 0), 0);
    $partialReservedUnits = (float)round((float)($partialReceiptSummary['partial_reserved_units'] ?? 0), 0);
    $partialAvailableToShipUnits = (float)round((float)($partialReceiptSummary['partial_available_to_ship_units'] ?? 0), 0);
    $partialUnshippedNetWeightKg = round((float)($partialReceiptSummary['partial_unshipped_net_weight_kg'] ?? 0), 2);
    $partialAllocatedNetWeightKg = round((float)($partialReceiptSummary['partial_allocated_net_weight_kg'] ?? 0), 2);
    $partialReservedNetWeightKg = round((float)($partialReceiptSummary['partial_reserved_net_weight_kg'] ?? 0), 2);
    $partialAvailableToShipNetWeightKg = round((float)($partialReceiptSummary['partial_available_to_ship_net_weight_kg'] ?? 0), 2);
    $partialShippedNetWeightKg = round((float)($partialReceiptSummary['partial_shipped_net_weight_kg'] ?? 0), 2);
    $finalReceivedNetWeightKg = round((float)($finalInventorySummary['final_received_net_weight_kg'] ?? 0), 2);
    $finalReceivedUnits = (float)round((float)($finalInventorySummary['final_received_units'] ?? 0), 0);
    $shortageNetWeightKg = round((float)($workOrder['shortage_net_weight_kg'] ?? 0), 2);
    $shortageUnits = (float)round((float)($workOrder['shortage_units'] ?? 0), 0);
    if ($shortageUnits <= 0 && $shortageNetWeightKg > 0.0001) {
        $shortageUnits = workOrderUnitsFromWeight($shortageNetWeightKg, $weightPerUnitG);
    }

    return [
        'expected_net_weight_kg' => $expectedNetWeightKg,
        'expected_units' => $expectedUnits,
        'produced_net_weight_kg' => $producedNetWeightKg,
        'produced_units' => $producedUnits,
        'partial_receipt_count' => (int)($partialReceiptSummary['partial_receipt_count'] ?? 0),
        'partial_received_net_weight_kg' => $partialReceivedNetWeightKg,
        'partial_received_units' => $partialReceivedUnits,
        'partial_shipped_units' => $partialShippedUnits,
        'partial_in_stock_units' => $partialInStockUnits,
        'partial_allocated_units' => $partialAllocatedUnits,
        'partial_reserved_units' => $partialReservedUnits,
        'partial_available_to_ship_units' => $partialAvailableToShipUnits,
        'partial_unshipped_net_weight_kg' => $partialUnshippedNetWeightKg,
        'partial_allocated_net_weight_kg' => $partialAllocatedNetWeightKg,
        'partial_reserved_net_weight_kg' => $partialReservedNetWeightKg,
        'partial_available_to_ship_net_weight_kg' => $partialAvailableToShipNetWeightKg,
        'partial_shipped_net_weight_kg' => $partialShippedNetWeightKg,
        'final_received_net_weight_kg' => $finalReceivedNetWeightKg,
        'final_received_units' => $finalReceivedUnits,
        'shortage_net_weight_kg' => $shortageNetWeightKg,
        'shortage_units' => $shortageUnits,
        'shortage_reason_code' => $workOrder['shortage_reason_code'] ?? null,
        'shortage_notes' => $workOrder['shortage_notes'] ?? null,
        'shortage_confirmed_by' => isset($workOrder['shortage_confirmed_by']) ? (int)$workOrder['shortage_confirmed_by'] : null,
        'shortage_confirmed_at' => $workOrder['shortage_confirmed_at'] ?? null,
        'balance_difference_net_weight_kg' => round(
            $expectedNetWeightKg - $partialReceivedNetWeightKg - $finalReceivedNetWeightKg - $shortageNetWeightKg,
            2
        ),
    ];
}

/**
 * Fetch work-order execution image records from a dedicated image table.
 *
 * @return array<int,array<string,mixed>>
 */
function fetchWorkOrderExecutionImages(PDO $pdo, string $tableName, int $workOrderId): array
{
    $stmt = $pdo->prepare("
        SELECT
            i.*,
            e.name AS uploaded_by_name
        FROM {$tableName} i
        LEFT JOIN employees e ON i.uploaded_by_employee_id = e.id
        WHERE i.work_order_id = :work_order_id
          AND i.deleted_at IS NULL
        ORDER BY i.sort_order ASC, i.id ASC
    ");
    $stmt->execute(['work_order_id' => $workOrderId]);

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_map(static function (array $row): array {
        return [
            'id' => (int)($row['id'] ?? 0),
            'work_order_id' => (int)($row['work_order_id'] ?? 0),
            'file_name' => (string)($row['file_name'] ?? ''),
            'file_path' => (string)($row['file_path'] ?? ''),
            'file_size' => isset($row['file_size']) ? (int)$row['file_size'] : 0,
            'mime_type' => (string)($row['mime_type'] ?? ''),
            'sort_order' => isset($row['sort_order']) ? (int)$row['sort_order'] : 0,
            'description' => $row['description'] ?? null,
            'uploaded_at' => $row['uploaded_at'] ?? null,
            'uploaded_by_employee_id' => isset($row['uploaded_by_employee_id']) ? (int)$row['uploaded_by_employee_id'] : null,
            'uploaded_by_name' => $row['uploaded_by_name'] ?? null,
        ];
    }, $rows);
}

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readWorkOrderPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

/**
 * Check whether a submitted value should be treated as actual user-entered data.
 *
 * @param mixed $value
 */
function hasFilledWorkOrderValue($value): bool
{
    if ($value === null) {
        return false;
    }

    if (is_string($value)) {
        return trim($value) !== '';
    }

    return $value !== '';
}

/**
 * Production rows can be auto-generated as planning/card-number rows.
 * Only rows with actual production data should be persisted or block deletion.
 *
 * @param array<string,mixed> $record
 */
function isMeaningfulProductionRecord(array $record): bool
{
    foreach (['weight_kg', 'production_date', 'production_time', 'machine_id', 'tool_name', 'tool_weight_kg', 'notes'] as $field) {
        if (array_key_exists($field, $record) && hasFilledWorkOrderValue($record[$field])) {
            return true;
        }
    }

    return false;
}

/**
 * @param array<int,array<string,mixed>>|array<mixed> $records
 * @return array<int,array<string,mixed>>
 */
function filterMeaningfulProductionRecords(array $records): array
{
    $filtered = [];

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }

        if (empty($record['card_number']) || !isMeaningfulProductionRecord($record)) {
            continue;
        }

        $filtered[] = $record;
    }

    return $filtered;
}

/**
 * Split machine production records inherit machine_id from their machine run.
 * Do not treat inherited machine_id alone as real production history.
 *
 * @param array<int,array<string,mixed>>|array<mixed> $records
 * @return array<int,array<string,mixed>>
 */
function filterMeaningfulMachineRunProductionRecords(array $records): array
{
    $filtered = [];

    foreach ($records as $record) {
        if (!is_array($record) || empty($record['card_number'])) {
            continue;
        }

        foreach (['weight_kg', 'production_date', 'production_time', 'tool_name', 'tool_weight_kg', 'notes'] as $field) {
            if (array_key_exists($field, $record) && hasFilledWorkOrderValue($record[$field])) {
                $filtered[] = $record;
                break;
            }
        }
    }

    return $filtered;
}

function normalizeWorkOrderDateTimeValue($value): ?string
{
    $value = trim((string)($value ?? ''));
    if ($value === '') {
        return null;
    }

    foreach (['Y-m-d\TH:i', 'Y-m-d H:i:s', 'Y-m-d H:i'] as $format) {
        $date = DateTime::createFromFormat($format, $value);
        if ($date instanceof DateTime) {
            return $date->format('Y-m-d H:i:s');
        }
    }

    return null;
}

/**
 * @param array<int,array<string,mixed>>|array<mixed> $machineRuns
 * @return array{runs: array<int,array<string,mixed>>, errors: array<string,string>}
 */
function validateWorkOrderMachineRuns(array $machineRuns, float $expectedNetWeightKg, float $fallbackUnitWeightG): array
{
    $errors = [];
    $normalisedRuns = [];
    $totalCompletedNetWeight = 0.0;

    foreach ($machineRuns as $index => $run) {
        if (!is_array($run)) {
            continue;
        }

        $rowNo = $index + 1;
        $machineId = $run['machine_id'] ?? null;
        $machineIdInt = null;
        if ($machineId !== null && $machineId !== '') {
            $machineIdInt = filter_var($machineId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($machineIdInt === false) {
                $errors["machine_runs.$index.machine_id"] = "第 {$rowNo} 個機台頁籤的機台 ID 不正確。";
            }
        } else {
            $errors["machine_runs.$index.machine_id"] = "第 {$rowNo} 個機台頁籤必須從機台設備管理選擇實際機台。";
        }

        $plannedNetWeight = (float)($run['planned_net_weight_kg'] ?? 0);
        $completedNetWeight = (float)($run['completed_net_weight_kg'] ?? 0);
        $quantityToProduce = $run['quantity_to_produce'] ?? null;
        $quantityToProduceFloat = null;
        if ($quantityToProduce !== null && $quantityToProduce !== '') {
            $quantityToProduceFloat = filter_var($quantityToProduce, FILTER_VALIDATE_FLOAT);
            if ($quantityToProduceFloat === false || $quantityToProduceFloat < 0) {
                $errors["machine_runs.$index.quantity_to_produce"] = "第 {$rowNo} 個機台頁籤的生產數量必須為非負數。";
                $quantityToProduceFloat = null;
            }
        }

        $assignedEmployeeId = $run['assigned_employee_id'] ?? null;
        $assignedEmployeeIdInt = null;
        if ($assignedEmployeeId !== null && $assignedEmployeeId !== '') {
            $assignedEmployeeIdInt = filter_var($assignedEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($assignedEmployeeIdInt === false) {
                $errors["machine_runs.$index.assigned_employee_id"] = "第 {$rowNo} 個機台頁籤的指定員工 ID 不正確。";
            }
        }

        $calibrationEmployeeId = $run['calibration_employee_id'] ?? null;
        $calibrationEmployeeIdInt = null;
        if ($calibrationEmployeeId !== null && $calibrationEmployeeId !== '') {
            $calibrationEmployeeIdInt = filter_var($calibrationEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($calibrationEmployeeIdInt === false) {
                $errors["machine_runs.$index.calibration_employee_id"] = "第 {$rowNo} 個機台頁籤的校機人員 ID 不正確。";
            }
        }

        $unitWeight = (float)($run['weight_per_unit_g'] ?? $fallbackUnitWeightG);
        if ($unitWeight <= 0) {
            $unitWeight = $fallbackUnitWeightG;
        }

        if ($plannedNetWeight < 0 || $completedNetWeight < 0) {
            $errors["machine_runs.$index.weight"] = "第 {$rowNo} 個機台頁籤重量不可小於 0。";
        }

        $totalCompletedNetWeight += $completedNetWeight;
        $plannedUnits = $unitWeight > 0 ? round($plannedNetWeight * 1000 / $unitWeight, 2) : 0.0;
        $completedUnits = $unitWeight > 0 ? round($completedNetWeight * 1000 / $unitWeight, 2) : 0.0;

        $status = strtolower(trim((string)($run['status'] ?? 'pending')));
        if (!in_array($status, ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'], true)) {
            $status = 'pending';
        }

        $defects = [];
        if (isset($run['defects']) && is_array($run['defects'])) {
            foreach ($run['defects'] as $defectIndex => $defect) {
                if (!is_array($defect)) {
                    continue;
                }

                $serviceId = filter_var($defect['screening_service_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($serviceId === false) {
                    $errors["machine_runs.$index.defects.$defectIndex.screening_service_id"] = "第 {$rowNo} 個機台頁籤有不正確的不良項目。";
                    continue;
                }

                $quantity = $defect['defect_quantity'] ?? null;
                if ($quantity === null || $quantity === '') {
                    $errors["machine_runs.$index.defects.$defectIndex.defect_quantity"] = "第 {$rowNo} 個機台頁籤的不良數量不可留空，若無不良請填 0。";
                    continue;
                }

                $quantityInt = filter_var($quantity, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
                if ($quantityInt === false) {
                    $errors["machine_runs.$index.defects.$defectIndex.defect_quantity"] = "第 {$rowNo} 個機台頁籤的不良數量必須為 0 或正整數。";
                    continue;
                }

                $defects[] = [
                    'screening_service_id' => (int)$serviceId,
                    'defect_quantity' => (int)$quantityInt,
                ];
            }
        }

        $normalisedRuns[] = [
            'run_label' => trim((string)($run['run_label'] ?? ('機台 ' . $rowNo))),
            'machine_id' => $machineIdInt === false ? null : $machineIdInt,
            'machine_sequence' => $rowNo,
            'assigned_employee_id' => $assignedEmployeeIdInt === false ? null : $assignedEmployeeIdInt,
            'calibration_employee_id' => $calibrationEmployeeIdInt === false ? null : $calibrationEmployeeIdInt,
            'scheduled_start_date' => normalizeWorkOrderDateTimeValue($run['scheduled_start_date'] ?? null),
            'scheduled_end_date' => normalizeWorkOrderDateTimeValue($run['scheduled_end_date'] ?? null),
            'actual_start_date' => normalizeWorkOrderDateTimeValue($run['actual_start_date'] ?? null),
            'actual_end_date' => normalizeWorkOrderDateTimeValue($run['actual_end_date'] ?? null),
            'quantity_to_produce' => $quantityToProduceFloat === null ? null : round((float)$quantityToProduceFloat, 2),
            'screening_speed' => mb_substr(trim((string)($run['screening_speed'] ?? '')), 0, 50),
            'planned_net_weight_kg' => round($plannedNetWeight, 2),
            'completed_net_weight_kg' => round($completedNetWeight, 2),
            'weight_per_unit_g' => round($unitWeight, 3),
            'planned_units' => $plannedUnits,
            'completed_units' => $completedUnits,
            'status' => $status,
            'notes' => trim((string)($run['notes'] ?? '')),
            'production_records' => filterMeaningfulMachineRunProductionRecords(is_array($run['production_records'] ?? null) ? $run['production_records'] : []),
            'defects' => $defects,
        ];
    }

    if ($totalCompletedNetWeight - $expectedNetWeightKg > 0.0001) {
        $excess = round($totalCompletedNetWeight - $expectedNetWeightKg, 2);
        $errors['machine_runs.completed_net_weight_kg'] = "拆分機台完成淨重合計 {$totalCompletedNetWeight} kg 已超過主工單預期淨重 {$expectedNetWeightKg} kg，超出 {$excess} kg。";
    }

    return ['runs' => $normalisedRuns, 'errors' => $errors];
}

/**
 * Check whether split machine runs can be replaced safely.
 *
 * Replacing currently deletes and recreates machine runs. Once partial receipts
 * exist, the machine run rows are part of traceability and must be preserved.
 *
 * @return array{allowed: bool, message: string, details: array<string,mixed>}
 */
function canReplaceWorkOrderMachineRuns(PDO $pdo, int $workOrderId): array
{
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) AS receipt_count,
            COALESCE(SUM(wopr.net_weight_kg), 0) AS receipt_net_weight_kg,
            COALESCE(SUM(wopr.calculated_units), 0) AS receipt_units,
            COUNT(DISTINCT wopr.machine_run_id) AS machine_run_count,
            COUNT(DISTINCT wopr.inventory_item_id) AS inventory_item_count,
            COALESCE(SUM(ii.quantity_allocated), 0) AS allocated_units,
            COALESCE(SUM(ii.quantity_shipped), 0) AS shipped_units,
            COALESCE(SUM(shipping_refs.shipping_item_count), 0) AS shipping_item_count
        FROM work_order_partial_receipts wopr
        LEFT JOIN inventory_items ii ON ii.id = wopr.inventory_item_id AND ii.deleted_at IS NULL
        LEFT JOIN (
            SELECT inventory_item_id, COUNT(*) AS shipping_item_count
            FROM shipping_order_items
            GROUP BY inventory_item_id
        ) shipping_refs ON shipping_refs.inventory_item_id = ii.id
        WHERE wopr.work_order_id = :work_order_id
    ");
    $stmt->execute(['work_order_id' => $workOrderId]);
    $summary = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $receiptCount = (int)($summary['receipt_count'] ?? 0);
    if ($receiptCount === 0) {
        return [
            'allowed' => true,
            'message' => '',
            'details' => [],
        ];
    }

    $netWeightKg = round((float)($summary['receipt_net_weight_kg'] ?? 0), 2);
    $units = round((float)($summary['receipt_units'] ?? 0), 2);

    $allocatedUnits = round((float)($summary['allocated_units'] ?? 0), 2);
    $shippedUnits = round((float)($summary['shipped_units'] ?? 0), 2);
    $shippingItemCount = (int)($summary['shipping_item_count'] ?? 0);
    $shippingImpact = $shippingItemCount > 0
        ? "，其中已有 {$shippingItemCount} 筆出貨關聯 / 已配貨 {$allocatedUnits} 支 / 已出貨 {$shippedUnits} 支"
        : '';

    return [
        'allowed' => false,
        'message' => "此工單已有 {$receiptCount} 筆部分完工入庫紀錄，合計 {$netWeightKg} kg / {$units} 支{$shippingImpact}，不能重建或清除拆分機台明細。請先走部分入庫沖銷/結清流程。",
        'details' => [
            'receipt_count' => $receiptCount,
            'receipt_net_weight_kg' => $netWeightKg,
            'receipt_units' => $units,
            'machine_run_count' => (int)($summary['machine_run_count'] ?? 0),
            'inventory_item_count' => (int)($summary['inventory_item_count'] ?? 0),
            'shipping_item_count' => $shippingItemCount,
            'allocated_units' => $allocatedUnits,
            'shipped_units' => $shippedUnits,
        ],
    ];
}

/**
 * Insert production records for normal work orders or split machine runs.
 *
 * @param array<int,array<string,mixed>> $productionRecords
 */
function insertWorkOrderProductionRecords(PDO $pdo, int $workOrderId, array $productionRecords, ?int $machineRunId = null, ?int $forcedMachineId = null): int
{
    $productionRecords = filterMeaningfulProductionRecords($productionRecords);
    if ($productionRecords === []) {
        return 0;
    }

    $currentEmployee = $_SESSION['employee'] ?? null;
    $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;

    $hasMachineRunIdColumn = workOrderTableHasColumn($pdo, 'production_records', 'machine_run_id');
    $hasSourceModeColumn = workOrderTableHasColumn($pdo, 'production_records', 'production_source_mode');
    $hasToolNameColumn = workOrderTableHasColumn($pdo, 'production_records', 'tool_name');
    $hasToolWeightColumn = workOrderTableHasColumn($pdo, 'production_records', 'tool_weight_kg');
    $columns = ['work_order_id'];
    $params = [':work_order_id'];
    if ($hasMachineRunIdColumn) {
        $columns[] = 'machine_run_id';
        $params[] = ':machine_run_id';
    }
    if ($hasSourceModeColumn) {
        $columns[] = 'production_source_mode';
        $params[] = ':production_source_mode';
    }
    if ($hasToolNameColumn) {
        $columns[] = 'tool_name';
        $params[] = ':tool_name';
    }
    if ($hasToolWeightColumn) {
        $columns[] = 'tool_weight_kg';
        $params[] = ':tool_weight_kg';
    }
    $columns = array_merge($columns, [
        'card_number',
        'weight_kg',
        'production_date',
        'production_time',
        'machine_id',
        'machine_type',
        'employee_id',
        'notes',
    ]);
    $params = array_merge($params, [
        ':card_number',
        ':weight_kg',
        ':production_date',
        ':production_time',
        ':machine_id',
        ':machine_type',
        ':employee_id',
        ':notes',
    ]);

    $prodRecordSql = sprintf(
        "INSERT INTO production_records (%s) VALUES (%s)",
        implode(', ', $columns),
        implode(', ', $params)
    );
    $prodRecordStmt = $pdo->prepare($prodRecordSql);
    $machineStmt = $pdo->prepare("SELECT name FROM machines WHERE id = :id");
    $inserted = 0;

    foreach ($productionRecords as $record) {
        if (empty($record['card_number'])) {
            continue;
        }

        $machineId = $forcedMachineId ?: (!empty($record['machine_id']) ? (int)$record['machine_id'] : null);
        $machineType = '';
        if ($machineId) {
            $machineStmt->execute(['id' => $machineId]);
            $machineType = $machineStmt->fetchColumn() ?: '';
        }

        $insertParams = [
            'work_order_id' => $workOrderId,
            'production_source_mode' => !empty($record['production_source_mode']) ? mb_substr((string)$record['production_source_mode'], 0, 20) : 'preset',
            'tool_name' => !empty($record['tool_name']) ? mb_substr(trim((string)$record['tool_name']), 0, 100) : null,
            'tool_weight_kg' => hasFilledWorkOrderValue($record['tool_weight_kg'] ?? null) ? (float)$record['tool_weight_kg'] : null,
            'card_number' => $record['card_number'],
            'weight_kg' => !empty($record['weight_kg']) ? (float)$record['weight_kg'] : null,
            'production_date' => !empty($record['production_date']) ? $record['production_date'] : null,
            'production_time' => !empty($record['production_time']) ? $record['production_time'] : null,
            'machine_id' => $machineId,
            'machine_type' => $machineType,
            'employee_id' => $currentUserId,
            'notes' => $record['notes'] ?? null,
        ];
        if ($hasMachineRunIdColumn) {
            $insertParams['machine_run_id'] = $machineRunId;
        }
        if (!$hasSourceModeColumn) {
            unset($insertParams['production_source_mode']);
        }
        if (!$hasToolNameColumn) {
            unset($insertParams['tool_name']);
        }
        if (!$hasToolWeightColumn) {
            unset($insertParams['tool_weight_kg']);
        }
        $prodRecordStmt->execute($insertParams);
        $inserted++;
    }

    return $inserted;
}

/**
 * @param array<int,array<string,mixed>> $machineRuns
 */
function replaceWorkOrderMachineRuns(PDO $pdo, int $workOrderId, array $machineRuns): void
{
    $pdo->prepare('DELETE FROM work_order_machine_defects WHERE work_order_id = :work_order_id')
        ->execute(['work_order_id' => $workOrderId]);
    $pdo->prepare('DELETE FROM work_order_machine_runs WHERE work_order_id = :work_order_id')
        ->execute(['work_order_id' => $workOrderId]);

    if ($machineRuns === []) {
        return;
    }

    $currentEmployee = $_SESSION['employee'] ?? null;
    $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;
    $now = date('Y-m-d H:i:s');

    $runColumns = [
        'work_order_id',
        'run_label',
        'machine_id',
        'machine_sequence',
        'assigned_employee_id',
    ];
    $runParams = [
        ':work_order_id',
        ':run_label',
        ':machine_id',
        ':machine_sequence',
        ':assigned_employee_id',
    ];

    if (workOrderTableHasColumn($pdo, 'work_order_machine_runs', 'calibration_employee_id')) {
        $runColumns[] = 'calibration_employee_id';
        $runParams[] = ':calibration_employee_id';
    }

    $runColumns = array_merge($runColumns, [
        'scheduled_start_date',
        'scheduled_end_date',
        'actual_start_date',
        'actual_end_date',
    ]);
    $runParams = array_merge($runParams, [
        ':scheduled_start_date',
        ':scheduled_end_date',
        ':actual_start_date',
        ':actual_end_date',
    ]);

    if (workOrderTableHasColumn($pdo, 'work_order_machine_runs', 'quantity_to_produce')) {
        $runColumns[] = 'quantity_to_produce';
        $runParams[] = ':quantity_to_produce';
    }
    if (workOrderTableHasColumn($pdo, 'work_order_machine_runs', 'screening_speed')) {
        $runColumns[] = 'screening_speed';
        $runParams[] = ':screening_speed';
    }

    $runColumns = array_merge($runColumns, [
        'planned_net_weight_kg',
        'completed_net_weight_kg',
        'weight_per_unit_g',
        'planned_units',
        'completed_units',
        'status',
        'notes',
        'created_by_employee_id',
    ]);
    $runParams = array_merge($runParams, [
        ':planned_net_weight_kg',
        ':completed_net_weight_kg',
        ':weight_per_unit_g',
        ':planned_units',
        ':completed_units',
        ':status',
        ':notes',
        ':created_by_employee_id',
    ]);

    $runStmt = $pdo->prepare(sprintf(
        "INSERT INTO work_order_machine_runs (%s) VALUES (%s)",
        implode(', ', $runColumns),
        implode(', ', $runParams)
    ));

    $defectStmt = $pdo->prepare("
        INSERT INTO work_order_machine_defects
            (machine_run_id, work_order_id, screening_service_id, service_name, defect_quantity, recorded_at, recorded_by_employee_id)
        VALUES
            (:machine_run_id, :work_order_id, :screening_service_id, :service_name, :defect_quantity, :recorded_at, :recorded_by_employee_id)
    ");

    $serviceStmt = $pdo->prepare('SELECT name FROM screening_services WHERE id = :id LIMIT 1');

    foreach ($machineRuns as $run) {
        $runParams = [
            'work_order_id' => $workOrderId,
            'run_label' => $run['run_label'],
            'machine_id' => $run['machine_id'],
            'machine_sequence' => $run['machine_sequence'],
            'assigned_employee_id' => $run['assigned_employee_id'],
            'scheduled_start_date' => $run['scheduled_start_date'],
            'scheduled_end_date' => $run['scheduled_end_date'],
            'actual_start_date' => $run['actual_start_date'],
            'actual_end_date' => $run['actual_end_date'],
            'planned_net_weight_kg' => $run['planned_net_weight_kg'],
            'completed_net_weight_kg' => $run['completed_net_weight_kg'],
            'weight_per_unit_g' => $run['weight_per_unit_g'],
            'planned_units' => $run['planned_units'],
            'completed_units' => $run['completed_units'],
            'status' => $run['status'],
            'notes' => $run['notes'] === '' ? null : $run['notes'],
            'created_by_employee_id' => $currentUserId,
        ];
        if (in_array('calibration_employee_id', $runColumns, true)) {
            $runParams['calibration_employee_id'] = $run['calibration_employee_id'];
        }
        if (in_array('quantity_to_produce', $runColumns, true)) {
            $runParams['quantity_to_produce'] = $run['quantity_to_produce'];
        }
        if (in_array('screening_speed', $runColumns, true)) {
            $runParams['screening_speed'] = $run['screening_speed'] === '' ? null : $run['screening_speed'];
        }
        $runStmt->execute($runParams);

        $machineRunId = (int)$pdo->lastInsertId();
        insertWorkOrderProductionRecords($pdo, $workOrderId, $run['production_records'] ?? [], $machineRunId, $run['machine_id']);

        foreach ($run['defects'] as $defect) {
            $serviceStmt->execute(['id' => $defect['screening_service_id']]);
            $serviceName = $serviceStmt->fetchColumn() ?: '';
            $defectStmt->execute([
                'machine_run_id' => $machineRunId,
                'work_order_id' => $workOrderId,
                'screening_service_id' => $defect['screening_service_id'],
                'service_name' => $serviceName,
                'defect_quantity' => $defect['defect_quantity'],
                'recorded_at' => $now,
                'recorded_by_employee_id' => $currentUserId,
            ]);
        }
    }
}

/**
 * Empty first-piece shells should not be saved or treated as real inspection data.
 *
 * @param array<string,mixed> $data
 */
function isMeaningfulFirstPieceDimension(array $data): bool
{
    foreach ([
        'head_height',
        'head_width',
        'length',
        'thread_outer_diameter',
        'washer_diameter',
        'outer_diameter',
        'hole_diameter',
        'thickness',
        'measured_at',
        'measured_by_employee_id',
        'notes',
    ] as $field) {
        if (array_key_exists($field, $data) && hasFilledWorkOrderValue($data[$field])) {
            return true;
        }
    }

    return false;
}

/**
 * Resolve a work order status lookup ID to its stable value key.
 */
function getWorkOrderStatusKey(PDO $pdo, ?int $statusLookupId): string
{
    if ($statusLookupId === null || $statusLookupId <= 0) {
        return '';
    }

    $stmt = $pdo->prepare('SELECT value_key FROM lookup_values WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $statusLookupId]);
    $valueKey = $stmt->fetchColumn();

    return strtolower(trim((string)($valueKey ?: '')));
}

/**
 * Check if a work order status represents the completed lifecycle state.
 */
function isCompletedWorkOrderStatus(PDO $pdo, ?int $statusLookupId, ?string $legacyStatus = null, ?string $statusLabel = null): bool
{
    return getWorkOrderStatusKey($pdo, $statusLookupId) === 'completed'
        || strtolower(trim((string)$legacyStatus)) === 'completed'
        || trim((string)$statusLabel) === '已完成';
}

/**
 * Validate and normalise work order input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateWorkOrderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // Accept the nested payload used by the work-order form while preserving
    // compatibility with legacy flat fp_* fields.
    if (isset($payload['first_piece_dimensions']) && is_array($payload['first_piece_dimensions'])) {
        $nestedFirstPieceFields = [
            'head_height' => 'fp_head_height',
            'head_width' => 'fp_head_width',
            'length' => 'fp_length',
            'thread_outer_diameter' => 'fp_thread_outer_diameter',
            'washer_diameter' => 'fp_washer_diameter',
            'outer_diameter' => 'fp_outer_diameter',
            'hole_diameter' => 'fp_hole_diameter',
            'thickness' => 'fp_thickness',
            'measured_at' => 'fp_measured_at',
            'measured_by_employee_id' => 'fp_measured_by_employee_id',
            'notes' => 'fp_notes',
        ];

        foreach ($nestedFirstPieceFields as $nestedKey => $flatKey) {
            if (array_key_exists($nestedKey, $payload['first_piece_dimensions'])
                && !array_key_exists($flatKey, $payload)) {
                $payload[$flatKey] = $payload['first_piece_dimensions'][$nestedKey];
            }
        }
    }
    unset($payload['first_piece_dimensions']);

    // 工單號碼 - 由系統自動生成
    if (array_key_exists('work_order_number', $payload)) {
        unset($payload['work_order_number']);
    }

    // 客戶批號ID - 新增時必填
    if (!$isUpdate || array_key_exists('order_item_id', $payload)) {
        $orderItemId = $payload['order_item_id'] ?? null;
        if (!$isUpdate && ($orderItemId === null || $orderItemId === '')) {
            $errors['order_item_id'] = '客戶批號為必填。';
        } elseif ($orderItemId !== null && $orderItemId !== '') {
            $orderItemIdInt = filter_var($orderItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderItemIdInt === false) {
                $errors['order_item_id'] = '客戶批號ID必須為正整數。';
            } else {
                $data['order_item_id'] = $orderItemIdInt;
            }
        }
    }

    // 機台ID - 可選
    if (array_key_exists('machine_id', $payload)) {
        $machineId = $payload['machine_id'] ?? null;
        if ($machineId === null || $machineId === '') {
            $data['machine_id'] = null;
        } else {
            $machineIdInt = filter_var($machineId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($machineIdInt === false) {
                $errors['machine_id'] = '機台ID必須為正整數。';
            } else {
                $data['machine_id'] = $machineIdInt;
            }
        }
    }

    // 機台排序序號 - 可選
    if (array_key_exists('machine_sequence', $payload)) {
        $machineSequence = $payload['machine_sequence'] ?? null;
        if ($machineSequence === null || $machineSequence === '') {
            $data['machine_sequence'] = null;
        } else {
            $machineSequenceInt = filter_var($machineSequence, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($machineSequenceInt === false) {
                $errors['machine_sequence'] = '機台排序序號必須為正整數。';
            } else {
                $data['machine_sequence'] = $machineSequenceInt;
            }
        }
    }

    // 指定員工ID - 可選
    if (array_key_exists('assigned_employee_id', $payload)) {
        $assignedEmployeeId = $payload['assigned_employee_id'] ?? null;
        if ($assignedEmployeeId === null || $assignedEmployeeId === '') {
            $data['assigned_employee_id'] = null;
        } else {
            $assignedEmployeeIdInt = filter_var($assignedEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($assignedEmployeeIdInt === false) {
                $errors['assigned_employee_id'] = '指定員工ID必須為正整數。';
            } else {
                $data['assigned_employee_id'] = $assignedEmployeeIdInt;
            }
        }
    }

    // 校機人員ID - 可選
    if (array_key_exists('calibration_employee_id', $payload)) {
        $calibrationEmployeeId = $payload['calibration_employee_id'] ?? null;
        if ($calibrationEmployeeId === null || $calibrationEmployeeId === '') {
            $data['calibration_employee_id'] = null;
        } else {
            $calibrationEmployeeIdInt = filter_var($calibrationEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($calibrationEmployeeIdInt === false) {
                $errors['calibration_employee_id'] = '校機人員ID必須為正整數。';
            } else {
                $data['calibration_employee_id'] = $calibrationEmployeeIdInt;
            }
        }
    }

    // 日期時間欄位處理
    $dateTimeFields = [
        'scheduled_start_date' => '預定開始日期',
        'scheduled_end_date' => '預定結束日期',
        'actual_start_date' => '實際開始日期',
        'actual_end_date' => '實際結束日期'
    ];

    foreach ($dateTimeFields as $field => $label) {
        if (array_key_exists($field, $payload)) {
            $value = trim((string)($payload[$field] ?? ''));
            if ($value === '') {
                $data[$field] = null;
            } else {
                $date = DateTime::createFromFormat('Y-m-d\TH:i', $value);
                if (!$date) {
                    $errors[$field] = "{$label}格式不正確。";
                } else {
                    $data[$field] = $date->format('Y-m-d H:i:s');
                }
            }
        }
    }

    // 生產數量 - 可選
    if (array_key_exists('quantity_to_produce', $payload)) {
        $quantity = $payload['quantity_to_produce'];
        if ($quantity === null || $quantity === '') {
            $data['quantity_to_produce'] = null;
        } else {
            $quantityFloat = filter_var($quantity, FILTER_VALIDATE_FLOAT);
            if ($quantityFloat === false || $quantityFloat < 0) {
                $errors['quantity_to_produce'] = '生產數量必須為非負數。';
            } else {
                $data['quantity_to_produce'] = $quantityFloat;
            }
        }
    }

    // 工單類型 - 預設一般工單
    if (array_key_exists('work_order_type', $payload)) {
        $workOrderType = strtolower(trim((string)($payload['work_order_type'] ?? 'normal')));
        if ($workOrderType === '') {
            $workOrderType = 'normal';
        }

        if (!in_array($workOrderType, ['normal', 'split'], true)) {
            $errors['work_order_type'] = '工單類型必須為 normal 或 split。';
        } else {
            $data['work_order_type'] = $workOrderType;
        }
    }

    $productionMetricFields = [
        'total_weight_kg' => '總重量',
        'weight_per_unit_g' => '產品單支重',
        'total_units' => '總支數',
    ];

    foreach ($productionMetricFields as $field => $label) {
        if (!array_key_exists($field, $payload)) {
            continue;
        }

        $value = $payload[$field];
        if ($value === null || $value === '') {
            $data[$field] = null;
            continue;
        }

        $numericValue = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($numericValue === false || $numericValue < 0) {
            $errors[$field] = "{$label}必須為非負數。";
            continue;
        }

        $data[$field] = $numericValue;
    }

    if (array_key_exists('tool_statistics', $payload)) {
        $toolStatistics = trim((string)($payload['tool_statistics'] ?? ''));
        $data['tool_statistics'] = $toolStatistics === '' ? null : $toolStatistics;
    }

    // 篩選速度 - 可選
    if (array_key_exists('screening_speed', $payload)) {
        $screeningSpeed = trim((string)($payload['screening_speed'] ?? ''));
        $data['screening_speed'] = $screeningSpeed === '' ? null : mb_substr($screeningSpeed, 0, 50);
    }

    // 客戶交辦事項 - 可選
    if (array_key_exists('customer_instructions', $payload)) {
        $customerInstructions = trim((string)($payload['customer_instructions'] ?? ''));
        $data['customer_instructions'] = $customerInstructions === '' ? null : $customerInstructions;
    }

    // 其他說明備註 - 可選
    if (array_key_exists('other_notes', $payload)) {
        $otherNotes = trim((string)($payload['other_notes'] ?? ''));
        $data['other_notes'] = $otherNotes === '' ? null : $otherNotes;
    }

    // 狀態 - 可選
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? ''));
        $data['status'] = $status === '' ? null : mb_substr($status, 0, 50);
    }

    // 狀態 Lookup ID - 可選
    if (array_key_exists('status_lookup_id', $payload)) {
        $statusLookupId = $payload['status_lookup_id'] ?? null;
        if ($statusLookupId === null || $statusLookupId === '') {
            $data['status_lookup_id'] = null;
        } else {
            $statusLookupIdInt = filter_var($statusLookupId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($statusLookupIdInt === false) {
                $errors['status_lookup_id'] = '狀態ID必須為正整數。';
            } else {
                $data['status_lookup_id'] = $statusLookupIdInt;
            }
        }
    }

    // 首件尺寸檢驗資料處理
    $fpFields = [
        'fp_head_height' => 'head_height',
        'fp_head_width' => 'head_width',
        'fp_length' => 'length',
        'fp_thread_outer_diameter' => 'thread_outer_diameter',
        'fp_washer_diameter' => 'washer_diameter',
        'fp_outer_diameter' => 'outer_diameter',
        'fp_hole_diameter' => 'hole_diameter',
        'fp_thickness' => 'thickness'
    ];

    $firstPieceData = [];
    $hasFpData = false;

    foreach ($fpFields as $key => $dbColumn) {
        if (array_key_exists($key, $payload)) {
            $hasFpData = true;
            $val = $payload[$key];
            if ($val === null || $val === '') {
                $firstPieceData[$dbColumn] = null;
            } else {
                $floatVal = filter_var($val, FILTER_VALIDATE_FLOAT);
                if ($floatVal === false) {
                    $errors[$key] = "數值格式不正確。";
                } else {
                    $firstPieceData[$dbColumn] = $floatVal;
                }
            }
        }
    }

    if (array_key_exists('fp_measured_at', $payload)) {
        $hasFpData = true;
        $val = $payload['fp_measured_at'];
        if ($val === null || $val === '') {
            $firstPieceData['measured_at'] = null;
        } else {
            $date = DateTime::createFromFormat('Y-m-d\TH:i', $val);
            if (!$date) {
                $date = DateTime::createFromFormat('Y-m-d H:i:s', $val);
            }

            if ($date) {
                $firstPieceData['measured_at'] = $date->format('Y-m-d H:i:s');
            } else {
                // 如果格式不正確但有值，視為無效或忽略
                $firstPieceData['measured_at'] = null;
            }
        }
    }

    if (array_key_exists('fp_measured_by_employee_id', $payload)) {
        $hasFpData = true;
        $val = $payload['fp_measured_by_employee_id'];
        if ($val === null || $val === '') {
            $firstPieceData['measured_by_employee_id'] = null;
        } else {
            $intVal = filter_var($val, FILTER_VALIDATE_INT);
            if ($intVal === false) {
                $errors['fp_measured_by_employee_id'] = "測量人員ID必須為整數。";
            } else {
                $firstPieceData['measured_by_employee_id'] = $intVal;
            }
        }
    }

    if (array_key_exists('fp_notes', $payload)) {
        $hasFpData = true;
        $notes = trim((string)($payload['fp_notes'] ?? ''));
        $firstPieceData['notes'] = $notes === '' ? null : mb_substr($notes, 0, 255);
    }

    if ($hasFpData && isMeaningfulFirstPieceDimension($firstPieceData)) {
        $data['first_piece_dimensions'] = $firstPieceData;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Generate a unique work order number.
 *
 * @param PDO $pdo
 * @return string
 */
function generateWorkOrderNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'WO');
}

/**
 * Normalize machine sequence ordering for a specific machine group.
 *
 * @param PDO      $pdo
 * @param int|null $machineId Null represents queue (machine_id IS NULL).
 * @param int|null $pinnedWorkOrderId Optional work order ID to insert into sequence.
 * @param int|null $preferredSequence Optional preferred position (1-based).
 */
function normalizeWorkOrderMachineSequence(PDO $pdo, ?int $machineId, ?int $pinnedWorkOrderId = null, ?int $preferredSequence = null): void
{
    $baseSql = "
        SELECT id
        FROM work_orders
        WHERE deleted_at IS NULL
    ";

    $params = [];
    if ($machineId === null) {
        $baseSql .= ' AND machine_id IS NULL';
    } else {
        $baseSql .= ' AND machine_id = :machine_id';
        $params['machine_id'] = $machineId;
    }

    if ($pinnedWorkOrderId !== null) {
        $baseSql .= ' AND id != :pinned_id';
        $params['pinned_id'] = $pinnedWorkOrderId;
    }

    $baseSql .= ' ORDER BY COALESCE(machine_sequence, 2147483647), scheduled_start_date IS NULL, scheduled_start_date, id';

    $stmt = $pdo->prepare($baseSql);
    $stmt->execute($params);
    $orderedIds = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

    if ($pinnedWorkOrderId !== null) {
        $targetPosition = $preferredSequence ?? (count($orderedIds) + 1);
        $targetPosition = max(1, min($targetPosition, count($orderedIds) + 1));
        array_splice($orderedIds, $targetPosition - 1, 0, [$pinnedWorkOrderId]);
    }

    if (empty($orderedIds)) {
        return;
    }

    $updateStmt = $pdo->prepare('UPDATE work_orders SET machine_sequence = :machine_sequence WHERE id = :id');
    foreach ($orderedIds as $index => $id) {
        $updateStmt->execute([
            'machine_sequence' => $index + 1,
            'id' => $id,
        ]);
    }
}

/**
 * Fetch current machine sequence value for one work order.
 *
 * @param PDO $pdo
 * @param int $workOrderId
 * @return int|null
 */
function getWorkOrderMachineSequence(PDO $pdo, int $workOrderId): ?int
{
    $stmt = $pdo->prepare('SELECT machine_sequence FROM work_orders WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $workOrderId]);
    $value = $stmt->fetchColumn();

    if ($value === false || $value === null || $value === '') {
        return null;
    }

    return (int)$value;
}

/**
 * Place a newly created work order into machine sequence.
 *
 * @param PDO      $pdo
 * @param int      $workOrderId
 * @param int|null $machineId
 * @param int|null $requestedSequence
 * @return int|null
 */
function placeWorkOrderInMachineSequence(PDO $pdo, int $workOrderId, ?int $machineId, ?int $requestedSequence): ?int
{
    normalizeWorkOrderMachineSequence($pdo, $machineId, $workOrderId, $requestedSequence);
    return getWorkOrderMachineSequence($pdo, $workOrderId);
}

/**
 * Apply machine sequence sync rules for work order updates.
 *
 * Rules:
 * 1) If machine changed, re-index old machine and insert into new machine sequence.
 * 2) If sequence specified on same machine, reposition then re-index.
 * 3) If machine changed but sequence omitted, append to tail of new machine sequence.
 *
 * @param PDO      $pdo
 * @param int      $workOrderId
 * @param int|null $oldMachineId
 * @param int|null $newMachineId
 * @param int|null $requestedSequence
 * @param bool     $machineIdWasUpdated
 * @param bool     $sequenceWasUpdated
 * @return int|null
 */
function syncWorkOrderMachineSequence(
    PDO $pdo,
    int $workOrderId,
    ?int $oldMachineId,
    ?int $newMachineId,
    ?int $requestedSequence,
    bool $machineIdWasUpdated,
    bool $sequenceWasUpdated
): ?int {
    if (!$machineIdWasUpdated && !$sequenceWasUpdated) {
        return getWorkOrderMachineSequence($pdo, $workOrderId);
    }

    $machineChanged = $oldMachineId !== $newMachineId;

    if ($machineChanged) {
        normalizeWorkOrderMachineSequence($pdo, $oldMachineId);
        normalizeWorkOrderMachineSequence($pdo, $newMachineId, $workOrderId, $requestedSequence);
        return getWorkOrderMachineSequence($pdo, $workOrderId);
    }

    if ($sequenceWasUpdated) {
        normalizeWorkOrderMachineSequence($pdo, $newMachineId, $workOrderId, $requestedSequence);
        return getWorkOrderMachineSequence($pdo, $workOrderId);
    }

    return getWorkOrderMachineSequence($pdo, $workOrderId);
}

/**
 * Fetch order item details for work order creation.
 *
 * @param PDO $pdo
 * @param int $orderItemId
 * @return array<string,mixed>|null
 */
function fetchOrderItemDetailsForWorkOrder(PDO $pdo, int $orderItemId): ?array
{
    $sql = "
        SELECT
            oi.id,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            oi.sub_item_number,
            oi.part_number,
            oi.drawing_number,
            oi.total_weight_kg,
            oi.total_units,
            oi.unit_price_per_thousand,
            oi.status AS order_item_status,
            oi.customer_sample_status,
            oi.delivery_location,
            oi.notes AS order_item_notes,
            lv_status.value_label AS order_item_status_label,
            lv.value_label AS customer_sample_status_label,
            o.order_number,
            o.customer_id,
            o.customer_po_number,
            o.expected_delivery_date,
            c.name AS customer_name,
            si.name AS screening_item_name,
            si.weight_per_unit_g
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN customers c ON o.customer_id = c.id
        JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN lookup_values lv ON oi.customer_sample_status = lv.value_key AND lv.domain_id = 19
        LEFT JOIN lookup_values lv_status ON oi.status = lv_status.value_key
            AND lv_status.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'status_work_order')
        WHERE oi.id = :order_item_id AND o.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['order_item_id' => $orderItemId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        return null;
    }

    // Fetch tools statistics (載具類型統計 + 總重量)
    try {
        $toolsStmt = $pdo->prepare("
            SELECT
                t.name AS tool_name,
                t.type AS tool_type,
                oit.quantity,
                oit.total_weight
            FROM order_item_tools oit
            JOIN tools t ON oit.tool_id = t.id
            WHERE oit.order_item_id = :order_item_id
            ORDER BY t.name
        ");
        $toolsStmt->execute(['order_item_id' => $orderItemId]);
        $tools = $toolsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 格式化成 "船 1個、桶 2個" 的形式,使用頓號分隔更清晰
        $toolStatistics = [];
        $totalContainerQuantity = 0;
        $totalToolWeight = 0.0;
        foreach ($tools as $tool) {
            $quantity = (int)$tool['quantity'];
            $toolStatistics[] = $tool['tool_name'] . ' ' . $quantity . '個';
            $totalContainerQuantity += $quantity;
            $totalToolWeight += (float)$tool['total_weight'];
        }
        $result['tool_statistics'] = implode('、', $toolStatistics);
        $result['tool_quantity'] = $totalContainerQuantity; // 總載具數量(桶數/船數總和)
        $result['total_tool_weight'] = round($totalToolWeight, 2); // 載具總重量 (kg)
        $result['tool_details'] = fetchWorkOrderToolDetails($pdo, $orderItemId);
    } catch (Exception $e) {
        error_log('Fetch tools statistics error: ' . $e->getMessage());
        $result['tool_statistics'] = '';
        $result['tool_quantity'] = 0;
        $result['total_tool_weight'] = 0.0;
        $result['tool_details'] = [];
        $totalToolWeight = 0.0;
    }

    // 即時計算 total_units，確保使用最新的 weight_per_unit_g 和 tool_weight
    $totalWeight = isset($result['total_weight_kg']) ? (float)$result['total_weight_kg'] : 0.0;
    $weightPerUnitG = isset($result['weight_per_unit_g']) ? (float)$result['weight_per_unit_g'] : 0.0;
    $netWeight = $totalWeight - $totalToolWeight;
    if ($netWeight < 0) {
        $netWeight = 0.0;
    }

    // 計算總支數：淨重(kg) * 1000 / 單支重(g)
    $calculatedTotalUnits = 0.0;
    if ($weightPerUnitG > 0 && $netWeight > 0) {
        $calculatedTotalUnits = ($netWeight * 1000) / $weightPerUnitG;
    }
    $result['total_units'] = round($calculatedTotalUnits, 2);
    $result['net_weight'] = round($netWeight, 4); // 也提供淨重供前端使用

    // Fetch screening services details (篩分服務明細)
    try {
        $servicesStmt = $pdo->prepare("
            SELECT
                ss.name AS screening_service_name,
                oisd.service_name AS custom_service_name,
                oisd.actual_price_per_unit,
                oisd.tolerance_plus_value,
                oisd.tolerance_plus_over,
                oisd.tolerance_minus_value,
                oisd.tolerance_minus_over,
                oisd.ppm_standard,
                oisd.notes
            FROM order_item_screening_details oisd
            JOIN screening_services ss ON oisd.screening_service_id = ss.id
            WHERE oisd.order_item_id = :order_item_id
            ORDER BY oisd.id
        ");
        $servicesStmt->execute(['order_item_id' => $orderItemId]);
        $result['screening_services_details'] = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log('Fetch screening services details error: ' . $e->getMessage());
        $result['screening_services_details'] = [];
    }

    // Fetch drawing number from order_item_drawings if OrderItems.drawing_number is empty
    // 如果 OrderItems.drawing_number 為空，則從 OrderItemDrawings 表中取得圖面編號
    if (empty($result['drawing_number'])) {
        try {
            $drawingStmt = $pdo->prepare("
                SELECT drawing_number
                FROM order_item_drawings
                WHERE order_item_id = :order_item_id
                ORDER BY id DESC
                LIMIT 1
            ");
            $drawingStmt->execute(['order_item_id' => $orderItemId]);
            $drawing = $drawingStmt->fetch(PDO::FETCH_ASSOC);

            if ($drawing && !empty($drawing['drawing_number'])) {
                $result['drawing_number'] = $drawing['drawing_number'];
            }
        } catch (Exception $e) {
            error_log('Fetch drawing number from order_item_drawings error: ' . $e->getMessage());
        }
    }

    try {
        $result['drawings'] = fetchWorkOrderDrawings($pdo, $orderItemId);
    } catch (Exception $e) {
        error_log('Fetch work order drawings error: ' . $e->getMessage());
        $result['drawings'] = [];
    }

    return $result;
}

// ===============================
// HTTP Request Handler
// ===============================

// 如果是直接呼叫此檔案 (GET 請求取得客戶批號詳細資料)
if (basename($_SERVER['PHP_SELF']) === 'helpers.php' && strcasecmp($_SERVER['REQUEST_METHOD'] ?? '', 'GET') === 0) {
    require_once __DIR__ . '/../bootstrap.php';
    requireAuth();

    $action = $_GET['action'] ?? '';

    if ($action === 'get_order_item_details') {
        $orderItemId = $_GET['order_item_id'] ?? null;

        if (!$orderItemId) {
            jsonResponse([
                'success' => false,
                'message' => '缺少客戶批號ID參數。'
            ], 400);
        }

        $orderItemIdInt = filter_var($orderItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($orderItemIdInt === false) {
            jsonResponse([
                'success' => false,
                'message' => '客戶批號ID格式錯誤。'
            ], 400);
        }

        try {
            $pdo = db();
            $details = fetchOrderItemDetailsForWorkOrder($pdo, $orderItemIdInt);

            if ($details === null) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的客戶批號。'
                ], 404);
            }

            jsonResponse([
                'success' => true,
                'data' => $details
            ]);

        } catch (Exception $e) {
            error_log('Fetch order item details error: ' . $e->getMessage());
            jsonResponse([
                'success' => false,
                'message' => '載入客戶批號詳細資料失敗：' . $e->getMessage()
            ], 500);
        }
    } else {
        jsonResponse([
            'success' => false,
            'message' => '不支援的操作。'
        ], 400);
    }
}

