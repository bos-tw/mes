<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

jsonResponse([
    'success' => false,
    'message' => 'shipping_order_items 模組尚未提供獨立刪除端點。',
], 501);
