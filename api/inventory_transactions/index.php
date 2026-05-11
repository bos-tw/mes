<?php
/**
 * 庫存異動 API - 列表
 *
 * 查詢庫存品項的所有異動記錄，包含入庫、出庫、調整等。
 *
 * @endpoint GET /api/inventory_transactions
 *
 * @auth 必須登入
 *
 * @table inventory_transactions  主表 - 庫存異動記錄
 * @table inventory_items         關聯 - 庫存品項
 * @table orders                  關聯 - 訂單
 * @table work_orders             關聯 - 工單
 *
 * @input GET 參數:
 * | 參數              | 類型   | 必填 | 預設          | 說明                    |
 * |-------------------|--------|-----|---------------|------------------------|
 * | keyword           | string | 否  |               | 搜尋庫存編號/訂單號/工單號 |
 * | direction         | string | 否  |               | in/out                |
 * | ref_type          | string | 否  |               | 參考類型               |
 * | inventory_item_id | int    | 否  |               | 庫存品項 ID           |
 * | start_date        | date   | 否  |               | 異動日期起             |
 * | end_date          | date   | 否  |               | 異動日期迄             |
 * | page              | int    | 否  | 1             | 頁碼                  |
 * | perPage           | int    | 否  | 20            | 每頁筆數 (1-100)      |
 * | sortField         | string | 否  | it.created_at | 排序欄位              |
 * | sortDirection     | string | 否  | DESC          | ASC/DESC              |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "inventory_number": "INV-20250115-0001",
 *     "direction": "in",
 *     "quantity": 12500,
 *     "ref_type": "production",
 *     "created_at": "2025-01-15T10:00:00"
 *   }],
 *   "pagination": {"page": 1, "perPage": 20, "total": 100}
 * }
 * ```
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

$method = requireMethod('GET');

switch ($method) {
    case 'GET':
        handleListInventoryTransactions();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * GET — 取得庫存異動列表
 */
