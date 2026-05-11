<?php
/**
 * 代碼領域 API - 刪除端點
 *
 * @endpoint DELETE /api/lookup_domains/delete.php?id={id}
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

requireMethod('DELETE');

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

$pdo = db();

// 檢查是否有關聯的 lookup_values
$checkStmt = $pdo->prepare('SELECT COUNT(*) FROM lookup_values WHERE domain_id = :domain_id');
$checkStmt->execute(['domain_id' => $id]);
$count = (int)$checkStmt->fetchColumn();

if ($count > 0) {
    jsonResponse([
        'success' => false,
        'message' => '此領域下尚有 ' . $count . ' 筆代碼值，無法刪除。請先刪除所有代碼值。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('DELETE FROM lookup_domains WHERE id = :id');
    $stmt->execute(['id' => $id]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除代碼領域失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted lookup domain', 'LookupDomains', $id, $existing);

jsonResponse([
    'success' => true,
    'message' => '代碼領域已刪除。',
]);
