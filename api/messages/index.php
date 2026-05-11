<?php
/**
 * 使用者留言 API - 列表與新增端點
 *
 * 提供留言的列表查詢（收件匣/寄件匣/垃圾桶）及發送功能。
 *
 * @endpoint GET  /api/messages/       取得留言列表
 * @endpoint POST /api/messages/       發送留言
 *
 * @auth 必須登入
 * @table user_messages, message_recipients
 *
 * @input GET (Query string)
 * | 參數        | 類型   | 必填 | 說明 |
 * |-------------|--------|------|------|
 * | page        | int    | N    | 頁碼，預設 1 |
 * | perPage     | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | folder      | string | N    | inbox=收件匣(預設), sent=寄件匣, trash=垃圾桶 |
 * | unread_only | bool   | N    | 僅顯示未讀（僅收件匣） |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {"page": 1, "perPage": 10, "total": 100, "totalPages": 10}
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

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListMessages($currentUser);
        break;
    case 'POST':
        handleSendMessage($currentUser);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 取得留言列表
 */
function handleListMessages(array $currentUser): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $folder = trim((string)($_GET['folder'] ?? 'inbox'));
    $unreadOnly = filter_var($_GET['unread_only'] ?? false, FILTER_VALIDATE_BOOLEAN);

    $userId = (int)$currentUser['id'];

    if ($folder === 'sent') {
        // 寄件匣：自己發送的留言 (不含草稿，排除已軟刪除)
        $countSql = "SELECT COUNT(*) FROM user_messages WHERE sender_id = :user_id AND status = 'sent' AND sender_deleted_at IS NULL";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute(['user_id' => $userId]);
        $total = (int)$stmtCount->fetchColumn();

        $totalPages = (int)ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;

        $dataSql = "
            SELECT 
                m.*,
                e.name AS sender_name,
                e.employee_number AS sender_employee_number
            FROM user_messages m
            LEFT JOIN employees e ON m.sender_id = e.id
            WHERE m.sender_id = :user_id AND m.status = 'sent' AND m.sender_deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $pdo->prepare($dataSql);
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => transformMessage($r, true), $rows);

    } elseif ($folder === 'drafts') {
        // 草稿箱：自己建立的草稿
        $countSql = "SELECT COUNT(*) FROM user_messages WHERE sender_id = :user_id AND status = 'draft'";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute(['user_id' => $userId]);
        $total = (int)$stmtCount->fetchColumn();

        $totalPages = (int)ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;

        $dataSql = "
            SELECT 
                m.*,
                e.name AS sender_name,
                e.employee_number AS sender_employee_number
            FROM user_messages m
            LEFT JOIN employees e ON m.sender_id = e.id
            WHERE m.sender_id = :user_id AND m.status = 'draft'
            ORDER BY m.created_at DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $pdo->prepare($dataSql);
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => transformMessage($r, true), $rows);

    } elseif ($folder === 'trash') {
        // 垃圾桶：已刪除的留言
        $conditions = ['mr.recipient_id = :user_id', 'mr.deleted_at IS NOT NULL'];
        $params = ['user_id' => $userId];

        $whereClause = implode(' AND ', $conditions);

        $countSql = "
            SELECT COUNT(*)
            FROM message_recipients mr
            JOIN user_messages m ON mr.message_id = m.id
            WHERE {$whereClause}
        ";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        $totalPages = (int)ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;

        $dataSql = "
            SELECT 
                m.*,
                e.name AS sender_name,
                e.employee_number AS sender_employee_number,
                mr.read_at,
                mr.deleted_at
            FROM message_recipients mr
            JOIN user_messages m ON mr.message_id = m.id
            LEFT JOIN employees e ON m.sender_id = e.id
            WHERE {$whereClause}
            ORDER BY mr.deleted_at DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $pdo->prepare($dataSql);
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => transformMessage($r, false), $rows);

    } else {
        // 收件匣：自己收到的留言（僅顯示已發送的，排除草稿）
        $conditions = ['mr.recipient_id = :user_id', 'mr.deleted_at IS NULL', "m.status = 'sent'"];
        $params = ['user_id' => $userId];

        if ($unreadOnly) {
            $conditions[] = 'mr.read_at IS NULL';
        }

        $whereClause = implode(' AND ', $conditions);

        $countSql = "
            SELECT COUNT(*)
            FROM message_recipients mr
            JOIN user_messages m ON mr.message_id = m.id
            WHERE {$whereClause}
        ";
        $stmtCount = $pdo->prepare($countSql);
        $stmtCount->execute($params);
        $total = (int)$stmtCount->fetchColumn();

        $totalPages = (int)ceil($total / $perPage);
        $offset = ($page - 1) * $perPage;

        $dataSql = "
            SELECT 
                m.*,
                e.name AS sender_name,
                e.employee_number AS sender_employee_number,
                mr.read_at
            FROM message_recipients mr
            JOIN user_messages m ON mr.message_id = m.id
            LEFT JOIN employees e ON m.sender_id = e.id
            WHERE {$whereClause}
            ORDER BY m.created_at DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $pdo->prepare($dataSql);
        $stmt->bindValue('user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue('limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = array_map(fn($r) => transformMessage($r, false), $rows);
    }

    // 取得未讀數量（排除草稿）
    $unreadCountSql = "
        SELECT COUNT(*)
        FROM message_recipients mr
        JOIN user_messages m ON mr.message_id = m.id
        WHERE mr.recipient_id = :user_id AND mr.read_at IS NULL AND mr.deleted_at IS NULL
          AND m.status = 'sent'
    ";
    $stmtUnread = $pdo->prepare($unreadCountSql);
    $stmtUnread->execute(['user_id' => $userId]);
    $unreadCount = (int)$stmtUnread->fetchColumn();

    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => $totalPages,
        ],
        'unread_count' => $unreadCount,
    ]);
}

