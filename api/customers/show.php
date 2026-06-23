<?php
/**
 * 客戶管理 API - 單筆查詢
 *
 * @endpoint GET /api/customers/show.php?id={id}
 *
 * @auth 需要登入
 * @table customers
 *
 * 查詢單一客戶的完整資料。
 * 僅查詢未刪除的客戶 (deleted_at IS NULL)。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明                         |
 * |---------|------|------|------------------------------|
 * | id      | int  | 是   | 客戶 ID，必須 > 0 且資料存在   |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": {
 *         "id": 1,
 *         "customer_number": "C001",
 *         "name": "測試客戶",
 *         "product_category": "螺絲",
 *         "website": "https://example.com",
 *         "fax": "02-12345678",
 *         "invoice_title": "測試公司",
 *         "company_registered_address": "台北市...",
 *         "contact_person": "王小明",
 *         "phone": "02-12345678",
 *         "email": "test@example.com",
 *         "address": "台北市...",
 *         "invoice_address": "台北市...",
 *         "shipping_address": "台北市...",
 *         "sales_contact_person": "業務王",
 *         "sales_contact_extension": "101",
 *         "sales_contact_mobile": "0912345678",
 *         "sales_contact_email": "sales@example.com",
 *         "finance_contact_person": "會計李",
 *         "finance_contact_extension": "102",
 *         "finance_contact_mobile": "0923456789",
 *         "finance_contact_email": "finance@example.com",
 *         "billing_day": 25,
 *         "reconciliation_day": 5,
 *         "payment_method": "月結30天",
 *         "tax_id": "12345678",
 *         "invoice_attachment_path": "uploads/invoice_stamps/xxx.jpg",
 *         "notes": "備註內容",
 *         "created_at": "2024-01-01 12:00:00",
 *         "updated_at": "2024-01-02 15:30:00"
 *     }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                   |
 * |------------|------------------|---------------------------|
 * | 400        | id 參數無效       | "無效的客戶ID。"           |
 * | 401        | 未登入           | "尚未登入或登入已過期。"    |
 * | 404        | 客戶不存在或已刪除 | "找不到指定的客戶。"       |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../shipping_orders/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的客戶ID。',
    ], 400);
}

requireMethod('GET');

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

$customer['customer_tool_analysis'] = fetchCustomerToolAnalysis($pdo, $id);

jsonResponse([
    'success' => true,
    'data' => $customer,
]);
