<?php
/**
 * 機台保養任務 API - 共用輔助函式
 *
 * 提供機台保養任務模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module machine_maintenance_tasks
 * @table machine_maintenance_tasks
 *
 * @functions
 * - readMaintenanceTaskPayload(): 讀取機台維修任務請求的欄位
 * - validateMaintenanceTaskData(): 驗證機台維修任務資料
 * - findMaintenanceTask(): 依 ID 查詢機台維修任務
 * - transformMaintenanceTask(): 轉換機台維修任務資料格式
 * - maintenanceTaskExists(): 檢查維修任務是否存在
 * - machineExistsForMt(): 檢查機台是否存在
 * - getMachinesForMt(): 取得機台選項
 * - getTaskTypeOptions(): 取得任務類型選項
 * - getMaintenanceStatusOptions(): 取得維修狀態選項
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
 * 讀取機台維修任務請求的欄位
 *
 * @return array
 */
function readMaintenanceTaskPayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'machine_id'      => isset($data['machine_id']) ? (int)$data['machine_id'] : null,
        'task_type'       => trim($data['task_type'] ?? ''),
        'title'           => trim($data['title'] ?? ''),
        'description'     => trim($data['description'] ?? ''),
        'scheduled_start' => $data['scheduled_start'] ?? null,
        'scheduled_end'   => $data['scheduled_end'] ?? null,
        'actual_start'    => $data['actual_start'] ?? null,
        'actual_end'      => $data['actual_end'] ?? null,
        'status'          => trim($data['status'] ?? 'pending'),
        'next_due_date'   => $data['next_due_date'] ?? null,
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證機台維修任務資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateMaintenanceTaskData(array $data): array
{
    $errors = [];
    if (empty($data['machine_id'])) {
        $errors[] = '機台不可為空';
    }
    if (empty($data['task_type'])) {
        $errors[] = '任務類型不可為空';
    }
    if (empty($data['title'])) {
        $errors[] = '任務標題不可為空';
    }
    if (mb_strlen($data['title']) > 150) {
        $errors[] = '任務標題不可超過 150 字';
    }
    if (empty($data['scheduled_start'])) {
        $errors[] = '預定開始時間不可為空';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢機台維修任務
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findMaintenanceTask(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT mt.*,
       m.machine_number AS machine_code,
       m.name AS machine_name
  FROM machine_maintenance_tasks mt
  LEFT JOIN machines m ON m.id = mt.machine_id
 WHERE mt.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換機台維修任務資料格式
 *
 * @param array $row
 * @return array
 */
function transformMaintenanceTask(array $row): array
{
    return [
        'id'              => (int)$row['id'],
        'machine_id'      => (int)$row['machine_id'],
        'machine_code'    => $row['machine_code'] ?? '',
        'machine_name'    => $row['machine_name'] ?? '',
        'task_type'       => $row['task_type'],
        'title'           => $row['title'],
        'description'     => $row['description'] ?? '',
        'scheduled_start' => $row['scheduled_start'],
        'scheduled_end'   => $row['scheduled_end'],
        'actual_start'    => $row['actual_start'],
        'actual_end'      => $row['actual_end'],
        'status'          => $row['status'] ?? 'pending',
        'next_due_date'   => $row['next_due_date'],
        'created_at'      => $row['created_at'],
        'updated_at'      => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查機台維修任務是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function maintenanceTaskExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM machine_maintenance_tasks WHERE id = :id LIMIT 1');
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
function machineExistsForMt(PDO $pdo, int $machineId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM machines WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $machineId]);
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
function getMachinesForMt(PDO $pdo): array
{
    $sql = 'SELECT id, machine_number, name FROM machines ORDER BY machine_number, name';
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得任務類型選項
 *
 * @return array
 */
function getTaskTypeOptions(): array
{
    return [
        ['value' => 'preventive', 'label' => '預防保養'],
        ['value' => 'corrective', 'label' => '故障維修'],
        ['value' => 'inspection', 'label' => '例行檢查'],
        ['value' => 'calibration', 'label' => '校正'],
        ['value' => 'other', 'label' => '其他'],
    ];
}

/**
 * 取得狀態選項
 *
 * @return array
 */
function getMaintenanceStatusOptions(): array
{
    return [
        ['value' => 'pending', 'label' => '待執行'],
        ['value' => 'in_progress', 'label' => '執行中'],
        ['value' => 'completed', 'label' => '已完成'],
        ['value' => 'cancelled', 'label' => '已取消'],
    ];
}
