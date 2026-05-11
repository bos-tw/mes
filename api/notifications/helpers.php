<?php
/**
 * 通知 API - 共用輔助函式
 *
 * 提供通知模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module notifications
 * @table system_notifications, notification_reads
 *
 * @functions
 * - readNotificationPayload(): 讀取請求資料
 * - validateNotificationData(): 驗證通知資料
 * - findNotification(): 查詢單筆通知
 * - transformNotification(): 轉換為 API 回應格式
 * - isNotificationTargetUser(): 檢查使用者是否為通知目標
 * - createSystemNotification(): 建立系統通知
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

const NOTIFICATION_TYPES = ['announcement', 'system_alert'];
const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const NOTIFICATION_TARGET_TYPES = ['all', 'department', 'role', 'user'];

/**
 * 讀取請求資料
 *
 * @return array<string,mixed>
 */
function readNotificationPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }
    return is_array($payload) ? $payload : [];
}

/**
 * 驗證通知資料
 *
 * @param array<string,mixed> $payload
 * @param bool $isUpdate
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateNotificationData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 標題
    if (!$isUpdate || array_key_exists('title', $payload)) {
        $title = trim((string)($payload['title'] ?? ''));
        if ($title === '') {
            $errors['title'] = '標題為必填。';
        } else {
            $data['title'] = mb_substr($title, 0, 200);
        }
    }

    // 內容
    if (!$isUpdate || array_key_exists('content', $payload)) {
        $content = trim((string)($payload['content'] ?? ''));
        if ($content === '') {
            $errors['content'] = '內容為必填。';
        } else {
            $data['content'] = $content;
        }
    }

    // 通知類型
    if (!$isUpdate || array_key_exists('notification_type', $payload)) {
        $type = trim((string)($payload['notification_type'] ?? 'announcement'));
        if (!in_array($type, NOTIFICATION_TYPES, true)) {
            $errors['notification_type'] = '通知類型無效。';
        } else {
            $data['notification_type'] = $type;
        }
    }

    // 優先級
    if (array_key_exists('priority', $payload)) {
        $priority = trim((string)($payload['priority'] ?? 'normal'));
        if (!in_array($priority, NOTIFICATION_PRIORITIES, true)) {
            $errors['priority'] = '優先級無效。';
        } else {
            $data['priority'] = $priority;
        }
    }

    // 目標類型
    if (array_key_exists('target_type', $payload)) {
        $targetType = trim((string)($payload['target_type'] ?? 'all'));
        if (!in_array($targetType, NOTIFICATION_TARGET_TYPES, true)) {
            $errors['target_type'] = '目標類型無效。';
        } else {
            $data['target_type'] = $targetType;
        }
    }

    // 目標 IDs
    if (array_key_exists('target_ids', $payload)) {
        $targetIds = $payload['target_ids'];
        if ($targetIds !== null && !is_array($targetIds)) {
            $errors['target_ids'] = '目標 ID 清單格式錯誤。';
        } else {
            $data['target_ids'] = $targetIds !== null ? json_encode($targetIds) : null;
        }
    }

    // 關聯模組
    if (array_key_exists('related_module', $payload)) {
        $relatedModule = $payload['related_module'];
        $data['related_module'] = $relatedModule !== null ? mb_substr(trim((string)$relatedModule), 0, 50) : null;
    }

    // 關聯 ID
    if (array_key_exists('related_id', $payload)) {
        $relatedId = $payload['related_id'];
        $data['related_id'] = $relatedId !== null && $relatedId !== '' ? (int)$relatedId : null;
    }

    // 過期時間
    if (array_key_exists('expires_at', $payload)) {
        $expiresAt = $payload['expires_at'];
        if ($expiresAt !== null && $expiresAt !== '') {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}/', $expiresAt)) {
                $errors['expires_at'] = '過期時間格式錯誤。';
            } else {
                $data['expires_at'] = $expiresAt;
            }
        } else {
            $data['expires_at'] = null;
        }
    }

    // 是否啟用
    if (array_key_exists('is_active', $payload)) {
        $data['is_active'] = $payload['is_active'] ? 1 : 0;
    }

    // 草稿狀態
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? 'published'));
        if (!in_array($status, ['draft', 'published'], true)) {
            $errors['status'] = '狀態值無效。';
        } else {
            $data['status'] = $status;
        }
    } elseif (!$isUpdate) {
        // 新增時預設為已發布
        $data['status'] = 'published';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆通知
 *
 * @param int $id
 * @return array|null
 */
