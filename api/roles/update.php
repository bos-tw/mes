<?php
/**
 * 角色管理 API - 更新端點
 *
 * 提供角色資料的更新功能，支援 PUT/PATCH 方法。
 *
 * @endpoint PUT   /api/roles/update.php?id={id}
 * @endpoint PATCH /api/roles/update.php?id={id}
 *
 * @auth 必須登入
 * @table roles
 *
 * @input PUT/PATCH
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 角色 ID (Query string) |
 *
 * @input PUT/PATCH (JSON body)
 * | 參數        | 類型   | 必填 | 說明 |
 * |-------------|--------|------|------|
 * | name        | string | N    | 角色名稱（最大 50 字）|
 * | description | string | N    | 描述（最大 255 字）|
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "角色資料已更新。",
 *   "data": {"id": 1, "name": "admin", "description": "系統管理員"}
 * }
 * ```
 *
 * @error 400 請提供有效的角色 ID / 沒有任何可更新的欄位
 * @error 404 找不到對應的角色資料
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

$method = requireMethod(['PUT', 'PATCH']);

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的角色 ID。',
    ], 400);
}

$pdo = db();

$role = findRole($pdo, (int)$id);
if (!$role) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的角色資料。',
    ], 404);
}

$payload = readRolePayload();
$validated = validateRoleData($payload, true);
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

// 檢查名稱是否重複（排除自己）
if (isset($data['name']) && roleNameExists($pdo, $data['name'], (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '角色名稱已存在。',
        'errors' => ['name' => '角色名稱已存在，請使用其他名稱。'],
    ], 409);
}

try {
    $setClauses = array_map(fn(string $col): string => "$col = :$col", array_keys($data));
    $sql = 'UPDATE roles SET ' . implode(', ', $setClauses) . ' WHERE id = :id';

    $stmt = $pdo->prepare($sql);
    foreach ($data as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    $updatedRole = findRole($pdo, (int)$id);

    jsonResponse([
        'success' => true,
        'message' => '角色資料已更新。',
        'data' => $updatedRole ? transformRole($updatedRole) : null,
    ]);
} catch (PDOException $e) {
    handleRolePdoWriteException($e);
}
