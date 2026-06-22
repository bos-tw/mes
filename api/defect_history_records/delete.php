<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();
requireMethod(['DELETE']);

jsonResponse([
    'success' => false,
    'message' => '不良品歷史紀錄為唯讀查詢模組，不支援刪除。'
], 405);
