<?php
/**
 * 篩分檢驗結果報表 API
 *
 * 根據工單 ID 取得完整的篩分檢驗結果資料
 * 供列印報表和手機版靜態頁面使用
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../work_orders/helpers.php';

requireAuth();

header('Content-Type: application/json; charset=utf-8');

// 取得工單 ID
$workOrderId = isset($_GET['work_order_id']) ? (int)$_GET['work_order_id'] : 0;

if (!$workOrderId) {
    echo json_encode(['success' => false, 'message' => '缺少工單 ID']);
    exit;
}

try {
    $pdo = db();

    // 1. 查詢工單基本資訊
    $sql = "
        SELECT
            wo.id,
            wo.work_order_number,
            wo.total_weight_kg,
            wo.weight_per_unit_g,
            wo.total_units,
            wo.work_order_type,
            wo.tool_statistics,
            wo.screening_speed,
            wo.customer_instructions,
            wo.other_notes,
            wo.shortage_net_weight_kg,
            wo.shortage_units,
            wo.shortage_reason_code,
            wo.shortage_notes,
            wo.shortage_confirmed_by,
            wo.shortage_confirmed_at,
            wo.status,
            wo.actual_start_date,
            wo.actual_end_date,
            wo.is_printed,
            wo.created_at,
            -- 訂單品項資訊
            oi.id AS order_item_id,
            oi.customer_batch_number,
            oi.total_weight_kg AS oi_total_weight_kg,
            oi.total_units AS oi_total_units,
            oi.part_number,
            oi.drawing_number,
            -- 訂單資訊
            o.id AS order_id,
            o.order_number,
            o.order_date,
            o.customer_po_number,
            o.expected_delivery_date,
            -- 客戶資訊
            c.id AS customer_id,
            c.name AS customer_name,
            c.customer_number,
            c.phone AS customer_phone,
            c.fax AS customer_fax,
            c.shipping_address AS customer_address,
            c.contact_person AS customer_contact,
            -- 受篩產品
            si.id AS screening_item_id,
            si.name AS screening_item_name,
            si.weight_per_unit_g AS si_weight_per_unit_g,
            si.material AS si_material,
            -- 機台
            m.machine_number,
            m.name AS machine_name,
            -- 作業員
            e.name AS assigned_employee_name,
            -- 狀態標籤
            lv.value_label AS status_label
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN employees e ON wo.assigned_employee_id = e.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        WHERE wo.id = ? AND wo.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$workOrderId]);
    $workOrder = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$workOrder) {
        echo json_encode(['success' => false, 'message' => '找不到指定的工單']);
        exit;
    }

    // 2. 查詢篩分服務明細（從訂單品項）
    $sqlScreening = "
        SELECT
            oisd.id,
            oisd.screening_service_id,
            oisd.service_name,
            oisd.service_name_en,
            oisd.tolerance_plus_value,
            oisd.tolerance_plus_over,
            oisd.tolerance_minus_value,
            oisd.tolerance_minus_over,
            oisd.ppm_standard,
            oisd.notes,
            oisd.description,
            ss.category,
            ss.name_en AS ss_name_en
        FROM order_item_screening_details oisd
        LEFT JOIN screening_services ss ON oisd.screening_service_id = ss.id
        WHERE oisd.order_item_id = ?
        ORDER BY oisd.id
    ";
    $stmt = $pdo->prepare($sqlScreening);
    $stmt->execute([$workOrder['order_item_id']]);
    $screeningDetails = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. 查詢工單篩分不良品記錄
    $sqlDefects = "
        SELECT
            wosd.id,
            wosd.screening_service_id,
            wosd.service_name,
            wosd.defect_quantity,
            wosd.recorded_at,
            wosd.notes,
            e.name AS recorded_by_name
        FROM work_order_screening_defects wosd
        LEFT JOIN employees e ON wosd.recorded_by_employee_id = e.id
        WHERE wosd.work_order_id = ?
        ORDER BY wosd.screening_service_id
    ";
    $stmt = $pdo->prepare($sqlDefects);
    $stmt->execute([$workOrderId]);
    $defectsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 建立不良品的 Map (screening_service_id => defect_quantity)
    $defectsMap = [];
    foreach ($defectsRaw as $defect) {
        $defectsMap[$defect['screening_service_id']] = $defect;
    }

    // 4. 查詢載具統計（以訂單品項為基準）
    $sqlToolSummary = "
        SELECT
            COALESCE(SUM(quantity), 0) AS total_tool_quantity,
            COALESCE(SUM(total_weight), 0) AS total_tool_weight
        FROM order_item_tools
        WHERE order_item_id = ?
    ";
    $stmt = $pdo->prepare($sqlToolSummary);
    $stmt->execute([$workOrder['order_item_id']]);
    $toolSummary = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $totalToolQuantity = (int)($toolSummary['total_tool_quantity'] ?? 0);
    $totalToolWeight = (float)($toolSummary['total_tool_weight'] ?? 0);

    // 5. 查詢生產紀錄重量合計（篩分後實際淨重來源）
    $sqlProductionSummary = "
        SELECT
            COUNT(*) AS total_records,
            COALESCE(SUM(weight_kg), 0) AS total_weight_kg
        FROM production_records
        WHERE work_order_id = ?
    ";
    $stmt = $pdo->prepare($sqlProductionSummary);
    $stmt->execute([$workOrderId]);
    $productionSummary = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $productionRecordCount = (int)($productionSummary['total_records'] ?? 0);
    $totalProductionWeight = (float)($productionSummary['total_weight_kg'] ?? 0);

    // 6. 合併篩分明細與不良品數據
    $screeningResults = [];
    $totalDefectDistributionUnits = 0;

    foreach ($screeningDetails as $detail) {
        $serviceId = $detail['screening_service_id'];
        $defectQty = isset($defectsMap[$serviceId]) ? (int)$defectsMap[$serviceId]['defect_quantity'] : 0;
        $totalDefectDistributionUnits += $defectQty;

        // 格式化公差值
        $toleranceDisplay = '';
        if ($detail['tolerance_plus_value'] || $detail['tolerance_minus_value']) {
            $plus = $detail['tolerance_plus_value'] ? '+' . $detail['tolerance_plus_value'] : '';
            $minus = $detail['tolerance_minus_value'] ? '-' . $detail['tolerance_minus_value'] : '';
            $toleranceDisplay = trim($plus . ' / ' . $minus, ' /');
        }

        $screeningResults[] = [
            'service_id' => $serviceId,
            'service_name' => $detail['service_name'],
            'service_name_en' => $detail['service_name_en'] ?: $detail['ss_name_en'] ?: '',
            'tolerance_display' => $toleranceDisplay,
            'tolerance_plus_value' => $detail['tolerance_plus_value'],
            'tolerance_minus_value' => $detail['tolerance_minus_value'],
            'ppm_standard' => $detail['ppm_standard'],
            'category' => $detail['category'],
            'defect_quantity' => $defectQty,
            'notes' => $detail['notes'] ?: $detail['description']
        ];
    }

    // 7. 計算統計數據（重量優先口徑）
    $weightPerUnitG = (float)($workOrder['weight_per_unit_g'] ?: $workOrder['si_weight_per_unit_g'] ?: 0);
    $orderTotalWeight = (float)($workOrder['total_weight_kg'] ?: $workOrder['oi_total_weight_kg'] ?: 0);
    $orderNetWeight = max($orderTotalWeight - $totalToolWeight, 0);
    $actualNetWeight = $productionRecordCount > 0
        ? max($totalProductionWeight - $totalToolWeight, 0)
        : $orderNetWeight;

    $goodUnits = $weightPerUnitG > 0
        ? max((int)floor(($actualNetWeight * 1000) / $weightPerUnitG), 0)
        : 0;

    $defectWeightKg = max($orderNetWeight - $actualNetWeight, 0);
    $defectUnitsByWeight = $weightPerUnitG > 0
        ? max((int)round(($defectWeightKg * 1000) / $weightPerUnitG), 0)
        : 0;

    $totalUnits = $goodUnits + $defectUnitsByWeight;
    $defectRate = $totalUnits > 0 ? ($defectUnitsByWeight / $totalUnits) * 100 : 0;
    $defectRatePpm = $totalUnits > 0 ? ($defectUnitsByWeight / $totalUnits) * 1000000 : 0;

    // 7-1. 拆分工單機台分頁明細：主工單總表仍採重量優先，機台頁籤提供追溯拆解。
    $sqlMachineRuns = "
        SELECT
            womr.id,
            womr.run_label,
            womr.machine_id,
            m.name AS machine_name,
            womr.machine_sequence,
            womr.scheduled_start_date,
            womr.scheduled_end_date,
            womr.actual_start_date,
            womr.actual_end_date,
            womr.planned_net_weight_kg,
            womr.completed_net_weight_kg,
            womr.weight_per_unit_g,
            womr.planned_units,
            womr.completed_units,
            womr.status,
            womr.notes,
            COALESCE(receipts.partial_receipt_count, 0) AS partial_receipt_count,
            COALESCE(receipts.partial_receipt_net_weight_kg, 0) AS partial_receipt_net_weight_kg,
            COALESCE(receipts.partial_receipt_units, 0) AS partial_receipt_units
        FROM work_order_machine_runs womr
        LEFT JOIN machines m ON m.id = womr.machine_id
        LEFT JOIN (
            SELECT
                machine_run_id,
                COUNT(*) AS partial_receipt_count,
                SUM(net_weight_kg) AS partial_receipt_net_weight_kg,
                SUM(calculated_units) AS partial_receipt_units
            FROM work_order_partial_receipts
            WHERE receipt_status != 'reversed'
            GROUP BY machine_run_id
        ) receipts ON receipts.machine_run_id = womr.id
        WHERE womr.work_order_id = ?
          AND womr.deleted_at IS NULL
        ORDER BY womr.machine_sequence IS NULL, womr.machine_sequence, womr.id
    ";
    $stmt = $pdo->prepare($sqlMachineRuns);
    $stmt->execute([$workOrderId]);
    $machineRuns = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $machineRunDefects = [];
    if (!empty($machineRuns)) {
        $machineRunIds = array_map(static fn($run) => (int)$run['id'], $machineRuns);
        $placeholders = implode(',', array_fill(0, count($machineRunIds), '?'));
        $defectStmt = $pdo->prepare("
            SELECT machine_run_id, screening_service_id, service_name, defect_quantity, notes
            FROM work_order_machine_defects
            WHERE machine_run_id IN ($placeholders)
            ORDER BY machine_run_id, screening_service_id
        ");
        $defectStmt->execute($machineRunIds);
        foreach ($defectStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $runId = (int)$row['machine_run_id'];
            if (!isset($machineRunDefects[$runId])) {
                $machineRunDefects[$runId] = [];
            }
            $machineRunDefects[$runId][] = $row;
        }

        foreach ($machineRuns as &$machineRun) {
            $runId = (int)$machineRun['id'];
            $machineRun['defects'] = $machineRunDefects[$runId] ?? [];
            $machineRun['defect_units_distribution'] = array_sum(array_map(
                static fn($defect) => (int)($defect['defect_quantity'] ?? 0),
                $machineRun['defects']
            ));
        }
        unset($machineRun);
    }

    $productionSummary = fetchWorkOrderProductionSummary(
        $pdo,
        $workOrderId,
        (string)($workOrder['work_order_type'] ?? 'normal'),
        $weightPerUnitG
    );
    $partialReceiptLedger = fetchWorkOrderPartialReceiptLedger($pdo, $workOrderId);
    $finalInventorySummary = fetchWorkOrderFinalInventorySummary($pdo, $workOrderId, $weightPerUnitG);
    $workOrder['partial_receipt_summary'] = buildWorkOrderPartialReceiptSummary(
        [
            'total_weight_kg' => $orderTotalWeight,
            'weight_per_unit_g' => $weightPerUnitG,
            'shortage_net_weight_kg' => $workOrder['shortage_net_weight_kg'] ?? null,
            'shortage_units' => $workOrder['shortage_units'] ?? null,
            'shortage_reason_code' => $workOrder['shortage_reason_code'] ?? null,
            'shortage_notes' => $workOrder['shortage_notes'] ?? null,
            'shortage_confirmed_by' => $workOrder['shortage_confirmed_by'] ?? null,
            'shortage_confirmed_at' => $workOrder['shortage_confirmed_at'] ?? null,
        ],
        $productionSummary,
        $partialReceiptLedger['summary'],
        $finalInventorySummary
    );
    $workOrder['partial_receipts'] = $partialReceiptLedger['partial_receipts'];

    // 8. 準備圓餅圖數據（只包含有不良品的項目）
    $chartLabels = [];
    $chartLabelsEn = [];
    $chartValues = [];
    $chartColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#E7E9ED', '#97BBCD',
        '#DCDCDC', '#F7464A', '#46BFBD', '#FDB45C'
    ];

    foreach ($screeningResults as $result) {
        if ($result['defect_quantity'] > 0) {
            $chartLabels[] = $result['service_name'];
            $chartLabelsEn[] = $result['service_name_en'] ?: $result['service_name'];
            $chartValues[] = $result['defect_quantity'];
        }
    }

    // 9. 查詢公司資訊
    $sqlCompany = "SELECT * FROM companies WHERE id = 1 LIMIT 1";
    $company = $pdo->query($sqlCompany)->fetch(PDO::FETCH_ASSOC);

    // 10. 取得系統參數
    $sqlParams = "SELECT param_key, param_value FROM system_parameters WHERE param_key IN ('REPORT_EXTERNAL_URL', 'COMPANY_SHORT_NAME')";
    $params = [];
    foreach ($pdo->query($sqlParams)->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $params[$p['param_key']] = $p['param_value'];
    }

    // 11. 取得報表說明
    $sqlDesc = "SELECT description, description_en FROM report_descriptions WHERE report_code = 'screening_inspection' AND is_active = 1 LIMIT 1";
    $reportDesc = $pdo->query($sqlDesc)->fetch(PDO::FETCH_ASSOC);
    $reportDescription = '';
    if ($reportDesc) {
        // 合併中英文說明
        $descZh = $reportDesc['description'] ?: '';
        $descEn = $reportDesc['description_en'] ?: '';
        $reportDescription = $descZh . ($descZh && $descEn ? "\n\n" : '') . $descEn;
    }

    // 建立 QR Code URL（未設定 REPORT_EXTERNAL_URL 時回退為同站靜態頁路徑）
    $reportExternalBase = trim((string)($params['REPORT_EXTERNAL_URL'] ?? ''));
    if ($reportExternalBase === '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/api/reports/screening_inspection.php';
        $projectBasePath = preg_replace('#/api/reports/screening_inspection\.php$#', '', $scriptName);
        $reportExternalBase = rtrim($scheme . '://' . $host . $projectBasePath, '/')
            . '/export/qrcode_pages';
    }
    $resolvedQrCodeUrl = rtrim($reportExternalBase, '/') . '/' . $workOrder['work_order_number'] . '.html';

    // 組裝回傳資料
    $response = [
        'success' => true,
        'data' => [
            // 工單基本資訊
            'work_order' => [
                'id' => $workOrder['id'],
                'work_order_number' => $workOrder['work_order_number'],
                'total_weight_kg' => round($orderTotalWeight, 3),
                'weight_per_unit_g' => $weightPerUnitG,
                'total_units' => $totalUnits,
                'tool_statistics' => $workOrder['tool_statistics'],
                'total_tool_quantity' => $totalToolQuantity,
                'total_tool_weight_kg' => round($totalToolWeight, 3),
                'order_net_weight_kg' => round($orderNetWeight, 3),
                'actual_net_weight_kg' => round($actualNetWeight, 3),
                'production_total_weight_kg' => round($totalProductionWeight, 3),
                'production_record_count' => $productionRecordCount,
                'screening_speed' => $workOrder['screening_speed'],
                'status' => $workOrder['status'],
                'status_label' => $workOrder['status_label'],
                'assigned_employee_name' => $workOrder['assigned_employee_name'],
                'actual_start_date' => $workOrder['actual_start_date'],
                'actual_end_date' => $workOrder['actual_end_date'],
                'customer_instructions' => $workOrder['customer_instructions'],
                'other_notes' => $workOrder['other_notes']
            ],
            // 訂單資訊
            'order' => [
                'id' => $workOrder['order_id'],
                'order_number' => $workOrder['order_number'],
                'order_date' => $workOrder['order_date'],
                'customer_po_number' => $workOrder['customer_po_number'],
                'expected_delivery_date' => $workOrder['expected_delivery_date']
            ],
            // 訂單品項資訊
            'order_item' => [
                'id' => $workOrder['order_item_id'],
                'customer_batch_number' => $workOrder['customer_batch_number'],
                'part_number' => $workOrder['part_number'],
                'drawing_number' => $workOrder['drawing_number']
            ],
            // 客戶資訊
            'customer' => [
                'id' => $workOrder['customer_id'],
                'name' => $workOrder['customer_name'],
                'customer_number' => $workOrder['customer_number'],
                'phone' => $workOrder['customer_phone'],
                'fax' => $workOrder['customer_fax'],
                'address' => $workOrder['customer_address'],
                'contact_person' => $workOrder['customer_contact']
            ],
            // 受篩產品
            'screening_item' => [
                'id' => $workOrder['screening_item_id'],
                'name' => $workOrder['screening_item_name'],
                'weight_per_unit_g' => $workOrder['si_weight_per_unit_g'],
                'material' => $workOrder['si_material']
            ],
            // 篩分檢驗結果
            'screening_results' => $screeningResults,
            // 拆分工單機台分頁明細
            'machine_runs' => $machineRuns,
            // 統計摘要
            'summary' => [
                'total_units' => $totalUnits,
                'good_units' => $goodUnits,
                'defect_units' => $defectUnitsByWeight,
                'defect_units_distribution' => $totalDefectDistributionUnits,
                'defect_weight_kg' => round($defectWeightKg, 3),
                'order_net_weight_kg' => round($orderNetWeight, 3),
                'actual_net_weight_kg' => round($actualNetWeight, 3),
                'total_tool_weight_kg' => round($totalToolWeight, 3),
                'total_tool_quantity' => $totalToolQuantity,
                'defect_rate_percent' => round($defectRate, 4),
                'defect_rate_ppm' => round($defectRatePpm, 2),
                'partial_receipt_summary' => $workOrder['partial_receipt_summary'],
            ],
            'partial_receipts' => $workOrder['partial_receipts'],
            // 圓餅圖數據
            'chart_data' => [
                'labels' => $chartLabels,
                'labels_en' => $chartLabelsEn,
                'values' => $chartValues,
                'colors' => array_slice($chartColors, 0, count($chartLabels))
            ],
            // 公司資訊
            'company' => $company,
            // 系統參數
            'system_params' => $params,
            // QR Code URL
            'qrcode_url' => $resolvedQrCodeUrl,
            // 報表說明
            'report_description' => $reportDescription,
            // 報表產生時間
            'generated_at' => date('Y-m-d H:i:s')
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log('篩分檢驗報表 API 錯誤: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '資料庫查詢錯誤，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
