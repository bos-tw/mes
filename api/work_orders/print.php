<?php
/**
 * 工單管理 API - 列印標記
 *
 * 將指定工單標記為已列印。
 *
 * @endpoint POST /api/work_orders/print.php
 *
 * @auth 必須登入
 *
 * @input JSON Body:
 * | 參數 | 類型 | 必填 | 說明    |
 * |-----|------|-----|--------|
 * | id  | int  | 是  | 工單 ID |
 *
 * @logic 更新流程:
 * 1. 驗證工單存在性
 * 2. 設定 is_printed = 1
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "已標記為已列印。",
 *   "data": {"id": 1, "is_printed": 1}
 * }
 * ```
 *
 * @error 400 缺少工單 ID
 * @error 404 工單不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

/**
 * Work Orders Print API Endpoint
 *
 * POST - Mark work order as printed
 */

requireAuth();

requireMethod('POST');

$data = json_decode(file_get_contents('php://input'), true);
$workOrderId = $data['id'] ?? null;

if (!$workOrderId) {
    jsonResponse(['success' => false, 'message' => '缺少工單ID。'], 400);
}

$pdo = db();

try {
    // Check if work order exists
    $stmt = $pdo->prepare("SELECT id, is_printed FROM work_orders WHERE id = :id AND deleted_at IS NULL");
    $stmt->execute(['id' => $workOrderId]);
    $workOrder = $stmt->fetch();

    if (!$workOrder) {
        jsonResponse(['success' => false, 'message' => '工單不存在。'], 404);
    }

    // Update is_printed status
    $updateStmt = $pdo->prepare("UPDATE work_orders SET is_printed = 1 WHERE id = :id");
    $updateStmt->execute(['id' => $workOrderId]);

    jsonResponse([
        'success' => true,
        'message' => '已標記為已列印。',
        'data' => [
            'id' => (int)$workOrderId,
            'is_printed' => 1
        ]
    ]);
} catch (PDOException $e) {
    error_log('Work order print update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
