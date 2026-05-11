<?php
/**
 * 客戶管理 API - 查詢與更新
 *
 * @endpoint GET    /api/customers/update.php?id={id}  查詢單筆客戶
 * @endpoint PUT    /api/customers/update.php?id={id}  更新客戶資料
 * @endpoint POST   /api/customers/update.php?id={id}  更新客戶資料（FormData 相容，含圖片上傳）
 *
 * @auth 需要登入
 * @table customers
 *
 * ========================================
 * GET - 查詢單筆客戶
 * ========================================
 *
 * 功能同 show.php，查詢單一客戶完整資料。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明                         |
 * |---------|------|------|------------------------------|
 * | id      | int  | 是   | 客戶 ID，必須 > 0 且資料存在   |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": { ...客戶完整資料... }
 * }
 *
 * ========================================
 * PUT/POST - 更新客戶資料
 * ========================================
 *
 * 更新客戶資料，僅更新有提供的欄位（部分更新）。
 * 支援上傳/移除發票印章圖片。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明     |
 * |---------|------|------|----------|
 * | id      | int  | 是   | 客戶 ID  |
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱                   | 類型   | 必填 | 驗證規則                        | 說明              |
 * |---------------------------|--------|------|--------------------------------|-------------------|
 * | _method                   | string | 否   | 'PUT'                          | HTTP 方法覆蓋      |
 * | customer_number           | string | 否   | 非空，最大 50 字，唯一           | 客戶編號          |
 * | name                      | string | 否   | 非空，最大 255 字               | 客戶名稱          |
 * | （其他欄位同 POST 新增）    |        |      |                                |                   |
 * | remove_invoice_attachment | bool   | 否   | true/false/'1'/'0'             | 是否移除現有附件   |
 * | invoice_stamp_file        | file   | 否   | JPG/PNG/GIF，最大 5MB           | 新的發票印章圖片   |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "客戶資料已更新。"
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境               | message                         |
 * |------------|-------------------|--------------------------------|
 * | 400        | id 參數無效        | "無效的客戶ID。"                 |
 * | 400        | 無更新資料         | "沒有提供任何更新資料。"          |
 * | 404        | 客戶不存在         | "找不到指定的客戶。"              |
 * | 409        | 客戶編號重複       | "客戶編號已存在,請使用其他編號。"  |
 * | 422        | 欄位驗證失敗       | "欄位驗證失敗。"                 |
 * | 422        | 附件上傳失敗       | "附件上傳失敗。"                 |
 * | 500        | 資料庫錯誤         | "更新客戶資料失敗，請稍後再試。"   |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的客戶ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT', 'POST']);

switch ($method) {
    case 'GET':
        handleShowCustomer($id);
        break;
    case 'PUT':
    case 'POST':
        handleUpdateCustomer($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * 處理 GET 請求 - 查詢單筆客戶
 *
 * @param int $id 客戶 ID
 * @return void 直接輸出 JSON 回應
 */
function handleShowCustomer(int $id): void
{
    $pdo = db();

    $stmt = $pdo->prepare('
        SELECT
            id,
            customer_number,
            name,
            product_category,
            website,
            fax,
            invoice_title,
            company_registered_address,
            contact_person,
            phone,
            email,
            address,
            invoice_address,
            shipping_address,
            sales_contact_person,
            sales_contact_extension,
            sales_contact_mobile,
            sales_contact_email,
            finance_contact_person,
            finance_contact_extension,
            finance_contact_mobile,
            finance_contact_email,
            billing_day,
            reconciliation_day,
            payment_method,
            tax_id,
            invoice_attachment_path,
            notes,
            minimum_order_amount,
            weight_tolerance_percentage,
            is_active,
            created_at,
            updated_at
        FROM customers
        WHERE id = ? AND deleted_at IS NULL
    ');
    $stmt->execute([$id]);

    $customer = $stmt->fetch();
    if (!$customer) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的客戶。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => $customer,
    ]);
}

/**
 * 處理 PUT/POST 請求 - 更新客戶資料
 *
 * 更新流程：
 * 1. 讀取並驗證輸入資料（僅驗證有提供的欄位）
 * 2. 檢查客戶是否存在
 * 3. 處理發票印章附件（上傳新檔/移除現有檔）
 * 4. 檢查客戶編號是否與其他客戶重複
 * 5. 更新資料庫
 * 6. 記錄稽核日誌
 *
 * @param int $id 客戶 ID
 * @return void 直接輸出 JSON 回應
 */
function handleUpdateCustomer(int $id): void
{
    $pdo = db();
    $payload = readCustomerPayload();
    $removeAttachment = filter_var((string)($payload['remove_invoice_attachment'] ?? '0'), FILTER_VALIDATE_BOOLEAN);
    $fileInfo = $_FILES['invoice_stamp_file'] ?? null;
    $hasUploadedFile = is_array($fileInfo) && (int)($fileInfo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

    unset($payload['remove_invoice_attachment'], $payload['_method']);

    $validated = validateCustomerData($payload, true);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if ($data === [] && !$removeAttachment && !$hasUploadedFile) {
        jsonResponse([
            'success' => false,
            'message' => '沒有提供任何更新資料。',
        ], 400);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT customer_number, name, invoice_attachment_path FROM customers WHERE id = ? AND deleted_at IS NULL FOR UPDATE');
        $stmt->execute([$id]);
        $existingCustomer = $stmt->fetch();

        if (!$existingCustomer) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的客戶。',
            ], 404);
        }

        $currentAttachmentPath = $existingCustomer['invoice_attachment_path'] ?? null;
        $desiredAttachmentPath = $data['invoice_attachment_path'] ?? $currentAttachmentPath;

        $uploadResult = processInvoiceStampUpload('invoice_stamp_file', $removeAttachment, $desiredAttachmentPath);
        if ($uploadResult['errors'] !== []) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '附件上傳失敗。',
                'errors' => $uploadResult['errors'],
            ], 422);
        }

        $data['invoice_attachment_path'] = $uploadResult['path'];

        // Check for duplicate customer_number (if being updated)
        if (isset($data['customer_number']) && $data['customer_number'] !== $existingCustomer['customer_number']) {
            $stmt = $pdo->prepare('SELECT id FROM customers WHERE customer_number = ? AND id != ? AND deleted_at IS NULL');
            $stmt->execute([$data['customer_number'], $id]);
            if ($stmt->fetch()) {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'message' => '客戶編號已存在,請使用其他編號。',
                    'errors' => ['customer_number' => '此客戶編號已被使用'],
                    'field' => 'customer_number',
                ], 409);
            }
        }

        $setParts = [];
        $params = [];
        foreach ($data as $column => $value) {
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        $params[] = $id;

        $sql = 'UPDATE customers SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的客戶或沒有資料需要更新。',
            ], 404);
        }

        // Get updated customer data for audit log
        $stmt = $pdo->prepare('SELECT customer_number, name FROM customers WHERE id = ?');
        $stmt->execute([$id]);
        $customer = $stmt->fetch();

        // Log the action
        logAuditAction('Updated customer data', 'customers', $id, $data);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '客戶資料已更新。',
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        error_log('Failed to update customer: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '更新客戶資料失敗，請稍後再試。',
        ], 500);
    }
}
