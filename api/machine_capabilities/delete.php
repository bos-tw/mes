<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的機台能力 ID。'], 400);
}

$pdo = db();
$existing = findMachineCapability($pdo, $id);
if (!$existing) {
    jsonResponse(['success' => false, 'message' => '找不到指定的機台能力。'], 404);
}

$usageStmt = $pdo->prepare('SELECT COUNT(*) FROM machines WHERE machine_capability_id = :id');
$usageStmt->execute(['id' => $id]);
$usageCount = (int)$usageStmt->fetchColumn();
if ($usageCount > 0) {
    jsonResponse([
        'success' => false,
        'message' => '此機台能力已被機台使用，請先解除關聯或改為停用。',
    ], 409);
}

$stmt = $pdo->prepare('DELETE FROM machine_capabilities WHERE id = :id');
$stmt->execute(['id' => $id]);

logAuditAction('Deleted machine capability', 'MachineCapabilities', $id, [
    'capability_code' => $existing['capability_code'],
    'capability_name' => $existing['capability_name'],
]);

jsonResponse([
    'success' => true,
    'message' => '機台能力已刪除。',
]);
