<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentEmployee = requireAuth();
requireMethod('POST');

$payload = getJsonInput();
if (!is_array($payload) || $payload === []) {
    jsonResponse(['success' => false, 'message' => '請提供有效的 JSON 資料。'], 400);
}

$returnOrderId = filter_var(
    $payload['return_order_id'] ?? $payload['source_return_order_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
if ($returnOrderId === false) {
    jsonResponse(['success' => false, 'message' => '來源退貨單為必填。'], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();
    $batch = createRescreenBatchFromReturnOrder($pdo, (int)$returnOrderId, $payload, $currentEmployee);
    logAuditAction('Create rescreen batch from return order', 'rescreen_batches', (int)($batch['id'] ?? 0), [
        'source_return_order_id' => (int)$returnOrderId,
    ]);
    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '已由退貨單建立二次篩選案件。',
        'data' => $batch,
    ], 201);
} catch (Exception $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Create rescreen batch from return order failed: ' . $exception->getMessage());
    $statusCode = $exception instanceof InvalidArgumentException ? 400 : 500;
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '建立二次篩選案件失敗，請稍後重試。'),
    ], $statusCode);
}
