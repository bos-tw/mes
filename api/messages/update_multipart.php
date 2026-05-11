<?php
/**
 * 使用者留言 API - 更新端點（multipart/form-data）
 *
 * 專供前端以 FormData 送出草稿更新/發送（含附件上傳）。
 *
 * @endpoint POST /api/messages/update_multipart.php?id={id}
 *
 * @auth 必須登入
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();
requireMethod('POST');

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

if ((int)$message['sender_id'] !== (int)$currentUser['id']) {
    jsonResponse([
        'success' => false,
        'message' => '您無權編輯此留言。',
    ], 403);
}

if (($message['status'] ?? 'sent') !== 'draft') {
    jsonResponse([
        'success' => false,
        'message' => '已發送的留言無法編輯。',
    ], 400);
}

$payload = readMessagePayload();
$result = validateMessageData($payload, true);
if (!empty($result['errors'])) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $result['errors'],
    ], 422);
}

$data = $result['data'];
$isPublishing = isset($data['status']) && $data['status'] === 'sent';

$recipientIds = [];
$rawRecipients = $payload['recipient_ids'] ?? [];
if (is_array($rawRecipients)) {
    $recipientIds = array_filter(array_map('intval', $rawRecipients), fn($rid) => $rid > 0);
}
unset($data['recipient_ids']);

if ($isPublishing && empty($recipientIds)) {
    jsonResponse([
        'success' => false,
        'message' => '發送時請選擇至少一位收件者。',
    ], 422);
}

if (empty($data)) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供要更新的資料。',
    ], 400);
}

$pdo = db();
$pdo->beginTransaction();

try {
    $setClauses = [];
    foreach ($data as $col => $value) {
        $setClauses[] = "{$col} = :{$col}";
    }

    $sql = "UPDATE user_messages SET " . implode(', ', $setClauses) . " WHERE id = :id";
    $data['id'] = $id;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($data);

    if ($isPublishing && !empty($recipientIds)) {
        $placeholders = implode(',', array_fill(0, count($recipientIds), '?'));
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id IN ({$placeholders}) AND deleted_at IS NULL");
        $stmt->execute($recipientIds);
        $validRecipients = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($validRecipients) !== count($recipientIds)) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '部分收件者不存在或已停用。',
            ], 422);
        }

        $stmt = $pdo->prepare("DELETE FROM message_recipients WHERE message_id = :message_id");
        $stmt->execute(['message_id' => $id]);

        $insertRecipientSql = "INSERT INTO message_recipients (message_id, recipient_id) VALUES (:message_id, :recipient_id)";
        $stmtRecipient = $pdo->prepare($insertRecipientSql);
        foreach ($recipientIds as $recipientId) {
            $stmtRecipient->execute([
                'message_id' => $id,
                'recipient_id' => (int)$recipientId,
            ]);
        }
    }

    $deleteAttachmentIds = $payload['delete_attachment_ids'] ?? [];
    if (is_array($deleteAttachmentIds) && !empty($deleteAttachmentIds)) {
        deleteSpecificAttachments($id, $deleteAttachmentIds);
    }

    $attachmentErrors = [];
    if (!empty($_FILES['attachments'])) {
        $attachmentResult = saveMessageAttachments($id, $_FILES['attachments']);
        $attachmentErrors = $attachmentResult['errors'];
    }

    $pdo->commit();

    $updated = findMessage($id);
    $successMessage = $isPublishing ? '留言已發送。' : '草稿已更新。';

    $response = [
        'success' => true,
        'message' => $successMessage,
        'data' => transformMessage($updated, true),
    ];

    if (!empty($attachmentErrors)) {
        $response['warnings'] = [
            'attachments' => $attachmentErrors,
        ];
    }

    jsonResponse($response);
} catch (Exception $e) {
    $pdo->rollBack();
    throw $e;
}
