<?php
/**
 * 退貨單 API - 列表與新增
 *
 * @endpoint GET  /api/return_orders/index.php  取得列表
 * @endpoint POST /api/return_orders/index.php  新增退貨單
 *
 * @auth 必須登入
 * @table return_orders, return_order_items, customers, shipping_orders
 *
 * ========================================
 * GET - 取得列表
 * ========================================
 *
 * @input Query Parameters:
 * | 參數名稱      | 類型   | 必填 | 預設值 | 說明                          |
 * |--------------|--------|------|--------|-------------------------------|
 * | page         | int    | 否   | 1      | 頁碼，從 1 開始                |
 * | perPage      | int    | 否   | 20     | 每頁筆數，最大 100             |
 * | keyword      | string | 否   | ''     | 關鍵字搜尋（退貨單號、客戶名稱）|
 * | customer_id  | int    | 否   |        | 依客戶篩選                    |
 * | original_shipping_order_id | int | 否 |      | 依原出貨單篩選                |
 * | status       | string | 否   |        | 依處理狀態篩選                |
 * | start_date   | date   | 否   |        | 退貨日期起                    |
 * | end_date     | date   | 否   |        | 退貨日期迄                    |
 * | sortField    | string | 否   | 'id'   | 排序欄位                       |
 * | sortDirection| string | 否   | 'desc' | 排序方向：asc / desc           |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [...],
 *     "pagination": {...}
 * }
 *
 * ========================================
 * POST - 新增退貨單
 * ========================================
 *
 * @input Body Parameters (JSON):
 * | 參數名稱                  | 類型   | 必填 | 說明                |
 * |--------------------------|--------|------|---------------------|
 * | customer_id              | int    | 是   | 客戶 ID             |
 * | original_shipping_order_id| int   | 否   | 原出貨單 ID         |
 * | return_date              | date   | 是   | 退貨日期            |
 * | return_reason            | string | 否   | 退貨原因            |
 * | notes                    | string | 否   | 備註                |
 * | items                    | array  | 否   | 退貨品項            |
 * | items[].shipping_order_item_id | int | 否 | 出貨單品項 ID     |
 * | items[].returned_quantity | number | 否 | 退貨數量           |
 * | items[].returned_unit     | string | 否 | 退貨單位           |
 * | items[].reason            | string | 否 | 退貨原因           |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "退貨單已新增。",
 *     "data": { "id": 123 }
 * }
 *
 * @error 400 參數驗證失敗
 * @error 401 未登入
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../return_order_items/helpers.php';

$currentEmployee = requireAuth();
$pdo = db();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleList($pdo);
        break;
    case 'POST':
        handleCreate($pdo, $currentEmployee);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * 處理列表查詢
 */
function handleList(PDO $pdo): void
{
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 20)));
    $offset = ($page - 1) * $perPage;

    $keyword = trim($_GET['keyword'] ?? '');
    $customerId = $_GET['customer_id'] ?? '';
    $originalShippingOrderId = $_GET['original_shipping_order_id'] ?? '';
    $status = trim($_GET['status'] ?? '');
    $startDate = $_GET['start_date'] ?? '';
    $endDate = $_GET['end_date'] ?? '';

    $sortField = $_GET['sortField'] ?? 'id';
    $sortDirection = strtoupper($_GET['sortDirection'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';

    // 欄位名稱對應表（允許前端用簡短名稱）
    $sortFieldMap = [
        'id' => 'ro.id',
        'return_order_number' => 'ro.return_order_number',
        'return_date' => 'ro.return_date',
        'created_at' => 'ro.created_at',
        'customer_name' => 'c.name',
        'shipping_order_number' => 'so.shipping_order_number',
        'processing_status' => 'ro.processing_status',
    ];

    $sortField = $sortFieldMap[$sortField] ?? 'ro.id';

    $where = ['ro.deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $where[] = '(ro.return_order_number LIKE :kw OR c.name LIKE :kw2)';
        $params['kw'] = "%{$keyword}%";
        $params['kw2'] = "%{$keyword}%";
    }

    if ($customerId !== '') {
        $where[] = 'ro.customer_id = :customer_id';
        $params['customer_id'] = (int)$customerId;
    }

    if ($originalShippingOrderId !== '') {
        $where[] = 'ro.original_shipping_order_id = :original_shipping_order_id';
        $params['original_shipping_order_id'] = (int)$originalShippingOrderId;
    }

    if ($status !== '') {
        $where[] = 'ro.processing_status = :status';
        $params['status'] = $status;
    }

    if ($startDate !== '') {
        $where[] = 'ro.return_date >= :start_date';
        $params['start_date'] = $startDate;
    }

    if ($endDate !== '') {
        $where[] = 'ro.return_date <= :end_date';
        $params['end_date'] = $endDate;
    }

    $whereClause = implode(' AND ', $where);

    // 計算總數
    $countSql = "
        SELECT COUNT(*)
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.id
        WHERE {$whereClause}
    ";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // 查詢資料
    $sql = "
        SELECT
            ro.*,
            c.name AS customer_name,
            c.customer_number,
            so.shipping_order_number,
            lv.value_label AS status_label,
            (SELECT COUNT(*) FROM return_order_items WHERE return_order_id = ro.id) AS item_count,
            (SELECT COALESCE(SUM(returned_quantity), 0) FROM return_order_items WHERE return_order_id = ro.id) AS total_quantity
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.id
        LEFT JOIN shipping_orders so ON ro.original_shipping_order_id = so.id
        LEFT JOIN lookup_values lv ON ro.status_lookup_id = lv.id
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

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ]);
}

/**
 * 處理新增退貨單
 */
