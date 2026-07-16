<?php
/**
 * 代碼領域 API - 列表與新增端點
 *
 * 提供代碼領域的列表查詢（含分頁、關鍵字搜尋）及新增功能。
 *
 * @endpoint GET  /api/lookup_domains/    取得代碼領域列表
 * @endpoint POST /api/lookup_domains/    新增代碼領域
 *
 * @auth 必須登入
 * @table lookup_domains
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
        handleListLookupDomains();
        break;
    case 'POST':
        handleCreateLookupDomain();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListLookupDomains(): void
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
        $conditions[] = '(domain_key LIKE :keyword OR description LIKE :keyword_desc)';
        $params['keyword'] = '%' . $keyword . '%';
        $params['keyword_desc'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM lookup_domains WHERE ' . $where;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT id, domain_key, description, created_at, updated_at FROM lookup_domains WHERE ' . $where . ' ORDER BY domain_key ASC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $domains = array_map(static fn(array $row): array => transformLookupDomain($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $domains,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateLookupDomain(): void
{
    $pdo = db();
    $payload = getJsonInput();

    $validated = validateLookupDomainData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查 domain_key 是否重複
    $checkStmt = $pdo->prepare('SELECT id FROM lookup_domains WHERE domain_key = :domain_key');
    $checkStmt->execute(['domain_key' => $data['domain_key']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '領域鍵值已存在。',
        ], 409);
    }

    $sql = 'INSERT INTO lookup_domains (domain_key, description, created_at, updated_at) VALUES (:domain_key, :description, NOW(), NOW())';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'domain_key' => $data['domain_key'],
            'description' => $data['description'],
        ]);
        $newId = (int)$pdo->lastInsertId();
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增代碼領域失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added new lookup domain', 'LookupDomains', $newId, $data);

    jsonResponse([
        'success' => true,
        'message' => '代碼領域已新增。',
        'data' => ['id' => $newId],
    ], 201);
}
