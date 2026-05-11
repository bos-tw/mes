<?php
/**
 * 供應商管理 API - 共用輔助函式
 *
 * 提供供應商模組使用的驗證、資料轉換等輔助函式。
 *
 * @module suppliers
 * @table suppliers
 *
 * @functions
 * - readSupplierPayload(): 讀取請求資料
 * - validateSupplierData(): 驗證並正規化輸入資料
 * - transformSupplier(): 轉換為 API 回應格式
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
function readSupplierPayload(): array
{
    return readRequestPayload();
}

/**
 * Validate and normalise supplier input data.
 *
 * @param array<string,mixed> $payload
 * @param bool $isUpdate
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateSupplierData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    $stringFields = [
        'service_type' => 100,
        'supplier_type' => 100,
        'product_category' => 100,
        'owner' => 100,
        'contact_person' => 100,
        'contact_mobile' => 50,
        'phone' => 50,
        'fax' => 50,
        'address' => null,
        'factory_address' => null,
        'payment_method' => 100,
        'bank_account_name' => 100,
        'bank_name' => 100,
        'bank_code' => 10,
        'bank_branch_name' => 100,
        'bank_branch_code' => 10,
    ];

    if (!$isUpdate || array_key_exists('supplier_number', $payload)) {
        $supplierNumber = trim((string)($payload['supplier_number'] ?? ''));
        if ($supplierNumber === '') {
            $errors['supplier_number'] = '供應商編號為必填。';
        } else {
            $data['supplier_number'] = mb_substr($supplierNumber, 0, 50);
        }
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '供應商名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    foreach ($stringFields as $field => $maxLength) {
        if (!$isUpdate && !array_key_exists($field, $payload)) {
            $data[$field] = null;
            continue;
        }

        if (array_key_exists($field, $payload)) {
            $value = trim((string)($payload[$field] ?? ''));
            if ($value === '') {
                $data[$field] = null;
            } else {
                if ($maxLength !== null) {
                    $value = mb_substr($value, 0, $maxLength);
                }
                $data[$field] = $value;
            }
        }
    }

    if (!$isUpdate || array_key_exists('email', $payload)) {
        $email = trim((string)($payload['email'] ?? ''));
        if ($email !== '') {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = '電子郵件格式不正確。';
            } else {
                $data['email'] = mb_substr($email, 0, 100);
            }
        } else {
            $data['email'] = null;
        }
    }

    if (!$isUpdate || array_key_exists('tax_id', $payload)) {
        $taxId = trim((string)($payload['tax_id'] ?? ''));
        if ($taxId !== '') {
            if (!preg_match('/^\d{8}$/', $taxId)) {
                $errors['tax_id'] = '統一編號格式不正確，應為8位數字。';
            } else {
                $data['tax_id'] = $taxId;
            }
        } else {
            $data['tax_id'] = null;
        }
    }

    $phoneLikeFields = ['contact_mobile', 'phone', 'fax'];
    foreach ($phoneLikeFields as $field) {
        if (!$isUpdate && !array_key_exists($field, $payload)) {
            continue;
        }

        if (array_key_exists($field, $payload)) {
            $value = trim((string)($payload[$field] ?? ''));
            if ($value !== '' && !preg_match('/^[0-9\s\-\(\)\+]+$/', $value)) {
                $errors[$field] = '僅允許輸入數字、空格、括號、加號與連字號。';
            }
        }
    }

    $bankCodeFields = ['bank_code', 'bank_branch_code'];
    foreach ($bankCodeFields as $field) {
        if (!$isUpdate && !array_key_exists($field, $payload)) {
            continue;
        }

        if (array_key_exists($field, $payload)) {
            $value = trim((string)($payload[$field] ?? ''));
            if ($value !== '' && !preg_match('/^[0-9A-Za-z]+$/', $value)) {
                $errors[$field] = '僅允許輸入英數字。';
            }
        }
    }

    if (!$isUpdate || array_key_exists('bank_account_number', $payload)) {
        $accountNumber = trim((string)($payload['bank_account_number'] ?? ''));
        if ($accountNumber === '') {
            $data['bank_account_number'] = null;
        } else {
            if (!preg_match('/^[0-9A-Za-z\-]+$/', $accountNumber)) {
                $errors['bank_account_number'] = '匯款帳號僅允許英數字與連字號。';
            } else {
                $data['bank_account_number'] = mb_substr($accountNumber, 0, 50);
            }
        }
    }

    if (!$isUpdate || array_key_exists('attachment_path', $payload)) {
        $path = trim((string)($payload['attachment_path'] ?? ''));
        $data['attachment_path'] = $path !== '' ? mb_substr($path, 0, 500) : null;
    }

    if (!$isUpdate || array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 處理供應商附件上傳
 *
 * @param string $fieldName 檔案欄位名稱 (預設 'attachment_file')
 * @param string|null $originalPath 原有附件路徑
 * @param bool $shouldRemove 是否移除附件
 * @return array{path: string|null, errors: array<string,string>}
 */
