<?php
/**
 * 機台管理 API - 單筆資料端點
 *
 * 提供機台單筆資料的查詢與更新功能。
 *
 * @endpoint GET /api/machines/update.php?id={id}  取得單筆機台
 * @endpoint PUT /api/machines/update.php?id={id}  更新機台
 *
 * @auth 必須登入
 * @table machines, departments, lookup_values
 *
 * @input GET/PUT 共用
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 機台 ID |
 *
 * @input PUT (JSON body)
 * | 參數                   | 類型    | 必填 | 說明 |
 * |------------------------|---------|------|------|
 * | machine_number         | string  | N    | 機台編號 |
 * | name                   | string  | N    | 機台名稱 |
 * | model                  | string  | N    | 型號 |
 * | purchase_date          | string  | N    | 購買日期 |
 * | department_id          | int     | N    | 所屬部門 ID |
 * | status_lookup_id       | int     | N    | 狀態 lookup ID |
 * | lens_count             | int     | N    | 鏡頭數量 |
 * | length_mm              | decimal | N    | 長度(mm) |
 * | thread_outer_diameter_mm | decimal | N  | 螺牙外徑(mm) |
 * | notes                  | string  | N    | 備註 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {"id": 1, "machine_number": "M-001", "name": "選別機1號"}
 * }
 * ```
 *
 * @error 400 無效的機台 ID
 * @error 404 找不到指定的機台
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的機台ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT']);

switch ($method) {
    case 'GET':
        handleShowMachine($id);
        break;
    case 'PUT':
        handleUpdateMachine($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleShowMachine(int $id): void
{
    $pdo = db();

    $sql = 'SELECT m.id, m.machine_number, m.name, m.model, m.purchase_date, m.department_id, m.lens_count, m.length_mm, m.thread_outer_diameter_mm, m.notes, '
        . 'm.status_lookup_id, m.created_at, m.updated_at, d.name AS department_name, lv.value_label AS status_label, lv.value_key AS status_key '
        . 'FROM machines m '
        . 'LEFT JOIN departments d ON d.id = m.department_id '
        . 'LEFT JOIN lookup_values lv ON lv.id = m.status_lookup_id '
    . 'WHERE m.id = ? LIMIT 1';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    $machine = $stmt->fetch();
    if (!$machine) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的機台。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => transformMachine($machine),
    ]);
}

function handleUpdateMachine(int $id): void
{
    $pdo = db();
    $payload = readMachinePayload();

    $validated = validateMachineData($payload, true);
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

    if (array_key_exists('machine_number', $data)) {
        $checkStmt = $pdo->prepare('SELECT id FROM machines WHERE machine_number = :machine_number AND id <> :id AND deleted_at IS NULL');
        $checkStmt->execute([
            'machine_number' => $data['machine_number'],
            'id' => $id,
        ]);
        if ($checkStmt->fetch()) {
            jsonResponse([
                'success' => false,
                'message' => '機台編號已存在。',
            ], 409);
        }
    }

    try {
        $pdo->beginTransaction();

        $setParts = [];
        $params = [];
        foreach ($data as $column => $value) {
            $setParts[] = $column . ' = ?';
            if ($value === null) {
                $params[] = null;
            } elseif (in_array($column, ['department_id', 'status_lookup_id', 'lens_count'], true)) {
                $params[] = (int)$value;
            } else {
                $params[] = $value;
            }
        }
        $params[] = $id;

    $sql = 'UPDATE machines SET ' . implode(', ', $setParts) . ', updated_at = NOW() WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的機台或沒有資料需要更新。',
            ], 404);
        }

        $pdo->commit();

        logAuditAction('Updated machine data', 'machines', $id, $data);

        jsonResponse([
            'success' => true,
            'message' => '機台資料已更新。',
        ]);
    } catch (PDOException $exception) {
        $pdo->rollBack();
        $response = handleMachineWriteException($exception);
        jsonResponse($response, 500);
    }
}
