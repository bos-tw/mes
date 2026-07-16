<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
requireAuth();
jsonResponse(['success' => false, 'message' => 'Domain Event Outbox 不允許人工刪除，管理模組已下架。'], 410);
