<?php
/**
 * 儀表板 API - 圖表資料端點
 *
 * 提供儀表板所需的圖表統計資料，包含訂單狀態分佈、工單狀態分佈、月度趨勢等。
 *
 * @endpoint GET /api/dashboard/charts_data.php
 *
 * @auth 必須登入
 * @table orders, work_orders, shipping_orders
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
 *     "order_status_distribution": [...],
 *     "work_order_status_distribution": [...],
 *     "monthly_trends": [...],
 *     "top_customers": [...]
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

handleChartsData();

function handleChartsData(): void
{
    $pdo = db();

    // 取得年份參數
    $year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

    // 驗證參數
    if ($year < 2000 || $year > 2100) {
        $year = (int)date('Y');
    }

    try {
        $data = [
            'year' => $year,
            'order_status_distribution' => getOrderStatusDistribution($pdo, $year),
            'work_order_status_distribution' => getWorkOrderStatusDistribution($pdo, $year),
            'monthly_trends' => getMonthlyTrends($pdo, $year),
            'top_customers' => getTopCustomers($pdo, $year),
            'shipping_status_distribution' => getShippingStatusDistribution($pdo, $year)
        ];

        jsonResponse([
            'success' => true,
            'data' => $data
        ]);
    } catch (PDOException $e) {
        error_log('圖表資料查詢錯誤: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢資料時發生錯誤。',
        ], 500);
    }
}

/**
 * 取得訂單狀態分佈
 */
function getOrderStatusDistribution(PDO $pdo, int $year): array
{
    $query = "
        SELECT 
            status,
            COUNT(*) as count
        FROM orders
        WHERE YEAR(order_date) = :year
            AND deleted_at IS NULL
        GROUP BY status
        ORDER BY count DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([':year' => $year]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 轉換狀態名稱
    $statusLabels = [
        'draft' => '草稿',
        'pending' => '待處理',
        'confirmed' => '已確認',
        'in_production' => '生產中',
        'shipped' => '已出貨',
        'completed' => '已完成',
        'cancelled' => '已取消',
        'closed' => '已結案'
    ];

    return array_map(function($item) use ($statusLabels) {
        return [
            'status' => $item['status'],
            'label' => $statusLabels[$item['status']] ?? $item['status'],
            'count' => (int)$item['count']
        ];
    }, $results);
}

/**
 * 取得工單狀態分佈
 */
function getWorkOrderStatusDistribution(PDO $pdo, int $year): array
{
    $query = "
        SELECT 
            lv.value_key AS status,
            lv.value_label AS label,
            COUNT(*) as count
        FROM work_orders wo
        JOIN lookup_values lv ON lv.id = wo.status_lookup_id
        WHERE YEAR(wo.scheduled_start_date) = :year
            AND wo.deleted_at IS NULL
        GROUP BY lv.id, lv.value_key, lv.value_label
        ORDER BY count DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([':year' => $year]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 轉換狀態名稱
    $statusLabels = [
        'pending' => '待處理',
        'in_progress' => '進行中',
        'paused' => '暫停',
        'completed' => '已完成',
        'cancelled' => '已取消'
    ];

    return array_map(function($item) use ($statusLabels) {
        return [
            'status' => $item['status'],
            'label' => $item['label'] ?? $statusLabels[$item['status']] ?? $item['status'],
            'count' => (int)$item['count']
        ];
    }, $results);
}

/**
 * 取得出貨單狀態分佈
 */
function getShippingStatusDistribution(PDO $pdo, int $year): array
{
    $query = "
        SELECT 
            status,
            COUNT(*) as count
        FROM shipping_orders
        WHERE YEAR(shipping_date) = :year
            AND deleted_at IS NULL
        GROUP BY status
        ORDER BY count DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([':year' => $year]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 轉換狀態名稱
    $statusLabels = [
        'draft' => '草稿',
        'pending' => '待出貨',
        'shipped' => '已出貨',
        'delivered' => '已送達',
        'completed' => '已完成',
        'cancelled' => '已取消'
    ];

    return array_map(function($item) use ($statusLabels) {
        return [
            'status' => $item['status'],
            'label' => $statusLabels[$item['status']] ?? $item['status'],
            'count' => (int)$item['count']
        ];
    }, $results);
}

/**
 * 取得月度趨勢資料
 */
function getMonthlyTrends(PDO $pdo, int $year): array
{
    // 訂單月度趨勢
    $ordersQuery = "
        SELECT 
            MONTH(order_date) as month,
            COUNT(*) as count,
            COALESCE(SUM(total_amount), 0) as amount
        FROM orders
        WHERE YEAR(order_date) = :year
            AND deleted_at IS NULL
            AND status != 'cancelled'
        GROUP BY MONTH(order_date)
        ORDER BY month
    ";

    $stmt = $pdo->prepare($ordersQuery);
    $stmt->execute([':year' => $year]);
    $ordersData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 工單月度趨勢
    $workOrdersQuery = "
        SELECT 
            MONTH(scheduled_start_date) as month,
            COUNT(*) as count
        FROM work_orders
        WHERE YEAR(scheduled_start_date) = :year
            AND deleted_at IS NULL
        GROUP BY MONTH(scheduled_start_date)
        ORDER BY month
    ";

    $stmt = $pdo->prepare($workOrdersQuery);
    $stmt->execute([':year' => $year]);
    $workOrdersData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 出貨單月度趨勢
    $shippingQuery = "
        SELECT 
            MONTH(shipping_date) as month,
            COUNT(*) as count
        FROM shipping_orders
        WHERE YEAR(shipping_date) = :year
            AND deleted_at IS NULL
            AND status != 'cancelled'
        GROUP BY MONTH(shipping_date)
        ORDER BY month
    ";

    $stmt = $pdo->prepare($shippingQuery);
    $stmt->execute([':year' => $year]);
    $shippingData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 整理成12個月的資料
    $monthlyData = [];
    $monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    for ($i = 1; $i <= 12; $i++) {
        $monthlyData[$i] = [
            'month' => $i,
            'label' => $monthNames[$i - 1],
            'orders' => 0,
            'orders_amount' => 0,
            'work_orders' => 0,
            'shipping_orders' => 0
        ];
    }

    foreach ($ordersData as $item) {
        $m = (int)$item['month'];
        $monthlyData[$m]['orders'] = (int)$item['count'];
        $monthlyData[$m]['orders_amount'] = (float)$item['amount'];
    }

    foreach ($workOrdersData as $item) {
        $m = (int)$item['month'];
        $monthlyData[$m]['work_orders'] = (int)$item['count'];
    }

    foreach ($shippingData as $item) {
        $m = (int)$item['month'];
        $monthlyData[$m]['shipping_orders'] = (int)$item['count'];
    }

    return array_values($monthlyData);
}

/**
 * 取得 Top 5 客戶（依訂單金額）
 */
function getTopCustomers(PDO $pdo, int $year): array
{
    $query = "
        SELECT 
            c.name as customer_name,
            COUNT(o.id) as order_count,
            COALESCE(SUM(o.total_amount), 0) as total_amount
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE YEAR(o.order_date) = :year
            AND o.deleted_at IS NULL
            AND o.status != 'cancelled'
        GROUP BY c.id, c.name
        ORDER BY total_amount DESC
        LIMIT 5
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([':year' => $year]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return array_map(function($item) {
        return [
            'customer_name' => $item['customer_name'] ?: '未命名客戶',
            'order_count' => (int)$item['order_count'],
            'total_amount' => (float)$item['total_amount']
        ];
    }, $results);
}
