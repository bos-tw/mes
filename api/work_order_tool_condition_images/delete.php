<?php
declare(strict_types=1);

require_once __DIR__ . '/../work_order_execution_image_common.php';

requireAuth();
requireMethod('DELETE');

$pdo = db();
$tableName = 'work_order_tool_condition_images';
$input = getJsonInput();
if ($input === [] && !empty($_POST)) {
    $input = $_POST;
}

$id = (int)($input['id'] ?? ($_GET['id'] ?? 0));
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的圖片ID。'], 400);
}

$record = findExecutionImageRecord($pdo, $tableName, $id);
if (!$record) {
    jsonResponse(['success' => false, 'message' => '找不到該圖片。'], 404);
}

try {
    $stmt = $pdo->prepare("UPDATE {$tableName} SET deleted_at = NOW() WHERE id = :id");
    $stmt->execute(['id' => $id]);
    logAuditAction('Deleted tool condition work order image', $tableName, $id, ['old_data' => $record]);
    jsonResponse(['success' => true, 'message' => '載具狀況圖片已刪除。']);
} catch (Exception $e) {
    error_log('Delete tool condition image failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '刪除失敗，請稍後重試。')], 500);
}
