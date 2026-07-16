<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
requireAuth();

jsonResponse([
    'success' => false,
    'message' => 'Domain Event Outbox 未具備正式 producer/consumer，P1 已下架此管理模組。',
], 410);
