<?php
/**
 * 篩分服務 API - 列表與新增
 *
 * 管理可提供的篩分服務項目。
 *
 * @endpoint GET  /api/screening_services  取得服務列表
 * @endpoint POST /api/screening_services  建立新服務
 *
 * @auth 必須登入
 *
 * @table screening_services  主表
 *
 * @input GET 參數:
 * | 參數     | 類型   | 必填 | 預設 | 說明                |
 * |----------|--------|-----|------|--------------------|
 * | keyword  | string | 否  |      | 搜尋編號/名稱/分類    |
 * | category | string | 否  |      | 服務分類           |
 * | isActive | string | 否  |      | 啟用狀態 (0/1)     |
 * | page     | int    | 否  | 1    | 頁碼              |
 * | perPage  | int    | 否  | 10   | 每頁筆數 (max 100) |
 *
 * @input POST JSON:
 * | 參數                   | 類型   | 必填 | 說明              |
 * |------------------------|--------|-----|-----------------|
 * | service_number         | string | 是  | 服務編號          |
 * | name                   | string | 是  | 服務名稱          |
 * | category               | string | 否  | 服務分類          |
 * | default_price_per_unit | float  | 否  | 預設單價          |
 * | tolerance_plus_value   | float  | 否  | 公差+ 值          |
 * | tolerance_minus_value  | float  | 否  | 公差- 值          |
 * | ppm_standard           | float  | 否  | PPM 標準         |
 *
 * @see /api/screening_services/helpers.php 輔助函式
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListScreeningServices();
        break;
    case 'POST':
        handleCreateScreeningService();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListScreeningServices(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) {
        $perPage = 10;
    }
    $perPage = min($perPage, 100);

    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $category = trim((string)($_GET['category'] ?? ''));
    $isActiveFilter = trim((string)($_GET['isActive'] ?? ''));

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(s.service_number LIKE :keyword OR s.name LIKE :keyword OR s.category LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    if ($category !== '') {
        $conditions[] = 's.category LIKE :category';
        $params['category'] = '%' . $category . '%';
    }

    if ($isActiveFilter !== '') {
        if (!in_array($isActiveFilter, ['0', '1'], true)) {
            jsonResponse([
                'success' => false,
                'message' => '啟用狀態參數無效。',
            ], 400);
        }
        $conditions[] = 's.is_active = :is_active';
        $params['is_active'] = (int)$isActiveFilter;
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM screening_services s WHERE $where");
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $offset = ($page - 1) * $perPage;

    $sql = 'SELECT s.id, s.service_number, s.name, s.name_en, s.category, s.description, s.default_price_per_unit, ' .
        's.tolerance_plus_value, s.tolerance_plus_over, s.tolerance_minus_value, s.tolerance_minus_over, ' .
        's.ppm_standard, s.is_active, s.created_at, s.updated_at ' .
        "FROM screening_services s WHERE $where ORDER BY s.id DESC LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    $services = array_map(static fn(array $row): array => transformScreeningService($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $services,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}

function handleCreateScreeningService(): void
{
    $pdo = db();
    $payload = readScreeningServicePayload();

    $validated = validateScreeningServiceData($payload, false);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('INSERT INTO screening_services (service_number, name, name_en, category, description, default_price_per_unit, tolerance_plus_value, tolerance_plus_over, tolerance_minus_value, tolerance_minus_over, ppm_standard, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['service_number'] ?? null,
            $data['name'] ?? null,
            $data['name_en'] ?? null,
            $data['category'] ?? null,
            $data['description'] ?? null,
            $data['default_price_per_unit'] ?? null,
            $data['tolerance_plus_value'] ?? null,
            $data['tolerance_plus_over'] ?? null,
            $data['tolerance_minus_value'] ?? null,
            $data['tolerance_minus_over'] ?? null,
            $data['ppm_standard'] ?? null,
            $data['is_active'] ?? 1,
        ]);

        $serviceId = (int)$pdo->lastInsertId();

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '篩分服務建立成功。',
            'data' => ['id' => $serviceId],
        ], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleScreeningServiceWriteException($e);
        jsonResponse($response, 500);
    }
}
