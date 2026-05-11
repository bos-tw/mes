<?php
/**
 * 訊息 API - 共用輔助函式
 *
 * 提供訊息模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module messages
 * @table user_messages, message_recipients, message_attachments
 *
 * @functions
 * - readMessagePayload(): 讀取請求資料
 * - validateMessageData(): 驗證留言資料
 * - findMessage(): 查詢單筆留言
 * - getMessageRecipients(): 取得訊息收件者
 * - getMessageAttachments(): 取得訊息附件
 * - transformMessage(): 轉換為 API 回應格式
 * - checkMessageAccess(): 檢查訊息存取權限
 * - saveMessageAttachments(): 儲存訊息附件
 * - validateAttachment(): 驗證附件檔案
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

// 定義附件上傳目錄
define('MESSAGE_ATTACHMENTS_DIR', __DIR__ . '/../../uploads/messages/');

// 允許的附件類型
define('ALLOWED_ATTACHMENT_TYPES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
]);

// 最大附件大小 (10MB)
define('MAX_ATTACHMENT_SIZE', 10 * 1024 * 1024);

/**
 * 讀取請求資料（支援 JSON 和 FormData）
 *
 * @return array<string,mixed>
 */
function readMessagePayload(): array
{
    // 優先處理 multipart/form-data（含附件）
    if (!empty($_POST)) {
        $payload = $_POST;
        // 處理 recipient_ids[] 陣列
        if (isset($_POST['recipient_ids']) && is_array($_POST['recipient_ids'])) {
            $payload['recipient_ids'] = $_POST['recipient_ids'];
        }
        return $payload;
    }
    
    // 處理 JSON
    $payload = getJsonInput();
    return is_array($payload) ? $payload : [];
}

/**
 * 驗證留言資料
 *
 * @param array<string,mixed> $payload
 * @param bool $isUpdate
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateMessageData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 主旨
    if (!$isUpdate || array_key_exists('subject', $payload)) {
        $subject = trim((string)($payload['subject'] ?? ''));
        if ($subject === '') {
            $errors['subject'] = '主旨為必填。';
        } else {
            $data['subject'] = mb_substr($subject, 0, 200);
        }
    }

    // 內容（允許 HTML）
    if (!$isUpdate || array_key_exists('content', $payload)) {
        $content = trim((string)($payload['content'] ?? ''));
        if ($content === '' || $content === '<br>' || strip_tags($content) === '') {
            $errors['content'] = '內容為必填。';
        } else {
            // 基本 HTML 清理（保留允許的標籤）
            $allowedTags = '<p><br><b><strong><i><em><u><ul><ol><li><h1><h2><h3><h4><h5><h6><span><div>';
            $data['content'] = strip_tags($content, $allowedTags);
        }
    }

    // 全體員工發送標記
    if (array_key_exists('send_to_all', $payload)) {
        $data['send_to_all'] = filter_var($payload['send_to_all'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }

    // 收件者
    if (!$isUpdate) {
        $recipientIds = $payload['recipient_ids'] ?? [];
        
        // 草稿可以沒有收件者
        $isDraft = isset($payload['status']) && $payload['status'] === 'draft';
        
        if (!is_array($recipientIds)) {
            $errors['recipient_ids'] = '收件者格式錯誤。';
        } elseif (empty($recipientIds) && !$isDraft) {
            $errors['recipient_ids'] = '請選擇至少一位收件者。';
        } else {
            $recipientIds = array_filter(array_map('intval', $recipientIds), fn($id) => $id > 0);
            $data['recipient_ids'] = $recipientIds;
        }
    }

    // 回覆對象
    if (array_key_exists('reply_to_id', $payload)) {
        $replyToId = $payload['reply_to_id'];
        $data['reply_to_id'] = $replyToId !== null && $replyToId !== '' ? (int)$replyToId : null;
    }

    // 草稿狀態
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? 'sent'));
        if (!in_array($status, ['draft', 'sent'], true)) {
            $errors['status'] = '狀態值無效。';
        } else {
            $data['status'] = $status;
        }
    } elseif (!$isUpdate) {
        // 新增時預設為已發送
        $data['status'] = 'sent';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆留言
 *
 * @param int $id
 * @return array|null
 */
