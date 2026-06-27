<?php
/**
 * 產生 QR Code 靜態報表頁面 API
 *
 * 根據工單 ID 產生可供外部存取的靜態 HTML 頁面
 * 供客戶透過 QR Code 掃描查看
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
requireAuth();

header('Content-Type: application/json; charset=utf-8');

// 取得工單 ID
$workOrderId = isset($_POST['work_order_id']) ? (int)$_POST['work_order_id'] : 0;

if (!$workOrderId) {
    echo json_encode(['success' => false, 'message' => '缺少工單 ID']);
    exit;
}

try {
    $pdo = db();

    // 先呼叫現有的 API 取得報表資料
    $_GET['work_order_id'] = $workOrderId;
    ob_start();
    include __DIR__ . '/screening_inspection.php';
    $apiResponse = ob_get_clean();

    $reportData = json_decode($apiResponse, true);

    if (!$reportData['success']) {
        echo json_encode($reportData);
        exit;
    }

    $data = $reportData['data'];

    // 取得系統參數
    $sqlParams = "SELECT param_key, param_value FROM system_parameters WHERE param_key IN ('REPORT_EXPORT_PATH', 'REPORT_EXTERNAL_URL', 'COMPANY_SHORT_NAME')";
    $params = [];
    foreach ($pdo->query($sqlParams)->fetchAll(PDO::FETCH_ASSOC) as $p) {
        $params[$p['param_key']] = $p['param_value'];
    }

    $exportPath = $params['REPORT_EXPORT_PATH'] ?? 'export/qrcode_pages';
    $externalUrl = trim((string)($params['REPORT_EXTERNAL_URL'] ?? ''));
    $companyShortName = $params['COMPANY_SHORT_NAME'] ?? '';

    // 確保匯出路徑存在
    $fullExportPath = dirname(__DIR__, 2) . '/' . $exportPath;
    if (!is_dir($fullExportPath)) {
        mkdir($fullExportPath, 0755, true);
    }

    // 讀取模板
    $templatePath = __DIR__ . '/templates/qrcode_report.tpl.html';
    if (!file_exists($templatePath)) {
        echo json_encode(['success' => false, 'message' => '找不到報表模板']);
        exit;
    }

    $template = file_get_contents($templatePath);

    // 準備替換變數
    $workOrder = $data['work_order'];
    $order = $data['order'];
    $orderItem = $data['order_item'];
    $customer = $data['customer'];
    $screeningItem = $data['screening_item'];
    $summary = $data['summary'];
    $chartData = $data['chart_data'];
    $company = $data['company'];
    $displayTotalUnits = (int)($summary['total_units'] ?? 0);
    $displayDefectUnits = (int)($summary['defect_units_distribution'] ?? $summary['defect_units'] ?? 0);
    $displayGoodUnits = max($displayTotalUnits - $displayDefectUnits, 0);
    $displayDefectRate = $displayTotalUnits > 0 ? ($displayDefectUnits / $displayTotalUnits) * 100 : 0;

    // 生成篩分結果表格行
    $resultRows = '';
    foreach ($data['screening_results'] as $result) {
        $defectClass = $result['defect_quantity'] > 0 ? 'has-defect' : 'zero';
        $resultRows .= sprintf(
            '<tr>
                <td>%s</td>
                <td class="text-center">%s</td>
                <td class="text-center"><span class="defect-count %s">%s</span></td>
            </tr>',
            htmlspecialchars($result['service_name']),
            htmlspecialchars($result['tolerance_display'] ?: '-'),
            $defectClass,
            number_format($result['defect_quantity'])
        );
    }

    // 總計行
    $resultRows .= sprintf(
        '<tr style="background-color: #f5f5f5; font-weight: bold;">
            <td>合計</td>
            <td></td>
            <td class="text-center"><span class="defect-count has-defect">%s</span></td>
        </tr>',
        number_format($displayDefectUnits)
    );

    // 準備圓餅圖區段
    if (count($chartData['labels']) > 0) {
        $chartSection = '
        <div class="card">
            <div class="card-header">
                <i class="fas fa-chart-pie"></i> 不良品分布圖
            </div>
            <div class="chart-container">
                <div class="pie-chart-wrapper">
                    <canvas id="defectChart"></canvas>
                </div>
                <div class="chart-legend" id="chartLegend"></div>
            </div>
        </div>';

        // 圖表 JavaScript
        $chartScript = sprintf("
        document.addEventListener('DOMContentLoaded', function() {
            const ctx = document.getElementById('defectChart');
            const labels = %s;
            const values = %s;
            const colors = %s;

            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // 自訂圖例
            const legendHtml = labels.map((label, i) => {
                return '<div class=\"legend-item\"><span class=\"legend-color\" style=\"background-color:' + colors[i] + '\"></span>' + label + ' (' + values[i] + ')</div>';
            }).join('');
            document.getElementById('chartLegend').innerHTML = legendHtml;
        });
        ",
            json_encode($chartData['labels'], JSON_UNESCAPED_UNICODE),
            json_encode($chartData['values']),
            json_encode($chartData['colors'])
        );
    } else {
        $chartSection = '
        <div class="no-defect-message">
            <i class="fas fa-check-circle"></i>
            本批次無不良品，品質優良！
        </div>';
        $chartScript = '';
    }

    // 執行變數替換
    $replacements = [
        '{{COMPANY_SHORT_NAME}}' => htmlspecialchars($companyShortName),
        '{{COMPANY_NAME}}' => htmlspecialchars($company['name'] ?? ''),
        '{{COMPANY_ADDRESS}}' => htmlspecialchars($company['address'] ?? ''),
        '{{COMPANY_PHONE}}' => htmlspecialchars($company['phone'] ?? ''),
        '{{WORK_ORDER_NUMBER}}' => htmlspecialchars($workOrder['work_order_number']),
        '{{CUSTOMER_NAME}}' => htmlspecialchars($customer['name']),
        '{{ORDER_NUMBER}}' => htmlspecialchars($order['order_number']),
        '{{CUSTOMER_BATCH_NUMBER}}' => htmlspecialchars($orderItem['customer_batch_number'] ?: '-'),
        '{{SCREENING_ITEM_NAME}}' => htmlspecialchars($screeningItem['name'] ?: '-'),
        '{{ACTUAL_END_DATE}}' => $workOrder['actual_end_date'] ? date('Y-m-d', strtotime($workOrder['actual_end_date'])) : '-',
        '{{TOTAL_UNITS}}' => number_format($displayTotalUnits),
        '{{GOOD_UNITS}}' => number_format($displayGoodUnits),
        '{{DEFECT_UNITS}}' => number_format($displayDefectUnits),
        '{{DEFECT_RATE_PERCENT}}' => number_format($displayDefectRate, 4),
        '{{SCREENING_RESULTS_ROWS}}' => $resultRows,
        '{{CHART_SECTION}}' => $chartSection,
        '{{CHART_SCRIPT}}' => $chartScript,
        '{{GENERATED_AT}}' => date('Y-m-d H:i:s')
    ];

    $html = str_replace(array_keys($replacements), array_values($replacements), $template);

    // 寫入檔案
    $fileName = $workOrder['work_order_number'] . '.html';
    $filePath = $fullExportPath . '/' . $fileName;

    if (file_put_contents($filePath, $html) === false) {
        echo json_encode(['success' => false, 'message' => '寫入檔案失敗']);
        exit;
    }

    // 建立外部 URL（若未設定 REPORT_EXTERNAL_URL，回退為同站可存取路徑）
    if ($externalUrl === '') {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $scriptName = $_SERVER['SCRIPT_NAME'] ?? '/api/reports/generate_static.php';
        $projectBasePath = preg_replace('#/api/reports/generate_static\.php$#', '', $scriptName);
        $externalUrl = rtrim($scheme . '://' . $host . $projectBasePath, '/')
            . '/' . ltrim($exportPath, '/');
    }

    $publicUrl = rtrim($externalUrl, '/') . '/' . $fileName;

    // 更新工單的 QR Code URL（可選）
    // $pdo->prepare("UPDATE work_orders SET qrcode_url = ? WHERE id = ?")->execute([$publicUrl, $workOrderId]);

    echo json_encode([
        'success' => true,
        'message' => '靜態報表頁面產生成功',
        'data' => [
            'file_name' => $fileName,
            'file_path' => $exportPath . '/' . $fileName,
            'full_path' => $filePath,
            'public_url' => $publicUrl,
            'work_order_number' => $workOrder['work_order_number']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('產生靜態報表失敗: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '產生報表時發生錯誤，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
