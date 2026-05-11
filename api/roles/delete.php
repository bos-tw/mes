<?php
/**
 * 角色管理 API - 刪除端點
 *
 * 提供角色資料的刪除功能（硬刪除）。
 *
 * @endpoint DELETE /api/roles/delete.php?id={id}
 *
 * @auth 必須登入
 * @table roles
 *
 * @input DELETE
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 角色 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "角色資料已刪除。"
 * }
 * ```
 *
 * @error 400 請提供有效的角色 ID
 * @error 404 找不到對應的角色資料
 * @error 405 不支援的請求方法
 * @error 409 無法刪除，因為角色仍被使用
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
        'message' => '請提供有效的角色 ID。',
    ], 400);
}

$pdo = db();

if (!roleExists($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的角色資料。',
    ], 404);
}

// 檢查是否可以刪除
if (!canDeleteRole($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '無法刪除此角色，因為它已被員工或權限關聯使用。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('DELETE FROM roles WHERE id = :id');
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的角色資料。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => '角色資料已刪除。',
    ]);
} catch (PDOException $e) {
    handleRolePdoWriteException($e);
}
