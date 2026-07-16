<?php
/**
 * 首件尺寸管理 API - 單筆查詢端點
 *
 * 根據 ID 取得單筆首件尺寸紀錄詳細資料。
 *
 * @endpoint GET /api/work_order_first_piece_dimensions/show.php?id={id}
 *
 * @auth 必須登入
 * @table work_order_first_piece_dimensions, work_orders, order_items, orders, customers, screening_items, employees
 *
 * @input GET
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 首件尺寸紀錄 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "work_order_id": 100,
 *     "work_order_number": "WO-001",
 *     "customer_batch_number": "B-001",
 *     "customer_name": "客戶A",
 *     "screening_item_name": "過篩項目A",
 *     "measured_at": "2024-01-01T10:00",
 *     "measured_by_name": "張三",
 *     "head_height": "5.00",
 *     "head_width": "10.00",
 *     "length": "25.00"
 *   }
 * }
 * ```
 *
 * @error 400 無效的 ID
 * @error 404 找不到該紀錄
 * @error 405 不支援的請求方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$pdo = db();
handleGet($pdo);

function handleGet(PDO $pdo): void
{
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
    }

    $sql = "
        SELECT
            fpd.*,
            wo.work_order_number,
            work_order_status.value_key AS work_order_status,
            e.name AS measured_by_name,
            oi.customer_batch_number,
            c.name AS customer_name,
            si.name AS screening_item_name
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN work_orders wo ON fpd.work_order_id = wo.id
        LEFT JOIN lookup_values work_order_status ON wo.status_lookup_id = work_order_status.id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN employees e ON fpd.measured_by_employee_id = e.id
        WHERE fpd.id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($data) {
        // Format datetime for input[type="datetime-local"]
        if ($data['measured_at']) {
            $timestamp = strtotime($data['measured_at']);
            if ($timestamp !== false) {
                $data['measured_at'] = date('Y-m-d\TH:i', $timestamp);
            }
        }
        jsonResponse(['success' => true, 'data' => $data]);
    } else {
        jsonResponse(['success' => false, 'message' => '找不到該紀錄。'], 404);
    }
}
