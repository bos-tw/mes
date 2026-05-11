<?php
declare(strict_types=1);

// Suppress HTML error output for API endpoints
ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);

require_once __DIR__ . '/config.php';

/**
 * 從 system_parameters 資料表取得設定值。
 * 使用靜態快取避免同一請求中重複查詢。
 *
 * @param string $key     參數鍵值
 * @param string $default 找不到時的預設值
 * @return string
 */
function getSystemParam(string $key, string $default = ''): string
{
    static $cache = [];
    if (array_key_exists($key, $cache)) {
        return $cache[$key];
    }
    try {
        $pdo = db();
        $stmt = $pdo->prepare(
            'SELECT param_value FROM system_parameters WHERE param_key = :k LIMIT 1'
        );
        $stmt->execute([':k' => $key]);
        $row = $stmt->fetch();
        $cache[$key] = $row ? (string) $row['param_value'] : $default;
    } catch (Exception $e) {
        $cache[$key] = $default;
    }
    return $cache[$key];
}

// ──────────────────────────────────────────────

/**
 * Ensure the PHP session is initialised with consistent cookie parameters.
 */
function ensureSession(bool $rememberMe = false): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $lifetime = $rememberMe ? SESSION_REMEMBER_ME_LIFETIME : SESSION_LIFETIME;
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'domain' => '',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    // ── 閒置逾時檢查 ──
    // rememberMe 進行永久登入時不自動登出；否則讀取 security.auto_logout 設定
    if ($rememberMe) {
        $idleTimeout = SESSION_REMEMBER_ME_LIFETIME;
    } else {
        $autoLogoutEnabled = getSystemParam('security.auto_logout.enabled', '1');
        if ($autoLogoutEnabled === '1') {
            $idleMinutes = (int) getSystemParam('security.auto_logout.idle_minutes', (string) (SESSION_IDLE_TIMEOUT / 60));
            $idleTimeout = max(60, $idleMinutes * 60);
        } else {
            // 關閉自動登出時，設成非常大的就等同於從不逾時
            $idleTimeout = PHP_INT_MAX;
        }
    }

    if (isset($_SESSION['last_activity'])) {
        $elapsed = time() - $_SESSION['last_activity'];
        if ($elapsed > $idleTimeout) {
            // 閒置過久，銷毀 Session
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
            }
            session_destroy();
            return;
        }
    }
    // 更新最後活動時間
    $_SESSION['last_activity'] = time();
}

// ──────────────────────────────────────────────
// CSRF Protection
// ──────────────────────────────────────────────

/**
 * 產生或取得當前 Session 的 CSRF Token。
 *
 * @return string 32 字元的 hex token
 */
