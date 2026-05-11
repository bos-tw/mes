<?php
/**
 * 首件尺寸管理 API - 列表與新增端點
 *
 * 提供工單首件尺寸紀錄的列表查詢（含分頁、篩選、排序）及新增功能。
 *
 * @endpoint GET  /api/work_order_first_piece_dimensions/          取得首件尺寸列表
 * @endpoint POST /api/work_order_first_piece_dimensions/          新增首件尺寸紀錄
 *
 * @auth 必須登入
 * @table work_order_first_piece_dimensions, work_orders, order_items, orders, customers, screening_items, employees
 *
 * @input GET (Query string)
 * | 參數                    | 類型   | 必填 | 說明 |
 * |-------------------------|--------|------|------|
 * | page                    | int    | N    | 頁碼，預設 1 |
 * | limit                   | int    | N    | 每頁筆數，預設 20 |
 * | keyword                 | string | N    | 關鍵字搜尋 |
 * | start_date              | string | N    | 量測日期起始 |
 * | end_date                | string | N    | 量測日期結束 |
 * | work_order_id           | int    | N    | 依工單 ID 篩選 |
 * | measured_by_employee_id | int    | N    | 依量測人員 ID 篩選 |
 * | sort_field              | string | N    | 排序欄位 |
 * | sort_direction          | string | N    | 排序方向（ASC/DESC）|
 *
 * @input POST (JSON body)
 * | 參數                    | 類型    | 必填 | 說明 |
 * |-------------------------|---------|------|------|
 * | work_order_id           | int     | Y    | 工單 ID |
 * | measured_at             | string  | N    | 量測時間 |
 * | measured_by_employee_id | int     | N    | 量測人員 ID |
 * | head_height             | decimal | N    | 頭高 |
 * | head_width              | decimal | N    | 頭寬 |
 * | length                  | decimal | N    | 長度 |
 * | thread_outer_diameter   | decimal | N    | 螺牙外徑 |
 * | washer_diameter         | decimal | N    | 墨片徑 |
 * | outer_diameter          | decimal | N    | 外徑 |
 * | hole_diameter           | decimal | N    | 孔徑 |
 * | thickness               | decimal | N    | 厚度 |
 * | notes                   | string  | N    | 備註 |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "work_order_number": "WO-001",
 *     "customer_batch_number": "B-001",
 *     "measured_at": "2024-01-01T10:00",
 *     "measured_by_name": "張三"
 *   }],
 *   "pagination": {"page": 1, "limit": 20, "total": 100, "totalPages": 5}
 * }
 * ```
 *
 * @error 400 請提供工單 ID
 * @error 404 找不到指定的工單
 * @error 405 不支援的請求方法
 * @error 500 新增失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleGetList($pdo);
        break;
    case 'POST':
        handleCreate($pdo);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

function handleGetList(PDO $pdo): void
{
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $startDate = isset($_GET['start_date']) ? trim($_GET['start_date']) : '';
    $endDate = isset($_GET['end_date']) ? trim($_GET['end_date']) : '';
    $workOrderId = isset($_GET['work_order_id']) ? (int)$_GET['work_order_id'] : 0;
    $measuredByEmployeeId = isset($_GET['measured_by_employee_id']) ? (int)$_GET['measured_by_employee_id'] : 0;
    $sortField = isset($_GET['sort_field']) ? trim($_GET['sort_field']) : 'measured_at';
    $sortDirection = isset($_GET['sort_direction']) && strtoupper($_GET['sort_direction']) === 'ASC' ? 'ASC' : 'DESC';

    // 驗證排序欄位
    $allowedSortFields = [
        'id' => 'fpd.id',
        'work_order_number' => 'wo.work_order_number',
        'customer_batch_number' => 'oi.customer_batch_number',
        'measured_at' => 'fpd.measured_at',
        'measured_by_name' => 'e.name'
    ];
    $sortColumn = $allowedSortFields[$sortField] ?? 'fpd.measured_at';

    $offset = ($page - 1) * $limit;

    $whereClauses = ["1=1"];
    $params = [];

    if ($keyword) {
        $whereClauses[] = "(wo.work_order_number LIKE :keyword OR oi.customer_batch_number LIKE :keyword OR fpd.notes LIKE :keyword)";
        $params['keyword'] = "%$keyword%";
    }

    if ($startDate) {
        $whereClauses[] = "DATE(fpd.measured_at) >= :start_date";
        $params['start_date'] = $startDate;
    }

    if ($endDate) {
        $whereClauses[] = "DATE(fpd.measured_at) <= :end_date";
        $params['end_date'] = $endDate;
    }

    if ($workOrderId > 0) {
        $whereClauses[] = "fpd.work_order_id = :work_order_id";
        $params['work_order_id'] = $workOrderId;
    }

    if ($measuredByEmployeeId > 0) {
        $whereClauses[] = "fpd.measured_by_employee_id = :measured_by_employee_id";
        $params['measured_by_employee_id'] = $measuredByEmployeeId;
    }

    $whereSql = implode(' AND ', $whereClauses);

    // Count total
    $countSql = "
        SELECT COUNT(*)
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN work_orders wo ON fpd.work_order_id = wo.id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        WHERE $whereSql
    ";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // Fetch data with related info
    $sql = "
        SELECT
            fpd.*,
            wo.work_order_number,
            wo.status AS work_order_status,
            e.name AS measured_by_name,
            oi.customer_batch_number,
            c.name AS customer_name,
            si.name AS screening_item_name
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN work_orders wo ON fpd.work_order_id = wo.id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN employees e ON fpd.measured_by_employee_id = e.id
        WHERE $whereSql
        ORDER BY $sortColumn $sortDirection, fpd.id DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / $limit)
        ]
    ]);
}

function handleCreate(PDO $pdo): void
{
    $input = getJsonInput();
    if (empty($input)) {
        $input = $_POST;
    }

    $workOrderId = isset($input['work_order_id']) ? (int)$input['work_order_id'] : 0;
    if ($workOrderId <= 0) {
        jsonResponse(['success' => false, 'message' => '請選擇工單。'], 400);
    }

    // Check if work order exists
    $stmt = $pdo->prepare("SELECT id FROM work_orders WHERE id = ?");
    $stmt->execute([$workOrderId]);
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '工單不存在。'], 404);
    }

    // Prepare data
    $fields = [
        'work_order_id', 'measured_at', 'measured_by_employee_id', 'notes',
        'head_height', 'head_width', 'length', 'thread_outer_diameter',
        'washer_diameter', 'outer_diameter', 'hole_diameter', 'thickness'
    ];

    $data = [];
    foreach ($fields as $field) {
        if (isset($input[$field]) && $input[$field] !== '') {
            $data[$field] = $input[$field];
        } else {
            $data[$field] = null;
        }
    }

    // Ensure work_order_id is set
    $data['work_order_id'] = $workOrderId;

    try {
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $sql = "INSERT INTO work_order_first_piece_dimensions ($columns) VALUES ($placeholders)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));
        $lastId = $pdo->lastInsertId();
        $id = $lastId !== false ? (int)$lastId : null;

        logAuditAction('Create First Piece Dimension', 'work_order_first_piece_dimensions', $id, $data);

        jsonResponse([
            'success' => true,
            'message' => '新增成功。',
            'id' => $id
        ]);
    } catch (Exception $e) {
        error_log('First piece dimension create failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '新增失敗，請稍後重試。')], 500);
    }
}
