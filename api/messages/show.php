<?php
/**
 * 使用者留言 API - 單筆查詢端點
 *
 * 取得單筆留言詳情。
 *
 * @endpoint GET /api/messages/show.php?id={id}
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

requireMethod('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$message = findMessage($id);
if (!$message) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的留言。',
    ], 404);
}

// 檢查存取權限
$access = checkMessageAccess($id, (int)$currentUser['id']);
if (!$access['can_access']) {
    jsonResponse([
        'success' => false,
        'message' => '您無權查看此留言。',
    ], 403);
}

// 如果是收件者且未讀，標記為已讀
if ($access['is_recipient']) {
    $pdo = db();
    $stmt = $pdo->prepare("
        UPDATE message_recipients 
        SET read_at = NOW() 
        WHERE message_id = :message_id AND recipient_id = :user_id AND read_at IS NULL
    ");
    $stmt->execute([
        'message_id' => $id,
        'user_id' => $currentUser['id'],
    ]);
    
    // 取得已讀時間
    $stmt = $pdo->prepare("SELECT read_at FROM message_recipients WHERE message_id = :message_id AND recipient_id = :user_id");
    $stmt->execute(['message_id' => $id, 'user_id' => $currentUser['id']]);
    $readInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    $message['read_at'] = $readInfo['read_at'] ?? null;
}

jsonResponse([
    'success' => true,
    'data' => transformMessage($message, true),
]);
