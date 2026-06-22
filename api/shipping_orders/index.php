<?php
/**
 * 出貨單 API - 列表與新增
 *
 * 管理出貨單，包含取貨人、物流、狀態等資訊。
 *
 * @endpoint GET  /api/shipping_orders  取得出貨單列表
 * @endpoint POST /api/shipping_orders  建立新出貨單
 *
 * @auth 必須登入
 *
 * @table shipping_orders       主表
 * @table shipping_order_items  關聯 - 出貨項目
 * @table customers             關聯 - 客戶
 * @table orders                關聯 - 訂單
 *
 * @input GET 參數:
 * | 參數          | 類型   | 必填 | 預設 | 說明                    |
 * |---------------|--------|-----|------|-----------------------|
 * | keyword       | string | 否  |      | 搜尋出貨單號/客戶/取貨人   |
 * | customer_id   | int    | 否  |      | 客戶 ID               |
 * | status        | string | 否  |      | 出貨狀態               |
 * | start_date    | date   | 否  |      | 出貨日期起             |
 * | end_date      | date   | 否  |      | 出貨日期迄             |
 * | page          | int    | 否  | 1    | 頁碼                  |
 * | perPage       | int    | 否  | 20   | 每頁筆數              |
 * | sortField     | string | 否  | id   | 排序欄位              |
 * | sortDirection | string | 否  | DESC | ASC/DESC              |
 *
 * @input POST JSON:
 * | 參數              | 類型   | 必填 | 說明              |
 * |-------------------|--------|-----|-----------------|
 * | customer_id       | int    | 是  | 客戶 ID          |
 * | order_id          | int    | 否  | 訂單 ID          |
 * | shipping_date     | date   | 否  | 出貨日期          |
 * | consignee_name    | string | 否  | 取貨人姓名        |
 * | consignee_address | string | 否  | 取貨地址          |
 *
 * @output 成功 (GET):
 * ```json
 * {
 *   "success": true,
 *   "data": [{...}],
 *   "pagination": {"page": 1, "perPage": 20, "total": 50}
 * }
 * ```
 */
declare(strict_types=1);

/**
 * Shipping Orders API - List and Create
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../number_sequences/helpers.php';
require_once __DIR__ . '/helpers.php';
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleList();
        break;
    case 'POST':
        handleCreate();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * List shipping orders with pagination and filters
 */
