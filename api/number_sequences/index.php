<?php
/**
 * 流水號管理 API - 列表與新增端點
 *
 * @endpoint GET  /api/number_sequences/    取得流水號列表
 * @endpoint POST /api/number_sequences/    新增流水號
 *
 * @auth 必須登入
 * @table number_sequences
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
        handleListNumberSequences();
        break;
    case 'POST':
        handleCreateNumberSequence();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListNumberSequences(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $dateScope = trim((string)($_GET['date_scope'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = 'seq_key LIKE :keyword';
        $params['keyword'] = '%' . $keyword . '%';
    }

    if ($dateScope !== '') {
        $conditions[] = 'date_scope = :date_scope';
        $params['date_scope'] = $dateScope;
    }

    $where = implode(' AND ', $conditions);

    $countSql = 'SELECT COUNT(*) FROM number_sequences WHERE ' . $where;
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT id, seq_key, date_scope, current_value, created_at, updated_at FROM number_sequences WHERE ' . $where . ' ORDER BY seq_key ASC, date_scope DESC LIMIT :limit OFFSET :offset';

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $sequences = array_map(static fn(array $row): array => transformNumberSequence($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $sequences,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateNumberSequence(): void
{
    $pdo = db();
    $payload = getJsonInput();

    $validated = validateNumberSequenceData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 檢查是否重複
    $checkStmt = $pdo->prepare('SELECT id FROM number_sequences WHERE seq_key = :seq_key AND date_scope = :date_scope');
    $checkStmt->execute(['seq_key' => $data['seq_key'], 'date_scope' => $data['date_scope']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '此序列鍵與日期範圍組合已存在。',
        ], 409);
    }

    // 取得新 ID
    $maxIdStmt = $pdo->query('SELECT COALESCE(MAX(id), 0) + 1 FROM number_sequences');
    $newId = (int)$maxIdStmt->fetchColumn();

    $sql = 'INSERT INTO number_sequences (id, seq_key, date_scope, current_value, created_at, updated_at) VALUES (:id, :seq_key, :date_scope, :current_value, NOW(), NOW())';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id' => $newId,
            'seq_key' => $data['seq_key'],
            'date_scope' => $data['date_scope'],
            'current_value' => $data['current_value'] ?? 0,
        ]);
    } catch (PDOException $exception) {
        jsonResponse([
            'success' => false,
            'message' => '新增流水號失敗：' . $exception->getMessage(),
        ], 500);
    }

    logAuditAction('Added new number sequence', 'NumberSequences', $newId, $data);

    jsonResponse([
        'success' => true,
        'message' => '流水號已新增。',
        'data' => ['id' => $newId],
    ], 201);
}
