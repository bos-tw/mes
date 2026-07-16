<?php
/**
 * 儀表板 API - 工單統計端點
 *
 * 提供儀表板所需的工單統計資料，包含月度統計與最新工單。
 *
 * @endpoint GET /api/dashboard/work_orders_stats.php
 *
 * @auth 必須登入
 * @table work_orders, order_items, orders, customers
 *
 * @input GET (Query string)
 * | 參數  | 類型 | 必填 | 說明 |
 * |-------|------|------|------|
 * | year  | int  | N    | 年份，預設當年 |
 * | month | int  | N    | 月份，預設當月 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "year": 2024,
 *     "month": 1,
 *     "total_count": 30,
 *     "active_count": 12,
 *     "recent": [
 *       {
 *         "work_order_number": "WO-001",
 *         "scheduled_start_date": "2024-01-15",
 *         "scheduled_end_date": "2024-01-20",
 *         "status": "in_progress",
 *         "customer_name": "客戶A"
 *       }
 *     ]
 *   }
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

handleWorkOrdersStats();

function handleWorkOrdersStats(): void
{
    $pdo = db();

    // 取得篩選參數
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');
    $month = isset($_GET['month']) && $_GET['month'] !== '' ? (int)$_GET['month'] : null;
    $startDate = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? $_GET['start_date'] : null;
    $endDate = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? $_GET['end_date'] : null;

    // 驗證年份
    if ($year < 2000 || $year > 2100) {
        $year = (int)date('Y');
    }

    // 建立查詢條件
    $whereConditions = ["wo.deleted_at IS NULL"];
    $params = [];

    if ($startDate && $endDate) {
        $whereConditions[] = "wo.scheduled_start_date >= :start_date";
        $whereConditions[] = "wo.scheduled_start_date <= :end_date";
        $params[':start_date'] = $startDate;
        $params[':end_date'] = $endDate;
    } elseif ($month !== null) {
        $whereConditions[] = "YEAR(wo.scheduled_start_date) = :year";
        $whereConditions[] = "MONTH(wo.scheduled_start_date) = :month";
        $params[':year'] = $year;
        $params[':month'] = $month;
    } else {
        $whereConditions[] = "YEAR(wo.scheduled_start_date) = :year";
        $params[':year'] = $year;
    }

    $whereClause = implode(' AND ', $whereConditions);

    try {
        // 計算工單統計
        $statsQuery = "
            SELECT
                COUNT(*) as total_count,
                SUM(CASE WHEN lv.value_key IN ('pending', 'in_progress') THEN 1 ELSE 0 END) as active_count
            FROM work_orders wo
            JOIN lookup_values lv ON lv.id = wo.status_lookup_id
            WHERE {$whereClause}
        ";

        $stmt = $pdo->prepare($statsQuery);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // 計算狀態分佈
        $statusQuery = "
            SELECT
                lv.value_key AS status,
                COUNT(*) as count
            FROM work_orders wo
            JOIN lookup_values lv ON lv.id = wo.status_lookup_id
            WHERE {$whereClause}
            GROUP BY lv.value_key
            ORDER BY count DESC
        ";

        $stmt = $pdo->prepare($statusQuery);
        $stmt->execute($params);
        $statusDistribution = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $status = isset($row['status']) ? (string)$row['status'] : null;
            $statusDistribution[] = [
                'status' => $status,
                'label' => translateWorkOrderStatus($status),
                'count' => (int)$row['count']
            ];
        }

        // 取得最新5筆工單
        $recentQuery = "
            SELECT
                wo.id,
                wo.work_order_number,
                wo.scheduled_start_date,
                wo.scheduled_end_date,
                lv.value_key AS status,
                o.order_number
            FROM work_orders wo
            LEFT JOIN order_items oi ON wo.order_item_id = oi.id
            LEFT JOIN orders o ON oi.order_id = o.id
            JOIN lookup_values lv ON lv.id = wo.status_lookup_id
            WHERE wo.deleted_at IS NULL
        ";

        // 加入日期篩選條件
        if ($startDate && $endDate) {
            $recentQuery .= " AND wo.scheduled_start_date >= :start_date AND wo.scheduled_start_date <= :end_date";
        } elseif ($month !== null) {
            $recentQuery .= " AND YEAR(wo.scheduled_start_date) = :year AND MONTH(wo.scheduled_start_date) = :month";
        } else {
            $recentQuery .= " AND YEAR(wo.scheduled_start_date) = :year";
        }

        $recentQuery .= " ORDER BY wo.scheduled_start_date DESC, wo.created_at DESC LIMIT 5";

        $stmt = $pdo->prepare($recentQuery);
        $stmt->execute($params);
        $recentWorkOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 處理狀態顯示
        foreach ($recentWorkOrders as &$wo) {
            $wo['id'] = (int)$wo['id'];
            $wo['status_label'] = translateWorkOrderStatus(isset($wo['status']) ? (string)$wo['status'] : null);
        }

        jsonResponse([
            'success' => true,
            'year' => $year,
            'month' => $month,
            'total_count' => (int)$stats['total_count'],
            'active_count' => (int)$stats['active_count'],
            'status_distribution' => $statusDistribution,
            'recent_work_orders' => $recentWorkOrders
        ]);

    } catch (Throwable $e) {
        error_log('工單統計查詢錯誤: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢工單統計時發生錯誤。'
        ], 500);
    }
}

/**
 * 翻譯工單狀態
 */
function translateWorkOrderStatus(?string $status): string
{
    if ($status === null || $status === '') {
        return '未設定';
    }

    $statusMap = [
        'pending' => '待開始',
        'in_progress' => '進行中',
        'completed' => '已完成',
        'cancelled' => '已取消',
        'on_hold' => '暫停'
    ];

    return $statusMap[$status] ?? $status;
}
