<?php
/**
 * 退貨品項 API - 列表與新增
 *
 * @endpoint GET  /api/return_order_items/index.php  取得退貨品項列表
 * @endpoint POST /api/return_order_items/index.php  新增退貨品項
 *
 * @auth 必須登入
 * @table return_order_items, return_orders, order_items
 *
 * ========================================
 * GET - 取得列表
 * ========================================
 *
 * @input Query Parameters:
 * | 參數名稱        | 類型   | 必填 | 說明              |
 * |----------------|--------|------|-------------------|
 * | return_order_id| int    | 否   | 依退貨單篩選       |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [...]
 * }
 *
 * ========================================
 * POST - 新增退貨品項
 * ========================================
 *
 * @input Body Parameters (JSON):
 * | 參數名稱          | 類型    | 必填 | 說明            |
 * |------------------|---------|------|-----------------|
 * | return_order_id  | int     | 是   | 退貨單 ID       |
 * | order_item_id    | int     | 是   | 訂單品項 ID     |
 * | returned_quantity| decimal | 是   | 退貨數量        |
 * | returned_unit    | string  | 否   | 單位 (預設: 支) |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "退貨品項已新增。",
 *     "data": { "id": 123 }
 * }
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
$pdo = db();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleList($pdo);
        break;
    case 'POST':
        handleCreate($pdo);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * 處理列表查詢
 */
function handleList(PDO $pdo): void
{
    $returnOrderId = $_GET['return_order_id'] ?? '';

    $where = ['1=1'];
    $params = [];

    if ($returnOrderId !== '') {
        $where[] = 'roi.return_order_id = :return_order_id';
        $params['return_order_id'] = (int)$returnOrderId;
    }

    $whereClause = implode(' AND ', $where);

    $sql = "
        SELECT
            roi.*,
            oi.sub_item_number,
            oi.customer_batch_number,
            oi.part_number,
            si.name AS screening_item_name,
            ro.return_order_number
        FROM return_order_items roi
        LEFT JOIN order_items oi ON roi.order_item_id = oi.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN return_orders ro ON roi.return_order_id = ro.id
        WHERE {$whereClause}
        ORDER BY roi.id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $data,
    ]);
}

/**
 * 處理新增退貨品項
 */
function handleCreate(PDO $pdo): void
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonResponse(['success' => false, 'message' => '無效的請求資料。'], 400);
    }

    // 驗證必填欄位
    if (empty($input['return_order_id'])) {
        jsonResponse(['success' => false, 'message' => '退貨單 ID 為必填。'], 400);
    }
    if (empty($input['order_item_id'])) {
        jsonResponse(['success' => false, 'message' => '訂單品項 ID 為必填。'], 400);
    }
    if (!isset($input['returned_quantity']) || $input['returned_quantity'] <= 0) {
        jsonResponse(['success' => false, 'message' => '退貨數量必須大於 0。'], 400);
    }

    // 驗證退貨單存在
    $roStmt = $pdo->prepare("SELECT id FROM return_orders WHERE id = ? AND deleted_at IS NULL");
    $roStmt->execute([$input['return_order_id']]);
    if (!$roStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '退貨單不存在。'], 400);
    }

    // 驗證訂單品項存在
    $oiStmt = $pdo->prepare("SELECT id FROM order_items WHERE id = ?");
    $oiStmt->execute([$input['order_item_id']]);
    if (!$oiStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '訂單品項不存在。'], 400);
    }

    try {
        $id = (int)(microtime(true) * 10000) + random_int(0, 9999);

        $stmt = $pdo->prepare("
            INSERT INTO return_order_items (
                id, return_order_id, order_item_id, returned_quantity, returned_unit
            ) VALUES (
                :id, :return_order_id, :order_item_id, :returned_quantity, :returned_unit
            )
        ");

        $stmt->execute([
            'id' => $id,
            'return_order_id' => $input['return_order_id'],
            'order_item_id' => $input['order_item_id'],
            'returned_quantity' => $input['returned_quantity'],
            'returned_unit' => $input['returned_unit'] ?? '支',
        ]);

        jsonResponse([
            'success' => true,
            'message' => '退貨品項已新增。',
            'data' => ['id' => $id],
        ], 201);

    } catch (Exception $e) {
        error_log('Return order item create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增退貨品項失敗，請稍後重試。')], 500);
    }
}
