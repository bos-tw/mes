<?php
/**
 * 系統通知 API - 未讀數量端點
 *
 * 取得當前使用者的未讀通知數量。
 *
 * @endpoint GET /api/notifications/unread_count.php
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
$departmentId = $currentUser['department_id'] ?? null;

// 取得使用者角色
$stmtRoles = $pdo->prepare("SELECT role_id FROM employee_roles WHERE employee_id = :employee_id");
$stmtRoles->execute(['employee_id' => $userId]);
$userRoles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

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
    SELECT COUNT(DISTINCT n.id)
    FROM system_notifications n
    LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = :user_id
    WHERE n.is_active = 1 
      AND (n.expires_at IS NULL OR n.expires_at > NOW())
      AND nr.id IS NULL
      AND (" . implode(' OR ', $targetConditions) . ")
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$unreadCount = (int)$stmt->fetchColumn();

jsonResponse([
    'success' => true,
    'unread_count' => $unreadCount,
]);
