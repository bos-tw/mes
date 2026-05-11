<?php
declare(strict_types=1);
/**
 * Domain Event Outbox API - 刪除事件
 * 
 * DELETE /api/domain_event_outbox/delete.php?id={id}
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的事件 ID'], 400);
}

$pdo = db();
$existing = findEvent($pdo, $id);

if (!$existing) {
    jsonResponse(['success' => false, 'message' => '找不到指定的事件'], 404);
}

$stmt = $pdo->prepare("DELETE FROM domain_event_outbox WHERE id = :id");
$stmt->execute([':id' => $id]);

jsonResponse([
    'success' => true,
    'message' => '事件已刪除',
]);
