<?php
/**
 * 工單圖片管理 API - 刪除端點
 *
 * 提供工單圖片的軟刪除功能。
 *
 * @endpoint POST /api/work_order_images/delete.php
 *
 * @auth 必須登入
 * @table work_order_images
 *
 * @input POST (JSON body)
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 圖片 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "圖片已刪除。"
 * }
 * ```
 *
 * @error 400 無效的圖片 ID
 * @error 404 找不到該圖片
 * @error 405 不支援的請求方法
 * @error 500 系統發生錯誤
 *
 * @logic 使用軟刪除，設定 deleted_at 時間戳
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

handleDeleteImage(db());

function handleDeleteImage(PDO $pdo): void
{
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        // Fallback to $_POST if not JSON
        $input = $_POST;
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;

    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的圖片ID。'], 400);
    }

    // Check if image exists and is not deleted
    $stmt = $pdo->prepare("SELECT * FROM work_order_images WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $id]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$image) {
        jsonResponse(['success' => false, 'message' => '找不到該圖片。'], 404);
    }

    try {
        $pdo->beginTransaction();

        // Soft delete
        $stmt = $pdo->prepare("UPDATE work_order_images SET deleted_at = NOW() WHERE id = :id");
        $stmt->execute(['id' => $id]);

        logAuditAction('Deleted work order image', 'work_order_images', $id, ['old_data' => $image]);

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => '圖片已刪除。']);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Delete image error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}
