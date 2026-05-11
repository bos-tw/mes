<?php
declare(strict_types=1);
/**
 * Domain Event Outbox API - 取得單筆事件
 * 
 * GET /api/domain_event_outbox/show.php?id={id}
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的事件 ID'], 400);
}

$pdo = db();
$event = findEvent($pdo, $id);

if (!$event) {
    jsonResponse(['success' => false, 'message' => '找不到指定的事件'], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformEvent($event),
]);
