<?php
/**
 * 大螢幕狀態看板 API - 刪除端點（未開放）
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod(['POST', 'DELETE']);
requireCsrfForWrite();

jsonResponse([
    'success' => false,
    'message' => '狀態看板不提供刪除操作。',
], 405);
