<?php
/**
 * 流水號管理 API - 單筆查詢端點
 *
 * @endpoint GET /api/number_sequences/show.php?id={id}
 *
 * @auth 必須登入
 * @table number_sequences
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$sequence = findNumberSequence($id);
if ($sequence === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的流水號。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformNumberSequence($sequence),
]);
