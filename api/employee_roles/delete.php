<?php
declare(strict_types=1);
/**
 * employee_roles API — 刪除
 *
 * DELETE /api/employee_roles/delete.php?employee_id={id}&role_id={id}
 *
 * @file   api/employee_roles/delete.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : 0;
$roleId     = isset($_GET['role_id'])     ? (int)$_GET['role_id']     : 0;

if ($employeeId <= 0 || $roleId <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 employee_id 或 role_id'], 400);
}

try {
    $pdo = db();
} catch (Exception $e) {
    error_log('employee_roles/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查關聯是否存在
if (!employeeRoleExists($pdo, $employeeId, $roleId)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的員工角色關聯'], 404);
}

try {
    $sql = 'DELETE FROM employee_roles WHERE employee_id = :employee_id AND role_id = :role_id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':employee_id' => $employeeId,
        ':role_id'     => $roleId,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '員工角色關聯刪除成功',
        'data'    => [
            'employee_id' => $employeeId,
            'role_id'     => $roleId,
        ],
    ]);
} catch (PDOException $e) {
    error_log('Employee role delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
