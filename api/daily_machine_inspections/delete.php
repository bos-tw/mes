<?php
declare(strict_types=1);
/**
 * daily_machine_inspections API — 刪除
 *
 * DELETE /api/daily_machine_inspections/delete.php?id={id}
 *
 * @file   api/daily_machine_inspections/delete.php
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
    error_log('daily_machine_inspections/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查檢驗紀錄是否存在
if (!dailyInspectionExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的每日機台檢驗'], 404);
}

// 檢查是否有關聯的檢驗項目
$stmt = $pdo->prepare('SELECT COUNT(*) FROM daily_machine_inspection_items WHERE inspection_id = :id');
$stmt->execute([':id' => $id]);
$itemCount = (int)$stmt->fetchColumn();

if ($itemCount > 0) {
    jsonResponse(['success' => false, 'message' => "此檢驗紀錄下有 {$itemCount} 筆檢驗項目，請先刪除關聯項目"], 409);
}

try {
    $stmt = $pdo->prepare('DELETE FROM daily_machine_inspections WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '每日機台檢驗刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Daily machine inspection delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
