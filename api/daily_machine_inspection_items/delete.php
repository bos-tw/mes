<?php
declare(strict_types=1);
/**
 * daily_machine_inspection_items API — 刪除
 *
 * DELETE /api/daily_machine_inspection_items/delete.php?id={id}
 *
 * @file   api/daily_machine_inspection_items/delete.php
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
    error_log('daily_machine_inspection_items/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查項目是否存在
if (!inspectionItemExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的檢驗項目明細'], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM daily_machine_inspection_items WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '檢驗項目明細刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Daily machine inspection item delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
