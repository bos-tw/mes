<?php
/**
 * 公司使用中 LOGO 公開 API（供列印頁面使用）
 *
 * 此 API 不需要登入認證，僅回傳公司使用中的 LOGO 資訊。
 *
 * @endpoint GET /api/companies/public_logo.php?company_id={id}
 *
 * @input Query Parameters
 * | 參數       | 類型 | 必填 | 說明 |
 * |------------|------|------|------|
 * | company_id | int  | Y    | 公司 ID |
 *
 * @output 成功回應（有啟用的 LOGO）
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "file_path": "uploads/company_logos/1/logo_abc123.png"
 *   }
 * }
 *
 * @output 成功回應（無啟用的 LOGO）
 * {
 *   "success": true,
 *   "data": null
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

$companyId = isset($_GET['company_id']) ? (int)$_GET['company_id'] : 0;

if ($companyId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的公司 ID。',
    ], 400);
}

$pdo = db();

// 驗證公司存在
$companyStmt = $pdo->prepare("SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL");
$companyStmt->execute([$companyId]);
if (!$companyStmt->fetch()) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的公司。',
    ], 404);
}

// 取得使用中的 LOGO
$stmt = $pdo->prepare("
    SELECT id, file_path
    FROM company_logos
    WHERE company_id = ? AND is_active = 1
    LIMIT 1
");
$stmt->execute([$companyId]);

$logo = $stmt->fetch(PDO::FETCH_ASSOC);

if ($logo) {
    jsonResponse([
        'success' => true,
        'data' => [
            'id' => (int)$logo['id'],
            'file_path' => $logo['file_path'],
        ],
    ]);
} else {
    jsonResponse([
        'success' => true,
        'data' => null,
    ]);
}
