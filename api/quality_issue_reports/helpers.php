<?php
/**
 * 品質問題報告 API - 共用輔助函式
 *
 * 提供品質問題報告模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module quality_issue_reports
 * @table quality_issue_reports
 *
 * @functions
 * - readQualityIssueReportPayload(): 讀取品質異常報告請求的欄位
 * - validateQualityIssueReportData(): 驗證品質異常報告資料
 * - findQualityIssueReport(): 依 ID 查詢品質異常報告
 * - transformQualityIssueReport(): 轉換品質異常報告資料格式
 * - qualityIssueReportExists(): 檢查品質異常報告是否存在
 * - employeeExistsForQir(): 檢查員工是否存在
 * - departmentExistsForQir(): 檢查部門是否存在
 * - getEmployeesForQir(): 取得員工選項
 * - getDepartmentsForQir(): 取得部門選項
 * - getQualityIssueStatusOptions(): 取得狀態選項
 * - getIssueSourceTypeOptions(): 取得異常來源類型選項
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
 * 讀取品質異常報告請求的欄位
 *
 * @return array
 */
function readQualityIssueReportPayload(): array
{
    $data = getJsonInput() ?: [];
    return [
        'report_datetime'           => $data['report_datetime'] ?? null,
        'reported_by_employee_id'   => isset($data['reported_by_employee_id']) ? (int)$data['reported_by_employee_id'] : null,
        'issue_source_type'         => trim($data['issue_source_type'] ?? ''),
        'issue_source_id'           => isset($data['issue_source_id']) && $data['issue_source_id'] !== '' ? (int)$data['issue_source_id'] : null,
        'issue_description'         => trim($data['issue_description'] ?? ''),
        'root_cause_analysis'       => trim($data['root_cause_analysis'] ?? ''),
        'corrective_actions'        => trim($data['corrective_actions'] ?? ''),
        'preventive_actions'        => trim($data['preventive_actions'] ?? ''),
        'responsible_department_id' => isset($data['responsible_department_id']) && $data['responsible_department_id'] !== '' ? (int)$data['responsible_department_id'] : null,
        'status'                    => trim($data['status'] ?? 'pending'),
        'completion_date'           => $data['completion_date'] ?? null,
    ];
}

/* ==========================
 * 驗證函式
 * ========================== */

/**
 * 驗證品質異常報告資料
 *
 * @param array $data
 * @return array<string> 錯誤訊息陣列
 */
function validateQualityIssueReportData(array $data): array
{
    $errors = [];
    if (empty($data['report_datetime'])) {
        $errors[] = '報告時間不可為空';
    }
    if (empty($data['reported_by_employee_id'])) {
        $errors[] = '報告者不可為空';
    }
    if (empty($data['issue_source_type'])) {
        $errors[] = '異常來源類型不可為空';
    }
    if (empty($data['issue_description'])) {
        $errors[] = '異常描述不可為空';
    }
    return $errors;
}

/* ==========================
 * 單筆查詢
 * ========================== */

/**
 * 依 ID 查詢品質異常報告
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findQualityIssueReport(PDO $pdo, int $id): ?array
{
    $sql = <<<SQL
SELECT qir.*,
       e.name AS reported_by_name,
       e.employee_number AS reported_by_number,
       d.name AS responsible_department_name
  FROM quality_issue_reports qir
  LEFT JOIN employees e ON e.id = qir.reported_by_employee_id
  LEFT JOIN departments d ON d.id = qir.responsible_department_id
 WHERE qir.id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換品質異常報告資料格式
 *
 * @param array $row
 * @return array
 */
function transformQualityIssueReport(array $row): array
{
    return [
        'id'                          => (int)$row['id'],
        'report_datetime'             => $row['report_datetime'],
        'reported_by_employee_id'     => (int)$row['reported_by_employee_id'],
        'reported_by_name'            => $row['reported_by_name'] ?? '',
        'reported_by_number'          => $row['reported_by_number'] ?? '',
        'issue_source_type'           => $row['issue_source_type'],
        'issue_source_id'             => $row['issue_source_id'] ? (int)$row['issue_source_id'] : null,
        'issue_description'           => $row['issue_description'],
        'root_cause_analysis'         => $row['root_cause_analysis'] ?? '',
        'corrective_actions'          => $row['corrective_actions'] ?? '',
        'preventive_actions'          => $row['preventive_actions'] ?? '',
        'responsible_department_id'   => $row['responsible_department_id'] ? (int)$row['responsible_department_id'] : null,
        'responsible_department_name' => $row['responsible_department_name'] ?? '',
        'status'                      => $row['status'] ?? 'pending',
        'completion_date'             => $row['completion_date'],
        'created_at'                  => $row['created_at'],
        'updated_at'                  => $row['updated_at'],
    ];
}

/* ==========================
 * 存在性檢查
 * ========================== */

/**
 * 檢查品質異常報告是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function qualityIssueReportExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM quality_issue_reports WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查員工是否存在
 *
 * @param PDO $pdo
 * @param int $employeeId
 * @return bool
 */
function employeeExistsForQir(PDO $pdo, int $employeeId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $employeeId]);
    return (bool)$stmt->fetch();
}

/**
 * 檢查部門是否存在
 *
 * @param PDO $pdo
 * @param int $departmentId
 * @return bool
 */
function departmentExistsForQir(PDO $pdo, int $departmentId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM departments WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $departmentId]);
    return (bool)$stmt->fetch();
}

/* ==========================
 * 下拉選單資料
 * ========================== */

/**
 * 取得員工列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getEmployeesForQir(PDO $pdo): array
{
    $sql = "SELECT id, name, employee_number FROM employees WHERE status = 'active' AND deleted_at IS NULL ORDER BY employee_number, name";
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得部門列表 (供下拉選單)
 *
 * @param PDO $pdo
 * @return array
 */
function getDepartmentsForQir(PDO $pdo): array
{
    $sql = 'SELECT id, name FROM departments WHERE deleted_at IS NULL ORDER BY name';
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 取得狀態選項
 *
 * @return array
 */
function getQualityIssueStatusOptions(): array
{
    return [
        ['value' => 'pending', 'label' => '待處理'],
        ['value' => 'in_progress', 'label' => '處理中'],
        ['value' => 'resolved', 'label' => '已解決'],
        ['value' => 'closed', 'label' => '已結案'],
    ];
}

/**
 * 取得異常來源類型選項
 *
 * @return array
 */
function getIssueSourceTypeOptions(): array
{
    return [
        ['value' => 'production_records', 'label' => '生產紀錄'],
        ['value' => 'incoming_inspection', 'label' => '進料檢驗'],
        ['value' => 'process_inspection', 'label' => '製程檢驗'],
        ['value' => 'final_inspection', 'label' => '成品檢驗'],
        ['value' => 'customer_complaint', 'label' => '客訴'],
        ['value' => 'other', 'label' => '其他'],
    ];
}
