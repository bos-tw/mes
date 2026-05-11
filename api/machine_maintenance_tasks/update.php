<?php
declare(strict_types=1);
/**
 * machine_maintenance_tasks API — 更新
 *
 * PUT /api/machine_maintenance_tasks/update.php?id={id}
 *
 * @file   api/machine_maintenance_tasks/update.php
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
    error_log('machine_maintenance_tasks/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查任務是否存在
if (!maintenanceTaskExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的機台維修任務'], 404);
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
UPDATE machine_maintenance_tasks SET
    machine_id = :machine_id,
    task_type = :task_type,
    title = :title,
    description = :description,
    scheduled_start = :scheduled_start,
    scheduled_end = :scheduled_end,
    actual_start = :actual_start,
    actual_end = :actual_end,
    status = :status,
    next_due_date = :next_due_date
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'              => $id,
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

    $record = findMaintenanceTask($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '機台維修任務更新成功',
        'data'    => $record ? transformMaintenanceTask($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Machine maintenance task update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
