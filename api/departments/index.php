<?php
/**
 * 部門管理 API - 列表與新增端點
 *
 * 提供部門資料的列表查詢（含分頁、關鍵字搜尋）及新增功能。
 *
 * @endpoint GET  /api/departments/          取得部門列表
 * @endpoint POST /api/departments/          新增部門
 *
 * @auth 必須登入
 * @table departments
 *
 * @input GET (Query string)
 * | 參數    | 類型   | 必填 | 說明 |
 * |---------|--------|------|------|
 * | page    | int    | N    | 頁碼，預設 1 |
 * | perPage | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword | string | N    | 關鍵字搜尋（部門名稱）|
 *
 * @input POST (JSON body)
 * | 參數                 | 類型   | 必填 | 說明 |
 * |----------------------|--------|------|------|
 * | name                 | string | Y    | 部門名稱 |
 * | parent_department_id | int    | N    | 上級部門 ID |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "name": "生產部", "parent_name": null}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 20, "totalPages": 2}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 * @error 409 部門名稱重複
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
        handleListDepartments();
        break;
    case 'POST':
        handleCreateDepartment();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListDepartments(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['d.deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = 'd.name LIKE :keyword';
        $params['keyword'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM departments d WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT d.id, d.name, d.parent_department_id, d.status_lookup_id, d.created_at, d.updated_at, d.deleted_at, '
        . 'p.name AS parent_name '
        . 'FROM departments d '
        . 'LEFT JOIN departments p ON p.id = d.parent_department_id '
        . "WHERE $where ORDER BY d.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $departments = array_map(static fn(array $row): array => transformDepartment($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $departments,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateDepartment(): void
{
    $pdo = db();
    $payload = readDepartmentPayload();

    $validated = validateDepartmentData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if (array_key_exists('parent_department_id', $data) && $data['parent_department_id'] !== null) {
        if (!departmentExists($pdo, (int)$data['parent_department_id'])) {
            jsonResponse([
                'success' => false,
                'message' => '指定的上級部門不存在。',
                'errors' => ['parent_department_id' => '指定的上級部門不存在。'],
            ], 422);
        }
    }

    $columns = array_keys($data);
    $placeholders = array_map(static fn(string $col): string => ':' . $col, $columns);

    $sql = 'INSERT INTO departments (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';

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
    } catch (PDOException $exception) {
        handleDepartmentPdoWriteException($exception);
    }

    $newId = (int)$pdo->lastInsertId();
    $department = findDepartment($pdo, $newId);

    logAuditAction('新增部門', 'departments', $newId, ['name' => $data['name'] ?? '']);

    jsonResponse([
        'success' => true,
        'message' => '部門建立成功。',
        'data' => $department ? transformDepartment($department) : null,
    ], 201);
}

