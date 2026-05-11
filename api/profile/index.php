<?php
/**
 * 個人資料 API - 查詢與更新端點
 *
 * 提供目前登入使用者的個人資料查詢與更新功能。
 *
 * @endpoint GET  /api/profile/       取得個人資料
 * @endpoint PUT  /api/profile/       更新個人資料
 *
 * @auth 必須登入
 * @table employees
 *
 * @input PUT (JSON Body)
 * | 欄位         | 類型   | 必填 | 說明 |
 * |--------------|--------|------|------|
 * | name         | string | N    | 姓名 |
 * | email        | string | N    | Email |
 * | job_title    | string | N    | 職稱 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {...}
 * }
 * ```
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

$currentUser = requireAuth();

$method = requireMethod(['GET', 'PUT']);

switch ($method) {
    case 'GET':
        handleGetProfile($currentUser);
        break;
    case 'PUT':
        handleUpdateProfile($currentUser);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 取得個人資料
 */
function handleGetProfile(array $currentUser): void
{
    $pdo = db();
    $userId = (int)$currentUser['id'];

    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.employee_number,
            e.account,
            e.name,
            e.department_id,
            d.name AS department_name,
            e.job_title,
            e.email,
            e.status,
            e.last_login_at,
            e.created_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = ? AND e.deleted_at IS NULL
    ");
    $stmt->execute([$userId]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$employee) {
        jsonResponse([
            'success' => false,
            'message' => '找不到使用者資料。',
        ], 404);
    }

    // 取得使用者角色
    $rolesStmt = $pdo->prepare("
        SELECT r.id, r.name, r.description
        FROM employee_roles er
        JOIN roles r ON er.role_id = r.id
        WHERE er.employee_id = ?
    ");
    $rolesStmt->execute([$userId]);
    $roles = $rolesStmt->fetchAll(PDO::FETCH_ASSOC);

    $employee['roles'] = $roles;

    jsonResponse([
        'success' => true,
        'data' => $employee,
    ]);
}

/**
 * 更新個人資料
 */
function handleUpdateProfile(array $currentUser): void
{
    $pdo = db();
    $userId = (int)$currentUser['id'];

    $payload = getJsonInput();
    
    $errors = [];
    $updates = [];
    $params = [];

    // 驗證姓名
    if (isset($payload['name'])) {
        $name = trim((string)$payload['name']);
        if ($name === '') {
            $errors['name'] = '姓名不可為空。';
        } elseif (mb_strlen($name) > 100) {
            $errors['name'] = '姓名不可超過 100 字。';
        } else {
            $updates[] = 'name = ?';
            $params[] = $name;
        }
    }

    // 驗證 Email
    if (isset($payload['email'])) {
        $email = trim((string)$payload['email']);
        if ($email === '') {
            $errors['email'] = 'Email 不可為空。';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email 格式不正確。';
        } else {
            // 檢查 Email 是否已被使用
            $checkStmt = $pdo->prepare("SELECT id FROM employees WHERE email = ? AND id != ? AND deleted_at IS NULL");
            $checkStmt->execute([$email, $userId]);
            if ($checkStmt->fetch()) {
                $errors['email'] = '此 Email 已被其他帳號使用。';
            } else {
                $updates[] = 'email = ?';
                $params[] = $email;
            }
        }
    }

    // 驗證職稱
    if (isset($payload['job_title'])) {
        $jobTitle = trim((string)$payload['job_title']);
        if (mb_strlen($jobTitle) > 100) {
            $errors['job_title'] = '職稱不可超過 100 字。';
        } else {
            $updates[] = 'job_title = ?';
            $params[] = $jobTitle === '' ? null : $jobTitle;
        }
    }

    if (!empty($errors)) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $errors,
        ], 422);
    }

    if (empty($updates)) {
        jsonResponse([
            'success' => false,
            'message' => '沒有要更新的欄位。',
        ], 400);
    }

    // 執行更新
    $params[] = $userId;
    $sql = "UPDATE employees SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // 更新 Session 中的資料
    if (isset($payload['name'])) {
        $_SESSION['employee']['name'] = trim((string)$payload['name']);
    }
    if (isset($payload['email'])) {
        $_SESSION['employee']['email'] = trim((string)$payload['email']);
    }
    if (isset($payload['job_title'])) {
        $_SESSION['employee']['jobTitle'] = trim((string)$payload['job_title']) ?: null;
    }

    // 重新取得完整資料
    $stmt = $pdo->prepare("
        SELECT 
            e.id,
            e.employee_number,
            e.account,
            e.name,
            e.department_id,
            d.name AS department_name,
            e.job_title,
            e.email,
            e.status,
            e.last_login_at,
            e.created_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.id = ?
    ");
    $stmt->execute([$userId]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'message' => '個人資料更新成功。',
        'data' => $employee,
    ]);
}
