<?php
/**
 * 員工管理 API - 列表與新增端點
 *
 * 提供員工資料的列表查詢（含分頁、關鍵字搜尋、狀態篩選）及新增功能。
 *
 * @endpoint GET  /api/employees/          取得員工列表
 * @endpoint POST /api/employees/          新增員工
 *
 * @auth 必須登入
 * @table employees, departments, lookup_values
 *
 * @input GET (Query string)
 * | 參數    | 類型   | 必填 | 說明 |
 * |---------|--------|------|------|
 * | page    | int    | N    | 頁碼，預設 1 |
 * | perPage | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword | string | N    | 關鍵字搜尋（員工編號、姓名、帳號、Email）|
 * | status  | string | N    | 依狀態篩選 (active/resigned/unpaid_leave) |
 *
 * @input POST (JSON body)
 * | 參數             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | employee_number  | string | Y    | 員工編號 |
 * | account          | string | Y    | 登入帳號 |
 * | name             | string | Y    | 員工姓名 |
 * | password         | string | Y    | 登入密碼（新增時必填）|
 * | department_id    | int    | N    | 部門 ID |
 * | job_title        | string | N    | 職稱 |
 * | email            | string | N    | Email |
 * | status           | string | N    | 狀態 |
 * | status_lookup_id | int    | N    | 狀態 lookup ID |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "employee_number": "E001", "name": "張三"}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 100, "totalPages": 10}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 * @error 409 員工編號或帳號重複
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lookup_values/helpers.php';

$employee = requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListEmployees();
        break;
    case 'POST':
        handleCreateEmployee();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListEmployees(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $status = trim((string)($_GET['status'] ?? ''));

    $conditions = ['e.deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(e.employee_number LIKE :kw OR e.name LIKE :kw OR e.account LIKE :kw OR e.email LIKE :kw)';
        $params['kw'] = '%' . $keyword . '%';
    }

    if ($status !== '') {
        $conditions[] = 'e.status = :status';
        $params['status'] = $status;
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM employees e WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;

    $listSql = "SELECT e.id, e.employee_number, e.account, e.name, e.department_id, e.job_title, e.email, e.status, e.status_lookup_id, e.last_login_at, e.created_at, e.updated_at, d.name AS department_name, lv.value_label AS status_label FROM employees e LEFT JOIN departments d ON d.id = e.department_id LEFT JOIN lookup_values lv ON e.status_lookup_id = lv.id WHERE $where ORDER BY e.id DESC LIMIT :limit OFFSET :offset";
    $listStmt = $pdo->prepare($listSql);

    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $listStmt->execute();
    $rows = $listStmt->fetchAll();

    $employees = array_map(static fn(array $row): array => transformEmployee($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $employees,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateEmployee(): void
{
    $pdo = db();
    $payload = readEmployeePayload();

    $validated = validateEmployeeData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];
    $now = currentTimestamp();
    $data['created_at'] = $now;
    $data['updated_at'] = $now;

    $columns = array_keys($data);
    $placeholders = array_map(static fn(string $col): string => ':' . $col, $columns);

    $sql = 'INSERT INTO employees (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($sql);
        foreach ($data as $column => $value) {
            $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $column, $value, $value === null ? PDO::PARAM_NULL : $paramType);
        }
        $stmt->execute();
    } catch (PDOException $exception) {
        handleEmployeeWriteException($exception);
    }

    $newId = (int)$pdo->lastInsertId();
    $employee = findEmployee($pdo, $newId);

    logAuditAction('新增員工', 'employees', $newId, ['employee_number' => $data['employee_number'] ?? '', 'name' => $data['name'] ?? '']);

    jsonResponse([
        'success' => true,
        'message' => '員工建立成功。',
        'data' => $employee ? transformEmployee($employee) : null,
    ], 201);
}

// handleEmployeeWriteException 已移動至 helpers.php 供共用
