<?php
declare(strict_types=1);
/**
 * machine_maintenance_tasks API — 列表 & 新增
 *
 * GET  /api/machine_maintenance_tasks/          取得機台維修任務列表（含分頁）
 * POST /api/machine_maintenance_tasks/          新增機台維修任務
 *
 * @file   api/machine_maintenance_tasks/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListMaintenanceTasks();
        break;
    case 'POST':
        handleCreateMaintenanceTask();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得機台維修任務列表
 * ====================== */
function handleListMaintenanceTasks(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('machine_maintenance_tasks/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依機台篩選
    if (!empty($_GET['machine_id'])) {
        $where[]  = 'mt.machine_id = :machine_id';
        $params[':machine_id'] = (int)$_GET['machine_id'];
    }

    // 依任務類型篩選
    if (!empty($_GET['task_type'])) {
        $where[]  = 'mt.task_type = :task_type';
        $params[':task_type'] = $_GET['task_type'];
    }

    // 依狀態篩選
    if (!empty($_GET['status'])) {
        $where[]  = 'mt.status = :status';
        $params[':status'] = $_GET['status'];
    }

    // 依日期範圍篩選
    if (!empty($_GET['date_from'])) {
        $where[]  = 'DATE(mt.scheduled_start) >= :date_from';
        $params[':date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $where[]  = 'DATE(mt.scheduled_start) <= :date_to';
        $params[':date_to'] = $_GET['date_to'];
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM machine_maintenance_tasks mt $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT mt.*,
       m.machine_number AS machine_code,
       m.name AS machine_name
  FROM machine_maintenance_tasks mt
  LEFT JOIN machines m ON m.id = mt.machine_id
  $whereSql
 ORDER BY mt.scheduled_start DESC
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

    $data = array_map('transformMaintenanceTask', $rows);

    // 取得下拉選單資料
    $machines = getMachinesForMt($pdo);

    jsonResponse([
        'success'         => true,
        'data'            => $data,
        'pagination'      => [
            'page'        => $page,
            'perPage'     => $perPage,
            'total'       => $total,
            'totalPages'  => (int)ceil($total / $perPage),
        ],
        'machines'        => $machines,
        'taskTypeOptions' => getTaskTypeOptions(),
        'statusOptions'   => getMaintenanceStatusOptions(),
    ]);
}

/* ======================
 * POST — 新增機台維修任務
 * ====================== */
function handleCreateMaintenanceTask(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('machine_maintenance_tasks/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readMaintenanceTaskPayload();

    $errors = validateMaintenanceTaskData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查機台是否存在
    if (!machineExistsForMt($pdo, $data['machine_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的機台不存在'], 400);
    }

    try {
        $sql = <<<SQL
INSERT INTO machine_maintenance_tasks (
    id, machine_id, task_type, title, description,
    scheduled_start, scheduled_end, actual_start, actual_end,
    status, next_due_date
) VALUES (
    :id, :machine_id, :task_type, :title, :description,
    :scheduled_start, :scheduled_end, :actual_start, :actual_end,
    :status, :next_due_date
)
SQL;
        // 生成 ID
        $idStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM machine_maintenance_tasks');
        $newId = (int)$idStmt->fetchColumn();

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'              => $newId,
            ':machine_id'      => $data['machine_id'],
            ':task_type'       => $data['task_type'],
            ':title'           => $data['title'],
            ':description'     => $data['description'] ?: null,
            ':scheduled_start' => $data['scheduled_start'],
            ':scheduled_end'   => $data['scheduled_end'] ?: null,
            ':actual_start'    => $data['actual_start'] ?: null,
            ':actual_end'      => $data['actual_end'] ?: null,
            ':status'          => $data['status'],
            ':next_due_date'   => $data['next_due_date'] ?: null,
        ]);

        $record = findMaintenanceTask($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '機台維修任務新增成功',
            'data'    => $record ? transformMaintenanceTask($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Machine maintenance task create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
