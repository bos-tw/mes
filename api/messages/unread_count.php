<?php
/**
 * 使用者留言 API - 未讀數量端點
 *
 * 取得當前使用者的未讀留言數量。
 *
 * @endpoint GET /api/messages/unread_count.php
 *
 * @auth 必須登入
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "unread_count": 5
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

$pdo = db();
$userId = (int)$currentUser['id'];

$sql = "
    SELECT COUNT(*)
    FROM message_recipients mr
    JOIN user_messages m ON mr.message_id = m.id
    WHERE mr.recipient_id = :user_id AND mr.read_at IS NULL AND mr.deleted_at IS NULL
      AND m.status = 'sent'
";
$stmt = $pdo->prepare($sql);
$stmt->execute(['user_id' => $userId]);
$unreadCount = (int)$stmt->fetchColumn();

jsonResponse([
    'success' => true,
    'unread_count' => $unreadCount,
]);
