<?php
/**
 * 部門管理 API - 刪除端點
 *
 * 提供部門資料的軟刪除功能（設定 deleted_at）。
 *
 * @endpoint DELETE /api/departments/delete.php?id={id}
 *
 * @auth 必須登入
 * @table departments
 *
 * @input DELETE
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 部門 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "部門資料已刪除。"
 * }
 * ```
 *
 * @error 400 請提供有效的部門 ID
 * @error 404 找不到對應的部門資料
 * @error 405 不支援的請求方法
 *
 * @logic 使用軟刪除，設定 deleted_at 時間戳
 * @note 支援 POST + _method=DELETE 的方式覆寫 HTTP 方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的部門 ID。',
    ], 400);
}

$pdo = db();

if (!departmentExists($pdo, (int)$id)) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的部門資料。',
    ], 404);
}

// 檢查是否有關聯資料
$relatedTables = [
    ['table' => 'employees', 'column' => 'department_id', 'label' => '員工', 'softDelete' => true],
    ['table' => 'machines', 'column' => 'department_id', 'label' => '機台設備'],
    ['table' => 'departments', 'column' => 'parent_department_id', 'label' => '子部門', 'softDelete' => true],
    ['table' => 'quality_issue_reports', 'column' => 'responsible_department_id', 'label' => '品質異常報告'],
];
$relatedLabels = [];
foreach ($relatedTables as $rel) {
    $softDeleteCondition = isset($rel['softDelete']) && $rel['softDelete'] ? ' AND deleted_at IS NULL' : '';
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?{$softDeleteCondition}");
    $checkStmt->execute([$id]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        $relatedLabels[] = $rel['label'];
    }
}
if (!empty($relatedLabels)) {
    jsonResponse([
        'success' => false,
        'message' => '此部門有相關的' . implode('、', $relatedLabels) . '資料，請先處理相關資料後再刪除部門。',
    ], 409);
}

try {
    $stmt = $pdo->prepare('UPDATE departments SET deleted_at = NOW(), delete_token = id WHERE id = :id AND deleted_at IS NULL');
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的部門資料。',
        ], 404);
    }
} catch (PDOException $exception) {
    handleDepartmentPdoWriteException($exception);
}

jsonResponse([
    'success' => true,
    'message' => '部門資料已刪除。',
]);
