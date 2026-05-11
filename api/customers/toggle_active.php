<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的客戶ID。',
    ], 400);
}

requireMethod('PATCH');

$pdo = db();

try {
    $pdo->beginTransaction();

    // 取得目前狀態
    $stmt = $pdo->prepare('SELECT customer_number, name, is_active FROM customers WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的客戶。',
        ], 404);
    }

    $newStatus = $customer['is_active'] ? 0 : 1;
    $statusLabel = $newStatus ? '啟用' : '停用';

    // 更新狀態
    $stmt = $pdo->prepare('UPDATE customers SET is_active = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$newStatus, $id]);

    // 記錄操作日誌
    logAuditAction("客戶{$statusLabel}", 'Customers', $id, [
        'customer_number' => $customer['customer_number'],
        'name' => $customer['name'],
        'is_active' => $newStatus,
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => "客戶已{$statusLabel}。",
        'data' => [
            'id' => $id,
            'is_active' => $newStatus,
        ],
    ]);
} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('Failed to toggle customer active status: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '操作失敗，請稍後再試。',
    ], 500);
}
