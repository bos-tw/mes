<?php
/**
 * 工單完整製程圖。
 *
 * @endpoint GET /api/work_orders/flow.php?work_order_id={id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/flow_helpers.php';

requireAuth();
requireMethod('GET');

$workOrderId = (int)($_GET['work_order_id'] ?? $_GET['id'] ?? 0);
if ($workOrderId <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
}

$pdo = db();

try {
    if (!$pdo->inTransaction()) {
        $pdo->beginTransaction();
    }
    ensureWorkOrderFlowInitialized($pdo, $workOrderId);
    $pdo->commit();

    jsonResponse([
        'success' => true,
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ]);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '讀取工單製程失敗，請稍後重試。');
}
