<?php
/**
 * 工單管理 API - 搜尋訂單品項
 *
 * 用於建立工單時搜尋可關聯的訂單品項。
 *
 * @endpoint GET /api/work_orders/search_order_items.php
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數       | 類型   | 必填 | 說明                              |
 * |------------|--------|-----|-----------------------------------|
 * | keyword    | string | 否  | 搜尋訂單號/明細編號/客戶PO/客戶批號/圖面編號/客戶名 |
 * | start_date | date   | 否  | 訂單日期起                          |
 * | end_date   | date   | 否  | 訂單日期迄                          |
 *
 * @note 若無任何搜尋條件則回傳空陣列，避免列出所有資料
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "order_id": 10,
 *     "order_number": "ORDER-20250115-0001",
 *     "customer_batch_number": "BATCH-001",
 *     "customer_name": "測試客戶",
 *     "screening_item_name": "M3x10",
 *     "total_units": 12500,
 *     "total_weight_kg": 50.00
 *   }]
 * }
 * ```
 *
 * @limit 最多回傳 50 筆
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$pdo = db();

$keyword = trim((string)($_GET['keyword'] ?? ''));
$startDate = trim((string)($_GET['start_date'] ?? ''));
$endDate = trim((string)($_GET['end_date'] ?? ''));
$excludeHasWorkOrder = (string)($_GET['exclude_has_work_order'] ?? '') === '1';

// 如果沒有任何搜尋條件，回傳空陣列 (避免列出所有資料)
if ($keyword === '' && $startDate === '' && $endDate === '') {
    jsonResponse([
        'success' => true,
        'data' => [],
    ]);
}

$conditions = ['o.deleted_at IS NULL', 'oi.deleted_at IS NULL'];
$params = [];

if ($keyword !== '') {
    $conditions[] = '(
        o.order_number LIKE :keyword
        OR oi.order_item_number LIKE :keyword
        OR o.customer_po_number LIKE :keyword
        OR oi.customer_batch_number LIKE :keyword
        OR oi.drawing_number LIKE :keyword
        OR oi.sub_item_number LIKE :keyword
        OR oi.part_number LIKE :keyword
        OR c.name LIKE :keyword
    )';
    $params['keyword'] = '%' . $keyword . '%';
}

if ($startDate !== '') {
    $conditions[] = 'o.order_date >= :start_date';
    $params['start_date'] = $startDate;
}

if ($endDate !== '') {
    $conditions[] = 'o.order_date <= :end_date';
    $params['end_date'] = $endDate;
}

if ($excludeHasWorkOrder) {
    $conditions[] = 'NOT EXISTS (SELECT 1 FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL)';
}

$where = implode(' AND ', $conditions);

$sql = "
    SELECT
        oi.id,
        oi.order_id,
        oi.order_item_number,
        oi.customer_batch_number,
        oi.sub_item_number,
        oi.part_number,
        oi.drawing_number,
        oi.total_units,
        oi.total_weight_kg,
        o.order_number,
        o.customer_po_number,
        o.order_date,
        o.expected_delivery_date,
        c.id AS customer_id,
        c.name AS customer_name,
        si.name AS screening_item_name,
        si.item_number AS screening_item_number
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN screening_items si ON oi.screening_item_id = si.id
    WHERE $where
    ORDER BY o.order_date DESC, o.order_number DESC
    LIMIT 50
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 格式化回傳資料
    $data = array_map(function($row) {
        return [
            'id' => (int)$row['id'],
            'order_id' => (int)$row['order_id'],
            'customer_id' => (int)$row['customer_id'],
            'customer_name' => $row['customer_name'],
            'order_number' => $row['order_number'],
            'order_item_number' => $row['order_item_number'],
            'customer_po_number' => $row['customer_po_number'],
            'customer_batch_number' => $row['customer_batch_number'],
            'sub_item_number' => $row['sub_item_number'],
            'part_number' => $row['part_number'],
            'drawing_number' => $row['drawing_number'],
            'screening_item_name' => $row['screening_item_name'],
            'screening_item_number' => $row['screening_item_number'],
            'order_date' => $row['order_date'],
            'expected_delivery_date' => $row['expected_delivery_date'],
            'total_units' => (float)$row['total_units'],
            'total_weight_kg' => (float)$row['total_weight_kg'],
            'display_label' => sprintf(
                '%s / %s - %s (客戶批號: %s)',
                $row['order_item_number'] ?? '-',
                $row['order_number'],
                $row['customer_name'],
                $row['customer_batch_number'] ?? '無'
            )
        ];
    }, $rows);

    jsonResponse([
        'success' => true,
        'data' => $data,
    ]);

} catch (PDOException $e) {
    error_log('Work order search order items failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '搜尋失敗，請稍後重試。'),
    ], 500);
}
