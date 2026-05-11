<?php
/**
 * 生產品質檢驗 API - 刪除
 *
 * 刪除指定的檢驗記錄（硬刪除）。
 *
 * @endpoint DELETE /api/production_quality_records/delete.php
 *
 * @auth 必須登入
 *
 * @input JSON Body:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 檢驗記錄 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "生產品質檢驗記錄已刪除。"
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 檢驗記錄不存在
 *
 * @warning 此操作為硬刪除，無法復原
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$data = readQualityRecordPayload();
$pdo = db();

if (empty($data['id'])) {
    jsonResponse([
        'success' => false,
        'message' => '缺少必要參數: id。',
    ], 400);
}

$id = (int)$data['id'];

// 檢查紀錄是否存在
$checkStmt = $pdo->prepare('SELECT * FROM production_quality_records WHERE id = :id');
$checkStmt->execute(['id' => $id]);
$record = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$record) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的生產品質檢驗紀錄。',
    ], 404);
}

try {
    $pdo->beginTransaction();

    // 硬刪除（品質檢驗紀錄通常不需要保留刪除記錄）
    $stmt = $pdo->prepare('DELETE FROM production_quality_records WHERE id = :id');
    $stmt->execute(['id' => $id]);

    // 記錄操作日誌
    logAuditAction(
        '刪除生產品質檢驗紀錄',
        'production_quality_records',
        $id,
        $record
    );

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '生產品質檢驗紀錄已刪除。',
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Delete quality record failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '刪除生產品質檢驗紀錄失敗。',
    ], 500);
}
