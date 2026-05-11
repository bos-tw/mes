<?php
/**
 * 系統通知 API - 標記已讀端點
 *
 * 標記單筆或多筆通知為已讀。
 *
 * @endpoint POST /api/notifications/mark_read.php
 *
 * @auth 必須登入
 *
 * @input JSON body
 * | 參數 | 類型       | 必填 | 說明 |
 * |------|------------|------|------|
 * | id   | int        | N    | 單筆通知 ID |
 * | ids  | array<int> | N    | 多筆通知 ID |
 * | all  | bool       | N    | 標記全部已讀 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "已標記為已讀。",
 *   "marked_count": 5
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

requireMethod('POST');

$payload = getJsonInput();
$userId = (int)$currentUser['id'];
$pdo = db();

$markedCount = 0;

if (!empty($payload['all'])) {
    // 標記所有未讀通知為已讀
    $departmentId = $currentUser['department_id'] ?? null;
    
    // 取得使用者角色
    $stmtRoles = $pdo->prepare("SELECT role_id FROM employee_roles WHERE employee_id = :employee_id");
    $stmtRoles->execute(['employee_id' => $userId]);
    $userRoles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

    // 找出所有符合條件的未讀通知
    $targetConditions = ["n.target_type = 'all'"];
    $params = ['user_id' => $userId];
    
    $targetConditions[] = "(n.target_type = 'user' AND JSON_CONTAINS(n.target_ids, :user_id_json, '\$'))";
    $params['user_id_json'] = json_encode($userId);

    if ($departmentId !== null) {
        $targetConditions[] = "(n.target_type = 'department' AND JSON_CONTAINS(n.target_ids, :dept_id_json, '\$'))";
        $params['dept_id_json'] = json_encode((int)$departmentId);
    }

    if (!empty($userRoles)) {
        $roleConditions = [];
        foreach ($userRoles as $index => $roleId) {
            $paramName = "role_id_json_{$index}";
            $roleConditions[] = "JSON_CONTAINS(n.target_ids, :{$paramName}, '\$')";
            $params[$paramName] = json_encode((int)$roleId);
        }
        $targetConditions[] = "(n.target_type = 'role' AND (" . implode(' OR ', $roleConditions) . "))";
    }

    $sql = "
        INSERT INTO notification_reads (notification_id, user_id)
        SELECT n.id, :user_id
        FROM system_notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = :user_id_check
        WHERE n.is_active = 1 
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
          AND nr.id IS NULL
          AND (" . implode(' OR ', $targetConditions) . ")
    ";
    $params['user_id_check'] = $userId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $markedCount = $stmt->rowCount();

} elseif (!empty($payload['ids']) && is_array($payload['ids'])) {
    // 標記多筆
    $ids = array_filter(array_map('intval', $payload['ids']), fn($id) => $id > 0);
    
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $sql = "
            INSERT IGNORE INTO notification_reads (notification_id, user_id)
            SELECT id, ? FROM system_notifications WHERE id IN ({$placeholders})
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_merge([$userId], $ids));
        $markedCount = $stmt->rowCount();
    }

} elseif (!empty($payload['id'])) {
    // 標記單筆
    $id = (int)$payload['id'];
    
    $notification = findNotification($id);
    if (!$notification) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的通知。',
        ], 404);
    }

    if (!isNotificationTargetUser($notification, $currentUser)) {
        jsonResponse([
            'success' => false,
            'message' => '您無權標記此通知。',
        ], 403);
    }

    $sql = "INSERT IGNORE INTO notification_reads (notification_id, user_id) VALUES (:notification_id, :user_id)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'notification_id' => $id,
        'user_id' => $userId,
    ]);
    $markedCount = $stmt->rowCount();

} else {
    jsonResponse([
        'success' => false,
        'message' => '請提供通知 ID。',
    ], 400);
}

jsonResponse([
    'success' => true,
    'message' => '已標記為已讀。',
    'marked_count' => $markedCount,
]);