function findNotification(int $id): ?array
{
    $pdo = db();
    $sql = "
        SELECT 
            n.*,
            e.name AS created_by_name
        FROM system_notifications n
        LEFT JOIN employees e ON n.created_by = e.id
        WHERE n.id = :id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換通知資料為 API 回應格式
 *
 * @param array $row
 * @return array
 */
function transformNotification(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'content' => $row['content'],
        'notification_type' => $row['notification_type'],
        'priority' => $row['priority'],
        'target_type' => $row['target_type'],
        'target_ids' => $row['target_ids'] !== null ? json_decode($row['target_ids'], true) : null,
        'related_module' => $row['related_module'],
        'related_id' => $row['related_id'] !== null ? (int)$row['related_id'] : null,
        'created_by' => $row['created_by'] !== null ? (int)$row['created_by'] : null,
        'created_by_name' => $row['created_by_name'] ?? null,
        'expires_at' => $row['expires_at'],
        'is_active' => (bool)$row['is_active'],
        'status' => $row['status'] ?? 'published',
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'is_read' => isset($row['is_read']) ? (bool)$row['is_read'] : null,
        'read_at' => $row['read_at'] ?? null,
    ];
}

/**
 * 檢查使用者是否為通知的目標
 *
 * @param array $notification
 * @param array $user
 * @return bool
 */
function isNotificationTargetUser(array $notification, array $user): bool
{
    $targetType = $notification['target_type'];
    
    if ($targetType === 'all') {
        return true;
    }

    $targetIds = $notification['target_ids'] !== null 
        ? json_decode($notification['target_ids'], true) 
        : [];

    if (!is_array($targetIds) || empty($targetIds)) {
        return $targetType === 'all';
    }

    switch ($targetType) {
        case 'user':
            return in_array((int)$user['id'], array_map('intval', $targetIds), true);
        case 'department':
            return isset($user['department_id']) && in_array((int)$user['department_id'], array_map('intval', $targetIds), true);
        case 'role':
            // 需要查詢使用者的角色
            $pdo = db();
            $stmt = $pdo->prepare("SELECT role_id FROM employee_roles WHERE employee_id = :employee_id");
            $stmt->execute(['employee_id' => $user['id']]);
            $userRoles = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return !empty(array_intersect(array_map('intval', $userRoles), array_map('intval', $targetIds)));
        default:
            return false;
    }
}

/**
 * 建立系統自動通知
 *
 * @param string $title
 * @param string $content
 * @param string $relatedModule
 * @param int|null $relatedId
 * @param string $priority
 * @param string $targetType
 * @param array|null $targetIds
 * @return int 新通知 ID
 */
function createSystemNotification(
    string $title,
    string $content,
    string $relatedModule = '',
    ?int $relatedId = null,
    string $priority = 'normal',
    string $targetType = 'all',
    ?array $targetIds = null
): int {
    $pdo = db();
    $sql = "
        INSERT INTO system_notifications 
        (title, content, notification_type, priority, target_type, target_ids, related_module, related_id, created_by)
        VALUES 
        (:title, :content, 'system_alert', :priority, :target_type, :target_ids, :related_module, :related_id, NULL)
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'title' => $title,
        'content' => $content,
        'priority' => $priority,
        'target_type' => $targetType,
        'target_ids' => $targetIds !== null ? json_encode($targetIds) : null,
        'related_module' => $relatedModule !== '' ? $relatedModule : null,
        'related_id' => $relatedId,
    ]);
    return (int)$pdo->lastInsertId();
}
