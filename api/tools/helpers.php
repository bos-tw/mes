<?php
/**
 * 載具管理 - 輔助函式
 *
 * 本檔案包含載具模組的共用函式：
 *
 * - readToolPayload()         讀取請求資料
 * - normaliseDecimalValue()   正規化數值
 * - validateToolData()        驗證載具資料
 * - transformTool()           轉換 API 回應格式
 *
 * @const TOOL_ALLOWED_STATUS  允許的狀態值: available, in_use, maintenance, retired
 *
 * @see /api/tools/index.php   列表與新增
 * @see /api/tools/update.php  單筆查詢/更新/刪除
 */
declare(strict_types=1);

require_once __DIR__ . '/../lookup_values/helpers.php';

const TOOL_ALLOWED_STATUS = ['available', 'in_use', 'maintenance', 'retired'];

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readToolPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

/**
 * Normalise decimal input to string with 2 decimal places.
 */
function normaliseDecimalValue($value, string $fieldName, bool $required, array &$errors): ?string
{
    if ($value === null || $value === '') {
        if ($required) {
            $errors[$fieldName] = '此欄位為必填。';
        }
        return null;
    }

    if (is_string($value)) {
        $value = trim($value);
    }

    if ($value === '') {
        if ($required) {
            $errors[$fieldName] = '此欄位為必填。';
        }
        return null;
    }

    if (!is_numeric((string)$value)) {
        $errors[$fieldName] = '請輸入有效的數值。';
        return null;
    }

    $numericValue = (float)$value;
    if ($numericValue < 0) {
        $errors[$fieldName] = '數值不可為負數。';
        return null;
    }

    return number_format($numericValue, 2, '.', '');
}

/**
 * Validate and normalise tool input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateToolData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('tool_number', $payload)) {
        $toolNumber = trim((string)($payload['tool_number'] ?? ''));
        if ($toolNumber === '') {
            $errors['tool_number'] = '載具編號為必填。';
        } else {
            $data['tool_number'] = mb_substr($toolNumber, 0, 50);
        }
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '載具名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 100);
        }
    }

    if (array_key_exists('type', $payload)) {
        $type = trim((string)($payload['type'] ?? ''));
        $data['type'] = $type !== '' ? mb_substr($type, 0, 50) : null;
    }

    // Status (支援新舊兩種方式)
    if (array_key_exists('status_lookup_id', $payload)) {
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
        } else {
            $data['status_lookup_id'] = null;
        }
    } elseif (!$isUpdate) {
        // 新增時預設為 available 狀態
        $pdo = db();
        $defaultStatusId = getLookupValueId($pdo, 'TOOL_STATUS', 'available');
        if ($defaultStatusId !== null) {
            $data['status_lookup_id'] = $defaultStatusId;
        }
    }

    // Status (保持向後相容性)
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? ''));
        if ($status === '') {
            $data['status'] = null;
        } elseif (!in_array($status, TOOL_ALLOWED_STATUS, true)) {
            $errors['status'] = '狀態值不在允許範圍內。';
        } else {
            $data['status'] = $status;
            // 同時設定 status_lookup_id
            if (!array_key_exists('status_lookup_id', $payload)) {
                $pdo = db();
                $statusLookupId = getLookupValueId($pdo, 'TOOL_STATUS', $status);
                if ($statusLookupId !== null) {
                    $data['status_lookup_id'] = $statusLookupId;
                }
            }
        }
    } elseif (!$isUpdate && !array_key_exists('status_lookup_id', $payload)) {
        $data['status'] = 'available';
        // 設定預設 status_lookup_id
        $pdo = db();
        $defaultStatusId = getLookupValueId($pdo, 'TOOL_STATUS', 'available');
        if ($defaultStatusId !== null) {
            $data['status_lookup_id'] = $defaultStatusId;
        }
    }

    if (array_key_exists('current_location', $payload)) {
        $location = trim((string)($payload['current_location'] ?? ''));
        $data['current_location'] = $location !== '' ? mb_substr($location, 0, 100) : null;
    }

    if (!$isUpdate || array_key_exists('weight_kg', $payload)) {
        $weightValue = $payload['weight_kg'] ?? null;
        $normalisedWeight = normaliseDecimalValue($weightValue, 'weight_kg', !$isUpdate, $errors);
        if ($normalisedWeight !== null) {
            $data['weight_kg'] = $normalisedWeight;
        }
    }

    if (array_key_exists('capacity_kg', $payload)) {
        $capacityValue = $payload['capacity_kg'];
        $normalisedCapacity = normaliseDecimalValue($capacityValue, 'capacity_kg', false, $errors);
        $data['capacity_kg'] = $normalisedCapacity;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Transform a tool database row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformTool(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'tool_number' => $row['tool_number'],
        'name' => $row['name'],
        'type' => $row['type'],
        'status' => $row['status'],
        'status_lookup_id' => isset($row['status_lookup_id']) ? (int)$row['status_lookup_id'] : null,
        'status_label' => $row['status_label'] ?? null,
        'current_location' => $row['current_location'],
        'weight_kg' => $row['weight_kg'] !== null ? (float)$row['weight_kg'] : null,
        'capacity_kg' => $row['capacity_kg'] !== null ? (float)$row['capacity_kg'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function toolExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM tools WHERE id = ?');
    $stmt->execute([$id]);
    return (bool)$stmt->fetchColumn();
}

function handleToolWriteException(PDOException $e): array
{
    error_log('Tool operation failed: ' . $e->getMessage());

    if ($e->getCode() === '23000') {
        $errMsg = $e->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            if (stripos($errMsg, 'tool_number') !== false) {
                $msg = '載具編號已存在，請使用其他編號。';
            } else {
                $msg = '資料重複，請檢查輸入資料。';
            }
        } elseif (stripos($errMsg, 'foreign key') !== false) {
            $msg = '此載具仍被其他資料引用，無法執行此操作。';
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
