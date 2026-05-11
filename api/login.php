<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

requireMethod('POST');

$payload = getJsonInput();
if (empty($payload)) {
    $payload = $_POST;
}

$account = trim((string)($payload['account'] ?? ''));
$password = (string)($payload['password'] ?? '');
$rememberMe = filter_var($payload['rememberMe'] ?? false, FILTER_VALIDATE_BOOL);

if ($account === '' || $password === '') {
    jsonResponse([
        'success' => false,
        'message' => '請輸入帳號與密碼。',
    ], 422);
}

// ── 速率限制：檢查是否因失敗次數過多而被鎖定 ──
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateLimit = checkLoginRateLimit($clientIp);
if ($rateLimit['blocked']) {
    jsonResponse([
        'success' => false,
        'message' => sprintf('登入失敗次數過多，請在 %d 分鐘後重試。', max(1, (int)ceil($rateLimit['retry_after'] / 60))),
    ], 429);
}

$pdo = db();

$query = $pdo->prepare(
    'SELECT
        e.id, e.account, e.name, e.department_id, e.job_title, e.email,
        e.password_hash, e.status, e.last_login_at,
        lv.value_key AS status_value_key
     FROM employees e
     LEFT JOIN lookup_values lv ON lv.id = e.status_lookup_id
     LEFT JOIN lookup_domains ld ON ld.id = lv.domain_id AND ld.domain_key = \'EMPLOYEE_STATUS\'
     WHERE e.account = :account AND e.deleted_at IS NULL
     LIMIT 1'
);
$query->execute(['account' => $account]);
$employee = $query->fetch();

if (!$employee) {
    recordLoginAttempt($clientIp, $account, false);
    jsonResponse([
        'success' => false,
        'message' => '查無此帳號，請確認輸入是否正確。',
    ], 401);
}

$legacyStatus = (string)($employee['status'] ?? '');
$lookupStatusKey = (string)($employee['status_value_key'] ?? '');
$isActiveEmployee = ($legacyStatus === 'active') || ($lookupStatusKey === 'active');

if (!$isActiveEmployee) {
    jsonResponse([
        'success' => false,
        'message' => '此帳號已停用或離職，請洽系統管理員。',
    ], 403);
}

$hash = (string)$employee['password_hash'];
if ($hash === '' || !password_verify($password, $hash)) {
    recordLoginAttempt($clientIp, $account, false);
    jsonResponse([
        'success' => false,
        'message' => '密碼錯誤，請重新輸入。',
    ], 401);
}

ensureSession($rememberMe);
session_regenerate_id(true);

$now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Y-m-d H:i:s');

// 取得使用者的角色
$rolesQuery = $pdo->prepare('
    SELECT r.id, r.name, r.description
    FROM employee_roles er
    JOIN roles r ON er.role_id = r.id
    WHERE er.employee_id = :employee_id
');
$rolesQuery->execute(['employee_id' => $employee['id']]);
$roles = $rolesQuery->fetchAll(PDO::FETCH_ASSOC);

// 取得使用者的權限（透過角色）
$permissionsQuery = $pdo->prepare('
    SELECT DISTINCT p.id, p.name, p.description
    FROM employee_roles er
    JOIN role_permissions rp ON er.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE er.employee_id = :employee_id
');
$permissionsQuery->execute(['employee_id' => $employee['id']]);
$permissions = $permissionsQuery->fetchAll(PDO::FETCH_ASSOC);

// 建立權限名稱陣列（方便前端檢查）
$permissionNames = array_column($permissions, 'name');

$sessionData = [
    'id' => (int)$employee['id'],
    'account' => $employee['account'],
    'name' => $employee['name'],
    'department_id' => $employee['department_id'],
    'jobTitle' => $employee['job_title'],
    'email' => $employee['email'],
    'status' => $employee['status'],
    'lastLoginAt' => $now,
    'roles' => $roles,
    'permissions' => $permissionNames,
];

$_SESSION['employee'] = $sessionData;
$_SESSION['remember_me'] = $rememberMe;

// ── 併發 Session 控制：產生唯一 token，寫入 DB 與 Session ──
$sessionToken = bin2hex(random_bytes(32));
$_SESSION['session_token'] = $sessionToken;

// 記錄成功登入 & 清除失敗記錄 & 寫入 session token
recordLoginAttempt($clientIp, $account, true);

// 記錄登入審計日誌
logAuditAction('登入系統', 'employees', (int)$employee['id'], [
    'account' => $account,
    'ip' => $clientIp,
]);

// 產生 CSRF Token 供前端後續請求使用
$csrfToken = generateCsrfToken();

$updateLastLogin = $pdo->prepare('UPDATE employees SET last_login_at = :now, session_token = :token WHERE id = :id');
$updateLastLogin->execute([
    'now' => $now,
    'id' => $employee['id'],
    'token' => $sessionToken,
]);

jsonResponse([
    'success' => true,
    'message' => '登入成功。',
    'data' => $sessionData,
    'csrf_token' => $csrfToken,
]);
