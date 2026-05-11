<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

jsonResponse([
    'success' => false,
    'message' => '個人資料不支援刪除，請聯絡系統管理員。',
], 405);
