<?php
/**
 * 角色管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆角色詳細資料。
 *
 * @endpoint GET /api/roles/show.php?id={id}
 *
 * @auth 必須登入
 * @table roles
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 角色 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "admin",
 *     "description": "系統管理員"
 *   }
 * }
 * ```
 *
 * @error 400 請提供有效的角色 ID
 * @error 404 找不到對應的角色資料
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

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

jsonResponse([
    'success' => true,
    'data' => transformRole($role),
]);
