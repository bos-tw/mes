<?php
/**
 * 工單管理 API - 單筆查詢
 *
 * 取得指定工單的完整資料，包含關聯的訂單、客戶、機台、員工等資訊。
 *
 * @endpoint GET /api/work_orders/show.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 工單 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "work_order_number": "WO-20250115-0001",
 *     "order_number": "ORDER-20250115-0001",
 *     "customer_name": "測試客戶",
 *     "screening_item_name": "M3x10",
 *     "machine_name": "機台A",
 *     "assigned_employee_name": "張三",
 *     "status_label": "生產中",
 *     "tool_statistics": "...",
 *     "screening_details": [...],
 *     "first_piece_dimensions": [...],
 *     "work_order_images": [...]
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 工單不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../rescreen_batches/helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';
require_once __DIR__ . '/../shipping_orders/helpers.php';

/**
 * Work Order Details API Endpoint
 *
 * GET - Retrieve single work order with full details
 */

requireAuth();

requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
}

$pdo = db();

try {
    // Get work order details
    $sql = "
        SELECT
            wo.*,
            o.order_number,
            o.customer_id AS customer_id,
            o.customer_po_number,
            o.expected_delivery_date,
            c.name AS customer_name,
            si.name AS screening_item_name,
            si.weight_per_unit_g,
            oi.screening_item_id,
            oi.order_item_number,
            oi.customer_batch_number,
            oi.sub_item_number,
            oi.part_number,
            oi.drawing_number,
            oi.delivery_location,
            oi.total_weight_kg,
            oi.total_units,
            oi.customer_sample_status,
            lv_sample.value_label AS customer_sample_status_label,
            rb.rescreen_batch_number,
            m.machine_number,
            m.name AS machine_name,
            mc.capability_name AS machine_capability_name,
            e1.name AS assigned_employee_name,
            e2.name AS calibration_employee_name,
            lv.value_key AS status_key,
            lv.value_label AS status_label,
            ii_check.id AS inventory_item_id,
            CASE WHEN wo.completed_at IS NOT NULL THEN 1 ELSE 0 END AS lifecycle_locked,
            CASE WHEN ii_check.id IS NOT NULL THEN 1 ELSE 0 END AS has_inventory
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN rescreen_batches rb ON rb.id = NULLIF(wo.source_rescreen_batch_id, 0)
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN machine_capabilities mc ON m.machine_capability_id = mc.id
        LEFT JOIN employees e1 ON wo.assigned_employee_id = e1.id
        LEFT JOIN employees e2 ON wo.calibration_employee_id = e2.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        LEFT JOIN lookup_values lv_sample ON oi.customer_sample_status = lv_sample.value_key AND lv_sample.domain_id = 19
        LEFT JOIN inventory_items ii_check ON ii_check.work_order_id = wo.id AND ii_check.deleted_at IS NULL
        WHERE wo.id = :id AND wo.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $workOrder = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$workOrder) {
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }

    // 載具相關資訊一律以目前客戶批號設定即時計算，避免工單建立後調整載具造成欄位不一致
    $orderItemMetrics = fetchOrderItemDetailsForWorkOrder($pdo, (int)$workOrder['order_item_id']);
    if ($orderItemMetrics) {
        $workOrder['tool_statistics'] = $orderItemMetrics['tool_statistics'] ?? '';
        $workOrder['total_tool_weight'] = round((float)($orderItemMetrics['total_tool_weight'] ?? 0), 2);
        $workOrder['tool_quantity'] = (int)($orderItemMetrics['tool_quantity'] ?? 0);
        $workOrder['tool_details'] = $orderItemMetrics['tool_details'] ?? [];
        $workOrder['drawings'] = $orderItemMetrics['drawings'] ?? fetchWorkOrderDrawings($pdo, (int)$workOrder['order_item_id']);
        if (trim((string)($workOrder['drawing_number'] ?? '')) === '' && trim((string)($orderItemMetrics['drawing_number'] ?? '')) !== '') {
            $workOrder['drawing_number'] = $orderItemMetrics['drawing_number'];
        }
    } else {
        $workOrder['tool_statistics'] = '';
        $workOrder['total_tool_weight'] = 0.0;
        $workOrder['tool_quantity'] = 0;
        $workOrder['tool_details'] = [];
        $workOrder['drawings'] = fetchWorkOrderDrawings($pdo, (int)$workOrder['order_item_id']);
    }

    // 即時計算 total_units，確保使用最新的 weight_per_unit_g 和 tool_weight
    $totalWeight = isset($workOrder['total_weight_kg']) ? (float)$workOrder['total_weight_kg'] : 0.0;
    $weightPerUnitG = isset($workOrder['weight_per_unit_g']) ? (float)$workOrder['weight_per_unit_g'] : 0.0;
    $totalToolWeight = isset($workOrder['total_tool_weight']) ? (float)$workOrder['total_tool_weight'] : 0.0;
    $netWeight = $totalWeight - $totalToolWeight;
    if ($netWeight < 0) {
        $netWeight = 0.0;
    }

    // 計算總支數：淨重(kg) * 1000 / 單支重(g)
    $calculatedTotalUnits = 0.0;
    if ($weightPerUnitG > 0 && $netWeight > 0) {
        $calculatedTotalUnits = ($netWeight * 1000) / $weightPerUnitG;
    }
    $workOrder['total_units'] = round($calculatedTotalUnits, 2);
    $workOrder['net_weight'] = round($netWeight, 4); // 也提供淨重供前端使用

    // Get screening services
    $servicesStmt = $pdo->prepare("
        SELECT ss.name
        FROM order_item_screening_details oisd
        JOIN screening_services ss ON oisd.screening_service_id = ss.id
        WHERE oisd.order_item_id = :order_item_id
    ");
    $servicesStmt->execute(['order_item_id' => $workOrder['order_item_id']]);
    $services = $servicesStmt->fetchAll(PDO::FETCH_COLUMN);
    $workOrder['screening_services'] = implode(', ', $services);

    // Get screening services details (完整詳情用於表格顯示)
    $servicesDetailsStmt = $pdo->prepare("
        SELECT
            oisd.id,
            oisd.order_item_id,
            oisd.screening_service_id AS id,
            ss.name AS screening_service_name,
            oisd.service_name AS custom_service_name,
            oisd.tolerance_plus_value,
            oisd.tolerance_minus_value,
            oisd.ppm_standard,
            oisd.notes
        FROM order_item_screening_details oisd
        JOIN screening_services ss ON oisd.screening_service_id = ss.id
        WHERE oisd.order_item_id = :order_item_id
        ORDER BY oisd.id ASC
    ");
    $servicesDetailsStmt->execute(['order_item_id' => $workOrder['order_item_id']]);
    $servicesDetails = $servicesDetailsStmt->fetchAll(PDO::FETCH_ASSOC);
    $workOrder['screening_services_details'] = $servicesDetails;

    // Get first piece dimensions
    $fpStmt = $pdo->prepare("
        SELECT
            fpd.*,
            e.name AS measured_by_name
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN employees e ON fpd.measured_by_employee_id = e.id
        WHERE fpd.work_order_id = :work_order_id
        LIMIT 1
    ");
    $fpStmt->execute(['work_order_id' => $id]);
    $workOrder['first_piece_dimensions'] = $fpStmt->fetch(PDO::FETCH_ASSOC) ?: null;

    // Get images
    $imagesStmt = $pdo->prepare("
        SELECT
            woi.*,
            e.name AS uploaded_by_name
        FROM work_order_images woi
        LEFT JOIN employees e ON woi.uploaded_by_employee_id = e.id
        WHERE woi.work_order_id = :work_order_id
        ORDER BY woi.sort_order ASC, woi.id ASC
    ");
    $imagesStmt->execute(['work_order_id' => $id]);
    $workOrder['images'] = $imagesStmt->fetchAll(PDO::FETCH_ASSOC);
    $workOrder['completion_images'] = fetchWorkOrderExecutionImages($pdo, 'work_order_completion_images', $id);
    $workOrder['defect_images'] = fetchWorkOrderExecutionImages($pdo, 'work_order_defect_images', $id);
    $workOrder['tool_condition_images'] = fetchWorkOrderExecutionImages($pdo, 'work_order_tool_condition_images', $id);
    $workOrder['pre_production_images'] = fetchWorkOrderExecutionImages($pdo, 'work_order_pre_production_images', $id);
    $workOrder['operation_logs'] = fetchWorkOrderOperationLogs($pdo, $id, 50);
    $workOrder['customer_tool_analysis'] = fetchCustomerToolAnalysis($pdo, (int)($workOrder['customer_id'] ?? 0));

    // Get production records
    $productionSourceModeSelect = workOrderTableHasColumn($pdo, 'production_records', 'production_source_mode')
        ? 'pr.production_source_mode,'
        : "'preset' AS production_source_mode,";
    $toolNameSelect = workOrderTableHasColumn($pdo, 'production_records', 'tool_name')
        ? 'pr.tool_name,'
        : "NULL AS tool_name,";
    $toolWeightSelect = workOrderTableHasColumn($pdo, 'production_records', 'tool_weight_kg')
        ? 'pr.tool_weight_kg,'
        : "NULL AS tool_weight_kg,";

    $prStmt = $pdo->prepare("
        SELECT
            pr.*,
            {$productionSourceModeSelect}
            {$toolNameSelect}
            {$toolWeightSelect}
            m.name AS machine_name,
            e.name AS employee_name
        FROM production_records pr
        LEFT JOIN machines m ON pr.machine_id = m.id
        LEFT JOIN employees e ON pr.employee_id = e.id
        WHERE pr.work_order_id = :work_order_id
        ORDER BY pr.production_date DESC, pr.production_time DESC
    ");
    $prStmt->execute(['work_order_id' => $id]);
    $productionRecords = $prStmt->fetchAll(PDO::FETCH_ASSOC);
    $workOrder['production_records'] = $productionRecords;

    // Get screening service defects
    $defectsStmt = $pdo->prepare("
        SELECT
            wosd.screening_service_id,
            wosd.service_name,
            wosd.defect_quantity,
            wosd.notes,
            wosd.recorded_at,
            e.name AS recorded_by_name
        FROM work_order_screening_defects wosd
        LEFT JOIN employees e ON wosd.recorded_by_employee_id = e.id
        WHERE wosd.work_order_id = :work_order_id
        ORDER BY wosd.screening_service_id ASC
    ");
    $defectsStmt->execute(['work_order_id' => $id]);
    $screeningDefects = $defectsStmt->fetchAll(PDO::FETCH_ASSOC);
    $workOrder['screening_defects'] = $screeningDefects;

    // Get split machine runs with per-machine defect details.
    $hasRunCalibrationEmployee = workOrderTableHasColumn($pdo, 'work_order_machine_runs', 'calibration_employee_id');
    $machineRunCalibrationSelect = $hasRunCalibrationEmployee ? 'e3.name AS calibration_employee_name,' : "'' AS calibration_employee_name,";
    $machineRunCalibrationJoin = $hasRunCalibrationEmployee ? 'LEFT JOIN employees e3 ON womr.calibration_employee_id = e3.id' : '';

    $machineRunsStmt = $pdo->prepare("
        SELECT
            womr.*,
            m.machine_number,
            m.name AS machine_name,
            mc.capability_name AS machine_capability_name,
            e1.name AS assigned_employee_name,
            e2.name AS created_by_name,
            {$machineRunCalibrationSelect}
            COALESCE(receipts.partial_receipt_count, 0) AS partial_receipt_count,
            COALESCE(receipts.partial_receipt_net_weight_kg, 0) AS partial_receipt_net_weight_kg,
            COALESCE(receipts.partial_receipt_units, 0) AS partial_receipt_units
        FROM work_order_machine_runs womr
        LEFT JOIN machines m ON womr.machine_id = m.id
        LEFT JOIN machine_capabilities mc ON m.machine_capability_id = mc.id
        LEFT JOIN employees e1 ON womr.assigned_employee_id = e1.id
        LEFT JOIN employees e2 ON womr.created_by_employee_id = e2.id
        {$machineRunCalibrationJoin}
        LEFT JOIN (
            SELECT
                machine_run_id,
                COUNT(*) AS partial_receipt_count,
                SUM(net_weight_kg) AS partial_receipt_net_weight_kg,
                SUM(calculated_units) AS partial_receipt_units
            FROM work_order_partial_receipts
            WHERE receipt_status <> 'reversed'
            GROUP BY machine_run_id
        ) receipts ON receipts.machine_run_id = womr.id
        WHERE womr.work_order_id = :work_order_id
          AND womr.deleted_at IS NULL
        ORDER BY womr.machine_sequence IS NULL, womr.machine_sequence, womr.id
    ");
    $machineRunsStmt->execute(['work_order_id' => $id]);
    $machineRuns = $machineRunsStmt->fetchAll(PDO::FETCH_ASSOC);

    if ($machineRuns) {
        $machineRunIds = array_map(static fn(array $run): int => (int)$run['id'], $machineRuns);
        $placeholders = implode(',', array_fill(0, count($machineRunIds), '?'));
        $machineDefectsStmt = $pdo->prepare("
            SELECT
                womd.machine_run_id,
                womd.screening_service_id,
                womd.service_name,
                womd.defect_quantity,
                womd.recorded_at,
                e.name AS recorded_by_name
            FROM work_order_machine_defects womd
            LEFT JOIN employees e ON womd.recorded_by_employee_id = e.id
            WHERE womd.machine_run_id IN ($placeholders)
            ORDER BY womd.machine_run_id ASC, womd.screening_service_id ASC
        ");
        $machineDefectsStmt->execute($machineRunIds);
        $machineDefects = $machineDefectsStmt->fetchAll(PDO::FETCH_ASSOC);

        $defectsByRun = [];
        foreach ($machineDefects as $defect) {
            $runId = (int)$defect['machine_run_id'];
            if (!isset($defectsByRun[$runId])) {
                $defectsByRun[$runId] = [];
            }
            $defectsByRun[$runId][] = $defect;
        }

        foreach ($machineRuns as &$machineRun) {
            $runId = (int)$machineRun['id'];
            $machineRun['defects'] = $defectsByRun[$runId] ?? [];
        }
        unset($machineRun);

        $recordsByRun = [];
        if (workOrderTableHasColumn($pdo, 'production_records', 'machine_run_id')) {
            $machineRecordsStmt = $pdo->prepare("
                SELECT
                    pr.*,
                    {$productionSourceModeSelect}
                    {$toolNameSelect}
                    {$toolWeightSelect}
                    m.name AS machine_name,
                    e.name AS employee_name
                FROM production_records pr
                LEFT JOIN machines m ON pr.machine_id = m.id
                LEFT JOIN employees e ON pr.employee_id = e.id
                WHERE pr.machine_run_id IN ($placeholders)
                ORDER BY pr.machine_run_id ASC, pr.production_date ASC, pr.production_time ASC, pr.id ASC
            ");
            $machineRecordsStmt->execute($machineRunIds);
            $machineProductionRecords = $machineRecordsStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($machineProductionRecords as $record) {
                $runId = (int)$record['machine_run_id'];
                if (!isset($recordsByRun[$runId])) {
                    $recordsByRun[$runId] = [];
                }
                $recordsByRun[$runId][] = $record;
            }
        }

        foreach ($machineRuns as &$machineRun) {
            $runId = (int)$machineRun['id'];
            $machineRun['production_records'] = $recordsByRun[$runId] ?? [];
        }
        unset($machineRun);
    }

    $workOrder['machine_runs'] = $machineRuns;
    $productionSummary = fetchWorkOrderProductionSummary(
        $pdo,
        $id,
        (string)($workOrder['work_order_type'] ?? 'normal'),
        (float)($workOrder['weight_per_unit_g'] ?? 0)
    );
    $partialReceiptLedger = fetchWorkOrderPartialReceiptLedger($pdo, $id);
    $finalInventorySummary = fetchWorkOrderFinalInventorySummary(
        $pdo,
        $id,
        (float)($workOrder['weight_per_unit_g'] ?? 0)
    );
    $workOrder['partial_receipt_summary'] = buildWorkOrderPartialReceiptSummary(
        $workOrder,
        $productionSummary,
        $partialReceiptLedger['summary'],
        $finalInventorySummary
    );
    $workOrder['partial_receipts'] = $partialReceiptLedger['partial_receipts'];
    $workOrder['partial_receipt_count'] = (int)($workOrder['partial_receipt_summary']['partial_receipt_count'] ?? 0);
    $workOrder['partial_receipt_net_weight_kg'] = round((float)($workOrder['partial_receipt_summary']['partial_received_net_weight_kg'] ?? 0), 2);
    $workOrder['partial_receipt_units'] = (float)round((float)($workOrder['partial_receipt_summary']['partial_received_units'] ?? 0), 0);
    $workOrder['partial_receipt_remaining_net_weight_kg'] = round(max(
        0,
        (float)($workOrder['partial_receipt_summary']['expected_net_weight_kg'] ?? 0)
        - (float)($workOrder['partial_receipt_summary']['partial_received_net_weight_kg'] ?? 0)
    ), 2);

    $secondScreeningStmt = $pdo->prepare("
        SELECT rb.id
        FROM rescreen_batches rb
        WHERE rb.deleted_at IS NULL
          AND (
              rb.source_work_order_id = :work_order_id
              OR rb.id = NULLIF(:source_rescreen_batch_id, 0)
          )
        ORDER BY rb.id DESC
    ");
    $secondScreeningStmt->execute([
        'work_order_id' => $id,
        'source_rescreen_batch_id' => (int)($workOrder['source_rescreen_batch_id'] ?? 0),
    ]);
    $secondScreeningBatchIds = array_map('intval', $secondScreeningStmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
    $workOrder['second_screening_batches'] = array_values(array_filter(array_map(
        static fn(int $batchId): ?array => getRescreenBatchDetails($pdo, $batchId),
        $secondScreeningBatchIds
    )));
    $workOrder['second_screening_count'] = count($workOrder['second_screening_batches']);

    jsonResponse([
        'success' => true,
        'data' => $workOrder
    ]);

} catch (Exception $e) {
    error_log('Work order show failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '查詢工單失敗，請稍後重試。')
    ], 500);
}
