<?php
/**
 * 機台輸出終點入庫、二次篩分轉流與撤銷。
 *
 * @endpoint POST  /api/work_orders/stage_transfers.php
 * @endpoint PATCH /api/work_orders/stage_transfers.php?id={transfer_id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../inventory_items/helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();

$pdo = db();
$method = requireMethod(['POST', 'PATCH']);
$payload = readWorkOrderPayload();

try {
    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();

    if ($method === 'PATCH') {
        $transferId = workOrderFlowPositiveId($_GET['id'] ?? $payload['id'] ?? null, '轉流ID');
        $action = strtolower(trim((string)($payload['action'] ?? 'reverse')));
        if ($action !== 'reverse') {
            throw new WorkOrderFlowException('不支援的轉流操作。', 400);
        }
        $workOrderId = reverseWorkOrderStageTransfer(
            $pdo,
            $transferId,
            $employeeId,
            trim((string)($payload['reason'] ?? ''))
        );
        recalculateWorkOrderFlowStatuses($pdo, $workOrderId);
        $pdo->commit();
        jsonResponse([
            'success' => true,
            'message' => '轉流已撤銷並保留完整歷史。',
            'data' => fetchWorkOrderFlow($pdo, $workOrderId),
        ]);
        return;
    }

    $machineResultId = workOrderFlowPositiveId($payload['machine_result_id'] ?? null, '機台結果ID');
    $quality = strtolower(trim((string)($payload['source_quality'] ?? '')));
    if (!in_array($quality, ['good', 'defect'], true)) {
        throw new WorkOrderFlowException('來源品質必須為良品或不良品。', 400);
    }
    $route = strtolower(trim((string)($payload['route'] ?? '')));
    if (!in_array($route, ['terminal_good', 'terminal_defect', 'secondary_screening'], true)) {
        throw new WorkOrderFlowException('輸出處置路徑不正確。', 400);
    }
    if (($quality === 'good' && $route === 'terminal_defect')
        || ($quality === 'defect' && $route === 'terminal_good')) {
        throw new WorkOrderFlowException('良品與不良品的終點入庫路徑不可互換。', 400);
    }
    $idempotencyKey = trim((string)($payload['idempotency_key'] ?? ''));
    if ($idempotencyKey === '') {
        throw new WorkOrderFlowException('轉流請求缺少冪等識別，請重新載入後再試。', 400);
    }
    $idempotencyKey = mb_substr($idempotencyKey, 0, 100);

    $existingTransferStmt = $pdo->prepare("
        SELECT transfer_row.*, source_stage.work_order_id
        FROM work_order_stage_transfers transfer_row
        JOIN work_order_stages source_stage ON source_stage.id = transfer_row.source_stage_id
        WHERE transfer_row.idempotency_key = :idempotency_key
        LIMIT 1
        FOR UPDATE
    ");
    $existingTransferStmt->execute(['idempotency_key' => $idempotencyKey]);
    $existingTransfer = $existingTransferStmt->fetch(PDO::FETCH_ASSOC);
    if ($existingTransfer) {
        $pdo->commit();
        jsonResponse([
            'success' => true,
            'message' => '此轉流請求已完成，未重複建立庫存。',
            'transfer_id' => (int)$existingTransfer['id'],
            'data' => fetchWorkOrderFlow($pdo, (int)$existingTransfer['work_order_id']),
        ]);
        return;
    }

    $resultStmt = $pdo->prepare("
        SELECT result_row.*, stage.stage_type, stage.secondary_mode AS source_secondary_mode,
               stage.source_quality AS stage_source_quality, stage.spec_mode,
               run.status AS machine_run_status,
               wo.order_item_id, wo.work_order_number,
               oi.order_id, oi.screening_item_id, oi.customer_batch_number,
               orders.customer_id
        FROM work_order_machine_results result_row
        JOIN work_order_stages stage ON stage.id = result_row.stage_id
        JOIN work_order_machine_runs run ON run.id = result_row.machine_run_id
        JOIN work_orders wo ON wo.id = result_row.work_order_id
        JOIN order_items oi ON oi.id = wo.order_item_id
        JOIN orders ON orders.id = oi.order_id
        WHERE result_row.id = :id
          AND wo.deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");
    $resultStmt->execute(['id' => $machineResultId]);
    $result = $resultStmt->fetch(PDO::FETCH_ASSOC);
    if (!$result) {
        throw new WorkOrderFlowException('找不到指定的機台結果。', 404);
    }
    if ($result['result_status'] !== 'confirmed') {
        throw new WorkOrderFlowException('只有已確認的機台結果可以進行轉流或入庫。', 409);
    }
    $workOrderId = (int)$result['work_order_id'];

    $sourceTotalUnits = $quality === 'good'
        ? (float)$result['machine_good_units']
        : (float)$result['settled_defect_units'];
    $usedStmt = $pdo->prepare("
        SELECT COALESCE(SUM(transferred_units), 0)
        FROM work_order_stage_transfers
        WHERE source_machine_result_id = :result_id
          AND source_quality = :source_quality
          AND transfer_status = 'completed'
        FOR UPDATE
    ");
    $usedStmt->execute(['result_id' => $machineResultId, 'source_quality' => $quality]);
    $usedUnits = (float)$usedStmt->fetchColumn();
    $availableUnits = round(max($sourceTotalUnits - $usedUnits, 0), 2);
    $transferredUnits = array_key_exists('transferred_units', $payload)
        ? workOrderFlowNonNegativeNumber($payload['transferred_units'], '轉流支數')
        : $availableUnits;
    if ($transferredUnits <= 0 || $transferredUnits - $availableUnits > 0.0001) {
        throw new WorkOrderFlowException(
            '轉流支數必須大於0且不可超過來源可用支數。',
            409,
            [
                'source_total_units' => $sourceTotalUnits,
                'already_transferred_units' => $usedUnits,
                'available_units' => $availableUnits,
                'requested_units' => $transferredUnits,
            ]
        );
    }

    $unitWeight = (float)$result['weight_per_unit_g'];
    $transferredNetWeight = $quality === 'defect' && (float)$result['settled_defect_units'] > 0
        ? round((float)$result['defect_weight_kg'] * $transferredUnits / (float)$result['settled_defect_units'], 3)
        : round($transferredUnits * $unitWeight / 1000, 3);
    $secondaryMode = null;
    $targetStageId = null;
    $inventoryItemId = null;
    $sourceDefectHistoryId = null;

    if ($route === 'secondary_screening') {
        if ($result['stage_type'] !== 'primary') {
            throw new WorkOrderFlowException('二次篩分結果已是流程終點，不可再建立第三層篩分。', 409);
        }
        $secondaryMode = strtolower(trim((string)($payload['secondary_mode'] ?? '')));
        if (!in_array($secondaryMode, ['second_process', 'relaxed_standard'], true)) {
            throw new WorkOrderFlowException('二次篩分方式必須為第二道工序或放寬標準。', 400);
        }
        if (($secondaryMode === 'second_process' && $quality !== 'good')
            || ($secondaryMode === 'relaxed_standard' && $quality !== 'defect')) {
            throw new WorkOrderFlowException('第二道工序只能接良品；放寬標準只能接秤重換算後的不良品。', 409);
        }
        if ($secondaryMode === 'relaxed_standard') {
            $sourceDefectStmt = $pdo->prepare("
                SELECT id
                FROM work_order_machine_defects
                WHERE machine_result_id = :result_id
                ORDER BY id
                LIMIT 1
            ");
            $sourceDefectStmt->execute(['result_id' => $machineResultId]);
            $sourceDefectHistoryId = (int)($sourceDefectStmt->fetchColumn() ?: 0);
            if ($sourceDefectHistoryId <= 0) {
                throw new WorkOrderFlowException('放寬標準缺少原始不良明細來源。', 409);
            }
        }
        $targetStageId = ensureSecondaryScreeningStage(
            $pdo,
            $result,
            $secondaryMode,
            $quality,
            $payload['services'] ?? [],
            $employeeId
        );
    }

    $insertTransfer = $pdo->prepare("
        INSERT INTO work_order_stage_transfers (
            source_stage_id, source_machine_result_id, source_quality,
            route, secondary_mode, source_defect_history_record_id,
            transferred_units, transferred_net_weight_kg,
            target_stage_id, transfer_status, idempotency_key,
            completed_at, completed_by_employee_id, notes, created_by_employee_id
        ) VALUES (
            :source_stage_id, :source_machine_result_id, :source_quality,
            :route, :secondary_mode, :source_defect_history_record_id,
            :transferred_units, :transferred_net_weight_kg,
            :target_stage_id, 'pending', :idempotency_key,
            NULL, NULL, :notes, :created_by_employee_id
        )
    ");
    $insertTransfer->execute([
        'source_stage_id' => (int)$result['stage_id'],
        'source_machine_result_id' => $machineResultId,
        'source_quality' => $quality,
        'route' => $route,
        'secondary_mode' => $secondaryMode,
        'source_defect_history_record_id' => $sourceDefectHistoryId ?: null,
        'transferred_units' => $transferredUnits,
        'transferred_net_weight_kg' => $transferredNetWeight,
        'target_stage_id' => $targetStageId,
        'idempotency_key' => $idempotencyKey,
        'notes' => nullableStageTransferText($payload['notes'] ?? null),
        'created_by_employee_id' => $employeeId,
    ]);
    $transferId = (int)$pdo->lastInsertId();

    if ($route !== 'secondary_screening') {
        $inventoryItemId = createTerminalFlowInventory(
            $pdo,
            $result,
            $transferId,
            $quality,
            $transferredUnits,
            $transferredNetWeight,
            $payload,
            $employeeId
        );
    }

    $pdo->prepare("
        UPDATE work_order_stage_transfers
        SET inventory_item_id = :inventory_item_id,
            transfer_status = 'completed',
            completed_at = NOW(),
            completed_by_employee_id = :employee_id
        WHERE id = :id
    ")->execute([
        'inventory_item_id' => $inventoryItemId,
        'employee_id' => $employeeId,
        'id' => $transferId,
    ]);

    $actionKey = $route === 'secondary_screening' ? 'route_to_secondary_screening' : 'create_terminal_inventory';
    $actionLabel = $route === 'secondary_screening'
        ? ($secondaryMode === 'second_process' ? '轉入二次篩分－第二道工序' : '轉入二次篩分－放寬標準')
        : ($quality === 'good' ? '建立良品庫存' : '建立不良品庫存');
    appendWorkOrderOperationLog($pdo, $workOrderId, $actionKey, $actionLabel, [
        'related_table' => 'work_order_stage_transfers',
        'related_id' => $transferId,
        'payload' => [
            'machine_result_id' => $machineResultId,
            'source_quality' => $quality,
            'route' => $route,
            'secondary_mode' => $secondaryMode,
            'transferred_units' => $transferredUnits,
            'inventory_item_id' => $inventoryItemId,
            'target_stage_id' => $targetStageId,
        ],
        'created_by_employee_id' => $employeeId,
    ]);
    logAuditAction('Completed work order stage transfer', 'work_order_stage_transfers', $transferId, [
        'work_order_id' => $workOrderId,
        'machine_result_id' => $machineResultId,
        'source_quality' => $quality,
        'route' => $route,
        'secondary_mode' => $secondaryMode,
        'transferred_units' => $transferredUnits,
        'inventory_item_id' => $inventoryItemId,
        'target_stage_id' => $targetStageId,
    ]);

    recalculateWorkOrderFlowStatuses($pdo, $workOrderId);
    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => $route === 'secondary_screening' ? '已轉入二次篩分，未建立中間庫存。' : '終點庫存與入庫交易建立成功。',
        'transfer_id' => $transferId,
        'inventory_item_id' => $inventoryItemId,
        'target_stage_id' => $targetStageId,
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ], 201);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '處理工單轉流失敗，請稍後重試。');
}

/**
 * @param array<string,mixed> $sourceResult
 * @param mixed $rawServices
 */
