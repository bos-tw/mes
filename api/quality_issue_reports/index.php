<?php
declare(strict_types=1);
/**
 * quality_issue_reports API — 列表 & 新增
 *
 * GET  /api/quality_issue_reports/          取得品質異常報告列表（含分頁）
 * POST /api/quality_issue_reports/          新增品質異常報告
 *
 * @file   api/quality_issue_reports/index.php
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListQualityIssueReports();
        break;
    case 'POST':
        handleCreateQualityIssueReport();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得品質異常報告列表
 * ====================== */
function handleListQualityIssueReports(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('quality_issue_reports/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依狀態篩選
    if (!empty($_GET['status'])) {
        $where[]  = 'qir.status = :status';
        $params[':status'] = $_GET['status'];
    }

    // 依報告者篩選
    if (!empty($_GET['reported_by_employee_id'])) {
        $where[]  = 'qir.reported_by_employee_id = :reported_by';
        $params[':reported_by'] = (int)$_GET['reported_by_employee_id'];
    }

    // 依日期範圍篩選
    if (!empty($_GET['date_from'])) {
        $where[]  = 'DATE(qir.report_datetime) >= :date_from';
        $params[':date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $where[]  = 'DATE(qir.report_datetime) <= :date_to';
        $params[':date_to'] = $_GET['date_to'];
    }

    // 關鍵字搜尋
    if (!empty($_GET['keyword'])) {
        $where[]  = '(qir.issue_description LIKE :kw OR qir.root_cause_analysis LIKE :kw)';
        $params[':kw'] = '%' . $_GET['keyword'] . '%';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM quality_issue_reports qir $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT qir.*,
       e.name AS reported_by_name,
       e.employee_number AS reported_by_number,
       d.name AS responsible_department_name
  FROM quality_issue_reports qir
  LEFT JOIN employees e ON e.id = qir.reported_by_employee_id
  LEFT JOIN departments d ON d.id = qir.responsible_department_id
  $whereSql
 ORDER BY qir.report_datetime DESC
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

    $data = array_map('transformQualityIssueReport', $rows);

    // 取得下拉選單資料
    $employees   = getEmployeesForQir($pdo);
    $departments = getDepartmentsForQir($pdo);

    jsonResponse([
        'success'          => true,
        'data'             => $data,
        'pagination'       => [
            'page'         => $page,
            'perPage'      => $perPage,
            'total'        => $total,
            'totalPages'   => (int)ceil($total / $perPage),
        ],
        'employees'        => $employees,
        'departments'      => $departments,
        'statusOptions'    => getQualityIssueStatusOptions(),
        'sourceTypeOptions'=> getIssueSourceTypeOptions(),
    ]);
}

/* ======================
 * POST — 新增品質異常報告
 * ====================== */
function handleCreateQualityIssueReport(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('quality_issue_reports/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
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
INSERT INTO quality_issue_reports (
    report_datetime, reported_by_employee_id, issue_source_type, issue_source_id,
    issue_description, root_cause_analysis, corrective_actions, preventive_actions,
    responsible_department_id, status, completion_date
) VALUES (
    :report_datetime, :reported_by_employee_id, :issue_source_type, :issue_source_id,
    :issue_description, :root_cause_analysis, :corrective_actions, :preventive_actions,
    :responsible_department_id, :status, :completion_date
)
SQL;
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
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
        $newId = (int)$pdo->lastInsertId();

        $record = findQualityIssueReport($pdo, $newId);
        $issueSourceType = (string)($data['issue_source_type'] ?? '');
        $issueSourceId = (int)($data['issue_source_id'] ?? 0);
        if ($issueSourceId > 0 && in_array($issueSourceType, ['process_inspection', 'work_order', 'production_work_order'], true)) {
            appendWorkOrderOperationLog($pdo, $issueSourceId, 'issue_reported', '品質異常回報', [
                'related_table' => 'quality_issue_reports',
                'related_id' => $newId,
                'notes' => $data['issue_description'],
                'payload' => [
                    'status' => $data['status'],
                    'responsible_department_id' => $data['responsible_department_id'],
                    'issue_source_type' => $issueSourceType,
                ],
                'created_by_employee_id' => (int)$data['reported_by_employee_id'],
            ]);
        }

        jsonResponse([
            'success' => true,
            'message' => '品質異常報告新增成功',
            'data'    => $record ? transformQualityIssueReport($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Quality issue report create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
