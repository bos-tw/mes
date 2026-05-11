<?php
/**
 * 權限管理 API - 單筆查詢端點
 *
 * @endpoint GET /api/permissions/show.php?id={id}
 *
 * @auth 必須登入
 * @table permissions
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的權限 ID。',
    ], 400);
}

$pdo = db();
$permission = findPermission($pdo, (int)$id);

if (!$permission) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的權限資料。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformPermission($permission),
]);
