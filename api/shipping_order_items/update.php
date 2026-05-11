<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('PUT');

jsonResponse([
    'success' => false,
    'message' => 'shipping_order_items 模組尚未提供獨立更新端點。',
], 501);
