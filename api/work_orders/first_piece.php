<?php
/**
 * 機台首件尺寸檢驗（每台可多輪，只新增、不覆蓋）。
 *
 * @endpoint POST /api/work_orders/first_piece.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();
requireMethod('POST');

$pdo = db();
$payload = readWorkOrderPayload();

try {
    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();
    $workOrderId = workOrderFlowPositiveId($payload['work_order_id'] ?? null, '工單ID');
    $machineRunId = workOrderFlowPositiveId($payload['machine_run_id'] ?? null, '機台執行ID');
    $run = lockWorkOrderMachineRun($pdo, $workOrderId, $machineRunId);
    if ($run['status'] === 'completed') {
        throw new WorkOrderFlowException('已完成機台不可新增首件檢驗。', 409);
    }

    $inspectionResult = strtolower(trim((string)($payload['inspection_result'] ?? '')));
    if (!in_array($inspectionResult, ['passed', 'failed'], true)) {
        throw new WorkOrderFlowException('首件檢驗結果必須為合格或不合格。', 400);
    }
    $dimensionFields = [
        'head_height',
        'head_width',
        'length',
        'thread_outer_diameter',
        'washer_diameter',
        'outer_diameter',
        'hole_diameter',
        'thickness',
    ];
    $dimensions = [];
    $hasMeasurement = false;
    foreach ($dimensionFields as $field) {
        $value = $payload[$field] ?? null;
        if ($value === null || $value === '') {
            $dimensions[$field] = null;
            continue;
        }
        $number = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($number === false || $number < 0) {
            throw new WorkOrderFlowException('首件尺寸必須為非負數。', 400, ['field' => $field]);
        }
        $dimensions[$field] = round((float)$number, 3);
        $hasMeasurement = true;
    }
    if (!$hasMeasurement) {
        throw new WorkOrderFlowException('請至少輸入一項首件尺寸。', 400);
    }

    $roundStmt = $pdo->prepare("
        SELECT COALESCE(MAX(inspection_round), 0) + 1
        FROM work_order_first_piece_dimensions
        WHERE work_order_id = :work_order_id
          AND machine_run_id = :machine_run_id
        FOR UPDATE
    ");
    $roundStmt->execute([
        'work_order_id' => $workOrderId,
        'machine_run_id' => $machineRunId,
    ]);
    $inspectionRound = (int)$roundStmt->fetchColumn();
    $measuredAt = normalizeWorkOrderDateTimeValue($payload['measured_at'] ?? null) ?? date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        INSERT INTO work_order_first_piece_dimensions (
            work_order_id, stage_id, machine_run_id, inspection_round, inspection_result,
            head_height, head_width, length, thread_outer_diameter,
            washer_diameter, outer_diameter, hole_diameter, thickness,
            measured_at, measured_by_employee_id, notes
        ) VALUES (
            :work_order_id, :stage_id, :machine_run_id, :inspection_round, :inspection_result,
            :head_height, :head_width, :length, :thread_outer_diameter,
            :washer_diameter, :outer_diameter, :hole_diameter, :thickness,
            :measured_at, :measured_by_employee_id, :notes
        )
    ");
    $stmt->execute($dimensions + [
        'work_order_id' => $workOrderId,
        'stage_id' => (int)$run['stage_id'],
        'machine_run_id' => $machineRunId,
        'inspection_round' => $inspectionRound,
        'inspection_result' => $inspectionResult,
        'measured_at' => $measuredAt,
        'measured_by_employee_id' => $employeeId,
        'notes' => nullableFirstPieceText($payload['notes'] ?? null),
    ]);
    $firstPieceId = (int)$pdo->lastInsertId();

    appendWorkOrderOperationLog($pdo, $workOrderId, 'record_machine_first_piece', '記錄機台首件尺寸', [
        'related_table' => 'work_order_first_piece_dimensions',
        'related_id' => $firstPieceId,
        'payload' => [
            'machine_run_id' => $machineRunId,
            'inspection_round' => $inspectionRound,
            'inspection_result' => $inspectionResult,
        ],
        'created_by_employee_id' => $employeeId,
    ]);
    logAuditAction('Recorded work order machine first piece', 'work_order_first_piece_dimensions', $firstPieceId, [
        'work_order_id' => $workOrderId,
        'machine_run_id' => $machineRunId,
        'inspection_round' => $inspectionRound,
        'inspection_result' => $inspectionResult,
    ]);

    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => $inspectionResult === 'passed' ? '首件檢驗已記錄為合格。' : '首件檢驗已記錄為不合格。',
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ], 201);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '儲存首件檢驗失敗，請稍後重試。');
}

function nullableFirstPieceText($value): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, 500);
}
