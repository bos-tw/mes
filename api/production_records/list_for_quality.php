<?php
/**
 * 生產記錄 API - 品質檢驗用列表
 *
 * 提供給生產品質檢驗選擇器使用的生產記錄列表。
 *
 * @endpoint GET /api/production_records/list_for_quality.php
 *
 * @auth 必須登入
 *
 * @table production_records  主表 - 生產記錄
 * @table work_orders         關聯 - 工單
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "card_number": "CARD-001",
 *     "work_order_id": 10,
 *     "work_order_number": "WO-20250115-0001"
 *   }]
 * }
 * ```
 *
 * @limit 最多回傳 100 筆
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$pdo = db();

try {
    $stmt = $pdo->query(
        'SELECT
            pr.id,
            pr.card_number,
            wo.id as work_order_id,
            wo.work_order_number
         FROM production_records pr
         INNER JOIN work_orders wo ON pr.work_order_id = wo.id
         ORDER BY pr.id DESC
         LIMIT 100'
    );

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $records,
    ]);
} catch (PDOException $e) {
    error_log('List production records failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '載入生產紀錄失敗。',
    ], 500);
}
