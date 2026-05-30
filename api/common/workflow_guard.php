<?php
declare(strict_types=1);

/**
 * Shared workflow lifecycle guard for process documents.
 *
 * The MES flow is: order -> work order -> inventory -> shipping.
 * Delete operations must preserve this chain instead of silently creating
 * orphaned or invisible downstream records.
 */

function workflowAllowed(string $message, array $impacts = [], string $action = 'delete'): array
{
    return [
        'allowed' => true,
        'severity' => empty($impacts) ? 'info' : 'warning',
        'message' => $message,
        'impacts' => $impacts,
        'recommended_action' => $action,
    ];
}

function workflowBlocked(string $message, array $impacts = [], string $action = 'review'): array
{
    return [
        'allowed' => false,
        'severity' => 'blocked',
        'message' => $message,
        'impacts' => $impacts,
        'recommended_action' => $action,
    ];
}

function getWorkflowDeleteAssessment(PDO $pdo, string $module, int $id): array
{
    return match ($module) {
        'orders' => assessOrderDelete($pdo, $id),
        'work_orders' => assessWorkOrderDelete($pdo, $id),
        'inventory_items' => assessInventoryItemDelete($pdo, $id),
        'shipping_orders' => assessShippingOrderDelete($pdo, $id),
        default => workflowBlocked('此模組尚未支援流程刪除檢查。'),
    };
}

function assessOrderDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT id, order_number FROM orders WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        return workflowBlocked('找不到該訂單。');
    }

    $itemStmt = $pdo->prepare('SELECT COUNT(*) FROM order_items WHERE order_id = :id');
    $itemStmt->execute(['id' => $id]);
    $itemCount = (int)$itemStmt->fetchColumn();

    $workOrderStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM work_orders wo
        JOIN order_items oi ON oi.id = wo.order_item_id
        WHERE oi.order_id = :id AND wo.deleted_at IS NULL
    ");
    $workOrderStmt->execute(['id' => $id]);
    $workOrderCount = (int)$workOrderStmt->fetchColumn();

    $inventoryStmt = $pdo->prepare('SELECT COUNT(*) FROM inventory_items WHERE order_id = :id AND deleted_at IS NULL');
    $inventoryStmt->execute(['id' => $id]);
    $inventoryCount = (int)$inventoryStmt->fetchColumn();

    $shippingStmt = $pdo->prepare('SELECT COUNT(*) FROM shipping_orders WHERE order_id = :id AND deleted_at IS NULL');
    $shippingStmt->execute(['id' => $id]);
    $shippingCount = (int)$shippingStmt->fetchColumn();

    $impacts = [];
    if ($itemCount > 0) {
        $impacts[] = "訂單品項：{$itemCount} 筆";
    }
    if ($workOrderCount > 0) {
        $impacts[] = "生產工單：{$workOrderCount} 筆";
    }
    if ($inventoryCount > 0) {
        $impacts[] = "庫存項目：{$inventoryCount} 筆";
    }
    if ($shippingCount > 0) {
        $impacts[] = "出貨單：{$shippingCount} 筆";
    }

    if (!empty($impacts)) {
        return workflowBlocked(
            '此訂單已建立流程資料，不能直接刪除。請由後段流程依序退回或作廢後再處理訂單。',
            $impacts,
            'rollback_workflow'
        );
    }

    return workflowAllowed('此訂單尚未建立品項或後續流程，可以刪除。');
}

function assessWorkOrderDelete(PDO $pdo, int $id): array
{
    $statusLookupColumn = 'status_' . 'lookup_id';
    $stmt = $pdo->prepare("
        SELECT wo.id, wo.work_order_number, wo.status, wo.completed_at,
               lv.value_key AS status_key, lv.value_label AS status_label
        FROM work_orders wo
        LEFT JOIN lookup_values lv ON wo.{$statusLookupColumn} = lv.id
        WHERE wo.id = :id AND wo.deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $workOrder = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$workOrder) {
        return workflowBlocked('找不到該工單。');
    }

    $inventoryStmt = $pdo->prepare('SELECT COUNT(*) FROM inventory_items WHERE work_order_id = :id AND deleted_at IS NULL');
    $inventoryStmt->execute(['id' => $id]);
    $inventoryCount = (int)$inventoryStmt->fetchColumn();
    if ($inventoryCount > 0) {
        return workflowBlocked(
            '此工單已轉入庫存，不能直接刪除。請先從工單編輯將狀態退回，並依提示處理庫存。',
            ["已建立庫存項目：{$inventoryCount} 筆"],
            'reopen_work_order'
        );
    }

    $statusKey = strtolower(trim((string)($workOrder['status_key'] ?? '')));
    $legacyStatus = strtolower(trim((string)($workOrder['status'] ?? '')));
    $statusLabel = trim((string)($workOrder['status_label'] ?? ''));
    if (!empty($workOrder['completed_at']) || $statusKey === 'completed' || $legacyStatus === 'completed' || $statusLabel === '已完成') {
        return workflowBlocked(
            '此工單已進入完成流程，不能直接刪除。請使用退回狀態或作廢流程保留追溯。',
            ['工單狀態：已完成'],
            'reopen_work_order'
        );
    }

    $imageStmt = $pdo->prepare('SELECT COUNT(*) FROM work_order_images WHERE work_order_id = :id AND deleted_at IS NULL');
    $imageStmt->execute(['id' => $id]);
    $imageCount = (int)$imageStmt->fetchColumn();
    if ($imageCount > 0) {
        return workflowBlocked('此工單已有附件或圖面，請先確認附件處理方式。', ["工單附件：{$imageCount} 筆"], 'review');
    }

    return workflowAllowed('此工單尚未進入庫存或出貨流程，可以刪除。');
}

function assessInventoryItemDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT id, inventory_number, work_order_id, quantity_allocated, quantity_shipped
        FROM inventory_items
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$item) {
        return workflowBlocked('庫存項目不存在。');
    }

    if ((float)$item['quantity_allocated'] > 0) {
        return workflowBlocked('此庫存已有配貨，請先從出貨單移除或取消配貨。', ['已配貨數量：' . $item['quantity_allocated']], 'go_shipping');
    }

    if ((float)$item['quantity_shipped'] > 0) {
        return workflowBlocked('此庫存已有出貨記錄，不能刪除；請走退貨或沖銷流程。', ['已出貨數量：' . $item['quantity_shipped']], 'return_or_void');
    }

    $shippingStmt = $pdo->prepare('SELECT COUNT(*) FROM shipping_order_items WHERE inventory_item_id = :id');
    $shippingStmt->execute(['id' => $id]);
    $shippingCount = (int)$shippingStmt->fetchColumn();
    if ($shippingCount > 0) {
        return workflowBlocked('此庫存已被出貨單引用，請先回到出貨單處理。', ["出貨單品項引用：{$shippingCount} 筆"], 'go_shipping');
    }

    if (!empty($item['work_order_id'])) {
        return workflowBlocked(
            '此庫存由生產工單轉入，請回到生產工單調整狀態並選擇「刪除庫存並變更狀態」。',
            ['來源：生產工單'],
            'go_work_order'
        );
    }

    return workflowAllowed('此庫存尚未銜接工單或出貨流程，可以刪除。');
}

function assessShippingOrderDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT id, shipping_order_number, status, deleted_at FROM shipping_orders WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        return workflowBlocked('找不到該出貨單。');
    }

    $status = strtolower(trim((string)($order['status'] ?? '')));
    if (in_array($status, ['shipped', 'delivered'], true)) {
        return workflowBlocked('此出貨單已確認出貨，不能直接刪除；請使用退貨、沖銷或作廢流程。', ['出貨狀態：已出貨'], 'return_or_void');
    }

    $returnStmt = $pdo->prepare('SELECT COUNT(*) FROM return_orders WHERE original_shipping_order_id = :id AND deleted_at IS NULL');
    $returnStmt->execute(['id' => $id]);
    $returnCount = (int)$returnStmt->fetchColumn();
    if ($returnCount > 0) {
        return workflowBlocked('此出貨單已有退貨單，不能直接刪除。', ["退貨單：{$returnCount} 筆"], 'go_return');
    }

    $qualityStmt = $pdo->prepare('SELECT COUNT(*) FROM shipping_quality_inspections WHERE shipping_order_id = :id');
    $qualityStmt->execute(['id' => $id]);
    $qualityCount = (int)$qualityStmt->fetchColumn();
    if ($qualityCount > 0) {
        return workflowBlocked('此出貨單已有出貨品質檢驗，不能直接刪除。', ["品質檢驗：{$qualityCount} 筆"], 'review');
    }

    $itemStmt = $pdo->prepare('SELECT COUNT(*), COALESCE(SUM(shipped_quantity), 0) FROM shipping_order_items WHERE shipping_order_id = :id');
    $itemStmt->execute(['id' => $id]);
    $itemStats = $itemStmt->fetch(PDO::FETCH_NUM) ?: [0, 0];
    $impacts = [];
    if ((int)$itemStats[0] > 0) {
        $impacts[] = '將釋放已配貨庫存品項：' . (int)$itemStats[0] . ' 筆';
        $impacts[] = '釋放數量合計：' . (float)$itemStats[1];
    }

    return workflowAllowed('此出貨單尚未確認出貨，可以刪除；系統會釋放已配貨庫存並保留刪除追溯。', $impacts);
}
