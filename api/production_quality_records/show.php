<?php
/**
 * 生產品質檢驗 API - 單筆查詢
 *
 * 取得指定檢驗記錄的完整資料。
 *
 * @endpoint GET /api/production_quality_records/show.php?id={int}
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明      |
 * |-----|------|-----|----------|
 * | id  | int  | 是  | 檢驗記錄 ID |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "production_record_id": 10,
 *     "work_order_number": "WO-20250115-0001",
 *     "inspector_name": "張三",
 *     "sample_quantity_pcs": 1000,
 *     "defective_quantity_pcs": 5,
 *     "rejection_rate_ppm": 5000,
 *     "inspection_result": "passed"
 *   }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 檢驗記錄不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = $_GET['id'] ?? null;

if ($id === null || $id === '' || !is_numeric($id)) {
    jsonResponse([
        'success' => false,
        'message' => '必須提供有效的記錄 ID。',
    ], 400);
}

$pdo = db();

$stmt = $pdo->prepare(
    'SELECT
        pqr.id,
        pqr.production_record_id,
        pqr.inspection_datetime,
        pqr.inspector_id,
        pqr.sample_quantity_pcs,
        pqr.defective_quantity_pcs,
        pqr.rejection_rate_ppm,
        pqr.inspection_result,
        pqr.rework_needed,
        pqr.notes,
        pqr.created_at,
        pqr.updated_at,
        pr.card_number,
        pr.weight_kg,
        wo.id as work_order_id,
        wo.work_order_number,
        emp.name as inspector_name
     FROM production_quality_records pqr
     LEFT JOIN production_records pr ON pqr.production_record_id = pr.id
     LEFT JOIN work_orders wo ON pr.work_order_id = wo.id
     LEFT JOIN employees emp ON pqr.inspector_id = emp.id
     WHERE pqr.id = :id
     LIMIT 1'
);

$stmt->execute(['id' => (int)$id]);
$record = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$record) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的生產品質檢驗紀錄。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => $record,
]);
