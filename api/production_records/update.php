<?php
declare(strict_types=1);
/**
 * production_records API — 更新
 *
 * PUT /api/production_records/update.php?id={id}
 *
 * @file   api/production_records/update.php
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
    error_log('production_records/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查生產紀錄是否存在
if (!productionRecordExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的生產紀錄'], 404);
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
UPDATE production_records SET
    work_order_id = :work_order_id,
    card_number = :card_number,
    weight_kg = :weight_kg,
    production_date = :production_date,
    production_time = :production_time,
    machine_id = :machine_id,
    machine_type = :machine_type,
    employee_id = :employee_id,
    notes = :notes
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'              => $id,
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

    $record = findProductionRecord($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '生產紀錄更新成功',
        'data'    => $record ? transformProductionRecord($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Production record update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
