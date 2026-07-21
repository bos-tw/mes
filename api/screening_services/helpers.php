<?php
/**
 * 篩分服務 API - 輔助函式
 *
 * 本檔案包含篩分服務模組的共用函式：
 *
 * @module screening_services
 * @table screening_services
 *
 * @functions
 * - readScreeningServicePayload(): 讀取請求資料
 * - normaliseDecimalField(): 正規化數值欄位
 * - validateScreeningServiceData(): 驗證服務資料
 * - transformScreeningService(): 轉換 API 回應格式
 * - handleScreeningServiceWriteException(): 處理寫入 PDO 例外
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
function readScreeningServicePayload(): array
{
    return readRequestPayload();
}

/**
 * Normalise numeric value to fixed decimal places.
 *
 * @param mixed $value
 * @return string|null
 */
function normaliseDecimalField($value, string $fieldName, bool $required, int $scale, array &$errors, bool $allowNegative = false): ?string
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
    if (!$allowNegative && $numericValue < 0) {
        $errors[$fieldName] = '數值不可為負數。';
        return null;
    }

    return number_format($numericValue, $scale, '.', '');
}

/**
 * Validate and normalise screening service data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateScreeningServiceData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('service_number', $payload)) {
        $serviceNumber = trim((string)($payload['service_number'] ?? ''));
        $data['service_number'] = $serviceNumber !== '' ? mb_substr($serviceNumber, 0, 50) : null;
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '服務名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    // 英文名稱
    if (array_key_exists('name_en', $payload)) {
        $nameEn = trim((string)($payload['name_en'] ?? ''));
        $data['name_en'] = $nameEn !== '' ? mb_substr($nameEn, 0, 255) : null;
    }

    if (array_key_exists('category', $payload)) {
        $category = trim((string)($payload['category'] ?? ''));
        $data['category'] = $category !== '' ? mb_substr($category, 0, 100) : null;
    }

    if (array_key_exists('description', $payload)) {
        $description = trim((string)($payload['description'] ?? ''));
        $data['description'] = $description !== '' ? mb_substr($description, 0, 2000) : null;
    }

    if (!$isUpdate || array_key_exists('default_price_per_unit', $payload)) {
        $price = $payload['default_price_per_unit'] ?? null;
        $normalised = normaliseDecimalField($price, 'default_price_per_unit', !$isUpdate, 2, $errors);
        if ($normalised !== null) {
            $data['default_price_per_unit'] = $normalised;
        }
    }

    if (array_key_exists('tolerance_plus_value', $payload)) {
        $normalised = normaliseDecimalField($payload['tolerance_plus_value'], 'tolerance_plus_value', false, 4, $errors);
        $data['tolerance_plus_value'] = $normalised;
    }

    if (array_key_exists('tolerance_plus_over', $payload)) {
        $normalised = normaliseDecimalField($payload['tolerance_plus_over'], 'tolerance_plus_over', false, 4, $errors);
        $data['tolerance_plus_over'] = $normalised;
    }

    if (array_key_exists('tolerance_minus_value', $payload)) {
        $normalised = normaliseDecimalField($payload['tolerance_minus_value'], 'tolerance_minus_value', false, 4, $errors, true);
        $data['tolerance_minus_value'] = $normalised;
    }

    if (array_key_exists('tolerance_minus_over', $payload)) {
        $normalised = normaliseDecimalField($payload['tolerance_minus_over'], 'tolerance_minus_over', false, 4, $errors, true);
        $data['tolerance_minus_over'] = $normalised;
    }

    if (array_key_exists('ppm_standard', $payload)) {
        $normalised = normaliseDecimalField($payload['ppm_standard'], 'ppm_standard', false, 3, $errors);
        $data['ppm_standard'] = $normalised;
    }

    if (array_key_exists('is_active', $payload)) {
        $isActive = $payload['is_active'];
        if (is_string($isActive)) {
            $isActive = trim($isActive);
        }
        if ($isActive === '' || $isActive === null) {
            $data['is_active'] = 0;
        } else {
            $truthy = ['1', 'true', 'on', 'yes'];
            $data['is_active'] = in_array(strtolower((string)$isActive), $truthy, true) ? 1 : 0;
        }
    } elseif (!$isUpdate) {
        $data['is_active'] = 1;
    }

    if (array_key_exists('is_default', $payload)) {
        $isDefault = $payload['is_default'];
        if (is_string($isDefault)) {
            $isDefault = trim($isDefault);
        }
        if ($isDefault === '' || $isDefault === null) {
            $data['is_default'] = 0;
        } else {
            $truthy = ['1', 'true', 'on', 'yes'];
            $data['is_default'] = in_array(strtolower((string)$isDefault), $truthy, true) ? 1 : 0;
        }
    } elseif (!$isUpdate) {
        $data['is_default'] = 0;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Transform a screening service row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformScreeningService(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'service_number' => $row['service_number'],
        'name' => $row['name'],
        'name_en' => $row['name_en'] ?? null,
        'category' => $row['category'],
        'description' => $row['description'],
        'default_price_per_unit' => $row['default_price_per_unit'] !== null ? (float)$row['default_price_per_unit'] : null,
        'tolerance_plus_value' => $row['tolerance_plus_value'] !== null ? (float)$row['tolerance_plus_value'] : null,
        'tolerance_plus_over' => $row['tolerance_plus_over'] !== null ? (float)$row['tolerance_plus_over'] : null,
        'tolerance_minus_value' => $row['tolerance_minus_value'] !== null ? (float)$row['tolerance_minus_value'] : null,
        'tolerance_minus_over' => $row['tolerance_minus_over'] !== null ? (float)$row['tolerance_minus_over'] : null,
        'ppm_standard' => $row['ppm_standard'] !== null ? (float)$row['ppm_standard'] : null,
        'is_active' => isset($row['is_active']) ? (int)$row['is_active'] : 0,
        'is_default' => isset($row['is_default']) ? (int)$row['is_default'] : 0,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function handleScreeningServiceWriteException(PDOException $e): array
{
    error_log('Screening service operation failed: ' . $e->getMessage());

    if ($e->getCode() === '23000') {
        $errMsg = $e->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            if (stripos($errMsg, 'service_number') !== false) {
                $msg = '篩分服務編號已存在，請使用其他編號。';
            } else {
                $msg = '資料重複，請檢查輸入資料。';
            }
        } elseif (stripos($errMsg, 'foreign key') !== false) {
            $msg = '此篩分服務仍被其他資料引用，無法執行此操作。';
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
