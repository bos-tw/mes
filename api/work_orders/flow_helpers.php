<?php
/**
 * 生產工單製程閉環共用函式。
 *
 * 新流程以 work_order_stages / work_order_machine_runs 的穩定 ID 為核心，
 * 不得以刪除後重建機台的方式保存。
 */
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

final class WorkOrderFlowException extends RuntimeException
{
    /** @var array<string,mixed> */
    private array $details;

    /** @param array<string,mixed> $details */
    public function __construct(string $message, int $status = 400, array $details = [])
    {
        parent::__construct($message, $status);
        $this->details = $details;
    }

    public function httpStatus(): int
    {
        $status = $this->getCode();
        return $status >= 400 && $status <= 599 ? $status : 400;
    }

    /** @return array<string,mixed> */
    public function details(): array
    {
        return $this->details;
    }
}

function workOrderFlowEmployeeId(): ?int
{
    $employeeId = $_SESSION['employee']['id'] ?? ($_SESSION['employee_id'] ?? null);
    return $employeeId !== null && (int)$employeeId > 0 ? (int)$employeeId : null;
}

function workOrderFlowRequireEmployeeId(): int
{
    $employeeId = workOrderFlowEmployeeId();
    if ($employeeId === null) {
        throw new WorkOrderFlowException('找不到目前操作人員，請重新登入。', 401);
    }
    return $employeeId;
}

function workOrderFlowPositiveId($value, string $label): int
{
    $id = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        throw new WorkOrderFlowException("{$label}不正確。", 400);
    }
    return (int)$id;
}

function workOrderFlowNonNegativeNumber($value, string $label, int $scale = 2): float
{
    if ($value === null || $value === '') {
        throw new WorkOrderFlowException("{$label}不可留空。", 400);
    }
    $number = filter_var($value, FILTER_VALIDATE_FLOAT);
    if ($number === false || $number < 0) {
        throw new WorkOrderFlowException("{$label}必須為非負數。", 400);
    }
    return round((float)$number, $scale);
}

/**
 * 建立工單後的正式流程骨架。函式具冪等性，可供舊資料相容與兩個建立入口共用。
 *
 * @return array{stage_id:int,machine_run_id:?int}
 */
