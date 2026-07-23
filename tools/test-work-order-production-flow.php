<?php
/**
 * 工單正式製程的資料庫整合回歸。
 *
 * 測試只讀取既有資料，初始化驗證包在交易內並強制回滾，不留下測試資料。
 */
declare(strict_types=1);

require_once __DIR__ . '/../api/bootstrap.php';
require_once __DIR__ . '/../api/work_orders/flow_helpers.php';

$assertions = 0;

function assertProductionFlow(bool $condition, string $message): void
{
    global $assertions;
    $assertions++;
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$pdo = db();
$requiredTables = [
    'work_order_stages',
    'work_order_stage_services',
    'work_order_machine_results',
    'work_order_stage_transfers',
    'work_order_machine_result_images',
    'work_order_machine_input_tools',
    'work_order_machine_output_tools',
    'work_order_machine_result_packages',
    'inventory_packages',
    'shipping_order_item_packages',
];
$tableStmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
");
foreach ($requiredTables as $table) {
    $tableStmt->execute([$table]);
    assertProductionFlow((int)$tableStmt->fetchColumn() === 1, "缺少正式製程資料表：{$table}");
}

$columnChecks = [
    ['inventory_items', 'stock_category'],
    ['shipping_order_items', 'stock_category_snapshot'],
    ['work_order_machine_runs', 'stage_id'],
    ['production_records', 'card_reference_units'],
    ['production_records', 'actual_gross_weight_kg'],
    ['production_records', 'actual_net_weight_kg'],
    ['work_order_first_piece_dimensions', 'inspection_round'],
];
$columnStmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
");
foreach ($columnChecks as [$table, $column]) {
    $columnStmt->execute([$table, $column]);
    assertProductionFlow((int)$columnStmt->fetchColumn() === 1, "缺少欄位：{$table}.{$column}");
}

$invalidConfirmedStmt = $pdo->query("
    SELECT COUNT(*)
    FROM (
        SELECT machine_run_id
        FROM work_order_machine_results
        WHERE result_status = 'confirmed'
        GROUP BY machine_run_id
        HAVING COUNT(*) > 1
    ) invalid_confirmed
");
assertProductionFlow(
    (int)$invalidConfirmedStmt->fetchColumn() === 0,
    '同一機台不可同時存在兩筆有效確認結果。'
);

$overTransferStmt = $pdo->query("
    SELECT COUNT(*)
    FROM (
        SELECT
            result_row.id,
            result_row.machine_good_units,
            result_row.settled_defect_units,
            COALESCE(SUM(CASE
                WHEN transfer_row.transfer_status = 'completed'
                 AND transfer_row.source_quality = 'good'
                THEN transfer_row.transferred_units ELSE 0 END), 0) AS transferred_good,
            COALESCE(SUM(CASE
                WHEN transfer_row.transfer_status = 'completed'
                 AND transfer_row.source_quality = 'defect'
                THEN transfer_row.transferred_units ELSE 0 END), 0) AS transferred_defect
        FROM work_order_machine_results result_row
        LEFT JOIN work_order_stage_transfers transfer_row
          ON transfer_row.source_machine_result_id = result_row.id
        GROUP BY result_row.id, result_row.machine_good_units, result_row.settled_defect_units
        HAVING transferred_good > result_row.machine_good_units
            OR transferred_defect > result_row.settled_defect_units
    ) invalid_transfer
");
assertProductionFlow(
    (int)$overTransferStmt->fetchColumn() === 0,
    '轉流數量不可超過機台確認結果。'
);

$workOrderId = (int)($pdo->query("
    SELECT wo.id
    FROM work_orders wo
    INNER JOIN order_items oi ON oi.id = wo.order_item_id
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE wo.deleted_at IS NULL
    ORDER BY wo.id
    LIMIT 1
")->fetchColumn() ?: 0);

if ($workOrderId > 0) {
    $employeeId = (int)($pdo->query("SELECT id FROM employees ORDER BY id LIMIT 1")->fetchColumn() ?: 0);
    if ($employeeId > 0) {
        $_SESSION['employee_id'] = $employeeId;
    }

    $pdo->beginTransaction();
    try {
        $first = ensureWorkOrderFlowInitialized($pdo, $workOrderId);
        $second = ensureWorkOrderFlowInitialized($pdo, $workOrderId);
        assertProductionFlow($first === $second, '流程初始化必須具冪等性且保持穩定 ID。');

        $flow = fetchWorkOrderFlow($pdo, $workOrderId);
        $primaryStages = array_values(array_filter(
            $flow['stages'] ?? [],
            static fn(array $stage): bool => $stage['stage_type'] === 'primary'
        ));
        assertProductionFlow(count($primaryStages) === 1, '每張工單必須只有一個一般生產與篩分階段。');
        assertProductionFlow(
            (int)$primaryStages[0]['id'] === (int)$first['stage_id'],
            '流程查詢與初始化的階段 ID 必須一致。'
        );

        $serviceIds = array_map(
            static fn(array $service): int => (int)$service['screening_service_id'],
            $primaryStages[0]['services'] ?? []
        );
        assertProductionFlow(
            count($serviceIds) === count(array_unique($serviceIds)),
            '階段服務快照不可重複。'
        );

        if ($first['machine_run_id'] !== null) {
            $run = lockWorkOrderMachineRun($pdo, $workOrderId, (int)$first['machine_run_id']);
            assertProductionFlow(
                (int)$run['stage_id'] === (int)$first['stage_id'],
                '機台必須綁定正確的工單階段。'
            );
        }
    } finally {
        $pdo->rollBack();
    }
}

echo "Work-order production-flow integration tests passed: {$assertions} assertions.\n";
