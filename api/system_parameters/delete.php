<?php
/**
 * 系統參數 API - 刪除端點
 *
 * @endpoint DELETE /api/system_parameters/delete.php?id={id}
 *
 * @auth 必須登入
 * @table system_parameters
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

$existing = findSystemParameter($id);
if ($existing === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的系統參數。',
    ], 404);
}

$pdo = db();

try {
    $stmt = $pdo->prepare('DELETE FROM system_parameters WHERE id = :id');
    $stmt->execute(['id' => $id]);
} catch (PDOException $exception) {
    jsonResponse([
        'success' => false,
        'message' => '刪除系統參數失敗：' . $exception->getMessage(),
    ], 500);
}

logAuditAction('Deleted system parameter', 'SystemParameters', $id, $existing);

jsonResponse([
    'success' => true,
    'message' => '系統參數已刪除。',
]);
