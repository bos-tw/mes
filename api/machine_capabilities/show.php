<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的機台能力 ID。'], 400);
}

$item = findMachineCapability(db(), $id);
if (!$item) {
    jsonResponse(['success' => false, 'message' => '找不到指定的機台能力。'], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformMachineCapability($item),
]);
