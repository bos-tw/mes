<?php
/**
 * 系統參數 API - 列表與新增端點
 *
 * @endpoint GET  /api/system_parameters/    取得系統參數列表
 * @endpoint POST /api/system_parameters/    新增系統參數
 *
 * @auth 必須登入
 * @table system_parameters
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
        handleListSystemParameters();
        break;
    case 'POST':
        handleCreateSystemParameter();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListSystemParameters(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(param_key LIKE :keyword OR param_value LIKE :keyword_val OR description LIKE :keyword_desc)';
        $params['keyword'] = '%' . $keyword . '%';
        $params['keyword_val'] = '%' . $keyword . '%';
        $params['keyword_desc'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM system_parameters WHERE ' . $where;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT id, param_key, param_value, description, created_at, updated_at FROM system_parameters WHERE ' . $where . ' ORDER BY param_key ASC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $parameters = array_map(static fn(array $row): array => transformSystemParameter($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $parameters,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateSystemParameter(): void
{
    $pdo = db();
    $payload = getJsonInput();

    $validated = validateSystemParameterData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查 param_key 是否重複
    $checkStmt = $pdo->prepare('SELECT id FROM system_parameters WHERE param_key = :param_key');
    $checkStmt->execute(['param_key' => $data['param_key']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '參數鍵值已存在。',
        ], 409);
    }

    // 取得新 ID
    $maxIdStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM system_parameters');
    $newId = (int)$maxIdStmt->fetchColumn();

    $sql = 'INSERT INTO system_parameters (id, param_key, param_value, description, created_at, updated_at) VALUES (:id, :param_key, :param_value, :description, NOW(), NOW())';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $newId,
            'param_key' => $data['param_key'],
            'param_value' => $data['param_value'],
            'description' => $data['description'],
        ]);
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增系統參數失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added new system parameter', 'SystemParameters', $newId, $data);

    jsonResponse([
        'success' => true,
        'message' => '系統參數已新增。',
        'data' => ['id' => $newId],
    ], 201);
}
