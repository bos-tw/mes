<?php
/**
 * Lookup Values API - 單筆查詢端點
 *
 * 取得單一 lookup value 的詳細資料。
 *
 * @endpoint GET /api/lookup_values/show.php?id={id}
 *
 * @auth 必須登入
 * @table lookup_values, lookup_domains
 *
 * @input GET (Query string)
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | Lookup Value ID |
 *
 * @output 成功回應 (200)
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "domain_id": 1,
 *     "domain_key": "MACHINE_STATUS",
 *     "domain_description": "機台狀態",
 *     "value_key": "active",
 *     "value_label": "運作中",
 *     "sort_order": 1,
 *     "is_active": 1,
 *     "created_at": "2024-01-01 00:00:00",
 *     "updated_at": "2024-01-01 00:00:00"
 *   }
 * }
 * ```
 *
 * @error 400 無效的 ID
 * @error 404 找不到指定的 Lookup Value
 * @error 405 不支援的請求方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 Lookup Value ID。',
    ], 400);
}

$pdo = db();

$stmt = $pdo->prepare('
    SELECT
        lv.id,
        lv.domain_id,
        ld.domain_key,
        ld.description AS domain_description,
        lv.value_key,
        lv.value_label,
        lv.sort_order,
        lv.is_active,
        lv.created_at,
        lv.updated_at
    FROM lookup_values lv
    INNER JOIN lookup_domains ld ON lv.domain_id = ld.id
    WHERE lv.id = ?
');
$stmt->execute([$id]);

$row = $stmt->fetch();
if ($row === false) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的 Lookup Value。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => [
        'id' => (int)$row['id'],
        'domain_id' => (int)$row['domain_id'],
        'domain_key' => $row['domain_key'],
        'domain_description' => $row['domain_description'],
        'value_key' => $row['value_key'],
        'value_label' => $row['value_label'],
        'sort_order' => (int)$row['sort_order'],
        'is_active' => (int)$row['is_active'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ],
]);
