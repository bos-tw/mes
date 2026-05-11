<?php
declare(strict_types=1);
/**
 * machine_maintenance_tasks API — 刪除
 *
 * DELETE /api/machine_maintenance_tasks/delete.php?id={id}
 *
 * @file   api/machine_maintenance_tasks/delete.php
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
    error_log('machine_maintenance_tasks/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查任務是否存在
if (!maintenanceTaskExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的機台維修任務'], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM machine_maintenance_tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '機台維修任務刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Machine maintenance task delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
