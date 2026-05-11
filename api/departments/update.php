<?php
/**
 * 部門管理 API - 更新端點
 *
 * 提供部門資料的更新功能，支援 PUT/PATCH 方法。
 *
 * @endpoint PUT   /api/departments/update.php?id={id}
 * @endpoint PATCH /api/departments/update.php?id={id}
 *
 * @auth 必須登入
 * @table departments
 *
 * @input PUT/PATCH
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 部門 ID (Query string) |
 *
 * @input PUT/PATCH (JSON body)
 * | 參數                 | 類型   | 必填 | 說明 |
 * |----------------------|--------|------|------|
 * | name                 | string | N    | 部門名稱 |
 * | parent_department_id | int    | N    | 上級部門 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "部門資料已更新。",
 *   "data": {"id": 1, "name": "生產部"}
 * }
 * ```
 *
 * @error 400 請提供有效的部門 ID / 沒有任何可更新的欄位
 * @error 404 找不到對應的部門資料 / 上級部門不存在
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗 / 不可將自己設為上級部門
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

$payload = readDepartmentPayload();
$validated = validateDepartmentData($payload, true);
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

if (array_key_exists('parent_department_id', $data)) {
    $parentId = $data['parent_department_id'];
    if ($parentId !== null) {
        if ((int)$parentId === (int)$id) {
            jsonResponse([
                'success' => false,
                'message' => '上級部門不可為自身。',
                'errors' => ['parent_department_id' => '上級部門不可為自身。'],
            ], 422);
        }
        if (!departmentExists($pdo, (int)$parentId)) {
            jsonResponse([
                'success' => false,
                'message' => '指定的上級部門不存在。',
                'errors' => ['parent_department_id' => '指定的上級部門不存在。'],
            ], 422);
        }
    }
}

$setClauses = [];
foreach ($data as $column => $value) {
    $setClauses[] = "$column = :$column";
}

$sql = 'UPDATE departments SET ' . implode(', ', $setClauses) . ' WHERE id = :id AND deleted_at IS NULL';

try {
    $stmt = $pdo->prepare($sql);
    foreach ($data as $column => $value) {
        if ($value === null) {
            $stmt->bindValue(':' . $column, null, PDO::PARAM_NULL);
        } else {
            $paramType = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $column, $value, $paramType);
        }
    }
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();
} catch (PDOException $exception) {
    handleDepartmentPdoWriteException($exception);
}

$updated = findDepartment($pdo, (int)$id);

jsonResponse([
    'success' => true,
    'message' => '部門資料已更新。',
    'data' => $updated ? transformDepartment($updated) : null,
]);
