<?php
/**
 * 機台每日巡檢 API - 共用輔助函式
 *
 * 提供機台每日巡檢模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module daily_machine_inspections
 * @table daily_machine_inspections
 *
 * @functions
 * - readDailyInspectionPayload(): 讀取每日機台檢驗請求的欄位
 * - validateDailyInspectionData(): 驗證每日機台檢驗資料
 * - findDailyInspection(): 依 ID 查詢每日機台檢驗
 * - transformDailyInspection(): 轉換每日機台檢驗資料格式
 * - dailyInspectionExists(): 檢查每日機台檢驗是否存在
 * - machineExistsForDi(): 檢查機台是否存在
 * - employeeExistsForDi(): 檢查員工是否存在
 * - duplicateInspectionExists(): 檢查重複檢驗紀錄
 * - getMachinesForDi(): 取得機台選項
 * - getEmployeesForDi(): 取得員工選項
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
 * 讀取每日機台檢驗請求的欄位
 *
 * @return array
 */
function readDailyInspectionPayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'inspection_date' => $data['inspection_date'] ?? null,
        'machine_id'      => isset($data['machine_id']) ? (int)$data['machine_id'] : null,
        'inspector_id'    => isset($data['inspector_id']) ? (int)$data['inspector_id'] : null,
        'is_qualified'    => isset($data['is_qualified']) ? (bool)$data['is_qualified'] : true,
        'notes'           => trim($data['notes'] ?? ''),
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證每日機台檢驗資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateDailyInspectionData(array $data): array
{
    $errors = [];
    if (empty($data['inspection_date'])) {
        $errors[] = '檢驗日期不可為空';
    }
    if (empty($data['machine_id'])) {
        $errors[] = '機台不可為空';
    }
    if (empty($data['inspector_id'])) {
        $errors[] = '檢驗員不可為空';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢每日機台檢驗
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findDailyInspection(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT di.*,
       m.machine_number AS machine_code,
       m.name AS machine_name,
       e.employee_number AS inspector_number,
       e.name AS inspector_name
  FROM daily_machine_inspections di
  LEFT JOIN machines m ON m.id = di.machine_id
  LEFT JOIN employees e ON e.id = di.inspector_id
 WHERE di.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換每日機台檢驗資料格式
 *
 * @param array $row
 * @return array
 */
function transformDailyInspection(array $row): array
{
    return [
        'id'               => (int)$row['id'],
        'inspection_date'  => $row['inspection_date'],
        'machine_id'       => (int)$row['machine_id'],
        'machine_code'     => $row['machine_code'] ?? '',
        'machine_name'     => $row['machine_name'] ?? '',
        'inspector_id'     => (int)$row['inspector_id'],
        'inspector_number' => $row['inspector_number'] ?? '',
        'inspector_name'   => $row['inspector_name'] ?? '',
        'is_qualified'     => (bool)$row['is_qualified'],
        'notes'            => $row['notes'] ?? '',
        'created_at'       => $row['created_at'],
        'updated_at'       => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查每日機台檢驗是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function dailyInspectionExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM daily_machine_inspections WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查機台是否存在
 *
 * @param PDO $pdo
 * @param int $machineId
 * @return bool
 */
function machineExistsForDi(PDO $pdo, int $machineId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM machines WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $machineId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查員工是否存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @return bool
 */
function employeeExistsForDi(PDO $pdo, int $employeeId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $employeeId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查同一天同一機台是否已有檢驗紀錄
 *
 * @param PDO $pdo
 * @param string $date
 * @param int $machineId
 * @param int|null $excludeId 排除的 ID（用於更新時）
 * @return bool
 */
function duplicateInspectionExists(PDO $pdo, string $date, int $machineId, ?int $excludeId = null): bool
{
    $sql = 'SELECT 1 FROM daily_machine_inspections WHERE inspection_date = :date AND machine_id = :machine_id';
    $params = [':date' => $date, ':machine_id' => $machineId];
    if ($excludeId) {
        $sql .= ' AND id != :exclude_id';
        $params[':exclude_id'] = $excludeId;
    }
    $sql .= ' LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得機台列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getMachinesForDi(PDO $pdo): array
{
    $sql = 'SELECT id, machine_number, name FROM machines ORDER BY machine_number, name';
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得員工列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getEmployeesForDi(PDO $pdo): array
{
    $sql = "SELECT id, employee_number, name FROM employees WHERE status = 'active' AND deleted_at IS NULL ORDER BY employee_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
