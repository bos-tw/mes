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

function workflowTableExists(PDO $pdo, string $table): bool
{
    static $cache = [];
    if (array_key_exists($table, $cache)) {
        return $cache[$table];
    }
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
        $cache[$table] = false;
        return false;
    }

    try {
        $stmt = $pdo->prepare('SHOW TABLES LIKE ?');
        $stmt->execute([$table]);
        $cache[$table] = $stmt->fetchColumn() !== false;
    } catch (Throwable $exception) {
        $cache[$table] = false;
    }

    return $cache[$table];
}

function workflowColumnExists(PDO $pdo, string $table, string $column): bool
{
    static $cache = [];
    $cacheKey = $table . '.' . $column;
    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }

    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table) || !preg_match('/^[a-zA-Z0-9_]+$/', $column)) {
        $cache[$cacheKey] = false;
        return false;
    }

    if (!workflowTableExists($pdo, $table)) {
        $cache[$cacheKey] = false;
        return false;
    }

    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
        $cache[$cacheKey] = $stmt !== false && $stmt->fetch(PDO::FETCH_ASSOC) !== false;
    } catch (Throwable $exception) {
        $cache[$cacheKey] = false;
    }

    return $cache[$cacheKey];
}

function getWorkflowDeleteAssessment(PDO $pdo, string $module, int $id): array
{
    return match ($module) {
        'orders' => assessOrderDelete($pdo, $id),
        'order_items' => assessOrderItemDelete($pdo, $id),
        'work_orders' => assessWorkOrderDelete($pdo, $id),
        'inventory_items' => assessInventoryItemDelete($pdo, $id),
        'shipping_orders' => assessShippingOrderDelete($pdo, $id),
        'shipping_order_items' => assessShippingOrderItemDelete($pdo, $id),
        'return_orders' => assessReturnOrderDelete($pdo, $id),
        default => workflowBlocked('此模組尚未支援流程刪除檢查。'),
    };
}

function getWorkflowActionAssessment(PDO $pdo, string $module, string $action, int $id): array
{
    if ($action === 'delete') {
        return getWorkflowDeleteAssessment($pdo, $module, $id);
    }

    return match ($module . ':' . $action) {
        'work_order_partial_receipts:reverse' => assessWorkOrderPartialReceiptReverse($pdo, $id),
        default => workflowBlocked('此流程動作尚未支援守門檢查。'),
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

function assessOrderItemDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT oi.id, oi.order_id, oi.sub_item_number, oi.customer_batch_number, o.order_number
        FROM order_items oi
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE oi.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $orderItem = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$orderItem) {
        return workflowBlocked('找不到該訂單品項。');
    }

    $workOrderCount = 0;
    if (workflowColumnExists($pdo, 'work_orders', 'order_item_id')) {
        $workOrderStmt = $pdo->prepare('SELECT COUNT(*) FROM work_orders WHERE order_item_id = :id AND deleted_at IS NULL');
        $workOrderStmt->execute(['id' => $id]);
        $workOrderCount = (int)$workOrderStmt->fetchColumn();
    }

    $inventoryCount = 0;
    if (workflowColumnExists($pdo, 'inventory_items', 'order_item_id')) {
        $inventoryStmt = $pdo->prepare('SELECT COUNT(*) FROM inventory_items WHERE order_item_id = :id AND deleted_at IS NULL');
        $inventoryStmt->execute(['id' => $id]);
        $inventoryCount = (int)$inventoryStmt->fetchColumn();
    }

    $shippingCount = 0;
    if (workflowColumnExists($pdo, 'shipping_order_items', 'order_item_id')) {
        $shippingStmt = $pdo->prepare('SELECT COUNT(*) FROM shipping_order_items WHERE order_item_id = :id');
        $shippingStmt->execute(['id' => $id]);
        $shippingCount = (int)$shippingStmt->fetchColumn();
    }

    $returnCount = 0;
    if (workflowColumnExists($pdo, 'return_order_items', 'order_item_id')) {
        $returnStmt = $pdo->prepare('SELECT COUNT(*) FROM return_order_items WHERE order_item_id = :id');
        $returnStmt->execute(['id' => $id]);
        $returnCount = (int)$returnStmt->fetchColumn();
    }

    $impacts = [];
    if ($workOrderCount > 0) {
        $impacts[] = "生產工單：{$workOrderCount} 筆";
    }
    if ($inventoryCount > 0) {
        $impacts[] = "庫存項目：{$inventoryCount} 筆";
    }
    if ($shippingCount > 0) {
        $impacts[] = "出貨品項：{$shippingCount} 筆";
    }
    if ($returnCount > 0) {
        $impacts[] = "退貨品項：{$returnCount} 筆";
    }

    if (!empty($impacts)) {
        return workflowBlocked(
            '此訂單品項已進入後續流程，不能直接刪除。請先從後段流程退回或作廢後再處理。',
            $impacts,
            'rollback_workflow'
        );
    }

    return workflowAllowed('此訂單品項尚未進入工單/庫存/出貨/退貨流程，可以刪除。');
}

function assessShippingOrderItemDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT soi.id, soi.shipping_order_id, soi.inventory_item_id, soi.shipped_quantity,
               so.shipping_order_number, so.status AS shipping_status, so.deleted_at AS shipping_deleted_at
        FROM shipping_order_items soi
        LEFT JOIN shipping_orders so ON so.id = soi.shipping_order_id
        WHERE soi.id = :id
    ");
    $stmt->execute(['id' => $id]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$item) {
        return workflowBlocked('找不到該出貨品項。');
    }

    if (!empty($item['shipping_deleted_at'])) {
        return workflowBlocked('此出貨品項所屬出貨單已刪除，請先確認追溯流程。', ['所屬出貨單：已刪除'], 'review');
    }

    $status = strtolower(trim((string)($item['shipping_status'] ?? '')));
    if (in_array($status, ['shipped', 'delivered'], true)) {
        return workflowBlocked('此出貨品項已進入出貨完成流程，不能直接刪除。請改走退貨或沖銷流程。', ['出貨狀態：已出貨'], 'return_or_void');
    }

    if ($status !== 'draft') {
        return workflowBlocked('只有草稿狀態的出貨單品項可以刪除。', ['出貨狀態：' . ($status ?: 'unknown')], 'go_shipping');
    }

    $returnCount = 0;
    if (workflowColumnExists($pdo, 'return_order_items', 'shipping_order_item_id')) {
        $returnStmt = $pdo->prepare('SELECT COUNT(*) FROM return_order_items WHERE shipping_order_item_id = :id');
        $returnStmt->execute(['id' => $id]);
        $returnCount = (int)$returnStmt->fetchColumn();
    }
    if ($returnCount > 0) {
        return workflowBlocked('此出貨品項已有退貨紀錄，不能直接刪除。', ["退貨品項：{$returnCount} 筆"], 'return_or_void');
    }

    $impacts = [];
    if ((float)$item['shipped_quantity'] > 0) {
        $impacts[] = '將釋放已分配庫存數量：' . (float)$item['shipped_quantity'];
    }
    return workflowAllowed('此出貨品項可刪除，系統會釋放已分配庫存。', $impacts, 'delete');
}

