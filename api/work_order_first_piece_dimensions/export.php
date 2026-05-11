<?php
/**
 * 首件尺寸管理 API - 匯出端點
 *
 * 提供首件尺寸紀錄的 CSV 匯出功能。
 *
 * @endpoint GET /api/work_order_first_piece_dimensions/export.php
 *
 * @auth 必須登入
 * @table work_order_first_piece_dimensions, work_orders, order_items, orders, customers, screening_items, employees
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | keyword       | string | N    | 關鍵字搜尋 |
 * | start_date    | string | N    | 量測日期起始 |
 * | end_date      | string | N    | 量測日期結束 |
 * | work_order_id | int    | N    | 依工單 ID 篩選 |
 *
 * @output CSV 檔案下載
 * Content-Type: text/csv; charset=utf-8
 *
 * @error 405 不支援的請求方法
 *
 * @note 匯出欄位包含: ID, 工單編號, 批號, 客戶, 過篩項目, 量測時間, 量測人員, 各尺寸欄位, 備註
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$pdo = db();
handleExport($pdo);

function handleExport(PDO $pdo): void
{
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $startDate = isset($_GET['start_date']) ? trim($_GET['start_date']) : '';
    $endDate = isset($_GET['end_date']) ? trim($_GET['end_date']) : '';
    $workOrderId = isset($_GET['work_order_id']) ? (int)$_GET['work_order_id'] : 0;

    $whereClauses = ["1=1"];
    $params = [];

    if ($keyword) {
        $whereClauses[] = "(wo.work_order_number LIKE :keyword OR fpd.notes LIKE :keyword)";
        $params['keyword'] = "%$keyword%";
    }

    if ($startDate) {
        $whereClauses[] = "DATE(fpd.measured_at) >= :start_date";
        $params['start_date'] = $startDate;
    }

    if ($endDate) {
        $whereClauses[] = "DATE(fpd.measured_at) <= :end_date";
        $params['end_date'] = $endDate;
    }

    if ($workOrderId > 0) {
        $whereClauses[] = "fpd.work_order_id = :work_order_id";
        $params['work_order_id'] = $workOrderId;
    }

    $whereSql = implode(' AND ', $whereClauses);

    $sql = "
        SELECT
            fpd.id,
            wo.work_order_number,
            oi.customer_batch_number,
            c.name AS customer_name,
            si.name AS screening_item_name,
            fpd.measured_at,
            e.name AS measured_by_name,
            fpd.head_height,
            fpd.head_width,
            fpd.length,
            fpd.thread_outer_diameter,
            fpd.washer_diameter,
            fpd.outer_diameter,
            fpd.hole_diameter,
            fpd.thickness,
            fpd.notes
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN work_orders wo ON fpd.work_order_id = wo.id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN employees e ON fpd.measured_by_employee_id = e.id
        WHERE $whereSql
        ORDER BY fpd.measured_at DESC, fpd.id DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=first_piece_dimensions_' . date('YmdHis') . '.csv');

    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM for Excel

    fputcsv($output, [
        'ID', '工單號碼', '客戶批號', '客戶', '受篩產品',
        '測量時間', '測量人員',
        '頭高', '頭寬', '長度', '牙外徑',
        '華司徑', '外徑', '孔徑', '厚度', '備註'
    ]);

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }

    fclose($output);
}
