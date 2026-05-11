<?php
/**
 * 供應商管理 API - 更新端點
 *
 * 提供供應商資料的更新功能。
 *
 * @endpoint PUT /api/suppliers/update.php?id={id}
 *
 * @auth 必須登入
 * @table suppliers
 *
 * @input PUT
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 供應商 ID (Query string) |
 *
 * @input PUT (JSON body / multipart/form-data)
 * | 參數             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | supplier_number  | string | N    | 供應商編號 |
 * | name             | string | N    | 供應商名稱 |
 * | service_type     | string | N    | 服務類型 |
 * | supplier_type    | string | N    | 供應商類型 |
 * | contact_person   | string | N    | 聯絡人 |
 * | phone            | string | N    | 電話 |
 * | email            | string | N    | Email |
 * | address          | string | N    | 地址 |
 * | tax_id           | string | N    | 統一編號 |
 * | payment_method   | string | N    | 付款方式 |
 * | attachment       | file   | N    | 附件檔案 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "供應商資料已更新。",
 *   "data": {"id": 1, "supplier_number": "S001", "name": "大明供應"}
 * }
 * ```
 *
 * @error 400 無效的供應商 ID
 * @error 404 找不到指定的供應商
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @note 支援 POST + _method=PUT 的方式覆寫 HTTP 方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的供應商ID。',
    ], 400);
}

$method = requireMethod('PUT');
$methodOverride = strtoupper((string)($_POST['_method'] ?? ''));
if ($method === 'POST' && $methodOverride !== '') {
    $method = $methodOverride;
}

if ($method !== 'PUT' && $method !== 'POST') {
    jsonResponse([
        'success' => false,
        'message' => '不支援的請求方法。',
    ], 405);
}

$pdo = db();
$payload = readSupplierPayload();
unset($payload['_method']);

$validated = validateSupplierData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id, supplier_number, attachment_path FROM suppliers WHERE id = ? AND deleted_at IS NULL FOR UPDATE');
    $stmt->execute([$id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的供應商。',
        ], 404);
    }

    // 處理附件上傳
    $shouldRemove = isset($payload['remove_attachment']) && $payload['remove_attachment'] === '1';
    $attachmentResult = handleSupplierAttachmentUpload('attachment_file', $existing['attachment_path'], $shouldRemove);
    if ($attachmentResult['errors'] !== []) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '附件上傳失敗。',
            'errors' => $attachmentResult['errors'],
        ], 422);
    }
    if ($attachmentResult['path'] !== $existing['attachment_path']) {
        $data['attachment_path'] = $attachmentResult['path'];
    }

    if ($data === []) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '沒有提供任何更新資料。',
        ], 400);
    }

    if (array_key_exists('supplier_number', $data) && $data['supplier_number'] !== $existing['supplier_number']) {
        $dupStmt = $pdo->prepare('SELECT id FROM suppliers WHERE supplier_number = :supplier_number AND deleted_at IS NULL AND id <> :id');
        $dupStmt->execute([
            'supplier_number' => $data['supplier_number'],
            'id' => $id,
        ]);
        if ($dupStmt->fetch()) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '供應商編號已存在於其他資料。',
            ], 409);
        }
    }

    $setParts = [];
    $params = [];
    foreach ($data as $column => $value) {
        $setParts[] = sprintf('%s = ?', $column);
        $params[] = $value;
    }

    $params[] = $id;

    $sql = 'UPDATE suppliers SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = ? AND deleted_at IS NULL';
    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    if ($updateStmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '沒有資料需要更新或找不到指定的供應商。',
        ], 404);
    }

    logAuditAction('Updated supplier data', 'suppliers', $id, $data);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '供應商資料已更新。',
    ]);
} catch (Throwable $exception) {
    $pdo->rollBack();
    error_log('Failed to update supplier: ' . $exception->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '更新供應商資料失敗，請稍後再試。',
    ], 500);
}
