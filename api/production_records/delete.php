<?php
declare(strict_types=1);
/**
 * production_records API — 刪除
 *
 * DELETE /api/production_records/delete.php?id={id}
 *
 * @file   api/production_records/delete.php
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
    error_log('production_records/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查生產紀錄是否存在
if (!productionRecordExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的生產紀錄'], 404);
}

// 檢查是否被品質紀錄引用
if (productionRecordHasQualityRecords($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '此生產紀錄已有關聯的品質紀錄，無法刪除'], 400);
}

try {
    $stmt = $pdo->prepare('DELETE FROM production_records WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '生產紀錄刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Production record delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
