<?php
/**
 * 客戶管理 API - 列表與新增
 *
 * @endpoint GET  /api/customers/index.php     取得客戶列表
 * @endpoint POST /api/customers/index.php     新增客戶
 *
 * @auth 需要登入
 * @table customers
 *
 * ========================================
 * GET - 取得客戶列表
 * ========================================
 *
 * 取得客戶列表，支援分頁、排序、關鍵字搜尋。
 * 僅回傳未刪除的客戶 (deleted_at IS NULL)。
 *
 * @input Query Parameters:
 * | 參數名稱       | 類型   | 必填 | 預設值            | 說明                                       |
 * |---------------|--------|------|------------------|-------------------------------------------|
 * | page          | int    | 否   | 1                | 頁碼，從 1 開始                             |
 * | perPage       | int    | 否   | 10               | 每頁筆數，範圍 1-100                        |
 * | keyword       | string | 否   | ''               | 關鍵字搜尋（模糊比對：編號、名稱、統編等多欄位）|
 * | sortField     | string | 否   | 'customer_number'| 排序欄位（見下方可用值）                     |
 * | sortDirection | string | 否   | 'asc'            | 排序方向：asc / desc                        |
 *
 * @input sortField 可用值:
 * - customer_number: 客戶編號
 * - name: 客戶名稱
 * - product_category: 產品類別
 * - contact_person: 聯絡人
 * - phone: 電話
 * - email: Email
 * - tax_id: 統一編號
 * - created_at: 建立時間
 * - updated_at: 更新時間
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [
 *         {
 *             "id": 1,
 *             "customer_number": "C001",
 *             "name": "測試客戶",
 *             "product_category": "螺絲",
 *             "website": "https://example.com",
 *             "fax": "02-12345678",
 *             "invoice_title": "測試公司",
 *             "company_registered_address": "台北市...",
 *             "contact_person": "王小明",
 *             "phone": "02-12345678",
 *             "email": "test@example.com",
 *             "address": "台北市...",
 *             "invoice_address": "台北市...",
 *             "shipping_address": "台北市...",
 *             "sales_contact_person": "業務王",
 *             "sales_contact_extension": "101",
 *             "sales_contact_mobile": "0912345678",
 *             "sales_contact_email": "sales@example.com",
 *             "finance_contact_person": "會計李",
 *             "finance_contact_extension": "102",
 *             "finance_contact_mobile": "0923456789",
 *             "finance_contact_email": "finance@example.com",
 *             "billing_day": 25,
 *             "reconciliation_day": 5,
 *             "payment_method": "月結30天",
 *             "tax_id": "12345678",
 *             "invoice_attachment_path": "uploads/invoice_stamps/xxx.jpg",
 *             "notes": "備註內容",
 *             "is_active": 1,
 *             "created_at": "2024-01-01 12:00:00",
 *             "updated_at": "2024-01-02 15:30:00"
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
 * POST - 新增客戶
 * ========================================
 *
 * 新增一筆客戶資料。客戶編號必須唯一。
 * 支援上傳發票印章圖片（JPG/PNG/GIF，最大 5MB）。
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱                   | 類型   | 必填 | 驗證規則                        | 說明           |
 * |---------------------------|--------|------|--------------------------------|----------------|
 * | customer_number           | string | 是   | 非空，最大 50 字，唯一           | 客戶編號       |
 * | name                      | string | 是   | 非空，最大 255 字               | 客戶名稱       |
 * | product_category          | string | 否   | 最大 100 字                     | 產品類別       |
 * | website                   | string | 否   | 有效 URL 格式，最大 255 字       | 公司網址       |
 * | fax                       | string | 否   | 最大 50 字                      | 傳真           |
 * | invoice_title             | string | 否   | 最大 255 字                     | 發票抬頭       |
 * | company_registered_address| string | 否   | -                              | 公司登記地址    |
 * | contact_person            | string | 否   | 最大 100 字                     | 聯絡人         |
 * | phone                     | string | 否   | 數字/括號/連字號，最大 50 字     | 電話           |
 * | email                     | string | 否   | 有效 Email 格式，最大 100 字     | Email          |
 * | address                   | string | 否   | -                              | 地址           |
 * | invoice_address           | string | 否   | -                              | 發票地址       |
 * | shipping_address          | string | 否   | -                              | 送貨地址       |
 * | sales_contact_person      | string | 否   | 最大 100 字                     | 業務聯絡人     |
 * | sales_contact_extension   | string | 否   | 最大 20 字                      | 業務分機       |
 * | sales_contact_mobile      | string | 否   | 數字格式，最大 50 字             | 業務手機       |
 * | sales_contact_email       | string | 否   | 有效 Email 格式，最大 255 字     | 業務 Email     |
 * | finance_contact_person    | string | 否   | 最大 100 字                     | 財務聯絡人     |
 * | finance_contact_extension | string | 否   | 最大 20 字                      | 財務分機       |
 * | finance_contact_mobile    | string | 否   | 數字格式，最大 50 字             | 財務手機       |
 * | finance_contact_email     | string | 否   | 有效 Email 格式，最大 255 字     | 財務 Email     |
 * | billing_day               | int    | 否   | 1-31                           | 結帳日         |
 * | reconciliation_day        | int    | 否   | 1-31                           | 對帳日         |
 * | payment_method            | string | 否   | 最大 100 字                     | 付款方式       |
 * | tax_id                    | string | 否   | 8 位數字                        | 統一編號       |
 * | notes                     | string | 否   | -                              | 備註           |
 * | is_active                 | int    | 否   | 0 或 1，預設 1                  | 是否啟用       |
 * | invoice_stamp_file        | file   | 否   | JPG/PNG/GIF，最大 5MB           | 發票印章圖片    |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "客戶資料已新增。",
 *     "data": { "id": 123 }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                        | 備註                     |
 * |------------|------------------|--------------------------------|-------------------------|
 * | 400        | 缺少必填欄位      | "資料驗證失敗。"                | errors 物件含欄位錯誤訊息  |
 * | 401        | 未登入           | "尚未登入或登入已過期。"         |                         |
 * | 405        | 不支援的 HTTP 方法 | "不支援的請求方法。"            |                         |
 * | 409        | 客戶編號重複      | "客戶編號已存在,請使用其他編號。" | field: 'customer_number' |
 * | 422        | 附件上傳失敗      | "附件上傳失敗。"                | errors 物件含詳細錯誤     |
 * | 500        | 資料庫錯誤        | "新增客戶資料失敗，請稍後再試。"  |                         |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListCustomers();
        break;
    case 'POST':
        handleCreateCustomer();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 處理 GET 請求 - 取得客戶列表
 *
 * 查詢客戶資料並支援以下功能：
 * - 分頁：透過 page 和 perPage 參數控制
 * - 排序：透過 sortField 和 sortDirection 參數控制
 * - 搜尋：透過 keyword 參數對多欄位進行模糊比對
 *
 * @return void 直接輸出 JSON 回應
 */
