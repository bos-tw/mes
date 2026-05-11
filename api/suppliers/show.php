<?php
/**
 * 供應商管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆供應商詳細資料。
 *
 * @endpoint GET /api/suppliers/show.php?id={id}
 *
 * @auth 必須登入
 * @table suppliers
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 供應商 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "supplier_number": "S001",
 *     "name": "大明供應",
 *     "service_type": "五金",
 *     "contact_person": "王小明",
 *     "phone": "02-12345678"
 *   }
 * }
 * ```
 *
 * @error 400 無效的供應商 ID
 * @error 404 找不到指定的供應商
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的供應商ID。',
    ], 400);
}

requireMethod('GET');

$pdo = db();

$stmt = $pdo->prepare('
    SELECT
        id,
        supplier_number,
        name,
        service_type,
        contact_person,
        phone,
        email,
        address,
        supplier_type,
        tax_id,
        owner,
        contact_mobile,
        fax,
        factory_address,
        product_category,
        bank_account_name,
        bank_name,
        bank_code,
        bank_branch_name,
        bank_branch_code,
        bank_account_number,
        payment_method,
        attachment_path,
        notes,
        created_at,
        updated_at
    FROM suppliers
    WHERE id = ? AND deleted_at IS NULL
');
$stmt->execute([$id]);

$supplier = $stmt->fetch();
if (!$supplier) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的供應商。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => $supplier,
]);
