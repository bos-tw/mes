<?php
/**
 * 首件尺寸管理 API - 刪除端點
 *
 * 提供首件尺寸紀錄的實體刪除功能。
 *
 * @endpoint DELETE /api/work_order_first_piece_dimensions/delete.php?id={int}
 * @method POST + _method=DELETE（表單或 JSON 模擬 DELETE）
 *
 * @auth 必須登入
 * @table work_order_first_piece_dimensions
 *
 * @input JSON body / POST data
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | _method | string | N | 方法覆蓋，值為 DELETE |
 * | id   | int  | Y    | 紀錄 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "刪除成功。"
 * }
 * ```
 *
 * @error 400 無效的 ID
 * @error 404 找不到該紀錄
 * @error 500 刪除失敗
 *
 * @warning 此為實體刪除，資料將無法恢復
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

$pdo = db();

handleDelete($pdo);

function handleDelete(PDO $pdo): void
{
    $input = getJsonInput();
    if (empty($input)) {
        $input = $_POST;
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
    }

    try {
        // Check if record exists
        $stmt = $pdo->prepare("SELECT id FROM work_order_first_piece_dimensions WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['success' => false, 'message' => '找不到該紀錄。'], 404);
        }

        $stmt = $pdo->prepare("DELETE FROM work_order_first_piece_dimensions WHERE id = ?");
        $stmt->execute([$id]);

        logAuditAction('Delete First Piece Dimension', 'work_order_first_piece_dimensions', $id, []);

        jsonResponse(['success' => true, 'message' => '刪除成功。']);
    } catch (Exception $e) {
        error_log('First piece dimension delete failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
    }
}
