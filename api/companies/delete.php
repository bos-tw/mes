<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

jsonResponse([
    'success' => false,
    'message' => 'companies 模組尚未實作刪除端點。',
], 501);