function handleListCustomers(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['c.deleted_at IS NULL'];
    $params = [];

    $sortableColumns = [
        'id' => 'c.id',
        'customer_number' => 'c.customer_number',
        'name' => 'c.name',
        'product_category' => 'c.product_category',
        'website' => 'c.website',
        'fax' => 'c.fax',
        'invoice_title' => 'c.invoice_title',
        'company_registered_address' => 'c.company_registered_address',
        'contact_person' => 'c.contact_person',
        'phone' => 'c.phone',
        'email' => 'c.email',
        'address' => 'c.address',
        'invoice_address' => 'c.invoice_address',
        'shipping_address' => 'c.shipping_address',
        'sales_contact_person' => 'c.sales_contact_person',
        'sales_contact_extension' => 'c.sales_contact_extension',
        'sales_contact_mobile' => 'c.sales_contact_mobile',
        'sales_contact_email' => 'c.sales_contact_email',
        'finance_contact_person' => 'c.finance_contact_person',
        'finance_contact_extension' => 'c.finance_contact_extension',
        'finance_contact_mobile' => 'c.finance_contact_mobile',
        'finance_contact_email' => 'c.finance_contact_email',
        'billing_day' => 'c.billing_day',
        'reconciliation_day' => 'c.reconciliation_day',
        'payment_method' => 'c.payment_method',
        'tax_id' => 'c.tax_id',
        'invoice_attachment_path' => 'c.invoice_attachment_path',
        'notes' => 'c.notes',
        'created_at' => 'c.created_at',
        'updated_at' => 'c.updated_at',
    ];

    $requestedSortField = trim((string)($_GET['sortField'] ?? ''));
    $requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'asc'));

    $sortColumn = $sortableColumns[$requestedSortField] ?? $sortableColumns['customer_number'];
    $sortDirection = $requestedSortDirection === 'asc' ? 'ASC' : 'DESC';

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

    $countSql = "SELECT COUNT(*) FROM customers c";
    if ($where !== '') {
        $countSql .= " WHERE " . $where;
    }
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));

    $offset = ($page - 1) * $perPage;

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
            c.minimum_order_amount,
            c.weight_tolerance_percentage,
            c.is_active,
            c.created_at,
            c.updated_at
        FROM customers c";

    if ($where !== '') {
        $sql .= " WHERE " . $where;
    }

    $sql .= " ORDER BY " . $sortColumn . " " . $sortDirection . ", c.id ASC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $stmt->execute();

    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $customers,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

