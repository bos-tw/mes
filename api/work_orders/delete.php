<?php
/**
 * 工單管理 API - 刪除
 *
 * 軟刪除指定工單（設定 deleted_at 欄位）。
 *
 * @endpoint DELETE /api/work_orders/delete.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 工單 ID |
 *
 * @logic 刪除流程:
 * 1. 驗證工單存在性
 * 2. 設定 deleted_at = CURRENT_TIMESTAMP
 * 3. 記錄稽核日誌
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "工單刪除成功。"
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 工單不存在
 *
 * @note 此操作為軟刪除，資料仍保留在資料庫中
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

/**
 * Work Order Delete API Endpoint
 *
 * DELETE - Soft delete work order
 */

requireAuth();

requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    // Check if work order exists
    $checkStmt = $pdo->prepare("SELECT id, work_order_number FROM work_orders WHERE id = :id AND deleted_at IS NULL");
    $checkStmt->execute(['id' => $id]);
    $workOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);
    if (!$workOrder) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }

    // Auto-generated card-number rows are planning placeholders, not production history.
    // Clean up empty shells first, then only block deletion when real related data exists.
    $meaningfulProductionSql = "
        `weight_kg` IS NOT NULL
        OR (`production_date` IS NOT NULL AND CAST(`production_date` AS CHAR) <> '0000-00-00')
        OR (`production_time` IS NOT NULL AND CAST(`production_time` AS CHAR) <> '')
        OR `machine_id` IS NOT NULL
        OR TRIM(COALESCE(`notes`, '')) <> ''
    ";
    $cleanupProductionStmt = $pdo->prepare("
        DELETE FROM production_records
        WHERE work_order_id = ? AND NOT ({$meaningfulProductionSql})
    ");
    $cleanupProductionStmt->execute([$id]);

    $meaningfulFirstPieceSql = "
        `head_height` IS NOT NULL
        OR `head_width` IS NOT NULL
        OR `length` IS NOT NULL
        OR `thread_outer_diameter` IS NOT NULL
        OR `washer_diameter` IS NOT NULL
        OR `outer_diameter` IS NOT NULL
        OR `hole_diameter` IS NOT NULL
        OR `thickness` IS NOT NULL
        OR (`measured_at` IS NOT NULL AND CAST(`measured_at` AS CHAR) <> '0000-00-00 00:00:00')
        OR `measured_by_employee_id` IS NOT NULL
        OR TRIM(COALESCE(`notes`, '')) <> ''
    ";
    $cleanupFirstPieceStmt = $pdo->prepare("
        DELETE FROM work_order_first_piece_dimensions
        WHERE work_order_id = ? AND NOT ({$meaningfulFirstPieceSql})
    ");
    $cleanupFirstPieceStmt->execute([$id]);

    // 檢查是否有真正的關聯資料
    $relatedChecks = [
        [
            'label' => '生產紀錄',
            'sql' => "SELECT COUNT(*) FROM production_records WHERE work_order_id = ? AND ({$meaningfulProductionSql})",
        ],
        [
            'label' => '工單圖片',
            'sql' => 'SELECT COUNT(*) FROM work_order_images WHERE work_order_id = ? AND deleted_at IS NULL',
        ],
        [
            'label' => '首件尺寸',
            'sql' => "SELECT COUNT(*) FROM work_order_first_piece_dimensions WHERE work_order_id = ? AND ({$meaningfulFirstPieceSql})",
        ],
    ];
    $relatedLabels = [];
    foreach ($relatedChecks as $rel) {
        $checkRelStmt = $pdo->prepare($rel['sql']);
        $checkRelStmt->execute([$id]);
        if ((int)$checkRelStmt->fetchColumn() > 0) {
            $relatedLabels[] = $rel['label'];
        }
    }
    if (!empty($relatedLabels)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '此工單有相關的' . implode('、', $relatedLabels) . '資料，請先刪除相關資料後再刪除工單。',
        ], 409);
    }

    // Soft delete
    $stmt = $pdo->prepare("UPDATE work_orders SET deleted_at = CURRENT_TIMESTAMP, delete_token = id WHERE id = :id");
    $stmt->execute(['id' => $id]);

    // Log audit
    logAuditAction('Soft deleted work order', 'WorkOrders', $id, null);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '工單刪除成功。'
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    logAuditAction('Error: 刪除工單失敗。', 'WorkOrders', $id, null);
    error_log('Work order delete failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '刪除工單失敗，請稍後重試。')
    ], 500);
}
