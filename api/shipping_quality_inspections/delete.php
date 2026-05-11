<?php
declare(strict_types=1);
/**
 * shipping_quality_inspections API — 刪除
 *
 * DELETE /api/shipping_quality_inspections/delete.php?id={id}
 *
 * @file   api/shipping_quality_inspections/delete.php
 */

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

try {
    $pdo = db();
} catch (Exception $e) {
    error_log('shipping_quality_inspections/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查檢驗紀錄是否存在
if (!shippingQualityInspectionExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的出貨品質檢驗'], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM shipping_quality_inspections WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '出貨品質檢驗刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Shipping quality inspection delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
