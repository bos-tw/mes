<?php
/**
 * 生產品質檢驗 API - CSV 匯出
 *
 * 匯出生產品質檢驗記錄為 CSV 檔案，支援關鍵字篩選。
 *
 * @endpoint GET /api/production_quality_records/export.php
 *
 * @auth 必須登入
 * @table production_quality_records, production_records, work_orders, employees
 *
 * @input GET 參數:
 * | 參數    | 類型   | 必填 | 說明                            |
 * |---------|--------|-----|--------------------------------|
 * | keyword | string | 否  | 關鍵字搜尋（工單號/檢驗員/結果/備註）|
 *
 * @output CSV 檔案下載
 * - Content-Type: text/csv; charset=utf-8
 * - 編碼: UTF-8 with BOM（可直接用 Excel 開啟）
 * - 檔名: production_quality_records_{YYYYMMDD_HHmmss}.csv
 *
 * @columns CSV 欄位:
 * | 欄位名稱        | 說明                              |
 * |----------------|----------------------------------|
 * | ID              | production_quality_records.id     |
 * | 工單號          | work_order_number                 |
 * | 生產日報卡號     | card_number                       |
 * | 檢驗時間         | inspection_datetime              |
 * | 檢驗員          | inspector_name                    |
 * | 抽樣數量(pcs)   | sample_quantity_pcs               |
 * | 不良數量(pcs)   | defective_quantity_pcs            |
 * | 不良率(PPM)     | rejection_rate_ppm                |
 * | 檢驗結果         | inspection_result                |
 * | 需要重工         | rework_needed                    |
 * | 備註             | notes                            |
 * | 建立時間         | created_at                       |
 *
 * @error 405 不支援的請求方法
 * @note 最多匯出 50,000 筆
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('GET');

const QUALITY_RECORDS_EXPORT_MAX_LIMIT = 50000;

$pdo = db();

$keyword = trim((string)($_GET['keyword'] ?? ''));

$conditions = [];
$params     = [];

if ($keyword !== '') {
    $searchableColumns = [
        'wo.work_order_number',
        'emp.name',
        'pqr.inspection_result',
        'pqr.notes',
    ];

    $likeParts = [];
    foreach ($searchableColumns as $index => $column) {
        $paramName           = 'keyword_' . $index;
        $likeParts[]         = sprintf('%s LIKE :%s', $column, $paramName);
        $params[$paramName]  = '%' . $keyword . '%';
    }

    if ($likeParts !== []) {
        $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
    }
}

$where = empty($conditions) ? '' : 'WHERE ' . implode(' AND ', $conditions);

$sql = sprintf(
    'SELECT
        pqr.id,
        wo.work_order_number,
        pr.card_number,
        pqr.inspection_datetime,
        emp.name                   AS inspector_name,
        pqr.sample_quantity_pcs,
        pqr.defective_quantity_pcs,
        pqr.rejection_rate_ppm,
        pqr.inspection_result,
        pqr.rework_needed,
        pqr.notes,
        pqr.created_at
     FROM production_quality_records pqr
     LEFT JOIN production_records pr  ON pqr.production_record_id = pr.id
     LEFT JOIN work_orders        wo  ON pr.work_order_id          = wo.id
     LEFT JOIN employees          emp ON pqr.inspector_id          = emp.id
     %s
     ORDER BY pqr.inspection_datetime DESC, pqr.id DESC
     LIMIT :limit',
    $where
);

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
}
$stmt->bindValue(':limit', QUALITY_RECORDS_EXPORT_MAX_LIMIT, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$timestamp = (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Ymd_His');
$filename  = sprintf('production_quality_records_%s.csv', $timestamp);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// UTF-8 BOM for Excel
echo "\xEF\xBB\xBF";

$handle = fopen('php://output', 'wb');
if ($handle === false) {
    http_response_code(500);
    echo '無法開啟輸出串流';
    exit;
}

fputcsv($handle, [
    'ID',
    '工單號',
    '生產日報卡號',
    '檢驗時間',
    '檢驗員',
    '抽樣數量(pcs)',
    '不良數量(pcs)',
    '不良率(PPM)',
    '檢驗結果',
    '需要重工',
    '備註',
    '建立時間',
]);

foreach ($rows as $row) {
    fputcsv($handle, [
        $row['id'],
        $row['work_order_number'] ?? '',
        $row['card_number'] ?? '',
        $row['inspection_datetime'] ?? '',
        $row['inspector_name'] ?? '',
        $row['sample_quantity_pcs'] ?? '',
        $row['defective_quantity_pcs'] ?? '',
        $row['rejection_rate_ppm'] ?? '',
        $row['inspection_result'] ?? '',
        isset($row['rework_needed']) ? ($row['rework_needed'] ? '是' : '否') : '',
        $row['notes'] ?? '',
        $row['created_at'] ?? '',
    ]);
}

fclose($handle);
exit;
