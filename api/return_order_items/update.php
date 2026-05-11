<?php
/**
 * 退貨品項 API - 更新端點
 *
 * 更新單一退貨品項的資料。
 *
 * @endpoint PUT /api/return_order_items/update.php?id={id}
 *
 * @auth 必須登入
 * @table return_order_items
 *
 * @input GET (Query string)
 * | 參數 | 類型 | 必填 | 說明        |
 * |------|------|------|-------------|
 * | id   | int  | Y    | 退貨品項 ID |
 *
 * @input PUT (JSON body)
 * | 參數              | 類型    | 必填 | 說明     |
 * |-------------------|---------|------|----------|
 * | returned_quantity | decimal | N    | 退貨數量 |
 * | returned_unit     | string  | N    | 單位     |
 * | return_reason     | string  | N    | 退貨原因 |
 * | notes             | string  | N    | 備註     |
 *
 * @output 成功回應 (200)
 * ```json
 * {
 *   "success": true,
 *   "message": "退貨品項已更新。"
 * }
 * ```
 *
 * @error 400 無效的 ID 或無更新資料
 * @error 404 找不到指定的退貨品項
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod('PUT');
if ($method !== 'PUT') {
    jsonResponse([
        'success' => false,
        'message' => '不支援的請求方法。',
    ], 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的退貨品項 ID。',
    ], 400);
}

$pdo = db();

// 檢查是否存在
if (!returnOrderItemExists($pdo, $id)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的退貨品項。',
    ], 404);
}

$payload = readReturnOrderItemPayload();
if ($payload === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供任何更新資料。',
    ], 400);
}

// 驗證資料（更新模式）
$result = validateReturnOrderItemData($payload, true);

if ($result['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $result['errors'],
    ], 422);
}

$data = $result['data'];

if ($data === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供任何更新資料。',
    ], 400);
}

try {
    $setParts = [];
    $params = [];
    foreach ($data as $column => $value) {
        $setParts[] = "{$column} = ?";
        $params[] = $value;
    }
    $params[] = $id;

    $sql = 'UPDATE return_order_items SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse([
        'success' => true,
        'message' => '退貨品項已更新。',
    ]);

} catch (PDOException $e) {
    $errorResponse = handleReturnOrderItemWriteException($e);
    jsonResponse($errorResponse, 500);
}
