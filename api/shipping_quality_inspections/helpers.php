<?php
/**
 * 出貨品質檢驗 API - 共用輔助函式
 *
 * 提供出貨品質檢驗模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module shipping_quality_inspections
 * @table shipping_quality_inspections
 *
 * @functions
 * - readShippingQualityInspectionPayload(): 讀取出貨品質檢驗請求的欄位
 * - validateShippingQualityInspectionData(): 驗證出貨品質檢驗資料
 * - findShippingQualityInspection(): 依 ID 查詢出貨品質檢驗
 * - transformShippingQualityInspection(): 轉換出貨品質檢驗資料格式
 * - shippingQualityInspectionExists(): 檢查檢驗紀錄是否存在
 * - shippingOrderExistsForSqi(): 檢查出貨單是否存在
 * - employeeExistsForSqi(): 檢查員工是否存在
 * - getShippingOrdersForSqi(): 取得出貨單選項
 * - getEmployeesForSqi(): 取得員工選項
 * - getInspectionResultOptions(): 取得檢驗結果選項
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
 * 讀取出貨品質檢驗請求的欄位
 *
 * @return array
 */
function readShippingQualityInspectionPayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'shipping_order_id'      => isset($data['shipping_order_id']) ? (int)$data['shipping_order_id'] : null,
        'inspection_datetime'    => $data['inspection_datetime'] ?? null,
        'inspector_id'           => isset($data['inspector_id']) ? (int)$data['inspector_id'] : null,
        'sample_quantity_pcs'    => isset($data['sample_quantity_pcs']) ? (int)$data['sample_quantity_pcs'] : 0,
        'defective_quantity_pcs' => isset($data['defective_quantity_pcs']) ? (int)$data['defective_quantity_pcs'] : 0,
        'rejection_rate_ppm'     => isset($data['rejection_rate_ppm']) ? (float)$data['rejection_rate_ppm'] : 0,
        'inspection_result'      => trim($data['inspection_result'] ?? 'pass'),
        'notes'                  => trim($data['notes'] ?? ''),
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證出貨品質檢驗資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateShippingQualityInspectionData(array $data): array
{
    $errors = [];
    if (empty($data['shipping_order_id'])) {
        $errors[] = '出貨單不可為空';
    }
    if (empty($data['inspection_datetime'])) {
        $errors[] = '檢驗時間不可為空';
    }
    if (empty($data['inspector_id'])) {
        $errors[] = '檢驗員不可為空';
    }
    if ($data['sample_quantity_pcs'] <= 0) {
        $errors[] = '抽樣數量必須大於 0';
    }
    if ($data['defective_quantity_pcs'] < 0) {
        $errors[] = '不良數量不可為負數';
    }
    if ($data['defective_quantity_pcs'] > $data['sample_quantity_pcs']) {
        $errors[] = '不良數量不可超過抽樣數量';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢出貨品質檢驗
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findShippingQualityInspection(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT sqi.*,
       so.shipping_order_number AS shipping_order_number,
       e.employee_number AS inspector_number,
       e.name AS inspector_name
  FROM shipping_quality_inspections sqi
  LEFT JOIN shipping_orders so ON so.id = sqi.shipping_order_id
  LEFT JOIN employees e ON e.id = sqi.inspector_id
 WHERE sqi.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換出貨品質檢驗資料格式
 *
 * @param array $row
 * @return array
 */
function transformShippingQualityInspection(array $row): array
{
    return [
        'id'                     => (int)$row['id'],
        'shipping_order_id'      => (int)$row['shipping_order_id'],
        'shipping_order_number'  => $row['shipping_order_number'] ?? '',
        'inspection_datetime'    => $row['inspection_datetime'],
        'inspector_id'           => (int)$row['inspector_id'],
        'inspector_number'       => $row['inspector_number'] ?? '',
        'inspector_name'         => $row['inspector_name'] ?? '',
        'sample_quantity_pcs'    => (int)$row['sample_quantity_pcs'],
        'defective_quantity_pcs' => (int)$row['defective_quantity_pcs'],
        'rejection_rate_ppm'     => (float)$row['rejection_rate_ppm'],
        'inspection_result'      => $row['inspection_result'] ?? 'pass',
        'notes'                  => $row['notes'] ?? '',
        'created_at'             => $row['created_at'],
        'updated_at'             => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查出貨品質檢驗是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function shippingQualityInspectionExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM shipping_quality_inspections WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查出貨單是否存在
 *
 * @param PDO $pdo
 * @param int $shippingOrderId
 * @return bool
 */
function shippingOrderExistsForSqi(PDO $pdo, int $shippingOrderId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM shipping_orders WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $shippingOrderId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查員工是否存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @return bool
 */
function employeeExistsForSqi(PDO $pdo, int $employeeId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $employeeId]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得出貨單列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getShippingOrdersForSqi(PDO $pdo): array
{
    $sql = 'SELECT id, shipping_order_number FROM shipping_orders ORDER BY shipping_order_number DESC LIMIT 100';
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得員工列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getEmployeesForSqi(PDO $pdo): array
{
    $sql = "SELECT id, employee_number, name FROM employees WHERE status = 'active' AND deleted_at IS NULL ORDER BY employee_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得檢驗結果選項
 *
 * @return array
 */
function getInspectionResultOptions(): array
{
    return [
        ['value' => 'pass', 'label' => '合格'],
        ['value' => 'fail', 'label' => '不合格'],
        ['value' => 'conditional', 'label' => '有條件合格'],
    ];
}
