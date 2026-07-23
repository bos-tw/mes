<?php
/**
 * 機台完成結果草稿、確認與撤銷。
 *
 * @endpoint POST  /api/work_orders/machine_results.php
 * @endpoint PATCH /api/work_orders/machine_results.php?id={result_id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();

$pdo = db();
$method = requireMethod(['POST', 'PATCH']);
$payload = readWorkOrderPayload();

try {
    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();
    $action = strtolower(trim((string)($payload['action'] ?? 'save_draft')));
    if (!in_array($action, ['save_draft', 'confirm', 'reverse'], true)) {
        throw new WorkOrderFlowException('不支援的機台結果操作。', 400);
    }

    $resultId = $method === 'PATCH'
        ? workOrderFlowPositiveId($_GET['id'] ?? $payload['id'] ?? null, '機台結果ID')
        : 0;
    $existingResult = null;
    if ($resultId > 0) {
        $resultStmt = $pdo->prepare("
            SELECT *
            FROM work_order_machine_results
            WHERE id = :id
            LIMIT 1
            FOR UPDATE
        ");
        $resultStmt->execute(['id' => $resultId]);
        $existingResult = $resultStmt->fetch(PDO::FETCH_ASSOC);
        if (!$existingResult) {
            throw new WorkOrderFlowException('找不到指定的機台結果。', 404);
        }
        $workOrderId = (int)$existingResult['work_order_id'];
        $machineRunId = (int)$existingResult['machine_run_id'];
    } else {
        $workOrderId = workOrderFlowPositiveId($payload['work_order_id'] ?? null, '工單ID');
        $machineRunId = workOrderFlowPositiveId($payload['machine_run_id'] ?? null, '機台執行ID');
    }
    $run = lockWorkOrderMachineRun($pdo, $workOrderId, $machineRunId);

    if ($action === 'reverse') {
        if (!$existingResult || $existingResult['result_status'] !== 'confirmed') {
            throw new WorkOrderFlowException('只有已確認的機台結果可以撤銷。', 409);
        }
        $reason = trim((string)($payload['reason'] ?? $payload['reverse_reason'] ?? ''));
        if ($reason === '') {
            throw new WorkOrderFlowException('撤銷機台結果必須填寫原因。', 400);
        }
        $impactStmt = $pdo->prepare("
            SELECT
                COUNT(*) AS transfer_count,
                COALESCE(SUM(CASE WHEN transfer_row.inventory_item_id IS NOT NULL THEN 1 ELSE 0 END), 0) AS inventory_count
            FROM work_order_stage_transfers transfer_row
            WHERE transfer_row.source_machine_result_id = :result_id
              AND transfer_row.transfer_status = 'completed'
        ");
        $impactStmt->execute(['result_id' => $resultId]);
        $impact = $impactStmt->fetch(PDO::FETCH_ASSOC) ?: [];
        if ((int)($impact['transfer_count'] ?? 0) > 0) {
            throw new WorkOrderFlowException(
                '此結果已有轉流或入庫，必須先走下游撤銷流程，不能直接撤銷機台結果。',
                409,
                $impact
            );
        }
        $pdo->prepare("
            UPDATE work_order_machine_results
            SET result_status = 'reversed',
                reversed_at = NOW(),
                reversed_by_employee_id = :employee_id,
                reverse_reason = :reason
            WHERE id = :id
        ")->execute([
            'employee_id' => $employeeId,
            'reason' => mb_substr($reason, 0, 2000),
            'id' => $resultId,
        ]);
        $pdo->prepare("
            UPDATE work_order_machine_runs
            SET status = 'in_progress',
                completed_net_weight_kg = 0,
                completed_units = 0,
                actual_end_date = NULL
            WHERE id = :id
        ")->execute(['id' => $machineRunId]);
        appendWorkOrderOperationLog($pdo, $workOrderId, 'reverse_machine_result', '撤銷機台完成結果', [
            'related_table' => 'work_order_machine_results',
            'related_id' => $resultId,
            'notes' => $reason,
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Reversed work order machine result', 'work_order_machine_results', $resultId, [
            'work_order_id' => $workOrderId,
            'machine_run_id' => $machineRunId,
            'reason' => $reason,
        ]);
        recalculateWorkOrderFlowStatuses($pdo, $workOrderId);
        $pdo->commit();
        jsonResponse([
            'success' => true,
            'message' => '機台結果已撤銷並保留原始版本。',
            'data' => fetchWorkOrderFlow($pdo, $workOrderId),
        ]);
        return;
    }

    if ($existingResult && $existingResult['result_status'] !== 'draft') {
        throw new WorkOrderFlowException('已確認或已撤銷的結果不可直接改寫。', 409);
    }
    if (!$existingResult && $run['status'] === 'completed') {
        throw new WorkOrderFlowException('此機台已有完成結果，請先檢查既有版本。', 409);
    }

    $metrics = normaliseMachineResultMetrics($payload, $run, $existingResult);
    $defects = normaliseMachineDefects($pdo, (int)$run['stage_id'], $payload['defects'] ?? []);
    $packages = normaliseDefectPackages($payload['packages'] ?? []);
    $outputTools = normaliseOutputTools($pdo, $machineRunId, $payload['output_tools'] ?? []);
    $notes = nullableMachineResultText($payload['notes'] ?? ($existingResult['notes'] ?? null));

    if (!$existingResult) {
        $revisionStmt = $pdo->prepare("
            SELECT COALESCE(MAX(result_revision), 0) + 1
            FROM work_order_machine_results
            WHERE machine_run_id = :machine_run_id
        ");
        $revisionStmt->execute(['machine_run_id' => $machineRunId]);
        $revision = (int)$revisionStmt->fetchColumn();
        $insertStmt = $pdo->prepare("
            INSERT INTO work_order_machine_results (
                work_order_id, stage_id, machine_run_id, result_revision,
                input_units, input_net_weight_kg,
                machine_processed_units, machine_good_units, machine_defect_units,
                defect_weight_kg, weight_per_unit_g,
                settled_defect_units, defect_difference_units, rounding_rule,
                result_status, completed_at, completed_by_employee_id, notes
            ) VALUES (
                :work_order_id, :stage_id, :machine_run_id, :result_revision,
                :input_units, :input_net_weight_kg,
                :machine_processed_units, :machine_good_units, :machine_defect_units,
                :defect_weight_kg, :weight_per_unit_g,
                :settled_defect_units, :defect_difference_units, 'round_half_up',
                'draft', :completed_at, :completed_by_employee_id, :notes
            )
        ");
        $insertStmt->execute($metrics + [
            'work_order_id' => $workOrderId,
            'stage_id' => (int)$run['stage_id'],
            'machine_run_id' => $machineRunId,
            'result_revision' => $revision,
            'completed_at' => date('Y-m-d H:i:s'),
            'completed_by_employee_id' => $employeeId,
            'notes' => $notes,
        ]);
        $resultId = (int)$pdo->lastInsertId();
    } else {
        $revision = (int)$existingResult['result_revision'];
        $updateStmt = $pdo->prepare("
            UPDATE work_order_machine_results
            SET input_units = :input_units,
                input_net_weight_kg = :input_net_weight_kg,
                machine_processed_units = :machine_processed_units,
                machine_good_units = :machine_good_units,
                machine_defect_units = :machine_defect_units,
                defect_weight_kg = :defect_weight_kg,
                weight_per_unit_g = :weight_per_unit_g,
                settled_defect_units = :settled_defect_units,
                defect_difference_units = :defect_difference_units,
                rounding_rule = 'round_half_up',
                completed_at = NOW(),
                completed_by_employee_id = :completed_by_employee_id,
                notes = :notes
            WHERE id = :id
              AND result_status = 'draft'
        ");
        $updateStmt->execute($metrics + [
            'completed_by_employee_id' => $employeeId,
            'notes' => $notes,
            'id' => $resultId,
        ]);
    }

    replaceMachineResultChildren(
        $pdo,
        $workOrderId,
        $machineRunId,
        $resultId,
        $employeeId,
        $defects,
        $packages,
        $outputTools,
        $payload['input_tool_dispositions'] ?? []
    );

    if ($action === 'confirm') {
        validateMachineResultConfirmation(
            $pdo,
            $workOrderId,
            $run,
            $resultId,
            $metrics,
            $defects,
            $packages,
            $outputTools
        );
        $pdo->prepare("
            UPDATE work_order_machine_results
            SET result_status = 'confirmed',
                confirmed_at = NOW(),
                confirmed_by_employee_id = :employee_id
            WHERE id = :id
              AND result_status = 'draft'
        ")->execute(['employee_id' => $employeeId, 'id' => $resultId]);
        $pdo->prepare("
            UPDATE work_order_machine_runs
            SET status = 'completed',
                completed_net_weight_kg = :completed_net_weight_kg,
                completed_units = :completed_units,
                actual_end_date = COALESCE(actual_end_date, NOW())
            WHERE id = :id
        ")->execute([
            'completed_net_weight_kg' => round((float)$metrics['machine_processed_units'] * (float)$metrics['weight_per_unit_g'] / 1000, 3),
            'completed_units' => $metrics['machine_processed_units'],
            'id' => $machineRunId,
        ]);
        appendWorkOrderOperationLog($pdo, $workOrderId, 'confirm_machine_result', '確認機台完成結果', [
            'related_table' => 'work_order_machine_results',
            'related_id' => $resultId,
            'payload' => [
                'machine_run_id' => $machineRunId,
                'machine_defect_units' => $metrics['machine_defect_units'],
                'settled_defect_units' => $metrics['settled_defect_units'],
                'defect_difference_units' => $metrics['defect_difference_units'],
            ],
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Confirmed work order machine result', 'work_order_machine_results', $resultId, [
            'work_order_id' => $workOrderId,
            'machine_run_id' => $machineRunId,
            'revision' => $revision,
            'machine_defect_units' => $metrics['machine_defect_units'],
            'settled_defect_units' => $metrics['settled_defect_units'],
        ]);
        $message = '機台結果確認成功；原始不良與秤重換算不良均已鎖定。';
    } else {
        appendWorkOrderOperationLog($pdo, $workOrderId, 'save_machine_result_draft', '儲存機台結果草稿', [
            'related_table' => 'work_order_machine_results',
            'related_id' => $resultId,
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Saved work order machine result draft', 'work_order_machine_results', $resultId, [
            'work_order_id' => $workOrderId,
            'machine_run_id' => $machineRunId,
            'revision' => $revision,
        ]);
        $message = '機台結果草稿儲存成功。';
    }

    recalculateWorkOrderFlowStatuses($pdo, $workOrderId);
    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => $message,
        'result_id' => $resultId,
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ], $existingResult ? 200 : 201);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '儲存機台結果失敗，請稍後重試。');
}

/**
 * @param array<string,mixed> $payload
 * @param array<string,mixed> $run
 * @param array<string,mixed>|false|null $existing
 * @return array<string,float>
 */
