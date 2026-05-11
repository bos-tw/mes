<?php
/**
 * 公司管理 API - 列表與新增端點
 *
 * 提供公司資料的列表查詢（含分頁、關鍵字搜尋、排序）及新增功能。
 *
 * @endpoint GET  /api/companies/          取得公司列表
 * @endpoint POST /api/companies/          新增公司
 *
 * @auth 必須登入
 * @table companies
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | page          | int    | N    | 頁碼，預設 1 |
 * | perPage       | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword       | string | N    | 關鍵字搜尋（名稱、地址、電話、Email、統編）|
 * | sortField     | string | N    | 排序欄位（id/name/address/phone/email/tax_id/created_at）|
 * | sortDirection | string | N    | 排序方向（asc/desc）|
 *
 * @input POST (JSON body)
 * | 參數   | 類型   | 必填 | 說明 |
 * |--------|--------|------|------|
 * | name   | string | Y    | 公司名稱 |
 * | address| string | N    | 地址 |
 * | phone  | string | N    | 電話 |
 * | email  | string | N    | Email |
 * | tax_id | string | N    | 統一編號 |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "name": "玉軒企業", "tax_id": "12345678"}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 5, "totalPages": 1}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
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
        handleListCompanies();
        break;
    case 'POST':
        handleCreateCompany();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListCompanies(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    // 排序功能
    $sortableColumns = [
        'id' => 'c.id',
        'name' => 'c.name',
        'address' => 'c.address',
        'phone' => 'c.phone',
        'email' => 'c.email',
        'tax_id' => 'c.tax_id',
        'created_at' => 'c.created_at',
        'updated_at' => 'c.updated_at',
    ];

    $requestedSortField = (string)($_GET['sortField'] ?? 'id');
    if (!array_key_exists($requestedSortField, $sortableColumns)) {
        $requestedSortField = 'id';
    }

    $requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'desc'));
    if (!in_array($requestedSortDirection, ['asc', 'desc'], true)) {
        $requestedSortDirection = 'desc';
    }

    $orderColumn = $sortableColumns[$requestedSortField];
    $orderDirection = strtoupper($requestedSortDirection);
    $orderBySql = sprintf('%s %s', $orderColumn, $orderDirection);
    if ($orderColumn !== 'c.id') {
        $orderBySql .= ', c.id DESC';
    }

    $conditions = [];
    $params = [];

    // 只顯示未刪除的資料
    $conditions[] = 'c.deleted_at IS NULL';

    if ($keyword !== '') {
        $searchConditions = [];
        $searchFields = ['name', 'address', 'phone', 'email', 'tax_id'];
        foreach ($searchFields as $field) {
            $paramName = 'keyword_' . $field;
            $searchConditions[] = "c.{$field} LIKE :{$paramName}";
            $params[$paramName] = '%' . $keyword . '%';
        }
        $conditions[] = '(' . implode(' OR ', $searchConditions) . ')';
    }

    $where = implode(' AND ', $conditions);

    try {
        $countSql = "SELECT COUNT(*) FROM companies c";
        if ($where !== '') {
            $countSql .= " WHERE " . $where;
        }
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => $value) {
            $countStmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $offset = ($page - 1) * $perPage;

        $sql = 'SELECT c.id, c.name, c.name_en, c.address, c.phone, c.fax, c.email, c.tax_id, c.created_at, c.updated_at FROM companies c';

        if ($where !== '') {
            $sql .= ' WHERE ' . $where;
        }

        $sql .= ' ORDER BY ' . $orderBySql . ' LIMIT :limit OFFSET :offset';

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $companies = array_map(static fn(array $row): array => transformCompany($row), $rows ?: []);

        jsonResponse([
            'success' => true,
            'data' => $companies,
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'totalPages' => (int)ceil($total / max($perPage, 1)),
            ],
        ]);
    } catch (PDOException $e) {
        error_log('Companies list query failed: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢公司資料失敗，請稍後再試。',
        ], 500);
    }
}

function handleCreateCompany(): void
{
    $pdo = db();
    $payload = readCompanyPayload();

    $validated = validateCompanyData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO companies (name, address, phone, email, tax_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['name'],
            $data['address'],
            $data['phone'],
            $data['email'],
            $data['tax_id'],
        ]);

        $companyId = (int)$pdo->lastInsertId();

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '公司建立成功。',
            'data' => ['id' => $companyId],
        ], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleCompanyWriteException($e);
        jsonResponse($response, 500);
    }
}