/**
 * 發送留言（支援附件和全體發送）
 */
function handleSendMessage(array $currentUser): void
{
    $payload = readMessagePayload();
    
    // 處理草稿狀態
    $saveAsDraft = filter_var($payload['save_as_draft'] ?? false, FILTER_VALIDATE_BOOLEAN);
    if ($saveAsDraft) {
        $payload['status'] = 'draft';
    } else {
        $payload['status'] = 'sent';
    }
    
    // 草稿不需要收件者
    if ($saveAsDraft && empty($payload['recipient_ids'])) {
        $payload['recipient_ids'] = [];
    }
    
    $result = validateMessageData($payload);

    if (!empty($result['errors'])) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $result['errors'],
        ], 422);
    }

    $data = $result['data'];
    $recipientIds = $data['recipient_ids'] ?? [];
    $sendToAll = $data['send_to_all'] ?? 0;
    unset($data['recipient_ids']);

    $pdo = db();

    // 如果不是草稿，驗證收件者存在
    if (!$saveAsDraft && !empty($recipientIds)) {
        $placeholders = implode(',', array_fill(0, count($recipientIds), '?'));
        $stmt = $pdo->prepare("SELECT id FROM employees WHERE id IN ({$placeholders}) AND deleted_at IS NULL");
        $stmt->execute($recipientIds);
        $validRecipients = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (count($validRecipients) !== count($recipientIds)) {
            jsonResponse([
                'success' => false,
                'message' => '部分收件者不存在或已停用。',
            ], 422);
        }
    }

    // 建立留言
    $pdo->beginTransaction();
    try {
        $sql = "INSERT INTO user_messages (sender_id, subject, content, reply_to_id, send_to_all, status) 
                VALUES (:sender_id, :subject, :content, :reply_to_id, :send_to_all, :status)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'sender_id' => $currentUser['id'],
            'subject' => $data['subject'],
            'content' => $data['content'],
            'reply_to_id' => $data['reply_to_id'] ?? null,
            'send_to_all' => $sendToAll,
            'status' => $data['status'],
        ]);
        $messageId = (int)$pdo->lastInsertId();

        // 只有非草稿才建立收件人記錄
        if (!$saveAsDraft && !empty($recipientIds)) {
            $insertRecipientSql = "INSERT INTO message_recipients (message_id, recipient_id) VALUES (:message_id, :recipient_id)";
            $stmtRecipient = $pdo->prepare($insertRecipientSql);
            foreach ($recipientIds as $recipientId) {
                $stmtRecipient->execute([
                    'message_id' => $messageId,
                    'recipient_id' => $recipientId,
                ]);
            }
        }

        // 處理附件上傳
        $attachmentErrors = [];
        if (!empty($_FILES['attachments'])) {
            $attachmentResult = saveMessageAttachments($messageId, $_FILES['attachments']);
            $attachmentErrors = $attachmentResult['errors'];
        }

        $pdo->commit();

        $message = findMessage($messageId);

        $successMessage = $saveAsDraft ? '草稿已儲存。' : '留言發送成功。';

        $response = [
            'success' => true,
            'message' => $successMessage,
            'data' => transformMessage($message, true),
        ];

        // 如果有附件錯誤，加入警告
        if (!empty($attachmentErrors)) {
            $response['warnings'] = [
                'attachments' => $attachmentErrors
            ];
        }

        jsonResponse($response, 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