function assessReturnOrderDelete(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT id, return_order_number, processing_status
        FROM return_orders
        WHERE id = :id AND deleted_at IS NULL
    ");
    $stmt->execute(['id' => $id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        return workflowBlocked('退貨單不存在。');
    }

    $processingStatus = strtolower(trim((string)($order['processing_status'] ?? '')));
    if ($processingStatus === 'completed') {
        return workflowBlocked('此退貨單已處理完成，不能直接刪除。請改用作廢或沖銷流程保留追溯。', ['退貨處理狀態：已完成'], 'return_or_void');
    }

    $itemCount = 0;
    if (workflowColumnExists($pdo, 'return_order_items', 'return_order_id')) {
        $itemStmt = $pdo->prepare('SELECT COUNT(*) FROM return_order_items WHERE return_order_id = :id');
        $itemStmt->execute(['id' => $id]);
        $itemCount = (int)$itemStmt->fetchColumn();
    }

    $txnCount = 0;
    if (workflowColumnExists($pdo, 'inventory_transactions', 'source_type') && workflowColumnExists($pdo, 'inventory_transactions', 'source_id')) {
        $txnStmt = $pdo->prepare("
            SELECT COUNT(*)
            FROM inventory_transactions
            WHERE source_type = 'return_order' AND source_id = :id
        ");
        $txnStmt->execute(['id' => $id]);
        $txnCount = (int)$txnStmt->fetchColumn();
    }
    if ($txnCount > 0) {
        return workflowBlocked('此退貨單已產生庫存異動，不能直接刪除。請改用沖銷或作廢流程。', ["庫存異動：{$txnCount} 筆"], 'return_or_void');
    }

    if (workflowColumnExists($pdo, 'rescreen_batches', 'source_return_order_id')) {
        $rescreenStmt = $pdo->prepare('SELECT COUNT(*) FROM rescreen_batches WHERE source_return_order_id = :id AND deleted_at IS NULL');
        $rescreenStmt->execute(['id' => $id]);
        $rescreenCount = (int)$rescreenStmt->fetchColumn();
        if ($rescreenCount > 0) {
            return workflowBlocked(
                '此退貨單已建立二次重篩案件，不能直接刪除。請先處理二次重篩追溯鏈。',
                ["二次重篩案件：{$rescreenCount} 筆"],
                'rescreen_trace_cleanup'
            );
        }
    }

    $impacts = [];
    if ($itemCount > 0) {
        $impacts[] = "將同步移除退貨流程關聯品項：{$itemCount} 筆";
    }
    return workflowAllowed('此退貨單尚未完成且未產生庫存異動，可以刪除。', $impacts, 'delete');
}

function assessWorkOrderPartialReceiptReverse(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare("
        SELECT
            wopr.id,
            wopr.receipt_number,
            wopr.receipt_status,
            wopr.inventory_item_id,
            wopr.machine_run_id,
            wopr.net_weight_kg,
            wopr.calculated_units,
            ii.inventory_number,
            ii.deleted_at AS inventory_deleted_at,
            COALESCE(ii.quantity_on_hand, 0) AS quantity_on_hand,
            COALESCE(ii.quantity_allocated, 0) AS quantity_allocated,
            COALESCE(ii.quantity_shipped, 0) AS quantity_shipped,
            wo.id AS work_order_id,
            wo.work_order_number,
            wo.completed_at,
            womr.run_label
        FROM work_order_partial_receipts wopr
        JOIN work_orders wo ON wo.id = wopr.work_order_id
        LEFT JOIN inventory_items ii ON ii.id = wopr.inventory_item_id
        LEFT JOIN work_order_machine_runs womr ON womr.id = wopr.machine_run_id
        WHERE wopr.id = :id
        LIMIT 1
    ");
    $stmt->execute(['id' => $id]);
    $receipt = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$receipt) {
        return workflowBlocked('找不到指定的部分入庫紀錄。');
    }

    $receiptLabel = trim((string)($receipt['receipt_number'] ?? '')) ?: ('部分入庫 #' . (int)$receipt['id']);
    $impacts = [
        '部分入庫單號：' . $receiptLabel,
        '來源工單：' . (trim((string)($receipt['work_order_number'] ?? '')) ?: ('#' . (int)($receipt['work_order_id'] ?? 0))),
        '入庫淨重：' . round((float)($receipt['net_weight_kg'] ?? 0), 2) . ' kg',
        '入庫支數：' . (float)round((float)($receipt['calculated_units'] ?? 0), 0) . ' 支',
    ];

    if (!empty($receipt['run_label'])) {
        $impacts[] = '來源機台：' . (string)$receipt['run_label'];
    }

    $status = strtolower(trim((string)($receipt['receipt_status'] ?? 'partial')));
    if ($status === 'reversed') {
        return workflowBlocked('此部分入庫已沖銷，不可重複操作。', $impacts, 'review');
    }

    if ($status === 'settled' || !empty($receipt['completed_at'])) {
        return workflowBlocked(
            '此部分入庫已參與工單結清，請先將工單退回並處理最終入庫，再重新調整部分入庫。',
            $impacts,
            'reopen_work_order'
        );
    }

    $inventoryItemId = (int)($receipt['inventory_item_id'] ?? 0);
    if ($inventoryItemId <= 0 || !empty($receipt['inventory_deleted_at'])) {
        return workflowBlocked(
            '此部分入庫的關聯庫存不存在或已作廢，請先確認追溯資料。',
            $impacts,
            'review'
        );
    }

    $shippingStmt = $pdo->prepare("
        SELECT
            so.id,
            so.shipping_order_number,
            so.status,
            soi.shipped_quantity
        FROM shipping_order_items soi
        LEFT JOIN shipping_orders so ON so.id = soi.shipping_order_id
        WHERE soi.inventory_item_id = :inventory_item_id
        ORDER BY so.shipping_date DESC, so.id DESC
    ");
    $shippingStmt->execute(['inventory_item_id' => $inventoryItemId]);
    $shippingItems = $shippingStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $hasShipped = (float)($receipt['quantity_shipped'] ?? 0) > 0.0001;
    $hasAllocated = (float)($receipt['quantity_allocated'] ?? 0) > 0.0001;
    $shippingRefs = [];
    foreach ($shippingItems as $item) {
        $shippingNumber = trim((string)($item['shipping_order_number'] ?? '')) ?: ('#' . (int)($item['id'] ?? 0));
        $shippingStatus = trim((string)($item['status'] ?? 'draft'));
        $shippingRefs[] = $shippingNumber . ($shippingStatus !== '' ? "（{$shippingStatus}）" : '');
        if (in_array(strtolower($shippingStatus), ['shipped', 'delivered'], true)) {
            $hasShipped = true;
        } else {
            $hasAllocated = true;
        }
    }

    if ($shippingRefs !== []) {
        $impacts[] = '出貨關聯：' . implode('、', array_values(array_unique($shippingRefs)));
    }

    if ($hasShipped) {
        $impacts[] = '已出貨數量：' . (float)round((float)($receipt['quantity_shipped'] ?? 0), 0) . ' 支';
        return workflowBlocked(
            '此部分入庫已有出貨記錄，不能直接沖銷；請先建立退貨／出貨沖銷流程。',
            $impacts,
            'create_return_or_shipping_void'
        );
    }

    if ($hasAllocated) {
        $impacts[] = '已配貨數量：' . (float)round((float)($receipt['quantity_allocated'] ?? 0), 0) . ' 支';
        return workflowBlocked(
            '此部分入庫已被出貨單配貨，請先從出貨單移除配貨後再沖銷。',
            $impacts,
            'remove_shipping_allocation'
        );
    }

    $transactionStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM inventory_transactions
        WHERE inventory_item_id = :inventory_item_id
          AND NOT (
              ref_type = 'work_order_partial_receipt'
              AND direction = 'inbound'
              AND ref_id = :partial_receipt_id
          )
    ");
    $transactionStmt->execute([
        'inventory_item_id' => $inventoryItemId,
        'partial_receipt_id' => $id,
    ]);
    $nonInboundTransactionCount = (int)$transactionStmt->fetchColumn();
    if ($nonInboundTransactionCount > 0) {
        $impacts[] = '其他庫存異動：' . $nonInboundTransactionCount . ' 筆';
        return workflowBlocked(
            '此部分入庫已有其他庫存異動，請先確認追溯與作廢流程。',
            $impacts,
            'review_inventory_transactions'
        );
    }

    $impacts[] = '將作廢庫存項目：' . (trim((string)($receipt['inventory_number'] ?? '')) ?: ('#' . $inventoryItemId));
    $impacts[] = '目前在庫：' . (float)round((float)($receipt['quantity_on_hand'] ?? 0), 0) . ' 支';

    return workflowAllowed(
        '此部分入庫尚未配貨/出貨，可以沖銷；系統會保留追溯並作廢本次庫存。',
        $impacts,
        'reverse_partial_receipt'
    );
}
