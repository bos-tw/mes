<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('PUT');

jsonResponse([
    'success' => false,
    'message' => 'inventory_transactions 模組尚未實作更新端點。',
], 501);
