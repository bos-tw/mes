<?php
/**
 * 退貨品項列表與新增 API。
 *
 * @endpoint GET|POST /api/return_order_items/index.php
 * @auth 必須登入且具退貨單權限
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
$method = requireMethod(['GET', 'POST']);
$pdo = db();

if ($method === 'GET') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['perPage'] ?? 20)));
    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $returnOrderId = (int)($_GET['return_order_id'] ?? 0);
    $where = ['ro.deleted_at IS NULL'];
    $params = [];

    if ($returnOrderId > 0) {
        $where[] = 'roi.return_order_id = :return_order_id';
        $params['return_order_id'] = $returnOrderId;
    }
    if ($keyword !== '') {
        $where[] = '(ro.return_order_number LIKE :keyword OR so.shipping_order_number LIKE :keyword OR ii.inventory_number LIKE :keyword OR ii.customer_batch_number LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    $whereSql = implode(' AND ', $where);
    $countStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM return_order_items roi
        INNER JOIN return_orders ro ON ro.id = roi.return_order_id
        INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
        INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id
        LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
        WHERE {$whereSql}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = getReturnOrderItemSelectSql() . " WHERE {$whereSql} ORDER BY roi.created_at DESC, roi.id DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', ($page - 1) * $perPage, PDO::PARAM_INT);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'data' => array_map('transformReturnOrderItem', $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []),
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ]);
}

$payload = readReturnOrderItemPayload();
$validation = validateReturnOrderItemData($payload);
if ($validation['errors'] !== []) {
    jsonResponse(['success' => false, 'message' => '欄位驗證失敗。', 'errors' => $validation['errors']], 422);
}
$data = $validation['data'];

try {
    $pdo->beginTransaction();
    $business = validateReturnOrderItemBusinessRules(
        $pdo,
        (int)$data['return_order_id'],
        (int)$data['shipping_order_item_id'],
        (float)$data['returned_quantity']
    );
    if ($business['errors'] !== []) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => implode('；', array_values($business['errors'])), 'errors' => $business['errors']], 409);
    }

    $pdo->prepare("
        INSERT INTO return_order_items
            (return_order_id, shipping_order_item_id, returned_quantity, returned_unit, reason)
        VALUES (?, ?, ?, ?, ?)
    ")->execute([
        $data['return_order_id'],
        $data['shipping_order_item_id'],
        $data['returned_quantity'],
        $data['returned_unit'],
        $data['reason'] ?? null,
    ]);
    $id = (int)$pdo->lastInsertId();
    recordReturnOrderItemInventorySource($pdo, $id, $business['source'] ?? []);

    recalculateShippingOrderReturnStatus($pdo, (int)$business['source']['shipping_order_id']);
    $pdo->commit();
    logAuditAction('create', 'return_order_items', $id, $data);

    jsonResponse([
        'success' => true,
        'message' => '退貨品項已新增。',
        'data' => transformReturnOrderItem(findReturnOrderItem($pdo, $id) ?: ['id' => $id] + $data),
    ], 201);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(handleReturnOrderItemWriteException($exception), 500);
}