function findMessage(int $id): ?array
{
    $pdo = db();
    $sql = "
        SELECT 
            m.*,
            s.name AS sender_name,
            s.employee_number AS sender_employee_number
        FROM user_messages m
        LEFT JOIN employees s ON m.sender_id = s.id
        WHERE m.id = :id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 查詢留言的收件人
 *
 * @param int $messageId
 * @return array
 */
function getMessageRecipients(int $messageId): array
{
    $pdo = db();
    $sql = "
        SELECT 
            mr.*,
            e.name AS recipient_name,
            e.employee_number AS recipient_employee_number
        FROM message_recipients mr
        JOIN employees e ON mr.recipient_id = e.id
        WHERE mr.message_id = :message_id AND mr.deleted_at IS NULL
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['message_id' => $messageId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 查詢留言的附件
 *
 * @param int $messageId
 * @return array
 */
function getMessageAttachments(int $messageId): array
{
    $pdo = db();
    $sql = "
        SELECT id, file_name, file_size, mime_type, created_at
        FROM message_attachments
        WHERE message_id = :message_id
        ORDER BY created_at
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['message_id' => $messageId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 轉換留言資料為 API 回應格式
 *
 * @param array $row
 * @param bool $includeRecipients
 * @return array
 */
function transformMessage(array $row, bool $includeRecipients = false): array
{
    $result = [
        'id' => (int)$row['id'],
        'sender_id' => (int)$row['sender_id'],
        'sender_name' => $row['sender_name'] ?? null,
        'sender_employee_number' => $row['sender_employee_number'] ?? null,
        'subject' => $row['subject'],
        'content' => $row['content'],
        'send_to_all' => isset($row['send_to_all']) ? (bool)$row['send_to_all'] : false,
        'reply_to_id' => $row['reply_to_id'] !== null ? (int)$row['reply_to_id'] : null,
        'status' => $row['status'] ?? 'sent',
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];

    // 如果有已讀資訊
    if (isset($row['read_at'])) {
        $result['is_read'] = $row['read_at'] !== null;
        $result['read_at'] = $row['read_at'];
    }

    // 附件數量和列表
    $attachments = getMessageAttachments((int)$row['id']);
    $result['attachment_count'] = count($attachments);
    $result['attachments'] = array_map(function($a) {
        return [
            'id' => (int)$a['id'],
            'file_name' => $a['file_name'],
            'file_size' => (int)$a['file_size'],
            'mime_type' => $a['mime_type'],
        ];
    }, $attachments);

    // 如果需要收件人清單
    if ($includeRecipients) {
        $recipients = getMessageRecipients((int)$row['id']);
        $result['recipients'] = array_map(function($r) {
            return [
                'id' => (int)$r['recipient_id'],
                'name' => $r['recipient_name'],
                'employee_number' => $r['recipient_employee_number'],
                'read_at' => $r['read_at'],
                'is_read' => $r['read_at'] !== null,
            ];
        }, $recipients);
    }

    return $result;
}

/**
 * 檢查使用者是否可存取該留言（發送者或收件者）
 *
 * @param int $messageId
 * @param int $userId
 * @return array{can_access: bool, is_sender: bool, is_recipient: bool}
 */
function checkMessageAccess(int $messageId, int $userId): array
{
    $pdo = db();
    
    // 檢查是否為發送者
    $stmt = $pdo->prepare("SELECT sender_id FROM user_messages WHERE id = :id");
    $stmt->execute(['id' => $messageId]);
    $message = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $isSender = $message && (int)$message['sender_id'] === $userId;
    
    // 檢查是否為收件者
    $stmt = $pdo->prepare("SELECT id FROM message_recipients WHERE message_id = :message_id AND recipient_id = :user_id AND deleted_at IS NULL");
    $stmt->execute(['message_id' => $messageId, 'user_id' => $userId]);
    $isRecipient = $stmt->fetch() !== false;
    
    return [
        'can_access' => $isSender || $isRecipient,
        'is_sender' => $isSender,
        'is_recipient' => $isRecipient,
    ];
}

/**
 * 驗證單一附件檔案
 *
 * @param array $file $_FILES 中的單一檔案
 * @return array{valid: bool, error: string|null}
 */
function validateAttachment(array $file): array
{
    // 檢查上傳錯誤
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => '檔案超過伺服器限制',
            UPLOAD_ERR_FORM_SIZE => '檔案超過表單限制',
            UPLOAD_ERR_PARTIAL => '檔案只有部分被上傳',
            UPLOAD_ERR_NO_FILE => '沒有檔案被上傳',
            UPLOAD_ERR_NO_TMP_DIR => '找不到暫存資料夾',
            UPLOAD_ERR_CANT_WRITE => '無法寫入磁碟',
            UPLOAD_ERR_EXTENSION => '檔案上傳被擴充功能中斷',
        ];
        return [
            'valid' => false,
            'error' => $errorMessages[$file['error']] ?? '上傳錯誤'
        ];
    }

    // 檢查檔案大小
    if ($file['size'] > MAX_ATTACHMENT_SIZE) {
        return [
            'valid' => false,
            'error' => '檔案超過 10MB 限制'
        ];
    }

    // 檢查 MIME 類型
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, ALLOWED_ATTACHMENT_TYPES)) {
        return [
            'valid' => false,
            'error' => '不允許的檔案類型'
        ];
    }

    return ['valid' => true, 'error' => null];
}

/**
 * 儲存訊息附件
 *
 * @param int $messageId 訊息 ID
 * @param array $files $_FILES['attachments'] 的結構
 * @return array{saved: int, errors: array}
 */
function saveMessageAttachments(int $messageId, array $files): array
{
    $pdo = db();
    $saved = 0;
    $errors = [];

    // 確保上傳目錄存在
    if (!is_dir(MESSAGE_ATTACHMENTS_DIR)) {
        mkdir(MESSAGE_ATTACHMENTS_DIR, 0755, true);
    }

    // 建立訊息專屬資料夾
    $messageDir = MESSAGE_ATTACHMENTS_DIR . $messageId . '/';
    if (!is_dir($messageDir)) {
        mkdir($messageDir, 0755, true);
    }

    // 處理檔案陣列（可能是多檔案上傳）
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;
    
    for ($i = 0; $i < $fileCount; $i++) {
        // 取得單一檔案資訊
        if (is_array($files['name'])) {
            $file = [
                'name' => $files['name'][$i],
                'type' => $files['type'][$i],
                'tmp_name' => $files['tmp_name'][$i],
                'error' => $files['error'][$i],
                'size' => $files['size'][$i],
            ];
        } else {
            $file = $files;
        }

        // 跳過空檔案
        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            continue;
        }

        // 驗證檔案
        $validation = validateAttachment($file);
        if (!$validation['valid']) {
            $errors[] = $file['name'] . ': ' . $validation['error'];
            continue;
        }

        // 產生安全的檔案名稱
        $originalName = pathinfo($file['name'], PATHINFO_FILENAME);
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $originalName);
        $uniqueName = $safeName . '_' . uniqid() . '.' . $extension;
        $filePath = $messageDir . $uniqueName;

        // 移動檔案
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $errors[] = $file['name'] . ': 檔案儲存失敗';
            continue;
        }

        // 取得實際 MIME 類型
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($filePath);

        // 儲存到資料庫
        try {
            $sql = "INSERT INTO message_attachments (message_id, file_name, file_path, file_size, mime_type) 
                    VALUES (:message_id, :file_name, :file_path, :file_size, :mime_type)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'message_id' => $messageId,
                'file_name' => $file['name'],
                'file_path' => $messageId . '/' . $uniqueName,
                'file_size' => $file['size'],
                'mime_type' => $mimeType,
            ]);
            $saved++;
        } catch (Exception $e) {
            // 刪除已上傳的檔案
            @unlink($filePath);
            $errors[] = $file['name'] . ': 資料庫錯誤';
        }
    }

    return ['saved' => $saved, 'errors' => $errors];
}

