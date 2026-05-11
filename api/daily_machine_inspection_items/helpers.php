<?php
/**
 * 機台每日巡檢項目 API - 共用輔助函式
 *
 * 提供機台每日巡檢項目模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module daily_machine_inspection_items
 * @table daily_machine_inspection_items
 *
 * @functions
 * - readInspectionItemPayload(): 讀取檢驗項目明細請求的欄位
 * - validateInspectionItemData(): 驗證檢驗項目明細資料
 * - findInspectionItem(): 依 ID 查詢檢驗項目明細
 * - transformInspectionItem(): 轉換檢驗項目明細資料格式
 * - inspectionItemExists(): 檢查檢驗項目是否存在
 * - inspectionExistsForItem(): 檢查所屬檢驗紀錄是否存在
 * - getInspectionsForItem(): 取得檢驗紀錄選項
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
 * 讀取檢驗項目明細請求的欄位
 *
 * @return array
 */
function readInspectionItemPayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'inspection_id'  => isset($data['inspection_id']) ? (int)$data['inspection_id'] : null,
        'item_name'      => trim($data['item_name'] ?? ''),
        'standard'       => trim($data['standard'] ?? ''),
        'actual_result'  => trim($data['actual_result'] ?? ''),
        'is_pass'        => isset($data['is_pass']) ? (bool)$data['is_pass'] : true,
        'remarks'        => trim($data['remarks'] ?? ''),
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證檢驗項目明細資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateInspectionItemData(array $data): array
{
    $errors = [];
    if (empty($data['inspection_id'])) {
        $errors[] = '所屬檢驗紀錄不可為空';
    }
    if (empty($data['item_name'])) {
        $errors[] = '檢驗項目名稱不可為空';
    }
    if (mb_strlen($data['item_name']) > 100) {
        $errors[] = '檢驗項目名稱不可超過 100 字';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢檢驗項目明細
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findInspectionItem(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT dii.*,
       di.inspection_date,
       m.machine_number AS machine_code,
       m.name AS machine_name
  FROM daily_machine_inspection_items dii
  LEFT JOIN daily_machine_inspections di ON di.id = dii.inspection_id
  LEFT JOIN machines m ON m.id = di.machine_id
 WHERE dii.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換檢驗項目明細資料格式
 *
 * @param array $row
 * @return array
 */
function transformInspectionItem(array $row): array
{
    return [
        'id'              => (int)$row['id'],
        'inspection_id'   => (int)$row['inspection_id'],
        'inspection_date' => $row['inspection_date'] ?? '',
        'machine_code'    => $row['machine_code'] ?? '',
        'machine_name'    => $row['machine_name'] ?? '',
        'item_name'       => $row['item_name'],
        'standard'        => $row['standard'] ?? '',
        'actual_result'   => $row['actual_result'] ?? '',
        'is_pass'         => (bool)$row['is_pass'],
        'remarks'         => $row['remarks'] ?? '',
        'created_at'      => $row['created_at'],
        'updated_at'      => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查檢驗項目明細是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function inspectionItemExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM daily_machine_inspection_items WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查每日檢驗紀錄是否存在
 *
 * @param PDO $pdo
 * @param int $inspectionId
 * @return bool
 */
function inspectionExistsForItem(PDO $pdo, int $inspectionId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM daily_machine_inspections WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $inspectionId]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得每日檢驗列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getInspectionsForItem(PDO $pdo): array
{
    $sql = <<<SQL
SELECT di.id, di.inspection_date, m.machine_number AS machine_code, m.name AS machine_name
  FROM daily_machine_inspections di
  LEFT JOIN machines m ON m.id = di.machine_id
 ORDER BY di.inspection_date DESC, di.id DESC
 LIMIT 100
SQL;
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
