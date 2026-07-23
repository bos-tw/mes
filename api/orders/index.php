<?php
/**
 * 訂單管理 API - 列表與新增
 *
 * @endpoint GET  /api/orders/index.php     取得訂單列表
 * @endpoint POST /api/orders/index.php     新增訂單
 *
 * @auth 需要登入
 * @table orders
 * @related customers, lookup_values
 *
 * ========================================
 * GET - 取得訂單列表
 * ========================================
 *
 * 取得訂單列表，支援分頁、關鍵字搜尋、客戶篩選、狀態篩選、日期範圍篩選。
 * 僅回傳未刪除的訂單 (deleted_at IS NULL)。
 *
 * @input Query Parameters:
 * | 參數名稱       | 類型   | 必填 | 預設值 | 說明                                          |
 * |---------------|--------|------|--------|----------------------------------------------|
 * | page          | int    | 否   | 1      | 頁碼，從 1 開始                               |
 * | perPage       | int    | 否   | 10     | 每頁筆數，範圍 1-100                          |
 * | keyword       | string | 否   | ''     | 關鍵字搜尋（模糊比對：訂單號碼、客戶名稱、客戶PO號）|
 * | customer_id   | int    | 否   | -      | 客戶 ID 篩選                                 |
 * | status        | string | 否   | ''     | 訂單狀態篩選（pending/confirmed/completed/cancelled）|
 * | start_date    | string | 否   | ''     | 訂單日期起始 (YYYY-MM-DD)                     |
 * | end_date      | string | 否   | ''     | 訂單日期結束 (YYYY-MM-DD)                     |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [
 *         {
 *             "id": 1,
 *             "order_number": "ORDER-20240101-0001",
 *             "customer": {
 *                 "id": 1,
 *                 "name": "測試客戶",
 *                 "customer_number": "C001"
 *             },
 *             "order_date": "2024-01-01",
 *             "expected_delivery_date": "2024-01-15",
 *             "customer_po_number": "PO-2024-001",
 *             "status": "pending",
 *             "status_label": "待處理",
 *             "total_amount": 15000.00,
 *             "notes": "備註內容",
 *             "created_at": "2024-01-01 12:00:00",
 *             "updated_at": "2024-01-02 15:30:00",
 *             "deleted_at": null
 *         }
 *     ],
 *     "pagination": {
 *         "page": 1,
 *         "perPage": 10,
 *         "total": 42,
 *         "totalPages": 5
 *     }
 * }
 *
 * ========================================
 * POST - 新增訂單
 * ========================================
 *
 * 新增一筆訂單資料。訂單號碼由系統自動產生，格式為 ORDER-YYYYMMDD-NNNN。
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱               | 類型   | 必填 | 驗證規則                 | 說明                  |
 * |------------------------|--------|------|--------------------------|----------------------|
 * | customer_id            | int    | 是   | > 0，客戶必須存在         | 客戶 ID              |
 * | order_date             | string | 是   | YYYY-MM-DD 格式          | 訂單日期              |
 * | expected_delivery_date | string | 否   | YYYY-MM-DD 格式          | 預訂交期              |
 * | expected_delivery_period | string | 否 | morning/noon/afternoon/evening | 預訂交期時段       |
 * | customer_po_number     | string | 否   | 最大 100 字             | 客戶訂單號（客戶PO號） |
 * | status                 | string | 否   | 最大 50 字，預設 pending | 訂單狀態              |
 * | total_amount           | float  | 否   | >= 0，預設 0             | 訂單總金額            |
 * | notes                  | string | 否   | -                        | 備註                  |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "訂單建立成功。",
 *     "data": { ...完整訂單資料... }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                              |
 * |------------|------------------|--------------------------------------|
 * | 401        | 未登入           | "尚未登入或登入已過期。"               |
 * | 405        | 不支援的 HTTP 方法 | "不支援的請求方法。"                 |
 * | 409        | 資料重複/參照限制  | "資料重覆或違反參照限制..."         |
 * | 422        | 欄位驗證失敗      | "欄位驗證失敗。"                   |
 * | 422        | 客戶不存在        | "指定的客戶不存在。"                 |
 * | 500        | 訂單號碼產生失敗   | "訂單號碼生成失敗..."               |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListOrders();
        break;
    case 'POST':
        handleCreateOrder();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 處理 GET 請求 - 取得訂單列表
 *
 * 查詢訂單資料並支援以下功能：
 * - 分頁：透過 page 和 perPage 參數控制
 * - 關鍵字搜尋：比對訂單號碼、客戶名稱、客戶PO號
 * - 客戶篩選：依客戶 ID 過濾
 * - 狀態篩選：依訂單狀態過濾
 * - 日期範圍：依訂單日期過濾
 *
 * @return void 直接輸出 JSON 回應
 */
