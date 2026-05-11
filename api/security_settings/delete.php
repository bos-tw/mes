<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

jsonResponse([
    'success' => false,
    'message' => 'security_settings 模組不支援刪除設定。',
], 405);