/**
 * 處理 POST 請求 - 新增客戶
 *
 * 新增客戶的流程：
 * 1. 讀取並驗證輸入資料
 * 2. 處理發票印章附件上傳（如有）
 * 3. 檢查客戶編號是否重複
 * 4. 寫入資料庫
 * 5. 記錄稽核日誌
 *
 * @return void 直接輸出 JSON 回應
 */
function handleCreateCustomer(): void
{
    $pdo = db();

    $payload = readCustomerPayload();
    $removeAttachment = filter_var((string)($payload['remove_invoice_attachment'] ?? '0'), FILTER_VALIDATE_BOOLEAN);
    unset($payload['remove_invoice_attachment'], $payload['_method']);

    $validation = validateCustomerData($payload);

    if (!empty($validation['errors'])) {
        jsonResponse([
            'success' => false,
            'message' => '資料驗證失敗。',
            'errors' => $validation['errors'],
        ], 400);
        return;
    }

    $data = $validation['data'];

    $uploadResult = processInvoiceStampUpload('invoice_stamp_file', $removeAttachment, $data['invoice_attachment_path'] ?? null);
    if ($uploadResult['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '附件上傳失敗。',
            'errors' => $uploadResult['errors'],
        ], 422);
        return;
    }

    $data['invoice_attachment_path'] = $uploadResult['path'];

    // Check for duplicate customer_number
    $stmt = $pdo->prepare('SELECT id FROM customers WHERE customer_number = :customer_number AND deleted_at IS NULL');
    $stmt->execute(['customer_number' => $data['customer_number']]);
    if ($stmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '客戶編號已存在,請使用其他編號。',
            'errors' => ['customer_number' => '此客戶編號已被使用'],
            'field' => 'customer_number',
        ], 409);
        return;
    }

    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare('
            INSERT INTO customers (
                customer_number, name, product_category, website, fax, invoice_title,
                company_registered_address, contact_person, phone, email, address,
                invoice_address, shipping_address, sales_contact_person, sales_contact_extension,
                sales_contact_mobile, sales_contact_email, finance_contact_person, finance_contact_extension,
                finance_contact_mobile, finance_contact_email, billing_day, reconciliation_day,
                payment_method, tax_id, invoice_attachment_path, notes, minimum_order_amount, weight_tolerance_percentage, is_active, created_at, updated_at
            ) VALUES (
                :customer_number, :name, :product_category, :website, :fax, :invoice_title,
                :company_registered_address, :contact_person, :phone, :email, :address,
                :invoice_address, :shipping_address, :sales_contact_person, :sales_contact_extension,
                :sales_contact_mobile, :sales_contact_email, :finance_contact_person, :finance_contact_extension,
                :finance_contact_mobile, :finance_contact_email, :billing_day, :reconciliation_day,
                :payment_method, :tax_id, :invoice_attachment_path, :notes, :minimum_order_amount, :weight_tolerance_percentage, :is_active, NOW(), NOW()
            )
        ');

        $stmt->execute([
            'customer_number' => $data['customer_number'],
            'name' => $data['name'],
            'product_category' => $data['product_category'] ?? null,
            'website' => $data['website'] ?? null,
            'fax' => $data['fax'] ?? null,
            'invoice_title' => $data['invoice_title'] ?? null,
            'company_registered_address' => $data['company_registered_address'] ?? null,
            'contact_person' => $data['contact_person'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'invoice_address' => $data['invoice_address'] ?? null,
            'shipping_address' => $data['shipping_address'] ?? null,
            'sales_contact_person' => $data['sales_contact_person'] ?? null,
            'sales_contact_extension' => $data['sales_contact_extension'] ?? null,
            'sales_contact_mobile' => $data['sales_contact_mobile'] ?? null,
            'sales_contact_email' => $data['sales_contact_email'] ?? null,
            'finance_contact_person' => $data['finance_contact_person'] ?? null,
            'finance_contact_extension' => $data['finance_contact_extension'] ?? null,
            'finance_contact_mobile' => $data['finance_contact_mobile'] ?? null,
            'finance_contact_email' => $data['finance_contact_email'] ?? null,
            'billing_day' => $data['billing_day'] ?? null,
            'reconciliation_day' => $data['reconciliation_day'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'invoice_attachment_path' => $data['invoice_attachment_path'] ?? null,
            'notes' => $data['notes'] ?? null,
            'minimum_order_amount' => $data['minimum_order_amount'] ?? 0,
            'weight_tolerance_percentage' => $data['weight_tolerance_percentage'] ?? 3.00,
            'is_active' => $data['is_active'] ?? 1,
        ]);

        $customerId = (int)$pdo->lastInsertId();

        // Log the action
        logAuditAction('Added new customer', 'Customers', $customerId, [
            'customer_number' => $data['customer_number'],
            'name' => $data['name'],
        ]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '客戶資料已新增。',
            'data' => ['id' => $customerId],
        ], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Failed to create customer: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '新增客戶資料失敗，請稍後再試。',
        ], 500);
    }
}