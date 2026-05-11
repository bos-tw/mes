<?php
/**
 * 稽核日誌 API - 批量刪除端點
 *
 * 提供稽核日誌的批量實體刪除功能。
 *
 * @endpoint DELETE /api/audit_logs/delete.php
 *
 * @auth 必須登入
 * @table audit_logs
 *
 * @input DELETE (JSON body)
 * | 參數 | 類型  | 必填 | 說明 |
 * |------|-------|------|------|
 * | ids  | int[] | Y    | 要刪除的日誌 ID 陣列 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "已刪除 5 筆操作日誌。",
 *   "deleted": [1, 2, 3, 4, 5]
 * }
 * ```
 *
 * @error 400 請提供要刪除的日誌 ID 陣列 / 請至少選擇一筆要刪除的日誌
 * @error 500 刪除操作日誌失敗
 *
 * @warning 此為實體刪除，資料將無法恢復
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

$payload = getJsonInput();
$ids = $payload['ids'] ?? [];

if (!is_array($ids)) {
    jsonResponse([
        'success' => false,
        'message' => '請提供要刪除的日誌 ID 陣列。',
    ], 400);
}

$normalizedIds = [];
foreach ($ids as $id) {
    $intId = filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($intId !== false) {
        $normalizedIds[] = $intId;
    }
}

$normalizedIds = array_values(array_unique($normalizedIds));

if ($normalizedIds === []) {
    jsonResponse([
        'success' => false,
        'message' => '請至少選擇一筆要刪除的日誌。',
    ], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $placeholders = implode(', ', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare('DELETE FROM audit_logs WHERE id IN (' . $placeholders . ')');
    $stmt->execute($normalizedIds);

    $affected = $stmt->rowCount();

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => sprintf('已刪除 %d 筆操作日誌。', $affected),
        'deleted' => $normalizedIds,
    ]);
} catch (Throwable $exception) {
    $pdo->rollBack();
    jsonResponse([
        'success' => false,
        'message' => '刪除操作日誌失敗，請稍後再試。',
        'error' => $exception->getMessage(),
    ], 500);
}
