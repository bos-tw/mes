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

    // 檢查是否有關聯資料
    $relatedTables = [
        ['table' => 'production_records', 'column' => 'work_order_id', 'label' => '生產紀錄'],
        ['table' => 'work_order_images', 'column' => 'work_order_id', 'label' => '工單圖片', 'softDelete' => true],
        ['table' => 'work_order_first_piece_dimensions', 'column' => 'work_order_id', 'label' => '首件尺寸'],
    ];
    $relatedLabels = [];
    foreach ($relatedTables as $rel) {
        $softDeleteCondition = isset($rel['softDelete']) && $rel['softDelete'] ? ' AND deleted_at IS NULL' : '';
        $checkRelStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?{$softDeleteCondition}");
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