function handleListInventoryTransactions(): void
{
    $pdo = db();

// Pagination
$page = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(100, max(1, (int)($_GET['perPage'] ?? 20)));
$offset = ($page - 1) * $perPage;

// Filters
$keyword = trim($_GET['keyword'] ?? '');
$direction = trim($_GET['direction'] ?? '');
$refType = trim($_GET['ref_type'] ?? '');
$inventoryItemId = $_GET['inventory_item_id'] ?? '';
$startDate = $_GET['start_date'] ?? '';
$endDate = $_GET['end_date'] ?? '';

// Sorting
$sortField = $_GET['sortField'] ?? 'it.created_at';
$sortDirection = strtoupper($_GET['sortDirection'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
$allowedSortFields = [
    'it.id', 'it.created_at', 'it.quantity', 'it.after_quantity', 'ii.inventory_number', 'o.order_number', 'wo.work_order_number'
];
if (!in_array($sortField, $allowedSortFields, true)) {
    $sortField = 'it.created_at';
}

$where = ['1=1'];
$params = [];

if ($keyword !== '') {
    $where[] = '(
        ii.inventory_number LIKE :kw
        OR it.ref_type LIKE :kw2
        OR o.order_number LIKE :kw3
        OR wo.work_order_number LIKE :kw4
        OR oi.customer_batch_number LIKE :kw5
    )';
    $params['kw'] = "%{$keyword}%";
    $params['kw2'] = "%{$keyword}%";
    $params['kw3'] = "%{$keyword}%";
    $params['kw4'] = "%{$keyword}%";
    $params['kw5'] = "%{$keyword}%";
}

if ($direction !== '') {
    $where[] = 'it.direction = :direction';
    $params['direction'] = $direction;
}

if ($refType !== '') {
    $where[] = 'it.ref_type = :ref_type';
    $params['ref_type'] = $refType;
}

if ($inventoryItemId !== '') {
    $where[] = 'it.inventory_item_id = :inventory_item_id';
    $params['inventory_item_id'] = $inventoryItemId;
}

if ($startDate) {
    $where[] = 'it.created_at >= :start_date';
    $params['start_date'] = $startDate . ' 00:00:00';
}

if ($endDate) {
    $where[] = 'it.created_at <= :end_date';
    $params['end_date'] = $endDate . ' 23:59:59';
}

$whereClause = implode(' AND ', $where);

// Count total
$countSql = "
    SELECT COUNT(*)
    FROM inventory_transactions it
    JOIN inventory_items ii ON it.inventory_item_id = ii.id
    LEFT JOIN customers c ON ii.customer_id = c.id
    LEFT JOIN orders o ON it.order_id = o.id
    LEFT JOIN order_items oi ON it.order_item_id = oi.id
    LEFT JOIN work_orders wo ON it.work_order_id = wo.id
    WHERE {$whereClause}
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();
$totalPages = (int)ceil($total / $perPage);

// Fetch data
$sql = "
    SELECT
        it.id,
        it.inventory_item_id,
        it.ref_type,
        it.ref_id,
        it.order_id,
        it.order_item_id,
        it.work_order_id,
        it.direction,
        it.direction_lookup_id,
        it.quantity,
        it.after_quantity,
        it.notes,
        it.created_at,
        it.created_by_employee_id,
        ii.inventory_number,
        ii.customer_batch_number,
        ii.quality_status,
        c.name AS customer_name,
        si.name AS screening_item_name,
        si.item_number AS product_number,
        o.order_number,
        oi.customer_batch_number AS order_item_batch_number,
        wo.work_order_number,
        lv.value_label AS direction_label,
        e.name AS created_by_employee_name
    FROM inventory_transactions it
    JOIN inventory_items ii ON it.inventory_item_id = ii.id
    LEFT JOIN customers c ON ii.customer_id = c.id
    LEFT JOIN screening_items si ON ii.screening_item_id = si.id
    LEFT JOIN orders o ON it.order_id = o.id
    LEFT JOIN order_items oi ON it.order_item_id = oi.id
    LEFT JOIN work_orders wo ON it.work_order_id = wo.id
    LEFT JOIN lookup_values lv ON it.direction_lookup_id = lv.id
    LEFT JOIN employees e ON it.created_by_employee_id = e.id
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

// Totals
$totalsSql = "
    SELECT
        COUNT(*) AS total_items,
        SUM(CASE WHEN direction = 'inbound' THEN quantity ELSE 0 END) AS inbound_quantity,
        SUM(CASE WHEN direction = 'outbound' THEN quantity ELSE 0 END) AS outbound_quantity,
        SUM(CASE WHEN direction = 'adjustment' THEN quantity ELSE 0 END) AS adjustment_quantity,
        SUM(
            CASE
                WHEN direction = 'inbound' THEN quantity
                WHEN direction = 'outbound' THEN -quantity
                ELSE quantity
            END
        ) AS net_quantity
    FROM inventory_transactions it
    JOIN inventory_items ii ON it.inventory_item_id = ii.id
    LEFT JOIN orders o ON it.order_id = o.id
    LEFT JOIN order_items oi ON it.order_item_id = oi.id
    LEFT JOIN work_orders wo ON it.work_order_id = wo.id
    WHERE {$whereClause}
";
$totalsStmt = $pdo->prepare($totalsSql);
$totalsStmt->execute($params);
$totals = $totalsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

// Cast numeric fields
foreach ($items as &$row) {
    if (isset($row['quantity'])) {
        $row['quantity'] = (float)$row['quantity'];
    }
    if (isset($row['after_quantity'])) {
        $row['after_quantity'] = (float)$row['after_quantity'];
    }
    if (empty($row['direction_label'])) {
        switch ($row['direction'] ?? '') {
            case 'inbound':
                $row['direction_label'] = '入庫';
                break;
            case 'outbound':
                $row['direction_label'] = '出庫';
                break;
            case 'adjustment':
                $row['direction_label'] = '調整';
                break;
            default:
                $row['direction_label'] = $row['direction'] ?? '';
        }
    }
}
unset($row);

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
        'inbound_quantity' => (float)($totals['inbound_quantity'] ?? 0),
        'outbound_quantity' => (float)($totals['outbound_quantity'] ?? 0),
        'adjustment_quantity' => (float)($totals['adjustment_quantity'] ?? 0),
        'net_quantity' => (float)($totals['net_quantity'] ?? 0),
    ]
]);
}
