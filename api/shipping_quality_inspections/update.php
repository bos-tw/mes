<?php
declare(strict_types=1);
/**
 * shipping_quality_inspections API — 更新
 *
 * PUT /api/shipping_quality_inspections/update.php?id={id}
 *
 * @file   api/shipping_quality_inspections/update.php
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
    error_log('shipping_quality_inspections/update: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查檢驗紀錄是否存在
if (!shippingQualityInspectionExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的出貨品質檢驗'], 404);
}

$data = readShippingQualityInspectionPayload();

$errors = validateShippingQualityInspectionData($data);
if ($errors) {
    jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
}

// 檢查出貨單是否存在
if (!shippingOrderExistsForSqi($pdo, $data['shipping_order_id'])) {
    jsonResponse(['success' => false, 'message' => '指定的出貨單不存在'], 400);
}

// 檢查檢驗員是否存在
if (!employeeExistsForSqi($pdo, $data['inspector_id'])) {
    jsonResponse(['success' => false, 'message' => '指定的檢驗員不存在'], 400);
}

// 計算 PPM
$ppm = $data['sample_quantity_pcs'] > 0
    ? ($data['defective_quantity_pcs'] / $data['sample_quantity_pcs']) * 1000000
    : 0;

try {
    $sql = <<<SQL
UPDATE shipping_quality_inspections SET
    shipping_order_id = :shipping_order_id,
    inspection_datetime = :inspection_datetime,
    inspector_id = :inspector_id,
    sample_quantity_pcs = :sample_quantity_pcs,
    defective_quantity_pcs = :defective_quantity_pcs,
    rejection_rate_ppm = :rejection_rate_ppm,
    inspection_result = :inspection_result,
    notes = :notes
WHERE id = :id
SQL;
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id'                     => $id,
        ':shipping_order_id'      => $data['shipping_order_id'],
        ':inspection_datetime'    => $data['inspection_datetime'],
        ':inspector_id'           => $data['inspector_id'],
        ':sample_quantity_pcs'    => $data['sample_quantity_pcs'],
        ':defective_quantity_pcs' => $data['defective_quantity_pcs'],
        ':rejection_rate_ppm'     => $ppm,
        ':inspection_result'      => $data['inspection_result'],
        ':notes'                  => $data['notes'] ?: null,
    ]);

    $record = findShippingQualityInspection($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '出貨品質檢驗更新成功',
        'data'    => $record ? transformShippingQualityInspection($record) : null,
    ]);
} catch (PDOException $e) {
    error_log('Shipping quality inspection update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