function handleSupplierAttachmentUpload(string $fieldName = 'attachment_file', ?string $originalPath = null, bool $shouldRemove = false): array
{
    $attachmentPath = $originalPath;
    $errors = [];

    if ($shouldRemove) {
        $attachmentPath = null;
        if ($originalPath) {
            removeSupplierAttachmentFile($originalPath);
        }
    }

    if (!isset($_FILES[$fieldName]) || !is_array($_FILES[$fieldName])) {
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $file = $_FILES[$fieldName];
    $uploadError = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        switch ($uploadError) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $errors[$fieldName] = '附件大小不可超過 10 MB。';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errors[$fieldName] = '附件上傳未完成,請重新上傳。';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errors[$fieldName] = '伺服器暫存目錄遺失,無法儲存附件。';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errors[$fieldName] = '伺服器儲存附件時發生錯誤。';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errors[$fieldName] = '伺服器擴充套件阻擋了附件上傳。';
                break;
            default:
                $errors[$fieldName] = '附件上傳失敗,請稍後再試。';
                break;
        }
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $size = (int)($file['size'] ?? 0);
    $maxSize = 10 * 1024 * 1024; // 10 MB
    if ($size > $maxSize) {
        $errors[$fieldName] = '附件大小不可超過 10 MB。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $tmpName = $file['tmp_name'] ?? '';
    if (!is_string($tmpName) || $tmpName === '' || !is_uploaded_file($tmpName)) {
        $errors[$fieldName] = '附件上傳失敗,請稍後再試。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $originalName = $file['name'] ?? 'file';
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $basename = pathinfo($originalName, PATHINFO_FILENAME);

    if ($extension === '') {
        $extension = 'bin';
    }

    // 清理檔名，僅保留安全字元
    $safeBasename = preg_replace('/[^a-zA-Z0-9_\-\x{4e00}-\x{9fa5}]/u', '_', $basename);
    if (empty($safeBasename)) {
        try {
            $safeBasename = bin2hex(random_bytes(8));
        } catch (Exception $exception) {
            error_log('Failed to generate supplier attachment filename: ' . $exception->getMessage());
            $errors[$fieldName] = '無法儲存附件,請稍後再試。';
            return ['path' => $attachmentPath, 'errors' => $errors];
        }
    }

    $appRoot = dirname(__DIR__, 2);
    $uploadDir = $appRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'suppliers';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        $errors[$fieldName] = '伺服器無法建立附件儲存目錄。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    // 使用原始檔名，若重複則加上時間戳記避免衝突
    $fileName = sprintf('%s.%s', $safeBasename, $extension);
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (file_exists($destination)) {
        $timestamp = date('YmdHis');
        $fileName = sprintf('%s_%s.%s', $safeBasename, $timestamp, $extension);
        $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
    }

    if (!move_uploaded_file($tmpName, $destination)) {
        $errors[$fieldName] = '附件上傳失敗,請稍後再試。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    @chmod($destination, 0644);

    $attachmentPath = 'uploads/suppliers/' . $fileName;

    if ($originalPath && $originalPath !== $attachmentPath) {
        removeSupplierAttachmentFile($originalPath);
    }

    return ['path' => $attachmentPath, 'errors' => $errors];
}

/**
 * 刪除供應商附件實體檔案 (僅限 uploads 目錄底下)
 */
function removeSupplierAttachmentFile(?string $relativePath): void
{
    if (!$relativePath || !is_string($relativePath)) {
        return;
    }

    $normalized = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, $relativePath);
    if (strpos($normalized, 'uploads' . DIRECTORY_SEPARATOR) !== 0) {
        return;
    }

    $appRoot = dirname(__DIR__, 2);
    $fullPath = $appRoot . DIRECTORY_SEPARATOR . $normalized;

    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}