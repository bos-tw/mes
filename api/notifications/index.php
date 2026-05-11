<?php
/**
 * 系統通知 API - 列表與新增端點
 *
 * 提供系統通知的列表查詢（含分頁、類型篩選）及新增功能。
 *
 * @endpoint GET  /api/notifications/      取得通知列表
 * @endpoint POST /api/notifications/      新增通知
 *
 * @auth 必須登入
 * @table system_notifications, notification_reads
 *
 * @input GET (Query string)
 * | 參數              | 類型   | 必填 | 說明 |
 * |-------------------|--------|------|------|
 * | page              | int    | N    | 頁碼，預設 1 |
 * | perPage           | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | notification_type | string | N    | 類型篩選 (announcement/system_alert) |
 * | unread_only       | bool   | N    | 僅顯示未讀 |
 * | include_expired   | bool   | N    | 包含已過期（歷史紀錄）|
 * | created_by_me     | bool   | N    | 僅顯示我發布的通知 |
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
        handleListNotifications($currentUser);
        break;
    case 'POST':
        handleCreateNotification($currentUser);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 取得通知列表（針對當前使用者）
 */
function handleListNotifications(array $currentUser): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $notificationType = trim((string)($_GET['notification_type'] ?? ''));
    $unreadOnly = filter_var($_GET['unread_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $includeExpired = filter_var($_GET['include_expired'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $createdByMe = filter_var($_GET['created_by_me'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $status = trim((string)($_GET['status'] ?? 'published'));

    // 驗證 status 參數
    if (!in_array($status, ['draft', 'published'], true)) {
        jsonResponse([
            'success' => false,
            'message' => '狀態參數無效。',
        ], 400);
    }

    // 草稿箱只能看自己建立的
    if ($status === 'draft') {
        $createdByMe = true;
    }

    $userId = (int)$currentUser['id'];
    $departmentId = $currentUser['department_id'] ?? null;

    // 取得使用者角色
    $stmtRoles = $pdo->prepare("SELECT role_id FROM employee_roles WHERE employee_id = ?");
    $stmtRoles->execute([$userId]);
    $userRoles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

    // 建立基本條件
    $conditions = ['n.is_active = 1'];
    $params = [];

    // 草稿狀態篩選
    $conditions[] = 'n.status = ?';
    $params[] = $status;

    // 是否包含已過期（歷史紀錄）
    if (!$includeExpired) {
        $conditions[] = '(n.expires_at IS NULL OR n.expires_at > NOW())';
    }

    // 若為「我發布的」模式，只篩選自己發布的
    if ($createdByMe) {
        $conditions[] = 'n.created_by = ?';
        $params[] = $userId;
    } else {
        // 一般模式：篩選目標對象包含自己的通知
        $targetConditions = ["n.target_type = 'all'"];

        // 針對特定使用者
        $targetConditions[] = "(n.target_type = 'user' AND JSON_CONTAINS(n.target_ids, ?, '\$'))";
        $params[] = json_encode($userId);

        // 針對特定部門
        if ($departmentId !== null) {
            $targetConditions[] = "(n.target_type = 'department' AND JSON_CONTAINS(n.target_ids, ?, '\$'))";
            $params[] = json_encode((int)$departmentId);
        }

        // 針對特定角色
        if (!empty($userRoles)) {
            $roleConditions = [];
            foreach ($userRoles as $roleId) {
                $roleConditions[] = "JSON_CONTAINS(n.target_ids, ?, '\$')";
                $params[] = json_encode((int)$roleId);
            }
            $targetConditions[] = "(n.target_type = 'role' AND (" . implode(' OR ', $roleConditions) . "))";
        }

        $conditions[] = '(' . implode(' OR ', $targetConditions) . ')';
    }

    // 類型篩選
    if ($notificationType !== '' && in_array($notificationType, NOTIFICATION_TYPES, true)) {
        $conditions[] = 'n.notification_type = ?';
        $params[] = $notificationType;
    }

    $whereClause = implode(' AND ', $conditions);

    // 計算總數
    $countSql = "
        SELECT COUNT(DISTINCT n.id)
        FROM system_notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE {$whereClause}
    ";

    if ($unreadOnly) {
        $countSql .= " AND nr.id IS NULL";
    }

    $countParams = array_merge([$userId], $params);
    $stmtCount = $pdo->prepare($countSql);
    $stmtCount->execute($countParams);
    $total = (int)$stmtCount->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $offset = ($page - 1) * $perPage;

    // 取得資料
    $dataSql = "
        SELECT
            n.*,
            e.name AS created_by_name,
            CASE WHEN nr.id IS NOT NULL THEN 1 ELSE 0 END AS is_read,
            nr.read_at
        FROM system_notifications n
        LEFT JOIN employees e ON n.created_by = e.id
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE {$whereClause}
    ";

    if ($unreadOnly) {
        $dataSql .= " AND nr.id IS NULL";
    }

    $dataSql .= " ORDER BY n.priority DESC, n.created_at DESC LIMIT ? OFFSET ?";

    $dataParams = array_merge([$userId], $params, [$perPage, $offset]);
    $stmt = $pdo->prepare($dataSql);
    $stmt->execute($dataParams);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = array_map('transformNotification', $rows);

    // 取得未讀數量（不受 unreadOnly 篩選影響，永遠顯示真實未讀數）
    $unreadCountSql = "
        SELECT COUNT(DISTINCT n.id)
        FROM system_notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = ?
        WHERE n.is_active = 1
          AND n.status = 'published'
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
          AND nr.id IS NULL
    ";

    // 未讀數量只計算目標為自己的通知
    if (!$createdByMe) {
        $targetConditions = ["n.target_type = 'all'"];
        $unreadParams = [$userId, json_encode($userId)];
        $targetConditions[] = "(n.target_type = 'user' AND JSON_CONTAINS(n.target_ids, ?, '\$'))";

        if ($departmentId !== null) {
            $targetConditions[] = "(n.target_type = 'department' AND JSON_CONTAINS(n.target_ids, ?, '\$'))";
            $unreadParams[] = json_encode((int)$departmentId);
        }

        if (!empty($userRoles)) {
            foreach ($userRoles as $roleId) {
                $targetConditions[] = "JSON_CONTAINS(n.target_ids, ?, '\$')";
                $unreadParams[] = json_encode((int)$roleId);
            }
        }

        $unreadCountSql .= " AND (" . implode(' OR ', $targetConditions) . ")";
    } else {
        $unreadParams = [$userId];
    }

    $stmtUnread = $pdo->prepare($unreadCountSql);
    $stmtUnread->execute($unreadParams);
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
 * 新增通知（僅管理員可用）
 */
function handleCreateNotification(array $currentUser): void
{
    // 檢查管理員權限
    if (!hasPermission('notifications.manage') && !hasRole('admin')) {
        jsonResponse([
            'success' => false,
            'message' => '您沒有新增通知的權限。',
        ], 403);
    }

    $payload = readNotificationPayload();
    
    // 處理草稿狀態
    $saveAsDraft = filter_var($payload['save_as_draft'] ?? false, FILTER_VALIDATE_BOOLEAN);
    if ($saveAsDraft) {
        $payload['status'] = 'draft';
    } else {
        $payload['status'] = 'published';
    }
    
    $result = validateNotificationData($payload);

    if (!empty($result['errors'])) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $result['errors'],
        ], 422);
    }

    $data = $result['data'];
    $data['created_by'] = $currentUser['id'];

    $pdo = db();

    $columns = array_keys($data);
    $placeholders = array_map(fn($col) => ":{$col}", $columns);

    $sql = "INSERT INTO system_notifications (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($data);

    $newId = (int)$pdo->lastInsertId();
    $notification = findNotification($newId);

    $message = $saveAsDraft ? '草稿已儲存。' : '通知建立成功。';

    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => transformNotification($notification),
    ], 201);
}
