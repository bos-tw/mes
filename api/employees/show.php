<?php
/**
 * 員工管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆員工詳細資料。
 *
 * @endpoint GET /api/employees/show.php?id={id}
 *
 * @auth 必須登入
 * @table employees, departments, lookup_values
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 員工 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "employee_number": "E001",
 *     "account": "zhangsan",
 *     "name": "張三",
 *     "department_id": 2,
 *     "department_name": "生產部",
 *     "job_title": "技術員",
 *     "email": "zhangsan@example.com",
 *     "status": "active",
 *     "status_label": "在職"
 *   }
 * }
 * ```
 *
 * @error 400 請提供有效的員工 ID
 * @error 404 找不到對應的員工資料
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lookup_values/helpers.php';

requireMethod('GET');
requireAuth();

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的員工 ID。',
    ], 400);
}

$pdo = db();
$employee = findEmployee($pdo, (int)$id);

if (!$employee) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的員工資料。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformEmployee($employee),
]);
