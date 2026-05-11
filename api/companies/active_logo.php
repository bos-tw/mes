<?php
/**
 * 取得公司使用中的 LOGO API
 *
 * 提供列印表單使用，取得指定公司目前啟用的 LOGO。
 *
 * @endpoint GET /api/companies/active_logo.php?company_id={id}
 *
 * @auth 必須登入
 * @table company_logos
 *
 * @input GET (Query string)
 * | 參數       | 類型 | 必填 | 說明 |
 * |------------|------|------|------|
 * | company_id | int  | Y    | 公司 ID |
 *
 * @output 成功回應（有啟用 LOGO）
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "file_path": "uploads/company_logos/1/logo_abc123.png",
 *     "file_url": "/mes/uploads/company_logos/1/logo_abc123.png"
 *   }
 * }
 * ```
 *
 * @output 成功回應（無啟用 LOGO）
 * ```json
 * {
 *   "success": true,
 *   "data": null
 * }
 * ```
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$companyId = isset($_GET['company_id']) ? (int)$_GET['company_id'] : 0;

if ($companyId <= 0) {
    jsonResponse(['success' => false, 'message' => '請提供有效的公司 ID。'], 400);
}

$pdo = db();

// 取得使用中的 LOGO
$stmt = $pdo->prepare("
    SELECT id, file_path
    FROM company_logos
    WHERE company_id = :company_id AND is_active = 1 AND deleted_at IS NULL
    LIMIT 1
");
$stmt->execute(['company_id' => $companyId]);
$logo = $stmt->fetch(PDO::FETCH_ASSOC);

if ($logo) {
    // 產生完整 URL（相對於網站根目錄）
    $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'], 2), '/');
    $fileUrl = $baseUrl . '/' . $logo['file_path'];

    jsonResponse([
        'success' => true,
        'data' => [
            'id' => (int)$logo['id'],
            'file_path' => $logo['file_path'],
            'file_url' => $fileUrl,
        ],
    ]);
} else {
    jsonResponse([
        'success' => true,
        'data' => null,
    ]);
}
