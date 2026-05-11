<?php
/**
 * @deprecated 請使用標準端點 POST /api/roles/
 * @see index.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
requireAuth();

require __DIR__ . '/index.php';
