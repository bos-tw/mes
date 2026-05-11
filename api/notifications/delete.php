<?php
/**
 * 系統通知 API - 刪除端點
 *
 * 刪除通知（僅建立者或管理員可用）。
 *
 * @endpoint DELETE /api/notifications/delete.php?id={id}
 *
 * @auth 必須登入
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();

requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$notification = findNotification($id);
if (!$notification) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的通知。',
    ], 404);
}

// 檢查權限：建立者或管理員可以刪除
if ($notification['created_by'] !== null && (int)$notification['created_by'] !== (int)$currentUser['id']) {
    if (!hasPermission('notifications.manage') && !hasRole('admin')) {
        jsonResponse([
            'success' => false,
            'message' => '您無權刪除此通知。',
        ], 403);
    }
}

$pdo = db();

// 刪除通知（會自動刪除關聯的已讀記錄，因為有 ON DELETE CASCADE）
$stmt = $pdo->prepare("DELETE FROM system_notifications WHERE id = :id");
$stmt->execute(['id' => $id]);

jsonResponse([
    'success' => true,
    'message' => '通知刪除成功。',
]);
