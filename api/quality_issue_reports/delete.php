<?php
declare(strict_types=1);
/**
 * quality_issue_reports API — 刪除
 *
 * DELETE /api/quality_issue_reports/delete.php?id={id}
 *
 * @file   api/quality_issue_reports/delete.php
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
    error_log('quality_issue_reports/delete: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

// 檢查報告是否存在
if (!qualityIssueReportExists($pdo, $id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的品質異常報告'], 404);
}

try {
    $stmt = $pdo->prepare('DELETE FROM quality_issue_reports WHERE id = :id');
    $stmt->execute([':id' => $id]);

    jsonResponse([
        'success' => true,
        'message' => '品質異常報告刪除成功',
        'data'    => ['id' => $id],
    ]);
} catch (PDOException $e) {
    error_log('Quality issue report delete failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
