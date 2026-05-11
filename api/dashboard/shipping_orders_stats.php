<?php
/**
 * 儀表板 API - 出貨單統計端點
 *
 * 提供儀表板所需的出貨單統計資料，包含月度統計與最新出貨單。
 *
 * @endpoint GET /api/dashboard/shipping_orders_stats.php
 *
 * @auth 必須登入
 * @table shipping_orders, customers
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
 *     "total_count": 15,
 *     "recent": [
 *       {
 *         "shipping_order_number": "SO-001",
 *         "shipping_date": "2024-01-15",
 *         "status": "pending",
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

handleShippingOrdersStats();

function handleShippingOrdersStats(): void
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
        $whereConditions[] = "shipping_date >= :start_date";
        $whereConditions[] = "shipping_date <= :end_date";
        $params[':start_date'] = $startDate;
        $params[':end_date'] = $endDate;
    } elseif ($month !== null) {
        $whereConditions[] = "YEAR(shipping_date) = :year";
        $whereConditions[] = "MONTH(shipping_date) = :month";
        $params[':year'] = $year;
        $params[':month'] = $month;
    } else {
        $whereConditions[] = "YEAR(shipping_date) = :year";
        $params[':year'] = $year;
    }
    
    $whereClause = implode(' AND ', $whereConditions);

    try {
        // 計算出貨單統計
        $statsQuery = "
            SELECT
                COUNT(*) as total_count,
                SUM(CASE WHEN status IN ('draft', 'pending') THEN 1 ELSE 0 END) as pending_count
            FROM shipping_orders
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
            FROM shipping_orders
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
                'label' => translateShippingStatus($row['status']),
                'count' => (int)$row['count']
            ];
        }

        // 取得最新5筆出貨單
        $recentQuery = "
            SELECT
                so.id,
                so.shipping_order_number,
                so.shipping_date,
                so.status,
                c.name as customer_name
            FROM shipping_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.deleted_at IS NULL AND so.status != 'cancelled'
        ";
        
        // 加入日期篩選條件
        if ($startDate && $endDate) {
            $recentQuery .= " AND so.shipping_date >= :start_date AND so.shipping_date <= :end_date";
        } elseif ($month !== null) {
            $recentQuery .= " AND YEAR(so.shipping_date) = :year AND MONTH(so.shipping_date) = :month";
        } else {
            $recentQuery .= " AND YEAR(so.shipping_date) = :year";
        }
        
        $recentQuery .= " ORDER BY so.shipping_date DESC, so.created_at DESC LIMIT 5";

        $stmt = $pdo->prepare($recentQuery);
        $stmt->execute($params);
        $recentShippingOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 處理狀態顯示
        foreach ($recentShippingOrders as &$so) {
            $so['id'] = (int)$so['id'];
            $so['status_label'] = translateShippingStatus($so['status']);
        }

        jsonResponse([
            'success' => true,
            'year' => $year,
            'month' => $month,
            'total_count' => (int)$stats['total_count'],
            'pending_count' => (int)($stats['pending_count'] ?? 0),
            'status_distribution' => $statusDistribution,
            'recent_shipping_orders' => $recentShippingOrders
        ]);

    } catch (PDOException $e) {
        error_log('出貨單統計查詢錯誤: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢出貨單統計時發生錯誤。'
        ], 500);
    }
}

/**
 * 翻譯出貨單狀態
 */
function translateShippingStatus(string $status): string
{
    $statusMap = [
        'pending' => '待出貨',
        'shipped' => '已出貨',
        'delivered' => '已送達',
        'cancelled' => '已取消'
    ];

    return $statusMap[$status] ?? $status;
}
