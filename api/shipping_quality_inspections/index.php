<?php
declare(strict_types=1);
/**
 * shipping_quality_inspections API — 列表 & 新增
 *
 * GET  /api/shipping_quality_inspections/          取得出貨品質檢驗列表（含分頁）
 * POST /api/shipping_quality_inspections/          新增出貨品質檢驗
 *
 * @file   api/shipping_quality_inspections/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListShippingQualityInspections();
        break;
    case 'POST':
        handleCreateShippingQualityInspection();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得出貨品質檢驗列表
 * ====================== */
function handleListShippingQualityInspections(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('shipping_quality_inspections/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依出貨單篩選
    if (!empty($_GET['shipping_order_id'])) {
        $where[]  = 'sqi.shipping_order_id = :shipping_order_id';
        $params[':shipping_order_id'] = (int)$_GET['shipping_order_id'];
    }

    // 依檢驗結果篩選
    if (!empty($_GET['inspection_result'])) {
        $where[]  = 'sqi.inspection_result = :inspection_result';
        $params[':inspection_result'] = $_GET['inspection_result'];
    }

    // 依日期範圍篩選
    if (!empty($_GET['date_from'])) {
        $where[]  = 'DATE(sqi.inspection_datetime) >= :date_from';
        $params[':date_from'] = $_GET['date_from'];
    }
    if (!empty($_GET['date_to'])) {
        $where[]  = 'DATE(sqi.inspection_datetime) <= :date_to';
        $params[':date_to'] = $_GET['date_to'];
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM shipping_quality_inspections sqi $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT sqi.*,
       so.shipping_order_number AS shipping_order_number,
       e.employee_number AS inspector_number,
       e.name AS inspector_name
  FROM shipping_quality_inspections sqi
  LEFT JOIN shipping_orders so ON so.id = sqi.shipping_order_id
  LEFT JOIN employees e ON e.id = sqi.inspector_id
  $whereSql
 ORDER BY sqi.inspection_datetime DESC
 LIMIT :limit OFFSET :offset
SQL;
    $stmt = $pdo->prepare($sql);
    foreach ($params as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $data = array_map('transformShippingQualityInspection', $rows);

    // 取得下拉選單資料
    $shippingOrders = getShippingOrdersForSqi($pdo);
    $employees      = getEmployeesForSqi($pdo);

    jsonResponse([
        'success'        => true,
        'data'           => $data,
        'pagination'     => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
        'shippingOrders' => $shippingOrders,
        'employees'      => $employees,
        'resultOptions'  => getInspectionResultOptions(),
    ]);
}

/* ======================
 * POST — 新增出貨品質檢驗
 * ====================== */
function handleCreateShippingQualityInspection(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('shipping_quality_inspections/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readShippingQualityInspectionPayload();

    $errors = validateShippingQualityInspectionData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查出貨單是否存在
    if (!shippingOrderExistsForSqi($pdo, $data['shipping_order_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的出貨單不存在'], 400);
    }

    // 檢查檢驗員是否存在
    if (!employeeExistsForSqi($pdo, $data['inspector_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的檢驗員不存在'], 400);
    }

    // 計算 PPM
    $ppm = $data['sample_quantity_pcs'] > 0
        ? ($data['defective_quantity_pcs'] / $data['sample_quantity_pcs']) * 1000000
        : 0;

    try {
        $sql = <<<SQL
INSERT INTO shipping_quality_inspections (
    id, shipping_order_id, inspection_datetime, inspector_id,
    sample_quantity_pcs, defective_quantity_pcs, rejection_rate_ppm,
    inspection_result, notes
) VALUES (
    :id, :shipping_order_id, :inspection_datetime, :inspector_id,
    :sample_quantity_pcs, :defective_quantity_pcs, :rejection_rate_ppm,
    :inspection_result, :notes
)
SQL;
        // 生成 ID
        $idStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM shipping_quality_inspections');
        $newId = (int)$idStmt->fetchColumn();

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'                     => $newId,
            ':shipping_order_id'      => $data['shipping_order_id'],
            ':inspection_datetime'    => $data['inspection_datetime'],
            ':inspector_id'           => $data['inspector_id'],
            ':sample_quantity_pcs'    => $data['sample_quantity_pcs'],
            ':defective_quantity_pcs' => $data['defective_quantity_pcs'],
            ':rejection_rate_ppm'     => $ppm,
            ':inspection_result'      => $data['inspection_result'],
            ':notes'                  => $data['notes'] ?: null,
        ]);

        $record = findShippingQualityInspection($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '出貨品質檢驗新增成功',
            'data'    => $record ? transformShippingQualityInspection($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Shipping quality inspection create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
