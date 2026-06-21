<?php
/**
 * 出貨品項 API - 列表
 *
 * 跨出貨單查詢所有出貨品項明細。
 *
 * @endpoint GET /api/shipping_order_items
 *
 * @auth 必須登入
 *
 * @table shipping_order_items  主表
 * @table shipping_orders       關聯 - 出貨單
 * @table inventory_items       關聯 - 庫存品項
 * @table customers             關聯 - 客戶
 *
 * @input GET 參數:
 * | 參數              | 類型   | 必填 | 預設            | 說明                |
 * |-------------------|--------|-----|-----------------|--------------------|
 * | keyword           | string | 否  |                 | 搜尋庫存編號/產品/出貨單號 |
 * | customer_id       | int    | 否  |                 | 客戶 ID            |
 * | inventory_item_id | int    | 否  |                 | 庫存品項 ID        |
 * | shipping_order_id | int    | 否  |                 | 出貨單 ID          |
 * | status            | string | 否  |                 | 出貨狀態           |
 * | start_date        | date   | 否  |                 | 出貨日期起          |
 * | end_date          | date   | 否  |                 | 出貨日期迄          |
 * | page              | int    | 否  | 1               | 頁碼              |
 * | perPage           | int    | 否  | 20              | 每頁筆數 (1-100)   |
 * | sortField         | string | 否  | soi.created_at  | 排序欄位           |
 * | sortDirection     | string | 否  | DESC            | ASC/DESC           |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "shipping_order_number": "SO-20250115-0001",
 *     "inventory_number": "INV-20250115-0001",
 *     "shipped_quantity": 5000,
 *     "shipped_unit": "支"
 *   }],
 *   "pagination": {"page": 1, "perPage": 20, "total": 100}
 * }
 * ```
 */
declare(strict_types=1);

/**
 * 出貨品項查詢 API
 * GET /api/shipping_order_items/index.php
 *
 * 用於跨出貨單查詢所有出貨品項明細
 */

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

requireMethod('GET');

$pdo = db();

// Pagination
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int)($_GET['perPage'] ?? 20)));
$offset = ($page - 1) * $perPage;

// Filters
$keyword = trim($_GET['keyword'] ?? '');
$customerId = $_GET['customer_id'] ?? '';
$inventoryItemId = $_GET['inventory_item_id'] ?? '';
$shippingOrderId = $_GET['shipping_order_id'] ?? '';
$status = $_GET['status'] ?? '';
$startDate = $_GET['start_date'] ?? '';
$endDate = $_GET['end_date'] ?? '';

// Sorting
$sortField = $_GET['sortField'] ?? 'soi.created_at';
$sortDirection = strtoupper($_GET['sortDirection'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$allowedSortFields = [
    'soi.id', 'soi.created_at', 'soi.shipped_quantity',
    'so.shipping_order_number', 'so.shipping_date', 'so.status',
    'ii.inventory_number', 'c.name'
];
if (!in_array($sortField, $allowedSortFields)) {
    $sortField = 'soi.created_at';
}

// Build query
$where = ['so.deleted_at IS NULL'];
$params = [];

if ($keyword) {
    $where[] = "(ii.inventory_number LIKE :keyword OR si.name LIKE :keyword2 OR so.shipping_order_number LIKE :keyword3)";
    $params['keyword'] = "%{$keyword}%";
    $params['keyword2'] = "%{$keyword}%";
    $params['keyword3'] = "%{$keyword}%";
}

if ($customerId) {
    $where[] = "so.customer_id = :customer_id";
    $params['customer_id'] = $customerId;
}

if ($inventoryItemId !== '') {
    $where[] = "soi.inventory_item_id = :inventory_item_id";
    $params['inventory_item_id'] = $inventoryItemId;
}

if ($shippingOrderId) {
    $where[] = "soi.shipping_order_id = :shipping_order_id";
    $params['shipping_order_id'] = $shippingOrderId;
}

if ($status) {
    $where[] = "so.status = :status";
    $params['status'] = $status;
}

if ($startDate) {
    $where[] = "so.shipping_date >= :start_date";
    $params['start_date'] = $startDate;
}

if ($endDate) {
    $where[] = "so.shipping_date <= :end_date";
    $params['end_date'] = $endDate;
}

$whereClause = implode(' AND ', $where);

// Count total
$countSql = "
    SELECT COUNT(*)
    FROM shipping_order_items soi
    JOIN shipping_orders so ON soi.shipping_order_id = so.id
    LEFT JOIN inventory_items ii ON soi.inventory_item_id = ii.id
    LEFT JOIN screening_items si ON ii.screening_item_id = si.id
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = ceil($total / $perPage);

// Fetch data
$sql = "
    SELECT
        soi.id,
        soi.shipping_order_id,
        soi.order_item_id,
        soi.inventory_item_id,
        soi.shipped_quantity,
        soi.shipped_unit,
        soi.created_at,
        so.shipping_order_number,
        so.shipping_date,
        so.status AS order_status,
        so.customer_id,
        c.name AS customer_name,
        c.customer_number,
        ii.inventory_number,
        ii.receipt_type,
        ii.net_weight_kg,
        wopr.receipt_number AS partial_receipt_number,
        wopr.shipping_tool_details AS partial_receipt_shipping_tool_details,
        CASE
            WHEN wopr.id IS NULL THEN NULL
            WHEN wopr.machine_run_id IS NULL THEN '一般工單'
            WHEN COALESCE(wopr_run.run_label, '') <> '' THEN wopr_run.run_label
            WHEN COALESCE(wopr_machine.name, '') <> '' THEN wopr_machine.name
            ELSE '拆分機台'
        END AS partial_receipt_source_label,
        si.name AS screening_item_name,
        si.item_number AS product_number
    FROM shipping_order_items soi
    JOIN shipping_orders so ON soi.shipping_order_id = so.id
    LEFT JOIN inventory_items ii ON soi.inventory_item_id = ii.id
    LEFT JOIN work_order_partial_receipts wopr ON wopr.inventory_item_id = ii.id
    LEFT JOIN work_order_machine_runs wopr_run ON wopr_run.id = wopr.machine_run_id
    LEFT JOIN machines wopr_machine ON wopr_machine.id = wopr_run.machine_id
    LEFT JOIN screening_items si ON ii.screening_item_id = si.id
    LEFT JOIN customers c ON so.customer_id = c.id
    WHERE {$whereClause}
    ORDER BY {$sortField} {$sortDirection}
    LIMIT :limit OFFSET :offset
";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate totals
$totalsSql = "
    SELECT
        COUNT(*) as total_items,
        SUM(soi.shipped_quantity) as total_quantity
    FROM shipping_order_items soi
    JOIN shipping_orders so ON soi.shipping_order_id = so.id
    LEFT JOIN inventory_items ii ON soi.inventory_item_id = ii.id
    WHERE {$whereClause}
";
$totalsStmt = $pdo->prepare($totalsSql);
$totalsStmt->execute($params);
$totals = $totalsStmt->fetch(PDO::FETCH_ASSOC);

jsonResponse([
    'success' => true,
    'data' => $items,
    'pagination' => [
        'page' => $page,
        'perPage' => $perPage,
        'total' => $total,
        'totalPages' => $totalPages
    ],
    'totals' => [
        'total_items' => (int)($totals['total_items'] ?? 0),
        'total_quantity' => (float)($totals['total_quantity'] ?? 0)
    ]
]);
