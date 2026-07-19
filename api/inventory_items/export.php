<?php
/**
 * 庫存品項 API - CSV 匯出
 *
 * 匯出庫存品項清單為 CSV 檔案，支援與列表頁相同的篩選條件。
 *
 * @endpoint GET /api/inventory_items/export.php
 *
 * @auth 必須登入
 * @table inventory_items, customers, screening_items, work_orders, orders
 *
 * @input GET 參數（同 index.php 篩選條件）:
 * | 參數              | 類型   | 必填 | 說明                    |
 * |-------------------|--------|-----|------------------------|
 * | keyword           | string | 否  | 搜尋庫存編號/工單號/客戶批號 |
 * | customer_id       | int    | 否  | 客戶 ID                |
 * | screening_item_id | int    | 否  | 受篩產品 ID             |
 * | status            | string | 否  | 庫存狀態                |
 * | quality_status    | string | 否  | 品質狀態                |
 * | start_date        | date   | 否  | 入庫日期起              |
 * | end_date          | date   | 否  | 入庫日期迄              |
 *
 * @output CSV 檔案下載
 * - Content-Type: text/csv; charset=utf-8
 * - 編碼: UTF-8 with BOM（可直接用 Excel 開啟）
 * - 檔名: inventory_items_{YYYYMMDD_HHmmss}.csv
 *
 * @columns CSV 欄位:
 * | 欄位名稱       | 說明                    |
 * |---------------|------------------------|
 * | 庫存ID         | inventory_items.id     |
 * | 庫存編號       | inventory_number        |
 * | 受篩產品       | screening_item_name     |
 * | 工單號         | work_order_number       |
 * | 訂單明細       | order_item_number      |
 * | 訂單號         | order_number            |
 * | 客戶名稱       | customer_name           |
 * | 客戶批號       | customer_batch_number   |
 * | 內部批號       | internal_lot_number     |
 * | 良品總支數     | total_good_units        |
 * | 不良品支數     | total_defect_units      |
 * | 現有庫存       | quantity_on_hand        |
 * | 已分配數量     | quantity_allocated      |
 * | 淨重(kg)      | net_weight_kg           |
 * | 總重(kg)      | gross_weight_kg         |
 * | 品質狀態       | quality_status          |
 * | 庫存狀態       | status                  |
 * | 倉位           | warehouse_location      |
 * | 入庫時間       | received_at             |
 * | 建立時間       | created_at              |
 *
 * @error 405 不支援的請求方法
 * @note 最多匯出 50,000 筆
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('GET');

const INVENTORY_EXPORT_MAX_LIMIT = 50000;

$pdo = db();

$filters = [
    'keyword'           => trim((string)($_GET['keyword'] ?? '')),
    'customer_id'       => (string)($_GET['customer_id'] ?? ''),
    'screening_item_id' => (string)($_GET['screening_item_id'] ?? ''),
    'status'            => (string)($_GET['status'] ?? ''),
    'quality_status'    => (string)($_GET['quality_status'] ?? ''),
    'start_date'        => (string)($_GET['start_date'] ?? ''),
    'end_date'          => (string)($_GET['end_date'] ?? ''),
];

$whereData    = buildInventoryWhereClause($filters);
$whereClause  = implode(' AND ', $whereData['where']);
$params       = $whereData['params'];

$sql = "
    SELECT
        ii.id,
        ii.inventory_number,
        si.name                     AS screening_item_name,
        wo.work_order_number,
        oi.order_item_number,
        o.order_number,
        c.name                      AS customer_name,
        ii.customer_batch_number,
        ii.internal_lot_number,
        ii.total_good_units,
        ii.total_defect_units,
        ii.quantity_on_hand,
        ii.quantity_allocated,
        ii.net_weight_kg,
        ii.gross_weight_kg,
        ii.quality_status,
        ii.status,
        ii.warehouse_location,
        ii.received_at,
        ii.created_at
    FROM inventory_items ii
    LEFT JOIN customers       c  ON ii.customer_id       = c.id
    LEFT JOIN screening_items si ON ii.screening_item_id = si.id
    LEFT JOIN work_orders     wo ON ii.work_order_id      = wo.id
    LEFT JOIN orders          o  ON ii.order_id           = o.id
    LEFT JOIN order_items     oi ON ii.order_item_id      = oi.id
    WHERE {$whereClause}
    ORDER BY ii.id DESC
    LIMIT :limit
";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
}
$stmt->bindValue(':limit', INVENTORY_EXPORT_MAX_LIMIT, PDO::PARAM_INT);
$stmt->execute();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$timestamp = (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Ymd_His');
$filename  = sprintf('inventory_items_%s.csv', $timestamp);

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
    '庫存ID',
    '庫存編號',
    '受篩產品',
    '工單號',
    '訂單明細',
    '訂單號',
    '客戶名稱',
    '客戶批號',
    '內部批號',
    '良品總支數',
    '不良品支數',
    '現有庫存',
    '已分配數量',
    '淨重(kg)',
    '總重(kg)',
    '品質狀態',
    '庫存狀態',
    '倉位',
    '入庫時間',
    '建立時間',
]);

foreach ($rows as $row) {
    fputcsv($handle, [
        $row['id'],
        $row['inventory_number'],
        $row['screening_item_name'] ?? '',
        $row['work_order_number'] ?? '',
        $row['order_item_number'] ?? '',
        $row['order_number'] ?? '',
        $row['customer_name'] ?? '',
        $row['customer_batch_number'] ?? '',
        $row['internal_lot_number'] ?? '',
        $row['total_good_units'] ?? '',
        $row['total_defect_units'] ?? '',
        $row['quantity_on_hand'] ?? '',
        $row['quantity_allocated'] ?? '',
        $row['net_weight_kg'] ?? '',
        $row['gross_weight_kg'] ?? '',
        $row['quality_status'] ?? '',
        $row['status'] ?? '',
        $row['warehouse_location'] ?? '',
        $row['received_at'] ?? '',
        $row['created_at'] ?? '',
    ]);
}

fclose($handle);
exit;
