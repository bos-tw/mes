<?php
/**
 * 員工管理 API - 共用輔助函式
 *
 * 提供員工模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module employees
 * @table employees
 *
 * @const EMPLOYEE_ALLOWED_STATUSES 允許的員工狀態清單
 *
 * @functions
 * - readEmployeePayload(): 讀取請求資料
 * - validateEmployeeData(): 驗證並正規化輸入資料
 * - findEmployee(): 查詢單筆員工
 * - transformEmployee(): 轉換為 API 回應格式
 * - employeeExists(): 檢查員工是否存在
 * - handleEmployeeWriteException(): 處理寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../lookup_values/helpers.php';

const EMPLOYEE_ALLOWED_STATUSES = ['active', 'resigned', 'unpaid_leave'];

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readEmployeePayload(): array
{
    return readRequestPayload();
}

/**
 * Validate and normalise employee input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateEmployeeData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // Employee number
    if (!$isUpdate || array_key_exists('employee_number', $payload)) {
        $employeeNumber = trim((string)($payload['employee_number'] ?? ''));
        if ($employeeNumber === '') {
            $errors['employee_number'] = '員工編號為必填。';
        } else {
            $data['employee_number'] = mb_substr($employeeNumber, 0, 50);
        }
    }

    // Account
    if (!$isUpdate || array_key_exists('account', $payload)) {
        $account = trim((string)($payload['account'] ?? ''));
        if ($account === '') {
            $errors['account'] = '登入帳號為必填。';
        } else {
            $data['account'] = mb_substr($account, 0, 100);
        }
    }

    // Name
    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '員工姓名為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 100);
        }
    }

    // Department ID
    if (array_key_exists('department_id', $payload)) {
        $departmentIdRaw = $payload['department_id'];
        if ($departmentIdRaw === null || $departmentIdRaw === '') {
            $data['department_id'] = null;
        } else {
            $departmentId = filter_var($departmentIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($departmentId === false) {
                $errors['department_id'] = '部門 ID 必須為正整數或留空。';
            } else {
                $data['department_id'] = $departmentId;
            }
        }
    }

    // Job title
    if (array_key_exists('job_title', $payload)) {
        $jobTitle = trim((string)$payload['job_title']);
        $data['job_title'] = $jobTitle === '' ? null : mb_substr($jobTitle, 0, 100);
    }

    // Email
    if (!$isUpdate || array_key_exists('email', $payload)) {
        $email = trim((string)($payload['email'] ?? ''));
        if ($email === '') {
            $errors['email'] = '電子郵件為必填。';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = '電子郵件格式不正確。';
        } else {
            $data['email'] = mb_substr($email, 0, 100);
        }
    }

    // Status (支援新舊兩種方式)
    if (array_key_exists('status_lookup_id', $payload) || !$isUpdate) {
        $statusLookupId = (int)($payload['status_lookup_id'] ?? 0);
        if ($statusLookupId > 0) {
            // 驗證 status_lookup_id 是否有效
            $pdo = db();
            $statusLabel = getLookupValueLabel($pdo, $statusLookupId);
            if ($statusLabel === null) {
                $errors['status_lookup_id'] = '無效的狀態ID。';
            } else {
                $data['status_lookup_id'] = $statusLookupId;
            }
        } elseif (!$isUpdate) {
            // 新增時預設為 active 狀態
            $pdo = db();
            $defaultStatusId = getLookupValueId($pdo, 'EMPLOYEE_STATUS', 'active');
            if ($defaultStatusId !== null) {
                $data['status_lookup_id'] = $defaultStatusId;
            }
        }
    }

    // Status (保持向後相容性)
    if (array_key_exists('status', $payload) || (!$isUpdate && !array_key_exists('status_lookup_id', $payload))) {
        $status = $payload['status'] ?? 'active';
        if (!in_array($status, EMPLOYEE_ALLOWED_STATUSES, true)) {
            $errors['status'] = '狀態必須為 active、resigned 或 unpaid_leave。';
        } else {
            $data['status'] = $status;
            // 同時設定 status_lookup_id
            if (!array_key_exists('status_lookup_id', $payload)) {
                $pdo = db();
                $statusLookupId = getLookupValueId($pdo, 'EMPLOYEE_STATUS', $status);
                if ($statusLookupId !== null) {
                    $data['status_lookup_id'] = $statusLookupId;
                }
            }
        }
    }

    // Password
    if (!$isUpdate || array_key_exists('password', $payload)) {
        $password = (string)($payload['password'] ?? '');
        if ($password === '') {
            if (!$isUpdate) {
                $errors['password'] = '密碼為必填。';
            }
        } elseif (strlen($password) < 8) {
            $errors['password'] = '密碼長度需至少 8 碼。';
        } elseif (!preg_match('/[A-Z]/', $password)) {
            $errors['password'] = '密碼必須包含至少一個大寫字母。';
        } elseif (!preg_match('/[a-z]/', $password)) {
            $errors['password'] = '密碼必須包含至少一個小寫字母。';
        } elseif (!preg_match('/[0-9]/', $password)) {
            $errors['password'] = '密碼必須包含至少一個數字。';
        } else {
            $data['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
        }
    }

    if (!$isUpdate && empty($data['status'])) {
        $data['status'] = 'active';
    }

    if ($isUpdate && empty($data)) {
        $errors['general'] = '沒有任何可更新的欄位。';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Fetch a single employee record with department information.
 */
