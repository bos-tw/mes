<?php
/**
 * @deprecated 請使用標準端點 PUT /api/security_settings/
 * @see index.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('PUT');

$_SERVER['REQUEST_METHOD'] = 'POST';
require __DIR__ . '/index.php';
