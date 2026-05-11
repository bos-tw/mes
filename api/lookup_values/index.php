<?php
/**
 * Lookup Values API - 列表查詢端點
 *
 * 提供系統查詢值的列表查詢功能，可根據 domain_key 或 domain_id 篩選。
 * 適用於下拉選單、狀態值等場景。
 *
 * @endpoint GET /api/lookup_values/
 *
 * @auth 必須登入
 * @table lookup_values, lookup_domains
 *
 * @input GET (Query string)
 * | 參數       | 類型   | 必填 | 說明 |
 * |------------|--------|------|------|
 * | domain_key | string | N    | Domain 代碼（如 MACHINE_STATUS）|
 * | domain_id  | int    | N    | Domain ID |
 *
 * @output 成功回應 (根據 domain_key/domain_id 查詢)
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {"id": 1, "value_key": "active", "value_label": "運作中", "sort_order": 1}
 *   ]
 * }
 * ```
 *
 * @output 成功回應 (無參數，回傳所有 domains)
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {"id": 1, "domain_key": "MACHINE_STATUS", "description": "機台狀態"}
 *   ]
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 500 查詢失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$method = requireMethod('GET');

switch ($method) {
    case 'GET':
        handleGetLookupValues();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleGetLookupValues(): void
{
    $pdo = db();

    $domainKey = trim((string)($_GET['domain_key'] ?? ''));
    $domainId = (int)($_GET['domain_id'] ?? 0);

    try {
        if ($domainKey !== '') {
            // 根據 domain_key 取得值
            $stmt = $pdo->prepare('
                SELECT lv.id, lv.value_key, lv.value_label, lv.sort_order, lv.is_active
                FROM lookup_values lv
                INNER JOIN lookup_domains ld ON lv.domain_id = ld.id
                WHERE ld.domain_key = ? AND lv.is_active = 1
                ORDER BY lv.sort_order ASC, lv.value_label ASC
            ');
            $stmt->execute([$domainKey]);

        } elseif ($domainId > 0) {
            // 根據 domain_id 取得值
            $stmt = $pdo->prepare('
                SELECT lv.id, lv.value_key, lv.value_label, lv.sort_order, lv.is_active
                FROM lookup_values lv
                WHERE lv.domain_id = ? AND lv.is_active = 1
                ORDER BY lv.sort_order ASC, lv.value_label ASC
            ');
            $stmt->execute([$domainId]);

        } else {
            // 取得所有 domains
            $stmt = $pdo->prepare('
                SELECT id, domain_key, description
                FROM lookup_domains
                ORDER BY domain_key ASC
            ');
            $stmt->execute();
        }

        $values = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'data' => $values,
        ]);

    } catch (Exception $e) {
        error_log('Failed to get lookup values: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '取得查詢值失敗，請稍後再試。',
        ], 500);
    }
}