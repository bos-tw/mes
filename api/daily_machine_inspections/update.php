<?php
declare(strict_types=1);
/**
 * daily_machine_inspections API — 更新
 *
 * PUT /api/daily_machine_inspections/update.php?id={id}
 *
 * @file   api/daily_machine_inspections/update.php
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
    error_log('daily_machine_inspections/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查檢驗紀錄是否存在
if (!dailyInspectionExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的每日機台檢驗'], 404);
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

// 檢查是否重複（排除自己）
if (duplicateInspectionExists($pdo, $data['inspection_date'], $data['machine_id'], $id)) {
    jsonResponse(['success' => false, 'message' => '該機台在此日期已有其他檢驗紀錄'], 409);
}

try {
    $sql = <<<SQL
UPDATE daily_machine_inspections SET
    inspection_date = :inspection_date,
    machine_id = :machine_id,
    inspector_id = :inspector_id,
    is_qualified = :is_qualified,
    notes = :notes
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'              => $id,
        ':inspection_date' => $data['inspection_date'],
        ':machine_id'      => $data['machine_id'],
        ':inspector_id'    => $data['inspector_id'],
        ':is_qualified'    => $data['is_qualified'] ? 1 : 0,
        ':notes'           => $data['notes'] ?: null,
    ]);

    $record = findDailyInspection($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '每日機台檢驗更新成功',
        'data'    => $record ? transformDailyInspection($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Daily machine inspection update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
