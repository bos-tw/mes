<?php
/**
 * 供應商管理 API - 列表與新增端點
 *
 * 提供供應商資料的列表查詢（含分頁、關鍵字搜尋、排序）及新增功能。
 *
 * @endpoint GET  /api/suppliers/          取得供應商列表
 * @endpoint POST /api/suppliers/          新增供應商
 *
 * @auth 必須登入
 * @table suppliers
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | page          | int    | N    | 頁碼，預設 1 |
 * | perPage       | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword       | string | N    | 關鍵字搜尋（編號、名稱、聯絡人、電話等）|
 * | sortField     | string | N    | 排序欄位 |
 * | sortDirection | string | N    | 排序方向（asc/desc）|
 *
 * @input POST (JSON body)
 * | 參數             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | supplier_number  | string | Y    | 供應商編號 |
 * | name             | string | Y    | 供應商名稱 |
 * | service_type     | string | N    | 服務類型 |
 * | supplier_type    | string | N    | 供應商類型 |
 * | contact_person   | string | N    | 聯絡人 |
 * | phone            | string | N    | 電話 |
 * | email            | string | N    | Email |
 * | address          | string | N    | 地址 |
 * | tax_id           | string | N    | 統一編號 |
 * | payment_method   | string | N    | 付款方式 |
 * | bank_*           | string | N    | 銀行資訊欄位 |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "supplier_number": "S001", "name": "大明供應"}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 50, "totalPages": 5}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 * @error 409 供應商編號重複
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListSuppliers();
        break;
    case 'POST':
        handleCreateSupplier();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListSuppliers(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['s.deleted_at IS NULL'];
    $params = [];

    $sortableColumns = [
        'id' => 's.id',
        'supplier_number' => 's.supplier_number',
        'name' => 's.name',
        'service_type' => 's.service_type',
        'supplier_type' => 's.supplier_type',
        'contact_person' => 's.contact_person',
        'phone' => 's.phone',
        'email' => 's.email',
        'payment_method' => 's.payment_method',
        'tax_id' => 's.tax_id',
        'created_at' => 's.created_at',
        'updated_at' => 's.updated_at',
    ];

    $requestedSortField = trim((string)($_GET['sortField'] ?? ''));
    $requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'desc'));

    $sortColumn = $sortableColumns[$requestedSortField] ?? $sortableColumns['created_at'];
    $sortDirection = $requestedSortDirection === 'asc' ? 'ASC' : 'DESC';

    if ($keyword !== '') {
        $searchableColumns = [
            'supplier_number',
            'name',
            'service_type',
            'supplier_type',
            'contact_person',
            'phone',
            'contact_mobile',
            'fax',
            'email',
            'address',
            'factory_address',
            'owner',
            'product_category',
            'payment_method',
            'tax_id',
            'notes',
        ];

        $likeParts = [];
        foreach ($searchableColumns as $index => $column) {
            $paramName = 'keyword_' . $index;
            $likeParts[] = sprintf('s.%s LIKE :%s', $column, $paramName);
            $params[$paramName] = '%' . $keyword . '%';
        }

        if ($likeParts !== []) {
            $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
        }
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM suppliers s';
    if ($where !== '') {
        $countSql .= ' WHERE ' . $where;
    }

    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = '
        SELECT
            s.id,
            s.supplier_number,
            s.name,
            s.service_type,
            s.supplier_type,
            s.contact_person,
            s.contact_mobile,
            s.phone,
            s.email,
            s.payment_method,
            s.tax_id,
            s.address,
            s.factory_address,
            s.owner,
            s.product_category,
            s.fax,
            s.bank_account_name,
            s.bank_name,
            s.bank_code,
            s.bank_branch_name,
            s.bank_branch_code,
            s.bank_account_number,
            s.attachment_path,
            s.notes,
            s.created_at,
            s.updated_at
        FROM suppliers s';

    if ($where !== '') {
        $sql .= ' WHERE ' . $where;
    }

    $sql .= ' ORDER BY ' . $sortColumn . ' ' . $sortDirection . ', s.id ASC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $stmt->execute();

    $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $suppliers,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateSupplier(): void
{
    $pdo = db();

    $payload = readSupplierPayload();
    unset($payload['_method']);

    $validated = validateSupplierData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '資料驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 處理附件上傳
    $shouldRemove = isset($payload['remove_attachment']) && $payload['remove_attachment'] === '1';
    $attachmentResult = handleSupplierAttachmentUpload('attachment_file', null, $shouldRemove);
    if ($attachmentResult['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '附件上傳失敗。',
            'errors' => $attachmentResult['errors'],
        ], 422);
    }
    if ($attachmentResult['path'] !== null) {
        $data['attachment_path'] = $attachmentResult['path'];
    }

    $checkStmt = $pdo->prepare('SELECT id FROM suppliers WHERE supplier_number = :supplier_number AND deleted_at IS NULL');
    $checkStmt->execute(['supplier_number' => $data['supplier_number']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '供應商編號已存在。',
        ], 409);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('
            INSERT INTO suppliers (
                supplier_number,
                name,
                service_type,
                contact_person,
                phone,
                email,
                address,
                supplier_type,
                tax_id,
                owner,
                contact_mobile,
                fax,
                factory_address,
                product_category,
                bank_account_name,
                bank_name,
                bank_code,
                bank_branch_name,
                bank_branch_code,
                bank_account_number,
                payment_method,
                attachment_path,
                notes,
                created_at,
                updated_at
            ) VALUES (
                :supplier_number,
                :name,
                :service_type,
                :contact_person,
                :phone,
                :email,
                :address,
                :supplier_type,
                :tax_id,
                :owner,
                :contact_mobile,
                :fax,
                :factory_address,
                :product_category,
                :bank_account_name,
                :bank_name,
                :bank_code,
                :bank_branch_name,
                :bank_branch_code,
                :bank_account_number,
                :payment_method,
                :attachment_path,
                :notes,
                NOW(),
                NOW()
            )
        ');

        $stmt->execute([
            'supplier_number' => $data['supplier_number'],
            'name' => $data['name'],
            'service_type' => $data['service_type'] ?? null,
            'contact_person' => $data['contact_person'] ?? null,
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'address' => $data['address'] ?? null,
            'supplier_type' => $data['supplier_type'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'owner' => $data['owner'] ?? null,
            'contact_mobile' => $data['contact_mobile'] ?? null,
            'fax' => $data['fax'] ?? null,
            'factory_address' => $data['factory_address'] ?? null,
            'product_category' => $data['product_category'] ?? null,
            'bank_account_name' => $data['bank_account_name'] ?? null,
            'bank_name' => $data['bank_name'] ?? null,
            'bank_code' => $data['bank_code'] ?? null,
            'bank_branch_name' => $data['bank_branch_name'] ?? null,
            'bank_branch_code' => $data['bank_branch_code'] ?? null,
            'bank_account_number' => $data['bank_account_number'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'attachment_path' => $data['attachment_path'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        $supplierId = (int)$pdo->lastInsertId();

        logAuditAction('Added new supplier', 'Suppliers', $supplierId, [
            'supplier_number' => $data['supplier_number'],
            'name' => $data['name'],
        ]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '供應商資料已新增。',
            'data' => ['id' => $supplierId],
        ], 201);
    } catch (Throwable $exception) {
        $pdo->rollBack();
        error_log('Failed to create supplier: ' . $exception->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '新增供應商資料失敗，請稍後再試。',
        ], 500);
    }
}
