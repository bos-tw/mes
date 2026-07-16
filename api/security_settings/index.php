<?php
/**
 * 安全設定 API
 *
 * @endpoint GET  /api/security_settings/  取得所有安全設定
 * @endpoint POST /api/security_settings/  批次更新安全設定
 *
 * @auth 必須登入
 * @table system_parameters（param_key 以 "security." 開頭）
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

/**
 * 安全設定綱要定義
 * type: 'bool' | 'int'
 * min/max 僅 int 型別使用
 */
const SEC_SCHEMA = [
    'security.auto_refresh.enabled'          => [
        'type' => 'bool', 'default' => '1',
        'label' => '版本更新偵測',
        'desc'  => '系統有新版本時顯示提示橫幅，建議使用者重新整理頁面',
    ],
    'security.auto_refresh.interval_minutes' => [
        'type' => 'int', 'default' => '5', 'min' => 1, 'max' => 1440,
        'label' => '版本檢查間隔（分鐘）',
        'desc'  => '每隔幾分鐘向伺服器查詢一次系統版本',
    ],
    'security.auto_logout.enabled'           => [
        'type' => 'bool', 'default' => '1',
        'label' => '閒置自動登出',
        'desc'  => '使用者長時間無操作時自動登出，保護帳號安全',
    ],
    'security.auto_logout.idle_minutes'      => [
        'type' => 'int', 'default' => '30', 'min' => 5, 'max' => 480,
        'label' => '閒置逾時（分鐘）',
        'desc'  => '超過此時間無操作則自動執行登出',
    ],
    'security.auto_logout.warning_seconds'   => [
        'type' => 'int', 'default' => '60', 'min' => 10, 'max' => 300,
        'label' => '登出前警告秒數',
        'desc'  => '自動登出前顯示倒數警告的秒數，使用者可點擊繼續以取消',
    ],
    'security.lockout.enabled'               => [
        'type' => 'bool', 'default' => '1',
        'label' => '登入失敗鎖定',
        'desc'  => '密碼錯誤次數過多時，暫時鎖定登入以防止暴力破解',
    ],
    'security.lockout.max_attempts'          => [
        'type' => 'int', 'default' => '5', 'min' => 1, 'max' => 20,
        'label' => '最大失敗次數',
        'desc'  => '在鎖定時間窗口內允許的最多密碼錯誤次數',
    ],
    'security.lockout.window_minutes'        => [
        'type' => 'int', 'default' => '15', 'min' => 1, 'max' => 1440,
        'label' => '鎖定時間窗口（分鐘）',
        'desc'  => '超過最大失敗次數後，需等待此時間才能再次嘗試登入',
    ],
];

if ($method === 'GET') {
    handleGetSecuritySettings();
} else {
    handleUpdateSecuritySettings();
}

// ─────────────────────────────────────────────

/**
 * GET：讀取所有安全設定，未設定值則使用 default。
 */
function handleGetSecuritySettings(): void
{
    $pdo = db();
    $keys = array_keys(SEC_SCHEMA);
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare(
        "SELECT param_key, param_value FROM system_parameters WHERE param_key IN ($placeholders)"
    );
    $stmt->execute($keys);
    $rows = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $result = [];
    foreach (SEC_SCHEMA as $key => $cfg) {
        $entry = [
            'value'   => $rows[$key] ?? $cfg['default'],
            'type'    => $cfg['type'],
            'label'   => $cfg['label'],
            'desc'    => $cfg['desc'],
            'default' => $cfg['default'],
        ];
        if (isset($cfg['min'])) {
            $entry['min'] = $cfg['min'];
        }
        if (isset($cfg['max'])) {
            $entry['max'] = $cfg['max'];
        }
        $result[$key] = $entry;
    }

    jsonResponse(['success' => true, 'data' => $result]);
}

/**
 * POST：批次更新安全設定。
 * 只更新 payload 中有提供的 key，其他維持不變。
 */
function handleUpdateSecuritySettings(): void
{
    $payload = getJsonInput();
    if (empty($payload)) {
        jsonResponse(['success' => false, 'message' => '請求資料為空。'], 400);
    }

    $pdo = db();
    $errors = [];
    $updated = [];

    foreach (SEC_SCHEMA as $key => $cfg) {
        if (!array_key_exists($key, $payload)) {
            continue;
        }

        $raw = $payload[$key];
        $val = '';

        if ($cfg['type'] === 'bool') {
            $val = ($raw === '1' || $raw === true || $raw === 'true') ? '1' : '0';
        } elseif ($cfg['type'] === 'int') {
            $intVal = (int) $raw;
            if (isset($cfg['min']) && $intVal < $cfg['min']) {
                $errors[$key] = "{$cfg['label']} 最小值為 {$cfg['min']}。";
                continue;
            }
            if (isset($cfg['max']) && $intVal > $cfg['max']) {
                $errors[$key] = "{$cfg['label']} 最大值為 {$cfg['max']}。";
                continue;
            }
            $val = (string) $intVal;
        }

        // Upsert：先查是否存在，有則 UPDATE，無則 INSERT
        $existsStmt = $pdo->prepare(
            'SELECT id FROM system_parameters WHERE param_key = :k LIMIT 1'
        );
        $existsStmt->execute([':k' => $key]);
        $existing = $existsStmt->fetch();

        if ($existing) {
            $updStmt = $pdo->prepare(
                'UPDATE system_parameters SET param_value = :v, description = :d, updated_at = NOW() WHERE id = :id'
            );
            $updStmt->execute([':v' => $val, ':d' => $cfg['label'], ':id' => (int) $existing['id']]);
        } else {
            $insStmt = $pdo->prepare(
                'INSERT INTO system_parameters (param_key, param_value, description, created_at, updated_at)
                 VALUES (:k, :v, :d, NOW(), NOW())'
            );
            $insStmt->execute([':k' => $key, ':v' => $val, ':d' => $cfg['label']]);
        }
        $updated[] = $key;
    }

    if (!empty($errors)) {
        jsonResponse([
            'success' => false,
            'message' => '部分欄位驗證失敗。',
            'errors'  => $errors,
        ], 422);
    }

    logAuditAction(
        '更新安全設定',
        'SystemParameters',
        null,
        ['updated_keys' => $updated]
    );

    jsonResponse(['success' => true, 'message' => '安全設定已儲存。']);
}
