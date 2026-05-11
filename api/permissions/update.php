<?php
/**
 * 權限管理 API - 更新端點
 *
 * @endpoint PUT   /api/permissions/update.php?id={id}
 * @endpoint PATCH /api/permissions/update.php?id={id}
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

requireMethod(['PUT', 'PATCH']);

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的權限 ID。',
    ], 400);
}

$pdo = db();

$permission = findPermission($pdo, (int)$id);
if (!$permission) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的權限資料。',
    ], 404);
}

$payload = readPermissionPayload();
$validated = validatePermissionData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];
if ($data === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有任何可更新的欄位。',
    ], 400);
}

if (isset($data['name']) && permissionNameExists($pdo, $data['name'], (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '權限名稱已存在。',
        'errors' => ['name' => '權限名稱已存在，請使用其他名稱。'],
    ], 409);
}

try {
    $setClauses = array_map(fn(string $col): string => "$col = :$col", array_keys($data));
    $sql = 'UPDATE permissions SET ' . implode(', ', $setClauses) . ' WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    foreach ($data as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    $updatedPermission = findPermission($pdo, (int)$id);

    jsonResponse([
        'success' => true,
        'message' => '權限資料已更新。',
        'data' => $updatedPermission ? transformPermission($updatedPermission) : null,
    ]);
} catch (PDOException $e) {
    handlePermissionPdoWriteException($e);
}