function generateCsrfToken(): string
{
    ensureSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * 驗證請求中的 CSRF Token（針對 POST / PUT / DELETE / PATCH 等狀態變更操作）。
 *
 * Token 來源（依序檢查）：
 * 1. HTTP 標頭 X-CSRF-Token
 * 2. JSON body 中的 _csrf_token 欄位
 * 3. POST 表單中的 _csrf_token 欄位
 *
 * @param bool $exitOnFailure 驗證失敗時是否自動回傳 403 並終止
 * @return bool
 */
function validateCsrfToken(bool $exitOnFailure = true): bool
{
    ensureSession();

    $sessionToken = $_SESSION['csrf_token'] ?? '';
    if ($sessionToken === '') {
        if ($exitOnFailure) {
            jsonResponse(['success' => false, 'message' => 'CSRF token 遺失，請重新整理頁面。'], 403);
        }
        return false;
    }

    // 依序從 header / JSON / POST 取得 token
    $requestToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if ($requestToken === '') {
        $json = getJsonInput();
        $requestToken = (string)($json['_csrf_token'] ?? '');
    }

    if ($requestToken === '') {
        $requestToken = (string)($_POST['_csrf_token'] ?? '');
    }

    if (!hash_equals($sessionToken, $requestToken)) {
        if ($exitOnFailure) {
            jsonResponse(['success' => false, 'message' => 'CSRF token 驗證失敗，請重新整理頁面。'], 403);
        }
        return false;
    }

    return true;
}

/**
 * 在 requireAuth() 之後呼叫，對狀態變更請求 (POST/PUT/DELETE/PATCH) 進行 CSRF 驗證。
 * GET / HEAD / OPTIONS 等安全方法不驗證。
 */
function requireCsrfForWrite(): void
{
    $method = getRequestMethod();
    $safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (in_array($method, $safeMethods, true)) {
        return;
    }
    validateCsrfToken();
}

// ──────────────────────────────────────────────
// Login Rate Limiting
// ──────────────────────────────────────────────

/**
 * 檢查指定 IP 的登入是否被限速（失敗次數過多）。
 *
 * @param string $ip 來源 IP
 * @param int $maxAttempts 限速閥値（-1 = 自動讀取設定）
 * @param int $windowSeconds 時間窗口秒數（-1 = 自動讀取設定）
 * @return array{blocked: bool, remaining: int, retry_after: int}
 */
function checkLoginRateLimit(string $ip, int $maxAttempts = -1, int $windowSeconds = -1): array
{
    // 檢查鎖定功能是否啟用
    if (getSystemParam('security.lockout.enabled', '1') === '0') {
        return ['blocked' => false, 'remaining' => 99, 'retry_after' => 0];
    }

    // 從 DB 讀取可配置預設値
    if ($maxAttempts === -1) {
        $maxAttempts = (int) getSystemParam('security.lockout.max_attempts', '5');
    }
    if ($windowSeconds === -1) {
        $windowSeconds = (int) getSystemParam('security.lockout.window_minutes', '15') * 60;
    }
    $pdo = db();

    // 清除過期記錄
    $cleanup = $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL :window SECOND)');
    $cleanup->bindValue(':window', $windowSeconds, PDO::PARAM_INT);
    $cleanup->execute();

    // 計算窗口內失敗次數
    $stmt = $pdo->prepare('SELECT COUNT(*) AS cnt, MAX(attempted_at) AS last_attempt FROM login_attempts WHERE ip_address = :ip AND success = 0 AND attempted_at >= DATE_SUB(NOW(), INTERVAL :window SECOND)');
    $stmt->bindValue(':ip', $ip);
    $stmt->bindValue(':window', $windowSeconds, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch();

    $failCount = (int)($row['cnt'] ?? 0);
    $blocked = $failCount >= $maxAttempts;
    $retryAfter = 0;

    if ($blocked && $row['last_attempt']) {
        $lastAttempt = strtotime($row['last_attempt']);
        $retryAfter = max(0, ($lastAttempt + $windowSeconds) - time());
    }

    return [
        'blocked' => $blocked,
        'remaining' => max(0, $maxAttempts - $failCount),
        'retry_after' => $retryAfter,
    ];
}

/**
 * 記錄一次登入嘗試。
 *
 * @param string $ip 來源 IP
 * @param string $account 嘗試的帳號
 * @param bool $success 是否成功
 */
function recordLoginAttempt(string $ip, string $account, bool $success): void
{
    try {
        $pdo = db();
        $stmt = $pdo->prepare('INSERT INTO login_attempts (ip_address, account, success, attempted_at) VALUES (:ip, :account, :success, NOW())');
        $stmt->execute([
            ':ip' => $ip,
            ':account' => $account,
            ':success' => $success ? 1 : 0,
        ]);

        // 登入成功後清除該 IP 的失敗記錄
        if ($success) {
            $del = $pdo->prepare('DELETE FROM login_attempts WHERE ip_address = :ip AND success = 0');
            $del->execute([':ip' => $ip]);
        }
    } catch (Exception $e) {
        error_log('Failed to record login attempt: ' . $e->getMessage());
    }
}

// ──────────────────────────────────────────────
// Safe Error Messaging
// ──────────────────────────────────────────────

/**
 * 從 MySQL Duplicate entry 錯誤訊息中解析出具體重複的欄位名稱。
 * 例如: "Duplicate entry 'EMP004' for key 'uk_employee_number_active'"
 * 會回傳 "員工編號"
 *
 * @param string $errorMessage MySQL 錯誤訊息
 * @return string|null 人類可讀的欄位名稱，無法辨識時回傳 null
 */
function parseDuplicateField(string $errorMessage): ?string
{
    // 常見唯一欄位 → 中文名稱對照
    $fieldLabels = [
        'customer_number'       => '客戶編號',
        'supplier_number'       => '供應商編號',
        'employee_number'       => '員工編號',
        'order_number'          => '訂單編號',
        'work_order_number'     => '工單編號',
        'shipping_order_number' => '出貨單編號',
        'return_order_number'   => '退貨單編號',
        'inventory_number'      => '庫存編號',
        'tool_number'           => '載具編號',
        'machine_number'        => '機台編號',
        'item_number'           => '受篩產品編號',
        'service_number'        => '篩分服務編號',
        'email'                 => '電子郵件',
        'account'               => '帳號',
        'department_name'       => '部門名稱',
        'param_key'             => '參數鍵值',
        'domain_key'            => '領域鍵值',
        'report_code'           => '報表代碼',
        'seq_key'               => '序列鍵',
    ];

    // 嘗試從 "for key 'xxx'" 中提取索引名稱
    if (preg_match("/for key '([^']+)'/i", $errorMessage, $matches)) {
        $keyName = $matches[1];
        foreach ($fieldLabels as $field => $label) {
            if (stripos($keyName, $field) !== false) {
                return $label;
            }
        }
    }

    // 嘗試從錯誤訊息中直接匹配欄位名
    foreach ($fieldLabels as $field => $label) {
        if (stripos($errorMessage, $field) !== false) {
            return $label;
        }
    }

    // 部門名稱特殊處理（索引名稱是 'name'）
    if (preg_match("/for key '(uk_department_name|name)'/i", $errorMessage)) {
        return '部門名稱';
    }

    return null;
}

/**
 * 將例外訊息過濾為安全的使用者友善訊息。
 * 移除可能包含 SQL 結構、表名、欄位名的技術細節。
 *
 * @param Exception $e 原始例外
 * @param string $fallback 預設回傳訊息
 * @return string 安全的錯誤訊息
 */
function safeErrorMessage(Exception $e, string $fallback = '操作發生錯誤，請稍後重試或聯繫管理員。'): string
{
    $msg = $e->getMessage();

    // PDO / SQL 相關例外 → 一律隱藏細節
    if ($e instanceof PDOException
        || preg_match('/SQLSTATE|duplicate entry|foreign key|constraint|column|table|syntax/i', $msg)
    ) {
        // 保留有用的業務提示
        if (stripos($msg, 'Duplicate entry') !== false) {
            // 解析具體重複欄位
            $fieldHint = parseDuplicateField($msg);
            if ($fieldHint) {
                return "{$fieldHint}已存在，而且此編號仍在使用中，請使用其他編號。";
            }
            return '資料已存在（重複），請確認後重試。';
        }
        if (stripos($msg, 'foreign key constraint') !== false) {
            return '此資料仍被其他紀錄引用，無法執行此操作。';
        }
        return $fallback;
    }

    // RuntimeException / 自訂例外通常包含業務訊息，直接使用
    if ($e instanceof RuntimeException || $e instanceof InvalidArgumentException) {
        return $msg;
    }

    return $fallback;
}

// ──────────────────────────────────────────────
// HTTP Security Headers
// ──────────────────────────────────────────────

/**
 * 設定 API 回應的安全性 HTTP 標頭。
 * 在 jsonResponse() 中自動呼叫。
 */
function setSecurityHeaders(): void
{
    static $sent = false;
    if ($sent) {
        return;
    }
    $sent = true;

    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-XSS-Protection: 0');                      // 現代瀏覽器建議關閉，改用 CSP
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    // Content-Security-Policy：限制資源載入來源
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'");
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

/**
 * Retrieve a shared PDO instance.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = getDatabaseConfig();
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $config['host'], $config['port'], $config['dbname'], $config['charset']);

    try {
        $pdo = new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        error_log('Database connection failed: ' . $exception->getMessage());
        http_response_code(500);
        header('Content-Type: application/json');
        setSecurityHeaders();
        echo json_encode([
            'success' => false,
            'message' => '無法連線至資料庫，請確認設定或聯繫管理員。',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $pdo;
}

/**
 * Helper to send JSON responses consistently.
 */
function jsonResponse(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    setSecurityHeaders();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

/**
 * 取得真實的 HTTP 請求方法（支援 _method 覆蓋）
 *
 * 支援場景：
 * 1. 標準 DELETE/PUT/PATCH 請求
 * 2. POST + JSON body 中的 _method
 * 3. POST + form data 中的 _method
 * 4. POST + query string 中的 _method
 *
 * @return string 大寫的 HTTP 方法名稱
 */
function getRequestMethod(): string
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // 只有 POST 請求才檢查 _method 覆蓋
    if ($method !== 'POST') {
        return $method;
    }

    // 優先檢查 JSON input（已有快取機制）
    $jsonInput = getJsonInput();
    if (!empty($jsonInput['_method'])) {
        return strtoupper($jsonInput['_method']);
    }

    // 其次檢查 $_POST（form data）
    if (!empty($_POST['_method'])) {
        return strtoupper($_POST['_method']);
    }

    // 最後檢查 query string
    if (!empty($_GET['_method'])) {
        return strtoupper($_GET['_method']);
    }

    return $method;
}

/**
 * 強制要求特定的 HTTP 方法（增強版，支援 _method 覆蓋）
 *
 * @param string|array $allowedMethods 允許的方法（單一或多個）
 * @param string|null $customMessage 自訂錯誤訊息
 * @return string 實際的請求方法
 */
function requireMethod(string|array $allowedMethods, ?string $customMessage = null): string
{
    $method = getRequestMethod();
    $allowed = is_array($allowedMethods) ? $allowedMethods : [$allowedMethods];
    $allowed = array_map('strtoupper', $allowed);

    if (in_array($method, $allowed, true)) {
        return $method;
    }

    http_response_code(405);
    header('Allow: ' . implode(', ', $allowed));

    $message = $customMessage
        ?? sprintf('不支援的請求方法 %s，請使用 %s。', $method, implode(' 或 ', $allowed));

    jsonResponse([
        'success' => false,
        'message' => $message,
    ], 405);

    // 理論上不會執行到這裡，但為了 IDE 靜態分析
    return $method;
}

/**
 * Retrieve parsed JSON input.
 */
function getJsonInput(): array
{
    static $cachedInput;
    static $hasRead = false;

    if ($hasRead) {
        return $cachedInput ?? [];
    }

    $hasRead = true;

    $body = file_get_contents('php://input');
    if ($body === false) {
        $cachedInput = [];
        return $cachedInput;
    }

    $trimmed = trim($body);
    if ($trimmed === '') {
        $cachedInput = [];
        return $cachedInput;
    }

    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
    $isJsonContentType = $contentType !== ''
        && (str_contains($contentType, 'application/json') || str_contains($contentType, '+json'));
    $looksLikeJson = $trimmed !== '' && ($trimmed[0] === '{' || $trimmed[0] === '[');

    if (!$isJsonContentType && !$looksLikeJson) {
        $cachedInput = [];
        return $cachedInput;
    }

    try {
        $data = json_decode($body, true, flags: JSON_THROW_ON_ERROR);
        $cachedInput = is_array($data) ? $data : [];
        return $cachedInput;
    } catch (JsonException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '請求內容需為有效的 JSON。',
        ], 400);
    }

    $cachedInput = [];
    return $cachedInput;
}

