<?php
/**
 * 角色權限關聯 API - 列表與新增端點
 *
 * @endpoint GET  /api/role_permissions/          取得「權限對應角色」列表
 * @endpoint POST /api/role_permissions/          新增角色權限關聯（相容舊流程）
 * @endpoint PUT  /api/role_permissions/          同步單一權限可瀏覽角色
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

$method = requireMethod(['GET', 'POST', 'PUT']);

switch ($method) {
    case 'GET':
        handleListRolePermissions();
        break;
    case 'POST':
        handleCreateRolePermission();
        break;
    case 'PUT':
        handleSyncPermissionRoles();
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

    $permissionId = isset($_GET['permission_id']) && $_GET['permission_id'] !== ''
        ? filter_var($_GET['permission_id'], FILTER_VALIDATE_INT)
        : null;

    $conditions = ['1=1'];
    $params = [];

    if ($permissionId !== null && $permissionId !== false) {
        $conditions[] = 'p.id = :permission_id';
        $params['permission_id'] = $permissionId;
    }

    $where = implode(' AND ', $conditions);

    $countSql = "SELECT COUNT(*) FROM permissions p WHERE $where";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;
    $sql = "SELECT p.id AS permission_id,
                   p.name AS permission_name,
                   p.description AS permission_description,
                   GROUP_CONCAT(rp.role_id ORDER BY rp.role_id SEPARATOR ',') AS role_ids,
                   GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR '|||') AS role_names
            FROM permissions p
            LEFT JOIN role_permissions rp ON rp.permission_id = p.id
            LEFT JOIN roles r ON r.id = rp.role_id
            WHERE $where
            GROUP BY p.id, p.name, p.description
            ORDER BY p.name ASC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $permissionRoles = array_map('transformPermissionRoleSummary', $rows ?: []);

    // 同時回傳角色與權限清單供前端下拉選單使用
    $roles = getAllRoles($pdo);
    $permissions = getAllPermissions($pdo);

    jsonResponse([
        'success' => true,
        'data' => $permissionRoles,
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

/**
 * 同步單一權限可瀏覽角色。
 */
function handleSyncPermissionRoles(): void
{
    $pdo = db();
    $payload = readRolePermissionPayload();

    $validated = validatePermissionRoleSyncPayload($payload);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $permissionId = (int)($validated['data']['permission_id'] ?? 0);
    $targetRoleIds = $validated['data']['role_ids'] ?? [];

    if (!permissionExistsForRp($pdo, $permissionId)) {
        jsonResponse([
            'success' => false,
            'message' => '指定的權限不存在。',
            'errors' => ['permission_id' => '指定的權限不存在。'],
        ], 422);
    }

    if (!allRoleIdsExist($pdo, $targetRoleIds)) {
        jsonResponse([
            'success' => false,
            'message' => '角色清單包含不存在的角色。',
            'errors' => ['role_ids' => '角色清單包含不存在的角色。'],
        ], 422);
    }

    $currentRoleIds = getRoleIdsByPermission($pdo, $permissionId);
    $toInsert = array_values(array_diff($targetRoleIds, $currentRoleIds));
    $toDelete = array_values(array_diff($currentRoleIds, $targetRoleIds));

    try {
        $pdo->beginTransaction();

        if ($toInsert !== []) {
            $insertStmt = $pdo->prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)');
            foreach ($toInsert as $roleId) {
                $insertStmt->execute([
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ]);
            }
        }

        if ($toDelete !== []) {
            $deleteStmt = $pdo->prepare('DELETE FROM role_permissions WHERE permission_id = :permission_id AND role_id = :role_id');
            foreach ($toDelete as $roleId) {
                $deleteStmt->execute([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '權限可瀏覽角色設定已更新。',
            'data' => [
                'permission_id' => $permissionId,
                'role_ids' => $targetRoleIds,
                'inserted_role_ids' => $toInsert,
                'deleted_role_ids' => $toDelete,
            ],
        ]);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        handleRolePermissionPdoWriteException($e);
    }
}
