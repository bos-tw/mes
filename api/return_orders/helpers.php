<?php
/**
 * 退貨單 API - 共用輔助函式
 *
 * 提供退貨單模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module return_orders
 * @table return_orders
 *
 * @functions
 * - generateReturnOrderNumber(): 產生退貨單號 (RO-YYYYMMDD-XXXX)
 * - validateReturnOrderData(): 驗證退貨單資料
 * - getReturnOrderDetails(): 取得退貨單詳細
 * - getReturnOrderItems(): 取得退貨品項
 * - canDeleteReturnOrder(): 檢查是否可刪除
 * - generateReturnOrderId(): 產生退貨單 ID
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../number_sequences/helpers.php';

/**
 * 產生退貨單號
 * Format: RO-YYYYMMDD-XXXX
 */
function generateReturnOrderNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'RO');
}

/**
 * 驗證退貨單資料
 */
function validateReturnOrderData(array $data, bool $isUpdate = false): array
{
    $errors = [];

    if (!$isUpdate) {
        if (empty($data['customer_id'])) {
            $errors[] = '客戶ID為必填。';
        }
        if (empty($data['return_date'])) {
            $errors[] = '退貨日期為必填。';
        }
    }

    // 驗證日期格式
    if (!empty($data['return_date'])) {
        $date = DateTime::createFromFormat('Y-m-d', $data['return_date']);
        if (!$date || $date->format('Y-m-d') !== $data['return_date']) {
            $errors[] = '退貨日期格式無效，請使用 YYYY-MM-DD 格式。';
        }
    }

    return $errors;
}

/**
 * 取得退貨單詳細資料
 */
function getReturnOrderDetails(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            ro.*,
            c.name AS customer_name,
            c.customer_number,
            so.shipping_order_number,
            lv.value_label AS status_label
        FROM return_orders ro
        LEFT JOIN customers c ON ro.customer_id = c.id
        LEFT JOIN shipping_orders so ON ro.original_shipping_order_id = so.id
        LEFT JOIN lookup_values lv ON ro.status_lookup_id = lv.id
        WHERE ro.id = :id AND ro.deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        $rescreenStmt = $pdo->prepare("
            SELECT
                id,
                rescreen_batch_number,
                rescreen_type,
                status,
                rescreen_work_order_id,
                created_at
            FROM rescreen_batches
            WHERE source_return_order_id = :source_return_order_id
              AND deleted_at IS NULL
            ORDER BY id DESC
        ");
        $rescreenStmt->execute(['source_return_order_id' => $id]);
        $order['rescreen_batches'] = $rescreenStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    return $order ?: null;
}

/**
 * 取得退貨單品項
 */
function getReturnOrderItems(PDO $pdo, int $returnOrderId): array
{
    $stmt = $pdo->prepare("
        SELECT
            roi.*,
            soi.shipped_quantity,
            soi.shipped_unit,
            oi.sub_item_number,
            oi.customer_batch_number,
            oi.part_number,
            si.name AS screening_item_name
        FROM return_order_items roi
        LEFT JOIN shipping_order_items soi ON roi.shipping_order_item_id = soi.id
        LEFT JOIN order_items oi ON soi.order_item_id = oi.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        WHERE roi.return_order_id = :return_order_id
        ORDER BY roi.id
    ");
    $stmt->execute(['return_order_id' => $returnOrderId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * 檢查是否可刪除退貨單
 */
function canDeleteReturnOrder(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT processing_status
        FROM return_orders
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        return ['can_delete' => false, 'reason' => '退貨單不存在。'];
    }

    // 已處理完成的退貨單不可刪除
    if ($order['processing_status'] === 'completed') {
        return ['can_delete' => false, 'reason' => '已處理完成的退貨單無法刪除。'];
    }

    return ['can_delete' => true];
}

/**
 * 產生唯一 ID
 */
function generateReturnOrderId(): int
{
    return (int)(microtime(true) * 10000) + random_int(0, 9999);
}