function handleList(): void
{
    $pdo = db();

    // Pagination
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 20)));
    $offset = ($page - 1) * $perPage;

    // Filters
    $keyword = trim($_GET['keyword'] ?? '');
    $customerId = $_GET['customer_id'] ?? '';
    $status = $_GET['status'] ?? '';
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';

    // Sorting
    $sortField = $_GET['sortField'] ?? 'id';
    $sortDirection = strtoupper($_GET['sortDirection'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

    $allowedSortFields = ['id', 'shipping_order_number', 'customer_name', 'shipping_date', 'status', 'created_at'];
    if (!in_array($sortField, $allowedSortFields)) {
        $sortField = 'id';
    }

    // Build query
    $conditions = ['so.deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(so.shipping_order_number LIKE :keyword OR c.name LIKE :keyword OR so.consignee_name LIKE :keyword)';
        $params['keyword'] = "%{$keyword}%";
    }

    if ($customerId !== '') {
        $conditions[] = 'so.customer_id = :customer_id';
        $params['customer_id'] = $customerId;
    }

    if ($status !== '') {
        $conditions[] = 'so.status = :status';
        $params['status'] = $status;
    }

    if ($startDate !== '') {
        $conditions[] = 'so.shipping_date >= :start_date';
        $params['start_date'] = $startDate;
    }

    if ($endDate !== '') {
        $conditions[] = 'so.shipping_date <= :end_date';
        $params['end_date'] = $endDate;
    }

    $whereClause = implode(' AND ', $conditions);

    // Count total
    $countSql = "
        SELECT COUNT(*)
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE {$whereClause}
    ";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Sort field mapping
    $sortMap = [
        'customer_name' => 'c.name',
    ];
    $actualSortField = $sortMap[$sortField] ?? "so.{$sortField}";

    // Fetch data
    $sql = "
        SELECT
            so.id,
            so.shipping_order_number,
            so.order_id,
            so.customer_id,
            so.shipping_date,
            so.delivery_method,
            so.tracking_number,
            so.consignee_name,
            so.consignee_address,
            so.status,
            so.notes,
            so.created_at,
            so.updated_at,
            c.name AS customer_name,
            o.order_number,
            lv.value_label AS status_label,
            (SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS item_count,
            (SELECT SUM(soi.shipped_quantity) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS total_quantity
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN orders o ON so.order_id = o.id
        LEFT JOIN lookup_values lv ON so.status = lv.value_key
            AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'shipping_status')
        WHERE {$whereClause}
        ORDER BY {$actualSortField} {$sortDirection}
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(":{$key}", $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $rows,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ]);
}

/**
 * Create a new shipping order
 */
function handleCreate(): void
{
    $pdo = db();
    $payload = readShippingOrderPayload();

    if (!$payload) {
        jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
    }

    $validation = validateShippingOrderData($payload, false);
    if (!empty($validation['errors'])) {
        jsonResponse([
            'success' => false,
            'message' => implode('；', array_values($validation['errors'])),
            'errors' => $validation['errors'],
        ], 400);
    }

    $defectSummaryResult = normalizeShippingOrderDefectSummary($payload);
    $toolSummaryResult = normalizeShippingOrderToolSummaries($payload['tool_summaries'] ?? []);
    $businessRuleErrors = validateShippingPhase1BusinessRules(
        (string)($validation['data']['shipment_purpose'] ?? 'normal'),
        $defectSummaryResult['summary']
    );
    $allErrors = $defectSummaryResult['errors'] + $toolSummaryResult['errors'] + $businessRuleErrors;
    if (!empty($allErrors)) {
        jsonResponse([
            'success' => false,
            'message' => implode('；', array_values($allErrors)),
            'errors' => $allErrors,
        ], 400);
    }

    $data = $validation['data'];
    $customerId = (int)$data['customer_id'];
    $shippingDate = (string)($data['shipping_date'] ?? date('Y-m-d'));
    $deliveryMethod = $data['delivery_method'] ?? null;
    $consigneeName = $data['consignee_name'] ?? null;
    $consigneeAddress = $data['consignee_address'] ?? null;
    $carrier = $data['carrier'] ?? null;
    $trackingNumber = $data['tracking_number'] ?? null;
    $status = (string)($data['status'] ?? 'draft');
    $notes = $data['notes'] ?? null;
    $orderId = $data['order_id'] ?? null;
    $shipmentPurpose = (string)($data['shipment_purpose'] ?? 'normal');

    try {
        $pdo->beginTransaction();

        // Generate shipping order number
        $shippingOrderNumber = generateShippingOrderNumber($pdo);

        // Insert shipping order
        $sql = "
            INSERT INTO shipping_orders (
                id, shipping_order_number, customer_id, order_id, shipping_date,
                delivery_method, consignee_name, consignee_address, carrier,
                tracking_number, shipment_purpose, status, notes
            ) VALUES (
                :id, :shipping_order_number, :customer_id, :order_id, :shipping_date,
                :delivery_method, :consignee_name, :consignee_address, :carrier,
                :tracking_number, :shipment_purpose, :status, :notes
            )
        ";

        $id = generateId();
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $id,
            'shipping_order_number' => $shippingOrderNumber,
            'customer_id' => $customerId,
            'order_id' => $orderId,
            'shipping_date' => $shippingDate,
            'delivery_method' => $deliveryMethod,
            'consignee_name' => $consigneeName,
            'consignee_address' => $consigneeAddress,
            'carrier' => $carrier,
            'tracking_number' => $trackingNumber,
            'shipment_purpose' => $shipmentPurpose,
            'status' => $status,
            'notes' => $notes,
        ]);

        saveShippingOrderDefectSummary($pdo, $id, $defectSummaryResult['summary']);
        replaceShippingOrderToolSummaries($pdo, $id, $toolSummaryResult['summaries']);

        $pdo->commit();

        // Fetch the created record
        $record = findShippingOrder($pdo, $id);
        if ($record) {
            $record = transformShippingOrder($record);
            $record['defect_summary'] = fetchShippingOrderDefectSummary($pdo, $id);
            $record['tool_summaries'] = fetchShippingOrderToolSummaries($pdo, $id);
        }

        jsonResponse([
            'success' => true,
            'message' => '出貨單建立成功。',
            'data' => $record,
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Create shipping order error: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '建立出貨單失敗，請稍後重試。')], 500);
    }
}

/**
 * Generate shipping order number
 */
function generateShippingOrderNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'SO');
}

/**
 * Generate unique ID (simplified snowflake-like)
 */
function generateId(): int
{
    return (int)(microtime(true) * 10000) + random_int(0, 9999);
}
