<?php
declare(strict_types=1);
/**
 * daily_machine_inspection_items API — 列表 & 新增
 *
 * GET  /api/daily_machine_inspection_items/          取得檢驗項目明細列表（含分頁）
 * POST /api/daily_machine_inspection_items/          新增檢驗項目明細
 *
 * @file   api/daily_machine_inspection_items/index.php
 */

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListInspectionItems();
        break;
    case 'POST':
        handleCreateInspectionItem();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/* ======================
 * GET — 取得檢驗項目明細列表
 * ====================== */
function handleListInspectionItems(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('daily_machine_inspection_items/index(list): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $where  = [];
    $params = [];

    // 依所屬檢驗紀錄篩選
    if (!empty($_GET['inspection_id'])) {
        $where[]  = 'dii.inspection_id = :inspection_id';
        $params[':inspection_id'] = (int)$_GET['inspection_id'];
    }

    // 依通過狀態篩選
    if (isset($_GET['is_pass']) && $_GET['is_pass'] !== '') {
        $where[]  = 'dii.is_pass = :is_pass';
        $params[':is_pass'] = (int)$_GET['is_pass'];
    }

    // 依項目名稱搜尋
    if (!empty($_GET['keyword'])) {
        $where[]  = 'dii.item_name LIKE :keyword';
        $params[':keyword'] = '%' . $_GET['keyword'] . '%';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // 總筆數
    $countSql = "SELECT COUNT(*) FROM daily_machine_inspection_items dii $whereSql";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // 取得資料
    $sql = <<<SQL
SELECT dii.*,
       di.inspection_date,
       m.machine_number AS machine_code,
       m.name AS machine_name
  FROM daily_machine_inspection_items dii
  LEFT JOIN daily_machine_inspections di ON di.id = dii.inspection_id
  LEFT JOIN machines m ON m.id = di.machine_id
  $whereSql
 ORDER BY di.inspection_date DESC, dii.id DESC
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

    $data = array_map('transformInspectionItem', $rows);

    // 取得下拉選單資料
    $inspections = getInspectionsForItem($pdo);

    jsonResponse([
        'success'     => true,
        'data'        => $data,
        'pagination'  => [
            'page'       => $page,
            'perPage'    => $perPage,
            'total'      => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
        'inspections' => $inspections,
    ]);
}

/* ======================
 * POST — 新增檢驗項目明細
 * ====================== */
function handleCreateInspectionItem(): void
{
    try {
        $pdo = db();
    } catch (Exception $e) {
        error_log('daily_machine_inspection_items/index(create): ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '資料庫連線失敗'], 500);
    }

    $data = readInspectionItemPayload();

    $errors = validateInspectionItemData($data);
    if ($errors) {
        jsonResponse(['success' => false, 'message' => implode('、', $errors)], 400);
    }

    // 檢查所屬檢驗紀錄是否存在
    if (!inspectionExistsForItem($pdo, $data['inspection_id'])) {
        jsonResponse(['success' => false, 'message' => '指定的每日檢驗紀錄不存在'], 400);
    }

    try {
        $sql = <<<SQL
INSERT INTO daily_machine_inspection_items (
    id, inspection_id, item_name, standard, actual_result, is_pass, remarks
) VALUES (
    :id, :inspection_id, :item_name, :standard, :actual_result, :is_pass, :remarks
)
SQL;
        // 生成 ID
        $idStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM daily_machine_inspection_items');
        $newId = (int)$idStmt->fetchColumn();

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'            => $newId,
            ':inspection_id' => $data['inspection_id'],
            ':item_name'     => $data['item_name'],
            ':standard'      => $data['standard'] ?: null,
            ':actual_result' => $data['actual_result'] ?: null,
            ':is_pass'       => $data['is_pass'] ? 1 : 0,
            ':remarks'       => $data['remarks'] ?: null,
        ]);

        $record = findInspectionItem($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '檢驗項目明細新增成功',
            'data'    => $record ? transformInspectionItem($record) : null,
        ], 201);
    } catch (PDOException $e) {
        error_log('Daily machine inspection item create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