function findEmployee(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('SELECT e.id, e.employee_number, e.account, e.name, e.department_id, e.job_title, e.email, e.status, e.status_lookup_id, e.last_login_at, e.created_at, e.updated_at, e.deleted_at, d.name AS department_name, lv.value_label AS status_label FROM employees e LEFT JOIN departments d ON d.id = e.department_id LEFT JOIN lookup_values lv ON e.status_lookup_id = lv.id WHERE e.id = :id AND e.deleted_at IS NULL LIMIT 1');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Convert raw employee row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformEmployee(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'employee_number' => $row['employee_number'],
        'account' => $row['account'],
        'name' => $row['name'],
        'department' => [
            'id' => isset($row['department_id']) ? ($row['department_id'] !== null ? (int)$row['department_id'] : null) : null,
            'name' => $row['department_name'] ?? null,
        ],
        'job_title' => $row['job_title'],
        'email' => $row['email'],
        'status' => $row['status'],
        'status_lookup_id' => isset($row['status_lookup_id']) ? (int)$row['status_lookup_id'] : null,
        'status_label' => $row['status_label'] ?? null,
        'last_login_at' => $row['last_login_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * Helper to get current timestamp string in Asia/Taipei timezone.
 */
function currentTimestamp(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Y-m-d H:i:s');
}

/**
 * Check if an employee record exists by ID (excluding soft-deleted).
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function employeeExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM employees WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $stmt->execute(['id' => $id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * Standardise PDO write exception handling for employee operations.
 */
function handleEmployeeWriteException(PDOException $exception): void
{
    if ((int)$exception->getCode() === 23000) {
        $errMsg = $exception->getMessage();
        if (stripos($errMsg, 'employee_number') !== false || stripos($errMsg, 'uk_employee_number') !== false) {
            $message = '員工編號已存在，請使用其他編號。';
        } elseif (stripos($errMsg, 'email') !== false || stripos($errMsg, 'uk_email') !== false) {
            $message = '電子郵件已存在，請使用其他郵件地址。';
        } elseif (stripos($errMsg, 'account') !== false) {
            $message = '帳號已存在，請使用其他帳號。';
        } else {
            $message = '資料重複，請檢查帳號、員工編號或電子郵件是否已存在。';
        }
    } else {
        $message = '資料庫寫入失敗，請稍後再試。';
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
        'error' => $exception->getMessage(),
    ], 409);
}
