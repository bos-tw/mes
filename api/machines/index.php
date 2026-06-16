<?php
/**
 * 機台管理 API - 列表與新增端點
 *
 * 提供機台資料的列表查詢（含分頁、關鍵字搜尋、狀態篩選）及新增功能。
 *
 * @endpoint GET  /api/machines/          取得機台列表
 * @endpoint POST /api/machines/          新增機台
 *
 * @auth 必須登入
 * @table machines, departments, lookup_values
 *
 * @input GET (Query string)
 * | 參數             | 類型   | 必填 | 說明 |
 * |------------------|--------|------|------|
 * | page             | int    | N    | 頁碼，預設 1 |
 * | perPage          | int    | N    | 每頁筆數，預設 10，最大 100 |
 * | keyword          | string | N    | 關鍵字搜尋（編號、名稱、型號、備註）|
 * | status_lookup_id | int    | N    | 依狀態 lookup ID 篩選 |
 * | department_id    | int    | N    | 依部門 ID 篩選 |
 * | machine_capability_id | int | N | 依機台能力篩選 |
 *
 * @input POST (JSON body)
 * | 參數                   | 類型    | 必填 | 說明 |
 * |------------------------|---------|------|------|
 * | machine_number         | string  | Y    | 機台編號 |
 * | name                   | string  | Y    | 機台名稱 |
 * | model                  | string  | N    | 型號 |
 * | purchase_date          | string  | N    | 購買日期 |
 * | department_id          | int     | N    | 所屬部門 ID |
 * | status_lookup_id       | int     | N    | 狀態 lookup ID |
 * | lens_count             | int     | N    | 鏡頭數量 |
 * | length_mm              | decimal | N    | 長度(mm) |
 * | thread_outer_diameter_mm | decimal | N  | 螺牙外徑(mm) |
 * | notes                  | string  | N    | 備註 |
 * | machine_capability_id    | int     | N    | 機台能力 ID |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{"id": 1, "machine_number": "M-001", "name": "選別機1號"}],
 *   "pagination": {"page": 1, "perPage": 10, "total": 50, "totalPages": 5}
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 * @error 409 機台編號重複
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListMachines();
        break;
    case 'POST':
        handleCreateMachine();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListMachines(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $statusLookupId = (int)($_GET['status_lookup_id'] ?? 0);
    $departmentId = (int)($_GET['department_id'] ?? 0);
    $machineCapabilityId = (int)($_GET['machine_capability_id'] ?? 0);

    $conditions = ['1 = 1'];
    $params = [];
    if ($keyword !== '') {
        $searchableColumns = ['m.machine_number', 'm.name', 'm.model', 'm.notes'];
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

    if ($statusLookupId > 0) {
        $conditions[] = 'm.status_lookup_id = :status_lookup_id';
        $params['status_lookup_id'] = $statusLookupId;
    }

    if ($departmentId > 0) {
        $conditions[] = 'm.department_id = :department_id';
        $params['department_id'] = $departmentId;
    }

    if ($machineCapabilityId > 0) {
        $conditions[] = 'm.machine_capability_id = :machine_capability_id';
        $params['machine_capability_id'] = $machineCapabilityId;
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM machines m';
    $countStmt = $pdo->prepare($where !== '' ? $countSql . ' WHERE ' . $where : $countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT m.id, m.machine_number, m.name, m.model, m.purchase_date, m.department_id, m.lens_count, m.length_mm, m.thread_outer_diameter_mm, m.notes, '
        . 'm.status_lookup_id, m.machine_capability_id, m.created_at, m.updated_at, d.name AS department_name, lv.value_label AS status_label, lv.value_key AS status_key, '
        . 'mc.capability_name AS machine_capability_name, mc.capability_code AS machine_capability_code '
        . 'FROM machines m '
        . 'LEFT JOIN departments d ON d.id = m.department_id '
        . 'LEFT JOIN lookup_values lv ON lv.id = m.status_lookup_id '
        . 'LEFT JOIN machine_capabilities mc ON mc.id = m.machine_capability_id ';

    if ($where !== '') {
        $sql .= 'WHERE ' . $where . ' ';
    }

    $sql .= 'ORDER BY m.id DESC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $machines = array_map(static fn(array $row): array => transformMachine($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $machines,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateMachine(): void
{
    $pdo = db();
    $payload = readMachinePayload();
    unset($payload['_method']);

    $validated = validateMachineData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];
    $checkStmt = $pdo->prepare(
        'SELECT id FROM machines WHERE machine_number = :machine_number' . machineActiveCondition($pdo)
    );
    $checkStmt->execute(['machine_number' => $data['machine_number']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '機台編號已存在。',
        ], 409);
    }

    try {
        $columns = array_keys($data);
        $placeholders = array_map(static fn(string $column): string => ':' . $column, $columns);
        $sql = 'INSERT INTO machines (' . implode(', ', $columns) . ', created_at, updated_at) VALUES (' . implode(', ', $placeholders) . ', NOW(), NOW())';
        $stmt = $pdo->prepare($sql);
        foreach ($data as $column => $value) {
            if ($value === null) {
                $stmt->bindValue(':' . $column, null, PDO::PARAM_NULL);
            } elseif (in_array($column, ['department_id', 'status_lookup_id', 'lens_count', 'machine_capability_id'], true)) {
                $stmt->bindValue(':' . $column, (int)$value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $column, $value);
            }
        }
        $stmt->execute();
        $machineId = (int)$pdo->lastInsertId();
    } catch (PDOException $exception) {
        $response = handleMachineWriteException($exception);
        jsonResponse($response, 500);
    }

    logAuditAction('Added new machine', 'Machines', $machineId, [
        'machine' => $data,
    ]);

    jsonResponse([
        'success' => true,
        'message' => '機台資料已新增。',
        'data' => ['id' => $machineId],
    ], 201);
}
