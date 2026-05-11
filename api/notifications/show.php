<?php
/**
 * 系統通知 API - 單筆查詢端點
 *
 * 取得單筆通知詳情。
 *
 * @endpoint GET /api/notifications/show.php?id={id}
 *
 * @auth 必須登入
 *
 * @input Query string
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 通知 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {...}
 * }
 * ```
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();

requireMethod('GET');

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

// 檢查使用者是否為通知目標
if (!isNotificationTargetUser($notification, $currentUser)) {
    jsonResponse([
        'success' => false,
        'message' => '您無權查看此通知。',
    ], 403);
}

// 查詢是否已讀
$pdo = db();
$stmt = $pdo->prepare("SELECT read_at FROM notification_reads WHERE notification_id = :notification_id AND user_id = :user_id");
$stmt->execute([
    'notification_id' => $id,
    'user_id' => $currentUser['id'],
]);
$readRecord = $stmt->fetch(PDO::FETCH_ASSOC);

$notification['is_read'] = $readRecord ? 1 : 0;
$notification['read_at'] = $readRecord['read_at'] ?? null;

jsonResponse([
    'success' => true,
    'data' => transformNotification($notification),
]);
