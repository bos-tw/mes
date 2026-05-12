<?php
/**
 * 機台管理 API - 共用輔助函式
 *
 * 提供機台模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module machines
 * @table machines
 *
 * @functions
 * - readMachinePayload(): 讀取請求資料
 * - normaliseMachineDecimal(): 正規化小數欄位
 * - validateMachineData(): 驗證並正規化輸入資料
 * - findMachine(): 查詢單筆機台
 * - machineExists(): 檢查機台是否存在
 * - transformMachine(): 轉換為 API 回應格式
 * - handleMachineWriteException(): 處理寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../lookup_values/helpers.php';

const MACHINE_ALLOWED_DECIMAL_FIELDS = ['length_mm', 'thread_outer_diameter_mm'];

function machineHasDeletedAtColumn(PDO $pdo): bool
{
    static $hasDeletedAt = null;

    if ($hasDeletedAt !== null) {
        return $hasDeletedAt;
    }

    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM machines LIKE 'deleted_at'");
        $hasDeletedAt = $stmt !== false && $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    } catch (PDOException $exception) {
        $hasDeletedAt = false;
    }

    return $hasDeletedAt;
}

function machineActiveCondition(PDO $pdo, string $alias = ''): string
{
    if (!machineHasDeletedAtColumn($pdo)) {
        return '';
    }

    $prefix = $alias !== '' ? $alias . '.' : '';
    return ' AND ' . $prefix . 'deleted_at IS NULL';
}

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readMachinePayload(): array
{
    return readRequestPayload();
}

/**
 * Normalise decimal input to string with two decimal places.
 */
function normaliseMachineDecimal($value, string $fieldName, bool $allowNegative, array &$errors): ?string
{
    if ($value === null || $value === '') {
        return null;
    }

    if (is_string($value)) {
        $value = trim($value);
    }

    if ($value === '') {
        return null;
    }

    if (!is_numeric((string)$value)) {
        $errors[$fieldName] = '請輸入有效的數值。';
        return null;
    }

    $numericValue = (float)$value;
    if (!$allowNegative && $numericValue < 0) {
        $errors[$fieldName] = '數值不可為負數。';
        return null;
    }

    return number_format($numericValue, 2, '.', '');
}

