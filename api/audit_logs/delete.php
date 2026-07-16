<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';
requireAuth();
jsonResponse([
    'success' => false,
    'message' => '稽核紀錄為不可變證據，不允許透過 API 刪除。',
], 405);
