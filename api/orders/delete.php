<?php
/**
 * 訂單管理 API - 刪除訂單（軟刪除）
 *
 * @endpoint DELETE /api/orders/delete.php?id={id}
 * @endpoint POST   /api/orders/delete.php?id={id}  （FormData 相容，需帶 _method=DELETE）
 *
 * @auth 需要登入
 * @table orders
 *
 * 執行軟刪除（設定 deleted_at 時間戳記）。
 * 刪除後資料仍保留於資料庫中，但不會出現在列表查詢結果。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明                         |
 * |---------|------|------|------------------------------|
 * | id      | int  | 是   | 訂單 ID，必須 > 0 且資料存在   |
 *
 * @input Body Parameters (POST with _method):
 * | 參數名稱 | 類型   | 必填 | 說明               |
 * |---------|--------|------|-------------------|
 * | _method | string | 是   | 'DELETE'          |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "訂單資料已刪除。"
 * }
 *
 * @logic 業務邏輯:
 * - 使用軟刪除（設定 deleted_at = NOW()）
 * - 刪除後訂單號碼不會修改（不釋放唯一索引）
 * - 關聯的訂單明細 (order_items) 不會連帶刪除
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                              |
 * |------------|------------------|--------------------------------------|
 * | 400        | id 參數無效       | "請提供有效的訂單 ID。"             |
 * | 401        | 未登入           | "尚未登入或登入已過期。"               |
 * | 404        | 訂單不存在或已刪除 | "找不到對應的訂單資料。"             |
 * | 405        | 不支援的 HTTP 方法 | "不支援的請求方法。"                 |
 * | 409        | 資料庫錯誤        | "資料庫寫入失敗，請稍後再試。"       |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();

if (!orderExists($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單資料。',
    ], 404);
}

$workflowGuard = getWorkflowDeleteAssessment($pdo, 'orders', (int)$id);
if (!$workflowGuard['allowed']) {
    jsonResponse([
        'success' => false,
        'message' => $workflowGuard['message'],
        'workflow_guard' => $workflowGuard,
    ], 409);
}

// 檢查是否有關聯的訂單品項
$checkStmt = $pdo->prepare('SELECT COUNT(*) FROM order_items WHERE order_id = ? AND deleted_at IS NULL');
$checkStmt->execute([$id]);
if ((int)$checkStmt->fetchColumn() > 0) {
    jsonResponse([
        'success' => false,
        'message' => '此訂單有相關的訂單品項資料，請先刪除訂單品項後再刪除訂單。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('UPDATE orders SET deleted_at = NOW(), delete_token = id WHERE id = :id AND deleted_at IS NULL');
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的訂單資料。',
        ], 404);
    }

    // 記錄操作日誌
    logAuditAction('刪除訂單', 'Orders', (int)$id);

} catch (PDOException $exception) {
    handleOrderPdoWriteException($exception);
}

jsonResponse([
    'success' => true,
    'message' => '訂單資料已刪除。',
]);