/**
 * Validate and normalise machine input data.
 *
 * @param array<string,mixed> $payload
 * @param bool $isUpdate
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateMachineData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('machine_number', $payload)) {
        $machineNumber = trim((string)($payload['machine_number'] ?? ''));
        if ($machineNumber === '') {
            $errors['machine_number'] = '機台編號為必填。';
        } else {
            $data['machine_number'] = mb_substr($machineNumber, 0, 50);
        }
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '機台名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 100);
        }
    }

    if (array_key_exists('model', $payload)) {
        $model = trim((string)($payload['model'] ?? ''));
        $data['model'] = $model !== '' ? mb_substr($model, 0, 100) : null;
    }

    if (array_key_exists('purchase_date', $payload)) {
        $purchaseDate = trim((string)($payload['purchase_date'] ?? ''));
        if ($purchaseDate === '') {
            $data['purchase_date'] = null;
        } else {
            $date = DateTime::createFromFormat('Y-m-d', $purchaseDate);
            if (!$date || $date->format('Y-m-d') !== $purchaseDate) {
                $errors['purchase_date'] = '請輸入正確的日期格式 (YYYY-MM-DD)。';
            } else {
                $data['purchase_date'] = $purchaseDate;
            }
        }
    }

    if (array_key_exists('department_id', $payload)) {
        $departmentValue = $payload['department_id'];
        if ($departmentValue === null || $departmentValue === '') {
            $data['department_id'] = null;
        } else {
            $departmentId = (int)$departmentValue;
            if ($departmentId <= 0) {
                $errors['department_id'] = '請選擇有效的部門。';
            } else {
                $pdo = db();
                $stmt = $pdo->prepare('SELECT id FROM departments WHERE id = ? AND (deleted_at IS NULL OR deleted_at = 0)');
                $stmt->execute([$departmentId]);
                $exists = $stmt->fetchColumn();
                if (!$exists) {
                    $errors['department_id'] = '指定的部門不存在。';
                } else {
                    $data['department_id'] = $departmentId;
                }
            }
        }
    }

    if (array_key_exists('lens_count', $payload)) {
        $lensValue = $payload['lens_count'];
        if ($lensValue === null || $lensValue === '') {
            $data['lens_count'] = null;
        } elseif (!is_numeric((string)$lensValue)) {
            $errors['lens_count'] = '請輸入有效的數字。';
        } else {
            $lensCount = (int)$lensValue;
            if ($lensCount < 0) {
                $errors['lens_count'] = '數量不可為負數。';
            } else {
                $data['lens_count'] = $lensCount;
            }
        }
    }

    foreach (MACHINE_ALLOWED_DECIMAL_FIELDS as $decimalField) {
        if (array_key_exists($decimalField, $payload)) {
            $normalised = normaliseMachineDecimal($payload[$decimalField], $decimalField, false, $errors);
            if ($normalised !== null) {
                $data[$decimalField] = $normalised;
            } elseif (($payload[$decimalField] ?? null) === null || $payload[$decimalField] === '') {
                $data[$decimalField] = null;
            }
        }
    }

    if (array_key_exists('notes', $payload)) {
        $notes = (string)($payload['notes'] ?? '');
        $data['notes'] = trim($notes) !== '' ? $notes : null;
    }

    if (array_key_exists('status_lookup_id', $payload)) {
        $statusLookupId = (int)($payload['status_lookup_id'] ?? 0);
        if ($statusLookupId > 0) {
            $pdo = db();
            $statusLabel = getLookupValueLabel($pdo, $statusLookupId);
            if ($statusLabel === null) {
                $errors['status_lookup_id'] = '無效的狀態ID。';
            } else {
                $data['status_lookup_id'] = $statusLookupId;
            }
        } else {
            $data['status_lookup_id'] = null;
        }
    } elseif (!$isUpdate) {
        $pdo = db();
        $defaultStatusId = getLookupValueId($pdo, 'MACHINE_STATUS', 'operational');
        if ($defaultStatusId !== null) {
            $data['status_lookup_id'] = $defaultStatusId;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Transform a machine database row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformMachine(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'machine_number' => $row['machine_number'],
        'name' => $row['name'],
        'model' => $row['model'],
        'purchase_date' => $row['purchase_date'],
        'department_id' => isset($row['department_id']) ? (int)$row['department_id'] : null,
        'department_name' => $row['department_name'] ?? null,
        'lens_count' => $row['lens_count'] !== null ? (int)$row['lens_count'] : null,
        'length_mm' => $row['length_mm'] !== null ? (float)$row['length_mm'] : null,
        'thread_outer_diameter_mm' => $row['thread_outer_diameter_mm'] !== null ? (float)$row['thread_outer_diameter_mm'] : null,
        'notes' => $row['notes'],
        'status_lookup_id' => isset($row['status_lookup_id']) ? (int)$row['status_lookup_id'] : null,
        'status_label' => $row['status_label'] ?? null,
        'status_key' => $row['status_key'] ?? null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * Fetch a single machine record with department and status information.
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findMachine(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT m.id, m.machine_number, m.name, m.model, m.purchase_date, m.department_id, '
        . 'm.lens_count, m.length_mm, m.thread_outer_diameter_mm, m.notes, '
        . 'm.status_lookup_id, m.created_at, m.updated_at, '
        . 'd.name AS department_name, lv.value_label AS status_label, lv.value_key AS status_key '
        . 'FROM machines m '
        . 'LEFT JOIN departments d ON d.id = m.department_id '
        . 'LEFT JOIN lookup_values lv ON lv.id = m.status_lookup_id '
        . 'WHERE m.id = :id' . machineActiveCondition($pdo, 'm') . ' LIMIT 1';

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Check if a machine record exists by ID (excluding soft-deleted).
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function machineExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM machines WHERE id = :id' . machineActiveCondition($pdo) . ' LIMIT 1');
    $stmt->execute(['id' => $id]);
    return $stmt->fetchColumn() !== false;
}

function handleMachineWriteException(PDOException $exception): array
{
    error_log('Machine operation failed: ' . $exception->getMessage());

    if ($exception->getCode() === '23000') {
        $errMsg = $exception->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            if (stripos($errMsg, 'machine_number') !== false) {
                $msg = '機台編號已存在，請使用其他編號。';
            } else {
                $msg = '資料重複，請檢查輸入資料。';
            }
        } elseif (stripos($errMsg, 'foreign key') !== false) {
            $msg = '此機台仍被其他資料引用，無法執行此操作。';
        } else {
            $msg = '資料重複或違反完整性約束。';
        }
        return [
            'success' => false,
            'message' => $msg,
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}
