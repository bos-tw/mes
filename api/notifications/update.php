<?php
/**
 * 系統通知 API - 更新端點
 *
 * 更新通知資料（僅建立者或管理員可用）。
 *
 * @endpoint PUT /api/notifications/update.php?id={id}
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

requireMethod('PUT');

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

// 檢查權限：建立者或管理員可以編輯
if ($notification['created_by'] !== null && (int)$notification['created_by'] !== (int)$currentUser['id']) {
    if (!hasPermission('notifications.manage') && !hasRole('admin')) {
        jsonResponse([
            'success' => false,
            'message' => '您無權編輯此通知。',
        ], 403);
    }
}

$payload = readNotificationPayload();
$result = validateNotificationData($payload, true);

if (!empty($result['errors'])) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $result['errors'],
    ], 422);
}

$data = $result['data'];
if (empty($data)) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供要更新的資料。',
    ], 400);
}

$pdo = db();

$setClauses = [];
foreach ($data as $col => $value) {
    $setClauses[] = "{$col} = :{$col}";
}

$sql = "UPDATE system_notifications SET " . implode(', ', $setClauses) . " WHERE id = :id";
$data['id'] = $id;

$stmt = $pdo->prepare($sql);
$stmt->execute($data);

$updated = findNotification($id);

jsonResponse([
    'success' => true,
    'message' => '通知更新成功。',
    'data' => transformNotification($updated),
]);
