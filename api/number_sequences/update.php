<?php
/**
 * 流水號管理 API - 更新端點
 *
 * @endpoint PUT /api/number_sequences/update.php?id={id}
 *
 * @auth 必須登入
 * @table number_sequences
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod('PUT');

if ($method !== 'PUT' && $method !== 'POST') {
    jsonResponse([
        'success' => false,
        'message' => '不支援的請求方法。',
    ], 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$existing = findNumberSequence($id);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的流水號。',
    ], 404);
}

$payload = getJsonInput();
$validated = validateNumberSequenceData($payload, true);

if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];
if (empty($data)) {
    jsonResponse([
        'success' => false,
        'message' => '沒有需要更新的欄位。',
    ], 400);
}

// 檢查是否重複（排除自己）
$pdo = db();
$checkSeqKey = $data['seq_key'] ?? $existing['seq_key'];
$checkActiveFrom = $data['active_from'] ?? $existing['active_from'];
$checkStmt = $pdo->prepare('SELECT id FROM number_sequences WHERE seq_key = :seq_key AND active_from = :active_from AND id != :id');
$checkStmt->execute(['seq_key' => $checkSeqKey, 'active_from' => $checkActiveFrom, 'id' => $id]);
if ($checkStmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => '此序列鍵與啟用時間組合已存在。',
    ], 409);
}

$checkActiveUntil = array_key_exists('active_until', $data) ? $data['active_until'] : $existing['active_until'];
$overlapStmt = $pdo->prepare("
    SELECT id
    FROM number_sequences
    WHERE seq_key = :seq_key
      AND id != :id
      AND (active_until IS NULL OR active_until >= :active_from)
      AND (:active_until IS NULL OR active_from <= :active_until)
    LIMIT 1
");
$overlapStmt->execute([
    'seq_key' => $checkSeqKey,
    'id' => $id,
    'active_from' => $checkActiveFrom,
    'active_until' => $checkActiveUntil,
]);
if ($overlapStmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => '同一序列鍵的啟用/停用時間不可重疊。',
    ], 409);
}

$setClauses = [];
$params = ['id' => $id];

foreach ($data as $column => $value) {
    $setClauses[] = $column . ' = :' . $column;
    $params[$column] = $value;
}

$setClauses[] = 'updated_at = NOW()';
$sql = 'UPDATE number_sequences SET ' . implode(', ', $setClauses) . ' WHERE id = :id';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '更新流水號失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Updated number sequence', 'NumberSequences', $id, $data);

jsonResponse([
    'success' => true,
    'message' => '流水號已更新。',
]);
