<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('PUT');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的機台能力 ID。'], 400);
}

$pdo = db();
$existing = findMachineCapability($pdo, $id);
if (!$existing) {
    jsonResponse(['success' => false, 'message' => '找不到指定的機台能力。'], 404);
}

$payload = readMachineCapabilityPayload();
$validated = validateMachineCapabilityData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];
if ($data === []) {
    jsonResponse(['success' => false, 'message' => '沒有需要更新的欄位。'], 400);
}

$code = $data['capability_code'] ?? $existing['capability_code'];
$name = $data['capability_name'] ?? $existing['capability_name'];
$duplicateStmt = $pdo->prepare('SELECT id FROM machine_capabilities WHERE (capability_code = :capability_code OR capability_name = :capability_name) AND id <> :id LIMIT 1');
$duplicateStmt->execute([
    'capability_code' => $code,
    'capability_name' => $name,
    'id' => $id,
]);
if ($duplicateStmt->fetch()) {
    jsonResponse(['success' => false, 'message' => '能力代碼或能力名稱已存在。'], 409);
}

$setClauses = [];
$params = ['id' => $id];
foreach ($data as $column => $value) {
    $setClauses[] = "{$column} = :{$column}";
    $params[$column] = $value;
}
$setClauses[] = 'updated_at = NOW()';

$stmt = $pdo->prepare('UPDATE machine_capabilities SET ' . implode(', ', $setClauses) . ' WHERE id = :id');
$stmt->execute($params);

logAuditAction('Updated machine capability', 'MachineCapabilities', $id, $data);

jsonResponse([
    'success' => true,
    'message' => '機台能力已更新。',
]);
