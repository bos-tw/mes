<?php
/**
 * 受篩產品 - 輔助函式
 *
 * 本檔案包含受篩產品模組的共用函式：
 *
 * - readScreeningItemPayload()      讀取請求資料
 * - normalisePositiveDecimal()      正規化正數值
 * - validateScreeningItemData()     驗證產品資料
 * - transformScreeningItem()        轉換 API 回應格式
 *
 * @see /api/screening_items/index.php   列表與新增
 * @see /api/screening_items/update.php  單筆查詢/更新/刪除
 */
declare(strict_types=1);

/**
 * Read screening item payload supporting JSON or form submissions.
 *
 * @return array<string,mixed>
 */
function readScreeningItemPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

/**
 * Normalise numeric value to a positive decimal string.
 *
 * @param mixed $value
 * @return string|null
 */
function normalisePositiveDecimal($value, string $fieldName, bool $required, int $scale, array &$errors, bool $allowZero = false): ?string
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
    if ($numericValue < 0 || (!$allowZero && $numericValue <= 0)) {
        $errors[$fieldName] = $allowZero ? '數值不能小於 0。' : '數值必須大於 0。';
        return null;
    }

    return number_format($numericValue, $scale, '.', '');
}

/**
 * Validate screening item input payload.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateScreeningItemData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('item_number', $payload)) {
        $itemNumber = trim((string)($payload['item_number'] ?? ''));
        $data['item_number'] = $itemNumber !== '' ? mb_substr($itemNumber, 0, 50) : null;
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '產品規格名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    if (array_key_exists('material', $payload)) {
        $material = trim((string)($payload['material'] ?? ''));
        $data['material'] = $material !== '' ? mb_substr($material, 0, 50) : null;
    }

    if (array_key_exists('thread_type', $payload)) {
        $threadType = trim((string)($payload['thread_type'] ?? ''));
        $data['thread_type'] = $threadType !== '' ? mb_substr($threadType, 0, 50) : null;
    }

    if (!$isUpdate || array_key_exists('weight_per_unit_g', $payload)) {
        $normalised = normalisePositiveDecimal($payload['weight_per_unit_g'] ?? null, 'weight_per_unit_g', !$isUpdate, 4, $errors);
        if ($normalised !== null) {
            $data['weight_per_unit_g'] = $normalised;
        }
    }

    if (array_key_exists('unit_price', $payload)) {
        $unitPrice = $payload['unit_price'] ?? null;
        if ($unitPrice !== null && $unitPrice !== '') {
            $normalised = normalisePositiveDecimal($unitPrice, 'unit_price', false, 2, $errors, true);
            if ($normalised !== null) {
                $data['unit_price'] = $normalised;
            }
        } else {
            $data['unit_price'] = null;
        }
    }

    if (array_key_exists('unit', $payload)) {
        $unit = trim((string)($payload['unit'] ?? ''));
        $data['unit'] = $unit !== '' ? mb_substr($unit, 0, 50) : null;
    } elseif (!$isUpdate) {
        $data['unit'] = 'pcs';
    }

    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Transform a screening item row for API responses.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformScreeningItem(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'item_number' => $row['item_number'] ?? null,
        'name' => $row['name'] ?? null,
        'material' => $row['material'] ?? null,
        'thread_type' => $row['thread_type'] ?? null,
        'weight_per_unit_g' => isset($row['weight_per_unit_g']) ? (float)$row['weight_per_unit_g'] : null,
        'unit_price' => isset($row['unit_price']) ? (float)$row['unit_price'] : null,
        'unit' => $row['unit'] ?? null,
        'notes' => $row['notes'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function handleScreeningItemWriteException(PDOException $e): array
{
    error_log('Screening item operation failed: ' . $e->getMessage());

    if ($e->getCode() === '23000') {
        $errorMessage = strtolower($e->getMessage());
        if (strpos($errorMessage, 'foreign key') !== false) {
            $message = '無法刪除此受篩產品，因為它已關聯於現有客戶批號。';
        } elseif (strpos($errorMessage, 'item_number') !== false) {
            $message = '受篩產品編號已存在，請使用其他編號。';
        } else {
            $message = '資料重複，請檢查輸入資料。';
        }
        return [
            'success' => false,
            'message' => $message,
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}
