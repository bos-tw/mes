<?php
/**
 * 訂單品項 API - CSV 匯出
 *
 * 匯出指定訂單的所有品項為 CSV 檔案。
 *
 * @endpoint GET /api/order_items/export.php?order_id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數     | 類型 | 必填 | 說明    |
 * |----------|------|-----|---------|
 * | order_id | int  | 是  | 訂單 ID |
 *
 * @output CSV 檔案
 * - Content-Type: text/csv; charset=utf-8
 * - 檔名: order_{id}_items_{YYYYMMDD_HHmmss}.csv
 * - 編碼: UTF-8 with BOM
 *
 * @columns CSV 欄位:
 * | 欄位名稱          | 說明               |
 * |--------------------|--------------------|
 * | 品項ID              | order_items.id     |
 * | 受篩產品            | 編號 + 名稱         |
 * | 總重量(kg)         | total_weight_kg    |
 * | 載具重量合計(kg)    | 計算值             |
 * | 淨重(kg)           | 總重 - 載具重       |
 * | 總支數             | total_units        |
 * | 單價合計(每支)     | 篩分服務單價加總     |
 * | 品項總金額          | total_price        |
 * | 狀態               | status_label       |
 * | 客戶樣品狀態        | customer_sample_status_label |
 * | 篩分服務            | 服務名稱逗號分隔     |
 * | 建立時間            | created_at         |
 * | 更新時間            | updated_at         |
 *
 * @error 400 order_id 無效
 * @error 404 訂單不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('GET');

$orderId = filter_input(INPUT_GET, 'order_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$orderId) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();

if (!ensureOrderExists($pdo, $orderId)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單資料。',
    ], 404);
}

$rows = findOrderItemsByOrder($pdo, $orderId);
$orderItemIds = array_map(static fn(array $row): int => (int)$row['id'], $rows);
$toolsMap = getOrderItemTools($pdo, $orderItemIds);
$detailsMap = getOrderItemScreeningDetails($pdo, $orderItemIds);

$filename = sprintf('order_%d_items_%s.csv', $orderId, date('Ymd_His'));

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

echo "\xEF\xBB\xBF"; // BOM for UTF-8

$output = fopen('php://output', 'w');
if ($output === false) {
    jsonResponse([
        'success' => false,
        'message' => '無法產生匯出檔案。',
    ], 500);
}

$headers = [
    '品項ID',
    '受篩產品',
    '總重量(kg)',
    '載具重量合計(kg)',
    '淨重(kg)',
    '總支數',
    '單價合計(每支)',
    '品項總金額',
    '狀態',
    '客戶樣品狀態',
    '篩分服務',
    '建立時間',
    '更新時間',
];

fputcsv($output, $headers);

foreach ($rows as $row) {
    $id = (int)$row['id'];
    $tools = $toolsMap[$id] ?? [];
    $details = $detailsMap[$id] ?? [];

    $toolWeight = 0.0;
    foreach ($tools as $tool) {
        $toolWeight += isset($tool['total_weight_kg']) ? (float)$tool['total_weight_kg'] : 0.0;
    }
    $toolWeight = round($toolWeight, 4);

    $serviceUnitPriceSum = 0.0;
    $serviceNames = [];
    foreach ($details as $detail) {
        $serviceUnitPriceSum += isset($detail['actual_price_per_unit']) ? (float)$detail['actual_price_per_unit'] : 0.0;
        $serviceNames[] = $detail['service_name'] ?? $detail['defaults']['name'] ?? '';
    }
    $serviceUnitPriceSum = round($serviceUnitPriceSum, 4);

    $totalWeight = isset($row['total_weight_kg']) ? (float)$row['total_weight_kg'] : 0.0;
    $netWeight = round($totalWeight - $toolWeight, 4);

    $screeningItemName = trim(($row['screening_item_name'] ?? '') . ' ' . ($row['screening_item_number'] ?? ''));

    fputcsv($output, [
        $id,
        $screeningItemName,
        $totalWeight,
        $toolWeight,
        $netWeight,
        isset($row['total_units']) ? (float)$row['total_units'] : 0.0,
        $serviceUnitPriceSum,
        isset($row['total_price']) ? (float)$row['total_price'] : 0.0,
        $row['status_label'] ?? $row['status'] ?? '',
        $row['customer_sample_status_label'] ?? $row['customer_sample_status'] ?? '',
        implode('、', array_filter($serviceNames)),
        $row['created_at'] ?? '',
        $row['updated_at'] ?? '',
    ]);
}

fclose($output);
exit;
