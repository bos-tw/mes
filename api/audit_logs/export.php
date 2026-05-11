<?php
/**
 * 稽核日誌 API - 匯出端點
 *
 * 提供稽核日誌的 CSV 匯出功能。
 *
 * @endpoint GET /api/audit_logs/export.php
 *
 * @auth 必須登入
 * @table audit_logs, employees
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | keyword       | string | N    | 關鍵字搜尋（動作、目標表、IP）|
 * | sortField     | string | N    | 排序欄位 |
 * | sortDirection | string | N    | 排序方向（asc/desc）|
 * | limit         | int    | N    | 匯出筆數限制，預設 5000，最大 50000 |
 *
 * @output CSV 檔案下載
 * Content-Type: text/csv; charset=utf-8
 *
 * @error 405 不支援的請求方法
 *
 * @note 匯出檔案名稱格式：audit_logs_{YYYYMMDD_HHMMSS}.csv
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

const AUDIT_LOGS_EXPORT_DEFAULT_LIMIT = 5000;
const AUDIT_LOGS_EXPORT_MAX_LIMIT = 50000;

requireAuth();
requireMethod('GET');

$pdo = db();

$keyword = trim((string)($_GET['keyword'] ?? ''));
$conditions = [];
$params = [];

$sortableColumns = [
    'id' => 'al.id',
    'action' => 'al.action',
    'target_table' => 'al.target_table',
    'target_id' => 'al.target_id',
    'ip_address' => 'al.ip_address',
    'created_at' => 'al.created_at',
    'employee_name' => 'e.name',
    'employee_account' => 'e.account',
];

$requestedSortField = (string)($_GET['sortField'] ?? 'created_at');
if (!array_key_exists($requestedSortField, $sortableColumns)) {
    $requestedSortField = 'created_at';
}

$requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'desc'));
if (!in_array($requestedSortDirection, ['asc', 'desc'], true)) {
    $requestedSortDirection = 'desc';
}

$orderColumn = $sortableColumns[$requestedSortField];
$orderDirection = strtoupper($requestedSortDirection);
$orderBySql = sprintf('%s %s', $orderColumn, $orderDirection);
if ($orderColumn !== 'al.id') {
    $orderBySql .= ', al.id DESC';
}

if ($keyword !== '') {
    $searchableColumns = [
        'action',
        'target_table',
        'ip_address',
    ];

    $likeParts = [];
    foreach ($searchableColumns as $index => $column) {
        $paramName = 'keyword_' . $index;
        $likeParts[] = sprintf('al.%s LIKE :%s', $column, $paramName);
        $params[$paramName] = '%' . $keyword . '%';
    }

    if ($likeParts !== []) {
        $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
    }
}

$where = implode(' AND ', $conditions);

$requestedLimit = isset($_GET['limit']) ? (int)$_GET['limit'] : AUDIT_LOGS_EXPORT_DEFAULT_LIMIT;
if ($requestedLimit <= 0) {
    $requestedLimit = AUDIT_LOGS_EXPORT_DEFAULT_LIMIT;
}
$limit = min($requestedLimit, AUDIT_LOGS_EXPORT_MAX_LIMIT);

$sql = '
    SELECT
        al.id,
        al.employee_id,
        al.action,
        al.target_table,
        al.target_id,
        al.details,
        al.ip_address,
        al.created_at,
        e.name AS employee_name,
        e.account AS employee_account
    FROM audit_logs al
    LEFT JOIN employees e ON e.id = al.employee_id';

if ($where !== '') {
    $sql .= ' WHERE ' . $where;
}

$sql .= ' ORDER BY ' . $orderBySql . ' LIMIT :limit';

$stmt = $pdo->prepare($sql);

foreach ($params as $key => $value) {
    $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll();
$logs = array_map(static fn(array $row): array => transformAuditLog($row), $rows ?: []);

$filenameTimestamp = (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Ymd_His');
$filename = sprintf('audit_logs_%s.csv', $filenameTimestamp);

header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

echo "\xEF\xBB\xBF"; // UTF-8 BOM for Excel compatibility

$handle = fopen('php://output', 'wb');
if ($handle === false) {
    // Fallback to simple echo if we cannot open the stream
    foreach ($logs as $log) {
        echo implode(',', [
            $log['id'],
            $log['employee']['name'] ?? '',
            $log['employee']['account'] ?? '',
            $log['action'],
            $log['target_table'] ?? '',
            $log['target_id'] ?? '',
            $log['ip_address'] ?? '',
            $log['created_at'],
            str_replace(["\r", "\n"], ' ', (string)($log['details'] ?? '')),
        ]) . "\r\n";
    }
    exit;
}

$headerRow = [
    'ID',
    '員工姓名',
    '員工帳號',
    '動作',
    '目標資料表',
    '目標ID',
    'IP位址',
    '建立時間',
    '詳細資料',
];
fputcsv($handle, $headerRow);

foreach ($logs as $log) {
    $detail = $log['details'] ?? '';
    if (is_string($detail)) {
        $detail = str_replace(["\r\n", "\r", "\n"], ' ', $detail);
    }

    $row = [
        $log['id'],
        $log['employee']['name'] ?? '',
        $log['employee']['account'] ?? '',
        $log['action'],
        $log['target_table'] ?? '',
        $log['target_id'] ?? '',
        $log['ip_address'] ?? '',
        $log['created_at'],
        $detail,
    ];

    fputcsv($handle, $row);
}

fclose($handle);
exit;
