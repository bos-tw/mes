<?php
/**
 * 客戶管理 API - 匯出 CSV
 *
 * @endpoint GET /api/customers/export.php
 *
 * @auth 需要登入
 * @table customers
 *
 * 匯出客戶資料為 CSV 檔案，支援關鍵字篩選。
 * 檔案編碼為 UTF-8 with BOM，可直接用 Excel 開啟。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型   | 必填 | 預設值 | 說明                                       |
 * |---------|--------|------|--------|-------------------------------------------|
 * | keyword | string | 否   | ''     | 關鍵字搜尋（模糊比對：編號、名稱、統編等多欄位）|
 *
 * @output 成功回應:
 * - Content-Type: text/csv; charset=utf-8
 * - Content-Disposition: attachment; filename="customers_20240101120000.csv"
 * - 檔案內容：UTF-8 BOM + CSV 格式資料
 *
 * @output CSV 欄位:
 * | 欄位順序 | 欄位名稱           | 說明         |
 * |---------|-------------------|--------------|
 * | 1       | ID                | 客戶 ID      |
 * | 2       | 客戶編號          | customer_number |
 * | 3       | 客戶名稱          | name         |
 * | 4       | 商品別            | product_category |
 * | 5       | 公司網址          | website      |
 * | 6       | 傳真              | fax          |
 * | 7       | 發票抬頭          | invoice_title |
 * | 8       | 公司登記住址       | company_registered_address |
 * | 9       | 聯絡人            | contact_person |
 * | 10      | 聯絡電話          | phone        |
 * | 11      | 電子郵件          | email        |
 * | 12      | 公司地址          | address      |
 * | 13      | 發票寄送地址       | invoice_address |
 * | 14      | 收/送貨地址       | shipping_address |
 * | 15      | 業務聯絡人        | sales_contact_person |
 * | 16      | 業務聯絡人分機     | sales_contact_extension |
 * | 17      | 業務聯絡人手機     | sales_contact_mobile |
 * | 18      | 業務聯絡人 Email  | sales_contact_email |
 * | 19      | 財務聯絡人        | finance_contact_person |
 * | 20      | 財務聯絡人分機     | finance_contact_extension |
 * | 21      | 財務聯絡人手機     | finance_contact_mobile |
 * | 22      | 財務聯絡人 Email  | finance_contact_email |
 * | 23      | 結帳日            | billing_day (顯示為 "X日") |
 * | 24      | 對帳日            | reconciliation_day (顯示為 "X日") |
 * | 25      | 付款方式          | payment_method |
 * | 26      | 統一編號          | tax_id       |
 * | 27      | 發票印章附件路徑   | invoice_attachment_path |
 * | 28      | 備註              | notes        |
 * | 29      | 建立時間          | created_at   |
 * | 30      | 更新時間          | updated_at   |
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | 說明                    |
 * |------------|------------------|------------------------|
 * | 401        | 未登入           | 重導向至登入頁面         |
 * | 405        | 不支援的 HTTP 方法 | 僅支援 GET              |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

// 只支援 GET 請求
requireMethod('GET');

$pdo = db();

$keyword = trim((string)($_GET['keyword'] ?? ''));

$conditions = ['c.deleted_at IS NULL'];
$params = [];

if ($keyword !== '') {
    $searchableColumns = [
        'customer_number',
        'name',
        'product_category',
        'website',
        'fax',
        'invoice_title',
        'company_registered_address',
        'contact_person',
        'phone',
        'email',
        'address',
        'invoice_address',
        'shipping_address',
        'sales_contact_person',
        'sales_contact_extension',
        'sales_contact_mobile',
        'sales_contact_email',
        'finance_contact_person',
        'finance_contact_extension',
        'finance_contact_mobile',
        'finance_contact_email',
        'tax_id',
        'notes',
    ];

    $likeParts = [];
    foreach ($searchableColumns as $index => $column) {
        $paramName = 'keyword_' . $index;
        $likeParts[] = sprintf('c.%s LIKE :%s', $column, $paramName);
        $params[$paramName] = '%' . $keyword . '%';
    }

    if ($likeParts !== []) {
        $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
    }
}

$where = implode(' AND ', $conditions);

$sql = "
    SELECT
        c.id,
        c.customer_number,
        c.name,
        c.product_category,
        c.website,
        c.fax,
        c.invoice_title,
        c.company_registered_address,
        c.contact_person,
        c.phone,
        c.email,
        c.address,
        c.invoice_address,
        c.shipping_address,
        c.sales_contact_person,
        c.sales_contact_extension,
        c.sales_contact_mobile,
        c.sales_contact_email,
        c.finance_contact_person,
        c.finance_contact_extension,
        c.finance_contact_mobile,
        c.finance_contact_email,
        c.billing_day,
        c.reconciliation_day,
        c.payment_method,
        c.tax_id,
        c.invoice_attachment_path,
        c.notes,
        c.created_at,
        c.updated_at
    FROM customers c
";

if ($where !== '') {
    $sql .= " WHERE " . $where;
}

$sql .= " ORDER BY c.id DESC";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
}
$stmt->execute();

$customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// 產生 CSV 內容
$output = fopen('php://temp', 'r+');

// UTF-8 BOM for Excel
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

// CSV 標題
$headers = [
    'ID',
    '客戶編號',
    '客戶名稱',
    '商品別',
    '公司網址',
    '傳真',
    '發票抬頭',
    '公司登記住址',
    '聯絡人',
    '聯絡電話',
    '電子郵件',
    '公司地址',
    '發票寄送地址',
    '收/送貨地址',
    '業務聯絡人',
    '業務聯絡人分機',
    '業務聯絡人手機',
    '業務聯絡人 Email',
    '財務聯絡人',
    '財務聯絡人分機',
    '財務聯絡人手機',
    '財務聯絡人 Email',
    '結帳日',
    '對帳日',
    '付款方式',
    '統一編號',
    '發票印章附件路徑',
    '備註',
    '建立時間',
    '更新時間',
];

fputcsv($output, $headers);

// CSV 資料
foreach ($customers as $customer) {
    $row = [
        $customer['id'],
        $customer['customer_number'],
        $customer['name'],
        $customer['product_category'],
        $customer['website'],
        $customer['fax'],
        $customer['invoice_title'],
        $customer['company_registered_address'],
        $customer['contact_person'],
        $customer['phone'],
        $customer['email'],
        $customer['address'],
        $customer['invoice_address'],
        $customer['shipping_address'],
        $customer['sales_contact_person'],
        $customer['sales_contact_extension'],
        $customer['sales_contact_mobile'],
        $customer['sales_contact_email'],
        $customer['finance_contact_person'],
        $customer['finance_contact_extension'],
        $customer['finance_contact_mobile'],
        $customer['finance_contact_email'],
        $customer['billing_day'] ? $customer['billing_day'] . '日' : '',
        $customer['reconciliation_day'] ? $customer['reconciliation_day'] . '日' : '',
        $customer['payment_method'],
        $customer['tax_id'],
        $customer['invoice_attachment_path'],
        $customer['notes'],
        $customer['created_at'],
        $customer['updated_at'],
    ];

    fputcsv($output, $row);
}

rewind($output);
$csv = stream_get_contents($output);
fclose($output);

// 設定 HTTP 標頭
$timestamp = date('YmdHis');
$filename = 'customers_' . $timestamp . '.csv';
$displayName = '客戶資料_' . $timestamp . '.csv';

// 使用 RFC 2231 編碼處理中文檔名
$encodedFilename = "=?UTF-8?B?" . base64_encode($displayName) . "?=";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"; filename*=UTF-8\'\'' . rawurlencode($displayName));
header('Content-Length: ' . strlen($csv));
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

echo $csv;
exit;
