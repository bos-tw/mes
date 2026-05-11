<?php
/**
 * 客戶管理 - 輔助函式
 *
 * 本檔案包含客戶管理模組的共用函式：
 * - readCustomerPayload()        讀取請求資料（支援 JSON 和 FormData）
 * - validateCustomerData()       驗證並正規化客戶輸入資料
 * - processInvoiceStampUpload()  處理發票印章圖片上傳
 * - removeInvoiceStampFile()     刪除發票印章實體檔案
 *
 * @see /api/customers/index.php   POST 新增客戶
 * @see /api/customers/update.php  PUT 更新客戶
 */
declare(strict_types=1);

/**
 * 讀取客戶請求資料
 *
 * 支援兩種請求格式：
 * 1. JSON (Content-Type: application/json)
 * 2. FormData (multipart/form-data 或 application/x-www-form-urlencoded)
 *
 * 優先讀取 JSON，若無 JSON 內容則讀取 $_POST。
 *
 * @return array<string,mixed> 請求資料，可能的欄位包含：
 *   - customer_number: string       客戶編號
 *   - name: string                  客戶名稱
 *   - product_category: string      產品類別
 *   - website: string               公司網址
 *   - fax: string                   傳真
 *   - invoice_title: string         發票抬頭
 *   - company_registered_address: string 公司登記地址
 *   - contact_person: string        聯絡人
 *   - phone: string                 電話
 *   - email: string                 Email
 *   - address: string               地址
 *   - invoice_address: string       發票地址
 *   - shipping_address: string      送貨地址
 *   - sales_contact_person: string  業務聯絡人
 *   - sales_contact_extension: string 業務分機
 *   - sales_contact_mobile: string  業務手機
 *   - sales_contact_email: string   業務 Email
 *   - finance_contact_person: string 財務聯絡人
 *   - finance_contact_extension: string 財務分機
 *   - finance_contact_mobile: string 財務手機
 *   - finance_contact_email: string 財務 Email
 *   - billing_day: int              結帳日 (1-31)
 *   - reconciliation_day: int       對帳日 (1-31)
 *   - payment_method: string        付款方式
 *   - tax_id: string                統一編號
 *   - minimum_order_amount: float   最低訂購金額
 *   - weight_tolerance_percentage: float 重量公差百分比
 *   - notes: string                 備註
 *   - is_active: int                是否啟用 (0/1)
 *   - remove_invoice_attachment: string 是否移除附件
 *   - _method: string               HTTP 方法覆蓋
 *
 * @example
 * // JSON 請求
 * $data = readCustomerPayload();
 * // $data = ['customer_number' => 'C001', 'name' => '測試客戶', ...]
 */
function readCustomerPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化客戶輸入資料
 *
 * 執行以下驗證與處理：
 * 1. 字串欄位自動 trim
 * 2. 必填欄位檢查（新增模式時）
 * 3. 格式驗證（Email、URL、電話、統編等）
 * 4. 長度限制檢查
 * 5. 數值範圍檢查（結帳日、對帳日）
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 *   - false (新增模式): customer_number, name 為必填
 *   - true  (更新模式): 所有欄位皆為選填，僅驗證有提供的欄位
 *
 * @return array{
 *     data: array<string,mixed>,
 *     errors: array<string,string>
 * } 驗證結果：
 *   - data: 已驗證並正規化的資料（trim、型別轉換等）
 *   - errors: 欄位名稱 => 錯誤訊息（空陣列表示驗證通過）
 *
 * @example 新增模式 - 驗證通過
 * $result = validateCustomerData([
 *     'customer_number' => 'C001',
 *     'name' => '測試客戶',
 *     'email' => 'test@example.com'
 * ]);
 * // $result['errors'] === []
 * // $result['data'] = ['customer_number' => 'C001', 'name' => '測試客戶', ...]
 *
 * @example 新增模式 - 驗證失敗（缺少必填欄位）
 * $result = validateCustomerData(['email' => 'test@example.com']);
 * // $result['errors'] = [
 * //     'customer_number' => '客戶編號為必填。',
 * //     'name' => '客戶名稱為必填。'
 * // ]
 *
 * @example 更新模式 - 部分更新
 * $result = validateCustomerData(['name' => '新名稱'], true);
 * // 通過：更新模式下 customer_number 非必填
 * // $result['data'] = ['name' => '新名稱']
 *
 * @example 格式驗證失敗
 * $result = validateCustomerData([
 *     'customer_number' => 'C001',
 *     'name' => '測試',
 *     'tax_id' => '1234'  // 應為 8 位數字
 * ]);
 * // $result['errors'] = ['tax_id' => '統一編號格式不正確，應為8位數字。']
 */
