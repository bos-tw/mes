<?php
/**
 * 儀表板 API - 行事曆事件端點
 *
 * 提供儀表板行事曆所需的事件資料，包含訂單、工單、出貨單等時程。
 *
 * @endpoint GET /api/dashboard/calendar_events.php
 *
 * @auth 必須登入
 * @table orders, work_orders, shipping_orders, customers
 *
 * @input GET (Query string)
 * | 參數  | 類型   | 必填 | 說明 |
 * |-------|--------|------|------|
 * | start | string | N    | 開始日期，預設當月第一天 |
 * | end   | string | N    | 結束日期，預設當月最後一天 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "order-1",
 *       "title": "訂單: ORD-001 (客戶A)",
 *       "start": "2024-01-01",
 *       "end": "2024-01-15",
 *       "type": "order",
 *       "status": "confirmed",
 *       "color": "#3788d8"
 *     }
 *   ]
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 *
 * @note 事件類型包含: order(訂單), work_order(工單), shipping(出貨)
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

handleCalendarEvents();

function handleCalendarEvents(): void
{
    $pdo = db();

    // 取得日期範圍參數
    $start = isset($_GET['start']) ? trim($_GET['start']) : date('Y-m-01');
    $end = isset($_GET['end']) ? trim($_GET['end']) : date('Y-m-t');

    try {
        $events = [];

        // 取得訂單事件（訂單日期到交貨日期）
        $ordersQuery = "
            SELECT
                o.order_number,
                o.order_date as start_date,
                o.expected_delivery_date as end_date,
                c.name as customer_name,
                o.status
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE o.deleted_at IS NULL
                AND o.status != 'cancelled'
                AND (
                    (o.order_date BETWEEN :start1 AND :end1)
                    OR (o.expected_delivery_date BETWEEN :start2 AND :end2)
                    OR (o.order_date <= :start3 AND o.expected_delivery_date >= :end3)
                )
            ORDER BY o.order_date
        ";

        $stmt = $pdo->prepare($ordersQuery);
        $stmt->execute([
            ':start1' => $start,
            ':end1' => $end,
            ':start2' => $start,
            ':end2' => $end,
            ':start3' => $start,
            ':end3' => $end
        ]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($orders as $order) {
            $events[] = [
                'id' => 'order-' . $order['order_number'],
                'title' => '訂單: ' . $order['order_number'] . ' - ' . ($order['customer_name'] ?: '未知客戶'),
                'start' => $order['start_date'],
                'end' => $order['end_date'],
                'backgroundColor' => '#1a73e8',
                'borderColor' => '#1557b0',
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'type' => 'order',
                    'sourceId' => $order['order_number'],
                    'status' => $order['status']
                ]
            ];

            // 如果有交貨日期，加入交貨提醒事件
            if ($order['end_date']) {
                $events[] = [
                    'id' => 'order-delivery-' . $order['order_number'],
                    'title' => '🚚 交貨: ' . $order['order_number'],
                    'start' => $order['end_date'],
                    'backgroundColor' => '#ea4335',
                    'borderColor' => '#c5221f',
                    'textColor' => '#ffffff',
                    'extendedProps' => [
                        'type' => 'order_delivery',
                        'sourceId' => $order['order_number'],
                        'status' => $order['status']
                    ]
                ];
            }
        }

        // 取得工單事件（開始日期到完成日期）
        $workOrdersQuery = "
            SELECT
                wo.work_order_number,
                wo.scheduled_start_date as start_date,
                wo.scheduled_end_date as due_date,
                wo.status,
                o.order_number
            FROM work_orders wo
            LEFT JOIN order_items oi ON wo.order_item_id = oi.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE wo.deleted_at IS NULL
                AND wo.status != 'cancelled'
                AND (
                    (wo.scheduled_start_date BETWEEN :start1 AND :end1)
                    OR (wo.scheduled_end_date BETWEEN :start2 AND :end2)
                    OR (wo.scheduled_start_date <= :start3 AND wo.scheduled_end_date >= :end3)
                )
            ORDER BY wo.scheduled_start_date
        ";

        $stmt = $pdo->prepare($workOrdersQuery);
        $stmt->execute([
            ':start1' => $start,
            ':end1' => $end,
            ':start2' => $start,
            ':end2' => $end,
            ':start3' => $start,
            ':end3' => $end
        ]);
        $workOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($workOrders as $wo) {
            $events[] = [
                'id' => 'workorder-' . $wo['work_order_number'],
                'title' => '工單: ' . $wo['work_order_number'] . ($wo['order_number'] ? ' (' . $wo['order_number'] . ')' : ''),
                'start' => $wo['start_date'],
                'end' => $wo['due_date'],
                'backgroundColor' => '#f9ab00',
                'borderColor' => '#e37400',
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'type' => 'work_order',
                    'sourceId' => $wo['work_order_number'],
                    'status' => $wo['status']
                ]
            ];
        }

        // 取得出貨事件（出貨日期）
        $shippingOrdersQuery = "
            SELECT
                so.id,
                so.shipping_order_number,
                so.shipping_date,
                so.status,
                c.name AS customer_name
            FROM shipping_orders so
            LEFT JOIN customers c ON so.customer_id = c.id
            WHERE so.deleted_at IS NULL
                AND so.status != 'cancelled'
                AND so.shipping_date BETWEEN :start AND :end
            ORDER BY so.shipping_date
        ";

        $stmt = $pdo->prepare($shippingOrdersQuery);
        $stmt->execute([
            ':start' => $start,
            ':end' => $end,
        ]);
        $shippingOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($shippingOrders as $shippingOrder) {
            $bgColor = '#00bcd4';
            $borderColor = '#0891b2';

            if ($shippingOrder['status'] === 'draft') {
                $bgColor = '#9aa0a6';
                $borderColor = '#80868b';
            } elseif (in_array((string)$shippingOrder['status'], ['confirmed', 'preparing', 'packed'], true)) {
                $bgColor = '#f9ab00';
                $borderColor = '#e37400';
            } elseif (in_array((string)$shippingOrder['status'], ['shipped', 'delivered'], true)) {
                $bgColor = '#34a853';
                $borderColor = '#2d8f47';
            }

            $title = '出貨: ' . $shippingOrder['shipping_order_number'];
            if (!empty($shippingOrder['customer_name'])) {
                $title .= ' - ' . $shippingOrder['customer_name'];
            }

            $events[] = [
                'id' => 'shipping-' . $shippingOrder['id'],
                'title' => $title,
                'start' => $shippingOrder['shipping_date'],
                'allDay' => true,
                'backgroundColor' => $bgColor,
                'borderColor' => $borderColor,
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'type' => 'shipping',
                    'sourceId' => (int)$shippingOrder['id'],
                    'status' => $shippingOrder['status'],
                ]
            ];
        }

        // 取得使用者自訂行事曆事件
        $calendarEventsQuery = "
            SELECT
                dce.id,
                dce.event_type,
                dce.title,
                dce.description,
                dce.start_datetime,
                dce.end_datetime,
                dce.is_all_day,
                dce.status,
                dce.priority,
                dce.color,
                e.name as created_by_name
            FROM dashboard_calendar_events dce
            LEFT JOIN employees e ON dce.created_by_employee_id = e.id
            WHERE dce.deleted_at IS NULL
                AND (
                    (DATE(dce.start_datetime) BETWEEN :start1 AND :end1)
                    OR (DATE(dce.end_datetime) BETWEEN :start2 AND :end2)
                    OR (DATE(dce.start_datetime) <= :start3 AND DATE(dce.end_datetime) >= :end3)
                    OR (dce.end_datetime IS NULL AND DATE(dce.start_datetime) BETWEEN :start4 AND :end4)
                )
            ORDER BY dce.start_datetime
        ";

        $stmt = $pdo->prepare($calendarEventsQuery);
        $stmt->execute([
            ':start1' => $start,
            ':end1' => $end,
            ':start2' => $start,
            ':end2' => $end,
            ':start3' => $start,
            ':end3' => $end,
            ':start4' => $start,
            ':end4' => $end
        ]);
        $calendarEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($calendarEvents as $event) {
            // 內部事件預設使用 Google 綠色以便與生產事件區分
            $bgColor = $event['color'] ?: '#34a853';
            $borderColor = adjustColorBrightness($bgColor, -20);

            // 根據優先級調整顏色
            if ($event['priority'] === 'high' || $event['priority'] === 'urgent') {
                $bgColor = '#ea4335';
                $borderColor = '#c5221f';
            } elseif ($event['priority'] === 'low') {
                $bgColor = '#9aa0a6';
                $borderColor = '#80868b';
            }

            $eventData = [
                'id' => 'event-' . $event['id'],
                'title' => $event['title'],
                'start' => $event['is_all_day'] ? substr($event['start_datetime'], 0, 10) : $event['start_datetime'],
                'backgroundColor' => $bgColor,
                'borderColor' => $borderColor,
                'textColor' => '#ffffff',
                'allDay' => (bool)$event['is_all_day'],
                'extendedProps' => [
                    'type' => 'calendar_event',
                    'eventType' => $event['event_type'],
                    'sourceId' => $event['id'],
                    'status' => $event['status'],
                    'priority' => $event['priority'],
                    'description' => $event['description'],
                    'createdBy' => $event['created_by_name']
                ]
            ];

            // 如果有結束時間，加入 end 欄位
            if ($event['end_datetime']) {
                $eventData['end'] = $event['is_all_day'] ? substr($event['end_datetime'], 0, 10) : $event['end_datetime'];
            }

            $events[] = $eventData;
        }

        jsonResponse([
            'success' => true,
            'events' => $events
        ]);

    } catch (PDOException $e) {
        error_log('行事曆事件查詢錯誤: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => '查詢行事曆事件時發生錯誤。'
        ], 500);
    }
}

/**
 * 調整顏色亮度
 * @param string $hex 十六進位顏色 (如 #3788d8)
 * @param int $steps 調整步數 (正數變亮，負數變暗)
 * @return string 調整後的十六進位顏色
 */
function adjustColorBrightness(string $hex, int $steps): string
{
    // 移除 # 符號
    $hex = ltrim($hex, '#');

    // 確保是 6 位數
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }

    // 轉換為 RGB
    $r = hexdec(substr($hex, 0, 2));
    $g = hexdec(substr($hex, 2, 2));
    $b = hexdec(substr($hex, 4, 2));

    // 調整亮度
    $r = max(0, min(255, $r + $steps));
    $g = max(0, min(255, $g + $steps));
    $b = max(0, min(255, $b + $steps));

    return '#' . sprintf('%02x%02x%02x', $r, $g, $b);
}
