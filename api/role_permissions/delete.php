<?php
/**
 * 角色權限關聯 API - 刪除端點
 *
 * @endpoint DELETE /api/role_permissions/delete.php?role_id={role_id}&permission_id={permission_id}
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

requireMethod('DELETE');

$roleId = filter_input(INPUT_GET, 'role_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$permissionId = filter_input(INPUT_GET, 'permission_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

if (!$roleId || !$permissionId) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的角色 ID 和權限 ID。',
    ], 400);
}

$pdo = db();

if (!rolePermissionExists($pdo, $roleId, $permissionId)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的角色權限關聯。',
    ], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM role_permissions WHERE role_id = :role_id AND permission_id = :permission_id');
    $stmt->execute([
        'role_id' => $roleId,
        'permission_id' => $permissionId,
    ]);

    if ($stmt->rowCount() === 0) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的角色權限關聯。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => '角色權限關聯已刪除。',
    ]);
} catch (PDOException $e) {
    handleRolePermissionPdoWriteException($e);
}
