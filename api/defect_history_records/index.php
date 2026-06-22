<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();
requireMethod(['GET']);

$pdo = db();
$filters = readDefectHistoryFilters();
$total = countDefectHistoryRecords($pdo, $filters);
$rows = fetchDefectHistoryRecords($pdo, $filters);

jsonResponse([
    'success' => true,
    'data' => $rows,
    'pagination' => [
        'page' => (int)$filters['page'],
        'perPage' => (int)$filters['perPage'],
        'total' => $total,
        'totalPages' => (int)ceil($total / max((int)$filters['perPage'], 1)),
    ],
    'customers' => getCustomersForDefectHistory($pdo),
    'sourceTypeOptions' => getDefectHistorySourceTypeOptions(),
]);
