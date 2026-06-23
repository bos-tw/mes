<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少有效的案件 ID。'], 400);
}

$batch = getRescreenBatchDetails(db(), $id);
if ($batch === null) {
    jsonResponse(['success' => false, 'message' => '找不到指定的二次重篩案件。'], 404);
}

jsonResponse([
    'success' => true,
    'data' => $batch,
]);