function ensureWorkOrderFlowInitialized(PDO $pdo, int $workOrderId, bool $ensureFirstMachineRun = true): array
{
    $workOrderStmt = $pdo->prepare("
        SELECT
            wo.*,
            oi.id AS source_order_item_id,
            oi.production_image_requirement AS order_item_image_requirement,
            oi.production_image_min_count AS order_item_image_min_count,
            c.id AS customer_id,
            c.production_image_requirement AS customer_image_requirement,
            c.production_image_min_count AS customer_image_min_count
        FROM work_orders wo
        JOIN order_items oi ON oi.id = wo.order_item_id
        JOIN orders o ON o.id = oi.order_id
        JOIN customers c ON c.id = o.customer_id
        WHERE wo.id = :id
          AND wo.deleted_at IS NULL
        LIMIT 1
    ");
    $workOrderStmt->execute(['id' => $workOrderId]);
    $workOrder = $workOrderStmt->fetch(PDO::FETCH_ASSOC);
    if (!$workOrder) {
        throw new WorkOrderFlowException('找不到工單，無法建立生產流程。', 404);
    }

    $employeeId = workOrderFlowEmployeeId();
    $requirement = trim((string)($workOrder['order_item_image_requirement'] ?? ''));
    $requirementSource = 'order_item';
    $requirementSourceId = (int)$workOrder['source_order_item_id'];
    $minimumCount = $workOrder['order_item_image_min_count'];
    if ($requirement === '') {
        $requirement = trim((string)($workOrder['customer_image_requirement'] ?? ''));
        $requirementSource = 'customer';
        $requirementSourceId = (int)$workOrder['customer_id'];
        $minimumCount = $workOrder['customer_image_min_count'];
    }
    if (!in_array($requirement, ['optional', 'required'], true)) {
        $requirement = 'optional';
        $requirementSource = 'default';
        $requirementSourceId = null;
        $minimumCount = 0;
    }
    $minimumCount = max((int)($minimumCount ?? 0), $requirement === 'required' ? 1 : 0);

    $stageStmt = $pdo->prepare("
        SELECT id
        FROM work_order_stages
        WHERE work_order_id = :work_order_id
          AND stage_sequence = 1
          AND stage_instance_no = 1
        LIMIT 1
    ");
    $stageStmt->execute(['work_order_id' => $workOrderId]);
    $stageId = (int)($stageStmt->fetchColumn() ?: 0);

    if ($stageId <= 0) {
        $insertStage = $pdo->prepare("
            INSERT INTO work_order_stages (
                work_order_id, stage_sequence, stage_instance_no, stage_type,
                status, spec_mode, image_requirement, image_min_count,
                started_at, completed_at, created_by_employee_id
            ) VALUES (
                :work_order_id, 1, 1, 'primary',
                :status, 'original', :image_requirement, :image_min_count,
                :started_at, :completed_at, :created_by
            )
        ");
        $insertStage->execute([
            'work_order_id' => $workOrderId,
            'status' => !empty($workOrder['completed_at'])
                ? 'completed'
                : (!empty($workOrder['actual_start_date']) ? 'in_progress' : 'pending'),
            'image_requirement' => $requirement,
            'image_min_count' => $minimumCount,
            'started_at' => $workOrder['actual_start_date'] ?? null,
            'completed_at' => $workOrder['completed_at'] ?? null,
            'created_by' => $employeeId,
        ]);
        $stageId = (int)$pdo->lastInsertId();
    }

    $imageRequirementStmt = $pdo->prepare("
        INSERT INTO work_order_image_requirements (
            work_order_id, stage_id, image_type, requirement_level,
            minimum_count, source_type, source_id, created_by_employee_id
        ) VALUES (
            :work_order_id, :stage_id, 'machine_screen', :requirement_level,
            :minimum_count, :source_type, :source_id, :created_by
        )
        ON DUPLICATE KEY UPDATE id = id
    ");
    $imageRequirementStmt->execute([
        'work_order_id' => $workOrderId,
        'stage_id' => $stageId,
        'requirement_level' => $requirement,
        'minimum_count' => $minimumCount,
        'source_type' => $requirementSource,
        'source_id' => $requirementSourceId,
        'created_by' => $employeeId,
    ]);

    $snapshotServicesStmt = $pdo->prepare("
        INSERT INTO work_order_stage_services (
            stage_id, screening_service_id, source_service_detail_id,
            service_name, service_name_en,
            tolerance_plus_value, tolerance_plus_over,
            tolerance_minus_value, tolerance_minus_over,
            ppm_standard, sort_order, created_by_employee_id
        )
        SELECT
            :stage_id,
            detail.screening_service_id,
            detail.id,
            COALESCE(NULLIF(detail.service_name, ''), service.name, '未命名篩分服務'),
            detail.service_name_en,
            detail.tolerance_plus_value,
            detail.tolerance_plus_over,
            detail.tolerance_minus_value,
            detail.tolerance_minus_over,
            detail.ppm_standard,
            detail.id,
            :created_by
        FROM order_item_screening_details detail
        LEFT JOIN screening_services service ON service.id = detail.screening_service_id
        WHERE detail.order_item_id = :order_item_id
          AND detail.id = (
              SELECT MIN(deduplicated.id)
              FROM order_item_screening_details deduplicated
              WHERE deduplicated.order_item_id = detail.order_item_id
                AND deduplicated.screening_service_id = detail.screening_service_id
          )
          AND NOT EXISTS (
              SELECT 1
              FROM work_order_stage_services existing_service
              WHERE existing_service.stage_id = :existing_stage_id
                AND existing_service.screening_service_id = detail.screening_service_id
          )
    ");
    $snapshotServicesStmt->execute([
        'stage_id' => $stageId,
        'created_by' => $employeeId,
        'order_item_id' => (int)$workOrder['order_item_id'],
        'existing_stage_id' => $stageId,
    ]);

    $runStmt = $pdo->prepare("
        SELECT id
        FROM work_order_machine_runs
        WHERE work_order_id = :work_order_id
          AND stage_id = :stage_id
          AND deleted_at IS NULL
        ORDER BY machine_sequence ASC, id ASC
        LIMIT 1
    ");
    $runStmt->execute(['work_order_id' => $workOrderId, 'stage_id' => $stageId]);
    $machineRunId = (int)($runStmt->fetchColumn() ?: 0);

    if ($ensureFirstMachineRun && $machineRunId <= 0) {
        $plannedWeight = max((float)($workOrder['total_weight_kg'] ?? 0), 0);
        $unitWeight = max((float)($workOrder['weight_per_unit_g'] ?? 0), 0);
        $plannedUnits = max((float)($workOrder['total_units'] ?? $workOrder['quantity_to_produce'] ?? 0), 0);
        if ($plannedUnits <= 0 && $plannedWeight > 0 && $unitWeight > 0) {
            $plannedUnits = round($plannedWeight * 1000 / $unitWeight, 2);
        }
        $insertRun = $pdo->prepare("
            INSERT INTO work_order_machine_runs (
                work_order_id, stage_id, run_label, machine_id, machine_sequence,
                assigned_employee_id, calibration_employee_id,
                scheduled_start_date, scheduled_end_date,
                actual_start_date, actual_end_date,
                quantity_to_produce, screening_speed,
                planned_net_weight_kg, completed_net_weight_kg,
                weight_per_unit_g, planned_units, completed_units,
                status, created_by_employee_id
            ) VALUES (
                :work_order_id, :stage_id, '機台1', :machine_id, 1,
                :assigned_employee_id, :calibration_employee_id,
                :scheduled_start_date, :scheduled_end_date,
                :actual_start_date, :actual_end_date,
                :quantity_to_produce, :screening_speed,
                :planned_net_weight_kg, 0,
                :weight_per_unit_g, :planned_units, 0,
                :status, :created_by
            )
        ");
        $insertRun->execute([
            'work_order_id' => $workOrderId,
            'stage_id' => $stageId,
            'machine_id' => $workOrder['machine_id'] ?: null,
            'assigned_employee_id' => $workOrder['assigned_employee_id'] ?: null,
            'calibration_employee_id' => $workOrder['calibration_employee_id'] ?: null,
            'scheduled_start_date' => $workOrder['scheduled_start_date'] ?: null,
            'scheduled_end_date' => $workOrder['scheduled_end_date'] ?: null,
            'actual_start_date' => $workOrder['actual_start_date'] ?: null,
            'actual_end_date' => $workOrder['actual_end_date'] ?: null,
            'quantity_to_produce' => $workOrder['quantity_to_produce'] ?: null,
            'screening_speed' => $workOrder['screening_speed'] ?: null,
            'planned_net_weight_kg' => round($plannedWeight, 3),
            'weight_per_unit_g' => round($unitWeight, 4),
            'planned_units' => round($plannedUnits, 2),
            'status' => !empty($workOrder['actual_start_date'])
                ? 'in_progress'
                : (!empty($workOrder['scheduled_start_date']) ? 'scheduled' : 'pending'),
            'created_by' => $employeeId,
        ]);
        $machineRunId = (int)$pdo->lastInsertId();
    }

    return [
        'stage_id' => $stageId,
        'machine_run_id' => $machineRunId > 0 ? $machineRunId : null,
    ];
}

/**
 * @return array<string,mixed>
 */
function fetchWorkOrderFlow(PDO $pdo, int $workOrderId, bool $forUpdate = false): array
{
    $workOrderSql = "
        SELECT
            wo.id, wo.work_order_number, wo.order_item_id, wo.work_order_type,
            wo.total_weight_kg, wo.weight_per_unit_g, wo.total_units,
            wo.completed_at, wo.created_at, wo.updated_at,
            oi.order_id, oi.order_item_number, oi.customer_batch_number,
            oi.screening_item_id, o.order_number, o.customer_id,
            c.name AS customer_name, si.name AS screening_item_name
        FROM work_orders wo
        JOIN order_items oi ON oi.id = wo.order_item_id
        JOIN orders o ON o.id = oi.order_id
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN screening_items si ON si.id = oi.screening_item_id
        WHERE wo.id = :id
          AND wo.deleted_at IS NULL
        LIMIT 1
    ";
    if ($forUpdate) {
        $workOrderSql .= ' FOR UPDATE';
    }
    $workOrderStmt = $pdo->prepare($workOrderSql);
    $workOrderStmt->execute(['id' => $workOrderId]);
    $workOrder = $workOrderStmt->fetch(PDO::FETCH_ASSOC);
    if (!$workOrder) {
        throw new WorkOrderFlowException('找不到工單。', 404);
    }

    $simpleQueries = [
        'stages' => "SELECT * FROM work_order_stages WHERE work_order_id = :id ORDER BY stage_sequence, stage_instance_no, id",
        'services' => "
            SELECT service.*
            FROM work_order_stage_services service
            JOIN work_order_stages stage ON stage.id = service.stage_id
            WHERE stage.work_order_id = :id
            ORDER BY service.stage_id, service.sort_order, service.id
        ",
        'requirements' => "SELECT * FROM work_order_image_requirements WHERE work_order_id = :id ORDER BY stage_id, image_type, id",
        'runs' => "
            SELECT run.*, machine.name AS machine_name,
                   assigned.name AS assigned_employee_name,
                   calibration.name AS calibration_employee_name
            FROM work_order_machine_runs run
            LEFT JOIN machines machine ON machine.id = run.machine_id
            LEFT JOIN employees assigned ON assigned.id = run.assigned_employee_id
            LEFT JOIN employees calibration ON calibration.id = run.calibration_employee_id
            WHERE run.work_order_id = :id
              AND run.deleted_at IS NULL
            ORDER BY run.stage_id, run.machine_sequence, run.id
        ",
        'cards' => "
            SELECT record_row.*, employee.name AS employee_name,
                   weighed.name AS weighed_by_name
            FROM production_records record_row
            LEFT JOIN employees employee ON employee.id = record_row.employee_id
            LEFT JOIN employees weighed ON weighed.id = record_row.weighed_by_employee_id
            WHERE record_row.work_order_id = :id
              AND record_row.machine_run_id IS NOT NULL
            ORDER BY record_row.machine_run_id, record_row.card_sequence, record_row.id
        ",
        'input_tools' => "SELECT * FROM work_order_machine_input_tools WHERE work_order_id = :id ORDER BY machine_run_id, id",
        'first_pieces' => "
            SELECT dimension_row.*, employee.name AS measured_by_name
            FROM work_order_first_piece_dimensions dimension_row
            LEFT JOIN employees employee ON employee.id = dimension_row.measured_by_employee_id
            WHERE dimension_row.work_order_id = :id
            ORDER BY dimension_row.machine_run_id, dimension_row.inspection_round, dimension_row.id
        ",
        'results' => "SELECT * FROM work_order_machine_results WHERE work_order_id = :id ORDER BY machine_run_id, result_revision, id",
        'defects' => "SELECT * FROM work_order_machine_defects WHERE work_order_id = :id ORDER BY machine_result_id, screening_service_id, id",
        'images' => "
            SELECT image_row.*
            FROM work_order_machine_result_images image_row
            JOIN work_order_machine_results result_row ON result_row.id = image_row.machine_result_id
            WHERE result_row.work_order_id = :id
              AND image_row.deleted_at IS NULL
            ORDER BY image_row.machine_result_id, image_row.sort_order, image_row.id
        ",
        'packages' => "
            SELECT package_row.*
            FROM work_order_machine_result_packages package_row
            JOIN work_order_machine_results result_row ON result_row.id = package_row.machine_result_id
            WHERE result_row.work_order_id = :id
            ORDER BY package_row.machine_result_id, package_row.id
        ",
        'output_tools' => "
            SELECT output_tool.*
            FROM work_order_machine_output_tools output_tool
            JOIN work_order_machine_results result_row ON result_row.id = output_tool.machine_result_id
            WHERE result_row.work_order_id = :id
            ORDER BY output_tool.machine_result_id, output_tool.id
        ",
        'transfers' => "
            SELECT transfer_row.*
            FROM work_order_stage_transfers transfer_row
            JOIN work_order_stages source_stage ON source_stage.id = transfer_row.source_stage_id
            WHERE source_stage.work_order_id = :id
            ORDER BY transfer_row.source_stage_id, transfer_row.id
        ",
    ];

    $rows = [];
    foreach ($simpleQueries as $key => $sql) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $workOrderId]);
        $rows[$key] = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    $groupBy = static function (array $items, string $column): array {
        $groups = [];
        foreach ($items as $item) {
            $key = (int)($item[$column] ?? 0);
            $groups[$key][] = $item;
        }
        return $groups;
    };

    $servicesByStage = $groupBy($rows['services'], 'stage_id');
    $requirementsByStage = $groupBy($rows['requirements'], 'stage_id');
    $runsByStage = $groupBy($rows['runs'], 'stage_id');
    $cardsByRun = $groupBy($rows['cards'], 'machine_run_id');
    $inputToolsByRun = $groupBy($rows['input_tools'], 'machine_run_id');
    $firstPiecesByRun = $groupBy($rows['first_pieces'], 'machine_run_id');
    $resultsByRun = $groupBy($rows['results'], 'machine_run_id');
    $defectsByResult = $groupBy($rows['defects'], 'machine_result_id');
    $imagesByResult = $groupBy($rows['images'], 'machine_result_id');
    $packagesByResult = $groupBy($rows['packages'], 'machine_result_id');
    $outputToolsByResult = $groupBy($rows['output_tools'], 'machine_result_id');
    $transfersByStage = $groupBy($rows['transfers'], 'source_stage_id');

    $stages = [];
    foreach ($rows['stages'] as $stage) {
        $stageId = (int)$stage['id'];
        $stageRuns = [];
        foreach ($runsByStage[$stageId] ?? [] as $run) {
            $runId = (int)$run['id'];
            $results = [];
            foreach ($resultsByRun[$runId] ?? [] as $result) {
                $resultId = (int)$result['id'];
                $result['defects'] = $defectsByResult[$resultId] ?? [];
                $result['images'] = $imagesByResult[$resultId] ?? [];
                $result['packages'] = $packagesByResult[$resultId] ?? [];
                $result['output_tools'] = $outputToolsByResult[$resultId] ?? [];
                $results[] = $result;
            }
            $run['cards'] = $cardsByRun[$runId] ?? [];
            $run['input_tools'] = $inputToolsByRun[$runId] ?? [];
            $run['first_piece_dimensions'] = $firstPiecesByRun[$runId] ?? [];
            $run['results'] = $results;
            $stageRuns[] = $run;
        }
        $stage['display_name'] = $stage['stage_type'] === 'primary'
            ? '生產與篩分'
            : '二次篩分';
        $stage['services'] = $servicesByStage[$stageId] ?? [];
        $stage['image_requirements'] = $requirementsByStage[$stageId] ?? [];
        $stage['machine_runs'] = $stageRuns;
        $stage['transfers'] = $transfersByStage[$stageId] ?? [];
        $stages[] = $stage;
    }

    $workOrder['stages'] = $stages;
    return $workOrder;
}

/** @return array<string,mixed> */
function lockWorkOrderMachineRun(PDO $pdo, int $workOrderId, int $machineRunId): array
{
    $stmt = $pdo->prepare("
        SELECT run.*, stage.stage_type, stage.secondary_mode, stage.source_quality,
               stage.status AS stage_status, stage.image_requirement, stage.image_min_count
        FROM work_order_machine_runs run
        JOIN work_order_stages stage ON stage.id = run.stage_id
        JOIN work_orders wo ON wo.id = run.work_order_id
        WHERE run.id = :machine_run_id
          AND run.work_order_id = :work_order_id
          AND run.deleted_at IS NULL
          AND wo.deleted_at IS NULL
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([
        'machine_run_id' => $machineRunId,
        'work_order_id' => $workOrderId,
    ]);
    $run = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$run) {
        throw new WorkOrderFlowException('找不到指定的機台執行。', 404);
    }
    if ($run['status'] === 'cancelled' || $run['stage_status'] === 'cancelled') {
        throw new WorkOrderFlowException('已取消的機台或階段不可繼續操作。', 409);
    }
    return $run;
}

function recalculateWorkOrderFlowStatuses(PDO $pdo, int $workOrderId): void
{
    $stageStmt = $pdo->prepare("
        SELECT stage.id,
               SUM(CASE WHEN run.deleted_at IS NULL AND run.status <> 'cancelled' THEN 1 ELSE 0 END) AS active_runs,
               SUM(CASE WHEN run.deleted_at IS NULL AND run.status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) AS open_runs,
               SUM(CASE
                   WHEN result_row.result_status = 'confirmed'
                    AND (
                        COALESCE(result_row.machine_good_units, 0) >
                            COALESCE((SELECT SUM(t.transferred_units) FROM work_order_stage_transfers t
                                      WHERE t.source_machine_result_id = result_row.id
                                        AND t.source_quality = 'good'
                                        AND t.transfer_status = 'completed'), 0)
                        OR
                        COALESCE(result_row.settled_defect_units, 0) >
                            COALESCE((SELECT SUM(t.transferred_units) FROM work_order_stage_transfers t
                                      WHERE t.source_machine_result_id = result_row.id
                                        AND t.source_quality = 'defect'
                                        AND t.transfer_status = 'completed'), 0)
                    )
                   THEN 1 ELSE 0 END) AS open_outputs
        FROM work_order_stages stage
        LEFT JOIN work_order_machine_runs run ON run.stage_id = stage.id
        LEFT JOIN work_order_machine_results result_row
          ON result_row.machine_run_id = run.id
         AND result_row.result_status = 'confirmed'
        WHERE stage.work_order_id = :work_order_id
          AND stage.status <> 'cancelled'
        GROUP BY stage.id
        FOR UPDATE
    ");
    $stageStmt->execute(['work_order_id' => $workOrderId]);
    $stages = $stageStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $updateStage = $pdo->prepare("
        UPDATE work_order_stages
        SET status = :status,
            started_at = CASE WHEN :status_started = 'in_progress' THEN COALESCE(started_at, NOW()) ELSE started_at END,
            completed_at = CASE WHEN :status_completed = 'completed' THEN COALESCE(completed_at, NOW()) ELSE NULL END,
            completed_by_employee_id = CASE
                WHEN :status_completed_by = 'completed' THEN COALESCE(completed_by_employee_id, :employee_id)
                ELSE NULL
            END
        WHERE id = :id
    ");
    $allCompleted = $stages !== [];
    foreach ($stages as $stage) {
        $activeRuns = (int)$stage['active_runs'];
        $openRuns = (int)$stage['open_runs'];
        $openOutputs = (int)$stage['open_outputs'];
        $status = $activeRuns > 0 && $openRuns === 0 && $openOutputs === 0 ? 'completed' : 'in_progress';
        if ($activeRuns === 0) {
            $status = 'pending';
        }
        $allCompleted = $allCompleted && $status === 'completed';
        $updateStage->execute([
            'status' => $status,
            'status_started' => $status,
            'status_completed' => $status,
            'status_completed_by' => $status,
            'employee_id' => workOrderFlowEmployeeId(),
            'id' => (int)$stage['id'],
        ]);
    }

    if ($allCompleted) {
        $completedStatusId = getLookupValueId($pdo, 'status_work_order', 'completed');
        if ($completedStatusId !== null) {
            $pdo->prepare("
                UPDATE work_orders
                SET status_lookup_id = :status_lookup_id,
                    completed_at = COALESCE(completed_at, NOW())
                WHERE id = :id
                  AND deleted_at IS NULL
            ")->execute([
                'status_lookup_id' => $completedStatusId,
                'id' => $workOrderId,
            ]);
        }
    }
}

/**
 * 舊拆分表單相容保存：以穩定 ID 逐筆新增、更新、取消，不刪除重建。
 *
 * @param array<int,array<string,mixed>> $machineRuns
 */
function syncWorkOrderMachineRunsStable(PDO $pdo, int $workOrderId, array $machineRuns): void
{
    $flow = ensureWorkOrderFlowInitialized($pdo, $workOrderId, false);
    $stageId = (int)$flow['stage_id'];
    $employeeId = workOrderFlowEmployeeId();

    $existingStmt = $pdo->prepare("
        SELECT run.*,
               (SELECT COUNT(*) FROM work_order_machine_results result_row
                WHERE result_row.machine_run_id = run.id) AS result_count,
               (SELECT COUNT(*) FROM production_records record_row
                WHERE record_row.machine_run_id = run.id
                  AND (record_row.card_locked_at IS NOT NULL OR record_row.actual_gross_weight_kg IS NOT NULL)) AS locked_card_count,
               (SELECT COUNT(*) FROM work_order_partial_receipts receipt
                WHERE receipt.machine_run_id = run.id
                  AND receipt.receipt_status <> 'reversed') AS receipt_count
        FROM work_order_machine_runs run
        WHERE run.work_order_id = :work_order_id
          AND run.stage_id = :stage_id
          AND run.deleted_at IS NULL
        ORDER BY run.machine_sequence, run.id
        FOR UPDATE
    ");
    $existingStmt->execute(['work_order_id' => $workOrderId, 'stage_id' => $stageId]);
    $existingRows = $existingStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $existingById = [];
    $existingBySequence = [];
    foreach ($existingRows as $existing) {
        $existingById[(int)$existing['id']] = $existing;
        $existingBySequence[(int)$existing['machine_sequence']] = $existing;
    }

    $updateStmt = $pdo->prepare("
        UPDATE work_order_machine_runs
        SET run_label = :run_label,
            machine_id = :machine_id,
            machine_sequence = :machine_sequence,
            assigned_employee_id = :assigned_employee_id,
            calibration_employee_id = :calibration_employee_id,
            scheduled_start_date = :scheduled_start_date,
            scheduled_end_date = :scheduled_end_date,
            actual_start_date = :actual_start_date,
            actual_end_date = :actual_end_date,
            quantity_to_produce = :quantity_to_produce,
            screening_speed = :screening_speed,
            planned_net_weight_kg = :planned_net_weight_kg,
            completed_net_weight_kg = :completed_net_weight_kg,
            weight_per_unit_g = :weight_per_unit_g,
            planned_units = :planned_units,
            completed_units = :completed_units,
            status = :status,
            notes = :notes
        WHERE id = :id
    ");
    $insertStmt = $pdo->prepare("
        INSERT INTO work_order_machine_runs (
            work_order_id, stage_id, run_label, machine_id, machine_sequence,
            assigned_employee_id, calibration_employee_id,
            scheduled_start_date, scheduled_end_date,
            actual_start_date, actual_end_date,
            quantity_to_produce, screening_speed,
            planned_net_weight_kg, completed_net_weight_kg,
            weight_per_unit_g, planned_units, completed_units,
            status, notes, created_by_employee_id
        ) VALUES (
            :work_order_id, :stage_id, :run_label, :machine_id, :machine_sequence,
            :assigned_employee_id, :calibration_employee_id,
            :scheduled_start_date, :scheduled_end_date,
            :actual_start_date, :actual_end_date,
            :quantity_to_produce, :screening_speed,
            :planned_net_weight_kg, :completed_net_weight_kg,
            :weight_per_unit_g, :planned_units, :completed_units,
            :status, :notes, :created_by_employee_id
        )
    ");
    $defectStmt = $pdo->prepare("
        INSERT INTO work_order_machine_defects (
            machine_run_id, work_order_id, screening_service_id,
            service_name, defect_quantity, recorded_at,
            recorded_by_employee_id
        )
        SELECT :machine_run_id, :work_order_id, service.id,
               service.name, :defect_quantity, NOW(), :employee_id
        FROM screening_services service
        WHERE service.id = :screening_service_id
    ");

    $keptIds = [];
    foreach (array_values($machineRuns) as $index => $run) {
        $sequence = $index + 1;
        $requestedId = isset($run['id']) ? (int)$run['id'] : 0;
        $existing = $requestedId > 0
            ? ($existingById[$requestedId] ?? null)
            : ($existingBySequence[$sequence] ?? null);
        if ($requestedId > 0 && !$existing) {
            throw new WorkOrderFlowException('機台執行ID不屬於此工單，無法保存。', 409);
        }
        $params = [
            'run_label' => $run['run_label'],
            'machine_id' => $run['machine_id'],
            'machine_sequence' => $sequence,
            'assigned_employee_id' => $run['assigned_employee_id'],
            'calibration_employee_id' => $run['calibration_employee_id'],
            'scheduled_start_date' => $run['scheduled_start_date'],
            'scheduled_end_date' => $run['scheduled_end_date'],
            'actual_start_date' => $run['actual_start_date'],
            'actual_end_date' => $run['actual_end_date'],
            'quantity_to_produce' => $run['quantity_to_produce'],
            'screening_speed' => $run['screening_speed'] === '' ? null : $run['screening_speed'],
            'planned_net_weight_kg' => $run['planned_net_weight_kg'],
            'completed_net_weight_kg' => $run['completed_net_weight_kg'],
            'weight_per_unit_g' => $run['weight_per_unit_g'],
            'planned_units' => $run['planned_units'],
            'completed_units' => $run['completed_units'],
            'status' => $run['status'],
            'notes' => $run['notes'] === '' ? null : $run['notes'],
        ];
        if ($existing) {
            $hasHistory = (int)$existing['result_count'] > 0
                || (int)$existing['locked_card_count'] > 0
                || (int)$existing['receipt_count'] > 0;
            if ($hasHistory) {
                $protectedFields = [
                    'machine_id', 'planned_net_weight_kg', 'completed_net_weight_kg',
                    'weight_per_unit_g', 'planned_units', 'completed_units',
                ];
                foreach ($protectedFields as $field) {
                    if ((string)$existing[$field] !== (string)$params[$field]
                        && abs((float)$existing[$field] - (float)$params[$field]) > 0.0001) {
                        throw new WorkOrderFlowException(
                            '此機台已有結果、實秤或入庫歷史，不可改寫機台與數量；請使用製程執行頁的更正流程。',
                            409,
                            ['machine_run_id' => (int)$existing['id'], 'field' => $field]
                        );
                    }
                }
            }
            $updateStmt->execute($params + ['id' => (int)$existing['id']]);
            $machineRunId = (int)$existing['id'];
        } else {
            $insertStmt->execute($params + [
                'work_order_id' => $workOrderId,
                'stage_id' => $stageId,
                'created_by_employee_id' => $employeeId,
            ]);
            $machineRunId = (int)$pdo->lastInsertId();
            insertWorkOrderProductionRecords(
                $pdo,
                $workOrderId,
                $run['production_records'] ?? [],
                $machineRunId,
                $run['machine_id']
            );
            foreach ($run['defects'] ?? [] as $defect) {
                $defectStmt->execute([
                    'machine_run_id' => $machineRunId,
                    'work_order_id' => $workOrderId,
                    'defect_quantity' => $defect['defect_quantity'],
                    'employee_id' => $employeeId,
                    'screening_service_id' => $defect['screening_service_id'],
                ]);
            }
        }
        $keptIds[] = $machineRunId;
    }

    foreach ($existingRows as $existing) {
        $existingId = (int)$existing['id'];
        if (in_array($existingId, $keptIds, true)) {
            continue;
        }
        $hasHistory = (int)$existing['result_count'] > 0
            || (int)$existing['locked_card_count'] > 0
            || (int)$existing['receipt_count'] > 0;
        if ($hasHistory) {
            throw new WorkOrderFlowException(
                '送出的機台清單漏掉已有歷史的機台；系統未刪除或覆蓋該資料。',
                409,
                ['machine_run_id' => $existingId]
            );
        }
        $pdo->prepare("
            UPDATE work_order_machine_runs
            SET status = 'cancelled',
                deleted_at = COALESCE(deleted_at, NOW())
            WHERE id = :id
        ")->execute(['id' => $existingId]);
    }
}

/** @param Throwable $throwable */
function respondWorkOrderFlowFailure(Throwable $throwable, string $fallbackMessage): void
{
    if ($throwable instanceof WorkOrderFlowException) {
        $payload = [
            'success' => false,
            'message' => $throwable->getMessage(),
        ];
        if ($throwable->details() !== []) {
            $payload['details'] = $throwable->details();
        }
        jsonResponse($payload, $throwable->httpStatus());
        return;
    }

    error_log($fallbackMessage . ': ' . $throwable->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($throwable, $fallbackMessage),
    ], 500);
}
