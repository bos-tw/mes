<?php
/**
 * 列印報表說明 - 刪除 API
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireMethod('DELETE');
requireAuth();

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();

    $input = getJsonInput();

    if (empty($input['id'])) {
        throw new Exception('請提供 id');
    }

    $sql = "DELETE FROM report_descriptions WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([intval($input['id'])]);

    if ($stmt->rowCount() === 0) {
        throw new Exception('找不到指定的記錄');
    }

    echo json_encode([
        'success' => true,
        'message' => '刪除成功'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Report description delete failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '刪除報表說明失敗，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