/**
 * 通用請求資料讀取 — 優先 JSON，後備 $_POST（form-data）。
 *
 * 各模組的 readXxxPayload() 可直接委派給此函數。
 *
 * @return array<string,mixed>
 */
function readRequestPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }
    return is_array($payload) ? $payload : [];
}

/**
 * Sanitize output strings.
 */
function escapeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * 讀取系統更新維護模式狀態。
 *
 * @return array{enabled: bool, reason: string, enabled_by: string, enabled_at: string, source: string, job_id: int}
 */
function readSystemUpdateMaintenanceState(): array
{
    $default = [
        'enabled' => false,
        'reason' => '',
        'enabled_by' => '',
        'enabled_at' => '',
        'source' => '',
        'job_id' => 0,
    ];

    $filePath = dirname(__DIR__) . '/uploads/system_updates/maintenance_state.json';
    if (!is_file($filePath)) {
        return $default;
    }

    $raw = file_get_contents($filePath);
    if (!is_string($raw) || trim($raw) === '') {
        return $default;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $default;
    }

    return [
        'enabled' => (bool)($decoded['enabled'] ?? false),
        'reason' => trim((string)($decoded['reason'] ?? '')),
        'enabled_by' => trim((string)($decoded['enabled_by'] ?? '')),
        'enabled_at' => trim((string)($decoded['enabled_at'] ?? '')),
        'source' => trim((string)($decoded['source'] ?? '')),
        'job_id' => max(0, (int)($decoded['job_id'] ?? 0)),
    ];
}

