<?php
/**
 * 庫存品項 API - 刪除
 *
 * 軟刪除指定庫存品項。
 *
 * @endpoint DELETE /api/inventory_items/delete.php?id={int}
 *
 * @auth 必須登入
 *
 * @input 參數 (GET 或 JSON):
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 庫存品項 ID |
 *
 * @logic 刪除前檢查:
 * - 使用 canDeleteInventoryItem() 檢查是否可刪除
 * - 如有未完成的異動記錄則無法刪除
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "庫存品項刪除成功。"
 * }
 * ```
 *
 * @error 400 ID 無效 / 無法刪除（有關聯資料）
 * @error 404 庫存品項不存在
 *
 * @note 此操作為軟刪除，設定 deleted_at 欄位
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
require_once __DIR__ . '/helpers.php';

/**
 * Inventory Item Delete API Endpoint
 *
 * DELETE - Soft delete inventory item
 */

requireAuth();

$pdo = db();

requireMethod('DELETE');

$data = getJsonInput();
$id = (int)($data['id'] ?? $_GET['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
}

// Check if item exists
$item = getInventoryItemDetails($pdo, $id);
if (!$item) {
    jsonResponse(['success' => false, 'message' => '庫存項目不存在。'], 404);
}

// Check if can delete
$canDelete = canDeleteInventoryItem($pdo, $id);
if (!$canDelete['can_delete']) {
    $workflowGuard = getWorkflowDeleteAssessment($pdo, 'inventory_items', $id);
    jsonResponse([
        'success' => false,
        'message' => $canDelete['reason'],
        'workflow_guard' => $workflowGuard,
    ], 409);
}

try {
    // Soft delete
    $stmt = $pdo->prepare("
        UPDATE inventory_items
        SET deleted_at = NOW(), delete_token = id
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);

    if ($stmt->rowCount() === 0) {
        jsonResponse(['success' => false, 'message' => '庫存項目不存在或已被刪除。'], 404);
    }

    jsonResponse([
        'success' => true,
        'message' => '庫存項目刪除成功。',
        'data' => [
            'id' => $id,
            'work_order_id' => isset($item['work_order_id']) ? (int)$item['work_order_id'] : null,
            'order_item_id' => isset($item['order_item_id']) ? (int)$item['order_item_id'] : null,
        ],
    ]);

} catch (Throwable $e) {
    error_log('Inventory item delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
