<?php
/**
 * 列印報表說明 API - 取得單筆
 *
 * @endpoint GET /api/report_descriptions/show.php  取得單筆報表說明
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數         | 類型   | 必填 | 說明                    |
 * |-------------|--------|-----|------------------------|
 * | id          | int    | 否  | 報表說明 ID（與 report_code 擇一） |
 * | report_code | string | 否  | 報表代碼（回傳 is_active=1 的記錄） |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireMethod('GET');
requireAuth();

header('Content-Type: application/json; charset=utf-8');

$pdo = db();

$id         = (int)($_GET['id'] ?? 0);
$reportCode = trim((string)($_GET['report_code'] ?? ''));

if ($id <= 0 && $reportCode === '') {
    jsonResponse(['success' => false, 'message' => '請提供 id 或 report_code。'], 400);
}

ensureDefaultReportDescriptions($pdo);

if ($id > 0) {
    $stmt = $pdo->prepare('SELECT * FROM report_descriptions WHERE id = ?');
    $stmt->execute([$id]);
} else {
    $stmt = $pdo->prepare('SELECT * FROM report_descriptions WHERE report_code = ? AND is_active = 1');
    $stmt->execute([$reportCode]);
}

$data = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$data) {
    jsonResponse(['success' => false, 'message' => '找不到指定的報表說明。'], 404);
}

jsonResponse(['success' => true, 'data' => $data]);

/**
 * 補齊核心報表預設資料，避免列印頁與設定頁讀取不到 report_code。
 */
function ensureDefaultReportDescriptions(PDO $pdo): void
{
    $defaults = [
        ['screening_inspection', '篩分檢驗結果報表', 'Screening Inspection Report'],
        ['shipping_order', '出貨單', 'Shipping Order'],
        ['return_order', '退貨單', 'Return Order'],
        ['work_order', '生產命令單', 'Production Work Order'],
        ['order_confirmation', '客戶光篩代工委託確認單', 'Customer Optical Screening Outsourcing Confirmation'],
    ];

    $existsStmt = $pdo->prepare('SELECT id FROM report_descriptions WHERE report_code = ? LIMIT 1');
    $insertStmt = $pdo->prepare(
        'INSERT INTO report_descriptions
            (report_code, report_name, report_name_en, description, description_en, is_active)
         VALUES (?, ?, ?, ?, ?, 1)'
    );

    foreach ($defaults as $row) {
        [$code, $name, $nameEn] = $row;
        $existsStmt->execute([$code]);
        if ($existsStmt->fetchColumn()) {
            continue;
        }
        $insertStmt->execute([$code, $name, $nameEn, '', '']);
    }
}
