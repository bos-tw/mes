<?php
/**
 * 大螢幕狀態看板 API - 更新端點（未開放）
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('PUT');
requireCsrfForWrite();

jsonResponse([
    'success' => false,
    'message' => '狀態看板不提供更新操作。',
], 405);
