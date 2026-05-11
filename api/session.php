<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

requireMethod('GET');
ensureSession();

if (!isset($_SESSION['employee'])) {
    jsonResponse([
        'success' => false,
        'message' => '尚未登入或登入已過期。',
    ], 401);
}

jsonResponse([
    'success' => true,
    'data' => $_SESSION['employee'],
    'csrf_token' => generateCsrfToken(),
]);
