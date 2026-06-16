<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListMachineCapabilities();
        break;
    case 'POST':
        handleCreateMachineCapability();
        break;
}

function handleListMachineCapabilities(): void
{
    $pdo = db();

    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(1000, (int)($_GET['perPage'] ?? 10)));
    $keyword = trim((string)($_GET['keyword'] ?? ''));
    $activeOnly = (string)($_GET['active_only'] ?? '') === '1';
    $isActive = isset($_GET['is_active']) && $_GET['is_active'] !== '' ? (int)$_GET['is_active'] : null;

    $conditions = ['1 = 1'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(mc.capability_code LIKE :keyword OR mc.capability_name LIKE :keyword OR mc.description LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    if ($activeOnly) {
        $conditions[] = 'mc.is_active = 1';
    } elseif ($isActive !== null && in_array($isActive, [0, 1], true)) {
        $conditions[] = 'mc.is_active = :is_active';
        $params['is_active'] = $isActive;
    }

    $where = implode(' AND ', $conditions);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM machine_capabilities mc WHERE {$where}");
    foreach ($params as $key => $value) {
        $countStmt->bindValue(':' . $key, $value);
    }
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $totalPages = (int)ceil($total / $perPage);
    $page = min($page, max(1, $totalPages));
    $offset = ($page - 1) * $perPage;

    $sql = "
        SELECT mc.id, mc.capability_code, mc.capability_name, mc.description, mc.sort_order, mc.is_active, mc.created_at, mc.updated_at,
               COUNT(m.id) AS machine_count
        FROM machine_capabilities mc
        LEFT JOIN machines m ON m.machine_capability_id = mc.id
        WHERE {$where}
        GROUP BY mc.id, mc.capability_code, mc.capability_name, mc.description, mc.sort_order, mc.is_active, mc.created_at, mc.updated_at
        ORDER BY mc.sort_order ASC, mc.id ASC
        LIMIT :limit OFFSET :offset
    ";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $items = array_map(static fn(array $row): array => transformMachineCapability($row), $rows ?: []);

    jsonResponse([
        'success' => true,
        'data' => $items,
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => $totalPages,
            'total' => $total,
        ],
    ]);
}

function handleCreateMachineCapability(): void
{
    $pdo = db();
    $payload = readMachineCapabilityPayload();
    $validated = validateMachineCapabilityData($payload, false);

    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    $duplicateStmt = $pdo->prepare('SELECT id FROM machine_capabilities WHERE capability_code = :capability_code OR capability_name = :capability_name LIMIT 1');
    $duplicateStmt->execute([
        'capability_code' => $data['capability_code'],
        'capability_name' => $data['capability_name'],
    ]);
    if ($duplicateStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '能力代碼或能力名稱已存在。',
        ], 409);
    }

    $stmt = $pdo->prepare("
        INSERT INTO machine_capabilities (capability_code, capability_name, description, sort_order, is_active, created_at, updated_at)
        VALUES (:capability_code, :capability_name, :description, :sort_order, :is_active, NOW(), NOW())
    ");
    $stmt->execute([
        'capability_code' => $data['capability_code'],
        'capability_name' => $data['capability_name'],
        'description' => $data['description'] ?? null,
        'sort_order' => $data['sort_order'] ?? 0,
        'is_active' => $data['is_active'] ?? 1,
    ]);

    $id = (int)$pdo->lastInsertId();
    logAuditAction('Added machine capability', 'MachineCapabilities', $id, $data);

    jsonResponse([
        'success' => true,
        'message' => '機台能力已新增。',
        'data' => ['id' => $id],
    ], 201);
}
