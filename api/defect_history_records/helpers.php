<?php
/**
 * 不良品歷史紀錄模組輔助函式
 *
 * @module defect_history_records
 * @table work_order_screening_defects
 * @table work_order_machine_defects
 * @table shipping_order_defect_summaries
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../work_orders/helpers.php';

function getDefectHistorySourceTypeOptions(): array
{
    return [
        ['value' => 'work_order_screening', 'label' => '工單篩分不良'],
        ['value' => 'work_order_machine', 'label' => '拆分機台不良'],
        ['value' => 'shipping_defect_summary', 'label' => '出貨不良摘要'],
    ];
}

function getDefectHistorySourceTypeLabel(string $sourceType): string
{
    static $labels = [
        'work_order_screening' => '工單篩分不良',
        'work_order_machine' => '拆分機台不良',
        'shipping_defect_summary' => '出貨不良摘要',
    ];

    return $labels[$sourceType] ?? $sourceType;
}

function readDefectHistoryFilters(): array
{
    $perPage = (int)($_GET['perPage'] ?? 20);
    if ($perPage <= 0) {
        $perPage = 20;
    }

    return [
        'page' => max(1, (int)($_GET['page'] ?? 1)),
        'perPage' => min($perPage, 100),
        'keyword' => trim((string)($_GET['keyword'] ?? '')),
        'source_type' => trim((string)($_GET['source_type'] ?? '')),
        'customer_id' => filter_input(INPUT_GET, 'customer_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
        'order_id' => filter_input(INPUT_GET, 'order_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
        'work_order_id' => filter_input(INPUT_GET, 'work_order_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
        'shipping_order_id' => filter_input(INPUT_GET, 'shipping_order_id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
        'date_from' => trim((string)($_GET['date_from'] ?? '')),
        'date_to' => trim((string)($_GET['date_to'] ?? '')),
    ];
}

function getDefectHistoryUnionSql(): string
{
    return <<<SQL
SELECT
    CAST('work_order_screening' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS source_type,
    CONVERT(CONCAT('work_order_screening:', wosd.id) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS row_key,
    wosd.id AS source_record_id,
    wosd.recorded_at AS occurred_at,
    o.id AS order_id,
    CONVERT(o.order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS order_number,
    wo.id AS work_order_id,
    CONVERT(wo.work_order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_number,
    CONVERT(wo.work_order_type USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_type,
    wo.order_item_id AS order_item_id,
    NULL AS shipping_order_id,
    CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS shipping_order_number,
    c.id AS customer_id,
    CONVERT(c.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS customer_name,
    wosd.screening_service_id AS screening_service_id,
    CONVERT(COALESCE(NULLIF(wosd.service_name, ''), ss.name, CONCAT('服務#', wosd.screening_service_id)) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS defect_item_name,
    CAST(wosd.defect_quantity AS DECIMAL(14,2)) AS recorded_defect_quantity,
    NULL AS weight_per_unit_g,
    NULL AS total_weight_kg,
    CONVERT(wosd.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci AS notes
FROM work_order_screening_defects wosd
INNER JOIN work_orders wo ON wo.id = wosd.work_order_id AND wo.deleted_at IS NULL
LEFT JOIN order_items oi ON oi.id = wo.order_item_id
LEFT JOIN orders o ON o.id = oi.order_id AND o.deleted_at IS NULL
LEFT JOIN customers c ON c.id = o.customer_id AND c.deleted_at IS NULL
LEFT JOIN screening_services ss ON ss.id = wosd.screening_service_id

UNION ALL

SELECT
    CAST('work_order_machine' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS source_type,
    CONVERT(CONCAT('work_order_machine:', womd.id) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS row_key,
    womd.id AS source_record_id,
    womd.recorded_at AS occurred_at,
    o.id AS order_id,
    CONVERT(o.order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS order_number,
    wo.id AS work_order_id,
    CONVERT(wo.work_order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_number,
    CONVERT(wo.work_order_type USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_type,
    wo.order_item_id AS order_item_id,
    NULL AS shipping_order_id,
    CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS shipping_order_number,
    c.id AS customer_id,
    CONVERT(c.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS customer_name,
    womd.screening_service_id AS screening_service_id,
    CONVERT(COALESCE(NULLIF(womd.service_name, ''), ss.name, CONCAT('服務#', womd.screening_service_id)) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS defect_item_name,
    CAST(womd.defect_quantity AS DECIMAL(14,2)) AS recorded_defect_quantity,
    NULL AS weight_per_unit_g,
    NULL AS total_weight_kg,
    CONVERT(womd.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci AS notes
FROM work_order_machine_defects womd
INNER JOIN work_orders wo ON wo.id = womd.work_order_id AND wo.deleted_at IS NULL
LEFT JOIN order_items oi ON oi.id = wo.order_item_id
LEFT JOIN orders o ON o.id = oi.order_id AND o.deleted_at IS NULL
LEFT JOIN customers c ON c.id = o.customer_id AND c.deleted_at IS NULL
LEFT JOIN screening_services ss ON ss.id = womd.screening_service_id

UNION ALL

SELECT
    CAST('shipping_defect_summary' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS source_type,
    CONVERT(CONCAT('shipping_defect_summary:', sods.id) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS row_key,
    sods.id AS source_record_id,
    COALESCE(sods.updated_at, sods.created_at) AS occurred_at,
    COALESCE(so.order_id, o.id) AS order_id,
    CONVERT(o.order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS order_number,
    wo.id AS work_order_id,
    CONVERT(wo.work_order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_number,
    CONVERT(wo.work_order_type USING utf8mb4) COLLATE utf8mb4_unicode_ci AS work_order_type,
    wo.order_item_id AS order_item_id,
    so.id AS shipping_order_id,
    CONVERT(so.shipping_order_number USING utf8mb4) COLLATE utf8mb4_unicode_ci AS shipping_order_number,
    COALESCE(so.customer_id, o.customer_id) AS customer_id,
    CONVERT(c.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS customer_name,
    NULL AS screening_service_id,
    CAST('出貨不良摘要' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS defect_item_name,
    CAST(sods.defect_quantity AS DECIMAL(14,2)) AS recorded_defect_quantity,
    sods.weight_per_unit_g AS weight_per_unit_g,
    sods.total_weight_kg AS total_weight_kg,
    CONVERT(sods.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci AS notes
FROM shipping_order_defect_summaries sods
INNER JOIN shipping_orders so ON so.id = sods.shipping_order_id AND so.deleted_at IS NULL
LEFT JOIN inventory_items ii ON ii.id = sods.source_inventory_item_id
LEFT JOIN work_orders wo ON wo.id = COALESCE(sods.source_work_order_id, ii.work_order_id) AND wo.deleted_at IS NULL
LEFT JOIN orders o ON o.id = COALESCE(so.order_id, ii.order_id) AND o.deleted_at IS NULL
LEFT JOIN customers c ON c.id = COALESCE(so.customer_id, o.customer_id) AND c.deleted_at IS NULL
SQL;
}

function buildDefectHistoryWhereClause(array $filters): array
{
    $conditions = [];
    $params = [];

    if (($filters['source_type'] ?? '') !== '') {
        $conditions[] = 'records.source_type = :source_type';
        $params['source_type'] = $filters['source_type'];
    }

    if (!empty($filters['customer_id'])) {
        $conditions[] = 'records.customer_id = :customer_id';
        $params['customer_id'] = (int)$filters['customer_id'];
    }

    if (!empty($filters['order_id'])) {
        $conditions[] = 'records.order_id = :order_id';
        $params['order_id'] = (int)$filters['order_id'];
    }

    if (!empty($filters['work_order_id'])) {
        $conditions[] = 'records.work_order_id = :work_order_id';
        $params['work_order_id'] = (int)$filters['work_order_id'];
    }

    if (!empty($filters['shipping_order_id'])) {
        $conditions[] = 'records.shipping_order_id = :shipping_order_id';
        $params['shipping_order_id'] = (int)$filters['shipping_order_id'];
    }

    if (($filters['date_from'] ?? '') !== '') {
        $conditions[] = 'DATE(records.occurred_at) >= :date_from';
        $params['date_from'] = $filters['date_from'];
    }

    if (($filters['date_to'] ?? '') !== '') {
        $conditions[] = 'DATE(records.occurred_at) <= :date_to';
        $params['date_to'] = $filters['date_to'];
    }

    if (($filters['keyword'] ?? '') !== '') {
        $conditions[] = '(
            records.order_number LIKE :keyword
            OR records.work_order_number LIKE :keyword
            OR records.shipping_order_number LIKE :keyword
            OR records.customer_name LIKE :keyword
            OR records.defect_item_name LIKE :keyword
            OR records.notes LIKE :keyword
        )';
        $params['keyword'] = '%' . $filters['keyword'] . '%';
    }

    return [
        'sql' => $conditions === [] ? '' : 'WHERE ' . implode(' AND ', $conditions),
        'params' => $params,
    ];
}

function countDefectHistoryRecords(PDO $pdo, array $filters): int
{
    $where = buildDefectHistoryWhereClause($filters);
    $sql = sprintf(
        'SELECT COUNT(*) FROM (%s) AS records %s',
        getDefectHistoryUnionSql(),
        $where['sql']
    );

    $stmt = $pdo->prepare($sql);
    foreach ($where['params'] as $name => $value) {
        $stmt->bindValue(':' . $name, $value);
    }
    $stmt->execute();

    return (int)$stmt->fetchColumn();
}

function fetchDefectHistoryRecords(PDO $pdo, array $filters): array
{
    $page = (int)($filters['page'] ?? 1);
    $perPage = (int)($filters['perPage'] ?? 20);
    $offset = ($page - 1) * $perPage;
    $where = buildDefectHistoryWhereClause($filters);

    $sql = sprintf(
        'SELECT records.*
         FROM (%s) AS records
         %s
         ORDER BY records.occurred_at DESC, records.source_record_id DESC
         LIMIT :limit OFFSET :offset',
        getDefectHistoryUnionSql(),
        $where['sql']
    );

    $stmt = $pdo->prepare($sql);
    foreach ($where['params'] as $name => $value) {
        $stmt->bindValue(':' . $name, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($rows === []) {
        return [];
    }

    return enrichDefectHistoryRecords($pdo, $rows);
}

function enrichDefectHistoryRecords(PDO $pdo, array $rows): array
{
    $workOrderMeta = [];
    foreach ($rows as $row) {
        $workOrderId = isset($row['work_order_id']) ? (int)$row['work_order_id'] : 0;
        $orderItemId = isset($row['order_item_id']) ? (int)$row['order_item_id'] : 0;
        if ($workOrderId > 0 && $orderItemId > 0 && !isset($workOrderMeta[$workOrderId])) {
            $workOrderMeta[$workOrderId] = [
                'order_item_id' => $orderItemId,
                'work_order_type' => (string)($row['work_order_type'] ?? 'normal'),
            ];
        }
    }

    $manualTotals = fetchWorkOrderDefectDistributionTotals($pdo, array_keys($workOrderMeta));
    $metricsMap = [];

    foreach ($workOrderMeta as $workOrderId => $meta) {
        $orderItemDetails = fetchOrderItemDetailsForWorkOrder($pdo, (int)$meta['order_item_id']);
        if (!$orderItemDetails) {
            continue;
        }

        $weightPerUnitG = round((float)($orderItemDetails['weight_per_unit_g'] ?? 0), 3);
        $orderNetWeightKg = round((float)($orderItemDetails['net_weight'] ?? 0), 3);
        $productionSummary = fetchWorkOrderProductionSummary(
            $pdo,
            $workOrderId,
            (string)($meta['work_order_type'] ?: 'normal'),
            $weightPerUnitG
        );
        $actualNetWeightKg = round((float)($productionSummary['produced_net_weight_kg'] ?? 0), 3);
        $defectWeightKg = round(max($orderNetWeightKg - $actualNetWeightKg, 0), 3);
        $defectUnitsEstimated = (float)workOrderDefectUnitsFromWeight($defectWeightKg, $weightPerUnitG);

        $metricsMap[$workOrderId] = [
            'weight_per_unit_g' => $weightPerUnitG,
            'order_net_weight_kg' => $orderNetWeightKg,
            'actual_net_weight_kg' => $actualNetWeightKg,
            'defect_weight_kg' => $defectWeightKg,
            'defect_units_estimated' => round($defectUnitsEstimated, 2),
            'defect_distribution_units_total' => round((float)($manualTotals[$workOrderId] ?? 0), 2),
        ];
    }

    $result = [];
    foreach ($rows as $row) {
        $sourceType = (string)($row['source_type'] ?? '');
        $workOrderId = isset($row['work_order_id']) ? (int)$row['work_order_id'] : 0;
        $shippingWeightPerUnit = isset($row['weight_per_unit_g']) ? (float)$row['weight_per_unit_g'] : 0.0;
        $shippingTotalWeightKg = isset($row['total_weight_kg']) ? (float)$row['total_weight_kg'] : 0.0;

        $record = [
            'id' => (string)($row['row_key'] ?? ''),
            'source_type' => $sourceType,
            'source_type_label' => getDefectHistorySourceTypeLabel($sourceType),
            'source_record_id' => isset($row['source_record_id']) ? (int)$row['source_record_id'] : 0,
            'occurred_at' => $row['occurred_at'] ?? null,
            'order_id' => isset($row['order_id']) && $row['order_id'] !== null ? (int)$row['order_id'] : null,
            'order_number' => (string)($row['order_number'] ?? ''),
            'work_order_id' => $workOrderId > 0 ? $workOrderId : null,
            'work_order_number' => (string)($row['work_order_number'] ?? ''),
            'shipping_order_id' => isset($row['shipping_order_id']) && $row['shipping_order_id'] !== null ? (int)$row['shipping_order_id'] : null,
            'shipping_order_number' => (string)($row['shipping_order_number'] ?? ''),
            'customer_id' => isset($row['customer_id']) && $row['customer_id'] !== null ? (int)$row['customer_id'] : null,
            'customer_name' => (string)($row['customer_name'] ?? ''),
            'defect_item_name' => (string)($row['defect_item_name'] ?? ''),
            'recorded_defect_quantity' => round((float)($row['recorded_defect_quantity'] ?? 0), 2),
            'notes' => (string)($row['notes'] ?? ''),
            'work_order_type' => (string)($row['work_order_type'] ?? ''),
            'weight_per_unit_g' => $shippingWeightPerUnit > 0 ? round($shippingWeightPerUnit, 3) : null,
            'total_weight_kg' => $shippingTotalWeightKg > 0 ? round($shippingTotalWeightKg, 3) : null,
            'defect_units_estimated' => null,
            'defect_weight_kg' => null,
            'defect_distribution_units_total' => null,
            'order_net_weight_kg' => null,
            'actual_net_weight_kg' => null,
        ];

        if ($sourceType === 'shipping_defect_summary') {
            $estimatedUnits = $shippingWeightPerUnit > 0
                ? workOrderDefectUnitsFromWeight($shippingTotalWeightKg, $shippingWeightPerUnit)
                : (float)$record['recorded_defect_quantity'];
            $record['defect_units_estimated'] = round((float)$estimatedUnits, 2);
            $record['defect_weight_kg'] = round($shippingTotalWeightKg, 3);
            $record['defect_distribution_units_total'] = round((float)$record['recorded_defect_quantity'], 2);
        } elseif ($workOrderId > 0 && isset($metricsMap[$workOrderId])) {
            $record = array_merge($record, $metricsMap[$workOrderId]);
        }

        $result[] = $record;
    }

    return $result;
}

function fetchWorkOrderDefectDistributionTotals(PDO $pdo, array $workOrderIds): array
{
    $normalizedIds = array_values(array_filter(array_map('intval', $workOrderIds), static fn(int $id): bool => $id > 0));
    if ($normalizedIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($normalizedIds), '?'));
    $sql = <<<SQL
SELECT defect_source.work_order_id, SUM(defect_source.defect_quantity) AS total_quantity
FROM (
    SELECT work_order_id, defect_quantity
    FROM work_order_screening_defects
    WHERE work_order_id IN ($placeholders)

    UNION ALL

    SELECT work_order_id, defect_quantity
    FROM work_order_machine_defects
    WHERE work_order_id IN ($placeholders)
) AS defect_source
GROUP BY defect_source.work_order_id
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge($normalizedIds, $normalizedIds));

    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $result[(int)$row['work_order_id']] = (float)($row['total_quantity'] ?? 0);
    }

    return $result;
}

function getCustomersForDefectHistory(PDO $pdo): array
{
    $stmt = $pdo->query("
        SELECT id, name
        FROM customers
        WHERE deleted_at IS NULL
        ORDER BY name ASC, id ASC
    ");

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}
