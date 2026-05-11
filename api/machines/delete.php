<?php
/**
 * 機台管理 API - 刪除端點
 *
 * 提供機台的實體刪除功能。
 *
 * @endpoint DELETE /api/machines/delete.php?id={id}
 *
 * @auth 必須登入
 * @table machines
 *
 * @input DELETE
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 機台 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "機台已刪除。"
 * }
 * ```
 *
 * @error 400 無效的機台 ID
 * @error 404 找不到指定的機台
 * @error 405 不支援的請求方法
 *
 * @logic
 * 1. 使用交易確保資料一致性
 * 2. 查詢機台資料（用於稽核記錄）
 * 3. 執行實體刪除
 * 4. 記錄稽核日誌
 *
 * @warning 此為實體刪除，資料將無法恢復
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的機台ID。',
    ], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT machine_number, name FROM machines WHERE id = ?');
    $stmt->execute([$id]);
    $machine = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$machine) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的機台。',
        ], 404);
    }

    // 檢查是否有關聯資料
    $relatedTables = [
        ['table' => 'daily_machine_inspections', 'column' => 'machine_id', 'label' => '每日機台檢驗'],
        ['table' => 'machine_maintenance_tasks', 'column' => 'machine_id', 'label' => '維修任務'],
        ['table' => 'work_orders', 'column' => 'machine_id', 'label' => '生產工單', 'softDelete' => true],
        ['table' => 'production_records', 'column' => 'machine_id', 'label' => '生產紀錄'],
    ];
    $relatedLabels = [];
    foreach ($relatedTables as $rel) {
        $softDeleteCondition = isset($rel['softDelete']) && $rel['softDelete'] ? ' AND deleted_at IS NULL' : '';
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM {$rel['table']} WHERE {$rel['column']} = ?{$softDeleteCondition}");
        $checkStmt->execute([$id]);
        if ((int)$checkStmt->fetchColumn() > 0) {
            $relatedLabels[] = $rel['label'];
        }
    }
    if (!empty($relatedLabels)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '此機台有相關的' . implode('、', $relatedLabels) . '資料，請先刪除相關資料後再刪除機台。',
        ], 409);
    }

    $deleteStmt = $pdo->prepare('DELETE FROM machines WHERE id = ?');
    $deleteStmt->execute([$id]);

    if ($deleteStmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的機台。',
        ], 404);
    }

    logAuditAction('Deleted machine', 'machines', $id, [
        'machine_number' => $machine['machine_number'] ?? null,
        'name' => $machine['name'] ?? null,
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '機台資料已刪除。',
    ]);
} catch (PDOException $exception) {
    $pdo->rollBack();
    $response = handleMachineWriteException($exception);
    jsonResponse($response, 500);
}
