<?php
/**
 * 篩分檢驗結果報表 API
 *
 * 根據工單 ID 取得完整的篩分檢驗結果資料
 * 供列印報表和手機版靜態頁面使用
 */

require_once __DIR__ . '/../bootstrap.php';

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
            wo.tool_statistics,
            wo.screening_speed,
            wo.customer_instructions,
            wo.other_notes,
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

    // 4. 合併篩分明細與不良品數據
    $screeningResults = [];
    $totalDefectQuantity = 0;

    foreach ($screeningDetails as $detail) {
        $serviceId = $detail['screening_service_id'];
        $defectQty = isset($defectsMap[$serviceId]) ? (int)$defectsMap[$serviceId]['defect_quantity'] : 0;
        $totalDefectQuantity += $defectQty;

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

    // 5. 計算統計數據
    $totalUnits = (float)($workOrder['total_units'] ?: $workOrder['oi_total_units'] ?: 0);
    $goodUnits = $totalUnits - $totalDefectQuantity;
    $defectRate = $totalUnits > 0 ? ($totalDefectQuantity / $totalUnits) * 100 : 0;
    $defectRatePpm = $totalUnits > 0 ? ($totalDefectQuantity / $totalUnits) * 1000000 : 0;

    // 6. 準備圓餅圖數據（只包含有不良品的項目）
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

    // 7. 查詢公司資訊
    $sqlCompany = "SELECT * FROM companies WHERE id = 1 LIMIT 1";
    $company = $pdo->query($sqlCompany)->fetch(PDO::FETCH_ASSOC);

    // 8. 取得系統參數
    $sqlParams = "SELECT param_key, param_value FROM system_parameters WHERE param_key IN ('REPORT_EXTERNAL_URL', 'COMPANY_SHORT_NAME')";
    $params = [];
    foreach ($pdo->query($sqlParams)->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $params[$p['param_key']] = $p['param_value'];
    }

    // 9. 取得報表說明
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
                'total_weight_kg' => $workOrder['total_weight_kg'],
                'weight_per_unit_g' => $workOrder['weight_per_unit_g'] ?: $workOrder['si_weight_per_unit_g'],
                'total_units' => $totalUnits,
                'tool_statistics' => $workOrder['tool_statistics'],
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
            // 統計摘要
            'summary' => [
                'total_units' => round($totalUnits),
                'good_units' => round($goodUnits),
                'defect_units' => $totalDefectQuantity,
                'defect_rate_percent' => round($defectRate, 4),
                'defect_rate_ppm' => round($defectRatePpm, 2)
            ],
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
