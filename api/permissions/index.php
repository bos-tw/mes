<?php
/**
 * 權限管理 API - 列表與新增端點
 *
 * @endpoint GET  /api/permissions/          取得權限列表
 * @endpoint POST /api/permissions/          新增權限
 *
 * @auth 必須登入
 * @table permissions
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
        handleListPermissions();
        break;
    case 'POST':
        handleCreatePermission();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListPermissions(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['1=1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(name LIKE :keyword OR description LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM permissions WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;
    $sql = "SELECT id, name, description, created_at, updated_at FROM permissions WHERE $where ORDER BY id ASC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $permissions = array_map('transformPermission', $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $permissions,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreatePermission(): void
{
    $pdo = db();
    $payload = readPermissionPayload();

    $validated = validatePermissionData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if (permissionNameExists($pdo, $data['name'])) {
        jsonResponse([
            'success' => false,
            'message' => '權限名稱已存在。',
            'errors' => ['name' => '權限名稱已存在，請使用其他名稱。'],
        ], 409);
    }

    try {
        $columns = array_keys($data);
        $placeholders = array_map(fn(string $col): string => ':' . $col, $columns);

        $sql = 'INSERT INTO permissions (' . implode(', ', $columns) . ') VALUES (' . implode(', ', $placeholders) . ')';
        $stmt = $pdo->prepare($sql);

        foreach ($data as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        $stmt->execute();
        $newId = (int)$pdo->lastInsertId();

        $permission = findPermission($pdo, $newId);

        jsonResponse([
            'success' => true,
            'message' => '權限建立成功。',
            'data' => $permission ? transformPermission($permission) : null,
        ], 201);
    } catch (PDOException $e) {
        handlePermissionPdoWriteException($e);
    }
}