/**
 * 維護模式攔截（僅允許更新中心與登入/登出等必要 API）。
 */
function enforceMaintenanceMode(): void
{
    $state = readSystemUpdateMaintenanceState();
    if (!(bool)$state['enabled']) {
        return;
    }

    $scriptName = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $baseName = basename($scriptName);

    $allowBasenames = [
        'login.php',
        'logout.php',
        'session.php',
        'healthcheck.php',
        'diagnose.php',
        'system_update_upload.php',
        'system_update_apply.php',
        'system_update_status.php',
        'system_update_init_check.php',
        'system_update_history.php',
        'system_update_maintenance.php',
        'system_update_backup.php',
        'system_update_rollback.php',
    ];

    if (in_array($baseName, $allowBasenames, true)) {
        return;
    }

    jsonResponse([
        'success' => false,
        'message' => '系統維護中，暫停提供服務。',
        'data' => [
            'maintenance' => $state,
        ],
    ], 503);
}

/**
 * Ensure the current request has an authenticated employee session.
 * 自動依據 URL 路徑與 HTTP 方法執行模組級權限檢查。
 *
 * @return array<string,mixed>
 */
function requireAuth(): array
{
    ensureSession();

    if (!isset($_SESSION['employee']) || !is_array($_SESSION['employee'])) {
        jsonResponse([
            'success' => false,
            'message' => '尚未登入或登入已過期。',
        ], 401);
    }

    // ── CSRF 防護：寫入操作自動驗證 Token ──
    requireCsrfForWrite();

    // ── 併發 Session 控制：驗證 session token 是否仍有效 ──
    validateSessionToken($_SESSION['employee']);

    // ── 模組權限檢查：驗證登入員工是否有存取目前 API 的權限 ──
    autoEnforcePermission($_SESSION['employee']);

    // ── 維護模式攔截：非更新中心 API 暫停服務 ──
    enforceMaintenanceMode();

    return $_SESSION['employee'];
}

