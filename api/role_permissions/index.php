<?php
/**
 * 角色權限關聯 API - 列表與新增端點
 *
 * @endpoint GET  /api/role_permissions/          取得角色權限列表
 * @endpoint POST /api/role_permissions/          新增角色權限關聯
 *
 * @auth 必須登入
 * @table role_permissions
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
        handleListRolePermissions();
        break;
    case 'POST':
        handleCreateRolePermission();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListRolePermissions(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $roleId = isset($_GET['role_id']) && $_GET['role_id'] !== '' 
        ? filter_var($_GET['role_id'], FILTER_VALIDATE_INT) 
        : null;

    $conditions = ['1=1'];
    $params = [];

    if ($roleId !== null && $roleId !== false) {
        $conditions[] = 'rp.role_id = :role_id';
        $params['role_id'] = $roleId;
    }

    $where = implode(' AND ', $conditions);

    $countSql = "SELECT COUNT(*) FROM role_permissions rp WHERE $where";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;
    $sql = "SELECT rp.role_id, rp.permission_id, r.name AS role_name, p.name AS permission_name
            FROM role_permissions rp
            LEFT JOIN roles r ON r.id = rp.role_id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            WHERE $where
            ORDER BY rp.role_id ASC, rp.permission_id ASC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $rolePermissions = array_map('transformRolePermission', $rows ?: []);

    // 同時回傳角色與權限清單供前端下拉選單使用
    $roles = getAllRoles($pdo);
    $permissions = getAllPermissions($pdo);

    jsonResponse([
        'success' => true,
        'data' => $rolePermissions,
        'roles' => $roles,
        'permissions' => $permissions,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateRolePermission(): void
{
    $pdo = db();
    $payload = readRolePermissionPayload();

    $validated = validateRolePermissionData($payload);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查角色是否存在
    if (!roleExistsForRp($pdo, $data['role_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '指定的角色不存在。',
            'errors' => ['role_id' => '指定的角色不存在。'],
        ], 422);
    }

    // 檢查權限是否存在
    if (!permissionExistsForRp($pdo, $data['permission_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '指定的權限不存在。',
            'errors' => ['permission_id' => '指定的權限不存在。'],
        ], 422);
    }

    // 檢查關聯是否已存在
    if (rolePermissionExists($pdo, $data['role_id'], $data['permission_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '此角色已擁有該權限。',
            'errors' => ['permission_id' => '此角色已擁有該權限。'],
        ], 409);
    }

    try {
        $sql = 'INSERT INTO role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'role_id' => $data['role_id'],
            'permission_id' => $data['permission_id'],
        ]);

        jsonResponse([
            'success' => true,
            'message' => '角色權限關聯建立成功。',
            'data' => $data,
        ], 201);
    } catch (PDOException $e) {
        handleRolePermissionPdoWriteException($e);
    }
}
