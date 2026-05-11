<?php
/**
 * 首件尺寸管理 API - 更新端點
 *
 * 提供首件尺寸紀錄的更新功能。
 *
 * @endpoint POST /api/work_order_first_piece_dimensions/update.php
 *
 * @auth 必須登入
 * @table work_order_first_piece_dimensions
 *
 * @input POST (JSON body)
 * | 參數                    | 類型    | 必填 | 說明 |
 * |-------------------------|---------|------|------|
 * | id                      | int     | Y    | 紀錄 ID |
 * | measured_at             | string  | N    | 量測時間 |
 * | measured_by_employee_id | int     | N    | 量測人員 ID |
 * | head_height             | decimal | N    | 頭高 |
 * | head_width              | decimal | N    | 頭寬 |
 * | length                  | decimal | N    | 長度 |
 * | thread_outer_diameter   | decimal | N    | 螺牙外徑 |
 * | washer_diameter         | decimal | N    | 墨片徑 |
 * | outer_diameter          | decimal | N    | 外徑 |
 * | hole_diameter           | decimal | N    | 孔徑 |
 * | thickness               | decimal | N    | 厚度 |
 * | notes                   | string  | N    | 備註 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "更新成功。"
 * }
 * ```
 *
 * @error 400 無效的 ID / 沒有需要更新的欄位
 * @error 404 找不到該紀錄
 * @error 405 不支援的請求方法
 * @error 500 更新失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('POST');

$pdo = db();
handleUpdate($pdo);

function handleUpdate(PDO $pdo): void
{
    $input = getJsonInput();
    if (empty($input)) {
        $input = $_POST;
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
    }

    // Check if record exists
    $stmt = $pdo->prepare("SELECT id FROM work_order_first_piece_dimensions WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '找不到該紀錄。'], 404);
    }

    // Prepare data
    $fields = [
        'measured_at', 'measured_by_employee_id', 'notes',
        'head_height', 'head_width', 'length', 'thread_outer_diameter',
        'washer_diameter', 'outer_diameter', 'hole_diameter', 'thickness'
    ];

    $data = [];
    $setClauses = [];

    foreach ($fields as $field) {
        if (array_key_exists($field, $input)) {
            $val = $input[$field];
            if ($val === '') {
                $val = null;
            }
            $data[$field] = $val;
            $setClauses[] = "$field = :$field";
        }
    }

    if (empty($data)) {
        jsonResponse(['success' => true, 'message' => '沒有變更。']);
    }

    $data['id'] = $id;
    $setSql = implode(', ', $setClauses);

    try {
        $sql = "UPDATE work_order_first_piece_dimensions SET $setSql WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($data);

        logAuditAction('Update First Piece Dimension', 'work_order_first_piece_dimensions', $id, $data);

        jsonResponse(['success' => true, 'message' => '更新成功。']);
    } catch (Exception $e) {
        error_log('First piece dimension update failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
    }
}