/**
 * 併發 Session 控制：驗證當前 session 的 token 是否仍與資料庫一致。
 *
 * 若使用者在另一裝置登入，資料庫中的 session_token 會被覆寫，
 * 導致舊 session 的 token 不匹配，該舊 session 即被強制登出。
 *
 * @param array $employee 已登入的使用者資料
 */
function validateSessionToken(array $employee): void
{
    $sessionToken = $_SESSION['session_token'] ?? null;
    if ($sessionToken === null) {
        // 舊 session 沒有 token（相容升級前已登入的使用者）
        return;
    }

    try {
        $pdo = db();
        $stmt = $pdo->prepare(
            'SELECT session_token FROM employees WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute(['id' => $employee['id']]);
        $dbToken = $stmt->fetchColumn();

        if ($dbToken !== false && $dbToken !== $sessionToken) {
            // Token 不匹配 → 帳號已在其他裝置登入
            session_destroy();
            jsonResponse([
                'success' => false,
                'message' => '此帳號已在其他裝置登入，目前連線已中斷。',
            ], 401);
        }
    } catch (Throwable $e) {
        // 資料庫查詢失敗時不阻斷正常操作（降級處理）
        error_log('[SessionToken] 驗證失敗: ' . $e->getMessage());
    }
}

/**
 * 依據請求 URL 與 HTTP 方法自動檢查模組權限。
 *
 * 規則：
 * - 僅對寫入操作（POST/PUT/PATCH/DELETE）執行檢查
 * - 若使用者尚未被賦予任何權限（permissions 為空），則跳過檢查（向後相容）
 * - 權限命名慣例：{模組名稱}.{動作}（例如 departments.create）
 * - profile/dashboard/common 等通用端點不做模組權限檢查
 *
 * @param array $employee 已登入的使用者資料
 */
function autoEnforcePermission(array $employee): void
{
    // 從 URL 路徑取得模組名稱
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    if (!preg_match('#/api/([a-z_]+)/#', $scriptName, $matches)) {
        return;
    }
    $module = $matches[1];

    // 跳過通用 / 個人端點
    static $skipModules = [
        'common', 'docs', 'tools', 'profile', 'dashboard',
        'session', 'login', 'logout', 'healthcheck', 'diagnose',
    ];
    if (in_array($module, $skipModules, true)) {
        return;
    }

    // 僅對寫入操作檢查權限
    $method = getRequestMethod();
    $actionMap = [
        'POST'   => 'create',
        'PUT'    => 'edit',
        'PATCH'  => 'edit',
        'DELETE' => 'delete',
    ];
    if (!isset($actionMap[$method])) {
        return; // GET / HEAD / OPTIONS 不檢查
    }

    $action = $actionMap[$method];
    $permissionName = "{$module}.{$action}";

    // 若使用者尚未被賦予任何權限，跳過檢查（向後相容、初始部署）
    $permissions = $employee['permissions'] ?? [];
    if (empty($permissions)) {
        return;
    }

    // 檢查是否擁有所需權限
    // 支援新格式 (module.action) 與舊格式 (manage_*) 向後相容
    if (in_array($permissionName, $permissions, true)) {
        return; // 新格式權限匹配
    }

    // 舊格式相容：將模組名稱映射到舊的 manage_* 權限
    static $legacyPermissionMap = [
        'companies'                     => 'manage_companies',
        'customers'                     => 'manage_customers',
        'suppliers'                     => 'manage_suppliers',
        'employees'                     => 'manage_employees',
        'departments'                   => 'manage_departments',
        'screening_items'               => 'manage_screening_items',
        'screening_services'            => 'manage_screening_services',
        'orders'                        => 'manage_orders',
        'order_items'                   => 'manage_orders',
        'work_orders'                   => 'manage_work_orders',
        'work_order_first_piece_dimensions' => 'manage_work_orders',
        'work_order_images'             => 'manage_work_orders',
        'machines'                      => 'manage_machines',
        'machine_maintenance_tasks'     => 'manage_maintenance_tasks',
        'daily_machine_inspections'     => 'manage_daily_inspections',
        'daily_machine_inspection_items'=> 'manage_daily_inspections',
        'inventory_items'               => 'manage_inventory',
        'inventory_transactions'        => 'manage_inventory',
        'tools'                         => 'manage_tools',
        'shipping_orders'               => 'manage_shipping_orders',
        'shipping_order_items'          => 'manage_shipping_orders',
        'shipping_quality_inspections'  => 'manage_shipping_quality',
        'return_orders'                 => 'manage_return_orders',
        'return_order_items'            => 'manage_return_orders',
        'production_records'            => 'manage_production_records',
        'production_quality_records'    => 'manage_production_quality',
        'quality_issue_reports'         => 'manage_quality_issues',
        'roles'                         => 'manage_roles',
        'permissions'                   => 'manage_permissions',
        'role_permissions'              => 'manage_roles',
        'employee_roles'                => 'manage_roles',
        'lookup_domains'                => 'manage_system_parameters',
        'lookup_values'                 => 'manage_system_parameters',
        'number_sequences'              => 'manage_system_parameters',
        'system_parameters'             => 'manage_system_parameters',
        'report_descriptions'           => 'manage_system_parameters',
        'audit_logs'                    => 'view_audit_logs',
        'domain_event_outbox'           => 'manage_system_parameters',
        'security_settings'             => 'manage_system_parameters',
        'dashboard_calendar_events'     => 'manage_calendar_events',
        'calendar_event_participants'   => 'manage_calendar_events',
        'calendar_event_reminders'      => 'manage_calendar_events',
        'notifications'                 => 'manage_system_parameters',
        'messages'                      => 'manage_system_parameters',
    ];

    $legacyPermission = $legacyPermissionMap[$module] ?? null;
    if ($legacyPermission && in_array($legacyPermission, $permissions, true)) {
        return; // 舊格式權限匹配
    }

    jsonResponse([
        'success' => false,
        'message' => '您沒有執行此操作的權限。',
        'required_permission' => $permissionName,
    ], 403);
}

/**
 * Check if the current user has a specific permission.
 *
 * @param string $permissionName The permission name to check
 * @return bool
 */
function hasPermission(string $permissionName): bool
{
    $employee = $_SESSION['employee'] ?? null;
    if (!$employee || !isset($employee['permissions'])) {
        return false;
    }

    return in_array($permissionName, $employee['permissions'], true);
}

/**
 * Require a specific permission, return 403 if not authorized.
 *
 * @param string $permissionName The permission name required
 * @return void
 */
function requirePermission(string $permissionName): void
{
    if (!hasPermission($permissionName)) {
        jsonResponse([
            'success' => false,
            'message' => '您沒有執行此操作的權限。',
        ], 403);
    }
}

/**
 * Check if the current user has any of the specified permissions.
 *
 * @param array $permissionNames Array of permission names
 * @return bool
 */
function hasAnyPermission(array $permissionNames): bool
{
    foreach ($permissionNames as $name) {
        if (hasPermission($name)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if the current user has a specific role.
 *
 * @param string $roleName The role name to check
 * @return bool
 */
function hasRole(string $roleName): bool
{
    $employee = $_SESSION['employee'] ?? null;
    if (!$employee || !isset($employee['roles'])) {
        return false;
    }

    foreach ($employee['roles'] as $role) {
        if ($role['name'] === $roleName) {
            return true;
        }
    }
    return false;
}

/**
 * Log audit action to database.
 */
function logAuditAction(string $action, ?string $targetTable = null, ?int $targetId = null, ?array $details = null): void
{
    try {
        $pdo = db();
        $employee = $_SESSION['employee'] ?? null;
        $employeeId = $employee ? $employee['id'] : null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;

        $stmt = $pdo->prepare('
            INSERT INTO audit_logs (employee_id, action, target_table, target_id, details, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');

        $stmt->execute([
            $employeeId,
            $action,
            $targetTable,
            $targetId,
            $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
            $ipAddress,
        ]);
    } catch (Exception $e) {
        // Log audit failure but don't fail the main operation
        error_log('Failed to log audit action: ' . $e->getMessage());
    }
}

// ──────────────────────────────────────────────
// File Upload Security Helpers
// ──────────────────────────────────────────────

/**
 * 使用伺服器端 MIME 偵測取得上傳檔案的真實 MIME 類型。
 * 優先使用 finfo_file()，回退到 mime_content_type()。
 *
 * @param string $tmpPath 上傳暫存檔路徑
 * @return string MIME 類型（偵測失敗時回傳 'application/octet-stream'）
 */
function detectMimeType(string $tmpPath): string
{
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $result = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if ($result !== false) {
                return $result;
            }
        }
    }

    if (function_exists('mime_content_type')) {
        $result = mime_content_type($tmpPath);
        if ($result !== false) {
            return $result;
        }
    }

    return 'application/octet-stream';
}

/**
 * 驗證上傳檔案的副檔名是否在白名單內。
 *
 * @param string $fileName 原始檔名
 * @param array $allowedExtensions 允許的副檔名列表（小寫，不含點）
 * @return bool
 */
function isAllowedExtension(string $fileName, array $allowedExtensions): bool
{
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    return in_array($ext, $allowedExtensions, true);
}

/**
 * 清理上傳檔案名稱中的路徑遍歷字元。
 *
 * @param string $fileName 原始檔名
 * @return string 安全的檔名
 */
function sanitizeFileName(string $fileName): string
{
    // 移除路徑分隔符與特殊字元
    $fileName = basename($fileName);
    $fileName = preg_replace('/[^\w\.\-\x{4e00}-\x{9fff}]/u', '_', $fileName);
    return $fileName ?: 'unnamed';
}
