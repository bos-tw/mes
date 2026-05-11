<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

requireMethod('POST');
ensureSession($_SESSION['remember_me'] ?? false);

if (session_status() === PHP_SESSION_ACTIVE) {
    // ── 記錄登出審計日誌（在 session 銷毀前） ──
    $employeeId = $_SESSION['employee']['id'] ?? null;
    $employeeAccount = $_SESSION['employee']['account'] ?? null;
    if ($employeeId !== null) {
        logAuditAction('登出系統', 'employees', (int)$employeeId, [
            'account' => $employeeAccount,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    }

    // ── 併發 Session 控制：清除資料庫中的 session_token ──
    if ($employeeId !== null) {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('UPDATE employees SET session_token = NULL WHERE id = :id');
            $stmt->execute(['id' => $employeeId]);
        } catch (Throwable $e) {
            error_log('[Logout] 清除 session_token 失敗: ' . $e->getMessage());
        }
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

jsonResponse([
    'success' => true,
    'message' => '已成功登出。',
]);
