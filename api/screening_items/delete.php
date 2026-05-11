<?php
/**
 * 受篩產品 API - 刪除
 *
 * @endpoint DELETE /api/screening_items/delete.php?id={int}  刪除受篩產品
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 受篩產品 ID |
 *
 * @note 若受篩產品已被 order_items 或 inventory_items 引用，
 *       資料庫 FK 限制將阻止刪除並回傳錯誤訊息。
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的受篩產品ID。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('DELETE FROM screening_items WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的受篩產品。'], 404);
    }

    $pdo->commit();

    jsonResponse(['success' => true, 'message' => '受篩產品已刪除。']);
} catch (PDOException $e) {
    $pdo->rollBack();
    $response = handleScreeningItemWriteException($e);
    jsonResponse($response, 500);
}
