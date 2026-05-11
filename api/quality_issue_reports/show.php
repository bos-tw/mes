<?php
declare(strict_types=1);
/**
 * quality_issue_reports API — 單筆查詢
 *
 * GET /api/quality_issue_reports/show.php?id={id}
 *
 * @file   api/quality_issue_reports/show.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

requireMethod('GET');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

try {
    $pdo = db();
} catch (Exception $e) {
    error_log('quality_issue_reports/show: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

$record = findQualityIssueReport($pdo, $id);
if (!$record) {
    jsonResponse(['success' => false, 'message' => '找不到指定的品質異常報告'], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformQualityIssueReport($record),
]);