/**
 * 取得單一附件資訊
 *
 * @param int $attachmentId
 * @return array|null
 */
function findAttachment(int $attachmentId): ?array
{
    $pdo = db();
    $sql = "SELECT * FROM message_attachments WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $attachmentId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 刪除指定的附件（依 attachment ID 陣列）
 * 
 * @param int   $messageId     訊息 ID（用於權限驗證）
 * @param int[] $attachmentIds 要刪除的附件 ID 陣列
 * @return int 成功刪除的數量
 */
function deleteSpecificAttachments(int $messageId, array $attachmentIds): int
{
    if (empty($attachmentIds)) return 0;

    $pdo = db();
    $deleted = 0;

    foreach ($attachmentIds as $attId) {
        $attId = (int)$attId;
        if ($attId <= 0) continue;

        // 確認附件屬於該訊息
        $stmt = $pdo->prepare("SELECT * FROM message_attachments WHERE id = :id AND message_id = :message_id");
        $stmt->execute(['id' => $attId, 'message_id' => $messageId]);
        $attachment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$attachment) continue;

        // 刪除實體檔案
        $filePath = MESSAGE_ATTACHMENTS_DIR . ($attachment['file_path'] ?? '');
        if (file_exists($filePath)) {
            @unlink($filePath);
        }

        // 刪除資料庫記錄
        $stmt = $pdo->prepare("DELETE FROM message_attachments WHERE id = :id");
        $stmt->execute(['id' => $attId]);
        $deleted++;
    }

    return $deleted;
}

/**
 * 刪除訊息的所有附件
 *
 * @param int $messageId
 * @return bool
 */
function deleteMessageAttachments(int $messageId): bool
{
    $pdo = db();
    
    // 取得所有附件
    $attachments = getMessageAttachments($messageId);
    
    // 刪除檔案
    foreach ($attachments as $attachment) {
        $filePath = MESSAGE_ATTACHMENTS_DIR . ($attachment['file_path'] ?? '');
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }
    
    // 刪除資料夾
    $messageDir = MESSAGE_ATTACHMENTS_DIR . $messageId . '/';
    if (is_dir($messageDir)) {
        @rmdir($messageDir);
    }
    
    // 刪除資料庫記錄
    $stmt = $pdo->prepare("DELETE FROM message_attachments WHERE message_id = :message_id");
    $stmt->execute(['message_id' => $messageId]);
    
    return true;
}
