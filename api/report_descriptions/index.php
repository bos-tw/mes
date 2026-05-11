<?php
/**
 * 列印報表說明 API - 列表與新增
 *
 * @endpoint GET  /api/report_descriptions/  取得報表說明列表
 * @endpoint POST /api/report_descriptions/  新增報表說明
 *
 * @auth 必須登入
 *
 * @table report_descriptions  主表
 *
 * @input GET 參數:
 * | 參數       | 類型   | 必填 | 預設          | 說明           |
 * |-----------|--------|-----|--------------|----------------|
 * | keyword   | string | 否  |              | 搜尋代碼/名稱    |
 * | is_active | int    | 否  |              | 啟用狀態 0/1    |
 * | sort      | string | 否  | report_code  | 排序欄位        |
 * | order     | string | 否  | ASC          | 排序方向        |
 * | page      | int    | 否  | 1            | 頁碼           |
 * | per_page  | int    | 否  | 20           | 每頁筆數(max 100) |
 *
 * @input POST JSON:
 * | 參數             | 類型   | 必填 | 說明          |
 * |-----------------|--------|-----|--------------|
 * | report_code     | string | 是  | 報表代碼（唯一）|
 * | report_name     | string | 是  | 報表名稱       |
 * | report_name_en  | string | 否  | 報表英文名稱   |
 * | description     | string | 否  | 說明文字       |
 * | description_en  | string | 否  | 英文說明文字   |
 * | is_active       | int    | 否  | 啟用狀態，預設 1 |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

header('Content-Type: application/json; charset=utf-8');

switch ($method) {
    case 'GET':
        handleListReportDescriptions();
        break;
    case 'POST':
        handleCreateReportDescription();
        break;
}

function handleListReportDescriptions(): void
{
    $pdo = db();
    ensureDefaultReportDescriptions($pdo);

    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 20)));
    $offset  = ($page - 1) * $perPage;

    $allowedSortFields = ['id', 'report_code', 'report_name', 'is_active', 'created_at', 'updated_at'];
    $sortField = isset($_GET['sort']) && in_array($_GET['sort'], $allowedSortFields, true)
        ? $_GET['sort']
        : 'report_code';
    $sortOrder = isset($_GET['order']) && strtolower((string)$_GET['order']) === 'desc' ? 'DESC' : 'ASC';

    $keyword  = trim((string)($_GET['keyword'] ?? ''));
    $isActive = isset($_GET['is_active']) && $_GET['is_active'] !== '' ? (int)$_GET['is_active'] : null;

    $conditions = [];
    $params     = [];

    if ($keyword !== '') {
        $conditions[] = '(report_code LIKE ? OR report_name LIKE ? OR report_name_en LIKE ?)';
        $wildcard = '%' . $keyword . '%';
        $params[] = $wildcard;
        $params[] = $wildcard;
        $params[] = $wildcard;
    }

    if ($isActive !== null) {
        $conditions[] = 'is_active = ?';
        $params[] = $isActive;
    }

    $where = $conditions !== [] ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM report_descriptions {$where}");
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();
    $totalPages = (int)ceil($totalCount / $perPage);

    $sql  = "SELECT id, report_code, report_name, report_name_en, description, description_en,
                    is_active, created_at, updated_at
             FROM report_descriptions
             {$where}
             ORDER BY {$sortField} {$sortOrder}
             LIMIT ? OFFSET ?";

    $params[] = $perPage;
    $params[] = $offset;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success'    => true,
        'data'       => $data,
        'pagination' => [
            'current_page' => $page,
            'per_page'     => $perPage,
            'total_count'  => $totalCount,
            'total_pages'  => $totalPages,
        ],
    ]);
}

/**
 * 若 report_descriptions 為空或缺少核心報表，補齊預設資料。
 * 目的：避免「列印報表說明」頁面無法直接編輯核心列印模板。
 */
function ensureDefaultReportDescriptions(PDO $pdo): void
{
    $defaults = [
        ['screening_inspection', '篩分檢驗結果報表', 'Screening Inspection Report'],
        ['shipping_order', '出貨單', 'Shipping Order'],
        ['return_order', '退貨單', 'Return Order'],
        ['work_order', '生產命令單', 'Production Work Order'],
        ['order_confirmation', '客戶光篩代工委託確認單', 'Customer Optical Screening Outsourcing Confirmation'],
    ];

    $existsStmt = $pdo->prepare('SELECT id FROM report_descriptions WHERE report_code = ? LIMIT 1');
    $insertStmt = $pdo->prepare(
        'INSERT INTO report_descriptions
            (report_code, report_name, report_name_en, description, description_en, is_active)
         VALUES (?, ?, ?, ?, ?, 1)'
    );

    foreach ($defaults as $row) {
        [$code, $name, $nameEn] = $row;
        $existsStmt->execute([$code]);
        if ($existsStmt->fetchColumn()) {
            continue;
        }

        $insertStmt->execute([$code, $name, $nameEn, '', '']);
    }
}

function handleCreateReportDescription(): void
{
    $pdo   = db();
    $input = getJsonInput();

    if (empty($input['report_code']) || empty($input['report_name'])) {
        jsonResponse(['success' => false, 'message' => '報表代碼和報表名稱為必填。'], 400);
    }

    $checkStmt = $pdo->prepare('SELECT COUNT(*) FROM report_descriptions WHERE report_code = ?');
    $checkStmt->execute([trim($input['report_code'])]);
    if ((int)$checkStmt->fetchColumn() > 0) {
        jsonResponse(['success' => false, 'message' => '報表代碼已存在。'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO report_descriptions
            (report_code, report_name, report_name_en, description, description_en, is_active)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        trim($input['report_code']),
        trim($input['report_name']),
        trim((string)($input['report_name_en'] ?? '')),
        trim((string)($input['description'] ?? '')),
        trim((string)($input['description_en'] ?? '')),
        isset($input['is_active']) ? (int)$input['is_active'] : 1,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '新增成功。',
        'data'    => ['id' => (int)$pdo->lastInsertId()],
    ], 201);
}
