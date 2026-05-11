<?php
/**
 * Lookup Values API - 更新端點
 *
 * 更新單一 lookup value 的資料。
 *
 * @endpoint PUT /api/lookup_values/update.php?id={id}
 *
 * @auth 必須登入
 * @table lookup_values
 *
 * @input GET (Query string)
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | Lookup Value ID |
 *
 * @input PUT (JSON body)
 * | 參數        | 類型   | 必填 | 說明 |
 * |-------------|--------|------|------|
 * | value_key   | string | N    | 值代碼 |
 * | value_label | string | N    | 顯示標籤 |
 * | sort_order  | int    | N    | 排序順序 |
 * | is_active   | int    | N    | 是否啟用 (0/1) |
 *
 * @output 成功回應 (200)
 * ```json
 * {
 *   "success": true,
 *   "message": "Lookup Value 已更新。"
 * }
 * ```
 *
 * @error 400 無效的 ID 或無更新資料
 * @error 404 找不到指定的 Lookup Value
 * @error 405 不支援的請求方法
 * @error 409 value_key 重複
 * @error 422 欄位驗證失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod('PUT');
if ($method !== 'PUT') {
    jsonResponse([
        'success' => false,
        'message' => '不支援的請求方法。',
    ], 405);
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 Lookup Value ID。',
    ], 400);
}

$pdo = db();

// 檢查是否存在
$checkStmt = $pdo->prepare('SELECT id, domain_id FROM lookup_values WHERE id = ?');
$checkStmt->execute([$id]);
$existing = $checkStmt->fetch();

if (!$existing) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的 Lookup Value。',
    ], 404);
}

$payload = getJsonInput();
if ($payload === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供任何更新資料。',
    ], 400);
}

// 驗證資料
$errors = [];
$data = [];

if (array_key_exists('value_key', $payload)) {
    $valueKey = trim((string)($payload['value_key'] ?? ''));
    if ($valueKey === '') {
        $errors['value_key'] = '值代碼為必填。';
    } elseif (strlen($valueKey) > 50) {
        $errors['value_key'] = '值代碼最多 50 字元。';
    } else {
        // 檢查同 domain 下是否有重複的 value_key
        $dupStmt = $pdo->prepare('SELECT id FROM lookup_values WHERE domain_id = ? AND value_key = ? AND id != ?');
        $dupStmt->execute([$existing['domain_id'], $valueKey, $id]);
        if ($dupStmt->fetch()) {
            $errors['value_key'] = '此值代碼在該領域中已存在。';
        } else {
            $data['value_key'] = $valueKey;
        }
    }
}

if (array_key_exists('value_label', $payload)) {
    $valueLabel = trim((string)($payload['value_label'] ?? ''));
    if ($valueLabel === '') {
        $errors['value_label'] = '顯示標籤為必填。';
    } elseif (strlen($valueLabel) > 100) {
        $errors['value_label'] = '顯示標籤最多 100 字元。';
    } else {
        $data['value_label'] = $valueLabel;
    }
}

if (array_key_exists('sort_order', $payload)) {
    $sortOrder = $payload['sort_order'];
    if ($sortOrder !== null && $sortOrder !== '') {
        $sortOrderInt = filter_var($sortOrder, FILTER_VALIDATE_INT);
        if ($sortOrderInt === false || $sortOrderInt < 0) {
            $errors['sort_order'] = '排序順序必須為非負整數。';
        } else {
            $data['sort_order'] = $sortOrderInt;
        }
    } else {
        $data['sort_order'] = 0;
    }
}

if (array_key_exists('is_active', $payload)) {
    $isActive = $payload['is_active'];
    $data['is_active'] = in_array($isActive, [1, '1', true, 'true'], true) ? 1 : 0;
}

if ($errors !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $errors,
    ], 422);
}

if ($data === []) {
    jsonResponse([
        'success' => false,
        'message' => '沒有提供任何更新資料。',
    ], 400);
}

try {
    $setParts = [];
    $params = [];
    foreach ($data as $column => $value) {
        $setParts[] = "{$column} = ?";
        $params[] = $value;
    }
    $params[] = $id;

    $sql = 'UPDATE lookup_values SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = ?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse([
        'success' => true,
        'message' => 'Lookup Value 已更新。',
    ]);

} catch (PDOException $e) {
    error_log('Update lookup_value error: ' . $e->getMessage());

    if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'Duplicate entry')) {
        jsonResponse([
            'success' => false,
            'message' => '值代碼已存在，請使用其他代碼。',
        ], 409);
    }

    jsonResponse([
        'success' => false,
        'message' => '更新失敗，請稍後再試。',
    ], 500);
}
