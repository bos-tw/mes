<?php
/**
 * 生產品質檢驗 API - 更新
 *
 * 更新指定檢驗記錄的資料。
 *
 * @endpoint PUT /api/production_quality_records/update.php
 * @method POST + _method=PUT (表單相容)
 *
 * @auth 必須登入
 *
 * @input JSON Body:
 * | 參數                  | 類型     | 必填 | 說明              |
 * |-----------------------|----------|-----|-----------------|
 * | id                    | int      | 是  | 檢驗記錄 ID       |
 * | production_record_id  | int      | 否  | 生產記錄 ID       |
 * | inspection_datetime   | datetime | 否  | 檢驗時間          |
 * | inspector_id          | int      | 否  | 檢驗員 ID         |
 * | sample_quantity_pcs   | int      | 否  | 抽樣數量          |
 * | defective_quantity_pcs| int      | 否  | 不良數量          |
 * | inspection_result     | string   | 否  | 檢驗結果          |
 * | rework_needed         | bool     | 否  | 是否需要重工       |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "生產品質檢驗記錄更新成功。"
 * }
 * ```
 *
 * @error 400 ID 無效 / 驗證失敗
 * @error 404 檢驗記錄不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

// 支援 PUT 和 POST + _method=PUT (FormData 相容)
requireMethod('PUT');
$data = readQualityRecordPayload();

$pdo = db();

if (empty($data['id'])) {
    jsonResponse([
        'success' => false,
        'message' => '缺少必要參數: id。',
    ], 400);
}

$id = (int)$data['id'];

// 檢查紀錄是否存在
$checkStmt = $pdo->prepare('SELECT * FROM production_quality_records WHERE id = :id');
$checkStmt->execute(['id' => $id]);
$oldRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);

if (!$oldRecord) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的生產品質檢驗紀錄。',
    ], 404);
}

// 驗證資料
$validation = validateQualityRecord($data, true);
if (!$validation['valid']) {
    jsonResponse([
        'success' => false,
        'message' => implode('; ', $validation['errors']),
    ], 400);
}

// 如果更新了 production_record_id，需要驗證其是否存在
if (isset($data['production_record_id'])) {
    $checkStmt = $pdo->prepare('SELECT id FROM production_records WHERE id = :id');
    $checkStmt->execute(['id' => $data['production_record_id']]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '指定的生產紀錄不存在。',
        ], 400);
    }
}

// 如果更新了 inspector_id，需要驗證其是否存在
if (isset($data['inspector_id'])) {
    $checkStmt = $pdo->prepare('SELECT id FROM employees WHERE id = :id');
    $checkStmt->execute(['id' => $data['inspector_id']]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '指定的檢驗員不存在。',
        ], 400);
    }
}

try {
    $pdo->beginTransaction();

    // 準備更新欄位
    $updateFields = [];
    $params = ['id' => $id];

    if (isset($data['production_record_id'])) {
        $updateFields[] = 'production_record_id = :production_record_id';
        $params['production_record_id'] = $data['production_record_id'];
    }

    if (isset($data['inspection_datetime'])) {
        $updateFields[] = 'inspection_datetime = :inspection_datetime';
        $params['inspection_datetime'] = $data['inspection_datetime'];
    }

    if (isset($data['inspector_id'])) {
        $updateFields[] = 'inspector_id = :inspector_id';
        $params['inspector_id'] = $data['inspector_id'];
    }

    if (isset($data['sample_quantity_pcs'])) {
        $updateFields[] = 'sample_quantity_pcs = :sample_quantity_pcs';
        $params['sample_quantity_pcs'] = (int)$data['sample_quantity_pcs'];
    }

    if (isset($data['defective_quantity_pcs'])) {
        $updateFields[] = 'defective_quantity_pcs = :defective_quantity_pcs';
        $params['defective_quantity_pcs'] = (int)$data['defective_quantity_pcs'];
    }

    // 重新計算不良率（如果數量有變更）
    if (isset($data['sample_quantity_pcs']) || isset($data['defective_quantity_pcs'])) {
        $sampleQty = isset($data['sample_quantity_pcs'])
            ? (int)$data['sample_quantity_pcs']
            : (int)$oldRecord['sample_quantity_pcs'];
        $defectiveQty = isset($data['defective_quantity_pcs'])
            ? (int)$data['defective_quantity_pcs']
            : (int)$oldRecord['defective_quantity_pcs'];

        $rejectionRatePpm = calculateRejectionRatePpm($sampleQty, $defectiveQty);
        $updateFields[] = 'rejection_rate_ppm = :rejection_rate_ppm';
        $params['rejection_rate_ppm'] = $rejectionRatePpm;
    }

    if (isset($data['inspection_result'])) {
        $updateFields[] = 'inspection_result = :inspection_result';
        $params['inspection_result'] = $data['inspection_result'];
    }

    if (isset($data['rework_needed'])) {
        $updateFields[] = 'rework_needed = :rework_needed';
        $params['rework_needed'] = (int)$data['rework_needed'];
    }

    if (isset($data['notes'])) {
        $updateFields[] = 'notes = :notes';
        $params['notes'] = $data['notes'];
    }

    if (empty($updateFields)) {
        jsonResponse([
            'success' => false,
            'message' => '沒有需要更新的欄位。',
        ], 400);
    }

    $sql = sprintf(
        'UPDATE production_quality_records SET %s WHERE id = :id',
        implode(', ', $updateFields)
    );

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // 記錄操作日誌
    logAuditAction(
        '更新生產品質檢驗紀錄',
        'production_quality_records',
        $id,
        ['old' => $oldRecord, 'new' => $data]
    );

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '生產品質檢驗紀錄已更新。',
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Update quality record failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '更新生產品質檢驗紀錄失敗。',
    ], 500);
}
