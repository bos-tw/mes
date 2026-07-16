<?php
declare(strict_types=1);
/**
 * daily_machine_inspections API — 列表 & 新增
 *
 * GET  /api/daily_machine_inspections/          取得每日機台檢驗列表（含分頁）
 * POST /api/daily_machine_inspections/          新增每日機台檢驗
 *
 * @file   api/daily_machine_inspections/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListDailyInspections();
        break;
    case 'POST':
        handleCreateDailyInspection();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得每日機台檢驗列表
 * ====================== */
function handleListDailyInspections(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('daily_machine_inspections/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依機台篩選
    if (!empty($_GET['machine_id'])) {
        $where[]  = 'di.machine_id = :machine_id';
        $params[':machine_id'] = (int)$_GET['machine_id'];
    }

    // 依檢驗員篩選
    if (!empty($_GET['inspector_id'])) {
        $where[]  = 'di.inspector_id = :inspector_id';
        $params[':inspector_id'] = (int)$_GET['inspector_id'];
    }

    // 依合格狀態篩選
    if (isset($_GET['is_qualified']) && $_GET['is_qualified'] !== '') {
        $where[]  = 'di.is_qualified = :is_qualified';
        $params[':is_qualified'] = (int)$_GET['is_qualified'];
    }

    // 依日期範圍篩選
    if (!empty($_GET['date_from'])) {
        $where[]  = 'di.inspection_date >= :date_from';
        $params[':date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $where[]  = 'di.inspection_date <= :date_to';
        $params[':date_to'] = $_GET['date_to'];
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM daily_machine_inspections di $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT di.*,
       m.machine_number AS machine_code,
       m.name AS machine_name,
       e.employee_number AS inspector_number,
       e.name AS inspector_name
  FROM daily_machine_inspections di
  LEFT JOIN machines m ON m.id = di.machine_id
  LEFT JOIN employees e ON e.id = di.inspector_id
  $whereSql
 ORDER BY di.inspection_date DESC, di.id DESC
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

    $data = array_map('transformDailyInspection', $rows);

    // 取得下拉選單資料
    $machines  = getMachinesForDi($pdo);
    $employees = getEmployeesForDi($pdo);

    jsonResponse([
        'success'    => true,
        'data'       => $data,
        'pagination' => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
        'machines'   => $machines,
        'employees'  => $employees,
    ]);
}

/* ======================
 * POST — 新增每日機台檢驗
 * ====================== */
function handleCreateDailyInspection(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('daily_machine_inspections/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readDailyInspectionPayload();

    $errors = validateDailyInspectionData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查機台是否存在
    if (!machineExistsForDi($pdo, $data['machine_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的機台不存在'], 400);
    }

    // 檢查檢驗員是否存在
    if (!employeeExistsForDi($pdo, $data['inspector_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的檢驗員不存在'], 400);
    }

    // 檢查是否重複
    if (duplicateInspectionExists($pdo, $data['inspection_date'], $data['machine_id'])) {
        jsonResponse(['success' => false, 'message' => '該機台在此日期已有檢驗紀錄'], 409);
    }

    try {
        $sql = <<<SQL
INSERT INTO daily_machine_inspections (
    inspection_date, machine_id, inspector_id, is_qualified, notes
) VALUES (
    :inspection_date, :machine_id, :inspector_id, :is_qualified, :notes
)
SQL;
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':inspection_date' => $data['inspection_date'],
            ':machine_id'      => $data['machine_id'],
            ':inspector_id'    => $data['inspector_id'],
            ':is_qualified'    => $data['is_qualified'] ? 1 : 0,
            ':notes'           => $data['notes'] ?: null,
        ]);
        $newId = (int)$pdo->lastInsertId();

        $record = findDailyInspection($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '每日機台檢驗新增成功',
            'data'    => $record ? transformDailyInspection($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Daily machine inspection create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
