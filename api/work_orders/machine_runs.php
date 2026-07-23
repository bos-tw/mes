<?php
/**
 * 工單階段機台穩定 ID CRUD。
 *
 * @endpoint POST   /api/work_orders/machine_runs.php
 * @endpoint PATCH  /api/work_orders/machine_runs.php?id={machine_run_id}
 * @endpoint DELETE /api/work_orders/machine_runs.php?id={machine_run_id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();

$pdo = db();
$method = requireMethod(['POST', 'PATCH', 'DELETE']);
$payload = readWorkOrderPayload();

try {
    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();

    if ($method === 'POST') {
        $workOrderId = workOrderFlowPositiveId($payload['work_order_id'] ?? null, '工單ID');
        $stageId = workOrderFlowPositiveId($payload['stage_id'] ?? null, '篩分階段ID');
        $stageStmt = $pdo->prepare("
            SELECT stage.*, wo.total_units, wo.total_weight_kg, wo.weight_per_unit_g
            FROM work_order_stages stage
            JOIN work_orders wo ON wo.id = stage.work_order_id
            WHERE stage.id = :stage_id
              AND stage.work_order_id = :work_order_id
              AND wo.deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $stageStmt->execute(['stage_id' => $stageId, 'work_order_id' => $workOrderId]);
        $stage = $stageStmt->fetch(PDO::FETCH_ASSOC);
        if (!$stage) {
            throw new WorkOrderFlowException('找不到指定的工單階段。', 404);
        }
        if (in_array($stage['status'], ['completed', 'cancelled'], true)) {
            throw new WorkOrderFlowException('已完成或取消的階段不可加開機台。', 409);
        }

        $machineId = workOrderFlowPositiveId($payload['machine_id'] ?? null, '機台');
        $plannedUnits = workOrderFlowNonNegativeNumber($payload['planned_units'] ?? 0, '預計處理支數');
        $unitWeight = workOrderFlowNonNegativeNumber(
            $payload['weight_per_unit_g'] ?? $stage['weight_per_unit_g'] ?? 0,
            '單支重',
            4
        );
        if ($unitWeight <= 0) {
            throw new WorkOrderFlowException('單支重必須大於0。', 400);
        }
        $plannedWeight = array_key_exists('planned_net_weight_kg', $payload)
            ? workOrderFlowNonNegativeNumber($payload['planned_net_weight_kg'], '預計淨重', 3)
            : round($plannedUnits * $unitWeight / 1000, 3);

        validateWorkOrderMachineAllocation(
            $pdo,
            $workOrderId,
            $stageId,
            null,
            $plannedUnits,
            $machineId,
            normalizeWorkOrderDateTimeValue($payload['scheduled_start_date'] ?? null),
            normalizeWorkOrderDateTimeValue($payload['scheduled_end_date'] ?? null),
            $stage
        );

        $sequenceStmt = $pdo->prepare("
            SELECT COALESCE(MAX(machine_sequence), 0) + 1
            FROM work_order_machine_runs
            WHERE stage_id = :stage_id
              AND deleted_at IS NULL
        ");
        $sequenceStmt->execute(['stage_id' => $stageId]);
        $sequence = (int)$sequenceStmt->fetchColumn();
        $runLabel = trim((string)($payload['run_label'] ?? ''));
        if ($runLabel === '') {
            $runLabel = '機台' . $sequence;
        }

        $insertStmt = $pdo->prepare("
            INSERT INTO work_order_machine_runs (
                work_order_id, stage_id, run_label, machine_id, machine_sequence,
                assigned_employee_id, calibration_employee_id,
                scheduled_start_date, scheduled_end_date,
                quantity_to_produce, screening_speed,
                planned_net_weight_kg, completed_net_weight_kg,
                weight_per_unit_g, planned_units, completed_units,
                status, notes, created_by_employee_id
            ) VALUES (
                :work_order_id, :stage_id, :run_label, :machine_id, :machine_sequence,
                :assigned_employee_id, :calibration_employee_id,
                :scheduled_start_date, :scheduled_end_date,
                :quantity_to_produce, :screening_speed,
                :planned_net_weight_kg, 0,
                :weight_per_unit_g, :planned_units, 0,
                :status, :notes, :created_by
            )
        ");
        $status = !empty($payload['scheduled_start_date']) ? 'scheduled' : 'pending';
        $insertStmt->execute([
            'work_order_id' => $workOrderId,
            'stage_id' => $stageId,
            'run_label' => mb_substr($runLabel, 0, 100),
            'machine_id' => $machineId,
            'machine_sequence' => $sequence,
            'assigned_employee_id' => nullableWorkOrderFlowId($payload['assigned_employee_id'] ?? null),
            'calibration_employee_id' => nullableWorkOrderFlowId($payload['calibration_employee_id'] ?? null),
            'scheduled_start_date' => normalizeWorkOrderDateTimeValue($payload['scheduled_start_date'] ?? null),
            'scheduled_end_date' => normalizeWorkOrderDateTimeValue($payload['scheduled_end_date'] ?? null),
            'quantity_to_produce' => $plannedUnits,
            'screening_speed' => nullableWorkOrderFlowText($payload['screening_speed'] ?? null, 50),
            'planned_net_weight_kg' => $plannedWeight,
            'weight_per_unit_g' => $unitWeight,
            'planned_units' => $plannedUnits,
            'status' => $status,
            'notes' => nullableWorkOrderFlowText($payload['notes'] ?? null),
            'created_by' => $employeeId,
        ]);
        $machineRunId = (int)$pdo->lastInsertId();

        appendWorkOrderOperationLog($pdo, $workOrderId, 'add_machine_run', '加開機台', [
            'related_table' => 'work_order_machine_runs',
            'related_id' => $machineRunId,
            'payload' => ['stage_id' => $stageId, 'machine_id' => $machineId],
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Added work order machine run', 'work_order_machine_runs', $machineRunId, [
            'work_order_id' => $workOrderId,
            'stage_id' => $stageId,
        ]);
        $message = '機台新增成功。';
        $statusCode = 201;
    } else {
        $machineRunId = workOrderFlowPositiveId($_GET['id'] ?? $payload['id'] ?? null, '機台執行ID');
        $runStmt = $pdo->prepare("
            SELECT run.*, stage.status AS stage_status, stage.stage_type,
                   wo.total_units, wo.total_weight_kg
            FROM work_order_machine_runs run
            JOIN work_order_stages stage ON stage.id = run.stage_id
            JOIN work_orders wo ON wo.id = run.work_order_id
            WHERE run.id = :id
              AND run.deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $runStmt->execute(['id' => $machineRunId]);
        $run = $runStmt->fetch(PDO::FETCH_ASSOC);
        if (!$run) {
            throw new WorkOrderFlowException('找不到指定的機台執行。', 404);
        }
        $workOrderId = (int)$run['work_order_id'];

        $historyStmt = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM work_order_machine_results WHERE machine_run_id = :result_run_id) AS result_count,
                (SELECT COUNT(*) FROM production_records
                 WHERE machine_run_id = :all_record_run_id) AS record_count,
                (SELECT COUNT(*) FROM production_records
                 WHERE machine_run_id = :record_run_id
                   AND (actual_gross_weight_kg IS NOT NULL OR card_locked_at IS NOT NULL)) AS locked_card_count
        ");
        $historyStmt->execute([
            'result_run_id' => $machineRunId,
            'all_record_run_id' => $machineRunId,
            'record_run_id' => $machineRunId,
        ]);
        $history = $historyStmt->fetch(PDO::FETCH_ASSOC) ?: [];

        if ($method === 'DELETE') {
            if ((int)($history['result_count'] ?? 0) > 0 || (int)($history['locked_card_count'] ?? 0) > 0) {
                throw new WorkOrderFlowException('此機台已有實際生產、秤重或結果資料，只能保留歷史，不可取消。', 409);
            }
            if ($run['status'] === 'completed') {
                throw new WorkOrderFlowException('已完成機台不可取消。', 409);
            }
            $pdo->prepare("
                UPDATE work_order_machine_runs
                SET status = 'cancelled',
                    deleted_at = COALESCE(deleted_at, NOW()),
                    notes = CONCAT_WS(CHAR(10), NULLIF(notes, ''), :cancel_note)
                WHERE id = :id
            ")->execute([
                'cancel_note' => '取消原因：' . (nullableWorkOrderFlowText($payload['reason'] ?? null) ?? '使用者取消'),
                'id' => $machineRunId,
            ]);
            appendWorkOrderOperationLog($pdo, $workOrderId, 'cancel_machine_run', '取消機台', [
                'related_table' => 'work_order_machine_runs',
                'related_id' => $machineRunId,
                'notes' => nullableWorkOrderFlowText($payload['reason'] ?? null),
                'created_by_employee_id' => $employeeId,
            ]);
            logAuditAction('Cancelled work order machine run', 'work_order_machine_runs', $machineRunId, [
                'work_order_id' => $workOrderId,
                'reason' => $payload['reason'] ?? null,
            ]);
            $message = '機台已取消並保留歷史。';
            $statusCode = 200;
        } else {
            if ((int)($history['result_count'] ?? 0) > 0 || $run['status'] === 'completed') {
                throw new WorkOrderFlowException('此機台已有結果或已完成，不可直接改寫規劃；請走結果更正流程。', 409);
            }
            if (in_array($run['stage_status'], ['completed', 'cancelled'], true)) {
                throw new WorkOrderFlowException('已完成或取消的階段不可修改機台。', 409);
            }

            $machineId = array_key_exists('machine_id', $payload)
                ? workOrderFlowPositiveId($payload['machine_id'], '機台')
                : (int)$run['machine_id'];
            $plannedUnits = array_key_exists('planned_units', $payload)
                ? workOrderFlowNonNegativeNumber($payload['planned_units'], '預計處理支數')
                : (float)$run['planned_units'];
            $unitWeight = array_key_exists('weight_per_unit_g', $payload)
                ? workOrderFlowNonNegativeNumber($payload['weight_per_unit_g'], '單支重', 4)
                : (float)$run['weight_per_unit_g'];
            if ($unitWeight <= 0) {
                throw new WorkOrderFlowException('單支重必須大於0。', 400);
            }
            $plannedWeight = array_key_exists('planned_net_weight_kg', $payload)
                ? workOrderFlowNonNegativeNumber($payload['planned_net_weight_kg'], '預計淨重', 3)
                : round($plannedUnits * $unitWeight / 1000, 3);
            if ((int)($history['record_count'] ?? 0) > 0
                && (
                    $machineId !== (int)$run['machine_id']
                    || abs($plannedUnits - (float)$run['planned_units']) > 0.0001
                    || abs($unitWeight - (float)$run['weight_per_unit_g']) > 0.0001
                    || abs($plannedWeight - (float)$run['planned_net_weight_kg']) > 0.001
                )) {
                throw new WorkOrderFlowException(
                    '此機台已建立卡號與載具規劃，不可直接改寫機台、支數、單重或淨重；請先確認卡號規劃。',
                    409
                );
            }
            $scheduledStart = array_key_exists('scheduled_start_date', $payload)
                ? normalizeWorkOrderDateTimeValue($payload['scheduled_start_date'])
                : $run['scheduled_start_date'];
            $scheduledEnd = array_key_exists('scheduled_end_date', $payload)
                ? normalizeWorkOrderDateTimeValue($payload['scheduled_end_date'])
                : $run['scheduled_end_date'];

            validateWorkOrderMachineAllocation(
                $pdo,
                $workOrderId,
                (int)$run['stage_id'],
                $machineRunId,
                $plannedUnits,
                $machineId,
                $scheduledStart,
                $scheduledEnd,
                $run
            );

            $updateStmt = $pdo->prepare("
                UPDATE work_order_machine_runs
                SET run_label = :run_label,
                    machine_id = :machine_id,
                    assigned_employee_id = :assigned_employee_id,
                    calibration_employee_id = :calibration_employee_id,
                    scheduled_start_date = :scheduled_start_date,
                    scheduled_end_date = :scheduled_end_date,
                    quantity_to_produce = :quantity_to_produce,
                    screening_speed = :screening_speed,
                    planned_net_weight_kg = :planned_net_weight_kg,
                    weight_per_unit_g = :weight_per_unit_g,
                    planned_units = :planned_units,
                    status = :status,
                    notes = :notes
                WHERE id = :id
            ");
            $updateStmt->execute([
                'run_label' => mb_substr(trim((string)($payload['run_label'] ?? $run['run_label'])), 0, 100),
                'machine_id' => $machineId,
                'assigned_employee_id' => array_key_exists('assigned_employee_id', $payload)
                    ? nullableWorkOrderFlowId($payload['assigned_employee_id'])
                    : $run['assigned_employee_id'],
                'calibration_employee_id' => array_key_exists('calibration_employee_id', $payload)
                    ? nullableWorkOrderFlowId($payload['calibration_employee_id'])
                    : $run['calibration_employee_id'],
                'scheduled_start_date' => $scheduledStart,
                'scheduled_end_date' => $scheduledEnd,
                'quantity_to_produce' => $plannedUnits,
                'screening_speed' => array_key_exists('screening_speed', $payload)
                    ? nullableWorkOrderFlowText($payload['screening_speed'], 50)
                    : $run['screening_speed'],
                'planned_net_weight_kg' => $plannedWeight,
                'weight_per_unit_g' => $unitWeight,
                'planned_units' => $plannedUnits,
                'status' => $scheduledStart ? 'scheduled' : 'pending',
                'notes' => array_key_exists('notes', $payload)
                    ? nullableWorkOrderFlowText($payload['notes'])
                    : $run['notes'],
                'id' => $machineRunId,
            ]);
            syncPrimaryMachineRunToWorkOrder($pdo, $machineRunId);
            appendWorkOrderOperationLog($pdo, $workOrderId, 'update_machine_run', '更新機台規劃', [
                'related_table' => 'work_order_machine_runs',
                'related_id' => $machineRunId,
                'created_by_employee_id' => $employeeId,
            ]);
            logAuditAction('Updated work order machine run', 'work_order_machine_runs', $machineRunId, [
                'work_order_id' => $workOrderId,
            ]);
            $message = '機台規劃更新成功。';
            $statusCode = 200;
        }
    }

    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ], $statusCode);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '儲存機台規劃失敗，請稍後重試。');
}

function nullableWorkOrderFlowId($value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    return workOrderFlowPositiveId($value, '關聯ID');
}

function nullableWorkOrderFlowText($value, int $maxLength = 2000): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, $maxLength);
}

/** @param array<string,mixed> $stage */
function validateWorkOrderMachineAllocation(
    PDO $pdo,
    int $workOrderId,
    int $stageId,
    ?int $excludedRunId,
    float $plannedUnits,
    int $machineId,
    ?string $scheduledStart,
    ?string $scheduledEnd,
    array $stage
): void {
    $allocatedStmt = $pdo->prepare("
        SELECT COALESCE(SUM(planned_units), 0)
        FROM work_order_machine_runs
        WHERE stage_id = :stage_id
          AND deleted_at IS NULL
          AND status <> 'cancelled'
          AND (:excluded_run_id IS NULL OR id <> :excluded_run_id_compare)
    ");
    $allocatedStmt->execute([
        'stage_id' => $stageId,
        'excluded_run_id' => $excludedRunId,
        'excluded_run_id_compare' => $excludedRunId,
    ]);
    $allocatedUnits = (float)$allocatedStmt->fetchColumn();

    if (($stage['stage_type'] ?? 'primary') === 'primary') {
        $availableUnits = (float)($stage['total_units'] ?? 0);
    } else {
        $incomingStmt = $pdo->prepare("
            SELECT COALESCE(SUM(transferred_units), 0)
            FROM work_order_stage_transfers
            WHERE target_stage_id = :stage_id
              AND transfer_status = 'completed'
        ");
        $incomingStmt->execute(['stage_id' => $stageId]);
        $availableUnits = (float)$incomingStmt->fetchColumn();
    }
    if ($availableUnits > 0 && $allocatedUnits + $plannedUnits - $availableUnits > 0.0001) {
        throw new WorkOrderFlowException(
            '機台預計支數合計不可超過此階段可分配支數。',
            409,
            [
                'available_units' => $availableUnits,
                'already_allocated_units' => $allocatedUnits,
                'requested_units' => $plannedUnits,
            ]
        );
    }

    if ($scheduledStart !== null && $scheduledEnd !== null) {
        if ($scheduledEnd <= $scheduledStart) {
            throw new WorkOrderFlowException('預定結束時間必須晚於預定開始時間。', 400);
        }
        $overlapStmt = $pdo->prepare("
            SELECT run.id, wo.work_order_number
            FROM work_order_machine_runs run
            JOIN work_orders wo ON wo.id = run.work_order_id
            WHERE run.machine_id = :machine_id
              AND run.deleted_at IS NULL
              AND run.status NOT IN ('completed', 'cancelled')
              AND run.scheduled_start_date < :scheduled_end
              AND run.scheduled_end_date > :scheduled_start
              AND (:excluded_run_id IS NULL OR run.id <> :excluded_run_id_compare)
            LIMIT 1
        ");
        $overlapStmt->execute([
            'machine_id' => $machineId,
            'scheduled_end' => $scheduledEnd,
            'scheduled_start' => $scheduledStart,
            'excluded_run_id' => $excludedRunId,
            'excluded_run_id_compare' => $excludedRunId,
        ]);
        $overlap = $overlapStmt->fetch(PDO::FETCH_ASSOC);
        if ($overlap) {
            throw new WorkOrderFlowException(
                '此機台在指定時間已有其他工單排程。',
                409,
                ['conflict_work_order_number' => $overlap['work_order_number']]
            );
        }
    }
}

function syncPrimaryMachineRunToWorkOrder(PDO $pdo, int $machineRunId): void
{
    $pdo->prepare("
        UPDATE work_orders wo
        JOIN work_order_machine_runs run ON run.work_order_id = wo.id
        JOIN work_order_stages stage ON stage.id = run.stage_id
        SET wo.machine_id = run.machine_id,
            wo.machine_sequence = run.machine_sequence,
            wo.assigned_employee_id = run.assigned_employee_id,
            wo.calibration_employee_id = run.calibration_employee_id,
            wo.scheduled_start_date = run.scheduled_start_date,
            wo.scheduled_end_date = run.scheduled_end_date,
            wo.quantity_to_produce = run.quantity_to_produce,
            wo.screening_speed = run.screening_speed
        WHERE run.id = :machine_run_id
          AND stage.stage_type = 'primary'
          AND run.machine_sequence = 1
    ")->execute(['machine_run_id' => $machineRunId]);
}
