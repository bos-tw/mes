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
    $activeOn = trim((string)($_GET['active_on'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = 'seq_key LIKE :keyword';
        $params['keyword'] = '%' . $keyword . '%';
    }

    if ($activeOn !== '') {
        $conditions[] = 'active_from <= :active_on_end AND (active_until IS NULL OR active_until >= :active_on_start)';
        $params['active_on_start'] = $activeOn . ' 00:00:00';
        $params['active_on_end'] = $activeOn . ' 23:59:59';
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

    $sql = 'SELECT id, seq_key, seq_prefix, active_from, active_until, current_value, last_generated_on, created_at, updated_at FROM number_sequences WHERE ' . $where . ' ORDER BY seq_key ASC, active_from DESC LIMIT :limit OFFSET :offset';

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
    $checkStmt = $pdo->prepare('SELECT id FROM number_sequences WHERE seq_key = :seq_key AND active_from = :active_from');
    $checkStmt->execute(['seq_key' => $data['seq_key'], 'active_from' => $data['active_from']]);
    if ($checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '此序列鍵與啟用時間組合已存在。',
        ], 409);
    }

    $overlapStmt = $pdo->prepare("
        SELECT id
        FROM number_sequences
        WHERE seq_key = :seq_key
          AND (active_until IS NULL OR active_until >= :active_from)
          AND (:active_until IS NULL OR active_from <= :active_until)
        LIMIT 1
    ");
    $overlapStmt->execute([
        'seq_key' => $data['seq_key'],
        'active_from' => $data['active_from'],
        'active_until' => $data['active_until'] ?? null,
    ]);
    if ($overlapStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '同一序列鍵的啟用/停用時間不可重疊。',
        ], 409);
    }

    $sql = 'INSERT INTO number_sequences (seq_key, seq_prefix, active_from, active_until, current_value, last_generated_on, created_at, updated_at) VALUES (:seq_key, :seq_prefix, :active_from, :active_until, :current_value, NULL, NOW(), NOW())';

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'seq_key' => $data['seq_key'],
            'seq_prefix' => $data['seq_prefix'],
            'active_from' => $data['active_from'],
            'active_until' => $data['active_until'] ?? null,
            'current_value' => $data['current_value'] ?? 0,
        ]);
        $newId = (int)$pdo->lastInsertId();
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
