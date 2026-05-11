<?php
declare(strict_types=1);
/**
 * production_records API — 列表 & 新增
 *
 * GET  /api/production_records/          取得生產紀錄列表（含分頁）
 * POST /api/production_records/          新增生產紀錄
 *
 * @file   api/production_records/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListProductionRecords();
        break;
    case 'POST':
        handleCreateProductionRecord();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得生產紀錄列表
 * ====================== */
function handleListProductionRecords(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('production_records/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依工單篩選
    if (!empty($_GET['work_order_id'])) {
        $where[]  = 'pr.work_order_id = :work_order_id';
        $params[':work_order_id'] = (int)$_GET['work_order_id'];
    }

    // 依機台篩選
    if (!empty($_GET['machine_id'])) {
        $where[]  = 'pr.machine_id = :machine_id';
        $params[':machine_id'] = (int)$_GET['machine_id'];
    }

    // 依員工篩選
    if (!empty($_GET['employee_id'])) {
        $where[]  = 'pr.employee_id = :employee_id';
        $params[':employee_id'] = (int)$_GET['employee_id'];
    }

    // 依日期範圍篩選
    if (!empty($_GET['date_from'])) {
        $where[]  = 'pr.production_date >= :date_from';
        $params[':date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $where[]  = 'pr.production_date <= :date_to';
        $params[':date_to'] = $_GET['date_to'];
    }

    // 依卡號搜尋
    if (!empty($_GET['card_number'])) {
        $where[]  = 'pr.card_number LIKE :card_number';
        $params[':card_number'] = '%' . $_GET['card_number'] . '%';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM production_records pr $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
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
  $whereSql
 ORDER BY pr.production_date DESC, pr.production_time DESC, pr.id DESC
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

    $data = array_map('transformProductionRecord', $rows);

    // 取得下拉選單資料
    $workOrders = getWorkOrdersForPr($pdo);
    $employees  = getEmployeesForPr($pdo);
    $machines   = getMachinesForPr($pdo);

    jsonResponse([
        'success'    => true,
        'data'       => $data,
        'pagination' => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
        'workOrders' => $workOrders,
        'employees'  => $employees,
        'machines'   => $machines,
    ]);
}

/* ======================
 * POST — 新增生產紀錄
 * ====================== */
function handleCreateProductionRecord(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('production_records/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readProductionRecordPayload();

    $errors = validateProductionRecordData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查工單是否存在
    if (!workOrderExistsForPr($pdo, $data['work_order_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的工單不存在'], 400);
    }

    // 檢查員工是否存在
    if (!employeeExistsForPr($pdo, $data['employee_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的員工不存在'], 400);
    }

    // 如果有指定機台，檢查機台是否存在
    if ($data['machine_id'] && !machineExistsForPr($pdo, $data['machine_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的機台不存在'], 400);
    }

    try {
        $sql = <<<SQL
INSERT INTO production_records (
    work_order_id, card_number, weight_kg, production_date, production_time,
    machine_id, machine_type, employee_id, notes
) VALUES (
    :work_order_id, :card_number, :weight_kg, :production_date, :production_time,
    :machine_id, :machine_type, :employee_id, :notes
)
SQL;
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':work_order_id'   => $data['work_order_id'],
            ':card_number'     => $data['card_number'] ?: null,
            ':weight_kg'       => $data['weight_kg'],
            ':production_date' => $data['production_date'],
            ':production_time' => $data['production_time'] ?: null,
            ':machine_id'      => $data['machine_id'],
            ':machine_type'    => $data['machine_type'] ?: null,
            ':employee_id'     => $data['employee_id'],
            ':notes'           => $data['notes'] ?: null,
        ]);

        $newId = (int)$pdo->lastInsertId();
        $record = findProductionRecord($pdo, $newId);

        logAuditAction('新增生產紀錄', 'production_records', $newId, ['work_order_id' => $data['work_order_id'] ?? null, 'employee_id' => $data['employee_id'] ?? null]);

        jsonResponse([
            'success' => true,
            'message' => '生產紀錄新增成功',
            'data'    => $record ? transformProductionRecord($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Production record create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
