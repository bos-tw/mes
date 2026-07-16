<?php
/**
 * 退貨單 API - 更新
 *
 * @endpoint PUT /api/return_orders/update.php?id={id}
 *
 * @auth 必須登入
 * @table return_orders
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明       |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 退貨單 ID  |
 *
 * @input Body Parameters (JSON):
 * | 參數名稱                  | 類型   | 必填 | 說明                |
 * |--------------------------|--------|------|---------------------|
 * | return_date              | date   | 否   | 退貨日期            |
 * | return_reason            | string | 否   | 退貨原因            |
 * | processing_status        | string | 否   | 處理狀態            |
 * | notes                    | string | 否   | 備註                |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "退貨單已更新。"
 * }
 *
 * @error 400 ID 無效 / 無可更新欄位
 * @error 404 退貨單不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('PUT');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數: id。'], 400);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
}

$pdo = db();

// 檢查退貨單是否存在
$order = getReturnOrderDetails($pdo, $id);
if (!$order) {
    jsonResponse(['success' => false, 'message' => '找不到指定的退貨單。'], 404);
}

// 驗證資料
$errors = validateReturnOrderData($input, true);
if (!empty($errors)) {
    jsonResponse(['success' => false, 'message' => implode(' ', $errors)], 400);
}

$oldProcessingStatus = (string)($order['processing_status'] ?? 'pending');
$newProcessingStatus = (string)($input['processing_status'] ?? $oldProcessingStatus);
$allowedProcessingStatuses = ['pending', 'processing', 'completed', 'rejected'];
if (!in_array($newProcessingStatus, $allowedProcessingStatuses, true)) {
    jsonResponse(['success' => false, 'message' => '退貨處理狀態無效。'], 422);
}
if (!canTransitionReturnOrderStatus($oldProcessingStatus, $newProcessingStatus)) {
    jsonResponse([
        'success' => false,
        'message' => "不允許將退貨單由 {$oldProcessingStatus} 變更為 {$newProcessingStatus}。",
        'current_status' => $oldProcessingStatus,
        'requested_status' => $newProcessingStatus,
        'allowed_status_transitions' => getAllowedReturnOrderTransitions($oldProcessingStatus),
    ], 409);
}
if ($newProcessingStatus === 'completed' && $oldProcessingStatus !== 'completed') {
    $itemCountStmt = $pdo->prepare('SELECT COUNT(*) FROM return_order_items WHERE return_order_id = ?');
    $itemCountStmt->execute([$id]);
    if ((int)$itemCountStmt->fetchColumn() === 0) {
        jsonResponse(['success' => false, 'message' => '退貨單沒有品項，無法標記為已完成。'], 409);
    }
}

// 準備更新欄位
$updateFields = [];
$params = [];

$allowedFields = [
    'return_date', 'return_reason', 'processing_status',
    'status_lookup_id', 'notes'
];

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $input)) {
        $value = $input[$field];
        if ($value === '') {
            $value = null;
        }
        $updateFields[] = "$field = :$field";
        $params[$field] = $value;
    }
}

if (empty($updateFields)) {
    jsonResponse(['success' => false, 'message' => '沒有要更新的欄位。'], 400);
}

$updateFields[] = "updated_at = NOW()";
$params['id'] = $id;

try {
    $pdo->beginTransaction();
    $lockStmt = $pdo->prepare('SELECT processing_status FROM return_orders WHERE id = :id AND deleted_at IS NULL FOR UPDATE');
    $lockStmt->execute(['id' => $id]);
    $lockedStatus = $lockStmt->fetchColumn();
    if ($lockedStatus === false) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的退貨單。'], 404);
    }
    if ((string)$lockedStatus !== $oldProcessingStatus) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '退貨單狀態已被其他操作更新，請重新載入後再試。',
            'current_status' => (string)$lockedStatus,
        ], 409);
    }

    $sql = "UPDATE return_orders SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    logAuditAction('更新退貨單', 'ReturnOrders', $id, $input);

    recordWorkflowStatusTransition(
        $pdo,
        'return_orders',
        $id,
        $oldProcessingStatus,
        $newProcessingStatus,
        isset($_SESSION['employee']['id']) ? (int)$_SESSION['employee']['id'] : null,
        trim((string)($input['transition_reason'] ?? $input['status_reason'] ?? $input['notes'] ?? '')) ?: null
    );

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '退貨單已更新。',
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Return order update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新退貨單失敗，請稍後重試。')], 500);
}
