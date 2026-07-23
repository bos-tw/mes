<?php
/**
 * 生產工單正式製程 CSV 匯出。
 *
 * 以「工單／階段／機台／結果版本」為一列，保留一般流程、二次篩分、
 * 機台原始 100、實秤換算 99、圖片要求、轉流、載具與包袋追溯資料。
 *
 * @endpoint GET /api/work_orders/export.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('GET');

const WORK_ORDER_EXPORT_MAX_ROWS = 50000;
const WORK_ORDER_EXPORT_MAX_SELECTED_IDS = 5000;

$pdo = db();
$where = [
    'wo.deleted_at IS NULL',
    "COALESCE(wo.work_order_type, 'normal') <> 'rescreen'",
];
$params = [];

$keyword = trim((string)($_GET['keyword'] ?? ''));
if ($keyword !== '') {
    $where[] = "(
        wo.work_order_number LIKE :keyword_work_order
        OR o.order_number LIKE :keyword_order
        OR oi.order_item_number LIKE :keyword_order_item
        OR oi.customer_batch_number LIKE :keyword_customer_batch
        OR c.name LIKE :keyword_customer
        OR si.name LIKE :keyword_screening_item
    )";
    foreach ([
        'keyword_work_order',
        'keyword_order',
        'keyword_order_item',
        'keyword_customer_batch',
        'keyword_customer',
        'keyword_screening_item',
    ] as $keywordKey) {
        $params[$keywordKey] = '%' . $keyword . '%';
    }
}

$machineId = filter_var($_GET['machine_id'] ?? null, FILTER_VALIDATE_INT, [
    'options' => ['min_range' => 1],
]);
if ($machineId) {
    $where[] = 'COALESCE(run.machine_id, wo.machine_id) = :machine_id';
    $params['machine_id'] = $machineId;
}

$status = trim((string)($_GET['status'] ?? ''));
if ($status !== '') {
    $where[] = 'status_lookup.value_key = :status';
    $params['status'] = $status;
}

$startDate = trim((string)($_GET['start_date'] ?? ''));
if ($startDate !== '') {
    $where[] = 'wo.actual_start_date >= :start_date';
    $params['start_date'] = $startDate . ' 00:00:00';
}

$endDate = trim((string)($_GET['end_date'] ?? ''));
if ($endDate !== '') {
    $where[] = 'wo.actual_start_date <= :end_date';
    $params['end_date'] = $endDate . ' 23:59:59';
}

$selectedIds = [];
foreach (explode(',', (string)($_GET['ids'] ?? '')) as $rawId) {
    $id = filter_var(trim($rawId), FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id) {
        $selectedIds[$id] = $id;
    }
}
$selectedIds = array_values($selectedIds);
if (count($selectedIds) > WORK_ORDER_EXPORT_MAX_SELECTED_IDS) {
    jsonResponse([
        'success' => false,
        'message' => '單次最多可匯出 ' . WORK_ORDER_EXPORT_MAX_SELECTED_IDS . ' 筆指定工單。',
    ], 422);
}
if ($selectedIds !== []) {
    $idPlaceholders = [];
    foreach ($selectedIds as $index => $selectedId) {
        $key = 'selected_id_' . $index;
        $idPlaceholders[] = ':' . $key;
        $params[$key] = $selectedId;
    }
    $where[] = 'wo.id IN (' . implode(', ', $idPlaceholders) . ')';
}

$whereClause = implode(' AND ', $where);
$sql = "
    SELECT
        wo.id AS work_order_id,
        wo.work_order_number,
        o.order_number,
        oi.order_item_number,
        oi.customer_batch_number,
        c.name AS customer_name,
        si.name AS screening_item_name,
        status_lookup.value_label AS work_order_status,
        stage.id AS stage_id,
        stage.stage_sequence,
        stage.stage_instance_no,
        stage.stage_type,
        stage.secondary_mode,
        stage.source_quality,
        stage.status AS stage_status,
        stage.spec_mode,
        stage.image_requirement,
        stage.image_min_count,
        (
            SELECT GROUP_CONCAT(
                CONCAT(
                    service_row.service_name,
                    CASE
                        WHEN service_row.tolerance_plus_value IS NULL
                         AND service_row.tolerance_minus_value IS NULL
                         AND service_row.ppm_standard IS NULL THEN ''
                        ELSE CONCAT(
                            '[',
                            COALESCE(service_row.tolerance_plus_value, ''),
                            '/',
                            COALESCE(service_row.tolerance_minus_value, ''),
                            CASE
                                WHEN service_row.ppm_standard IS NULL THEN ''
                                ELSE CONCAT('; PPM ', service_row.ppm_standard)
                            END,
                            ']'
                        )
                    END
                )
                ORDER BY service_row.sort_order, service_row.id
                SEPARATOR '；'
            )
            FROM work_order_stage_services service_row
            WHERE service_row.stage_id = stage.id
        ) AS service_summary,
        (
            SELECT GROUP_CONCAT(
                DISTINCT NULLIF(service_row.relaxation_reason, '')
                ORDER BY service_row.id
                SEPARATOR '；'
            )
            FROM work_order_stage_services service_row
            WHERE service_row.stage_id = stage.id
        ) AS relaxation_reason,
        (
            SELECT GROUP_CONCAT(
                DISTINCT NULLIF(service_row.customer_approval_reference, '')
                ORDER BY service_row.id
                SEPARATOR '；'
            )
            FROM work_order_stage_services service_row
            WHERE service_row.stage_id = stage.id
        ) AS customer_approval_reference,
        run.id AS machine_run_id,
        run.run_label,
        machine.name AS machine_name,
        run.machine_sequence,
        run.status AS machine_run_status,
        run.planned_units,
        run.planned_net_weight_kg,
        run.actual_start_date AS machine_actual_start_date,
        run.actual_end_date AS machine_actual_end_date,
        (
            SELECT GROUP_CONCAT(
                CONCAT(
                    COALESCE(NULLIF(card.card_number, ''), CONCAT('卡號', card.card_sequence)),
                    '(',
                    COALESCE(card.card_reference_units, 0),
                    '支)',
                    '=',
                    COALESCE(card.actual_net_weight_kg, 0),
                    'kg'
                )
                ORDER BY card.card_sequence, card.id
                SEPARATOR '；'
            )
            FROM production_records card
            WHERE card.machine_run_id = run.id
        ) AS card_summary,
        result_row.id AS machine_result_id,
        result_row.result_revision,
        result_row.machine_processed_units,
        result_row.machine_good_units,
        result_row.machine_defect_units,
        result_row.defect_weight_kg,
        result_row.weight_per_unit_g,
        result_row.settled_defect_units,
        result_row.defect_difference_units,
        result_row.result_status,
        result_row.confirmed_at,
        (
            SELECT COUNT(*)
            FROM work_order_machine_result_images image_row
            WHERE image_row.machine_result_id = result_row.id
              AND image_row.deleted_at IS NULL
        ) AS uploaded_image_count,
        (
            SELECT GROUP_CONCAT(
                CONCAT(
                    transfer_row.source_quality,
                    '→',
                    transfer_row.route,
                    CASE
                        WHEN transfer_row.secondary_mode IS NULL THEN ''
                        ELSE CONCAT('(', transfer_row.secondary_mode, ')')
                    END,
                    ':',
                    transfer_row.transferred_units,
                    '支'
                )
                ORDER BY transfer_row.id
                SEPARATOR '；'
            )
            FROM work_order_stage_transfers transfer_row
            WHERE transfer_row.source_machine_result_id = result_row.id
        ) AS transfer_summary,
        (
            SELECT GROUP_CONCAT(
                CONCAT(
                    output_tool.use_mode,
                    ':',
                    output_tool.tool_name,
                    '×',
                    output_tool.quantity,
                    '(',
                    output_tool.total_weight_kg,
                    'kg)'
                )
                ORDER BY output_tool.id
                SEPARATOR '；'
            )
            FROM work_order_machine_output_tools output_tool
            WHERE output_tool.machine_result_id = result_row.id
        ) AS output_tool_summary,
        (
            SELECT GROUP_CONCAT(
                CONCAT(
                    package_row.package_number,
                    ':',
                    package_row.contained_units,
                    '支/',
                    package_row.package_quantity,
                    CASE package_row.package_unit
                        WHEN 'bag' THEN '袋'
                        WHEN 'package' THEN '包'
                        ELSE package_row.package_unit
                    END,
                    '(',
                    package_row.content_weight_kg,
                    'kg)'
                )
                ORDER BY package_row.id
                SEPARATOR '；'
            )
            FROM work_order_machine_result_packages package_row
            WHERE package_row.machine_result_id = result_row.id
        ) AS defect_package_summary
    FROM work_orders wo
    JOIN order_items oi ON oi.id = wo.order_item_id
    JOIN orders o ON o.id = oi.order_id
    JOIN customers c ON c.id = o.customer_id
    LEFT JOIN screening_items si ON si.id = oi.screening_item_id
    LEFT JOIN lookup_values status_lookup ON status_lookup.id = wo.status_lookup_id
    LEFT JOIN work_order_stages stage ON stage.work_order_id = wo.id
    LEFT JOIN work_order_machine_runs run
      ON run.work_order_id = wo.id
     AND run.stage_id = stage.id
     AND run.deleted_at IS NULL
    LEFT JOIN machines machine ON machine.id = run.machine_id
    LEFT JOIN work_order_machine_results result_row
      ON result_row.work_order_id = wo.id
     AND result_row.stage_id = stage.id
     AND result_row.machine_run_id = run.id
    WHERE {$whereClause}
    ORDER BY
        wo.id DESC,
        stage.stage_sequence,
        stage.stage_instance_no,
        run.machine_sequence,
        run.id,
        result_row.result_revision
    LIMIT " . WORK_ORDER_EXPORT_MAX_ROWS;

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $value) {
    $stmt->bindValue(
        ':' . $key,
        $value,
        is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR
    );
}
$stmt->execute();

$timestamp = (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Ymd_His');
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="work_orders_' . $timestamp . '.csv"');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

echo "\xEF\xBB\xBF";
$output = fopen('php://output', 'wb');
if ($output === false) {
    throw new RuntimeException('無法開啟工單匯出串流。');
}
$writeCsv = static function ($stream, array $columns): void {
    fputcsv($stream, $columns, ',', '"', '');
};

$writeCsv($output, [
    '工單號碼',
    '訂單號碼',
    '訂單明細',
    '客戶批號',
    '客戶名稱',
    '受篩產品',
    '工單狀態',
    '階段',
    '二次篩分方式',
    '來源品質',
    '階段狀態',
    '規格模式',
    '篩分規格',
    '放寬原因',
    '客戶同意／佐證',
    '機台執行',
    '機台',
    '機台狀態',
    '預計支數',
    '預計淨重(kg)',
    '卡號與實際重量',
    '結果版本',
    '機台處理支數',
    '原始良品支數',
    '原始不良支數(100)',
    '不良品實秤淨重(kg)',
    '單支重快照(g)',
    '入庫不良支數(99)',
    '不良差異支數',
    '圖片要求',
    '最低圖片張數',
    '已上傳圖片張數',
    '轉流',
    '良品出料載具',
    '不良品包／袋',
    '結果狀態',
    '結果確認時間',
]);

$stageTypeLabels = ['primary' => '生產與篩分', 'secondary' => '二次篩分'];
$secondaryModeLabels = ['second_process' => '第二道工序', 'relaxed_standard' => '放寬標準'];
$qualityLabels = ['good' => '良品', 'defect' => '不良品'];
$imageRequirementLabels = ['required' => '必填', 'optional' => '選填'];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $writeCsv($output, [
        $row['work_order_number'] ?? '',
        $row['order_number'] ?? '',
        $row['order_item_number'] ?? '',
        $row['customer_batch_number'] ?? '',
        $row['customer_name'] ?? '',
        $row['screening_item_name'] ?? '',
        $row['work_order_status'] ?? '',
        $stageTypeLabels[$row['stage_type'] ?? ''] ?? ($row['stage_type'] ?? ''),
        $secondaryModeLabels[$row['secondary_mode'] ?? ''] ?? ($row['secondary_mode'] ?? ''),
        $qualityLabels[$row['source_quality'] ?? ''] ?? ($row['source_quality'] ?? ''),
        $row['stage_status'] ?? '',
        $row['spec_mode'] ?? '',
        $row['service_summary'] ?? '',
        $row['relaxation_reason'] ?? '',
        $row['customer_approval_reference'] ?? '',
        $row['run_label'] ?? '',
        $row['machine_name'] ?? '',
        $row['machine_run_status'] ?? '',
        $row['planned_units'] ?? '',
        $row['planned_net_weight_kg'] ?? '',
        $row['card_summary'] ?? '',
        $row['result_revision'] ?? '',
        $row['machine_processed_units'] ?? '',
        $row['machine_good_units'] ?? '',
        $row['machine_defect_units'] ?? '',
        $row['defect_weight_kg'] ?? '',
        $row['weight_per_unit_g'] ?? '',
        $row['settled_defect_units'] ?? '',
        $row['defect_difference_units'] ?? '',
        $imageRequirementLabels[$row['image_requirement'] ?? ''] ?? ($row['image_requirement'] ?? ''),
        $row['image_min_count'] ?? '',
        $row['uploaded_image_count'] ?? 0,
        $row['transfer_summary'] ?? '',
        $row['output_tool_summary'] ?? '',
        $row['defect_package_summary'] ?? '',
        $row['result_status'] ?? '',
        $row['confirmed_at'] ?? '',
    ]);
}

fclose($output);
exit;
