<?php
/**
 * 權限管理 API - 刪除端點
 *
 * @endpoint DELETE /api/permissions/delete.php?id={id}
 *
 * @auth 必須登入
 * @table permissions
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的權限 ID。',
    ], 400);
}

$pdo = db();

if (!permissionExists($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的權限資料。',
    ], 404);
}

if (!canDeletePermission($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '無法刪除此權限，因為它已被角色使用。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('DELETE FROM permissions WHERE id = :id');
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的權限資料。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => '權限資料已刪除。',
    ]);
} catch (PDOException $e) {
    handlePermissionPdoWriteException($e);
}
