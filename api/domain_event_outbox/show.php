<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
requireAuth();
jsonResponse(['success' => false, 'message' => 'Domain Event Outbox 管理模組已下架。'], 410);
