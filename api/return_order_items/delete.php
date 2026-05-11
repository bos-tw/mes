<?php
/**
 * 退貨品項 API - 刪除
 *
 * @endpoint DELETE /api/return_order_items/delete.php?id={id}
 *
 * @auth 必須登入
 * @table return_order_items
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明        |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 退貨品項 ID |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "退貨品項已刪除。"
 * }
 *
 * @error 400 ID 無效
 * @error 404 退貨品項不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數: id。'], 400);
}

$pdo = db();

try {
    // 檢查是否存在
    $checkStmt = $pdo->prepare("SELECT id FROM return_order_items WHERE id = ?");
    $checkStmt->execute([$id]);
    if (!$checkStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '退貨品項不存在。'], 404);
    }

    // 硬刪除
    $stmt = $pdo->prepare("DELETE FROM return_order_items WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(['success' => true, 'message' => '退貨品項已刪除。']);

} catch (Exception $e) {
    error_log('Return order item delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除退貨品項失敗，請稍後重試。')], 500);
}
