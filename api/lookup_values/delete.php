<?php
/**
 * Lookup Values API - 刪除端點
 *
 * 刪除單一 lookup value。
 *
 * @endpoint DELETE /api/lookup_values/delete.php?id={id}
 *
 * @auth 必須登入
 * @table lookup_values
 *
 * @input GET (Query string)
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | Lookup Value ID |
 *
 * @output 成功回應 (200)
 * ```json
 * {
 *   "success": true,
 *   "message": "Lookup Value 已刪除。"
 * }
 * ```
 *
 * @error 400 無效的 ID
 * @error 404 找不到指定的 Lookup Value
 * @error 405 不支援的請求方法
 * @error 409 有其他資料參照此值，無法刪除
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 Lookup Value ID。',
    ], 400);
}

$pdo = db();

// 檢查是否存在
$checkStmt = $pdo->prepare('SELECT id FROM lookup_values WHERE id = ?');
$checkStmt->execute([$id]);
if (!$checkStmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的 Lookup Value。',
    ], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM lookup_values WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse([
        'success' => true,
        'message' => 'Lookup Value 已刪除。',
    ]);

} catch (PDOException $e) {
    error_log('Delete lookup_value error: ' . $e->getMessage());

    // 外鍵約束錯誤
    if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'foreign key constraint')) {
        jsonResponse([
            'success' => false,
            'message' => '此 Lookup Value 已被其他資料使用，無法刪除。',
        ], 409);
    }

    jsonResponse([
        'success' => false,
        'message' => '刪除失敗，請稍後再試。',
    ], 500);
}
