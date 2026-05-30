<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';

requireAuth();
requireMethod('GET');

$module = trim((string)($_GET['module'] ?? ''));
$action = trim((string)($_GET['action'] ?? 'delete'));
$id = (int)($_GET['id'] ?? 0);

if ($module === '' || $id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少流程檢查參數。'], 400);
}

if ($action !== 'delete') {
    jsonResponse(['success' => false, 'message' => '目前僅支援刪除流程檢查。'], 400);
}

$assessment = getWorkflowDeleteAssessment(db(), $module, $id);

jsonResponse([
    'success' => true,
    'data' => $assessment,
]);
