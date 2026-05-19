<?php
/**
 * 角色權限 API - 輔助函式
 *
 * 本檔案包含角色權限模組的共用函式：
 *
 * @module role_permissions
 * @table role_permissions
 *
 * @functions
 * - readRolePermissionPayload(): 讀取請求資料
 * - validateRolePermissionData(): 驗證角色權限資料
 * - roleExistsForRp(): 檢查角色是否存在
 * - permissionExistsForRp(): 檢查權限是否存在
 * - rolePermissionExists(): 檢查角色權限是否存在
 * - transformRolePermission(): 轉換為 API 回應格式
 * - getAllRoles(): 取得所有角色
 * - getAllPermissions(): 取得所有權限
 * - handleRolePermissionPdoWriteException(): 處理寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 讀取請求資料
 */
function readRolePermissionPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證角色權限資料
 */
function validateRolePermissionData(array $payload): array
{
    $errors = [];
    $data = [];

    // role_id (必填)
    if (!isset($payload['role_id']) || $payload['role_id'] === '') {
        $errors['role_id'] = '角色 ID 為必填。';
    } else {
        $roleId = filter_var($payload['role_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($roleId === false) {
            $errors['role_id'] = '角色 ID 必須為正整數。';
        } else {
            $data['role_id'] = $roleId;
        }
    }

    // permission_id (必填)
    if (!isset($payload['permission_id']) || $payload['permission_id'] === '') {
        $errors['permission_id'] = '權限 ID 為必填。';
    } else {
        $permissionId = filter_var($payload['permission_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($permissionId === false) {
            $errors['permission_id'] = '權限 ID 必須為正整數。';
        } else {
            $data['permission_id'] = $permissionId;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 驗證「單一權限對應角色集合」同步資料
 *
 * @param array<string, mixed> $payload
 * @return array{data: array{permission_id?: int, role_ids?: array<int, int>}, errors: array<string, string>}
 */
function validatePermissionRoleSyncPayload(array $payload): array
{
    $errors = [];
    $data = [];

    if (!isset($payload['permission_id']) || $payload['permission_id'] === '') {
        $errors['permission_id'] = '權限 ID 為必填。';
    } else {
        $permissionId = filter_var($payload['permission_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($permissionId === false) {
            $errors['permission_id'] = '權限 ID 必須為正整數。';
        } else {
            $data['permission_id'] = $permissionId;
        }
    }

    $roleIdsRaw = $payload['role_ids'] ?? [];
    if ($roleIdsRaw === null) {
        $roleIdsRaw = [];
    }

    if (!is_array($roleIdsRaw)) {
        $errors['role_ids'] = '角色清單格式不正確。';
    } else {
        $normalized = [];
        foreach ($roleIdsRaw as $roleIdRaw) {
            $roleId = filter_var($roleIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($roleId === false) {
                $errors['role_ids'] = '角色 ID 必須為正整數。';
                break;
            }
            $normalized[$roleId] = $roleId;
        }

        if (!isset($errors['role_ids'])) {
            $data['role_ids'] = array_values($normalized);
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 檢查角色是否存在
 */
function roleExistsForRp(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM roles WHERE id = :id');
    $stmt->execute(['id' => $id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查權限是否存在
 */
function permissionExistsForRp(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM permissions WHERE id = :id');
    $stmt->execute(['id' => $id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查角色權限是否存在
 */
function rolePermissionExists(PDO $pdo, int $roleId, int $permissionId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id');
    $stmt->execute(['role_id' => $roleId, 'permission_id' => $permissionId]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 轉換為 API 回應格式
 */
function transformRolePermission(array $row): array
{
    $permissionName = isset($row['permission_name']) ? (string)$row['permission_name'] : '';

    return [
        'role_id' => (int)$row['role_id'],
        'permission_id' => (int)$row['permission_id'],
        'role_name' => $row['role_name'] ?? null,
        'permission_name' => $permissionName,
        'permission_display_name' => resolveRolePermissionDisplayName($permissionName),
    ];
}

/**
 * 轉換「權限 -> 角色」摘要資料
 *
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function transformPermissionRoleSummary(array $row): array
{
    $permissionName = isset($row['permission_name']) ? (string)$row['permission_name'] : '';
    $roleIdsRaw = isset($row['role_ids']) ? (string)$row['role_ids'] : '';
    $roleNamesRaw = isset($row['role_names']) ? (string)$row['role_names'] : '';

    $roleIds = $roleIdsRaw === ''
        ? []
        : array_values(array_filter(array_map(static function (string $value): int {
            return (int)$value;
        }, explode(',', $roleIdsRaw)), static function (int $value): bool {
            return $value > 0;
        }));

    $roleNames = $roleNamesRaw === ''
        ? []
        : array_values(array_filter(array_map('trim', explode('|||', $roleNamesRaw)), static function (string $value): bool {
            return $value !== '';
        }));

    $rolesSummary = $roleNames === [] ? '尚未指派角色' : implode('、', $roleNames);

    return [
        'permission_id' => (int)($row['permission_id'] ?? 0),
        'permission_name' => $permissionName,
        'permission_display_name' => resolveRolePermissionDisplayName($permissionName),
        'permission_description' => isset($row['permission_description']) ? (string)$row['permission_description'] : '',
        'role_ids' => $roleIds,
        'role_names' => $roleNames,
        'roles_summary' => $rolesSummary,
    ];
}

/**
 * 取得權限顯示名稱（由資料庫欄位控制）
 */
function resolveRolePermissionDisplayName(string $permissionName): string
{
    if ($permissionName === '') {
        return '';
    }

    if (function_exists('getPermissionAliasMap')) {
        $aliasMap = getPermissionAliasMap();
        if (isset($aliasMap[$permissionName])) {
            return (string)$aliasMap[$permissionName];
        }
    }

    return $permissionName;
}

/**
 * 取得所有角色（下拉選單用）
 */
function getAllRoles(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT id, name FROM roles ORDER BY name ASC');
    return $stmt->fetchAll() ?: [];
}

/**
 * 取得所有權限（下拉選單用）
 */
function getAllPermissions(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT id, name, description FROM permissions ORDER BY name ASC');
    $rows = $stmt->fetchAll() ?: [];

    return array_map(static function (array $row): array {
        $name = isset($row['name']) ? (string)$row['name'] : '';
        $description = isset($row['description']) ? (string)$row['description'] : null;

        return [
            'id' => (int)($row['id'] ?? 0),
            'name' => $name,
            'description' => $description,
            'display_name' => resolveRolePermissionDisplayName($name),
        ];
    }, $rows);
}

/**
 * 取得某權限目前綁定的角色 ID 清單
 *
 * @param PDO $pdo
 * @param int $permissionId
 * @return array<int, int>
 */
function getRoleIdsByPermission(PDO $pdo, int $permissionId): array
{
    $stmt = $pdo->prepare('SELECT role_id FROM role_permissions WHERE permission_id = :permission_id ORDER BY role_id ASC');
    $stmt->execute(['permission_id' => $permissionId]);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (!$rows) {
        return [];
    }

    return array_values(array_filter(array_map(static function ($value): int {
        return (int)$value;
    }, $rows), static function (int $value): bool {
        return $value > 0;
    }));
}

/**
 * 檢查角色 ID 清單是否全部存在
 *
 * @param PDO $pdo
 * @param array<int, int> $roleIds
 * @return bool
 */
function allRoleIdsExist(PDO $pdo, array $roleIds): bool
{
    if ($roleIds === []) {
        return true;
    }

    $placeholders = implode(', ', array_fill(0, count($roleIds), '?'));
    $sql = "SELECT COUNT(*) FROM roles WHERE id IN ($placeholders)";
    $stmt = $pdo->prepare($sql);
    foreach (array_values($roleIds) as $index => $roleId) {
        $stmt->bindValue($index + 1, $roleId, PDO::PARAM_INT);
    }
    $stmt->execute();
    $count = (int)$stmt->fetchColumn();

    return $count === count($roleIds);
}

/**
 * 處理 PDO 寫入例外
 */
function handleRolePermissionPdoWriteException(PDOException $exception): void
{
    $code = (int)$exception->getCode();

    if ($code === 23000) {
        jsonResponse([
            'success' => false,
            'message' => '此角色權限組合已存在。',
        ], 409);
    }

    jsonResponse([
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
        'error' => $exception->getMessage(),
    ], 500);
}