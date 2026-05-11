<?php
/**
 * 儀表板 API - 訂單統計端點
 *
 * 提供儀表板所需的訂單統計資料，包含月度統計與最新訂單。
 *
 * @endpoint GET /api/dashboard/orders_stats.php
 *
 * @auth 必須登入
 * @table orders, customers
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
 *     "total_count": 25,
 *     "total_amount": 1500000,
 *     "recent": [
 *       {
 *         "order_number": "ORD-001",
 *         "order_date": "2024-01-15",
 *         "total_amount": 50000,
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

handleOrdersStats();

function handleOrdersStats(): void
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
    $whereConditions = ["deleted_at IS NULL", "status != 'cancelled'"];
    $params = [];
    
    if ($startDate && $endDate) {
        // 優先使用日期區間
        $whereConditions[] = "order_date >= :start_date";
        $whereConditions[] = "order_date <= :end_date";
        $params[':start_date'] = $startDate;
        $params[':end_date'] = $endDate;
    } elseif ($month !== null) {
        // 使用年月篩選
        $whereConditions[] = "YEAR(order_date) = :year";
        $whereConditions[] = "MONTH(order_date) = :month";
        $params[':year'] = $year;
        $params[':month'] = $month;
    } else {
        // 只用年份篩選
        $whereConditions[] = "YEAR(order_date) = :year";
        $params[':year'] = $year;
    }
    
    $whereClause = implode(' AND ', $whereConditions);

    try {
        // 計算訂單統計
        $statsQuery = "
            SELECT
                COUNT(*) as total_count,
                COALESCE(SUM(total_amount), 0) as total_amount
            FROM orders
            WHERE {$whereClause}
        ";

        $stmt = $pdo->prepare($statsQuery);
        $stmt->execute($params);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        // 計算狀態分佈
        $statusQuery = "
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            WHERE {$whereClause}
            GROUP BY status
            ORDER BY count DESC
        ";
        
        $stmt = $pdo->prepare($statusQuery);
        $stmt->execute($params);
        $statusDistribution = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusDistribution[] = [
                'status' => $row['status'],
                'label' => translateOrderStatus($row['status']),
                'count' => (int)$row['count']
            ];
        }

        // 取得最新5筆訂單（使用相同的篩選條件）
        // 為 JOIN 查詢建立帶有表別名的條件
        $recentWhereConditions = ["o.deleted_at IS NULL", "o.status != 'cancelled'"];
        
        if ($startDate && $endDate) {
            $recentWhereConditions[] = "o.order_date >= :start_date";
            $recentWhereConditions[] = "o.order_date <= :end_date";
        } elseif ($month !== null) {
            $recentWhereConditions[] = "YEAR(o.order_date) = :year";
            $recentWhereConditions[] = "MONTH(o.order_date) = :month";
        } else {
            $recentWhereConditions[] = "YEAR(o.order_date) = :year";
        }
        
        $recentWhereClause = implode(' AND ', $recentWhereConditions);
        
        $recentQuery = "
            SELECT
                o.id,
                o.order_number,
                o.order_date,
                o.total_amount,
                o.status,
                c.name as customer_name,
                o.customer_po_number
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE {$recentWhereClause}
            ORDER BY o.order_date DESC, o.created_at DESC
            LIMIT 5
        ";

        $stmt = $pdo->prepare($recentQuery);
        $stmt->execute($params);
        $recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 處理狀態顯示
        foreach ($recentOrders as &$order) {
            $order['id'] = (int)$order['id'];
            $order['total_amount'] = (float)$order['total_amount'];
            $order['status_label'] = translateOrderStatus($order['status']);
        }

        jsonResponse([
            'success' => true,
            'year' => $year,
            'month' => $month,
            'total_count' => (int)$stats['total_count'],
            'total_amount' => (float)$stats['total_amount'],
            'status_distribution' => $statusDistribution,
            'recent_orders' => $recentOrders
        ]);

    } catch (PDOException $e) {
        error_log('訂單統計查詢錯誤: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢訂單統計時發生錯誤。'
        ], 500);
    }
}

/**
 * 翻譯訂單狀態
 */
function translateOrderStatus(string $status): string
{
    $statusMap = [
        'pending' => '待確認',
        'confirmed' => '已確認',
        'in_production' => '生產中',
        'completed' => '已完成',
        'cancelled' => '已取消',
        'on_hold' => '暫停'
    ];

    return $statusMap[$status] ?? $status;
}
