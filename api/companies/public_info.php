<?php
/**
 * 公司公開資訊 API（供列印頁面使用）
 *
 * 此 API 不需要登入認證，僅回傳公司基本公開資訊。
 *
 * @endpoint GET /api/companies/public_info.php?id={id}
 *
 * @input Query Parameters
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 公司 ID |
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "name": "羽全有限公司",
 *     "name_en": "YU CYUAN CO., LTD",
 *     "address": "高雄市路竹區...",
 *     "phone": "07-696-2727",
 *     "fax": "07-696-1919",
 *     "tax_id": "59182131"
 *   }
 * }
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// 此 API 不需要登入認證，但限制 HTTP 方法
requireMethod('GET');

// 防止被嵌入 iframe
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的公司 ID。',
    ], 400);
}

$pdo = db();

$stmt = $pdo->prepare('
    SELECT id, name, name_en, address, phone, fax, email, tax_id
    FROM companies
    WHERE id = ? AND deleted_at IS NULL
');
$stmt->execute([$id]);

$company = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$company) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的公司。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => [
        'id' => (int)$company['id'],
        'name' => $company['name'],
        'name_en' => $company['name_en'],
        'address' => $company['address'],
        'phone' => $company['phone'],
        'fax' => $company['fax'],
        'email' => $company['email'],
        'tax_id' => $company['tax_id'],
    ],
]);
