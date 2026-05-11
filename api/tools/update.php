<?php
/**
 * 載具管理 API - 單筆資料端點
 *
 * 提供載具（工具/棧板/料架）單筆資料的查詢、更新、刪除功能。
 *
 * @endpoint GET    /api/tools/update.php?id={id}  取得單筆載具
 * @endpoint PUT    /api/tools/update.php?id={id}  更新載具
 * @endpoint DELETE /api/tools/update.php?id={id}  刪除載具
 *
 * @auth 必須登入
 * @table tools
 *
 * @input GET/PUT/DELETE 共用
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 載具 ID |
 *
 * @input PUT (JSON body)
 * | 參數             | 類型    | 必填 | 說明 |
 * |------------------|---------|------|------|
 * | tool_number      | string  | N    | 載具編號 |
 * | name             | string  | N    | 載具名稱 |
 * | type             | string  | N    | 類型 |
 * | status_lookup_id | int     | N    | 狀態 lookup ID |
 * | current_location | string  | N    | 目前位置 |
 * | weight_kg        | decimal | N    | 重量(kg) |
 * | capacity_kg      | decimal | N    | 承載量(kg) |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "tool_number": "TL-0001",
 *     "name": "棧板 A",
 *     "type": "pallet",
 *     "status": "available",
 *     "status_label": "可用"
 *   }
 * }
 * ```
 *
 * @error 400 無效的載具 ID
 * @error 404 找不到指定的載具
 * @error 405 不支援的請求方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../lookup_values/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的載具ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT', 'DELETE']);

switch ($method) {
    case 'GET':
        handleShowTool($id);
        break;
    case 'PUT':
        handleUpdateTool($id);
        break;
    case 'DELETE':
        handleDeleteTool($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleShowTool(int $id): void
{
    $pdo = db();

    $stmt = $pdo->prepare('SELECT t.id, t.tool_number, t.name, t.type, t.status, t.status_lookup_id, t.current_location, t.weight_kg, t.capacity_kg, t.created_at, t.updated_at, lv.value_label AS status_label FROM tools t LEFT JOIN lookup_values lv ON t.status_lookup_id = lv.id WHERE t.id = ?');
    $stmt->execute([$id]);

    $tool = $stmt->fetch();
    if (!$tool) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的載具。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => transformTool($tool),
    ]);
}

function handleUpdateTool(int $id): void
{
    $pdo = db();
    $payload = readToolPayload();

    $validated = validateToolData($payload, true);
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

        $sql = 'UPDATE tools SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的載具或沒有資料需要更新。',
            ], 404);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '載具資料已更新。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleToolWriteException($e);
        jsonResponse($response, 500);
    }
}

function handleDeleteTool(int $id): void
{
    $pdo = db();

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('DELETE FROM tools WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的載具。',
            ], 404);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '載具資料已刪除。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleToolWriteException($e);
        jsonResponse($response, 500);
    }
}
