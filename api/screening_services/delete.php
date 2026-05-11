<?php
/**
 * 篩分服務 API - 刪除
 *
 * @endpoint DELETE /api/screening_services/delete.php?id={int}  刪除篩分服務
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 篩分服務 ID |
 *
 * @note 若篩分服務已被 order_item_screening_details 或
 *       work_order_screening_defects 引用，資料庫 FK 限制將阻止刪除。
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的篩分服務ID。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('DELETE FROM screening_services WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的篩分服務。'], 404);
    }

    $pdo->commit();

    jsonResponse(['success' => true, 'message' => '篩分服務資料已刪除。']);
} catch (PDOException $e) {
    $pdo->rollBack();
    $response = handleScreeningServiceWriteException($e);
    jsonResponse($response, 500);
}
