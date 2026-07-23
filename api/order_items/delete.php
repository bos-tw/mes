<?php
/**
 * 訂單品項 API - 刪除
 *
 * 軟刪除未進入後續流程的訂單品項，同時重新計算訂單總金額。
 *
 * @endpoint DELETE /api/order_items/delete.php?id={int}
 * @method POST + _method=delete (表單提交時使用)
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明       |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 訂單品項 ID |
 *
 * @logic 刪除流程:
 * 1. 驗證 ID 和品項存在性
 * 2. 設定 order_items.deleted_at，保留歷史識別與稽核追溯
 * 3. 重新計算訂單總金額 (recalculateOrderTotalAmount)
 * 4. 記錄稽核日誌
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "訂單品項已刪除。"
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 訂單品項不存在
 * @error 500 刪除過程發生錯誤
 *
 * @warning 已進入工單、庫存、出貨或退貨流程的品項會由 workflow guard 阻擋
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../common/workflow_guard.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('DELETE');

/**
 * 檢查資料表是否存在（避免不同環境 schema 漂移時直接 500）。
 */
function orderItemDeleteTableExists(PDO $pdo, string $table): bool
{
    static $cache = [];
    if (array_key_exists($table, $cache)) {
        return $cache[$table];
    }

    // 僅允許英數與底線，避免 SQL identifier 風險
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
        $cache[$table] = false;
        return false;
    }

    try {
        $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
        $stmt->execute([$table]);
        $cache[$table] = $stmt->fetchColumn() !== false;
    } catch (Throwable $exception) {
        $cache[$table] = false;
    }

    return $cache[$table];
}

/**
 * 檢查資料表欄位是否存在。
 */
function orderItemDeleteColumnExists(PDO $pdo, string $table, string $column): bool
{
    static $cache = [];
    $cacheKey = $table . '.' . $column;
    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }

    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table) || !preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
        $cache[$cacheKey] = false;
        return false;
    }

    if (!orderItemDeleteTableExists($pdo, $table)) {
        $cache[$cacheKey] = false;
        return false;
    }

    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
        $cache[$cacheKey] = $stmt !== false && $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    } catch (Throwable $exception) {
        $cache[$cacheKey] = false;
    }

    return $cache[$cacheKey];
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單品項 ID。',
    ], 400);
}

$pdo = db();

$orderItem = findOrderItem($pdo, $id);
if (!$orderItem) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的訂單品項資料。',
    ], 404);
}

$orderId = (int)$orderItem['order_id'];

$workflowGuard = getWorkflowDeleteAssessment($pdo, 'order_items', $id);
if (!$workflowGuard['allowed']) {
    jsonResponse([
        'success' => false,
        'message' => $workflowGuard['message'],
        'workflow_guard' => $workflowGuard,
    ], 409);
}

// 檢查是否有關聯資料
// order_item_tools / order_item_screening_details / drawings / attachments
// 由資料庫外鍵 ON DELETE CASCADE 處理，不需阻擋刪除。
$relatedTables = [
    ['table' => 'work_orders', 'column' => 'order_item_id', 'label' => '工單', 'softDelete' => true],
    ['table' => 'inventory_items', 'column' => 'order_item_id', 'label' => '庫存'],
    ['table' => 'shipping_order_items', 'column' => 'order_item_id', 'label' => '出貨品項'],
    ['table' => 'return_order_items', 'column' => 'order_item_id', 'label' => '退貨品項'],
];
$relatedLabels = [];
foreach ($relatedTables as $rel) {
    $table = (string)$rel['table'];
    $column = (string)$rel['column'];

    if (!orderItemDeleteTableExists($pdo, $table) || !orderItemDeleteColumnExists($pdo, $table, $column)) {
        continue;
    }

    $where = "`{$column}` = ?";
    if (
        isset($rel['softDelete'])
        && $rel['softDelete']
        && orderItemDeleteColumnExists($pdo, $table, 'deleted_at')
    ) {
        $where .= ' AND deleted_at IS NULL';
    }

    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM `{$table}` WHERE {$where}");
    $checkStmt->execute([$id]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        $relatedLabels[] = (string)$rel['label'];
    }
}
if (!empty($relatedLabels)) {
    jsonResponse([
        'success' => false,
        'message' => '此訂單品項有相關的' . implode('、', $relatedLabels) . '資料，請先刪除相關資料。',
    ], 409);
}

try {
    $pdo->beginTransaction();

    if (!softDeleteOrderItem($pdo, $id)) {
        throw new InvalidArgumentException('找不到對應的訂單品項資料。');
    }

    recalculateOrderTotalAmount($pdo, $orderId);

    logAuditAction('刪除訂單品項', 'OrderItems', $id, [
        'order_id' => $orderId,
    ]);

    $pdo->commit();
} catch (InvalidArgumentException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 404);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'message' => '刪除訂單品項時發生錯誤。',
        'error' => $exception->getMessage(),
    ], 500);
}

jsonResponse([
    'success' => true,
    'message' => '訂單品項已刪除。',
]);
