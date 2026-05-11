<?php
/**
 * 受篩產品 API - 列表與新增
 *
 * 管理可接單的受篩產品資料。
 *
 * @endpoint GET  /api/screening_items  取得產品列表
 * @endpoint POST /api/screening_items  建立新產品
 *
 * @auth 必須登入
 *
 * @table screening_items  主表
 *
 * @input GET 參數:
 * | 參數        | 類型   | 必填 | 預設 | 說明                  |
 * |-------------|--------|-----|------|----------------------|
 * | keyword     | string | 否  |      | 搜尋編號/名稱/材質       |
 * | material    | string | 否  |      | 材質                  |
 * | thread_type | string | 否  |      | 螺紋類型              |
 * | unit        | string | 否  |      | 單位                  |
 * | page        | int    | 否  | 1    | 頁碼                  |
 * | perPage     | int    | 否  | 10   | 每頁筆數 (max 100)    |
 *
 * @input POST JSON:
 * | 參數              | 類型   | 必填 | 說明              |
 * |-------------------|--------|-----|-----------------|
 * | item_number       | string | 是  | 產品編號          |
 * | name              | string | 是  | 產品名稱          |
 * | material          | string | 否  | 材質              |
 * | thread_type       | string | 否  | 螺紋類型          |
 * | weight_per_unit_g | float  | 否  | 單支重 (g)        |
 * | unit_price        | float  | 否  | 單價              |
 *
 * @see /api/screening_items/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListScreeningItems();
        break;
    case 'POST':
        handleCreateScreeningItem();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListScreeningItems(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $material = trim((string)($_GET['material'] ?? ''));
    $threadType = trim((string)($_GET['thread_type'] ?? ''));
    $unit = trim((string)($_GET['unit'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(si.item_number LIKE :keyword OR si.name LIKE :keyword OR si.material LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    if ($material !== '') {
        $conditions[] = 'si.material LIKE :material';
        $params['material'] = '%' . $material . '%';
    }

    if ($threadType !== '') {
        $conditions[] = 'si.thread_type LIKE :thread_type';
        $params['thread_type'] = '%' . $threadType . '%';
    }

    if ($unit !== '') {
        $conditions[] = 'si.unit LIKE :unit';
        $params['unit'] = '%' . $unit . '%';
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM screening_items si WHERE $where");
    foreach ($params as $name => $value) {
        $countStmt->bindValue(':' . $name, $value);
    }
    $countStmt->execute();
    $total = (int)($countStmt->fetchColumn() ?: 0);

    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT si.id, si.item_number, si.name, si.material, si.thread_type, si.weight_per_unit_g, si.unit_price, si.unit, si.notes, si.created_at, si.updated_at '
        . "FROM screening_items si WHERE $where ORDER BY si.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $name => $value) {
        $stmt->bindValue(':' . $name, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $items = array_map(static fn(array $row): array => transformScreeningItem($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $items,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateScreeningItem(): void
{
    $pdo = db();
    $payload = readScreeningItemPayload();

    $validated = validateScreeningItemData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if (empty($data['item_number'])) {
        $data['item_number'] = generateScreeningItemNumber($pdo);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO screening_items (item_number, name, material, thread_type, weight_per_unit_g, unit_price, unit, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['item_number'] ?? null,
            $data['name'] ?? null,
            $data['material'] ?? null,
            $data['thread_type'] ?? null,
            $data['weight_per_unit_g'] ?? null,
            $data['unit_price'] ?? null,
            $data['unit'] ?? 'pcs',
            $data['notes'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT * FROM screening_items WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $newItem = transformScreeningItem($row);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '受篩產品建立成功。',
            'data' => $newItem,
        ], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleScreeningItemWriteException($e);
        jsonResponse($response, 500);
    }
}

function generateScreeningItemNumber(PDO $pdo): string
{
    do {
        // 產生 5 碼的隨機十六進位字串 (PROD-XXXXX)
        $candidate = 'PROD-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM screening_items WHERE item_number = ?');
        $stmt->execute([$candidate]);
        $exists = (int)$stmt->fetchColumn() > 0;
    } while ($exists);

    return $candidate;
}
