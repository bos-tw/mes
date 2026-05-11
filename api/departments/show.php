<?php
/**
 * 部門管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆部門詳細資料。
 *
 * @endpoint GET /api/departments/show.php?id={id}
 *
 * @auth 必須登入
 * @table departments
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 部門 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "生產部",
 *     "parent_department_id": null,
 *     "parent_name": null
 *   }
 * }
 * ```
 *
 * @error 400 請提供有效的部門 ID
 * @error 404 找不到對應的部門資料
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
        'message' => '請提供有效的部門 ID。',
    ], 400);
}

$pdo = db();
$department = findDepartment($pdo, (int)$id);

if (!$department) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的部門資料。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformDepartment($department),
]);
