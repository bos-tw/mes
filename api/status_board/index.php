<?php
/**
 * 大螢幕狀態看板 API
 *
 * 聚合目前生產工單、出貨單與最新公告，供獨立看板頁每 30 秒刷新。
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('GET');

$pdo = db();

try {
    $workLimit = max(1, min(500, (int)($_GET['work_limit'] ?? 500)));
    $shippingLimit = max(1, min(500, (int)($_GET['shipping_limit'] ?? 500)));
    $announcementLimit = max(1, min(500, (int)($_GET['announcement_limit'] ?? 500)));

    $workOrders = fetchBoardWorkOrders($pdo, $workLimit);
    $shippingOrders = fetchBoardShippingOrders($pdo, $shippingLimit);
    $announcements = fetchBoardAnnouncements($pdo, $announcementLimit);

    jsonResponse([
        'success' => true,
        'data' => [
            'work_orders' => $workOrders,
            'shipping_orders' => $shippingOrders,
            'announcements' => $announcements,
            'server_time' => date('c'),
        ],
    ]);
} catch (Throwable $e) {
    error_log('Status board API failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => '載入看板資料失敗。'], 500);
}

function fetchBoardWorkOrders(PDO $pdo, int $limit): array
{
    $sql = "
        SELECT
            wo.id,
            wo.work_order_number,
            wo.scheduled_start_date,
            wo.scheduled_end_date,
            wo.actual_start_date,
            wo.actual_end_date,
            wo.updated_at,
            o.order_number,
            c.name AS customer_name,
            si.name AS screening_item_name,
            m.name AS machine_name,
            lv.value_key AS status_key,
            lv.value_label AS status_label,
            COALESCE(wo.actual_start_date, wo.scheduled_start_date, wo.updated_at, wo.created_at) AS sort_time
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        WHERE wo.deleted_at IS NULL
        ORDER BY sort_time ASC, wo.id ASC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchBoardShippingOrders(PDO $pdo, int $limit): array
{
    $sql = "
        SELECT
            so.id,
            so.shipping_order_number,
            so.shipping_date,
            so.status,
            so.updated_at,
            c.name AS customer_name,
            o.order_number,
            lv.value_label AS status_label,
            (SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS item_count,
            (SELECT COALESCE(SUM(soi.shipped_quantity), 0) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS total_quantity,
            COALESCE(so.shipping_date, DATE(so.updated_at), DATE(so.created_at)) AS sort_date
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN orders o ON so.order_id = o.id
        LEFT JOIN lookup_values lv ON so.status = lv.value_key
            AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'shipping_status')
        WHERE so.deleted_at IS NULL
        ORDER BY sort_date ASC, so.id ASC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchBoardAnnouncements(PDO $pdo, int $limit): array
{
    $sql = "
        SELECT
            n.id,
            n.title,
            n.content,
            n.priority,
            n.created_at,
            e.name AS created_by_name
        FROM system_notifications n
        LEFT JOIN employees e ON n.created_by = e.id
        WHERE n.is_active = 1
          AND n.status = 'published'
          AND n.notification_type = 'announcement'
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
        ORDER BY n.priority DESC, n.created_at DESC
        LIMIT :limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
