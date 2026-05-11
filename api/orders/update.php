<?php
/**
 * 訂單管理 API - 更新訂單
 *
 * @endpoint PUT   /api/orders/update.php?id={id}  更新訂單資料
 * @endpoint PATCH /api/orders/update.php?id={id}  部分更新訂單資料
 * @endpoint POST  /api/orders/update.php?id={id}  更新訂單資料（FormData 相容，需帶 _method=PUT/PATCH）
 *
 * @auth 需要登入
 * @table orders
 *
 * 更新訂單資料，僅更新有提供的欄位（部分更新）。
 * 注意：訂單號碼 (order_number) 不允許更新。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明     |
 * |---------|------|------|---------|
 * | id      | int  | 是   | 訂單 ID |
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱               | 類型   | 必填 | 驗證規則                 | 說明                  |
 * |------------------------|--------|------|--------------------------|----------------------|
 * | _method                | string | 否   | 'PUT' 或 'PATCH'         | HTTP 方法覆蓋         |
 * | customer_id            | int    | 否   | > 0，客戶必須存在         | 客戶 ID              |
 * | order_date             | string | 否   | YYYY-MM-DD 格式          | 訂單日期              |
 * | expected_delivery_date | string | 否   | YYYY-MM-DD 格式          | 預計交期              |
 * | customer_po_number     | string | 否   | 最大 100 字             | 客戶訂單號            |
 * | status                 | string | 否   | 最大 50 字              | 訂單狀態              |
 * | total_amount           | float  | 否   | >= 0                     | 訂單總金額            |
 * | notes                  | string | 否   | -                        | 備註                  |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "訂單資料已更新。",
 *     "data": { ...更新後的完整訂單資料... }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                              |
 * |------------|------------------|--------------------------------------|
 * | 400        | id 參數無效       | "請提供有效的訂單 ID。"             |
 * | 400        | 無更新資料         | "沒有任何可更新的欄位。"             |
 * | 401        | 未登入           | "尚未登入或登入已過期。"               |
 * | 404        | 訂單不存在         | "找不到對應的訂單資料。"             |
 * | 405        | 不支援的 HTTP 方法 | "不支援的請求方法。"                 |
 * | 409        | 資料重複/參照限制  | "資料重覆或違反參照限制..."         |
 * | 422        | 欄位驗證失敗      | "欄位驗證失敗。"                   |
 * | 422        | 客戶不存在        | "指定的客戶不存在。"                 |
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
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();

$order = findOrder($pdo, (int)$id);
if (!$order) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單資料。',
    ], 404);
}

$payload = readOrderPayload();
$validated = validateOrderData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];

// 移除訂單號碼欄位，因為訂單號碼不允許更新
if (isset($data['order_number'])) {
    unset($data['order_number']);
}

if ($data === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有任何可更新的欄位。',
    ], 400);
}

// 檢查客戶是否存在
if (isset($data['customer_id']) && !customerExists($pdo, $data['customer_id'])) {
    jsonResponse([
        'success' => false,
        'message' => '指定的客戶不存在。',
        'errors' => ['customer_id' => '指定的客戶不存在。'],
    ], 422);
}

$setClauses = [];
foreach ($data as $column => $value) {
    $setClauses[] = "$column = :$column";
}

$sql = 'UPDATE orders SET ' . implode(', ', $setClauses) . ' WHERE id = :id AND deleted_at IS NULL';

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

    // 記錄操作日誌
    logAuditAction('更新訂單', 'Orders', (int)$id, $data);

} catch (PDOException $exception) {
    handleOrderPdoWriteException($exception);
}

$updated = findOrder($pdo, (int)$id);

jsonResponse([
    'success' => true,
    'message' => '訂單資料已更新。',
    'data' => $updated ? transformOrder($updated) : null,
]);