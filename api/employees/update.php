<?php
/**
 * 員工管理 API - 更新端點
 *
 * 提供員工資料的更新功能，支援 PUT/PATCH 方法。
 *
 * @endpoint PUT   /api/employees/update.php?id={id}
 * @endpoint PATCH /api/employees/update.php?id={id}
 *
 * @auth 必須登入
 * @table employees
 *
 * @input PUT/PATCH
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 員工 ID (Query string) |
 *
 * @input PUT/PATCH (JSON body)
 * | 參數             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | employee_number  | string | N    | 員工編號 |
 * | account          | string | N    | 登入帳號 |
 * | name             | string | N    | 員工姓名 |
 * | password         | string | N    | 登入密碼 |
 * | department_id    | int    | N    | 部門 ID |
 * | job_title        | string | N    | 職稱 |
 * | email            | string | N    | Email |
 * | status           | string | N    | 狀態 |
 * | status_lookup_id | int    | N    | 狀態 lookup ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "員工資料已更新。",
 *   "data": {"id": 1, "employee_number": "E001", "name": "張三"}
 * }
 * ```
 *
 * @error 400 請提供有效的員工 ID / 沒有任何可更新的欄位
 * @error 404 找不到對應的員工資料
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @note 支援 POST + _method=PUT/PATCH 的方式覆寫 HTTP 方法
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
        'message' => '請提供有效的員工 ID。',
    ], 400);
}

$payload = readEmployeePayload();
$validated = validateEmployeeData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$pdo = db();

$employee = findEmployee($pdo, (int)$id);
if (!$employee) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的員工資料。',
    ], 404);
}

$data = $validated['data'];
if ($data === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有任何可更新的欄位。',
    ], 400);
}

$data['updated_at'] = currentTimestamp();

$setClauses = [];
foreach ($data as $column => $value) {
    $setClauses[] = "$column = :$column";
}

$sql = 'UPDATE employees SET ' . implode(', ', $setClauses) . ' WHERE id = :id AND deleted_at IS NULL';

try {
    $stmt = $pdo->prepare($sql);
    foreach ($data as $column => $value) {
        $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue(':' . $column, $value, $value === null ? PDO::PARAM_NULL : $paramType);
    }
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();
} catch (PDOException $exception) {
    handleEmployeeWriteException($exception);
}

$updated = findEmployee($pdo, (int)$id);

jsonResponse([
    'success' => true,
    'message' => '員工資料已更新。',
    'data' => $updated ? transformEmployee($updated) : null,
]);
