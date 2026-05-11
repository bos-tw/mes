<?php
/**
 * 機台管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆機台詳細資料。
 *
 * @endpoint GET /api/machines/show.php?id={id}
 *
 * @auth 必須登入
 * @table machines, departments, lookup_values
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 機台 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "machine_number": "M-001",
 *     "name": "選別機1號",
 *     "model": "SB-2000",
 *     "department_id": 2,
 *     "department_name": "生產部",
 *     "status_lookup_id": 10,
 *     "status_label": "運作中"
 *   }
 * }
 * ```
 *
 * @error 400 無效的機台 ID
 * @error 404 找不到指定的機台
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireMethod('GET');
requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的機台ID。',
    ], 400);
}

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
