<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

requireMethod('GET');

$diagnostics = [
    'timestamp' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format(DATE_ATOM),
    'session' => [
        'status' => 'inactive',
        'id' => null,
        'save_path_writable' => null,
    ],
    'database' => [
        'status' => 'unknown',
        'server_version' => null,
    ],
];

try {
    ensureSession();
    $diagnostics['session']['status'] = session_status() === PHP_SESSION_ACTIVE ? 'active' : 'inactive';
    $diagnostics['session']['id'] = session_id() ?: null;

    $savePath = session_save_path();
    if ($savePath === '' && ($tmpDir = sys_get_temp_dir())) {
        $savePath = $tmpDir;
    }
    $diagnostics['session']['save_path_writable'] = $savePath ? is_writable($savePath) : null;
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => 'Session 初始化失敗。',
        'diagnostics' => $diagnostics,
        'error' => $exception->getMessage(),
    ], 500);
}

try {
    $pdo = db();
    $statement = $pdo->query('SELECT 1');
    $statement->fetch();
    $diagnostics['database']['status'] = 'connected';
    $diagnostics['database']['server_version'] = $pdo->query('SELECT VERSION()')->fetchColumn();
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => '資料庫連線測試失敗。',
        'diagnostics' => $diagnostics,
        'error' => $exception->getMessage(),
    ], 500);
}

jsonResponse([
    'success' => true,
    'message' => '系統運行正常。',
    'diagnostics' => $diagnostics,
]);
