<?php
/**
 * 使用者留言 API - 標記已讀端點
 *
 * 標記單筆或多筆留言為已讀。
 *
 * @endpoint POST /api/messages/mark_read.php
 *
 * @auth 必須登入
 *
 * @input JSON body
 * | 參數 | 類型       | 必填 | 說明 |
 * |------|------------|------|------|
 * | id   | int        | N    | 單筆留言 ID |
 * | ids  | array<int> | N    | 多筆留言 ID |
 * | all  | bool       | N    | 標記全部已讀 |
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();

requireMethod('POST');

$payload = getJsonInput();
$userId = (int)$currentUser['id'];
$pdo = db();

$markedCount = 0;

if (!empty($payload['all'])) {
    // 標記所有未讀為已讀
    $sql = "UPDATE message_recipients SET read_at = NOW() WHERE recipient_id = :user_id AND read_at IS NULL AND deleted_at IS NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['user_id' => $userId]);
    $markedCount = $stmt->rowCount();

} elseif (!empty($payload['ids']) && is_array($payload['ids'])) {
    // 標記多筆
    $ids = array_filter(array_map('intval', $payload['ids']), fn($id) => $id > 0);
    
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "UPDATE message_recipients SET read_at = NOW() WHERE message_id IN ({$placeholders}) AND recipient_id = ? AND read_at IS NULL AND deleted_at IS NULL";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge($ids, [$userId]));
        $markedCount = $stmt->rowCount();
    }

} elseif (!empty($payload['id'])) {
    // 標記單筆
    $id = (int)$payload['id'];
    
    $sql = "UPDATE message_recipients SET read_at = NOW() WHERE message_id = :message_id AND recipient_id = :user_id AND read_at IS NULL AND deleted_at IS NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'message_id' => $id,
        'user_id' => $userId,
    ]);
    $markedCount = $stmt->rowCount();

} else {
    jsonResponse([
        'success' => false,
        'message' => '請提供留言 ID。',
    ], 400);
}

jsonResponse([
    'success' => true,
    'message' => '已標記為已讀。',
    'marked_count' => $markedCount,
]);