function handleCreate(PDO $pdo, array $currentEmployee): void
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
    }

    // 驗證資料
    $errors = validateReturnOrderData($input);
    if (!empty($errors)) {
        jsonResponse(['success' => false, 'message' => implode(' ', $errors)], 400);
    }

    // 驗證客戶存在
    $customerStmt = $pdo->prepare("SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL");
    $customerStmt->execute([$input['customer_id']]);
    if (!$customerStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '客戶不存在。'], 400);
    }

    // 驗證原出貨單（如果有提供）
    if (!empty($input['original_shipping_order_id'])) {
        $soStmt = $pdo->prepare("SELECT id, customer_id, status FROM shipping_orders WHERE id = ? AND deleted_at IS NULL");
        $soStmt->execute([$input['original_shipping_order_id']]);
        $sourceShippingOrder = $soStmt->fetch(PDO::FETCH_ASSOC);
        if (!$sourceShippingOrder) {
            jsonResponse(['success' => false, 'message' => '原出貨單不存在。'], 400);
        }
        if (!in_array((string)$sourceShippingOrder['status'], ['shipped', 'delivered'], true)) {
            jsonResponse(['success' => false, 'message' => '只有已出貨或已送達的出貨單可以建立退貨單。'], 409);
        }
        if ((int)$sourceShippingOrder['customer_id'] !== (int)$input['customer_id']) {
            jsonResponse(['success' => false, 'message' => '退貨單客戶與原出貨單客戶不一致。'], 409);
        }
    }

    $pdo->beginTransaction();

    try {
        if (!empty($input['original_shipping_order_id'])) {
            $shippingLockStmt = $pdo->prepare("
                SELECT customer_id, status
                FROM shipping_orders
                WHERE id = ? AND deleted_at IS NULL
                FOR UPDATE
            ");
            $shippingLockStmt->execute([(int)$input['original_shipping_order_id']]);
            $lockedShippingOrder = $shippingLockStmt->fetch(PDO::FETCH_ASSOC);
            if (
                !$lockedShippingOrder
                || !in_array((string)$lockedShippingOrder['status'], ['shipped', 'delivered'], true)
                || (int)$lockedShippingOrder['customer_id'] !== (int)$input['customer_id']
            ) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '原出貨單狀態或客戶已變更，無法建立退貨單。'], 409);
            }
        }

        $returnOrderNumber = generateReturnOrderNumber($pdo);

        $stmt = $pdo->prepare("
            INSERT INTO return_orders (
                return_order_number, customer_id, original_shipping_order_id,
                return_date, return_reason, processing_status, notes, created_at
            ) VALUES (
                :return_order_number, :customer_id, :original_shipping_order_id,
                :return_date, :return_reason, :processing_status, :notes, NOW()
            )
        ");

        $stmt->execute([
            'return_order_number' => $returnOrderNumber,
            'customer_id' => $input['customer_id'],
            'original_shipping_order_id' => $input['original_shipping_order_id'] ?? null,
            'return_date' => $input['return_date'],
            'return_reason' => $input['return_reason'] ?? null,
            'processing_status' => 'pending',
            'notes' => $input['notes'] ?? null,
        ]);
        $id = (int)$pdo->lastInsertId();

        // 如果有品項資料，一併新增
        if (!empty($input['items']) && is_array($input['items'])) {
            $itemStmt = $pdo->prepare("
                INSERT INTO return_order_items (
                    return_order_id, shipping_order_item_id, returned_quantity, returned_unit, reason
                ) VALUES (
                    :return_order_id, :shipping_order_item_id, :returned_quantity, :returned_unit, :reason
                )
            ");

            foreach ($input['items'] as $item) {
                $itemValidation = validateReturnOrderItemData([
                    'return_order_id' => $id,
                    'shipping_order_item_id' => $item['shipping_order_item_id'] ?? null,
                    'returned_quantity' => $item['returned_quantity'] ?? null,
                    'returned_unit' => $item['returned_unit'] ?? null,
                    'reason' => $item['reason'] ?? null,
                ]);
                if ($itemValidation['errors'] !== []) {
                    $pdo->rollBack();
                    jsonResponse([
                        'success' => false,
                        'message' => implode('；', array_values($itemValidation['errors'])),
                        'errors' => $itemValidation['errors'],
                    ], 422);
                }

                $itemData = $itemValidation['data'];
                $business = validateReturnOrderItemBusinessRules(
                    $pdo,
                    $id,
                    (int)$itemData['shipping_order_item_id'],
                    (float)$itemData['returned_quantity']
                );
                if ($business['errors'] !== []) {
                    $pdo->rollBack();
                    jsonResponse([
                        'success' => false,
                        'message' => implode('；', array_values($business['errors'])),
                        'errors' => $business['errors'],
                    ], 409);
                }

                $itemStmt->execute([
                    'return_order_id' => $id,
                    'shipping_order_item_id' => $itemData['shipping_order_item_id'],
                    'returned_quantity' => $itemData['returned_quantity'],
                    'returned_unit' => $itemData['returned_unit'],
                    'reason' => $itemData['reason'] ?? null,
                ]);
                $itemId = (int)$pdo->lastInsertId();
                recordReturnOrderItemInventorySource($pdo, $itemId, $business['source'] ?? []);
            }

            recalculateShippingOrderReturnStatus($pdo, (int)$input['original_shipping_order_id']);
        }

        $pdo->commit();

        logAuditAction('新增退貨單', 'ReturnOrders', $id, [
            'return_order_number' => $returnOrderNumber,
            'customer_id' => $input['customer_id'],
        ]);

        jsonResponse([
            'success' => true,
            'message' => '退貨單已新增。',
            'data' => [
                'id' => $id,
                'return_order_number' => $returnOrderNumber,
            ],
        ], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Return order create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增退貨單失敗，請稍後重試。')], 500);
    }
}
