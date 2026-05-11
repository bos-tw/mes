<?php
/**
 * 生產品質檢驗 API - 列表與新增
 *
 * 管理生產過程中的品質檢驗記錄。
 *
 * @endpoint GET  /api/production_quality_records  取得檢驗記錄列表
 * @endpoint POST /api/production_quality_records  建立新檢驗記錄
 *
 * @auth 必須登入
 *
 * @table production_quality_records  主表
 * @table production_records          關聯 - 生產記錄
 * @table work_orders                 關聯 - 工單
 * @table employees                   關聯 - 檢驗員
 *
 * @input GET 參數:
 * | 參數          | 類型   | 必填 | 預設                  | 說明                |
 * |---------------|--------|-----|----------------------|--------------------|
 * | keyword       | string | 否  |                      | 搜尋工單號/檢驗員/結果/備註 |
 * | page          | int    | 否  | 1                    | 頁碼              |
 * | perPage       | int    | 否  | 10                   | 每頁筆數 (max 100) |
 * | sortField     | string | 否  | inspection_datetime  | 排序欄位           |
 * | sortDirection | string | 否  | desc                 | asc/desc          |
 *
 * @input POST JSON:
 * | 參數                  | 類型     | 必填 | 說明              |
 * |-----------------------|----------|-----|-----------------|
 * | production_record_id  | int      | 是  | 生產記錄 ID       |
 * | inspection_datetime   | datetime | 是  | 檢驗時間          |
 * | inspector_id          | int      | 是  | 檢驗員 ID         |
 * | sample_quantity_pcs   | int      | 是  | 抽樣數量 (≥0)     |
 * | defective_quantity_pcs| int      | 是  | 不良數量 (≥0)     |
 * | inspection_result     | string   | 否  | 檢驗結果          |
 * | rework_needed         | bool     | 否  | 是否需要重工       |
 *
 * @see /api/production_quality_records/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListQualityRecords();
        break;
    case 'POST':
        handleCreateQualityRecord();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListQualityRecords(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = [];
    $params = [];

    $sortableColumns = [
        'id' => 'pqr.id',
        'inspection_datetime' => 'pqr.inspection_datetime',
        'sample_quantity_pcs' => 'pqr.sample_quantity_pcs',
        'defective_quantity_pcs' => 'pqr.defective_quantity_pcs',
        'rejection_rate_ppm' => 'pqr.rejection_rate_ppm',
        'rework_needed' => 'pqr.rework_needed',
        'created_at' => 'pqr.created_at',
    ];

    $requestedSortField = trim((string)($_GET['sortField'] ?? ''));
    $requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'desc'));

    $sortColumn = $sortableColumns[$requestedSortField] ?? 'pqr.inspection_datetime';
    $sortDirection = $requestedSortDirection === 'asc' ? 'ASC' : 'DESC';

    if ($keyword !== '') {
        $searchableColumns = [
            'wo.work_order_number',
            'emp.name',
            'pqr.inspection_result',
            'pqr.notes',
        ];

        $likeParts = [];
        foreach ($searchableColumns as $index => $column) {
            $paramName = 'keyword_' . $index;
            $likeParts[] = sprintf('%s LIKE :%s', $column, $paramName);
            $params[$paramName] = '%' . $keyword . '%';
        }

        if ($likeParts !== []) {
            $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
        }
    }

    $where = empty($conditions) ? '' : 'WHERE ' . implode(' AND ', $conditions);

    $countStmt = $pdo->prepare(sprintf(
        'SELECT COUNT(*) as total_count
         FROM production_quality_records pqr
         LEFT JOIN production_records pr ON pqr.production_record_id = pr.id
         LEFT JOIN work_orders wo ON pr.work_order_id = wo.id
         LEFT JOIN employees emp ON pqr.inspector_id = emp.id
         %s',
        $where
    ));

    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total_count'];

    $totalPages = (int)ceil($totalCount / $perPage);
    $offset = ($page - 1) * $perPage;

    $dataStmt = $pdo->prepare(sprintf(
        'SELECT
            pqr.id,
            pqr.production_record_id,
            pqr.inspection_datetime,
            pqr.inspector_id,
            pqr.sample_quantity_pcs,
            pqr.defective_quantity_pcs,
            pqr.rejection_rate_ppm,
            pqr.inspection_result,
            pqr.rework_needed,
            pqr.notes,
            pqr.created_at,
            pqr.updated_at,
            pr.card_number,
            pr.weight_kg,
            wo.id as work_order_id,
            wo.work_order_number,
            emp.name as inspector_name
         FROM production_quality_records pqr
         LEFT JOIN production_records pr ON pqr.production_record_id = pr.id
         LEFT JOIN work_orders wo ON pr.work_order_id = wo.id
         LEFT JOIN employees emp ON pqr.inspector_id = emp.id
         %s
         ORDER BY %s %s
         LIMIT :limit OFFSET :offset',
        $where,
        $sortColumn,
        $sortDirection
    ));

    foreach ($params as $key => $value) {
        $dataStmt->bindValue(':' . $key, $value);
    }
    $dataStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $dataStmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $dataStmt->execute();
    $records = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $records,
        'pagination' => [
            'total_count' => $totalCount,
            'total_pages' => $totalPages,
            'current_page' => $page,
            'per_page' => $perPage,
        ],
    ]);
}

function handleCreateQualityRecord(): void
{
    $data = readQualityRecordPayload();
    $pdo = db();

    // 驗證資料
    $validation = validateQualityRecord($data);
    if (!$validation['valid']) {
        jsonResponse([
            'success' => false,
            'message' => implode('; ', $validation['errors']),
        ], 400);
        return;
    }

    // 驗證 production_record_id 是否存在
    $checkStmt = $pdo->prepare('SELECT id FROM production_records WHERE id = :id');
    $checkStmt->execute(['id' => $data['production_record_id']]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '指定的生產紀錄不存在。',
        ], 400);
        return;
    }

    // 驗證 inspector_id 是否存在
    $checkStmt = $pdo->prepare('SELECT id FROM employees WHERE id = :id');
    $checkStmt->execute(['id' => $data['inspector_id']]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '指定的檢驗員不存在。',
        ], 400);
        return;
    }

    // 計算不良率
    $sampleQty = (int)($data['sample_quantity_pcs'] ?? 0);
    $defectiveQty = (int)($data['defective_quantity_pcs'] ?? 0);
    $rejectionRatePpm = calculateRejectionRatePpm($sampleQty, $defectiveQty);

    // 取得下一個 ID
    $nextIdStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM production_quality_records');
    $nextId = (int)$nextIdStmt->fetch(PDO::FETCH_ASSOC)['next_id'];

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
            'INSERT INTO production_quality_records (
                id, production_record_id, inspection_datetime, inspector_id,
                sample_quantity_pcs, defective_quantity_pcs, rejection_rate_ppm,
                inspection_result, rework_needed, notes
            ) VALUES (
                :id, :production_record_id, :inspection_datetime, :inspector_id,
                :sample_quantity_pcs, :defective_quantity_pcs, :rejection_rate_ppm,
                :inspection_result, :rework_needed, :notes
            )'
        );

        $stmt->execute([
            'id' => $nextId,
            'production_record_id' => $data['production_record_id'],
            'inspection_datetime' => $data['inspection_datetime'],
            'inspector_id' => $data['inspector_id'],
            'sample_quantity_pcs' => $sampleQty,
            'defective_quantity_pcs' => $defectiveQty,
            'rejection_rate_ppm' => $rejectionRatePpm,
            'inspection_result' => $data['inspection_result'] ?? null,
            'rework_needed' => (int)($data['rework_needed'] ?? 0),
            'notes' => $data['notes'] ?? null,
        ]);

        // 記錄操作日誌
        logAuditAction(
            '新增生產品質檢驗紀錄',
            'production_quality_records',
            $nextId,
            $data
        );

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '生產品質檢驗紀錄已新增。',
            'data' => ['id' => $nextId],
        ], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Create quality record failed: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '新增生產品質檢驗紀錄失敗。',
        ], 500);
    }
}
