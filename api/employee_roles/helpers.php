<?php
/**
 * 員工角色 API - 共用輔助函式
 *
 * 提供員工角色模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module employee_roles
 * @table employee_roles
 *
 * @functions
 * - readEmployeeRolePayload(): 讀取員工角色關聯新增請求的欄位
 * - validateEmployeeRoleData(): 驗證員工角色關聯資料
 * - findEmployeeRole(): 依複合主鍵查詢員工角色關聯
 * - employeeExistsForEr(): 檢查員工是否存在
 * - roleExistsForEr(): 檢查角色是否存在
 * - employeeRoleExists(): 檢查員工角色關聯是否存在
 * - getAllEmployeesForEr(): 取得所有員工選項
 * - getAllRolesForEr(): 取得所有角色選項
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

/* ==========================
 * Request / Payload 讀取
 * ========================== */

/**
 * 讀取員工角色關聯新增請求的欄位
 *
 * @return array{employee_id: int|null, role_id: int|null}
 */
function readEmployeeRolePayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'employee_id' => isset($data['employee_id']) ? (int)$data['employee_id'] : null,
        'role_id'     => isset($data['role_id'])     ? (int)$data['role_id']     : null,
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證員工角色關聯資料
 *
 * @param array{employee_id: int|null, role_id: int|null} $data
 * @return array<string> 錯誤訊息陣列
 */
function validateEmployeeRoleData(array $data): array
{
    $errors = [];
    if (empty($data['employee_id'])) {
        $errors[] = '員工不可為空';
    }
    if (empty($data['role_id'])) {
        $errors[] = '角色不可為空';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依複合主鍵查詢員工角色關聯
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @param int $roleId
 * @return array|null
 */
function findEmployeeRole(PDO $pdo, int $employeeId, int $roleId): ?array
{
    $sql = <<<SQL
SELECT er.employee_id,
       er.role_id,
       e.name AS employee_name,
       r.name AS role_name
  FROM employee_roles er
  JOIN employees e ON e.id = er.employee_id
  JOIN roles r ON r.id = er.role_id
 WHERE er.employee_id = :employee_id AND er.role_id = :role_id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':employee_id' => $employeeId, ':role_id' => $roleId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查員工是否存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @return bool
 */
function employeeExistsForEr(PDO $pdo, int $employeeId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $employeeId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查角色是否存在
 *
 * @param PDO $pdo
 * @param int $roleId
 * @return bool
 */
function roleExistsForEr(PDO $pdo, int $roleId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM roles WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $roleId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查員工角色關聯是否已存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @param int $roleId
 * @return bool
 */
function employeeRoleExists(PDO $pdo, int $employeeId, int $roleId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employee_roles WHERE employee_id = :employee_id AND role_id = :role_id LIMIT 1');
    $stmt->execute([':employee_id' => $employeeId, ':role_id' => $roleId]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得所有員工列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getAllEmployeesForEr(PDO $pdo): array
{
    $sql = "SELECT id, name, employee_number FROM employees WHERE status = 'active' AND deleted_at IS NULL ORDER BY employee_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得所有角色列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getAllRolesForEr(PDO $pdo): array
{
    $sql = 'SELECT id, name FROM roles ORDER BY name';
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
