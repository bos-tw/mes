<?php
/**
 * 使用者留言 API - 更新端點
 *
 * 更新留言資料（僅草稿可更新，發送者本人可操作）。
 * 支援草稿編輯及草稿發送（status: draft → sent）。
 *
 * @endpoint PUT  /api/messages/update.php?id={id}
 *
 * @auth 必須登入
 *
 * @input JSON
 * | 參數           | 類型     | 必填 | 說明 |
 * |----------------|----------|------|------|
 * | subject        | string   | N    | 主旨 |
 * | content        | string   | N    | 內容 |
 * | status         | string   | N    | 狀態 (draft/sent) |
 * | recipient_ids  | int[]    | N    | 收件者 ID 陣列（發送時必填） |
 * | send_to_all    | bool     | N    | 是否發送給全體員工 |
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

$message = findMessage($id);
if (!$message) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的留言。',
    ], 404);
}

// 檢查權限：只有發送者本人可以編輯
if ((int)$message['sender_id'] !== (int)$currentUser['id']) {
    jsonResponse([
        'success' => false,
        'message' => '您無權編輯此留言。',
    ], 403);
}

// 只有草稿可以編輯
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

// 判斷是否要從草稿發送
$isPublishing = isset($data['status']) && $data['status'] === 'sent';

// 處理收件者（validateMessageData 在 isUpdate=true 時跳過收件者處理，需自行解析）
$recipientIds = [];
$rawRecipients = $payload['recipient_ids'] ?? [];
if (is_array($rawRecipients)) {
    $recipientIds = array_filter(array_map('intval', $rawRecipients), fn($id) => $id > 0);
}
// recipient_ids 不寫入 messages 表
unset($data['recipient_ids']);

// 如果要發送，必須有收件者
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
    // 更新留言欄位
    $setClauses = [];
    foreach ($data as $col => $value) {
        $setClauses[] = "{$col} = :{$col}";
    }

    $sql = "UPDATE user_messages SET " . implode(', ', $setClauses) . " WHERE id = :id";
    $data['id'] = $id;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($data);

    // 如果要發送，建立收件人記錄
    if ($isPublishing && !empty($recipientIds)) {
        // 驗證收件者存在
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

        // 清除舊的收件人記錄（如果有的話）
        $stmt = $pdo->prepare("DELETE FROM message_recipients WHERE message_id = :message_id");
        $stmt->execute(['message_id' => $id]);

        // 建立新的收件人記錄
        $insertRecipientSql = "INSERT INTO message_recipients (message_id, recipient_id) VALUES (:message_id, :recipient_id)";
        $stmtRecipient = $pdo->prepare($insertRecipientSql);
        foreach ($recipientIds as $recipientId) {
            $stmtRecipient->execute([
                'message_id' => $id,
                'recipient_id' => (int)$recipientId,
            ]);
        }
    }

    // 處理要刪除的已存在附件
    $deleteAttachmentIds = $payload['delete_attachment_ids'] ?? [];
    if (is_array($deleteAttachmentIds) && !empty($deleteAttachmentIds)) {
        deleteSpecificAttachments($id, $deleteAttachmentIds);
    }

    // 處理附件上傳
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
