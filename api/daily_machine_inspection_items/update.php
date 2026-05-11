<?php
declare(strict_types=1);
/**
 * daily_machine_inspection_items API — 更新
 *
 * PUT /api/daily_machine_inspection_items/update.php?id={id}
 *
 * @file   api/daily_machine_inspection_items/update.php
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
    error_log('daily_machine_inspection_items/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查項目是否存在
if (!inspectionItemExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的檢驗項目明細'], 404);
}

$data = readInspectionItemPayload();

$errors = validateInspectionItemData($data);
if ($errors) {
    jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
}

// 檢查所屬檢驗紀錄是否存在
if (!inspectionExistsForItem($pdo, $data['inspection_id'])) {
    jsonResponse(['success' => false, 'message' => '指定的每日檢驗紀錄不存在'], 400);
}

try {
    $sql = <<<SQL
UPDATE daily_machine_inspection_items SET
    inspection_id = :inspection_id,
    item_name = :item_name,
    standard = :standard,
    actual_result = :actual_result,
    is_pass = :is_pass,
    remarks = :remarks
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'            => $id,
        ':inspection_id' => $data['inspection_id'],
        ':item_name'     => $data['item_name'],
        ':standard'      => $data['standard'] ?: null,
        ':actual_result' => $data['actual_result'] ?: null,
        ':is_pass'       => $data['is_pass'] ? 1 : 0,
        ':remarks'       => $data['remarks'] ?: null,
    ]);

    $record = findInspectionItem($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '檢驗項目明細更新成功',
        'data'    => $record ? transformInspectionItem($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Daily machine inspection item update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
