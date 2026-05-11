<?php
declare(strict_types=1);
/**
 * employee_roles API — 列表 & 新增
 *
 * GET  /api/employee_roles/          取得員工角色關聯列表（含分頁）
 * POST /api/employee_roles/          新增員工角色關聯
 *
 * @file   api/employee_roles/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListEmployeeRoles();
        break;
    case 'POST':
        handleCreateEmployeeRole();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得員工角色關聯列表
 * ====================== */
function handleListEmployeeRoles(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('employee_roles/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依員工篩選
    if (!empty($_GET['employee_id'])) {
        $where[]  = 'er.employee_id = :employee_id';
        $params[':employee_id'] = (int)$_GET['employee_id'];
    }

    // 依角色篩選
    if (!empty($_GET['role_id'])) {
        $where[]  = 'er.role_id = :role_id';
        $params[':role_id'] = (int)$_GET['role_id'];
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM employee_roles er $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT er.employee_id,
       er.role_id,
       e.employee_number,
       e.name AS employee_name,
       r.name AS role_name
  FROM employee_roles er
  JOIN employees e ON e.id = er.employee_id
  JOIN roles r ON r.id = er.role_id
  $whereSql
 ORDER BY e.employee_number, r.name
 LIMIT :limit OFFSET :offset
SQL;
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 取得下拉選單資料
    $employees = getAllEmployeesForEr($pdo);
    $roles     = getAllRolesForEr($pdo);

    jsonResponse([
        'success'    => true,
        'data'       => $rows,
        'pagination' => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
        'employees'  => $employees,
        'roles'      => $roles,
    ]);
}

/* ======================
 * POST — 新增員工角色關聯
 * ====================== */
function handleCreateEmployeeRole(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('employee_roles/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readEmployeeRolePayload();

    $errors = validateEmployeeRoleData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查員工是否存在
    if (!employeeExistsForEr($pdo, $data['employee_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的員工不存在'], 400);
    }

    // 檢查角色是否存在
    if (!roleExistsForEr($pdo, $data['role_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的角色不存在'], 400);
    }

    // 檢查關聯是否已存在
    if (employeeRoleExists($pdo, $data['employee_id'], $data['role_id'])) {
        jsonResponse(['success' => false, 'message' => '此員工已擁有該角色'], 409);
    }

    try {
        $sql = 'INSERT INTO employee_roles (employee_id, role_id) VALUES (:employee_id, :role_id)';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':employee_id' => $data['employee_id'],
            ':role_id'     => $data['role_id'],
        ]);

        $record = findEmployeeRole($pdo, $data['employee_id'], $data['role_id']);

        jsonResponse([
            'success' => true,
            'message' => '員工角色關聯新增成功',
            'data'    => $record,
        ], 201);
    } catch (PDOException $e) {
        error_log('Employee role create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