function normaliseMachineResultMetrics(array $payload, array $run, $existing): array
{
    $value = static function (string $field, float $fallback, int $scale) use ($payload): float {
        return array_key_exists($field, $payload)
            ? workOrderFlowNonNegativeNumber($payload[$field], $field, $scale)
            : round($fallback, $scale);
    };
    $inputUnits = $value('input_units', (float)($existing['input_units'] ?? $run['planned_units'] ?? 0), 2);
    $inputNetWeight = $value(
        'input_net_weight_kg',
        (float)($existing['input_net_weight_kg'] ?? $run['planned_net_weight_kg'] ?? 0),
        3
    );
    $machineGood = $value('machine_good_units', (float)($existing['machine_good_units'] ?? 0), 2);
    $machineDefect = $value('machine_defect_units', (float)($existing['machine_defect_units'] ?? 0), 2);
    $processed = $value(
        'machine_processed_units',
        (float)($existing['machine_processed_units'] ?? ($machineGood + $machineDefect)),
        2
    );
    $defectWeight = $value('defect_weight_kg', (float)($existing['defect_weight_kg'] ?? 0), 3);
    $unitWeight = $value('weight_per_unit_g', (float)($existing['weight_per_unit_g'] ?? $run['weight_per_unit_g'] ?? 0), 4);
    if ($unitWeight <= 0) {
        throw new WorkOrderFlowException('單支重快照必須大於0。', 400);
    }
    if (abs($processed - ($machineGood + $machineDefect)) > 0.0001) {
        throw new WorkOrderFlowException('機台處理總數必須等於機台良品加機台原始不良。', 409);
    }
    if ($processed - $inputUnits > 0.0001) {
        throw new WorkOrderFlowException('機台處理總數不可大於投入支數。', 409);
    }
    $settledDefect = $defectWeight > 0
        ? (float)max((int)round($defectWeight * 1000 / $unitWeight, 0, PHP_ROUND_HALF_UP), 0)
        : 0.0;
    return [
        'input_units' => $inputUnits,
        'input_net_weight_kg' => $inputNetWeight,
        'machine_processed_units' => $processed,
        'machine_good_units' => $machineGood,
        'machine_defect_units' => $machineDefect,
        'defect_weight_kg' => $defectWeight,
        'weight_per_unit_g' => $unitWeight,
        'settled_defect_units' => $settledDefect,
        'defect_difference_units' => round($settledDefect - $machineDefect, 2),
    ];
}

