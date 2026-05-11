<?php
declare(strict_types=1);
/**
 * daily_machine_inspection_items API — 單筆查詢
 *
 * GET /api/daily_machine_inspection_items/show.php?id={id}
 *
 * @file   api/daily_machine_inspection_items/show.php
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
    error_log('daily_machine_inspection_items/show: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
}

$record = findInspectionItem($pdo, $id);
if (!$record) {
    jsonResponse(['success' => false, 'message' => '找不到指定的檢驗項目明細'], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformInspectionItem($record),
]);
