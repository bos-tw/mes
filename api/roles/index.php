<?php
/**
 * 角色管理 API - 列表與新增端點
 *
 * 提供角色資料的列表查詢（含分頁、關鍵字搜尋）及新增功能。
 *
 * @endpoint GET  /api/roles/          取得角色列表
 * @endpoint POST /api/roles/          新增角色
 *
 * @auth 必須登入
 * @table roles
 *
 * @input GET (Query string)
 * | 參數    | 類型   | 必填 | 說明 |
 * |---------|--------|------|------|
 * | page    | int    | N    | 頁碼，預設 1 |
 * | perPage | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword | string | N    | 關鍵字搜尋（角色名稱、描述）|
 *
 * @input POST (JSON body)
 * | 參數        | 類型   | 必填 | 說明 |
 * |-------------|--------|------|------|
 * | name        | string | Y    | 角色名稱（最大 50 字）|
 * | description | string | N    | 描述（最大 255 字）|
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "name": "admin", "description": "系統管理員"}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 5, "totalPages": 1}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 409 角色名稱重複
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
        handleListRoles();
        break;
    case 'POST':
        handleCreateRole();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 處理角色列表查詢
 */
function handleListRoles(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['1=1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(name LIKE :keyword OR description LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    // 計算總筆數
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM roles WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // 查詢資料
    $offset = ($page - 1) * $perPage;
    $sql = "SELECT id, name, description, created_at, updated_at FROM roles WHERE $where ORDER BY id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $roles = array_map('transformRole', $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $roles,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

/**
 * 處理新增角色
 */
function handleCreateRole(): void
{
    $pdo = db();
    $payload = readRolePayload();

    $validated = validateRoleData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查名稱是否重複
    if (roleNameExists($pdo, $data['name'])) {
        jsonResponse([
            'success' => false,
            'message' => '角色名稱已存在。',
            'errors' => ['name' => '角色名稱已存在，請使用其他名稱。'],
        ], 409);
    }

    try {
        $columns = array_keys($data);
        $placeholders = array_map(fn(string $col): string => ':' . $col, $columns);

        $sql = 'INSERT INTO roles (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = $pdo->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        $stmt->execute();
        $newId = (int)$pdo->lastInsertId();

        $role = findRole($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '角色建立成功。',
            'data' => $role ? transformRole($role) : null,
        ], 201);
    } catch (PDOException $e) {
        handleRolePdoWriteException($e);
    }
}
