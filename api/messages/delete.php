<?php
/**
 * 使用者留言 API - 刪除端點
 *
 * 刪除留言（軟刪除，僅從自己的收件匣移除）。
 *
 * @endpoint DELETE /api/messages/delete.php?id={id}
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

$message = findMessage($id);
if (!$message) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的留言。',
    ], 404);
}

$userId = (int)$currentUser['id'];
$access = checkMessageAccess($id, $userId);

if (!$access['can_access']) {
    jsonResponse([
        'success' => false,
        'message' => '您無權刪除此留言。',
    ], 403);
}

$pdo = db();

if ($access['is_sender']) {
    $status = $message['status'] ?? 'sent';
    
    if ($status === 'draft') {
        // 草稿：硬刪除（含附件）
        deleteMessageAttachments($id);
        
        // 刪除收件人記錄
        $stmt = $pdo->prepare("DELETE FROM message_recipients WHERE message_id = :id");
        $stmt->execute(['id' => $id]);
        
        // 刪除留言本身
        $stmt = $pdo->prepare("DELETE FROM user_messages WHERE id = :id");
        $stmt->execute(['id' => $id]);
        
        jsonResponse([
            'success' => true,
            'message' => '草稿已刪除。',
        ]);
    }
    
    // 已發送留言：寄件者軟刪除（標記 sender_deleted_at）
    $stmt = $pdo->prepare("UPDATE user_messages SET sender_deleted_at = NOW() WHERE id = :id");
    $stmt->execute(['id' => $id]);
    
    jsonResponse([
        'success' => true,
        'message' => '留言已從寄件匣移除。',
    ]);
}

if ($access['is_recipient']) {
    // 收件者：軟刪除（從收件匣移除）
    $stmt = $pdo->prepare("UPDATE message_recipients SET deleted_at = NOW() WHERE message_id = :message_id AND recipient_id = :user_id");
    $stmt->execute([
        'message_id' => $id,
        'user_id' => $userId,
    ]);
    
    jsonResponse([
        'success' => true,
        'message' => '留言已從收件匣移除。',
    ]);
}
