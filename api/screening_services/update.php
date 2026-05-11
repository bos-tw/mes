<?php
/**
 * 篩分服務 API - 單筆操作
 *
 * @endpoint GET    /api/screening_services/update.php?id={int}  取得單筆
 * @endpoint PUT    /api/screening_services/update.php?id={int}  更新
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 篩分服務 ID |
 *
 * @output GET 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "service_number": "SS-001",
 *     "name": "全檢",
 *     "category": "尺寸檢",
 *     "default_price_per_unit": 0.05,
 *     "is_active": true
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 篩分服務不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的篩分服務ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT']);

switch ($method) {
    case 'GET':
        handleShowScreeningService($id);
        break;
    case 'PUT':
        handleUpdateScreeningService($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleShowScreeningService(int $id): void
{
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, service_number, name, name_en, category, description, default_price_per_unit, tolerance_plus_value, tolerance_plus_over, tolerance_minus_value, tolerance_minus_over, ppm_standard, is_active, created_at, updated_at FROM screening_services WHERE id = ?');
    $stmt->execute([$id]);

    $service = $stmt->fetch();
    if (!$service) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的篩分服務。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => transformScreeningService($service),
    ]);
}

function handleUpdateScreeningService(int $id): void
{
    $pdo = db();
    $payload = readScreeningServicePayload();

    $validated = validateScreeningServiceData($payload, true);
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
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        $params[] = $id;

        $sql = 'UPDATE screening_services SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            // 檢查記錄是否存在
            $checkStmt = $pdo->prepare('SELECT id FROM screening_services WHERE id = ?');
            $checkStmt->execute([$id]);

            if ($checkStmt->fetch()) {
                // 記錄存在，表示沒有資料變更
                $pdo->commit();
                jsonResponse([
                    'success' => true,
                    'message' => '資料未變更。',
                ]);
            } else {
                $pdo->rollBack();
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的篩分服務。',
                ], 404);
            }
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '篩分服務資料已更新。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleScreeningServiceWriteException($e);
        jsonResponse($response, 500);
    }
}