/**
 * @param mixed $rawDefects
 * @return array<int,array<string,mixed>>
 */
function normaliseMachineDefects(PDO $pdo, int $stageId, $rawDefects): array
{
    if (!is_array($rawDefects)) {
        throw new WorkOrderFlowException('篩分不良明細格式不正確。', 400);
    }
    $serviceStmt = $pdo->prepare("
        SELECT screening_service_id, service_name
        FROM work_order_stage_services
        WHERE stage_id = :stage_id
          AND screening_service_id = :service_id
        LIMIT 1
    ");
    $defects = [];
    $seen = [];
    foreach ($rawDefects as $rawDefect) {
        if (!is_array($rawDefect)) {
            continue;
        }
        $serviceId = workOrderFlowPositiveId($rawDefect['screening_service_id'] ?? null, '篩分服務');
        if (isset($seen[$serviceId])) {
            throw new WorkOrderFlowException('同一篩分服務不可重複輸入不良數量。', 400);
        }
        $seen[$serviceId] = true;
        $quantity = filter_var($rawDefect['defect_quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
        if ($quantity === false) {
            throw new WorkOrderFlowException('篩分服務不良支數必須為非負整數。', 400);
        }
        $serviceStmt->execute(['stage_id' => $stageId, 'service_id' => $serviceId]);
        $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);
        if (!$service) {
            throw new WorkOrderFlowException('篩分服務不屬於此階段的規格快照。', 409);
        }
        $defects[] = [
            'screening_service_id' => $serviceId,
            'service_name' => $service['service_name'],
            'defect_quantity' => (int)$quantity,
            'notes' => nullableMachineResultText($rawDefect['notes'] ?? null),
        ];
    }
    return $defects;
}

/**
 * @param mixed $rawPackages
 * @return array<int,array<string,mixed>>
 */
function normaliseDefectPackages($rawPackages): array
{
    if (!is_array($rawPackages)) {
        throw new WorkOrderFlowException('不良品包裝格式不正確。', 400);
    }
    $packages = [];
    $numbers = [];
    foreach (array_values($rawPackages) as $index => $rawPackage) {
        if (!is_array($rawPackage)) {
            continue;
        }
        $number = trim((string)($rawPackage['package_number'] ?? ''));
        if ($number === '') {
            $number = '袋' . ($index + 1);
        }
        if (isset($numbers[$number])) {
            throw new WorkOrderFlowException('不良品袋號不可重複。', 400);
        }
        $numbers[$number] = true;
        $packageQuantity = filter_var($rawPackage['package_quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($packageQuantity === false) {
            throw new WorkOrderFlowException('不良品包／袋數必須為正整數。', 400);
        }
        $packages[] = [
            'package_number' => mb_substr($number, 0, 100),
            'package_type' => mb_substr(trim((string)($rawPackage['package_type'] ?? 'plastic_bag')), 0, 50),
            'package_unit' => mb_substr(trim((string)($rawPackage['package_unit'] ?? 'bag')), 0, 20),
            'package_quantity' => (int)$packageQuantity,
            'contained_units' => workOrderFlowNonNegativeNumber($rawPackage['contained_units'] ?? 0, '袋內支數'),
            'content_weight_kg' => workOrderFlowNonNegativeNumber($rawPackage['content_weight_kg'] ?? 0, '袋內重量', 3),
            'notes' => nullableMachineResultText($rawPackage['notes'] ?? null),
        ];
    }
    return $packages;
}

/**
 * @param mixed $rawTools
 * @return array<int,array<string,mixed>>
 */
function normaliseOutputTools(PDO $pdo, int $machineRunId, $rawTools): array
{
    if (!is_array($rawTools)) {
        throw new WorkOrderFlowException('良品出料載具格式不正確。', 400);
    }
    $inputStmt = $pdo->prepare("
        SELECT *
        FROM work_order_machine_input_tools
        WHERE id = :id
          AND machine_run_id = :machine_run_id
        LIMIT 1
    ");
    $tools = [];
    $reusedByInput = [];
    foreach ($rawTools as $rawTool) {
        if (!is_array($rawTool)) {
            continue;
        }
        $useMode = strtolower(trim((string)($rawTool['use_mode'] ?? '')));
        if (!in_array($useMode, ['reused', 'replacement'], true)) {
            throw new WorkOrderFlowException('出料載具使用方式必須為沿用或更換。', 400);
        }
        $sourceInputToolId = isset($rawTool['source_input_tool_id']) && $rawTool['source_input_tool_id'] !== ''
            ? workOrderFlowPositiveId($rawTool['source_input_tool_id'], '來源進料載具')
            : null;
        $quantity = filter_var($rawTool['quantity'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($quantity === false) {
            throw new WorkOrderFlowException('出料載具數量必須為正整數。', 400);
        }
        $toolId = isset($rawTool['tool_id']) && $rawTool['tool_id'] !== ''
            ? workOrderFlowPositiveId($rawTool['tool_id'], '載具')
            : null;
        $toolNumber = nullableMachineResultText($rawTool['tool_number'] ?? null, 100);
        $toolName = trim((string)($rawTool['tool_name'] ?? ''));
        $toolType = nullableMachineResultText($rawTool['tool_type'] ?? null, 100);
        $unitWeight = workOrderFlowNonNegativeNumber($rawTool['unit_weight_kg'] ?? 0, '出料載具單重', 3);

        if ($useMode === 'reused') {
            if ($sourceInputToolId === null) {
                throw new WorkOrderFlowException('沿用載具必須指定來源進料載具。', 400);
            }
            $inputStmt->execute(['id' => $sourceInputToolId, 'machine_run_id' => $machineRunId]);
            $inputTool = $inputStmt->fetch(PDO::FETCH_ASSOC);
            if (!$inputTool) {
                throw new WorkOrderFlowException('沿用載具不屬於此機台。', 409);
            }
            $reusedByInput[$sourceInputToolId] = ($reusedByInput[$sourceInputToolId] ?? 0) + (int)$quantity;
            if ($reusedByInput[$sourceInputToolId] > (int)$inputTool['quantity']) {
                throw new WorkOrderFlowException('沿用的出料載具數量不可超過來源進料載具。', 409);
            }
            $toolId = $inputTool['tool_id'] !== null ? (int)$inputTool['tool_id'] : null;
            $toolNumber = $inputTool['tool_number'];
            $toolName = (string)$inputTool['tool_name'];
            $toolType = $inputTool['tool_type'];
            $unitWeight = (float)$inputTool['unit_weight_kg'];
        } elseif ($toolName === '') {
            throw new WorkOrderFlowException('更換載具必須輸入實際出料載具名稱。', 400);
        }

        $tools[] = [
            'source_input_tool_id' => $sourceInputToolId,
            'use_mode' => $useMode,
            'tool_id' => $toolId,
            'tool_number' => $toolNumber,
            'tool_name' => mb_substr($toolName, 0, 255),
            'tool_type' => $toolType,
            'unit_weight_kg' => round($unitWeight, 3),
            'quantity' => (int)$quantity,
            'total_weight_kg' => round($unitWeight * (int)$quantity, 3),
            'output_status' => 'planned',
            'notes' => nullableMachineResultText($rawTool['notes'] ?? null),
        ];
    }
    return $tools;
}

/**
 * @param array<int,array<string,mixed>> $defects
 * @param array<int,array<string,mixed>> $packages
 * @param array<int,array<string,mixed>> $outputTools
 * @param mixed $rawDispositions
 */
function replaceMachineResultChildren(
    PDO $pdo,
    int $workOrderId,
    int $machineRunId,
    int $resultId,
    int $employeeId,
    array $defects,
    array $packages,
    array $outputTools,
    $rawDispositions
): void {
    $pdo->prepare("DELETE FROM work_order_machine_defects WHERE machine_result_id = :id")
        ->execute(['id' => $resultId]);
    $pdo->prepare("DELETE FROM work_order_machine_result_packages WHERE machine_result_id = :id")
        ->execute(['id' => $resultId]);
    $pdo->prepare("DELETE FROM work_order_machine_output_tools WHERE machine_result_id = :id")
        ->execute(['id' => $resultId]);

    $defectStmt = $pdo->prepare("
        INSERT INTO work_order_machine_defects (
            machine_run_id, machine_result_id, work_order_id,
            screening_service_id, service_name, defect_quantity,
            recorded_at, recorded_by_employee_id, notes
        ) VALUES (
            :machine_run_id, :machine_result_id, :work_order_id,
            :screening_service_id, :service_name, :defect_quantity,
            NOW(), :recorded_by_employee_id, :notes
        )
    ");
    foreach ($defects as $defect) {
        $defectStmt->execute($defect + [
            'machine_run_id' => $machineRunId,
            'machine_result_id' => $resultId,
            'work_order_id' => $workOrderId,
            'recorded_by_employee_id' => $employeeId,
        ]);
    }

    $packageStmt = $pdo->prepare("
        INSERT INTO work_order_machine_result_packages (
            machine_result_id, package_number, package_type, package_unit,
            package_quantity, contained_units, content_weight_kg,
            package_status, notes, created_by_employee_id
        ) VALUES (
            :machine_result_id, :package_number, :package_type, :package_unit,
            :package_quantity, :contained_units, :content_weight_kg,
            'available', :notes, :created_by_employee_id
        )
    ");
    foreach ($packages as $package) {
        $packageStmt->execute($package + [
            'machine_result_id' => $resultId,
            'created_by_employee_id' => $employeeId,
        ]);
    }

    $outputStmt = $pdo->prepare("
        INSERT INTO work_order_machine_output_tools (
            machine_result_id, source_input_tool_id, use_mode,
            tool_id, tool_number, tool_name, tool_type,
            unit_weight_kg, quantity, total_weight_kg,
            output_status, notes, created_by_employee_id
        ) VALUES (
            :machine_result_id, :source_input_tool_id, :use_mode,
            :tool_id, :tool_number, :tool_name, :tool_type,
            :unit_weight_kg, :quantity, :total_weight_kg,
            :output_status, :notes, :created_by_employee_id
        )
    ");
    foreach ($outputTools as $outputTool) {
        $outputStmt->execute($outputTool + [
            'machine_result_id' => $resultId,
            'created_by_employee_id' => $employeeId,
        ]);
    }

    if (is_array($rawDispositions)) {
        $allowed = ['reused_for_good', 'return_empty', 'stored_on_site', 'damaged', 'other'];
        $dispositionStmt = $pdo->prepare("
            UPDATE work_order_machine_input_tools
            SET disposition = :disposition,
                disposition_notes = :notes
            WHERE id = :id
              AND machine_run_id = :machine_run_id
        ");
        foreach ($rawDispositions as $rawDisposition) {
            if (!is_array($rawDisposition)) {
                continue;
            }
            $inputToolId = workOrderFlowPositiveId($rawDisposition['input_tool_id'] ?? null, '進料載具');
            $disposition = strtolower(trim((string)($rawDisposition['disposition'] ?? '')));
            if (!in_array($disposition, $allowed, true)) {
                throw new WorkOrderFlowException('進料載具後續處置不正確。', 400);
            }
            $notes = nullableMachineResultText($rawDisposition['notes'] ?? null);
            if ($disposition === 'other' && $notes === null) {
                throw new WorkOrderFlowException('載具處置選擇其他時必須填寫說明。', 400);
            }
            $dispositionStmt->execute([
                'disposition' => $disposition,
                'notes' => $notes,
                'id' => $inputToolId,
                'machine_run_id' => $machineRunId,
            ]);
            if ($dispositionStmt->rowCount() === 0) {
                throw new WorkOrderFlowException('進料載具不屬於此機台。', 409);
            }
        }
    }
}

/**
 * @param array<string,mixed> $run
 * @param array<string,float> $metrics
 * @param array<int,array<string,mixed>> $defects
 * @param array<int,array<string,mixed>> $packages
 * @param array<int,array<string,mixed>> $outputTools
 */
function validateMachineResultConfirmation(
    PDO $pdo,
    int $workOrderId,
    array $run,
    int $resultId,
    array $metrics,
    array $defects,
    array $packages,
    array $outputTools
): void {
    $firstPieceStmt = $pdo->prepare("
        SELECT inspection_result
        FROM work_order_first_piece_dimensions
        WHERE work_order_id = :work_order_id
          AND machine_run_id = :machine_run_id
        ORDER BY inspection_round DESC, id DESC
        LIMIT 1
    ");
    $firstPieceStmt->execute([
        'work_order_id' => $workOrderId,
        'machine_run_id' => (int)$run['id'],
    ]);
    if ($firstPieceStmt->fetchColumn() !== 'passed') {
        throw new WorkOrderFlowException('此機台最新一輪首件尺寸尚未合格，不可確認完成。', 409);
    }

    $cardStmt = $pdo->prepare("
        SELECT COUNT(*) AS card_count,
               SUM(CASE WHEN actual_gross_weight_kg IS NULL OR card_locked_at IS NULL THEN 1 ELSE 0 END) AS open_cards
        FROM production_records
        WHERE work_order_id = :work_order_id
          AND machine_run_id = :machine_run_id
    ");
    $cardStmt->execute([
        'work_order_id' => $workOrderId,
        'machine_run_id' => (int)$run['id'],
    ]);
    $cards = $cardStmt->fetch(PDO::FETCH_ASSOC) ?: [];
    if ((int)($cards['card_count'] ?? 0) === 0 || (int)($cards['open_cards'] ?? 0) > 0) {
        throw new WorkOrderFlowException('此機台的卡號載具尚未全部完成實秤。', 409);
    }

    $defectDetailSum = array_sum(array_column($defects, 'defect_quantity'));
    if (abs($defectDetailSum - $metrics['machine_defect_units']) > 0.0001) {
        throw new WorkOrderFlowException(
            '篩分服務不良明細合計必須等於機台畫面原始不良支數。',
            409,
            [
                'service_defect_sum' => $defectDetailSum,
                'machine_defect_units' => $metrics['machine_defect_units'],
            ]
        );
    }

    $requirementStmt = $pdo->prepare("
        SELECT requirement_level, minimum_count
        FROM work_order_image_requirements
        WHERE stage_id = :stage_id
          AND image_type = 'machine_screen'
        LIMIT 1
    ");
    $requirementStmt->execute(['stage_id' => (int)$run['stage_id']]);
    $requirement = $requirementStmt->fetch(PDO::FETCH_ASSOC) ?: [
        'requirement_level' => $run['image_requirement'] ?? 'optional',
        'minimum_count' => $run['image_min_count'] ?? 0,
    ];
    if ($requirement['requirement_level'] === 'required') {
        $imageStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM work_order_machine_result_images
            WHERE machine_result_id = :result_id
              AND image_type = 'machine_screen'
              AND deleted_at IS NULL
        ");
        $imageStmt->execute(['result_id' => $resultId]);
        $imageCount = (int)$imageStmt->fetchColumn();
        if ($imageCount < (int)$requirement['minimum_count']) {
            throw new WorkOrderFlowException(
                '此工單要求上傳機台畫面，尚未達最低張數。',
                409,
                [
                    'minimum_count' => (int)$requirement['minimum_count'],
                    'uploaded_count' => $imageCount,
                ]
            );
        }
    }

    if ($metrics['machine_good_units'] > 0 && $outputTools === []) {
        throw new WorkOrderFlowException('有良品時必須記錄實際出料載具。', 409);
    }
    if ($metrics['settled_defect_units'] > 0) {
        if ($packages === []) {
            throw new WorkOrderFlowException('有不良品時必須記錄包／袋資料。', 409);
        }
        $packageUnits = array_sum(array_column($packages, 'contained_units'));
        $packageWeight = array_sum(array_column($packages, 'content_weight_kg'));
        if (abs($packageUnits - $metrics['settled_defect_units']) > 0.0001) {
            throw new WorkOrderFlowException(
                '不良品各袋所含支數合計必須等於秤重換算不良支數。',
                409,
                [
                    'package_units' => $packageUnits,
                    'settled_defect_units' => $metrics['settled_defect_units'],
                ]
            );
        }
        if (abs($packageWeight - $metrics['defect_weight_kg']) > 0.001) {
            throw new WorkOrderFlowException(
                '不良品各袋內容物重量合計必須等於不良品實秤重量；塑膠袋本身不計重。',
                409,
                [
                    'package_content_weight_kg' => round($packageWeight, 3),
                    'defect_weight_kg' => $metrics['defect_weight_kg'],
                ]
            );
        }
    }

    $replacementCount = count(array_filter(
        $outputTools,
        static fn(array $tool): bool => $tool['use_mode'] === 'replacement'
    ));
    if ($replacementCount > 0) {
        $undisposedStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM work_order_machine_input_tools
            WHERE machine_run_id = :machine_run_id
              AND (disposition IS NULL OR disposition = '')
        ");
        $undisposedStmt->execute(['machine_run_id' => (int)$run['id']]);
        if ((int)$undisposedStmt->fetchColumn() > 0) {
            throw new WorkOrderFlowException('更換出料載具時，所有原進料載具都必須記錄後續處置。', 409);
        }
    }
}

function nullableMachineResultText($value, int $maxLength = 2000): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, $maxLength);
}
