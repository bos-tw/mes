<?php
/**
 * 工單圖片管理 API - 更新端點
 *
 * 提供工單圖片詳細資料的更新功能（描述、排序、圖片類型）。
 *
 * @endpoint POST /api/work_order_images/update.php
 *
 * @auth 必須登入
 * @table work_order_images
 *
 * @input POST (JSON body)
 * | 參數        | 類型   | 必填 | 說明 |
 * |-------------|--------|------|------|
 * | id          | int    | Y    | 圖片 ID |
 * | description | string | N    | 描述 |
 * | sort_order  | int    | N    | 排序順序 |
 * | image_type  | string | N    | 圖片類型 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "圖片資料已更新。",
 *   "data": {
 *     "id": 1,
 *     "description": "更新後的描述",
 *     "sort_order": 2,
 *     "image_type": "defect"
 *   }
 * }
 * ```
 *
 * @error 400 無效的圖片 ID / 沒有需要更新的欄位
 * @error 404 找不到該圖片
 * @error 405 不支援的請求方法
 * @error 500 系統發生錯誤
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('POST');

handleUpdateImage(db());

function handleUpdateImage(PDO $pdo): void
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

    // Prepare update fields
    $fields = [];
    $params = ['id' => $id];

    if (isset($input['description'])) {
        $fields[] = "description = :description";
        $params['description'] = trim($input['description']);
    }

    if (isset($input['sort_order'])) {
        $fields[] = "sort_order = :sort_order";
        $params['sort_order'] = (int)$input['sort_order'];
    }

    if (isset($input['image_type'])) {
        $fields[] = "image_type = :image_type";
        $params['image_type'] = trim($input['image_type']);
    }

    if (empty($fields)) {
        jsonResponse(['success' => false, 'message' => '沒有提供要更新的欄位。'], 400);
    }

    try {
        $pdo->beginTransaction();

        $sql = "UPDATE work_order_images SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        logAuditAction('Updated work order image', 'work_order_images', $id, $params);

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => '圖片資訊更新成功。']);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Update image error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}