function validateCustomerData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('customer_number', $payload)) {
        $customerNumber = trim((string)($payload['customer_number'] ?? ''));
        if ($customerNumber === '') {
            $errors['customer_number'] = '客戶編號為必填。';
        } else {
            $data['customer_number'] = mb_substr($customerNumber, 0, 50);
        }
    }

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '客戶名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    if (array_key_exists('product_category', $payload) || !$isUpdate) {
        $productCategory = trim((string)($payload['product_category'] ?? ''));
        if ($productCategory !== '') {
            $data['product_category'] = mb_substr($productCategory, 0, 100);
        } else {
            $data['product_category'] = null;
        }
    }

    if (array_key_exists('website', $payload) || !$isUpdate) {
        $website = trim((string)($payload['website'] ?? ''));
        if ($website !== '') {
            if (!filter_var($website, FILTER_VALIDATE_URL)) {
                $errors['website'] = '公司網址格式不正確。';
            } else {
                $data['website'] = mb_substr($website, 0, 255);
            }
        } else {
            $data['website'] = null;
        }
    }

    if (array_key_exists('fax', $payload) || !$isUpdate) {
        $fax = trim((string)($payload['fax'] ?? ''));
        if ($fax !== '') {
            $data['fax'] = mb_substr($fax, 0, 50);
        } else {
            $data['fax'] = null;
        }
    }

    if (array_key_exists('invoice_title', $payload) || !$isUpdate) {
        $invoiceTitle = trim((string)($payload['invoice_title'] ?? ''));
        if ($invoiceTitle !== '') {
            $data['invoice_title'] = mb_substr($invoiceTitle, 0, 255);
        } else {
            $data['invoice_title'] = null;
        }
    }

    if (array_key_exists('company_registered_address', $payload) || !$isUpdate) {
        $companyRegisteredAddress = trim((string)($payload['company_registered_address'] ?? ''));
        $data['company_registered_address'] = $companyRegisteredAddress !== '' ? $companyRegisteredAddress : null;
    }

    if (array_key_exists('invoice_address', $payload) || !$isUpdate) {
        $invoiceAddress = trim((string)($payload['invoice_address'] ?? ''));
        $data['invoice_address'] = $invoiceAddress !== '' ? $invoiceAddress : null;
    }

    if (array_key_exists('shipping_address', $payload) || !$isUpdate) {
        $shippingAddress = trim((string)($payload['shipping_address'] ?? ''));
        $data['shipping_address'] = $shippingAddress !== '' ? $shippingAddress : null;
    }

    if (array_key_exists('contact_person', $payload) || !$isUpdate) {
        $contactPerson = trim((string)($payload['contact_person'] ?? ''));
        if ($contactPerson !== '') {
            $data['contact_person'] = mb_substr($contactPerson, 0, 100);
        } else {
            $data['contact_person'] = null;
        }
    }

    if (array_key_exists('phone', $payload) || !$isUpdate) {
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

    if (array_key_exists('email', $payload) || !$isUpdate) {
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

    if (array_key_exists('address', $payload) || !$isUpdate) {
        $address = trim((string)($payload['address'] ?? ''));
        if ($address !== '') {
            $data['address'] = $address;
        } else {
            $data['address'] = null;
        }
    }

    if (array_key_exists('sales_contact_person', $payload) || !$isUpdate) {
        $salesContactPerson = trim((string)($payload['sales_contact_person'] ?? ''));
        if ($salesContactPerson !== '') {
            $data['sales_contact_person'] = mb_substr($salesContactPerson, 0, 100);
        } else {
            $data['sales_contact_person'] = null;
        }
    }

    if (array_key_exists('sales_contact_extension', $payload) || !$isUpdate) {
        $salesContactExtension = trim((string)($payload['sales_contact_extension'] ?? ''));
        if ($salesContactExtension !== '') {
            $data['sales_contact_extension'] = mb_substr($salesContactExtension, 0, 20);
        } else {
            $data['sales_contact_extension'] = null;
        }
    }

    if (array_key_exists('sales_contact_mobile', $payload) || !$isUpdate) {
        $salesContactMobile = trim((string)($payload['sales_contact_mobile'] ?? ''));
        if ($salesContactMobile !== '') {
            // 驗證手機號碼格式
            if (!preg_match('/^[0-9\s\-\(\)]+$/', $salesContactMobile)) {
                throw new InvalidArgumentException('業務聯絡人手機號碼格式不正確');
            }
            $data['sales_contact_mobile'] = mb_substr($salesContactMobile, 0, 50);
        } else {
            $data['sales_contact_mobile'] = null;
        }
    }

    if (array_key_exists('sales_contact_email', $payload) || !$isUpdate) {
        $salesContactEmail = trim((string)($payload['sales_contact_email'] ?? ''));
        if ($salesContactEmail !== '') {
            if (!filter_var($salesContactEmail, FILTER_VALIDATE_EMAIL)) {
                $errors['sales_contact_email'] = '業務聯絡人Email格式不正確。';
            } else {
                $data['sales_contact_email'] = mb_substr($salesContactEmail, 0, 255);
            }
        } else {
            $data['sales_contact_email'] = null;
        }
    }

    if (array_key_exists('finance_contact_person', $payload) || !$isUpdate) {
        $financeContactPerson = trim((string)($payload['finance_contact_person'] ?? ''));
        if ($financeContactPerson !== '') {
            $data['finance_contact_person'] = mb_substr($financeContactPerson, 0, 100);
        } else {
            $data['finance_contact_person'] = null;
        }
    }

    if (array_key_exists('finance_contact_extension', $payload) || !$isUpdate) {
        $financeContactExtension = trim((string)($payload['finance_contact_extension'] ?? ''));
        if ($financeContactExtension !== '') {
            $data['finance_contact_extension'] = mb_substr($financeContactExtension, 0, 20);
        } else {
            $data['finance_contact_extension'] = null;
        }
    }

    if (array_key_exists('finance_contact_mobile', $payload) || !$isUpdate) {
        $financeContactMobile = trim((string)($payload['finance_contact_mobile'] ?? ''));
        if ($financeContactMobile !== '') {
            // 驗證手機號碼格式
            if (!preg_match('/^[0-9\s\-\(\)]+$/', $financeContactMobile)) {
                throw new InvalidArgumentException('財務聯絡人手機號碼格式不正確');
            }
            $data['finance_contact_mobile'] = mb_substr($financeContactMobile, 0, 50);
        } else {
            $data['finance_contact_mobile'] = null;
        }
    }

    if (array_key_exists('finance_contact_email', $payload) || !$isUpdate) {
        $financeContactEmail = trim((string)($payload['finance_contact_email'] ?? ''));
        if ($financeContactEmail !== '') {
            if (!filter_var($financeContactEmail, FILTER_VALIDATE_EMAIL)) {
                $errors['finance_contact_email'] = '財務聯絡人Email格式不正確。';
            } else {
                $data['finance_contact_email'] = mb_substr($financeContactEmail, 0, 255);
            }
        } else {
            $data['finance_contact_email'] = null;
        }
    }

    if (array_key_exists('billing_day', $payload) || !$isUpdate) {
        $billingDay = $payload['billing_day'];
        if ($billingDay !== '' && $billingDay !== null) {
            $billingDayInt = (int)$billingDay;
            if ($billingDayInt < 1 || $billingDayInt > 31) {
                $errors['billing_day'] = '結帳日必須在1-31之間。';
            } else {
                $data['billing_day'] = $billingDayInt;
            }
        } else {
            $data['billing_day'] = null;
        }
    }

    if (array_key_exists('reconciliation_day', $payload) || !$isUpdate) {
        $reconciliationDay = $payload['reconciliation_day'];
        if ($reconciliationDay !== '' && $reconciliationDay !== null) {
            $reconciliationDayInt = (int)$reconciliationDay;
            if ($reconciliationDayInt < 1 || $reconciliationDayInt > 31) {
                $errors['reconciliation_day'] = '對帳日必須在1-31之間。';
            } else {
                $data['reconciliation_day'] = $reconciliationDayInt;
            }
        } else {
            $data['reconciliation_day'] = null;
        }
    }

    if (array_key_exists('payment_method', $payload) || !$isUpdate) {
        $paymentMethod = trim((string)($payload['payment_method'] ?? ''));
        if ($paymentMethod !== '') {
            $data['payment_method'] = mb_substr($paymentMethod, 0, 100);
        } else {
            $data['payment_method'] = null;
        }
    }

    if (array_key_exists('tax_id', $payload) || !$isUpdate) {
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

    if (array_key_exists('invoice_attachment_path', $payload) || !$isUpdate) {
        $attachmentPath = trim((string)($payload['invoice_attachment_path'] ?? ''));
        if ($attachmentPath !== '') {
            $data['invoice_attachment_path'] = mb_substr($attachmentPath, 0, 500);
        } else {
            $data['invoice_attachment_path'] = null;
        }
    }

    if (array_key_exists('notes', $payload) || !$isUpdate) {
        $notes = trim((string)($payload['notes'] ?? ''));
        if ($notes !== '') {
            $data['notes'] = $notes;
        } else {
            $data['notes'] = null;
        }
    }

    // 處理 is_active 欄位
    if (array_key_exists('is_active', $payload) || !$isUpdate) {
        $isActive = $payload['is_active'] ?? '1';
        // 將字串或布林值轉換為整數 0 或 1
        $data['is_active'] = in_array($isActive, [1, '1', true, 'true'], true) ? 1 : 0;
    }

    // 處理 minimum_order_amount 欄位（最低訂購金額）
    if (array_key_exists('minimum_order_amount', $payload) || !$isUpdate) {
        $minimumOrderAmount = $payload['minimum_order_amount'] ?? '';
        if ($minimumOrderAmount !== '' && $minimumOrderAmount !== null) {
            $minimumOrderAmountFloat = (float)$minimumOrderAmount;
            if ($minimumOrderAmountFloat < 0) {
                $errors['minimum_order_amount'] = '最低訂購金額不可為負數。';
            } else {
                $data['minimum_order_amount'] = round($minimumOrderAmountFloat, 2);
            }
        } else {
            $data['minimum_order_amount'] = 0;
        }
    }

    // 處理 weight_tolerance_percentage 欄位（重量公差百分比）
    if (array_key_exists('weight_tolerance_percentage', $payload) || !$isUpdate) {
        $weightTolerance = $payload['weight_tolerance_percentage'] ?? '';
        if ($weightTolerance !== '' && $weightTolerance !== null) {
            $weightToleranceFloat = (float)$weightTolerance;
            if ($weightToleranceFloat < 0 || $weightToleranceFloat > 100) {
                $errors['weight_tolerance_percentage'] = '重量公差百分比必須在0-100之間。';
            } else {
                $data['weight_tolerance_percentage'] = round($weightToleranceFloat, 2);
            }
        } else {
            $data['weight_tolerance_percentage'] = 3.00; // 預設3%
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 處理發票印章附件上傳
 *
 * 支援以下操作：
 * 1. 上傳新檔案（會自動刪除舊檔）
 * 2. 移除現有檔案（設定 $shouldRemove = true）
 * 3. 保留現有檔案（不傳新檔且不移除）
 *
 * 檔案驗證規則：
 * - 格式：僅接受 JPG、PNG、GIF
 * - 大小：最大 5MB
 * - 儲存位置：uploads/invoice_stamps/
 * - 檔名：隨機產生 32 字元 hex 字串
 *
 * @param string $fieldName 表單欄位名稱（對應 $_FILES 的 key）
 * @param bool $shouldRemove 是否移除現有附件
 *   - true: 刪除 $currentPath 指向的檔案，回傳 path = null
 *   - false: 保留現有檔案（除非有上傳新檔）
 * @param string|null $currentPath 目前附件的相對路徑
 *   例如：'uploads/invoice_stamps/abc123.jpg'
 *
 * @return array{
 *     path: string|null,
 *     errors: array<string,string>
 * } 處理結果：
 *   - path: 新檔案的相對路徑，或 null（移除/無檔案）
 *   - errors: 欄位名稱 => 錯誤訊息（空陣列表示成功）
 *
 * @example 上傳新檔案
 * // $_FILES['invoice_stamp_file'] 包含上傳的圖片
 * $result = processInvoiceStampUpload('invoice_stamp_file', false, null);
 * // $result = ['path' => 'uploads/invoice_stamps/a1b2c3...jpg', 'errors' => []]
 *
 * @example 移除現有檔案
 * $result = processInvoiceStampUpload('invoice_stamp_file', true, 'uploads/invoice_stamps/old.jpg');
 * // $result = ['path' => null, 'errors' => []]
 * // old.jpg 會被刪除
 *
 * @example 上傳失敗（格式錯誤）
 * $result = processInvoiceStampUpload('invoice_stamp_file', false, null);
 * // $result = ['path' => null, 'errors' => ['invoice_stamp_file' => '發票印章附件僅支援 JPG、PNG 或 GIF 格式。']]
 */
function processInvoiceStampUpload(string $fieldName, bool $shouldRemove, ?string $currentPath = null): array
{
    $originalPath = $currentPath ?: null;
    $attachmentPath = $originalPath;
    $errors = [];

    if ($shouldRemove) {
        $attachmentPath = null;
        if ($originalPath) {
            removeInvoiceStampFile($originalPath);
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
                $errors[$fieldName] = '發票印章附件大小不可超過 5 MB。';
                break;
            case UPLOAD_ERR_PARTIAL:
                $errors[$fieldName] = '發票印章附件上傳未完成，請重新上傳。';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $errors[$fieldName] = '伺服器暫存目錄遺失，無法儲存附件。';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $errors[$fieldName] = '伺服器儲存附件時發生錯誤。';
                break;
            case UPLOAD_ERR_EXTENSION:
                $errors[$fieldName] = '伺服器擴充套件阻擋了附件上傳。';
                break;
            default:
                $errors[$fieldName] = '發票印章附件上傳失敗，請稍後再試。';
                break;
        }

        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $size = (int)($file['size'] ?? 0);
    $maxSize = 5 * 1024 * 1024; // 5 MB
    if ($size > $maxSize) {
        $errors[$fieldName] = '發票印章附件大小不可超過 5 MB。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $tmpName = $file['tmp_name'] ?? '';
    if (!is_string($tmpName) || $tmpName === '' || !is_uploaded_file($tmpName)) {
        $errors[$fieldName] = '發票印章附件上傳失敗，請稍後再試。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($tmpName) ?: '';
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        $errors[$fieldName] = '發票印章附件僅支援 JPG、PNG 或 GIF 格式。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    try {
        $randomName = bin2hex(random_bytes(16));
    } catch (Exception $exception) {
        error_log('Failed to generate invoice stamp filename: ' . $exception->getMessage());
        $errors[$fieldName] = '無法儲存發票印章附件，請稍後再試。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $appRoot = dirname(__DIR__, 2);
    $uploadDir = $appRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'invoice_stamps';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        $errors[$fieldName] = '伺服器無法建立附件儲存目錄。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    $fileName = sprintf('%s.%s', $randomName, $allowedTypes[$mimeType]);
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($tmpName, $destination)) {
        $errors[$fieldName] = '發票印章附件上傳失敗，請稍後再試。';
        return ['path' => $attachmentPath, 'errors' => $errors];
    }

    @chmod($destination, 0644);

    $attachmentPath = 'uploads/invoice_stamps/' . $fileName;

    if ($originalPath && $originalPath !== $attachmentPath) {
        removeInvoiceStampFile($originalPath);
    }

    return ['path' => $attachmentPath, 'errors' => $errors];
}

/**
 * 刪除發票印章附件實體檔案
 *
 * 安全性檢查：
 * - 僅允許刪除 uploads/ 目錄底下的檔案
 * - 使用 realpath() 防止目錄遍歷攻擊
 * - 檔案不存在時靜默忽略（不拋出錯誤）
 *
 * @param string|null $relativePath 附件的相對路徑
 *   例如：'uploads/invoice_stamps/abc123.jpg'
 *   傳入 null 或空字串時不執行任何動作
 *
 * @return void
 *
 * @example
 * // 刪除檔案
 * removeInvoiceStampFile('uploads/invoice_stamps/old_file.jpg');
 *
 * // 傳入 null 不會有任何動作
 * removeInvoiceStampFile(null);
 */
function removeInvoiceStampFile(?string $relativePath): void
{
    if ($relativePath === null || $relativePath === '') {
        return;
    }

    $normalizedRelative = ltrim(str_replace('\\', '/', $relativePath), '/');
    $appRoot = dirname(__DIR__, 2);
    $uploadsRoot = $appRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
    $absolutePath = $appRoot . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalizedRelative);

    $realAbsolutePath = realpath($absolutePath);
    if ($realAbsolutePath === false) {
        return;
    }

    $realUploadsRoot = realpath($uploadsRoot) ?: $uploadsRoot;
    if (strpos($realAbsolutePath, $realUploadsRoot) !== 0) {
        return;
    }

    if (is_file($realAbsolutePath)) {
        @unlink($realAbsolutePath);
    }
}