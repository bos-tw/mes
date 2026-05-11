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
    return [
        'role_id' => (int)$row['role_id'],
        'permission_id' => (int)$row['permission_id'],
        'role_name' => $row['role_name'] ?? null,
        'permission_name' => $row['permission_name'] ?? null,
    ];
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
    return $stmt->fetchAll() ?: [];
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