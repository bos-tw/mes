<?php
/**
 * 工單管理 API - 部分完工入庫（一般/拆分工單共用）
 *
 * @endpoint POST /api/work_orders/partial_receipt.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../inventory_items/helpers.php';
require_once __DIR__ . '/../number_sequences/helpers.php';

requireAuth();
requireMethod(['POST']);

$payload = getJsonInput();
$workOrderId = filter_var($payload['work_order_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$machineRunIdRaw = $payload['machine_run_id'] ?? null;
$machineRunId = null;
if ($machineRunIdRaw !== null && $machineRunIdRaw !== '') {
    $parsedMachineRunId = filter_var($machineRunIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($parsedMachineRunId === false) {
        jsonResponse(['success' => false, 'message' => '機台明細 ID 無效。'], 400);
    }
    $machineRunId = (int)$parsedMachineRunId;
}

if ($workOrderId === false) {
    jsonResponse(['success' => false, 'message' => '缺少或無效的工單 ID。'], 400);
}

function generatePartialReceiptNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'WOPR');
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $workOrderStmt = $pdo->prepare("
        SELECT
            wo.id AS work_order_id,
            wo.work_order_number,
            wo.work_order_type,
            wo.total_weight_kg AS expected_net_weight_kg,
            wo.weight_per_unit_g,
            wo.order_item_id,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            o.customer_id
        FROM work_orders wo
        JOIN order_items oi ON wo.order_item_id = oi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE wo.id = :work_order_id
          AND wo.deleted_at IS NULL
        FOR UPDATE
    ");
    $workOrderStmt->execute(['work_order_id' => $workOrderId]);
    $workOrder = $workOrderStmt->fetch(PDO::FETCH_ASSOC);

    if (!$workOrder) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '找不到指定工單。'], 404);
    }

    $isSplitWorkOrder = (string)($workOrder['work_order_type'] ?? 'normal') === 'split';
    if ($isSplitWorkOrder && $machineRunId === null) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '拆分工單部分入庫必須指定來源機台。'], 400);
    }
    if (!$isSplitWorkOrder && $machineRunId !== null) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '一般工單不可指定拆分機台來源。'], 400);
    }

    $run = null;
    if ($machineRunId !== null) {
        $runStmt = $pdo->prepare("
        SELECT
            womr.id AS machine_run_id,
            womr.work_order_id,
            womr.run_label,
            womr.status AS machine_run_status,
            womr.completed_net_weight_kg,
            womr.weight_per_unit_g,
            wo.work_order_number,
            wo.work_order_type,
            wo.total_weight_kg AS expected_net_weight_kg,
            wo.order_item_id,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            o.customer_id
        FROM work_order_machine_runs womr
        JOIN work_orders wo ON womr.work_order_id = wo.id
        JOIN order_items oi ON wo.order_item_id = oi.id
        JOIN orders o ON oi.order_id = o.id
        WHERE womr.id = :machine_run_id
          AND womr.work_order_id = :work_order_id
          AND womr.deleted_at IS NULL
        FOR UPDATE
    ");
        $runStmt->execute([
            'machine_run_id' => $machineRunId,
            'work_order_id' => $workOrderId,
        ]);
        $run = $runStmt->fetch(PDO::FETCH_ASSOC);

        if (!$run) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '找不到指定的拆分機台明細。'], 404);
        }

        if ((string)$run['machine_run_status'] !== 'completed') {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '只有已完成的機台頁籤可以部分入庫。'], 409);
        }
    }

    $receiptSummaryStmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(CASE WHEN :machine_run_id IS NOT NULL AND machine_run_id = :machine_run_id THEN net_weight_kg ELSE 0 END), 0) AS run_received_net_weight_kg,
            COALESCE(SUM(net_weight_kg), 0) AS work_order_received_net_weight_kg
        FROM work_order_partial_receipts
        WHERE work_order_id = :work_order_id
          AND receipt_status != 'reversed'
    ");
    $receiptSummaryStmt->execute([
        'machine_run_id' => $machineRunId,
        'work_order_id' => $workOrderId,
    ]);
    $receiptSummary = $receiptSummaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $workOrderReceivedNetWeightKg = round((float)($receiptSummary['work_order_received_net_weight_kg'] ?? 0), 2);
    $runReceivedNetWeightKg = round((float)($receiptSummary['run_received_net_weight_kg'] ?? 0), 2);

    $expectedNetWeightKg = round((float)($workOrder['expected_net_weight_kg'] ?? 0), 2);
    $unitWeightG = $run
        ? round((float)$run['weight_per_unit_g'], 3)
        : round((float)($workOrder['weight_per_unit_g'] ?? 0), 3);

    $remainingScopeNetWeightKg = $expectedNetWeightKg;
    if ($run) {
        $completedNetWeightKg = round((float)$run['completed_net_weight_kg'], 2);
        if ($completedNetWeightKg <= 0) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '此機台缺少完成淨重，無法入庫。'], 400);
        }
        $remainingScopeNetWeightKg = round($completedNetWeightKg - $runReceivedNetWeightKg, 2);
    } else {
        $remainingScopeNetWeightKg = round($expectedNetWeightKg - $workOrderReceivedNetWeightKg, 2);
    }

    if ($unitWeightG <= 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '工單缺少單支重，無法換算入庫支數。'], 400);
    }

    $requestedNetWeight = $payload['net_weight_kg'] ?? null;
    $receiptNetWeightKg = $requestedNetWeight === null || $requestedNetWeight === ''
        ? $remainingScopeNetWeightKg
        : round((float)$requestedNetWeight, 2);

    if ($receiptNetWeightKg <= 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '目前已無可入庫的剩餘淨重。'], 409);
    }

    if ($receiptNetWeightKg - $remainingScopeNetWeightKg > 0.0001) {
        $pdo->rollBack();
        $scopeName = $run ? '此機台' : '此工單';
        jsonResponse([
            'success' => false,
            'message' => "此次入庫 {$receiptNetWeightKg} kg 超過{$scopeName}剩餘可入庫 {$remainingScopeNetWeightKg} kg。",
        ], 409);
    }

    if (($workOrderReceivedNetWeightKg + $receiptNetWeightKg) - $expectedNetWeightKg > 0.0001) {
        $excess = round(($workOrderReceivedNetWeightKg + $receiptNetWeightKg) - $expectedNetWeightKg, 2);
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => "部分入庫後合計將超過主工單預期淨重 {$expectedNetWeightKg} kg，超出 {$excess} kg。",
        ], 409);
    }

    $calculatedUnits = round($receiptNetWeightKg * 1000 / $unitWeightG, 2);
    $inventoryNumber = generateInventoryNumber($pdo);
    $receiptNumber = generatePartialReceiptNumber($pdo);
    $currentEmployee = $_SESSION['employee'] ?? null;
    $currentUserId = $currentEmployee ? (int)$currentEmployee['id'] : null;
    $notes = trim((string)($payload['notes'] ?? ''));

    $inventoryStmt = $pdo->prepare("
        INSERT INTO inventory_items (
            screening_item_id, inventory_number, receipt_type, work_order_id,
            order_item_id, order_id, customer_id, customer_batch_number,
            total_good_units, total_defect_units,
            quantity_on_hand, quantity_allocated, quantity_reserved, quantity_shipped,
            net_weight_kg, gross_weight_kg, tool_weight_kg, weight_per_unit_g,
            quality_status, status, received_at, notes, created_by_employee_id
        ) VALUES (
            :screening_item_id, :inventory_number, 'partial', :work_order_id,
            :order_item_id, :order_id, :customer_id, :customer_batch_number,
            :total_good_units, 0,
            :quantity_on_hand, 0, 0, 0,
            :net_weight_kg, :gross_weight_kg, 0, :weight_per_unit_g,
            'qualified', 'in_stock', NOW(), :notes, :created_by_employee_id
        )
    ");
    $inventoryStmt->execute([
        'screening_item_id' => (int)$workOrder['screening_item_id'],
        'inventory_number' => $inventoryNumber,
        'work_order_id' => $workOrderId,
        'order_item_id' => (int)$workOrder['order_item_id'],
        'order_id' => (int)$workOrder['order_id'],
        'customer_id' => (int)$workOrder['customer_id'],
        'customer_batch_number' => $workOrder['customer_batch_number'],
        'total_good_units' => $calculatedUnits,
        'quantity_on_hand' => $calculatedUnits,
        'net_weight_kg' => $receiptNetWeightKg,
        'gross_weight_kg' => $receiptNetWeightKg,
        'weight_per_unit_g' => $unitWeightG,
        'notes' => $notes === '' ? (
            $run
                ? "拆分工單 {$workOrder['work_order_number']} / {$run['run_label']} 部分完工入庫"
                : "一般工單 {$workOrder['work_order_number']} 部分完工入庫"
        ) : $notes,
        'created_by_employee_id' => $currentUserId,
    ]);
    $inventoryItemId = (int)$pdo->lastInsertId();

    $partialReceiptStmt = $pdo->prepare("
        INSERT INTO work_order_partial_receipts (
            work_order_id, machine_run_id, inventory_item_id, receipt_number,
            net_weight_kg, weight_per_unit_g, calculated_units,
            receipt_status, notes, created_by_employee_id
        ) VALUES (
            :work_order_id, :machine_run_id, :inventory_item_id, :receipt_number,
            :net_weight_kg, :weight_per_unit_g, :calculated_units,
            'partial', :notes, :created_by_employee_id
        )
    ");
    $partialReceiptStmt->execute([
        'work_order_id' => $workOrderId,
        'machine_run_id' => $machineRunId,
        'inventory_item_id' => $inventoryItemId,
        'receipt_number' => $receiptNumber,
        'net_weight_kg' => $receiptNetWeightKg,
        'weight_per_unit_g' => $unitWeightG,
        'calculated_units' => $calculatedUnits,
        'notes' => $notes === '' ? null : $notes,
        'created_by_employee_id' => $currentUserId,
    ]);
    $partialReceiptId = (int)$pdo->lastInsertId();

    $transactionId = getNextInventoryTransactionId($pdo);
    $transactionStmt = $pdo->prepare("
        INSERT INTO inventory_transactions (
            id, inventory_item_id, order_id, order_item_id, work_order_id,
            ref_type, ref_id, direction, quantity, after_quantity,
            notes, created_by_employee_id
        ) VALUES (
            :id, :inventory_item_id, :order_id, :order_item_id, :work_order_id,
            'work_order_partial_receipt', :ref_id, 'inbound', :quantity, :after_quantity,
            :notes, :created_by_employee_id
        )
    ");
    $transactionStmt->execute([
        'id' => $transactionId,
        'inventory_item_id' => $inventoryItemId,
        'order_id' => (int)$workOrder['order_id'],
        'order_item_id' => (int)$workOrder['order_item_id'],
        'work_order_id' => $workOrderId,
        'ref_id' => $partialReceiptId,
        'quantity' => $calculatedUnits,
        'after_quantity' => $calculatedUnits,
        'notes' => ($run ? '拆分工單' : '一般工單') . "部分完工入庫 {$receiptNumber}，淨重 {$receiptNetWeightKg} kg / {$calculatedUnits} 支",
        'created_by_employee_id' => $currentUserId,
    ]);

    logAuditAction('Created partial work order receipt', 'work_orders', $workOrderId, [
        'machine_run_id' => $machineRunId,
        'partial_receipt_id' => $partialReceiptId,
        'inventory_item_id' => $inventoryItemId,
        'net_weight_kg' => $receiptNetWeightKg,
        'calculated_units' => $calculatedUnits,
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '部分完工入庫完成。',
        'data' => [
            'id' => $partialReceiptId,
            'receipt_number' => $receiptNumber,
            'inventory_item_id' => $inventoryItemId,
            'inventory_number' => $inventoryNumber,
            'work_order_id' => $workOrderId,
            'machine_run_id' => $machineRunId,
            'net_weight_kg' => $receiptNetWeightKg,
            'calculated_units' => $calculatedUnits,
        ],
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Create partial work order receipt failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($e, '部分完工入庫失敗，請稍後重試。'),
    ], 500);
}
