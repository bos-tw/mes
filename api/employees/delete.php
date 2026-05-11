<?php
/**
 * 員工管理 API - 刪除端點
 *
 * 提供員工資料的軟刪除功能（設定 deleted_at）。
 *
 * @endpoint DELETE /api/employees/delete.php?id={id}
 *
 * @auth 必須登入
 * @table employees
 *
 * @input DELETE
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 員工 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "員工資料已刪除。"
 * }
 * ```
 *
 * @error 400 請提供有效的員工 ID
 * @error 404 找不到對應的員工資料
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
        'message' => '請提供有效的員工 ID。',
    ], 400);
}

$pdo = db();

$employee = findEmployee($pdo, (int)$id);
if (!$employee) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的員工資料。',
    ], 404);
}

// 檢查是否有關聯資料
$relatedTables = [
    ['table' => 'employee_roles', 'column' => 'employee_id', 'label' => '角色指派'],
    ['table' => 'daily_machine_inspections', 'column' => 'inspector_id', 'label' => '機台檢驗'],
    ['table' => 'production_records', 'column' => 'employee_id', 'label' => '生產紀錄'],
    ['table' => 'production_quality_records', 'column' => 'inspector_id', 'label' => '品質檢驗'],
    ['table' => 'quality_issue_reports', 'column' => 'reported_by_employee_id', 'label' => '品質異常報告'],
    ['table' => 'shipping_quality_inspections', 'column' => 'inspector_id', 'label' => '出貨品質檢驗'],
    ['table' => 'calendar_event_participants', 'column' => 'employee_id', 'label' => '行事曆事件'],
    ['table' => 'dashboard_calendar_events', 'column' => 'created_by_employee_id', 'label' => '行事曆事件', 'softDelete' => true],
    ['table' => 'inventory_transactions', 'column' => 'created_by_employee_id', 'label' => '庫存交易'],
    ['table' => 'work_order_first_piece_dimensions', 'column' => 'measured_by_employee_id', 'label' => '首件尺寸紀錄'],
];
$relatedLabels = [];
foreach ($relatedTables as $rel) {
    $softDeleteCondition = isset($rel['softDelete']) && $rel['softDelete'] ? ' AND deleted_at IS NULL' : '';
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?{$softDeleteCondition}");
    $checkStmt->execute([$id]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        if (!in_array($rel['label'], $relatedLabels)) {
            $relatedLabels[] = $rel['label'];
        }
    }
}
if (!empty($relatedLabels)) {
    jsonResponse([
        'success' => false,
        'message' => '此員工有相關的' . implode('、', $relatedLabels) . '資料，請先處理相關資料後再刪除員工。',
    ], 409);
}

$sql = 'UPDATE employees SET deleted_at = :deleted_at, delete_token = id WHERE id = :id AND deleted_at IS NULL';

try {
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':deleted_at', currentTimestamp(), PDO::PARAM_STR);
    $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $stmt->execute();
} catch (PDOException $exception) {
    handleEmployeeWriteException($exception);
}

jsonResponse([
    'success' => true,
    'message' => '員工資料已刪除。',
]);
