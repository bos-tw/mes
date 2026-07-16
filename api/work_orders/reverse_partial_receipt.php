<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../inventory_items/helpers.php';
require_once __DIR__ . '/../number_sequences/helpers.php';
require_once __DIR__ . '/../rescreen_batches/helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();
requireMethod(['POST']);

$employeePermissions = (array)(($_SESSION['employee']['permissions'] ?? []));
if ($employeePermissions !== [] && !hasAnyPermission(['work_orders.reverse_partial_receipt', 'manage_work_orders'])) {
    jsonResponse(['success' => false, 'message' => '您沒有沖銷工單部分入庫的權限。'], 403);
}

$payload = getJsonInput();
$partialReceiptId = filter_var($payload['partial_receipt_id'] ?? ($payload['id'] ?? null), FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);

if ($partialReceiptId === false) {
    jsonResponse(['success' => false, 'message' => '缺少或無效的部分入庫 ID。'], 400);
}

$reverseReason = trim((string)($payload['reverse_reason'] ?? ''));
if ($reverseReason === '') {
    jsonResponse(['success' => false, 'message' => '請填寫沖銷原因。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $workflowGuard = getWorkflowActionAssessment($pdo, 'work_order_partial_receipts', 'reverse', (int)$partialReceiptId);
    if (!($workflowGuard['allowed'] ?? false)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => $workflowGuard['message'] ?? '此部分入庫目前不可沖銷。',
            'workflow_guard' => $workflowGuard,
        ], 409);
    }

    $receiptStmt = $pdo->prepare("
        SELECT
            wopr.*,
            wo.work_order_number,
            wo.completed_at,
            ii.inventory_number,
            ii.quantity_on_hand,
            ii.order_id,
            ii.order_item_id,
            ii.status AS inventory_status
        FROM work_order_partial_receipts wopr
        JOIN work_orders wo ON wo.id = wopr.work_order_id
        LEFT JOIN inventory_items ii ON ii.id = wopr.inventory_item_id
        WHERE wopr.id = :id
        LIMIT 1
        FOR UPDATE
    ");
    $receiptStmt->execute(['id' => $partialReceiptId]);
    $receipt = $receiptStmt->fetch(PDO::FETCH_ASSOC);
    if (!$receipt) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定的部分入庫紀錄。'], 404);
    }

    $inventoryItemId = (int)($receipt['inventory_item_id'] ?? 0);
    if ($inventoryItemId <= 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '此部分入庫缺少關聯庫存，無法沖銷。'], 409);
    }

    $currentEmployee = $_SESSION['employee'] ?? null;
    $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;

    $deleteInventoryStmt = $pdo->prepare("
        UPDATE inventory_items
        SET
            quantity_on_hand = 0,
            quantity_allocated = 0,
            quantity_reserved = 0,
            status = 'void',
            notes = CONCAT(
                COALESCE(notes, ''),
                CASE WHEN COALESCE(notes, '') = '' THEN '' ELSE '\n' END,
                '部分入庫沖銷：',
                :reverse_reason
            ),
            deleted_at = NOW(),
            delete_token = id
        WHERE id = :id
          AND deleted_at IS NULL
    ");
    $deleteInventoryStmt->execute([
        'id' => $inventoryItemId,
        'reverse_reason' => mb_substr($reverseReason, 0, 180),
    ]);

    $reverseReceiptStmt = $pdo->prepare("
        UPDATE work_order_partial_receipts
        SET
            receipt_status = 'reversed',
            reversed_at = NOW(),
            reversed_by_employee_id = :employee_id,
            reverse_reason = :reverse_reason
        WHERE id = :id
          AND receipt_status <> 'reversed'
    ");
    $reverseReceiptStmt->execute([
        'employee_id' => $currentUserId,
        'reverse_reason' => $reverseReason,
        'id' => $partialReceiptId,
    ]);

    $transactionStmt = $pdo->prepare("
        INSERT INTO inventory_transactions (
            inventory_item_id, order_id, order_item_id, work_order_id,
            ref_type, ref_id, direction, quantity, after_quantity,
            notes, created_by_employee_id
        ) VALUES (
            :inventory_item_id, :order_id, :order_item_id, :work_order_id,
            'work_order_partial_receipt_reverse', :ref_id, 'outbound', :quantity, 0,
            :notes, :created_by_employee_id
        )
    ");
    $transactionStmt->execute([
        'inventory_item_id' => $inventoryItemId,
        'order_id' => isset($receipt['order_id']) ? (int)$receipt['order_id'] : null,
        'order_item_id' => isset($receipt['order_item_id']) ? (int)$receipt['order_item_id'] : null,
        'work_order_id' => (int)$receipt['work_order_id'],
        'ref_id' => (int)$partialReceiptId,
        'quantity' => (float)round((float)($receipt['calculated_units'] ?? 0), 0),
        'notes' => '沖銷部分入庫 ' . ((string)($receipt['receipt_number'] ?? '')) . '：' . mb_substr($reverseReason, 0, 180),
        'created_by_employee_id' => $currentUserId,
    ]);

    appendWorkOrderOperationLog($pdo, (int)$receipt['work_order_id'], 'reverse_partial_receipt', '沖銷部分入庫', [
        'related_table' => 'work_order_partial_receipts',
        'related_id' => (int)$partialReceiptId,
        'notes' => $reverseReason,
        'payload' => [
            'partial_receipt_id' => (int)$partialReceiptId,
            'receipt_number' => $receipt['receipt_number'] ?? null,
            'inventory_item_id' => $inventoryItemId,
            'inventory_number' => $receipt['inventory_number'] ?? null,
            'net_weight_kg' => round((float)($receipt['net_weight_kg'] ?? 0), 2),
            'calculated_units' => (float)round((float)($receipt['calculated_units'] ?? 0), 0),
        ],
    ]);

    logAuditAction('Reversed partial work order receipt', 'work_orders', (int)$receipt['work_order_id'], [
        'partial_receipt_id' => (int)$partialReceiptId,
        'receipt_number' => $receipt['receipt_number'] ?? null,
        'inventory_item_id' => $inventoryItemId,
        'inventory_number' => $receipt['inventory_number'] ?? null,
        'reverse_reason' => $reverseReason,
    ]);

    syncRescreenBatchFromWorkOrder($pdo, (int)$receipt['work_order_id']);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '部分入庫已沖銷，關聯庫存已作廢。',
        'data' => [
            'id' => (int)$partialReceiptId,
            'work_order_id' => (int)$receipt['work_order_id'],
            'inventory_item_id' => $inventoryItemId,
            'inventory_number' => $receipt['inventory_number'] ?? null,
            'receipt_number' => $receipt['receipt_number'] ?? null,
            'receipt_status' => 'reversed',
        ],
        'workflow_guard' => $workflowGuard,
    ]);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Reverse partial work order receipt failed: ' . $exception->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '部分入庫沖銷失敗，請稍後重試。'),
    ], 500);
}
