<?php
/**
 * 稽核日誌 API - 共用輔助函式
 *
 * 提供稽核日誌模組使用的驗證、資料轉換等輔助函式。
 *
 * @module audit_logs
 * @table audit_logs, employees
 *
 * @functions
 * - readAuditLogPayload(): 讀取請求資料
 * - validateAuditLogData(): 驗證並正規化輸入資料
 * - transformAuditLog(): 轉換為 API 回應格式
 * - findAuditLog(): 取得單筆稽核日誌
 * - auditLogExists(): 檢查稽核日誌是否存在
 * - handleAuditLogWriteException(): 處理寫入 PDO 例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readAuditLogPayload(): array
{
    return readRequestPayload();
}

/**
 * Validate and normalise audit log input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateAuditLogData(array $payload): array
{
    $errors = [];
    $data = [];

    $action = trim((string)($payload['action'] ?? ''));
    if ($action === '') {
        $errors['action'] = '動作為必填。';
    } else {
        $data['action'] = mb_substr($action, 0, 255);
    }

    if (array_key_exists('target_table', $payload)) {
        $targetTable = trim((string)$payload['target_table']);
        $data['target_table'] = $targetTable === '' ? null : mb_substr($targetTable, 0, 100);
    }

    if (array_key_exists('target_id', $payload)) {
        $rawTargetId = $payload['target_id'];
        if ($rawTargetId === null || $rawTargetId === '') {
            $data['target_id'] = null;
        } else {
            $targetId = filter_var($rawTargetId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($targetId === false) {
                $errors['target_id'] = '目標 ID 必須為正整數或留空。';
            } else {
                $data['target_id'] = $targetId;
            }
        }
    }

    if (array_key_exists('employee_id', $payload)) {
        $rawEmployeeId = $payload['employee_id'];
        if ($rawEmployeeId === null || $rawEmployeeId === '') {
            $data['employee_id'] = null;
        } else {
            $employeeId = filter_var($rawEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($employeeId === false) {
                $errors['employee_id'] = '員工 ID 必須為正整數或留空。';
            } else {
                $data['employee_id'] = $employeeId;
            }
        }
    }

    if (array_key_exists('ip_address', $payload)) {
        $ipAddress = trim((string)$payload['ip_address']);
        $data['ip_address'] = $ipAddress === '' ? null : mb_substr($ipAddress, 0, 45);
    }

    if (array_key_exists('details', $payload)) {
        $details = trim((string)$payload['details']);
        $data['details'] = $details === '' ? null : $details;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Convert raw audit log row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformAuditLog(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'employee' => [
            'id' => isset($row['employee_id']) && $row['employee_id'] !== null ? (int)$row['employee_id'] : null,
            'name' => $row['employee_name'] ?? null,
            'account' => $row['employee_account'] ?? null,
        ],
        'action' => $row['action'],
        'target_table' => $row['target_table'],
        'target_id' => $row['target_id'] !== null ? (int)$row['target_id'] : null,
        'details' => $row['details'],
        'ip_address' => $row['ip_address'],
        'created_at' => $row['created_at'],
    ];
}

function currentTimestamp(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Taipei')))->format('Y-m-d H:i:s');
}

/**
 * Fetch a single audit log record.
 */
function findAuditLog(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('
        SELECT
            al.id,
            al.employee_id,
            al.action,
            al.target_table,
            al.target_id,
            al.details,
            al.ip_address,
            al.created_at,
            e.name AS employee_name,
            e.account AS employee_account
        FROM audit_logs al
        LEFT JOIN employees e ON e.id = al.employee_id
        WHERE al.id = :id
        LIMIT 1
    ');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Check if an audit log exists by ID.
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function auditLogExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM audit_logs WHERE id = ?');
    $stmt->execute([$id]);
    return (bool)$stmt->fetchColumn();
}

/**
 * Standardise PDO write exception handling for audit log operations.
 *
 * @param PDOException $e
 * @return array{success: false, message: string}
 */
function handleAuditLogWriteException(PDOException $e): array
{
    error_log('Audit log operation failed: ' . $e->getMessage());

    if ($e->getCode() === '23000') {
        return [
            'success' => false,
            'message' => '資料重複或違反完整性約束。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}