function handleListOrders(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

        $totalItems = 0;

    // 關鍵字搜尋（訂單號碼、客戶名稱、客戶訂單號碼）
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $customerId = $_GET['customer_id'] ?? null;
    $status = trim((string)($_GET['status'] ?? ''));
    $startDate = trim((string)($_GET['start_date'] ?? ''));
    $endDate = trim((string)($_GET['end_date'] ?? ''));

    $conditions = ['o.deleted_at IS NULL'];
    $params = [];

    // 關鍵字搜尋（訂單號碼、客戶名稱、客戶PO號）
    if ($keyword !== '') {
        $conditions[] = '(
            o.order_number LIKE :keyword_order_number
            OR c.name LIKE :keyword_customer_name
            OR o.customer_po_number LIKE :keyword_customer_po
        )';
        $keywordWildcard = '%' . $keyword . '%';
        $params['keyword_order_number'] = $keywordWildcard;
        $params['keyword_customer_name'] = $keywordWildcard;
        $params['keyword_customer_po'] = $keywordWildcard;
    }

    // 客戶篩選
    if ($customerId !== null && $customerId !== '') {
        $customerIdInt = filter_var($customerId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($customerIdInt !== false) {
            $conditions[] = 'o.customer_id = :customer_id';
            $params['customer_id'] = $customerIdInt;
        }
    }

    // 狀態篩選
    if ($status !== '') {
        $conditions[] = 'o.status = :status';
        $params['status'] = $status;
    }

    // 日期範圍篩選
    if ($startDate !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $startDate);
        if ($date && $date->format('Y-m-d') === $startDate) {
            $conditions[] = 'o.order_date >= :start_date';
            $params['start_date'] = $startDate;
        }
    }

    if ($endDate !== '') {
        $date = DateTime::createFromFormat('Y-m-d', $endDate);
        if ($date && $date->format('Y-m-d') === $endDate) {
            $conditions[] = 'o.order_date <= :end_date';
            $params['end_date'] = $endDate;
        }
    }

    $where = implode(' AND ', $conditions);

    // 計算總數
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;

    // 查詢資料
    $sql = 'SELECT o.id, o.order_number, o.customer_id, o.order_date, o.expected_delivery_date, o.expected_delivery_period, '
        . 'o.customer_po_number, o.status, o.total_amount, o.final_quote_per_m, o.single_ppm, o.notes, o.created_at, o.updated_at, o.deleted_at, '
        . 'c.name AS customer_name, c.customer_number, c.is_active AS customer_is_active, '
        . 'c.minimum_order_amount AS customer_minimum_order_amount, '
        . 'lv.value_label AS status_label '
        . 'FROM orders o '
        . 'LEFT JOIN customers c ON o.customer_id = c.id '
        . 'LEFT JOIN lookup_values lv ON o.status = lv.value_key AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = "status_order") '
        . "WHERE $where ORDER BY o.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $orders = array_map(static fn(array $row): array => transformOrder($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $orders,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

/**
 * 處理 POST 請求 - 新增訂單
 *
 * 新增訂單的流程：
 * 1. 讀取並驗證輸入資料
 * 2. 檢查客戶是否存在
 * 3. 自動產生訂單號碼 (ORDER-YYYYMMDD-NNNN)
 * 4. 寫入資料庫
 * 5. 記錄稽核日誌
 *
 * @return void 直接輸出 JSON 回應
 */
function handleCreateOrder(): void
{
    $pdo = db();
    $payload = readOrderPayload();

    $validated = validateOrderData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查客戶是否存在
    if (isset($data['customer_id']) && !customerExists($pdo, $data['customer_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '指定的客戶不存在。',
            'errors' => ['customer_id' => '指定的客戶不存在。'],
        ], 422);
    }

    // 自動生成訂單號碼
    try {
        $orderDate = $data['order_date'] ?? date('Y-m-d');
        $data['order_number'] = generateOrderNumber($pdo, $orderDate);
    } catch (RuntimeException $e) {
        error_log('Order number generation failed: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => safeErrorMessage($e, '訂單號碼產生失敗，請稍後重試。'),
        ], 500);
    }

    // 設定預設值
    if (!isset($data['status'])) {
        $data['status'] = 'pending';
    }
    try {
        $data['status_lookup_id'] = getOrderStatusLookupId($pdo, (string)$data['status']);
    } catch (RuntimeException $e) {
        error_log('Order status lookup resolution failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '訂單狀態設定不存在，請聯繫管理員。'], 500);
    }
    if (!isset($data['total_amount'])) {
        $data['total_amount'] = 0.00;
    }

    $columns = array_keys($data);
    $placeholders = array_map(static fn(string $col): string => ':' . $col, $columns);

    $sql = 'INSERT INTO orders (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($sql);
        foreach ($data as $column => $value) {
            if ($value === null) {
                $stmt->bindValue(':' . $column, null, PDO::PARAM_NULL);
            } else {
                $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindValue(':' . $column, $value, $paramType);
            }
        }
        $stmt->execute();

        // 記錄操作日誌
        $newId = (int)$pdo->lastInsertId();
        logAuditAction('新增訂單', 'Orders', $newId, $data);

    } catch (PDOException $exception) {
        handleOrderPdoWriteException($exception);
    }

    $order = findOrder($pdo, $newId);

    jsonResponse([
        'success' => true,
        'message' => '訂單建立成功。',
        'data' => $order ? transformOrder($order) : null,
    ], 201);
}
