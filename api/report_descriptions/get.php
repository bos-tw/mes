<?php
/**
 * @deprecated 請使用標準端點 GET /api/report_descriptions/show.php
 * @see show.php
 */
declare(strict_types=1);
require __DIR__ . '/show.php';


header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();

    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    $reportCode = isset($_GET['report_code']) ? trim($_GET['report_code']) : '';

    if ($id <= 0 && empty($reportCode)) {
        throw new Exception('請提供 id 或 report_code');
    }

    if ($id > 0) {
        $sql = "SELECT * FROM report_descriptions WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
    } else {
        $sql = "SELECT * FROM report_descriptions WHERE report_code = ? AND is_active = 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$reportCode]);
    }

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$data) {
        throw new Exception('找不到指定的報表說明');
    }

    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Report description get failed: ' . $e->getMessage());
    http_response_code($e->getMessage() === '找不到指定的報表說明' ? 404 : 400);
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '查詢報表說明失敗，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
