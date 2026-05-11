<?php
/**
 * 受篩產品 API - 單筆操作
 *
 * @endpoint GET    /api/screening_items/update.php?id={int}  取得單筆
 * @endpoint PUT    /api/screening_items/update.php?id={int}  更新
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 受篩產品 ID |
 *
 * @output GET 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "item_number": "SI-001",
 *     "name": "M3x10",
 *     "material": "不銹鋼",
 *     "weight_per_unit_g": 0.25
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 受篩產品不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的受篩產品 ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT']);

switch ($method) {
    case 'GET':
        handleShowScreeningItem($id);
        break;
    case 'PUT':
        handleUpdateScreeningItem($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleShowScreeningItem(int $id): void
{
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, item_number, name, material, thread_type, weight_per_unit_g, unit_price, unit, notes, created_at, updated_at FROM screening_items WHERE id = ?');
    $stmt->execute([$id]);

    $row = $stmt->fetch();
    if ($row === false) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的受篩產品。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => transformScreeningItem($row),
    ]);
}

function handleUpdateScreeningItem(int $id): void
{
    $pdo = db();
    $payload = readScreeningItemPayload();

    $validated = validateScreeningItemData($payload, true);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    if ($data === []) {
        jsonResponse([
            'success' => false,
            'message' => '沒有提供任何更新資料。',
        ], 400);
    }

    try {
        $pdo->beginTransaction();

        $setParts = [];
        $params = [];
        foreach ($data as $column => $value) {
            if ($column === 'item_number' && $value === null) {
                $value = null;
            }
            $setParts[] = $column . ' = ?';
            $params[] = $value;
        }
        $params[] = $id;

        $sql = 'UPDATE screening_items SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的受篩產品或沒有資料需要更新。',
            ], 404);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '受篩產品已更新。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleScreeningItemWriteException($e);
        jsonResponse($response, 500);
    }
}
