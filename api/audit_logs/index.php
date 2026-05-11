<?php
/**
 * 稽核日誌 API - 列表與新增端點
 *
 * 提供系統稽核日誌的列表查詢（含分頁、關鍵字搜尋、排序）及手動新增功能。
 *
 * @endpoint GET  /api/audit_logs/          取得日誌列表
 * @endpoint POST /api/audit_logs/          新增日誌（手動）
 *
 * @auth 必須登入
 * @table audit_logs, employees
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | page          | int    | N    | 頁碼，預設 1 |
 * | perPage       | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword       | string | N    | 關鍵字搜尋（動作、目標表、IP）|
 * | sortField     | string | N    | 排序欄位 |
 * | sortDirection | string | N    | 排序方向（asc/desc）|
 *
 * @input POST (JSON body)
 * | 參數         | 類型   | 必填 | 說明 |
 * |--------------|--------|------|------|
 * | action       | string | Y    | 動作描述 |
 * | target_table | string | N    | 目標資料表 |
 * | target_id    | int    | N    | 目標 ID |
 * | details      | object | N    | 詳細資料 |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "action": "Created order",
 *     "target_table": "orders",
 *     "target_id": 100,
 *     "employee_name": "張三",
 *     "ip_address": "192.168.1.1",
 *     "created_at": "2024-01-01 10:00:00"
 *   }],
 *   "pagination": {"page": 1, "perPage": 10, "total": 500, "totalPages": 50}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentEmployee = requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListAuditLogs();
        break;
    case 'POST':
        handleCreateAuditLog($currentEmployee);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListAuditLogs(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $sortableColumns = [
        'id' => 'al.id',
        'action' => 'al.action',
        'target_table' => 'al.target_table',
        'target_id' => 'al.target_id',
        'ip_address' => 'al.ip_address',
        'created_at' => 'al.created_at',
        'employee_name' => 'e.name',
        'employee_account' => 'e.account',
    ];

    $requestedSortField = (string)($_GET['sortField'] ?? 'created_at');
    if (!array_key_exists($requestedSortField, $sortableColumns)) {
        $requestedSortField = 'created_at';
    }

    $requestedSortDirection = strtolower((string)($_GET['sortDirection'] ?? 'desc'));
    if (!in_array($requestedSortDirection, ['asc', 'desc'], true)) {
        $requestedSortDirection = 'desc';
    }

    $orderColumn = $sortableColumns[$requestedSortField];
    $orderDirection = strtoupper($requestedSortDirection);
    $orderBySql = sprintf('%s %s', $orderColumn, $orderDirection);
    if ($orderColumn !== 'al.id') {
        $orderBySql .= ', al.id DESC';
    }

    $conditions = [];
    $params = [];

    if ($keyword !== '') {
        $searchableColumns = [
            'action',
            'target_table',
            'ip_address',
        ];

        $likeParts = [];
        foreach ($searchableColumns as $index => $column) {
            $paramName = 'keyword_' . $index;
            $likeParts[] = sprintf('al.%s LIKE :%s', $column, $paramName);
            $params[$paramName] = '%' . $keyword . '%';
        }

        if ($likeParts !== []) {
            $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
        }
    }

    $where = implode(' AND ', $conditions);

    $countSql = "SELECT COUNT(*) FROM audit_logs al";
    if ($where !== '') {
        $countSql .= " WHERE " . $where;
    }
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $totalPages = $perPage > 0 ? (int)ceil($total / $perPage) : 1;
    $page = min($page, max(1, $totalPages));

    $offset = ($page - 1) * $perPage;

    $listSql = '
        SELECT
            al.id,
            al.employee_id,
            al.action,
            al.target_table,
            al.target_id,
            al.details,
            al.ip_address,
            al.created_at,
            e.name AS employee_name,
            e.account AS employee_account
        FROM audit_logs al
        LEFT JOIN employees e ON e.id = al.employee_id';

    if ($where !== '') {
        $listSql .= ' WHERE ' . $where;
    }

    $listSql .= ' ORDER BY ' . $orderBySql . ' LIMIT :limit OFFSET :offset';

    $listStmt = $pdo->prepare($listSql);

    foreach ($params as $key => $value) {
        $listStmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
    }
    $listStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $listStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $listStmt->execute();

    $rows = $listStmt->fetchAll();
    $logs = array_map(static fn(array $row): array => transformAuditLog($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $logs,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

/**
 * @param array<string,mixed> $currentEmployee
 */
function handleCreateAuditLog(array $currentEmployee): void
{
    $pdo = db();

    $payload = readAuditLogPayload();
    $validated = validateAuditLogData($payload);

    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if (!array_key_exists('employee_id', $data) || $data['employee_id'] === null) {
        $data['employee_id'] = isset($currentEmployee['id']) ? (int)$currentEmployee['id'] : null;
    }

    if (!array_key_exists('ip_address', $data) || $data['ip_address'] === null) {
        $data['ip_address'] = $_SERVER['REMOTE_ADDR'] ?? null;
    }

    $data['created_at'] = currentTimestamp();

    $columns = array_keys($data);
    $placeholders = array_map(static fn(string $column): string => ':' . $column, $columns);

    $insertSql = 'INSERT INTO audit_logs (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($insertSql);
        foreach ($data as $column => $value) {
            if ($value === null) {
                $stmt->bindValue(':' . $column, null, PDO::PARAM_NULL);
            } elseif (is_int($value)) {
                $stmt->bindValue(':' . $column, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $column, $value, PDO::PARAM_STR);
            }
        }
        $stmt->execute();
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '建立操作日誌失敗，請稍後再試。',
            'error' => $exception->getMessage(),
        ], 500);
    }

    $newId = (int)$pdo->lastInsertId();
    $log = findAuditLog($pdo, $newId);

    if (!$log) {
        jsonResponse([
            'success' => false,
            'message' => '操作日誌建立後無法取得詳細資料。',
        ], 500);
    }

    jsonResponse([
        'success' => true,
        'message' => '操作日誌已建立。',
        'data' => transformAuditLog($log),
    ], 201);
}
