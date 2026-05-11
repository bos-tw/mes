<?php
declare(strict_types=1);
/**
 * quality_issue_reports API — 更新
 *
 * PUT /api/quality_issue_reports/update.php?id={id}
 *
 * @file   api/quality_issue_reports/update.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

requireMethod('PUT');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

try {
    $pdo = db();
} catch (Exception $e) {
    error_log('quality_issue_reports/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查報告是否存在
if (!qualityIssueReportExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的品質異常報告'], 404);
}

$data = readQualityIssueReportPayload();

$errors = validateQualityIssueReportData($data);
if ($errors) {
    jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
}

// 檢查報告者是否存在
if (!employeeExistsForQir($pdo, $data['reported_by_employee_id'])) {
    jsonResponse(['success' => false, 'message' => '指定的報告者不存在'], 400);
}

// 檢查責任部門是否存在
if ($data['responsible_department_id'] && !departmentExistsForQir($pdo, $data['responsible_department_id'])) {
    jsonResponse(['success' => false, 'message' => '指定的責任部門不存在'], 400);
}

try {
    $sql = <<<SQL
UPDATE quality_issue_reports SET
    report_datetime = :report_datetime,
    reported_by_employee_id = :reported_by_employee_id,
    issue_source_type = :issue_source_type,
    issue_source_id = :issue_source_id,
    issue_description = :issue_description,
    root_cause_analysis = :root_cause_analysis,
    corrective_actions = :corrective_actions,
    preventive_actions = :preventive_actions,
    responsible_department_id = :responsible_department_id,
    status = :status,
    completion_date = :completion_date
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'                        => $id,
        ':report_datetime'           => $data['report_datetime'],
        ':reported_by_employee_id'   => $data['reported_by_employee_id'],
        ':issue_source_type'         => $data['issue_source_type'],
        ':issue_source_id'           => $data['issue_source_id'],
        ':issue_description'         => $data['issue_description'],
        ':root_cause_analysis'       => $data['root_cause_analysis'] ?: null,
        ':corrective_actions'        => $data['corrective_actions'] ?: null,
        ':preventive_actions'        => $data['preventive_actions'] ?: null,
        ':responsible_department_id' => $data['responsible_department_id'],
        ':status'                    => $data['status'],
        ':completion_date'           => $data['completion_date'] ?: null,
    ]);

    $record = findQualityIssueReport($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '品質異常報告更新成功',
        'data'    => $record ? transformQualityIssueReport($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Quality issue report update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
