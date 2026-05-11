<?php
/**
 * 流水號管理 API - 刪除端點
 *
 * @endpoint DELETE /api/number_sequences/delete.php?id={id}
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

requireMethod('DELETE');

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

$pdo = db();

try {
    $stmt = $pdo->prepare('DELETE FROM number_sequences WHERE id = :id');
    $stmt->execute(['id' => $id]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除流水號失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted number sequence', 'NumberSequences', $id, $existing);

jsonResponse([
    'success' => true,
    'message' => '流水號已刪除。',
]);
