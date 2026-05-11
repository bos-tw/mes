<?php
/**
 * 列印報表說明 - 更新 API
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireMethod('PUT');
requireAuth();

header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();

    $input = getJsonInput();

    if (empty($input['id'])) {
        throw new Exception('請提供 id');
    }

    if (empty($input['report_code']) || empty($input['report_name'])) {
        throw new Exception('報表代碼和報表名稱為必填');
    }

    // 檢查代碼是否重複（排除自己）
    $checkSql = "SELECT COUNT(*) FROM report_descriptions WHERE report_code = ? AND id != ?";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([$input['report_code'], $input['id']]);
    if ($checkStmt->fetchColumn() > 0) {
        throw new Exception('報表代碼已被其他記錄使用');
    }

    $sql = "UPDATE report_descriptions SET
                report_code = ?,
                report_name = ?,
                report_name_en = ?,
                description = ?,
                description_en = ?,
                is_active = ?
            WHERE id = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        trim($input['report_code']),
        trim($input['report_name']),
        trim($input['report_name_en'] ?? ''),
        trim($input['description'] ?? ''),
        trim($input['description_en'] ?? ''),
        isset($input['is_active']) ? intval($input['is_active']) : 1,
        intval($input['id'])
    ]);

    echo json_encode([
        'success' => true,
        'message' => '更新成功'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Report description update failed: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '更新報表說明失敗，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
