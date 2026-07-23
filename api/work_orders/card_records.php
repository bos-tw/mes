<?php
/**
 * 機台卡號／裝載參考號與進料載具同步。
 *
 * @endpoint PUT /api/work_orders/card_records.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();
requireMethod('PUT');

$pdo = db();
$payload = readWorkOrderPayload();

try {
    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();
    $workOrderId = workOrderFlowPositiveId($payload['work_order_id'] ?? null, '工單ID');
    $machineRunId = workOrderFlowPositiveId($payload['machine_run_id'] ?? null, '機台執行ID');
    $run = lockWorkOrderMachineRun($pdo, $workOrderId, $machineRunId);
    if ($run['status'] === 'completed') {
        throw new WorkOrderFlowException('已完成機台不可改寫卡號與載具。', 409);
    }

    $sourceMode = strtolower(trim((string)($payload['source_mode'] ?? 'preset')));
    if (!in_array($sourceMode, ['preset', 'manual'], true)) {
        throw new WorkOrderFlowException('載具來源模式必須為生管預設或自行輸入。', 400);
    }
    $carrierRows = $payload['carriers'] ?? $payload['cards'] ?? [];
    if (!is_array($carrierRows) || $carrierRows === []) {
        throw new WorkOrderFlowException('每台機台至少需要一筆載具與卡號規劃。', 400);
    }

    $existingStmt = $pdo->prepare("
        SELECT *
        FROM production_records
        WHERE work_order_id = :work_order_id
          AND machine_run_id = :machine_run_id
        ORDER BY card_sequence, id
        FOR UPDATE
    ");
    $existingStmt->execute([
        'work_order_id' => $workOrderId,
        'machine_run_id' => $machineRunId,
    ]);
    $existingRows = $existingStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $existingById = [];
    $lockedIds = [];
    foreach ($existingRows as $existing) {
        $existingId = (int)$existing['id'];
        $existingById[$existingId] = $existing;
        if ($existing['card_locked_at'] !== null || $existing['actual_gross_weight_kg'] !== null) {
            $lockedIds[] = $existingId;
        }
    }
    $existingInputByRecord = [];
    if ($existingRows !== []) {
        $existingRecordIds = array_map(
            static fn(array $row): int => (int)$row['id'],
            $existingRows
        );
        $inputPlaceholders = implode(',', array_fill(0, count($existingRecordIds), '?'));
        $existingInputStmt = $pdo->prepare("
            SELECT *
            FROM work_order_machine_input_tools
            WHERE production_record_id IN ({$inputPlaceholders})
            FOR UPDATE
        ");
        $existingInputStmt->execute($existingRecordIds);
        foreach ($existingInputStmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $inputTool) {
            $existingInputByRecord[(int)$inputTool['production_record_id']] = $inputTool;
        }
    }

    $normalisedRows = [];
    foreach (array_values($carrierRows) as $index => $carrier) {
        if (!is_array($carrier)) {
            throw new WorkOrderFlowException('載具資料格式不正確。', 400);
        }
        $recordId = isset($carrier['id']) && (int)$carrier['id'] > 0 ? (int)$carrier['id'] : null;
        if ($recordId !== null && !isset($existingById[$recordId])) {
            throw new WorkOrderFlowException('載具列不屬於此機台。', 409);
        }
        if ($recordId !== null && in_array($recordId, $lockedIds, true)) {
            $existing = $existingById[$recordId];
            $inputTool = $existingInputByRecord[$recordId] ?? null;
            if (!$inputTool) {
                throw new WorkOrderFlowException('已鎖定卡號缺少進料載具快照，請由管理流程修復後再操作。', 409);
            }
            $normalisedRows[] = [
                'id' => $recordId,
                'order_item_tool_id' => $inputTool['order_item_tool_id'] !== null
                    ? (int)$inputTool['order_item_tool_id']
                    : null,
                'tool_id' => $inputTool['tool_id'] !== null ? (int)$inputTool['tool_id'] : null,
                'tool_number' => $inputTool['tool_number'],
                'tool_name' => (string)$inputTool['tool_name'],
                'tool_type' => $inputTool['tool_type'],
                'unit_weight_kg' => (float)$inputTool['unit_weight_kg'],
                'quantity' => (int)$inputTool['quantity'],
                'total_weight_kg' => (float)$inputTool['total_weight_kg'],
                'actual_gross_weight_kg' => $existing['actual_gross_weight_kg'] !== null
                    ? (float)$existing['actual_gross_weight_kg']
                    : null,
                'notes' => $existing['notes'],
                'payload_index' => $index,
            ];
            continue;
        }
        $orderItemToolId = nullablePositiveFlowId($carrier['order_item_tool_id'] ?? null, '訂單載具');
        if ($sourceMode === 'preset' && $orderItemToolId === null) {
            throw new WorkOrderFlowException('生管預設模式必須選擇訂單載具。', 400);
        }
        $quantity = filter_var($carrier['quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($quantity === false) {
            throw new WorkOrderFlowException('載具數量必須為正整數。', 400);
        }
        $toolWeight = workOrderFlowNonNegativeNumber($carrier['unit_weight_kg'] ?? 0, '載具單重', 3);
        $toolName = trim((string)($carrier['tool_name'] ?? ''));
        $toolId = nullablePositiveFlowId($carrier['tool_id'] ?? null, '載具');

        if ($orderItemToolId !== null) {
            $sourceToolStmt = $pdo->prepare("
                SELECT oit.id, oit.tool_id, oit.tool_type, oit.quantity,
                       COALESCE(oit.total_weight / NULLIF(oit.quantity, 0), tool.weight_kg, 0) AS unit_weight_kg,
                       tool.tool_number, tool.name AS tool_name
                FROM order_item_tools oit
                LEFT JOIN tools tool ON tool.id = oit.tool_id
                WHERE oit.id = :id
                  AND oit.order_item_id = (
                      SELECT order_item_id FROM work_orders WHERE id = :work_order_id
                  )
                LIMIT 1
            ");
            $sourceToolStmt->execute(['id' => $orderItemToolId, 'work_order_id' => $workOrderId]);
            $sourceTool = $sourceToolStmt->fetch(PDO::FETCH_ASSOC);
            if (!$sourceTool) {
                throw new WorkOrderFlowException('找不到指定的訂單載具。', 404);
            }
            $toolId = (int)$sourceTool['tool_id'];
            $toolName = (string)($sourceTool['tool_name'] ?: $toolName);
            $toolWeight = round((float)$sourceTool['unit_weight_kg'], 3);
            $carrier['tool_number'] = $sourceTool['tool_number'];
            $carrier['tool_type'] = $sourceTool['tool_type'];
        }
        if ($toolName === '') {
            throw new WorkOrderFlowException('載具名稱不可留空。', 400);
        }

        $actualGross = null;
        if (array_key_exists('actual_gross_weight_kg', $carrier)
            && $carrier['actual_gross_weight_kg'] !== null
            && $carrier['actual_gross_weight_kg'] !== '') {
            $actualGross = workOrderFlowNonNegativeNumber($carrier['actual_gross_weight_kg'], '實秤毛重', 3);
            if ($actualGross + 0.0001 < $toolWeight * (int)$quantity) {
                throw new WorkOrderFlowException('實秤毛重不可小於載具皮重。', 400);
            }
        }

        $normalisedRows[] = [
            'id' => $recordId,
            'order_item_tool_id' => $orderItemToolId,
            'tool_id' => $toolId,
            'tool_number' => nullableFlowText($carrier['tool_number'] ?? null, 100),
            'tool_name' => mb_substr($toolName, 0, 255),
            'tool_type' => nullableFlowText($carrier['tool_type'] ?? null, 100),
            'unit_weight_kg' => $toolWeight,
            'quantity' => (int)$quantity,
            'total_weight_kg' => round($toolWeight * (int)$quantity, 3),
            'actual_gross_weight_kg' => $actualGross,
            'notes' => nullableFlowText($carrier['notes'] ?? null),
            'payload_index' => $index,
        ];
    }

    $submittedIds = array_values(array_filter(array_map(
        static fn(array $row): ?int => $row['id'],
        $normalisedRows
    )));
    foreach ($lockedIds as $lockedId) {
        if (!in_array($lockedId, $submittedIds, true)) {
            throw new WorkOrderFlowException('已有實秤資料的卡號列不可移除。', 409);
        }
    }
    $submittedLockedOrder = array_values(array_filter(
        $submittedIds,
        static fn(int $id): bool => in_array($id, $lockedIds, true)
    ));
    if ($submittedLockedOrder !== $lockedIds
        || array_slice($submittedIds, 0, count($lockedIds)) !== $lockedIds) {
        throw new WorkOrderFlowException('已有實秤資料的卡號順序已鎖定，新載具只能接續在其後。', 409);
    }

    validateInputToolAllocations($pdo, $workOrderId, $machineRunId, $normalisedRows);

    $plannedUnits = (float)$run['planned_units'];
    if ($plannedUnits <= 0) {
        throw new WorkOrderFlowException('機台預計支數必須大於0，才能計算卡號參考點。', 409);
    }
    $lockedPlannedUnits = 0.0;
    $lastReference = 0.0;
    foreach ($normalisedRows as $row) {
        if ($row['id'] !== null && in_array($row['id'], $lockedIds, true)) {
            $existing = $existingById[$row['id']];
            $lockedPlannedUnits += (float)($existing['planned_units'] ?? 0);
            $lastReference = max($lastReference, (float)($existing['card_reference_units'] ?? 0));
        }
    }
    $unlockedCount = count($normalisedRows) - count($lockedIds);
    $remainingUnits = round(max($plannedUnits - $lockedPlannedUnits, 0), 2);
    if ($unlockedCount === 0 && abs($remainingUnits) > 0.0001) {
        throw new WorkOrderFlowException('全部卡號都已鎖定，但其裝載支數與機台預計支數不一致。', 409);
    }

    $deleteIds = [];
    foreach ($existingRows as $existing) {
        $existingId = (int)$existing['id'];
        if (!in_array($existingId, $submittedIds, true)) {
            $deleteIds[] = $existingId;
        }
    }
    if ($deleteIds !== []) {
        $placeholders = implode(',', array_fill(0, count($deleteIds), '?'));
        $pdo->prepare("DELETE FROM work_order_machine_input_tools WHERE production_record_id IN ({$placeholders})")
            ->execute($deleteIds);
        $pdo->prepare("DELETE FROM production_records WHERE id IN ({$placeholders}) AND card_locked_at IS NULL")
            ->execute($deleteIds);
    }

    $machineNameStmt = $pdo->prepare('SELECT name FROM machines WHERE id = :id LIMIT 1');
    $machineNameStmt->execute(['id' => (int)$run['machine_id']]);
    $machineName = (string)($machineNameStmt->fetchColumn() ?: '');

    $insertRecord = $pdo->prepare("
        INSERT INTO production_records (
            work_order_id, machine_run_id, stage_id, production_source_mode,
            card_sequence, card_number, card_reference_units, planned_units,
            weight_kg, actual_gross_weight_kg, actual_net_weight_kg,
            weighed_at, weighed_by_employee_id, card_locked_at, card_locked_by_employee_id,
            production_date, production_time, machine_id, machine_type,
            tool_name, tool_weight_kg, employee_id, notes
        ) VALUES (
            :work_order_id, :machine_run_id, :stage_id, :production_source_mode,
            :card_sequence, :card_number, :card_reference_units, :planned_units,
            :weight_kg, :actual_gross_weight_kg, :actual_net_weight_kg,
            :weighed_at, :weighed_by_employee_id, :card_locked_at, :card_locked_by_employee_id,
            :production_date, :production_time, :machine_id, :machine_type,
            :tool_name, :tool_weight_kg, :employee_id, :notes
        )
    ");
    $updateRecord = $pdo->prepare("
        UPDATE production_records
        SET production_source_mode = :production_source_mode,
            card_sequence = :card_sequence,
            card_number = :card_number,
            card_reference_units = :card_reference_units,
            planned_units = :planned_units,
            weight_kg = :weight_kg,
            actual_gross_weight_kg = :actual_gross_weight_kg,
            actual_net_weight_kg = :actual_net_weight_kg,
            weighed_at = :weighed_at,
            weighed_by_employee_id = :weighed_by_employee_id,
            card_locked_at = :card_locked_at,
            card_locked_by_employee_id = :card_locked_by_employee_id,
            production_date = :production_date,
            production_time = :production_time,
            tool_name = :tool_name,
            tool_weight_kg = :tool_weight_kg,
            notes = :notes
        WHERE id = :id
          AND work_order_id = :work_order_id
          AND machine_run_id = :machine_run_id
    ");
    $upsertInputTool = $pdo->prepare("
        INSERT INTO work_order_machine_input_tools (
            work_order_id, stage_id, machine_run_id, production_record_id,
            order_item_tool_id, tool_id, tool_number, tool_name, tool_type,
            unit_weight_kg, quantity, total_weight_kg, allocated_net_weight_kg,
            allocation_status, created_by_employee_id
        ) VALUES (
            :work_order_id, :stage_id, :machine_run_id, :production_record_id,
            :order_item_tool_id, :tool_id, :tool_number, :tool_name, :tool_type,
            :unit_weight_kg, :quantity, :total_weight_kg, :allocated_net_weight_kg,
            :allocation_status, :created_by
        )
        ON DUPLICATE KEY UPDATE
            order_item_tool_id = VALUES(order_item_tool_id),
            tool_id = VALUES(tool_id),
            tool_number = VALUES(tool_number),
            tool_name = VALUES(tool_name),
            tool_type = VALUES(tool_type),
            unit_weight_kg = VALUES(unit_weight_kg),
            quantity = VALUES(quantity),
            total_weight_kg = VALUES(total_weight_kg),
            allocated_net_weight_kg = VALUES(allocated_net_weight_kg),
            allocation_status = VALUES(allocation_status)
    ");

    $unlockedIndex = 0;
    $now = date('Y-m-d H:i:s');
    $today = date('Y-m-d');
    $time = date('H:i:s');
    foreach ($normalisedRows as $sequenceIndex => $row) {
        $sequence = $sequenceIndex + 1;
        $isLocked = $row['id'] !== null && in_array($row['id'], $lockedIds, true);
        if ($isLocked) {
            $existing = $existingById[$row['id']];
            $referenceUnits = (float)$existing['card_reference_units'];
            $rowPlannedUnits = (float)$existing['planned_units'];
            $actualGross = (float)$existing['actual_gross_weight_kg'];
            $actualNet = (float)$existing['actual_net_weight_kg'];
            $recordId = (int)$row['id'];
            $row['total_weight_kg'] = (float)$existing['tool_weight_kg'];
        } else {
            $unlockedIndex++;
            $rowPlannedUnits = $unlockedIndex === $unlockedCount
                ? round($plannedUnits - $lastReference, 2)
                : round($remainingUnits / $unlockedCount, 2);
            $referenceUnits = $unlockedIndex === $unlockedCount
                ? $plannedUnits
                : round($lastReference + $rowPlannedUnits, 2);
            $lastReference = $referenceUnits;
            $actualGross = $row['actual_gross_weight_kg'];
            $actualNet = $actualGross !== null
                ? round(max($actualGross - $row['total_weight_kg'], 0), 3)
                : null;
            $isWeighed = $actualGross !== null;
            $recordParams = [
                'production_source_mode' => $sourceMode,
                'card_sequence' => $sequence,
                'card_number' => formatCardReference($referenceUnits),
                'card_reference_units' => $referenceUnits,
                'planned_units' => $rowPlannedUnits,
                'weight_kg' => $actualGross,
                'actual_gross_weight_kg' => $actualGross,
                'actual_net_weight_kg' => $actualNet,
                'weighed_at' => $isWeighed ? $now : null,
                'weighed_by_employee_id' => $isWeighed ? $employeeId : null,
                'card_locked_at' => $isWeighed ? $now : null,
                'card_locked_by_employee_id' => $isWeighed ? $employeeId : null,
                'production_date' => $isWeighed ? $today : null,
                'production_time' => $isWeighed ? $time : null,
                'tool_name' => $row['tool_name'],
                'tool_weight_kg' => $row['total_weight_kg'],
                'notes' => $row['notes'],
                'work_order_id' => $workOrderId,
                'machine_run_id' => $machineRunId,
            ];
            if ($row['id'] === null) {
                $insertRecord->execute($recordParams + [
                    'stage_id' => (int)$run['stage_id'],
                    'machine_id' => (int)$run['machine_id'],
                    'machine_type' => $machineName,
                    'employee_id' => $employeeId,
                ]);
                $recordId = (int)$pdo->lastInsertId();
            } else {
                $updateRecord->execute($recordParams + ['id' => (int)$row['id']]);
                $recordId = (int)$row['id'];
            }
        }

        $upsertInputTool->execute([
            'work_order_id' => $workOrderId,
            'stage_id' => (int)$run['stage_id'],
            'machine_run_id' => $machineRunId,
            'production_record_id' => $recordId,
            'order_item_tool_id' => $row['order_item_tool_id'],
            'tool_id' => $row['tool_id'],
            'tool_number' => $row['tool_number'],
            'tool_name' => $row['tool_name'],
            'tool_type' => $row['tool_type'],
            'unit_weight_kg' => $row['unit_weight_kg'],
            'quantity' => $row['quantity'],
            'total_weight_kg' => $row['total_weight_kg'],
            'allocated_net_weight_kg' => $actualNet ?? 0,
            'allocation_status' => $actualGross !== null ? 'loaded' : 'allocated',
            'created_by' => $employeeId,
        ]);
    }

    if (in_array($run['status'], ['pending', 'scheduled'], true)) {
        $pdo->prepare("
            UPDATE work_order_machine_runs
            SET status = 'in_progress',
                actual_start_date = COALESCE(actual_start_date, NOW())
            WHERE id = :id
        ")->execute(['id' => $machineRunId]);
    }
    $pdo->prepare("
        UPDATE work_order_stages
        SET status = 'in_progress',
            started_at = COALESCE(started_at, NOW())
        WHERE id = :id
          AND status = 'pending'
    ")->execute(['id' => (int)$run['stage_id']]);

    appendWorkOrderOperationLog($pdo, $workOrderId, 'save_machine_cards', '儲存卡號與進料載具', [
        'related_table' => 'work_order_machine_runs',
        'related_id' => $machineRunId,
        'payload' => ['source_mode' => $sourceMode, 'card_count' => count($normalisedRows)],
        'created_by_employee_id' => $employeeId,
    ]);
    logAuditAction('Saved work order machine card records', 'work_order_machine_runs', $machineRunId, [
        'work_order_id' => $workOrderId,
        'source_mode' => $sourceMode,
        'card_count' => count($normalisedRows),
    ]);

    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => '卡號、載具與實秤重量儲存成功。',
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ]);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '儲存卡號與載具失敗，請稍後重試。');
}

function nullablePositiveFlowId($value, string $label): ?int
{
    if ($value === null || $value === '') {
        return null;
    }
    return workOrderFlowPositiveId($value, $label);
}

function nullableFlowText($value, int $maxLength = 2000): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, $maxLength);
}

function formatCardReference(float $referenceUnits): string
{
    if (abs($referenceUnits - round($referenceUnits)) < 0.0001) {
        return (string)(int)round($referenceUnits);
    }
    return rtrim(rtrim(number_format($referenceUnits, 2, '.', ''), '0'), '.');
}

/** @param array<int,array<string,mixed>> $rows */
function validateInputToolAllocations(PDO $pdo, int $workOrderId, int $machineRunId, array $rows): void
{
    $requestedByTool = [];
    foreach ($rows as $row) {
        if ($row['order_item_tool_id'] !== null) {
            $requestedByTool[$row['order_item_tool_id']] =
                ($requestedByTool[$row['order_item_tool_id']] ?? 0) + (int)$row['quantity'];
        }
    }
    foreach ($requestedByTool as $orderItemToolId => $requestedQuantity) {
        $stmt = $pdo->prepare("
            SELECT source_tool.quantity,
                   COALESCE(SUM(CASE
                       WHEN input_tool.machine_run_id <> :machine_run_id
                       THEN input_tool.quantity ELSE 0 END), 0) AS allocated_elsewhere
            FROM order_item_tools source_tool
            LEFT JOIN work_order_machine_input_tools input_tool
              ON input_tool.order_item_tool_id = source_tool.id
            WHERE source_tool.id = :order_item_tool_id
              AND source_tool.order_item_id = (
                  SELECT order_item_id FROM work_orders WHERE id = :work_order_id
              )
            GROUP BY source_tool.id, source_tool.quantity
            FOR UPDATE
        ");
        $stmt->execute([
            'machine_run_id' => $machineRunId,
            'order_item_tool_id' => $orderItemToolId,
            'work_order_id' => $workOrderId,
        ]);
        $allocation = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$allocation) {
            throw new WorkOrderFlowException('找不到指定的訂單載具。', 404);
        }
        $available = (float)$allocation['quantity'] - (float)$allocation['allocated_elsewhere'];
        if ($requestedQuantity - $available > 0.0001) {
            throw new WorkOrderFlowException(
                '同一批進料載具不可重複分配到多台機台。',
                409,
                [
                    'order_item_tool_id' => (int)$orderItemToolId,
                    'available_quantity' => $available,
                    'requested_quantity' => $requestedQuantity,
                ]
            );
        }
    }
}
