<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentEmployee = requireAuth();
$pdo = db();
$method = requireMethod(['GET', 'POST']);

if ($method === 'GET') {
    $result = listRescreenBatches($pdo, $_GET);
    jsonResponse([
        'success' => true,
        'data' => $result['data'],
        'pagination' => $result['pagination'],
    ]);
}

$payload = getJsonInput();
if (!is_array($payload) || $payload === []) {
    jsonResponse(['success' => false, 'message' => '請提供有效的 JSON 資料。'], 400);
}

$returnOrderId = filter_var(
    $payload['source_return_order_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
$workOrderId = filter_var(
    $payload['source_work_order_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
if ($returnOrderId === false && $workOrderId === false) {
    jsonResponse(['success' => false, 'message' => '請選擇來源退貨單或來源生產工單。'], 400);
}

try {
    $pdo->beginTransaction();
    if ($returnOrderId !== false) {
        $batch = createRescreenBatchFromReturnOrder($pdo, (int)$returnOrderId, $payload, $currentEmployee);
        $sourceAudit = ['source_return_order_id' => (int)$returnOrderId];
    } else {
        $batch = createRescreenBatchFromWorkOrder($pdo, (int)$workOrderId, $payload, $currentEmployee);
        $sourceAudit = ['source_work_order_id' => (int)$workOrderId];
    }
    logAuditAction('Create rescreen batch', 'rescreen_batches', (int)($batch['id'] ?? 0), [
        ...$sourceAudit,
        'rescreen_type' => $payload['rescreen_type'] ?? 'strict_rescreen',
        'second_screening_reason' => $payload['second_screening_reason'] ?? null,
    ]);
    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '二次篩選案件已建立。',
        'data' => $batch,
    ], 201);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Create rescreen batch failed: ' . $throwable->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage(
            $throwable instanceof Exception ? $throwable : new RuntimeException($throwable->getMessage()),
            '建立二次篩選案件失敗，請稍後重試。'
        ),
    ], $throwable instanceof InvalidArgumentException ? 400 : 500);
}
