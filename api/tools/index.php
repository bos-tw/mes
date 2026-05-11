<?php
/**
 * 載具管理 API - 列表與新增
 *
 * 管理生產使用的載具（贉具、托盤等）。
 *
 * @endpoint GET  /api/tools  取得載具列表
 * @endpoint POST /api/tools  建立新載具
 *
 * @auth 必須登入
 *
 * @table tools  主表
 *
 * @input GET 參數:
 * | 參數    | 類型   | 必填 | 預設 | 說明                              |
 * |---------|--------|-----|------|----------------------------------|
 * | keyword | string | 否  |      | 搜尋編號/名稱/位置                 |
 * | status  | string | 否  |      | 狀態 (available/in_use/maintenance/retired) |
 * | type    | string | 否  |      | 載具類型                          |
 * | page    | int    | 否  | 1    | 頁碼                              |
 * | perPage | int    | 否  | 10   | 每頁筆數 (max 100)                |
 *
 * @input POST JSON:
 * | 參數         | 類型   | 必填 | 說明              |
 * |--------------|--------|-----|-----------------|
 * | tool_number  | string | 是  | 載具編號          |
 * | name         | string | 是  | 載具名稱          |
 * | type         | string | 否  | 載具類型          |
 * | weight_kg    | float  | 否  | 重量 (kg)        |
 * | capacity_kg  | float  | 否  | 承載量 (kg)      |
 *
 * @see /api/tools/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lookup_values/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListTools();
        break;
    case 'POST':
        handleCreateTool();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListTools(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $status = trim((string)($_GET['status'] ?? ''));
    $type = trim((string)($_GET['type'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $searchableColumns = ['tool_number', 'name', 'current_location'];
        $likeParts = [];
        foreach ($searchableColumns as $index => $column) {
            $paramName = 'keyword_' . $index;
            $likeParts[] = sprintf('t.%s LIKE :%s', $column, $paramName);
            $params[$paramName] = '%' . $keyword . '%';
        }

        if ($likeParts !== []) {
            $conditions[] = '(' . implode(' OR ', $likeParts) . ')';
        }
    }

    if ($status !== '') {
        if (!in_array($status, TOOL_ALLOWED_STATUS, true)) {
            jsonResponse([
                'success' => false,
                'message' => '狀態參數無效。',
            ], 400);
        }
        $conditions[] = 't.status = :status';
        $params['status'] = $status;
    }

    if ($type !== '') {
        $conditions[] = 't.type LIKE :type';
        $params['type'] = '%' . $type . '%';
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM tools t WHERE $where");
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT t.id, t.tool_number, t.name, t.type, t.status, t.status_lookup_id, t.current_location, t.weight_kg, t.capacity_kg, t.created_at, t.updated_at, lv.value_label AS status_label '
        . "FROM tools t LEFT JOIN lookup_values lv ON t.status_lookup_id = lv.id WHERE $where ORDER BY t.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $tools = array_map(static fn(array $row): array => transformTool($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $tools,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateTool(): void
{
    $pdo = db();
    $payload = readToolPayload();

    $validated = validateToolData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];
    $status = $data['status'] ?? 'available';

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO tools (tool_number, name, type, status, current_location, weight_kg, capacity_kg) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['tool_number'] ?? null,
            $data['name'] ?? null,
            $data['type'] ?? null,
            $status,
            $data['current_location'] ?? null,
            $data['weight_kg'] ?? null,
            $data['capacity_kg'] ?? null,
        ]);

        $toolId = (int)$pdo->lastInsertId();

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '載具建立成功。',
            'data' => ['id' => $toolId],
        ], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleToolWriteException($e);
        jsonResponse($response, 500);
    }
}
