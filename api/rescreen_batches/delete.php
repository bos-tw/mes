<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少有效的案件 ID。'], 400);
}

$pdo = db();
$batch = getRescreenBatchDetails($pdo, $id);
if ($batch === null) {
    jsonResponse(['success' => false, 'message' => '找不到指定的二次重篩案件。'], 404);
}

$blockingImpacts = [];
if (!empty($batch['rescreen_work_order_id'])) {
    $blockingImpacts[] = '已建立執行工單，請先處理工單追溯。';
}
if (!empty($batch['defects']) && count((array)$batch['defects']) > 0) {
    $blockingImpacts[] = '已有二次重篩再次不良紀錄。';
}

$inventorySourceStmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM inventory_item_sources
    WHERE source_rescreen_batch_id = :source_rescreen_batch_id
");
$inventorySourceStmt->execute(['source_rescreen_batch_id' => $id]);
$inventorySourceCount = (int)$inventorySourceStmt->fetchColumn();
if ($inventorySourceCount > 0) {
    $blockingImpacts[] = "已有 {$inventorySourceCount} 筆庫存來源鏈引用。";
}

if ($blockingImpacts !== []) {
    jsonResponse([
        'success' => false,
        'message' => '此二次重篩案件已有下游追溯資料，無法直接刪除。',
        'impacts' => $blockingImpacts,
    ], 409);
}

$stmt = $pdo->prepare("
    UPDATE rescreen_batches
    SET
        deleted_at = NOW(),
        delete_token = id
    WHERE id = :id
      AND deleted_at IS NULL
");
$stmt->execute(['id' => $id]);

logAuditAction('Delete rescreen batch', 'rescreen_batches', $id, [
    'rescreen_batch_number' => $batch['rescreen_batch_number'] ?? null,
    'source_return_order_id' => $batch['source_return_order_id'] ?? null,
]);

jsonResponse([
    'success' => true,
    'message' => '二次重篩案件已刪除。',
]);
