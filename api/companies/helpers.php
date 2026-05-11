<?php
/**
 * 公司管理 API - 共用輔助函式
 *
 * 提供公司模組使用的驗證、資料轉換等輔助函式。
 *
 * @module companies
 * @table companies
 *
 * @functions
 * - readCompanyPayload(): 讀取請求資料
 * - validateCompanyData(): 驗證並正規化輸入資料
 * - transformCompany(): 轉換為 API 回應格式
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
function readCompanyPayload(): array
{
    return readRequestPayload();
}

/**
 * Validate and normalise company input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateCompanyData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '公司名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    if (array_key_exists('name_en', $payload)) {
        $nameEn = trim((string)($payload['name_en'] ?? ''));
        if ($nameEn !== '') {
            $data['name_en'] = mb_substr($nameEn, 0, 255);
        } else {
            $data['name_en'] = null;
        }
    }

    if (array_key_exists('address', $payload)) {
        $address = trim((string)($payload['address'] ?? ''));
        if ($address !== '') {
            $data['address'] = mb_substr($address, 0, 1000);
        } else {
            $data['address'] = null;
        }
    }

    if (array_key_exists('phone', $payload)) {
        $phone = trim((string)($payload['phone'] ?? ''));
        if ($phone !== '') {
            // 基本的電話號碼格式檢查 (允許數字、括號、連字號、空格、加號)
            if (!preg_match('/^[\d\s\-\(\)\+]+$/', $phone)) {
                $errors['phone'] = '電話號碼格式不正確。';
            } else {
                $data['phone'] = mb_substr($phone, 0, 50);
            }
        } else {
            $data['phone'] = null;
        }
    }

    if (array_key_exists('fax', $payload)) {
        $fax = trim((string)($payload['fax'] ?? ''));
        if ($fax !== '') {
            // 基本的傳真號碼格式檢查 (允許數字、括號、連字號、空格、加號)
            if (!preg_match('/^[\d\s\-\(\)\+]+$/', $fax)) {
                $errors['fax'] = '傳真號碼格式不正確。';
            } else {
                $data['fax'] = mb_substr($fax, 0, 50);
            }
        } else {
            $data['fax'] = null;
        }
    }

    if (array_key_exists('email', $payload)) {
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

    if (array_key_exists('tax_id', $payload)) {
        $taxId = trim((string)($payload['tax_id'] ?? ''));
        if ($taxId !== '') {
            // 基本的統一編號格式檢查 (8位數字)
            if (!preg_match('/^\d{8}$/', $taxId)) {
                $errors['tax_id'] = '統一編號格式不正確，應為8位數字。';
            } else {
                $data['tax_id'] = $taxId;
            }
        } else {
            $data['tax_id'] = null;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Transform a company database row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformCompany(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'name_en' => $row['name_en'] ?? null,
        'address' => $row['address'],
        'phone' => $row['phone'],
        'fax' => $row['fax'] ?? null,
        'email' => $row['email'],
        'tax_id' => $row['tax_id'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * Check if a company exists by ID.
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function companyExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM companies WHERE id = ?');
    $stmt->execute([$id]);
    return (bool)$stmt->fetchColumn();
}

/**
 * Standardise PDO write exception handling for company operations.
 *
 * @param PDOException $e
 * @return array{success: false, message: string}
 */
function handleCompanyWriteException(PDOException $e): array
{
    error_log('Company operation failed: ' . $e->getMessage());

    if ($e->getCode() === '23000') { // Integrity constraint violation
        $errMsg = $e->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            $msg = '資料重複，請檢查輸入資料。';
        } elseif (stripos($errMsg, 'foreign key') !== false) {
            $msg = '此公司仍被其他資料引用，無法執行此操作。';
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
