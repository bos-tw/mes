<?php
/**
 * 代碼領域 API - 更新端點
 *
 * @endpoint PUT /api/lookup_domains/update.php?id={id}
 *
 * @auth 必須登入
 * @table lookup_domains
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

$existing = findLookupDomain($id);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的代碼領域。',
    ], 404);
}

$payload = getJsonInput();
$validated = validateLookupDomainData($payload, true);

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

// 檢查 domain_key 是否重複（排除自己）
if (isset($data['domain_key'])) {
    $pdo = db();
    $checkStmt = $pdo->prepare('SELECT id FROM lookup_domains WHERE domain_key = :domain_key AND id != :id');
    $checkStmt->execute(['domain_key' => $data['domain_key'], 'id' => $id]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '領域鍵值已存在。',
        ], 409);
    }
}

$pdo = db();
$setClauses = [];
$params = ['id' => $id];

foreach ($data as $column => $value) {
    $setClauses[] = $column . ' = :' . $column;
    $params[$column] = $value;
}

$setClauses[] = 'updated_at = NOW()';
$sql = 'UPDATE lookup_domains SET ' . implode(', ', $setClauses) . ' WHERE id = :id';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '更新代碼領域失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Updated lookup domain', 'LookupDomains', $id, $data);

jsonResponse([
    'success' => true,
    'message' => '代碼領域已更新。',
]);
