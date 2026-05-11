<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('PUT');

jsonResponse([
    'success' => false,
    'message' => 'employee_roles 使用複合主鍵，請改用新增/刪除端點調整。',
], 405);
