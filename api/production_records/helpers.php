<?php
/**
 * 生產記錄 API - 共用輔助函式
 *
 * 提供生產記錄模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module production_records
 * @table production_records
 *
 * @functions
 * - readProductionRecordPayload(): 讀取生產紀錄請求的欄位
 * - validateProductionRecordData(): 驗證生產紀錄資料
 * - findProductionRecord(): 依 ID 查詢生產紀錄
 * - transformProductionRecord(): 轉換生產紀錄資料格式
 * - productionRecordExists(): 檢查生產紀錄是否存在
 * - workOrderExistsForPr(): 檢查工單是否存在
 * - employeeExistsForPr(): 檢查員工是否存在
 * - machineExistsForPr(): 檢查機台是否存在
 * - productionRecordHasQualityRecords(): 檢查是否有品質記錄
 * - getWorkOrdersForPr(): 取得工單選項
 * - getEmployeesForPr(): 取得員工選項
 * - getMachinesForPr(): 取得機台選項
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
 * 讀取生產紀錄請求的欄位
 *
 * @return array
 */
function readProductionRecordPayload(): array
{
    $data = getJsonInput();
    return [
        'work_order_id'   => isset($data['work_order_id']) ? (int)$data['work_order_id'] : null,
        'card_number'     => trim($data['card_number'] ?? ''),
        'weight_kg'       => isset($data['weight_kg']) ? (float)$data['weight_kg'] : null,
        'production_date' => $data['production_date'] ?? null,
        'production_time' => $data['production_time'] ?? null,
        'machine_id'      => isset($data['machine_id']) && $data['machine_id'] !== '' ? (int)$data['machine_id'] : null,
        'machine_type'    => trim($data['machine_type'] ?? ''),
        'employee_id'     => isset($data['employee_id']) ? (int)$data['employee_id'] : null,
        'notes'           => trim($data['notes'] ?? ''),
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證生產紀錄資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateProductionRecordData(array $data): array
{
    $errors = [];
    if (empty($data['work_order_id'])) {
        $errors[] = '工單不可為空';
    }
    if (empty($data['employee_id'])) {
        $errors[] = '作業員不可為空';
    }
    if (empty($data['production_date'])) {
        $errors[] = '生產日期不可為空';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢生產紀錄
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findProductionRecord(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT pr.*,
       wo.work_order_number,
       e.employee_number,
       e.name AS employee_name,
       m.name AS machine_name
  FROM production_records pr
  LEFT JOIN work_orders wo ON wo.id = pr.work_order_id
  LEFT JOIN employees e ON e.id = pr.employee_id
  LEFT JOIN machines m ON m.id = pr.machine_id
 WHERE pr.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換生產紀錄資料格式
 *
 * @param array $row
 * @return array
 */
function transformProductionRecord(array $row): array
{
    return [
        'id'                => (int)$row['id'],
        'work_order_id'     => (int)$row['work_order_id'],
        'work_order_number' => $row['work_order_number'] ?? '',
        'card_number'       => $row['card_number'] ?? '',
        'weight_kg'         => $row['weight_kg'] !== null ? (float)$row['weight_kg'] : null,
        'production_date'   => $row['production_date'],
        'production_time'   => $row['production_time'],
        'machine_id'        => $row['machine_id'] !== null ? (int)$row['machine_id'] : null,
        'machine_name'      => $row['machine_name'] ?? '',
        'machine_type'      => $row['machine_type'] ?? '',
        'employee_id'       => (int)$row['employee_id'],
        'employee_number'   => $row['employee_number'] ?? '',
        'employee_name'     => $row['employee_name'] ?? '',
        'notes'             => $row['notes'] ?? '',
        'created_at'        => $row['created_at'],
        'updated_at'        => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查生產紀錄是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function productionRecordExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM production_records WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查工單是否存在
 *
 * @param PDO $pdo
 * @param int $workOrderId
 * @return bool
 */
function workOrderExistsForPr(PDO $pdo, int $workOrderId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_orders WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $workOrderId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查員工是否存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @return bool
 */
function employeeExistsForPr(PDO $pdo, int $employeeId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $employeeId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查機台是否存在
 *
 * @param PDO $pdo
 * @param int $machineId
 * @return bool
 */
function machineExistsForPr(PDO $pdo, int $machineId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM machines WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $machineId]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 外鍵關聯檢查
 * ========================== */

/**
 * 檢查生產紀錄是否被品質紀錄引用
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function productionRecordHasQualityRecords(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM production_quality_records WHERE production_record_id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得工單列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getWorkOrdersForPr(PDO $pdo): array
{
    $sql = "SELECT id, work_order_number FROM work_orders ORDER BY work_order_number DESC LIMIT 100";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得員工列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getEmployeesForPr(PDO $pdo): array
{
    $sql = "SELECT id, employee_number, name FROM employees WHERE status = 'active' AND deleted_at IS NULL ORDER BY employee_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得機台列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getMachinesForPr(PDO $pdo): array
{
    $sql = "SELECT id, machine_number, name FROM machines ORDER BY machine_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
