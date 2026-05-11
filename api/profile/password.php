<?php
/**
 * 修改密碼 API
 *
 * 讓使用者修改自己的登入密碼。
 *
 * @endpoint PUT /api/profile/password.php
 *
 * @auth 必須登入
 * @table employees
 *
 * @input PUT (JSON Body)
 * | 欄位             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | current_password | string | Y    | 目前密碼 |
 * | new_password     | string | Y    | 新密碼 |
 * | confirm_password | string | Y    | 確認新密碼 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "密碼修改成功。"
 * }
 * ```
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$currentUser = requireAuth();

requireMethod('PUT');

$pdo = db();
$userId = (int)$currentUser['id'];

$payload = getJsonInput();

$errors = [];

// 驗證目前密碼
$currentPassword = $payload['current_password'] ?? '';
if (empty($currentPassword)) {
    $errors['current_password'] = '請輸入目前密碼。';
}

// 驗證新密碼
$newPassword = $payload['new_password'] ?? '';
if (empty($newPassword)) {
    $errors['new_password'] = '請輸入新密碼。';
} elseif (mb_strlen($newPassword) < 8) {
    $errors['new_password'] = '新密碼至少需要 8 個字元。';
} elseif (mb_strlen($newPassword) > 100) {
    $errors['new_password'] = '新密碼不可超過 100 個字元。';
} elseif (!preg_match('/[A-Z]/', $newPassword)) {
    $errors['new_password'] = '新密碼須包含至少一個大寫英文字母。';
} elseif (!preg_match('/[a-z]/', $newPassword)) {
    $errors['new_password'] = '新密碼須包含至少一個小寫英文字母。';
} elseif (!preg_match('/[0-9]/', $newPassword)) {
    $errors['new_password'] = '新密碼須包含至少一個數字。';
}

// 驗證確認密碼
$confirmPassword = $payload['confirm_password'] ?? '';
if (empty($confirmPassword)) {
    $errors['confirm_password'] = '請輸入確認密碼。';
} elseif ($newPassword !== $confirmPassword) {
    $errors['confirm_password'] = '確認密碼與新密碼不一致。';
}

if (!empty($errors)) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $errors,
    ], 422);
}

// 驗證目前密碼是否正確
$stmt = $pdo->prepare("SELECT password_hash FROM employees WHERE id = ? AND deleted_at IS NULL");
$stmt->execute([$userId]);
$employee = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$employee) {
    jsonResponse([
        'success' => false,
        'message' => '找不到使用者資料。',
    ], 404);
}

if (!password_verify($currentPassword, $employee['password_hash'])) {
    jsonResponse([
        'success' => false,
        'message' => '目前密碼不正確。',
        'errors' => [
            'current_password' => '目前密碼不正確。',
        ],
    ], 422);
}

// 檢查新密碼是否與目前密碼相同
if (password_verify($newPassword, $employee['password_hash'])) {
    jsonResponse([
        'success' => false,
        'message' => '新密碼不可與目前密碼相同。',
        'errors' => [
            'new_password' => '新密碼不可與目前密碼相同。',
        ],
    ], 422);
}

// 更新密碼
$newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
$updateStmt = $pdo->prepare("UPDATE employees SET password_hash = ? WHERE id = ?");
$updateStmt->execute([$newPasswordHash, $userId]);

jsonResponse([
    'success' => true,
    'message' => '密碼修改成功。',
]);