function ensureSecondaryScreeningStage(
    PDO $pdo,
    array $sourceResult,
    string $secondaryMode,
    string $sourceQuality,
    $rawServices,
    int $employeeId
): int {
    if (!is_array($rawServices) || $rawServices === []) {
        throw new WorkOrderFlowException('建立二次篩分必須指定本次使用的服務與規格快照。', 400);
    }
    $existingStmt = $pdo->prepare("
        SELECT id
        FROM work_order_stages
        WHERE work_order_id = :work_order_id
          AND stage_type = 'secondary'
          AND secondary_mode = :secondary_mode
          AND source_quality = :source_quality
          AND status IN ('pending', 'in_progress')
        ORDER BY stage_instance_no
        LIMIT 1
        FOR UPDATE
    ");
    $existingStmt->execute([
        'work_order_id' => (int)$sourceResult['work_order_id'],
        'secondary_mode' => $secondaryMode,
        'source_quality' => $sourceQuality,
    ]);
    $stageId = (int)($existingStmt->fetchColumn() ?: 0);
    if ($stageId > 0) {
        return $stageId;
    }

    $instanceStmt = $pdo->prepare("
        SELECT COALESCE(MAX(stage_instance_no), 0) + 1
        FROM work_order_stages
        WHERE work_order_id = :work_order_id
          AND stage_sequence = 2
    ");
    $instanceStmt->execute(['work_order_id' => (int)$sourceResult['work_order_id']]);
    $instanceNo = (int)$instanceStmt->fetchColumn();
    $requirementStmt = $pdo->prepare("
        SELECT requirement_level, minimum_count
        FROM work_order_image_requirements
        WHERE stage_id = :source_stage_id
          AND image_type = 'machine_screen'
        LIMIT 1
    ");
    $requirementStmt->execute(['source_stage_id' => (int)$sourceResult['stage_id']]);
    $requirement = $requirementStmt->fetch(PDO::FETCH_ASSOC) ?: [
        'requirement_level' => 'optional',
        'minimum_count' => 0,
    ];
    $insertStage = $pdo->prepare("
        INSERT INTO work_order_stages (
            work_order_id, stage_sequence, stage_instance_no,
            stage_type, secondary_mode, source_quality,
            status, spec_mode, source_stage_id,
            image_requirement, image_min_count, created_by_employee_id
        ) VALUES (
            :work_order_id, 2, :stage_instance_no,
            'secondary', :secondary_mode, :source_quality,
            'pending', :spec_mode, :source_stage_id,
            :image_requirement, :image_min_count, :created_by_employee_id
        )
    ");
    $insertStage->execute([
        'work_order_id' => (int)$sourceResult['work_order_id'],
        'stage_instance_no' => $instanceNo,
        'secondary_mode' => $secondaryMode,
        'source_quality' => $sourceQuality,
        'spec_mode' => $secondaryMode === 'second_process' ? 'second_process' : 'relaxed',
        'source_stage_id' => (int)$sourceResult['stage_id'],
        'image_requirement' => $requirement['requirement_level'],
        'image_min_count' => (int)$requirement['minimum_count'],
        'created_by_employee_id' => $employeeId,
    ]);
    $stageId = (int)$pdo->lastInsertId();

    $pdo->prepare("
        INSERT INTO work_order_image_requirements (
            work_order_id, stage_id, image_type, requirement_level,
            minimum_count, source_type, source_id, created_by_employee_id
        ) VALUES (
            :work_order_id, :stage_id, 'machine_screen', :requirement_level,
            :minimum_count, 'stage_override', :source_id, :created_by_employee_id
        )
    ")->execute([
        'work_order_id' => (int)$sourceResult['work_order_id'],
        'stage_id' => $stageId,
        'requirement_level' => $requirement['requirement_level'],
        'minimum_count' => (int)$requirement['minimum_count'],
        'source_id' => (int)$sourceResult['stage_id'],
        'created_by_employee_id' => $employeeId,
    ]);

    $sourceServiceStmt = $pdo->prepare("
        SELECT *
        FROM work_order_stage_services
        WHERE id = :source_stage_service_id
          AND stage_id = :source_stage_id
        LIMIT 1
    ");
    $insertService = $pdo->prepare("
        INSERT INTO work_order_stage_services (
            stage_id, screening_service_id, source_service_detail_id,
            source_stage_service_id, service_name, service_name_en,
            tolerance_plus_value, tolerance_plus_over,
            tolerance_minus_value, tolerance_minus_over,
            ppm_standard, relaxation_reason, customer_approval_reference,
            sort_order, created_by_employee_id
        ) VALUES (
            :stage_id, :screening_service_id, :source_service_detail_id,
            :source_stage_service_id, :service_name, :service_name_en,
            :tolerance_plus_value, :tolerance_plus_over,
            :tolerance_minus_value, :tolerance_minus_over,
            :ppm_standard, :relaxation_reason, :customer_approval_reference,
            :sort_order, :created_by_employee_id
        )
    ");
    foreach (array_values($rawServices) as $index => $rawService) {
        if (!is_array($rawService)) {
            continue;
        }
        $sourceStageServiceId = workOrderFlowPositiveId(
            $rawService['source_stage_service_id'] ?? null,
            '來源服務規格'
        );
        $sourceServiceStmt->execute([
            'source_stage_service_id' => $sourceStageServiceId,
            'source_stage_id' => (int)$sourceResult['stage_id'],
        ]);
        $sourceService = $sourceServiceStmt->fetch(PDO::FETCH_ASSOC);
        if (!$sourceService) {
            throw new WorkOrderFlowException('二次篩分服務不屬於來源階段。', 409);
        }
        $relaxationReason = nullableStageTransferText($rawService['relaxation_reason'] ?? null);
        $approvalReference = nullableStageTransferText($rawService['customer_approval_reference'] ?? null);
        if ($secondaryMode === 'second_process') {
            if ($relaxationReason !== null || $approvalReference !== null) {
                throw new WorkOrderFlowException('第二道工序不是不良品放寬，不可填寫放寬佐證。', 400);
            }
        } elseif ($relaxationReason === null || $approvalReference === null) {
            throw new WorkOrderFlowException('放寬標準必須填寫放寬原因與客戶同意佐證。', 400);
        }

        $serviceParams = [
            'stage_id' => $stageId,
            'screening_service_id' => (int)$sourceService['screening_service_id'],
            'source_service_detail_id' => $sourceService['source_service_detail_id'],
            'source_stage_service_id' => $sourceStageServiceId,
            'service_name' => mb_substr(trim((string)($rawService['service_name'] ?? $sourceService['service_name'])), 0, 255),
            'service_name_en' => nullableStageTransferText($rawService['service_name_en'] ?? $sourceService['service_name_en'], 255),
            'tolerance_plus_value' => stageServiceNullableNumber($rawService, 'tolerance_plus_value', $sourceService),
            'tolerance_plus_over' => stageServiceNullableNumber($rawService, 'tolerance_plus_over', $sourceService),
            'tolerance_minus_value' => stageServiceNullableNumber($rawService, 'tolerance_minus_value', $sourceService),
            'tolerance_minus_over' => stageServiceNullableNumber($rawService, 'tolerance_minus_over', $sourceService),
            'ppm_standard' => array_key_exists('ppm_standard', $rawService)
                ? (int)$rawService['ppm_standard']
                : $sourceService['ppm_standard'],
            'relaxation_reason' => $relaxationReason,
            'customer_approval_reference' => $approvalReference,
            'sort_order' => $index + 1,
            'created_by_employee_id' => $employeeId,
        ];
        $insertService->execute($serviceParams);
    }
    return $stageId;
}

/**
 * @param array<string,mixed> $sourceResult
 * @param array<string,mixed> $payload
 */
function createTerminalFlowInventory(
    PDO $pdo,
    array $sourceResult,
    int $transferId,
    string $quality,
    float $units,
    float $netWeight,
    array $payload,
    int $employeeId
): int {
    $selectedOutputTools = [];
    $toolWeight = 0.0;
    $toolQuantity = 0;
    if ($quality === 'good') {
        $outputToolIds = array_values(array_filter(array_map(
            static fn($id): int => (int)$id,
            is_array($payload['output_tool_ids'] ?? null) ? $payload['output_tool_ids'] : []
        )));
        if ($outputToolIds === []) {
            throw new WorkOrderFlowException('良品入庫必須選擇實際出料載具。', 400);
        }
        $placeholders = implode(',', array_fill(0, count($outputToolIds), '?'));
        $toolStmt = $pdo->prepare("
            SELECT *
            FROM work_order_machine_output_tools
            WHERE id IN ({$placeholders})
              AND machine_result_id = ?
              AND inventory_item_id IS NULL
            FOR UPDATE
        ");
        $toolStmt->execute([...$outputToolIds, (int)$sourceResult['id']]);
        $selectedOutputTools = $toolStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if (count($selectedOutputTools) !== count(array_unique($outputToolIds))) {
            throw new WorkOrderFlowException('出料載具已入庫、重複選擇或不屬於此機台結果。', 409);
        }
        foreach ($selectedOutputTools as $tool) {
            $toolWeight += (float)$tool['total_weight_kg'];
            $toolQuantity += (int)$tool['quantity'];
        }
    }

    $selectedPackages = [];
    if ($quality === 'defect') {
        $packageIds = array_values(array_filter(array_map(
            static fn($id): int => (int)$id,
            is_array($payload['package_ids'] ?? null) ? $payload['package_ids'] : []
        )));
        if ($packageIds === []) {
            throw new WorkOrderFlowException('不良品入庫必須選擇實際包／袋。', 400);
        }
        $placeholders = implode(',', array_fill(0, count($packageIds), '?'));
        $packageStmt = $pdo->prepare("
            SELECT package_row.*,
                   inventory_package.id AS inventory_package_id,
                   inventory_package.package_status AS inventory_package_status
            FROM work_order_machine_result_packages package_row
            LEFT JOIN inventory_packages inventory_package
              ON inventory_package.source_machine_package_id = package_row.id
            WHERE package_row.id IN ({$placeholders})
              AND package_row.machine_result_id = ?
              AND package_row.package_status = 'available'
              AND (
                  inventory_package.id IS NULL
                  OR inventory_package.package_status = 'voided'
              )
            FOR UPDATE
        ");
        $packageStmt->execute([...$packageIds, (int)$sourceResult['id']]);
        $selectedPackages = $packageStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if (count($selectedPackages) !== count(array_unique($packageIds))) {
            throw new WorkOrderFlowException('不良品包裝已入庫、重複選擇或不屬於此機台結果。', 409);
        }
        $packageUnits = array_sum(array_map(
            static fn(array $package): float => (float)$package['contained_units'],
            $selectedPackages
        ));
        $packageWeight = array_sum(array_map(
            static fn(array $package): float => (float)$package['content_weight_kg'],
            $selectedPackages
        ));
        if (abs($packageUnits - $units) > 0.0001 || abs($packageWeight - $netWeight) > 0.001) {
            throw new WorkOrderFlowException(
                '所選不良品包裝的支數與重量必須等於本次入庫數量。',
                409,
                [
                    'package_units' => $packageUnits,
                    'package_weight_kg' => round($packageWeight, 3),
                    'transfer_units' => $units,
                    'transfer_net_weight_kg' => $netWeight,
                ]
            );
        }
    }

    $inventoryNumber = generateInventoryNumber($pdo);
    $grossWeight = $quality === 'good' ? round($netWeight + $toolWeight, 3) : $netWeight;
    $toolStatistics = $quality === 'good'
        ? json_encode(array_map(static function (array $tool): array {
            return [
                'tool_number' => $tool['tool_number'],
                'tool_name' => $tool['tool_name'],
                'use_mode' => $tool['use_mode'],
                'quantity' => (int)$tool['quantity'],
                'total_weight_kg' => (float)$tool['total_weight_kg'],
            ];
        }, $selectedOutputTools), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        : null;
    $insertInventory = $pdo->prepare("
        INSERT INTO inventory_items (
            screening_item_id, inventory_number, receipt_type, stock_category,
            work_order_id, order_item_id, order_id, customer_id, customer_batch_number,
            total_good_units, total_defect_units,
            quantity_on_hand, quantity_allocated, quantity_reserved, quantity_shipped,
            net_weight_kg, gross_weight_kg, tool_weight_kg, weight_per_unit_g,
            tool_statistics, total_tool_quantity,
            quality_status, status, notes, received_at, created_by_employee_id
        ) VALUES (
            :screening_item_id, :inventory_number, 'standard', :stock_category,
            :work_order_id, :order_item_id, :order_id, :customer_id, :customer_batch_number,
            :total_good_units, :total_defect_units,
            :quantity_on_hand, 0, 0, 0,
            :net_weight_kg, :gross_weight_kg, :tool_weight_kg, :weight_per_unit_g,
            :tool_statistics, :total_tool_quantity,
            'qualified', 'in_stock', :notes, NOW(), :created_by_employee_id
        )
    ");
    $insertInventory->execute([
        'screening_item_id' => (int)$sourceResult['screening_item_id'],
        'inventory_number' => $inventoryNumber,
        'stock_category' => $quality,
        'work_order_id' => (int)$sourceResult['work_order_id'],
        'order_item_id' => (int)$sourceResult['order_item_id'],
        'order_id' => (int)$sourceResult['order_id'],
        'customer_id' => (int)$sourceResult['customer_id'],
        'customer_batch_number' => $sourceResult['customer_batch_number'],
        'total_good_units' => $quality === 'good' ? $units : 0,
        'total_defect_units' => $quality === 'defect' ? $units : 0,
        'quantity_on_hand' => $units,
        'net_weight_kg' => $netWeight,
        'gross_weight_kg' => $grossWeight,
        'tool_weight_kg' => $quality === 'good' ? round($toolWeight, 3) : 0,
        'weight_per_unit_g' => (float)$sourceResult['weight_per_unit_g'],
        'tool_statistics' => $toolStatistics,
        'total_tool_quantity' => $quality === 'good' ? $toolQuantity : 0,
        'notes' => $quality === 'good'
            ? '工單製程終點良品入庫'
            : '工單製程終點不良品入庫；塑膠袋不計重量',
        'created_by_employee_id' => $employeeId,
    ]);
    $inventoryItemId = (int)$pdo->lastInsertId();

    ensureInventoryItemSource($pdo, $inventoryItemId, 'work_order_stage_output', $transferId, [
        'source_order_id' => (int)$sourceResult['order_id'],
        'source_order_item_id' => (int)$sourceResult['order_item_id'],
        'source_work_order_id' => (int)$sourceResult['work_order_id'],
        'source_stage_id' => (int)$sourceResult['stage_id'],
        'source_machine_result_id' => (int)$sourceResult['id'],
        'source_stage_transfer_id' => $transferId,
    ], $quality === 'good' ? '機台終點良品輸出' : '機台終點不良品輸出');

    $pdo->prepare("
        INSERT INTO inventory_transactions (
            inventory_item_id, order_id, order_item_id, work_order_id,
            ref_type, ref_id, direction, quantity, after_quantity,
            notes, created_by_employee_id
        ) VALUES (
            :inventory_item_id, :order_id, :order_item_id, :work_order_id,
            'work_order_stage_transfer', :ref_id, 'inbound', :quantity, :after_quantity,
            :notes, :created_by_employee_id
        )
    ")->execute([
        'inventory_item_id' => $inventoryItemId,
        'order_id' => (int)$sourceResult['order_id'],
        'order_item_id' => (int)$sourceResult['order_item_id'],
        'work_order_id' => (int)$sourceResult['work_order_id'],
        'ref_id' => $transferId,
        'quantity' => $units,
        'after_quantity' => $units,
        'notes' => $quality === 'good'
            ? "製程終點良品入庫 {$units} 支"
            : "製程終點不良品入庫 {$units} 支／" . count($selectedPackages) . ' 筆包裝',
        'created_by_employee_id' => $employeeId,
    ]);

    if ($quality === 'good') {
        $toolIds = array_map(static fn(array $tool): int => (int)$tool['id'], $selectedOutputTools);
        $placeholders = implode(',', array_fill(0, count($toolIds), '?'));
        $pdo->prepare("
            UPDATE work_order_machine_output_tools
            SET inventory_item_id = ?,
                output_status = 'stored'
            WHERE id IN ({$placeholders})
        ")->execute([$inventoryItemId, ...$toolIds]);
    } else {
        $insertPackage = $pdo->prepare("
            INSERT INTO inventory_packages (
                inventory_item_id, source_machine_package_id, package_number,
                package_unit, package_quantity, contained_units,
                content_weight_kg, package_status
            ) VALUES (
                :inventory_item_id, :source_machine_package_id, :package_number,
                :package_unit, :package_quantity, :contained_units,
                :content_weight_kg, 'available'
            )
            ON DUPLICATE KEY UPDATE
                inventory_item_id = VALUES(inventory_item_id),
                package_number = VALUES(package_number),
                package_unit = VALUES(package_unit),
                package_quantity = VALUES(package_quantity),
                contained_units = VALUES(contained_units),
                content_weight_kg = VALUES(content_weight_kg),
                package_status = 'available'
        ");
        $markPackage = $pdo->prepare("
            UPDATE work_order_machine_result_packages
            SET package_status = 'stored'
            WHERE id = :id
        ");
        foreach ($selectedPackages as $package) {
            $insertPackage->execute([
                'inventory_item_id' => $inventoryItemId,
                'source_machine_package_id' => (int)$package['id'],
                'package_number' => $package['package_number'],
                'package_unit' => $package['package_unit'],
                'package_quantity' => (int)$package['package_quantity'],
                'contained_units' => (float)$package['contained_units'],
                'content_weight_kg' => (float)$package['content_weight_kg'],
            ]);
            $markPackage->execute(['id' => (int)$package['id']]);
        }
    }
    return $inventoryItemId;
}

function reverseWorkOrderStageTransfer(PDO $pdo, int $transferId, int $employeeId, string $reason): int
{
    if ($reason === '') {
        throw new WorkOrderFlowException('撤銷轉流必須填寫原因。', 400);
    }
    $stmt = $pdo->prepare("
        SELECT transfer_row.*, source_stage.work_order_id
        FROM work_order_stage_transfers transfer_row
        JOIN work_order_stages source_stage ON source_stage.id = transfer_row.source_stage_id
        WHERE transfer_row.id = :id
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute(['id' => $transferId]);
    $transfer = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$transfer) {
        throw new WorkOrderFlowException('找不到指定的轉流。', 404);
    }
    if ($transfer['transfer_status'] !== 'completed') {
        throw new WorkOrderFlowException('此轉流不是可撤銷的完成狀態。', 409);
    }
    $workOrderId = (int)$transfer['work_order_id'];

    if ($transfer['inventory_item_id'] !== null) {
        $inventoryId = (int)$transfer['inventory_item_id'];
        $inventoryStmt = $pdo->prepare("
            SELECT *
            FROM inventory_items
            WHERE id = :id
              AND deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $inventoryStmt->execute(['id' => $inventoryId]);
        $inventory = $inventoryStmt->fetch(PDO::FETCH_ASSOC);
        if (!$inventory) {
            throw new WorkOrderFlowException('轉流關聯庫存不存在，請人工查核。', 409);
        }
        $shippingStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM shipping_order_items shipping_item
            INNER JOIN shipping_orders shipping_order
                ON shipping_order.id = shipping_item.shipping_order_id
            WHERE shipping_item.inventory_item_id = :inventory_item_id
              AND shipping_order.deleted_at IS NULL
        ");
        $shippingStmt->execute(['inventory_item_id' => $inventoryId]);
        if ((float)$inventory['quantity_allocated'] > 0
            || (float)$inventory['quantity_shipped'] > 0
            || (int)$shippingStmt->fetchColumn() > 0) {
            throw new WorkOrderFlowException('此庫存已有配貨或出貨，不能撤銷上游轉流。', 409);
        }
        $pdo->prepare("
            INSERT INTO inventory_transactions (
                inventory_item_id, order_id, order_item_id, work_order_id,
                ref_type, ref_id, direction, quantity, after_quantity,
                notes, created_by_employee_id
            ) VALUES (
                :inventory_item_id, :order_id, :order_item_id, :work_order_id,
                'work_order_stage_transfer_reversal', :ref_id, 'outbound',
                :quantity, 0, :notes, :created_by_employee_id
            )
        ")->execute([
            'inventory_item_id' => $inventoryId,
            'order_id' => (int)$inventory['order_id'],
            'order_item_id' => (int)$inventory['order_item_id'],
            'work_order_id' => $workOrderId,
            'ref_id' => $transferId,
            'quantity' => (float)$inventory['quantity_on_hand'],
            'notes' => '撤銷製程終點入庫：' . mb_substr($reason, 0, 180),
            'created_by_employee_id' => $employeeId,
        ]);
        $pdo->prepare("
            UPDATE inventory_items
            SET quantity_on_hand = 0,
                status = 'voided',
                deleted_at = NOW(),
                delete_token = id
            WHERE id = :id
        ")->execute(['id' => $inventoryId]);
        $pdo->prepare("
            UPDATE work_order_machine_output_tools
            SET inventory_item_id = NULL,
                output_status = 'planned'
            WHERE inventory_item_id = :inventory_item_id
        ")->execute(['inventory_item_id' => $inventoryId]);
        $packageSourceStmt = $pdo->prepare("
            SELECT source_machine_package_id
            FROM inventory_packages
            WHERE inventory_item_id = :inventory_item_id
            FOR UPDATE
        ");
        $packageSourceStmt->execute(['inventory_item_id' => $inventoryId]);
        $sourcePackageIds = array_map('intval', $packageSourceStmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
        $pdo->prepare("
            UPDATE inventory_packages
            SET package_status = 'voided'
            WHERE inventory_item_id = :inventory_item_id
        ")->execute(['inventory_item_id' => $inventoryId]);
        if ($sourcePackageIds !== []) {
            $placeholders = implode(',', array_fill(0, count($sourcePackageIds), '?'));
            $pdo->prepare("
                UPDATE work_order_machine_result_packages
                SET package_status = 'available'
                WHERE id IN ({$placeholders})
            ")->execute($sourcePackageIds);
        }
    } elseif ($transfer['target_stage_id'] !== null) {
        $targetStageId = (int)$transfer['target_stage_id'];
        $impactStmt = $pdo->prepare("
            SELECT
                (SELECT COUNT(*) FROM work_order_machine_runs
                 WHERE stage_id = :run_stage_id
                   AND deleted_at IS NULL
                   AND (status NOT IN ('pending', 'cancelled') OR actual_start_date IS NOT NULL)) AS started_runs,
                (SELECT COUNT(*) FROM work_order_stage_transfers
                 WHERE target_stage_id = :transfer_stage_id
                   AND id <> :transfer_id
                   AND transfer_status = 'completed') AS other_inputs,
                (SELECT COALESCE(SUM(transferred_units), 0) FROM work_order_stage_transfers
                 WHERE target_stage_id = :transfer_units_stage_id
                   AND id <> :transfer_units_id
                   AND transfer_status = 'completed') AS other_input_units,
                (SELECT COALESCE(SUM(planned_units), 0) FROM work_order_machine_runs
                 WHERE stage_id = :planned_stage_id
                   AND deleted_at IS NULL
                   AND status <> 'cancelled') AS planned_units
        ");
        $impactStmt->execute([
            'run_stage_id' => $targetStageId,
            'transfer_stage_id' => $targetStageId,
            'transfer_id' => $transferId,
            'transfer_units_stage_id' => $targetStageId,
            'transfer_units_id' => $transferId,
            'planned_stage_id' => $targetStageId,
        ]);
        $impact = $impactStmt->fetch(PDO::FETCH_ASSOC) ?: [];
        if ((int)($impact['started_runs'] ?? 0) > 0) {
            throw new WorkOrderFlowException('目標二次篩分已開始生產，不能撤銷來源轉流。', 409);
        }
        if ((int)($impact['other_inputs'] ?? 0) > 0
            && (float)($impact['planned_units'] ?? 0) - (float)($impact['other_input_units'] ?? 0) > 0.0001) {
            throw new WorkOrderFlowException(
                '撤銷後會使二次篩分機台規劃超過剩餘來源支數，請先調整尚未開始的機台規劃。',
                409,
                [
                    'remaining_input_units' => (float)($impact['other_input_units'] ?? 0),
                    'planned_units' => (float)($impact['planned_units'] ?? 0),
                ]
            );
        }
        if ((int)($impact['other_inputs'] ?? 0) === 0) {
            $pdo->prepare("
                UPDATE work_order_stages
                SET status = 'cancelled',
                    cancelled_at = NOW(),
                    cancelled_by_employee_id = :employee_id
                WHERE id = :id
            ")->execute(['employee_id' => $employeeId, 'id' => $targetStageId]);
            $pdo->prepare("
                UPDATE work_order_machine_runs
                SET status = 'cancelled',
                    deleted_at = COALESCE(deleted_at, NOW())
                WHERE stage_id = :stage_id
                  AND status = 'pending'
            ")->execute(['stage_id' => $targetStageId]);
        }
    }

    $pdo->prepare("
        UPDATE work_order_stage_transfers
        SET transfer_status = 'reversed',
            reversed_at = NOW(),
            reversed_by_employee_id = :employee_id,
            reverse_reason = :reason
        WHERE id = :id
    ")->execute([
        'employee_id' => $employeeId,
        'reason' => mb_substr($reason, 0, 2000),
        'id' => $transferId,
    ]);
    appendWorkOrderOperationLog($pdo, $workOrderId, 'reverse_stage_transfer', '撤銷製程轉流', [
        'related_table' => 'work_order_stage_transfers',
        'related_id' => $transferId,
        'notes' => $reason,
        'created_by_employee_id' => $employeeId,
    ]);
    logAuditAction('Reversed work order stage transfer', 'work_order_stage_transfers', $transferId, [
        'work_order_id' => $workOrderId,
        'reason' => $reason,
    ]);
    return $workOrderId;
}

/** @param array<string,mixed> $payload @param array<string,mixed> $source */
function stageServiceNullableNumber(array $payload, string $field, array $source): ?float
{
    $value = array_key_exists($field, $payload) ? $payload[$field] : ($source[$field] ?? null);
    if ($value === null || $value === '') {
        return null;
    }
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false) {
        throw new WorkOrderFlowException('二次篩分規格數值格式不正確。', 400, ['field' => $field]);
    }
    return round((float)$number, 4);
}

function nullableStageTransferText($value, int $maxLength = 2000): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, $maxLength);
}
