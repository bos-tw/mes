<?php
/**
 * 出貨單管理 API - 輔助函式
 *
 * 本檔案包含出貨單模組的驗證、查詢等共用函式：
 *
 * @module shipping_orders
 * @table shipping_orders
 *
 * @functions
 * - readShippingOrderPayload(): 讀取請求資料
 * - validateShippingOrderData(): 驗證並正規化出貨單輸入資料
 * - transformShippingOrder(): 轉換 API 回應格式
 * - findShippingOrder(): 依 ID 查詢出貨單（含關聯資料）
 * - shippingOrderExists(): 檢查出貨單是否存在
 * - handleShippingOrderWriteException(): 處理寫入 PDO 例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../lookup_values/helpers.php';

function getShippingOrderStatusLookupId(PDO $pdo, string $status): int
{
    $lookupId = getLookupValueId($pdo, 'shipping_status', $status);
    if ($lookupId === null) {
        throw new RuntimeException('找不到對應的出貨狀態設定。');
    }

    return $lookupId;
}

/**
 * 讀取請求資料
 *
 * 支援 JSON (Content-Type: application/json) 及 FormData 兩種格式。
 * 優先讀取 JSON，若無 JSON 則讀取 $_POST。
 *
 * @return array<string,mixed> 請求資料
 */
function readShippingOrderPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化出貨單輸入資料
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 *
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateShippingOrderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 客戶 ID - 新增時必填
    if (!$isUpdate || array_key_exists('customer_id', $payload)) {
        $customerId = $payload['customer_id'] ?? null;
        if (!$isUpdate && ($customerId === null || $customerId === '')) {
            $errors['customer_id'] = '客戶為必填。';
        } elseif ($customerId !== null && $customerId !== '') {
            $customerIdInt = filter_var($customerId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($customerIdInt === false) {
                $errors['customer_id'] = '客戶 ID 必須為正整數。';
            } else {
                $data['customer_id'] = $customerIdInt;
            }
        }
    }

    // 訂單 ID (選填)
    if (array_key_exists('order_id', $payload)) {
        $orderId = $payload['order_id'] ?? null;
        if ($orderId !== null && $orderId !== '') {
            $orderIdInt = filter_var($orderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderIdInt === false) {
                $errors['order_id'] = '訂單 ID 必須為正整數。';
            } else {
                $data['order_id'] = $orderIdInt;
            }
        } else {
            $data['order_id'] = null;
        }
    }

    // 出貨日期
    if (array_key_exists('shipping_date', $payload)) {
        $shippingDate = trim((string)($payload['shipping_date'] ?? ''));
        if ($shippingDate !== '') {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $shippingDate)) {
                $errors['shipping_date'] = '出貨日期格式須為 YYYY-MM-DD。';
            } else {
                $data['shipping_date'] = $shippingDate;
            }
        } else {
            $data['shipping_date'] = null;
        }
    }

    // 配送方式
    if (array_key_exists('delivery_method', $payload)) {
        $deliveryMethod = trim((string)($payload['delivery_method'] ?? ''));
        $data['delivery_method'] = $deliveryMethod !== '' ? mb_substr($deliveryMethod, 0, 50) : null;
    }

    // 出貨性質
    if (array_key_exists('shipment_purpose', $payload)) {
        $shipmentPurpose = trim((string)($payload['shipment_purpose'] ?? ''));
        $allowedPurposes = ['normal', 'defect_return', 'tool_return', 'mixed'];
        if ($shipmentPurpose !== '' && !in_array($shipmentPurpose, $allowedPurposes, true)) {
            $errors['shipment_purpose'] = '出貨性質值無效。';
        } else {
            $data['shipment_purpose'] = $shipmentPurpose !== '' ? $shipmentPurpose : 'normal';
        }
    }

    // 物流公司
    if (array_key_exists('carrier', $payload)) {
        $carrier = trim((string)($payload['carrier'] ?? ''));
        $data['carrier'] = $carrier !== '' ? mb_substr($carrier, 0, 100) : null;
    }

    // 物流追蹤編號
    if (array_key_exists('tracking_number', $payload)) {
        $trackingNumber = trim((string)($payload['tracking_number'] ?? ''));
        $data['tracking_number'] = $trackingNumber !== '' ? mb_substr($trackingNumber, 0, 100) : null;
    }

    // 收貨人姓名
    if (array_key_exists('consignee_name', $payload)) {
        $consigneeName = trim((string)($payload['consignee_name'] ?? ''));
        $data['consignee_name'] = $consigneeName !== '' ? mb_substr($consigneeName, 0, 100) : null;
    }

    // 收貨地址
    if (array_key_exists('consignee_address', $payload)) {
        $consigneeAddress = trim((string)($payload['consignee_address'] ?? ''));
        $data['consignee_address'] = $consigneeAddress !== '' ? mb_substr($consigneeAddress, 0, 500) : null;
    }

    // 狀態
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? ''));
        $allowedStatuses = ['draft', 'confirmed', 'preparing', 'packed', 'shipped', 'delivered', 'cancelled'];
        if ($status !== '' && !in_array($status, $allowedStatuses, true)) {
            $errors['status'] = '狀態值無效。';
        } else {
            $data['status'] = $status !== '' ? $status : 'draft';
        }
    }

    // 備註
    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 取得出貨單狀態可前往的下一狀態。
 *
 * 已送達與已取消為終態；已出貨只能送達或取消回沖，避免任意倒退造成庫存重複異動。
 *
 * @return list<string>
 */
function getAllowedShippingOrderTransitions(string $status): array
{
    return getAllowedWorkflowTransitions('shipping_orders', $status);
}

function canTransitionShippingOrderStatus(string $fromStatus, string $toStatus): bool
{
    return canTransitionWorkflowStatus('shipping_orders', $fromStatus, $toStatus);
}

/**
 * 取得狀態轉換對庫存的唯一作用；相同狀態重送不產生副作用。
 */
function getShippingOrderInventoryEffect(string $fromStatus, string $toStatus): string
{
    if ($fromStatus === 'packed' && $toStatus === 'shipped') {
        return 'ship';
    }
    if ($fromStatus === 'shipped' && $toStatus === 'cancelled') {
        return 'reverse_shipment';
    }
    return 'none';
}

/**
 * 標準化不良品摘要
 *
 * @param array<string,mixed> $payload
 * @return array{summary: array<string,mixed>|null, errors: array<string,string>}
 */
function normalizeShippingOrderDefectSummary(array $payload): array
{
    $errors = [];
    $rawQuantity = trim((string)($payload['defect_quantity'] ?? ''));
    $rawUnitWeight = trim((string)($payload['defect_weight_per_unit_g'] ?? ''));
    $rawTotalWeight = trim((string)($payload['defect_total_weight_kg'] ?? ''));
    $rawNotes = trim((string)($payload['defect_notes'] ?? ''));
    $rawSourceShippingOrderId = trim((string)($payload['defect_source_shipping_order_id'] ?? ''));
    $rawSourceWorkOrderId = trim((string)($payload['defect_source_work_order_id'] ?? ''));
    $rawSourceInventoryItemId = trim((string)($payload['defect_source_inventory_item_id'] ?? ''));

    $hasAnyValue = $rawQuantity !== ''
        || $rawUnitWeight !== ''
        || $rawTotalWeight !== ''
        || $rawNotes !== ''
        || $rawSourceShippingOrderId !== ''
        || $rawSourceWorkOrderId !== ''
        || $rawSourceInventoryItemId !== '';

    if (!$hasAnyValue) {
        return ['summary' => null, 'errors' => []];
    }

    $quantity = 0.0;
    if ($rawQuantity !== '') {
        if (!is_numeric($rawQuantity) || (float)$rawQuantity < 0) {
            $errors['defect_quantity'] = '不良品總數量必須為 0 或正數。';
        } else {
            $quantity = round((float)$rawQuantity, 2);
        }
    }

    $unitWeight = 0.0;
    if ($rawUnitWeight !== '') {
        if (!is_numeric($rawUnitWeight) || (float)$rawUnitWeight < 0) {
            $errors['defect_weight_per_unit_g'] = '不良品單重必須為 0 或正數。';
        } else {
            $unitWeight = round((float)$rawUnitWeight, 3);
        }
    }

    $totalWeight = 0.0;
    if ($rawTotalWeight !== '') {
        if (!is_numeric($rawTotalWeight) || (float)$rawTotalWeight < 0) {
            $errors['defect_total_weight_kg'] = '不良品總重量必須為 0 或正數。';
        } else {
            $totalWeight = round((float)$rawTotalWeight, 3);
        }
    }

    if ($quantity > 0 && $unitWeight > 0) {
        $totalWeight = round(($quantity * $unitWeight) / 1000, 3);
    }

    $sourceShippingOrderId = null;
    if ($rawSourceShippingOrderId !== '') {
        $sourceShippingOrderId = filter_var($rawSourceShippingOrderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($sourceShippingOrderId === false) {
            $errors['defect_source_shipping_order_id'] = '來源出貨單 ID 格式無效。';
            $sourceShippingOrderId = null;
        }
    }

    $sourceWorkOrderId = null;
    if ($rawSourceWorkOrderId !== '') {
        $sourceWorkOrderId = filter_var($rawSourceWorkOrderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($sourceWorkOrderId === false) {
            $errors['defect_source_work_order_id'] = '來源工單 ID 格式無效。';
            $sourceWorkOrderId = null;
        }
    }

    $sourceInventoryItemId = null;
    if ($rawSourceInventoryItemId !== '') {
        $sourceInventoryItemId = filter_var($rawSourceInventoryItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($sourceInventoryItemId === false) {
            $errors['defect_source_inventory_item_id'] = '來源庫存項目 ID 格式無效。';
            $sourceInventoryItemId = null;
        }
    }

    return [
        'summary' => [
            'defect_quantity' => $quantity,
            'weight_per_unit_g' => $unitWeight,
            'total_weight_kg' => $totalWeight,
            'notes' => $rawNotes !== '' ? $rawNotes : null,
            'source_shipping_order_id' => $sourceShippingOrderId,
            'source_work_order_id' => $sourceWorkOrderId,
            'source_inventory_item_id' => $sourceInventoryItemId,
        ],
        'errors' => $errors,
    ];
}

/**
 * 標準化載具摘要列
 *
 * @param mixed $payloadValue
 * @return array{summaries: array<int,array<string,mixed>>, errors: array<string,string>}
 */
function normalizeShippingOrderToolSummaries($payloadValue): array
{
    $errors = [];
    $rows = [];

    if (is_string($payloadValue)) {
        $decoded = json_decode($payloadValue, true);
        $rows = is_array($decoded) ? $decoded : [];
    } elseif (is_array($payloadValue)) {
        $rows = $payloadValue;
    }

    $summaries = [];
    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            continue;
        }

        $toolName = trim((string)($row['tool_name'] ?? ''));
        $toolType = trim((string)($row['tool_type'] ?? ''));
        $rawQuantity = trim((string)($row['quantity'] ?? ''));
        $rawUnitWeight = trim((string)($row['unit_weight_kg'] ?? ''));
        $rawNotes = trim((string)($row['notes'] ?? ''));
        $rawToolId = trim((string)($row['tool_id'] ?? ''));

        $hasAnyValue = $toolName !== ''
            || $toolType !== ''
            || $rawQuantity !== ''
            || $rawUnitWeight !== ''
            || $rawNotes !== ''
            || $rawToolId !== '';

        if (!$hasAnyValue) {
            continue;
        }

        if ($toolName === '') {
            $errors["tool_summaries.$index.tool_name"] = '載具名稱為必填。';
        }

        $quantity = 0;
        if ($rawQuantity === '' || !is_numeric($rawQuantity) || (float)$rawQuantity < 0) {
            $errors["tool_summaries.$index.quantity"] = '載具數量必須為 0 或正整數。';
        } else {
            $quantity = (int)round((float)$rawQuantity);
        }

        $unitWeight = 0.0;
        if ($rawUnitWeight === '' || !is_numeric($rawUnitWeight) || (float)$rawUnitWeight < 0) {
            $errors["tool_summaries.$index.unit_weight_kg"] = '載具單重必須為 0 或正數。';
        } else {
            $unitWeight = round((float)$rawUnitWeight, 3);
        }

        $toolId = null;
        if ($rawToolId !== '') {
            $toolId = filter_var($rawToolId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($toolId === false) {
                $errors["tool_summaries.$index.tool_id"] = '載具 ID 格式無效。';
                $toolId = null;
            }
        }

        $summaries[] = [
            'tool_id' => $toolId,
            'tool_name' => $toolName,
            'tool_type' => $toolType !== '' ? $toolType : null,
            'quantity' => $quantity,
            'unit_weight_kg' => $unitWeight,
            'total_weight_kg' => round($quantity * $unitWeight, 3),
            'notes' => $rawNotes !== '' ? $rawNotes : null,
        ];
    }

    return ['summaries' => $summaries, 'errors' => $errors];
}

/**
 * 驗證出貨第一階段摘要與性質的最小守門
 *
 * @param string $shipmentPurpose
 * @param array<string,mixed>|null $defectSummary
 * @return array<string,string>
 */
function validateShippingPhase1BusinessRules(string $shipmentPurpose, ?array $defectSummary): array
{
    $errors = [];
    $hasDefectSummary = $defectSummary
        && (
            (float)($defectSummary['defect_quantity'] ?? 0) > 0
            || (float)($defectSummary['total_weight_kg'] ?? 0) > 0
            || trim((string)($defectSummary['notes'] ?? '')) !== ''
        );

    if ($hasDefectSummary && $shipmentPurpose === 'normal') {
        $errors['shipment_purpose'] = '有不良品摘要時，出貨性質不可為一般出貨。';
    }

    return $errors;
}

/**
 * 取得出貨單不良品摘要
 *
 * @return array<string,mixed>|null
 */
function fetchShippingOrderDefectSummary(PDO $pdo, int $shippingOrderId): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            id,
            shipping_order_id,
            source_shipping_order_id,
            source_work_order_id,
            source_inventory_item_id,
            defect_quantity,
            weight_per_unit_g,
            total_weight_kg,
            notes
        FROM shipping_order_defect_summaries
        WHERE shipping_order_id = ?
        LIMIT 1
    ");
    $stmt->execute([$shippingOrderId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 由出貨單實際加入的不良品庫存與包／袋關聯計算權威摘要。
 *
 * @return array<string,mixed>|null
 */
function fetchShippingOrderActualDefectSummary(PDO $pdo, int $shippingOrderId): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            soi.inventory_item_id,
            soi.shipped_quantity,
            ii.work_order_id,
            ii.weight_per_unit_g,
            COALESCE(package_totals.package_quantity, 0) AS package_quantity,
            COALESCE(package_totals.package_weight_kg, 0) AS package_weight_kg
        FROM shipping_order_items soi
        INNER JOIN inventory_items ii ON ii.id = soi.inventory_item_id
        LEFT JOIN (
            SELECT
                link.shipping_order_item_id,
                SUM(link.shipped_package_quantity) AS package_quantity,
                SUM(package_row.content_weight_kg) AS package_weight_kg
            FROM shipping_order_item_packages link
            INNER JOIN inventory_packages package_row
                ON package_row.id = link.inventory_package_id
            GROUP BY link.shipping_order_item_id
        ) package_totals ON package_totals.shipping_order_item_id = soi.id
        WHERE soi.shipping_order_id = :shipping_order_id
          AND COALESCE(soi.stock_category_snapshot, ii.stock_category, 'good') = 'defect'
        ORDER BY soi.id
    ");
    $stmt->execute(['shipping_order_id' => $shippingOrderId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($rows === []) {
        return null;
    }

    $quantity = 0.0;
    $weightKg = 0.0;
    $packageQuantity = 0;
    $workOrderIds = [];
    $inventoryItemIds = [];
    foreach ($rows as $row) {
        $rowQuantity = (float)($row['shipped_quantity'] ?? 0);
        $rowPackageWeight = (float)($row['package_weight_kg'] ?? 0);
        $unitWeightG = (float)($row['weight_per_unit_g'] ?? 0);
        $quantity += $rowQuantity;
        $weightKg += $rowPackageWeight > 0
            ? $rowPackageWeight
            : round($rowQuantity * $unitWeightG / 1000, 3);
        $packageQuantity += (int)($row['package_quantity'] ?? 0);
        if ((int)($row['work_order_id'] ?? 0) > 0) {
            $workOrderIds[(int)$row['work_order_id']] = true;
        }
        if ((int)($row['inventory_item_id'] ?? 0) > 0) {
            $inventoryItemIds[(int)$row['inventory_item_id']] = true;
        }
    }
    $quantity = round($quantity, 2);
    $weightKg = round($weightKg, 3);

    return [
        'defect_quantity' => $quantity,
        'weight_per_unit_g' => $quantity > 0 ? round($weightKg * 1000 / $quantity, 3) : 0,
        'total_weight_kg' => $weightKg,
        'package_quantity' => $packageQuantity,
        'notes' => '由實際加入出貨單的不良品庫存與包／袋自動彙總',
        'source_shipping_order_id' => null,
        'source_work_order_id' => count($workOrderIds) === 1 ? (int)array_key_first($workOrderIds) : null,
        'source_inventory_item_id' => count($inventoryItemIds) === 1 ? (int)array_key_first($inventoryItemIds) : null,
        'summary_source' => 'inventory_items',
    ];
}

/**
 * 取得出貨單載具摘要
 *
 * @return array<int,array<string,mixed>>
 */
function fetchShippingOrderToolSummaries(PDO $pdo, int $shippingOrderId): array
{
    $stmt = $pdo->prepare("
        SELECT
            id,
            shipping_order_id,
            tool_id,
            tool_name,
            tool_type,
            unit_weight_kg,
            quantity,
            total_weight_kg,
            notes
        FROM shipping_order_tool_summaries
        WHERE shipping_order_id = ?
        ORDER BY id ASC
    ");
    $stmt->execute([$shippingOrderId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * 取得出貨來源庫存對應的二次篩選追溯鏈
 *
 * @param list<int> $inventoryItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function fetchShippingOrderRescreenSourceMap(PDO $pdo, array $inventoryItemIds): array
{
    $normalizedIds = array_values(array_filter(array_map('intval', $inventoryItemIds), static fn(int $id): bool => $id > 0));
    if ($normalizedIds === []) {
        return [];
    }

    $placeholders = implode(', ', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            iis.inventory_item_id,
            iis.source_id,
            iis.source_type,
            iis.source_order_id,
            o.order_number,
            iis.source_order_item_id,
            iis.source_work_order_id,
            src_wo.work_order_number AS source_work_order_number,
            iis.source_shipping_order_id,
            src_so.shipping_order_number AS source_shipping_order_number,
            iis.source_return_order_id,
            ro.return_order_number,
            iis.source_rescreen_batch_id AS rescreen_batch_id,
            rb.rescreen_batch_number,
            rb.second_screening_reason,
            rb.rescreen_type,
            rb.status AS rescreen_batch_status,
            iis.notes
        FROM inventory_item_sources iis
        LEFT JOIN orders o ON o.id = iis.source_order_id
        LEFT JOIN work_orders src_wo ON src_wo.id = iis.source_work_order_id
        LEFT JOIN shipping_orders src_so ON src_so.id = iis.source_shipping_order_id
        LEFT JOIN return_orders ro ON ro.id = iis.source_return_order_id
        LEFT JOIN rescreen_batches rb ON rb.id = iis.source_rescreen_batch_id
        WHERE iis.inventory_item_id IN ({$placeholders})
        ORDER BY iis.inventory_item_id ASC, iis.id ASC
    ");
    $stmt->execute($normalizedIds);

    $grouped = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $inventoryItemId = (int)($row['inventory_item_id'] ?? 0);
        if ($inventoryItemId <= 0) {
            continue;
        }

        if (!isset($grouped[$inventoryItemId])) {
            $grouped[$inventoryItemId] = [];
        }

        $grouped[$inventoryItemId][] = [
            'source_id' => isset($row['source_id']) ? (int)$row['source_id'] : null,
            'source_type' => (string)($row['source_type'] ?? ''),
            'source_order_id' => isset($row['source_order_id']) ? (int)$row['source_order_id'] : null,
            'order_number' => $row['order_number'] ?? null,
            'source_order_item_id' => isset($row['source_order_item_id']) ? (int)$row['source_order_item_id'] : null,
            'source_work_order_id' => isset($row['source_work_order_id']) ? (int)$row['source_work_order_id'] : null,
            'source_work_order_number' => $row['source_work_order_number'] ?? null,
            'source_shipping_order_id' => isset($row['source_shipping_order_id']) ? (int)$row['source_shipping_order_id'] : null,
            'source_shipping_order_number' => $row['source_shipping_order_number'] ?? null,
            'source_return_order_id' => isset($row['source_return_order_id']) ? (int)$row['source_return_order_id'] : null,
            'source_return_order_number' => $row['return_order_number'] ?? null,
            'rescreen_batch_id' => isset($row['rescreen_batch_id']) ? (int)$row['rescreen_batch_id'] : null,
            'rescreen_batch_number' => $row['rescreen_batch_number'] ?? null,
            'second_screening_reason' => $row['second_screening_reason'] ?? null,
            'rescreen_type' => $row['rescreen_type'] ?? null,
            'rescreen_batch_status' => $row['rescreen_batch_status'] ?? null,
            'notes' => $row['notes'] ?? null,
        ];
    }

    return $grouped;
}

/**
 * 取得客戶載具紀錄與遺留分析
 *
 * 第一輪分析口徑：
 * - 進場紀錄：訂單品項的 order_item_tools
 * - 已歸還紀錄：出貨單載具摘要 shipping_order_tool_summaries（排除 cancelled）
 * - 可能遺留：進場數量 - 已歸還數量
 *
 * @return array<string,mixed>|null
 */
function fetchCustomerToolAnalysis(PDO $pdo, int $customerId, int $shippingOrderId = 0): ?array
{
    if ($customerId <= 0) {
        return null;
    }

    $incomingRecords = fetchCustomerIncomingToolRecords($pdo, $customerId);
    $returnedRecords = fetchCustomerReturnedToolRecords($pdo, $customerId);
    $currentShippingRecords = $shippingOrderId > 0 ? fetchShippingOrderToolSummaries($pdo, $shippingOrderId) : [];

    $incomingMap = [];
    $returnedMap = [];
    $currentShippingMap = [];

    foreach ($incomingRecords as $record) {
        appendCustomerToolAggregate($incomingMap, $record, 'incoming');
    }
    foreach ($returnedRecords as $record) {
        appendCustomerToolAggregate($returnedMap, $record, 'returned');
    }
    foreach ($currentShippingRecords as $record) {
        appendCustomerToolAggregate($currentShippingMap, $record, 'returned');
    }

    $outstandingMap = [];
    $keys = array_unique(array_merge(array_keys($incomingMap), array_keys($returnedMap)));
    foreach ($keys as $key) {
        $incoming = $incomingMap[$key] ?? null;
        $returned = $returnedMap[$key] ?? null;
        $toolName = trim((string)($incoming['tool_name'] ?? $returned['tool_name'] ?? ''));
        if ($toolName === '') {
            continue;
        }

        $incomingQty = (int)($incoming['incoming_quantity'] ?? 0);
        $returnedQty = (int)($returned['returned_quantity'] ?? 0);
        $outstandingQty = $incomingQty - $returnedQty;
        $outstandingWeight = round((float)($incoming['incoming_total_weight_kg'] ?? 0) - (float)($returned['returned_total_weight_kg'] ?? 0), 3);

        $outstandingMap[$key] = [
            'tool_id' => $incoming['tool_id'] ?? $returned['tool_id'] ?? null,
            'tool_name' => $toolName,
            'tool_type' => $incoming['tool_type'] ?? $returned['tool_type'] ?? null,
            'incoming_quantity' => $incomingQty,
            'incoming_total_weight_kg' => round((float)($incoming['incoming_total_weight_kg'] ?? 0), 3),
            'returned_quantity' => $returnedQty,
            'returned_total_weight_kg' => round((float)($returned['returned_total_weight_kg'] ?? 0), 3),
            'outstanding_quantity' => $outstandingQty,
            'outstanding_total_weight_kg' => $outstandingWeight,
            'status_label' => $outstandingQty > 0 ? '可能仍留廠' : ($outstandingQty < 0 ? '歸還數高於進場紀錄' : '已平衡'),
        ];
    }

    usort($outstandingMap, static function (array $a, array $b): int {
        return [(int)($b['outstanding_quantity'] ?? 0), (string)($a['tool_name'] ?? '')]
            <=> [(int)($a['outstanding_quantity'] ?? 0), (string)($b['tool_name'] ?? '')];
    });

    return [
        'customer_id' => $customerId,
        'incoming_total_quantity' => array_sum(array_map(static fn(array $row): int => (int)($row['incoming_quantity'] ?? 0), $incomingMap)),
        'returned_total_quantity' => array_sum(array_map(static fn(array $row): int => (int)($row['returned_quantity'] ?? 0), $returnedMap)),
        'current_shipping_total_quantity' => array_sum(array_map(static fn(array $row): int => (int)($row['returned_quantity'] ?? 0), $currentShippingMap)),
        'outstanding_total_quantity' => array_sum(array_map(static fn(array $row): int => (int)($row['outstanding_quantity'] ?? 0), $outstandingMap)),
        'incoming_records' => array_values($incomingMap),
        'returned_records' => array_values($returnedMap),
        'current_shipping_records' => array_values($currentShippingMap),
        'outstanding_records' => array_values($outstandingMap),
        'basis_note' => '第一輪以訂單載具設定視為進場紀錄，以出貨單載具摘要視為歸還紀錄，供遺留分析參考。',
    ];
}

/**
 * @return list<array<string,mixed>>
 */
function fetchCustomerIncomingToolRecords(PDO $pdo, int $customerId): array
{
    $stmt = $pdo->prepare("
        SELECT
            oit.tool_id,
            COALESCE(t.name, oit.tool_type, CONCAT('載具#', oit.id)) AS tool_name,
            oit.tool_type,
            oit.quantity,
            oit.total_weight
        FROM order_item_tools oit
        INNER JOIN order_items oi ON oi.id = oit.order_item_id
        INNER JOIN orders o ON o.id = oi.order_id
        LEFT JOIN tools t ON t.id = oit.tool_id
        WHERE o.customer_id = :customer_id
          AND o.deleted_at IS NULL
        ORDER BY tool_name ASC, oit.id ASC
    ");
    $stmt->execute(['customer_id' => $customerId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * @return list<array<string,mixed>>
 */
function fetchCustomerReturnedToolRecords(PDO $pdo, int $customerId): array
{
    $stmt = $pdo->prepare("
        SELECT
            sots.tool_id,
            sots.tool_name,
            sots.tool_type,
            sots.quantity,
            sots.total_weight_kg AS total_weight
        FROM shipping_order_tool_summaries sots
        INNER JOIN shipping_orders so ON so.id = sots.shipping_order_id
        WHERE so.customer_id = :customer_id
          AND so.deleted_at IS NULL
          AND COALESCE(so.status, '') <> 'cancelled'
        ORDER BY sots.tool_name ASC, sots.id ASC
    ");
    $stmt->execute(['customer_id' => $customerId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * 依訂單品項取得載具設定摘要
 *
 * @param list<int> $orderItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function fetchOrderItemToolTraceMap(PDO $pdo, array $orderItemIds): array
{
    $normalizedIds = array_values(array_filter(array_map('intval', $orderItemIds), static fn(int $id): bool => $id > 0));
    if ($normalizedIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            oit.order_item_id,
            oit.tool_id,
            COALESCE(t.name, oit.tool_type, CONCAT('載具#', oit.id)) AS tool_name,
            oit.tool_type,
            oit.quantity,
            oit.total_weight
        FROM order_item_tools oit
        LEFT JOIN tools t ON t.id = oit.tool_id
        WHERE oit.order_item_id IN ($placeholders)
        ORDER BY oit.order_item_id ASC, oit.id ASC
    ");
    $stmt->execute($normalizedIds);

    $grouped = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $orderItemId = (int)($row['order_item_id'] ?? 0);
        if ($orderItemId <= 0) {
            continue;
        }
        $grouped[$orderItemId] ??= [];
        $grouped[$orderItemId][] = [
            'tool_id' => isset($row['tool_id']) && $row['tool_id'] !== null ? (int)$row['tool_id'] : null,
            'tool_name' => (string)($row['tool_name'] ?? ''),
            'tool_type' => $row['tool_type'] !== null ? (string)$row['tool_type'] : null,
            'quantity' => (int)round((float)($row['quantity'] ?? 0)),
            'total_weight_kg' => round((float)($row['total_weight'] ?? 0), 3),
        ];
    }

    return $grouped;
}

/**
 * @param array<string,array<string,mixed>> $aggregate
 * @param array<string,mixed> $record
 */
function appendCustomerToolAggregate(array &$aggregate, array $record, string $mode): void
{
    $toolName = trim((string)($record['tool_name'] ?? ''));
    $toolType = trim((string)($record['tool_type'] ?? ''));
    $toolId = isset($record['tool_id']) && $record['tool_id'] !== null ? (int)$record['tool_id'] : 0;
    if ($toolName === '' && $toolType === '' && $toolId <= 0) {
        return;
    }

    $key = sprintf(
        '%d|%s|%s',
        $toolId,
        mb_strtolower($toolName, 'UTF-8'),
        mb_strtolower($toolType, 'UTF-8')
    );

    if (!isset($aggregate[$key])) {
        $aggregate[$key] = [
            'tool_id' => $toolId > 0 ? $toolId : null,
            'tool_name' => $toolName !== '' ? $toolName : ($toolType !== '' ? $toolType : '未命名載具'),
            'tool_type' => $toolType !== '' ? $toolType : null,
            'incoming_quantity' => 0,
            'incoming_total_weight_kg' => 0.0,
            'returned_quantity' => 0,
            'returned_total_weight_kg' => 0.0,
        ];
    }

    $quantity = (int)round((float)($record['quantity'] ?? 0));
    $totalWeight = round((float)($record['total_weight'] ?? $record['total_weight_kg'] ?? 0), 3);

    if ($mode === 'incoming') {
        $aggregate[$key]['incoming_quantity'] += $quantity;
        $aggregate[$key]['incoming_total_weight_kg'] = round((float)$aggregate[$key]['incoming_total_weight_kg'] + $totalWeight, 3);
        return;
    }

    $aggregate[$key]['returned_quantity'] += $quantity;
    $aggregate[$key]['returned_total_weight_kg'] = round((float)$aggregate[$key]['returned_total_weight_kg'] + $totalWeight, 3);
}

/**
 * 取得出貨單摘要的工單建議帶入值
 *
 * @return array{defect_summary: array<string,mixed>|null, tool_summaries: array<int,array<string,mixed>>}
 */
function fetchShippingOrderSummarySuggestions(PDO $pdo, int $shippingOrderId): array
{
    $sourceStmt = $pdo->prepare("
        SELECT
            soi.inventory_item_id,
            ii.work_order_id AS source_work_order_id,
            ii.weight_per_unit_g,
            ii.total_defect_units,
            ii.tool_statistics,
            ii.total_tool_quantity,
            ii.tool_weight_kg,
            wopr.id AS partial_receipt_id,
            wopr.shipping_tool_details
        FROM shipping_order_items soi
        LEFT JOIN inventory_items ii ON ii.id = soi.inventory_item_id
        LEFT JOIN work_order_partial_receipts wopr ON wopr.inventory_item_id = ii.id
        WHERE soi.shipping_order_id = ?
        ORDER BY soi.id ASC
    ");
    $sourceStmt->execute([$shippingOrderId]);
    $sourceRows = $sourceStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if ($sourceRows === []) {
        return [
            'defect_summary' => null,
            'tool_summaries' => [],
        ];
    }

    $workOrderIds = [];
    $inventoryItemIds = [];
    $fallbackWeightByWorkOrder = [];
    $partialReceiptIds = [];

    foreach ($sourceRows as $row) {
        $inventoryItemId = (int)($row['inventory_item_id'] ?? 0);
        if ($inventoryItemId > 0) {
            $inventoryItemIds[$inventoryItemId] = $inventoryItemId;
        }

        $workOrderId = (int)($row['source_work_order_id'] ?? 0);
        if ($workOrderId > 0) {
            $workOrderIds[$workOrderId] = $workOrderId;
            if (!isset($fallbackWeightByWorkOrder[$workOrderId])) {
                $fallbackWeightByWorkOrder[$workOrderId] = round((float)($row['weight_per_unit_g'] ?? 0), 3);
            }
        }

        $partialReceiptId = (int)($row['partial_receipt_id'] ?? 0);
        if ($partialReceiptId > 0) {
            $partialReceiptIds[$partialReceiptId] = $partialReceiptId;
        }
    }

    return [
        'defect_summary' => buildShippingOrderSuggestedDefectSummary(
            $pdo,
            array_values($workOrderIds),
            $fallbackWeightByWorkOrder,
            array_values($inventoryItemIds),
            $sourceRows
        ),
        'tool_summaries' => buildShippingOrderSuggestedToolSummaries(
            $pdo,
            $sourceRows,
            array_values($partialReceiptIds)
        ),
    ];
}

/**
 * @param list<int> $workOrderIds
 * @param array<int,float> $fallbackWeightByWorkOrder
 * @param list<int> $inventoryItemIds
 * @param array<int,array<string,mixed>> $sourceRows
 * @return array<string,mixed>|null
 */
function buildShippingOrderSuggestedDefectSummary(
    PDO $pdo,
    array $workOrderIds,
    array $fallbackWeightByWorkOrder,
    array $inventoryItemIds,
    array $sourceRows
): ?array {
    $normalizedWorkOrderIds = array_values(array_filter(array_map('intval', $workOrderIds), static fn(int $id): bool => $id > 0));
    $normalizedInventoryItemIds = array_values(array_filter(array_map('intval', $inventoryItemIds), static fn(int $id): bool => $id > 0));

    $totalDefectQuantity = 0.0;
    $totalDefectWeightKg = 0.0;

    if ($normalizedWorkOrderIds !== []) {
        $defectTotalsByWorkOrder = fetchShippingOrderSuggestedDefectTotalsByWorkOrder($pdo, $normalizedWorkOrderIds);
        $weightPerUnitByWorkOrder = fetchShippingOrderSuggestedWeightByWorkOrder($pdo, $normalizedWorkOrderIds);

        foreach ($normalizedWorkOrderIds as $workOrderId) {
            $defectQuantity = round((float)($defectTotalsByWorkOrder[$workOrderId] ?? 0), 2);
            if ($defectQuantity <= 0) {
                continue;
            }

            $weightPerUnitG = round((float)($weightPerUnitByWorkOrder[$workOrderId] ?? $fallbackWeightByWorkOrder[$workOrderId] ?? 0), 3);
            $totalDefectQuantity += $defectQuantity;
            $totalDefectWeightKg += round(($defectQuantity * $weightPerUnitG) / 1000, 3);
        }
    } else {
        $seenInventoryItems = [];
        foreach ($sourceRows as $row) {
            $inventoryItemId = (int)($row['inventory_item_id'] ?? 0);
            if ($inventoryItemId <= 0 || isset($seenInventoryItems[$inventoryItemId])) {
                continue;
            }

            $seenInventoryItems[$inventoryItemId] = true;
            $defectQuantity = round((float)($row['total_defect_units'] ?? 0), 2);
            $weightPerUnitG = round((float)($row['weight_per_unit_g'] ?? 0), 3);
            if ($defectQuantity <= 0) {
                continue;
            }

            $totalDefectQuantity += $defectQuantity;
            $totalDefectWeightKg += round(($defectQuantity * $weightPerUnitG) / 1000, 3);
        }
    }

    $totalDefectQuantity = round($totalDefectQuantity, 2);
    $totalDefectWeightKg = round($totalDefectWeightKg, 3);
    if ($totalDefectQuantity <= 0 && $totalDefectWeightKg <= 0) {
        return null;
    }

    $weightPerUnitG = $totalDefectQuantity > 0
        ? round(($totalDefectWeightKg * 1000) / $totalDefectQuantity, 3)
        : 0.0;

    return [
        'defect_quantity' => $totalDefectQuantity,
        'weight_per_unit_g' => $weightPerUnitG,
        'total_weight_kg' => $totalDefectWeightKg,
        'notes' => null,
        'source_shipping_order_id' => null,
        'source_work_order_id' => count($normalizedWorkOrderIds) === 1 ? $normalizedWorkOrderIds[0] : null,
        'source_inventory_item_id' => count($normalizedInventoryItemIds) === 1 ? $normalizedInventoryItemIds[0] : null,
    ];
}

/**
 * @param list<int> $workOrderIds
 * @return array<int,float>
 */
function fetchShippingOrderSuggestedDefectTotalsByWorkOrder(PDO $pdo, array $workOrderIds): array
{
    if ($workOrderIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($workOrderIds), '?'));
    $sql = <<<SQL
SELECT defect_source.work_order_id, SUM(defect_source.defect_quantity) AS total_quantity
FROM (
    SELECT work_order_id, defect_quantity
    FROM work_order_screening_defects
    WHERE work_order_id IN ($placeholders)

    UNION ALL

    SELECT work_order_id, defect_quantity
    FROM work_order_machine_defects
    WHERE work_order_id IN ($placeholders)
) AS defect_source
GROUP BY defect_source.work_order_id
SQL;

    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_merge($workOrderIds, $workOrderIds));

    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $result[(int)$row['work_order_id']] = round((float)($row['total_quantity'] ?? 0), 2);
    }

    return $result;
}

/**
 * @param list<int> $workOrderIds
 * @return array<int,float>
 */
function fetchShippingOrderSuggestedWeightByWorkOrder(PDO $pdo, array $workOrderIds): array
{
    if ($workOrderIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($workOrderIds), '?'));
    $stmt = $pdo->prepare("
        SELECT id, weight_per_unit_g
        FROM work_orders
        WHERE id IN ({$placeholders})
    ");
    $stmt->execute($workOrderIds);

    $result = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $result[(int)$row['id']] = round((float)($row['weight_per_unit_g'] ?? 0), 3);
    }

    return $result;
}

/**
 * @param array<int,array<string,mixed>> $sourceRows
 * @param list<int> $partialReceiptIds
 * @return array<int,array<string,mixed>>
 */
function buildShippingOrderSuggestedToolSummaries(PDO $pdo, array $sourceRows, array $partialReceiptIds): array
{
    $toolDetailsByReceiptId = fetchShippingOrderSuggestedPartialReceiptTools($pdo, $partialReceiptIds);
    $aggregated = [];

    foreach ($sourceRows as $row) {
        $partialReceiptId = (int)($row['partial_receipt_id'] ?? 0);
        $receiptTools = $partialReceiptId > 0 ? ($toolDetailsByReceiptId[$partialReceiptId] ?? []) : [];

        if ($receiptTools !== []) {
            foreach ($receiptTools as $tool) {
                appendShippingOrderSuggestedToolSummary($aggregated, [
                    'tool_id' => $tool['tool_id'] ?? null,
                    'tool_name' => $tool['tool_name'] ?? '',
                    'tool_type' => $tool['tool_type'] ?? null,
                    'quantity' => $tool['quantity'] ?? 0,
                    'unit_weight_kg' => $tool['unit_weight_kg'] ?? 0,
                    'total_weight_kg' => $tool['total_weight_kg'] ?? 0,
                    'notes' => null,
                ]);
            }
            continue;
        }

        $toolName = trim((string)($row['tool_statistics'] ?? ''));
        $toolQuantity = (int)round((float)($row['total_tool_quantity'] ?? 0));
        $toolTotalWeightKg = round((float)($row['tool_weight_kg'] ?? 0), 3);
        $shippingToolDetails = trim((string)($row['shipping_tool_details'] ?? ''));
        if ($toolName === '' && $shippingToolDetails !== '') {
            $toolName = $shippingToolDetails;
        }
        if ($toolName === '' || $toolQuantity <= 0) {
            continue;
        }

        foreach (parseShippingOrderToolStatisticsSuggestions($toolName, $toolQuantity, $toolTotalWeightKg) as $parsedSummary) {
            appendShippingOrderSuggestedToolSummary($aggregated, $parsedSummary);
        }
    }

    return array_values($aggregated);
}

/**
 * @param list<int> $partialReceiptIds
 * @return array<int,list<array<string,mixed>>>
 */
function fetchShippingOrderSuggestedPartialReceiptTools(PDO $pdo, array $partialReceiptIds): array
{
    $normalizedIds = array_values(array_filter(array_map('intval', $partialReceiptIds), static fn(int $id): bool => $id > 0));
    if ($normalizedIds === []) {
        return [];
    }

    $placeholders = implode(', ', array_fill(0, count($normalizedIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            id,
            partial_receipt_id,
            tool_id,
            tool_name,
            tool_type,
            unit_weight_kg,
            quantity,
            total_weight_kg
        FROM work_order_partial_receipt_tools
        WHERE partial_receipt_id IN ({$placeholders})
        ORDER BY partial_receipt_id ASC, id ASC
    ");
    $stmt->execute($normalizedIds);

    $grouped = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) ?: [] as $row) {
        $partialReceiptId = (int)($row['partial_receipt_id'] ?? 0);
        if ($partialReceiptId <= 0) {
            continue;
        }

        if (!isset($grouped[$partialReceiptId])) {
            $grouped[$partialReceiptId] = [];
        }

        $grouped[$partialReceiptId][] = [
            'id' => (int)($row['id'] ?? 0),
            'partial_receipt_id' => $partialReceiptId,
            'tool_id' => isset($row['tool_id']) ? (int)$row['tool_id'] : null,
            'tool_name' => (string)($row['tool_name'] ?? ''),
            'tool_type' => $row['tool_type'] !== null ? (string)$row['tool_type'] : null,
            'unit_weight_kg' => round((float)($row['unit_weight_kg'] ?? 0), 3),
            'quantity' => (int)round((float)($row['quantity'] ?? 0)),
            'total_weight_kg' => round((float)($row['total_weight_kg'] ?? 0), 3),
        ];
    }

    return $grouped;
}

/**
 * @param array<string,array<string,mixed>> $aggregated
 * @param array<string,mixed> $summary
 */
function appendShippingOrderSuggestedToolSummary(array &$aggregated, array $summary): void
{
    $toolName = trim((string)($summary['tool_name'] ?? ''));
    if ($toolName === '') {
        return;
    }

    $toolId = $summary['tool_id'] ?? null;
    $toolType = $summary['tool_type'] !== null && $summary['tool_type'] !== '' ? (string)$summary['tool_type'] : null;
    $unitWeightKg = round((float)($summary['unit_weight_kg'] ?? 0), 3);
    $key = implode('|', [
        $toolId !== null ? (string)(int)$toolId : '0',
        $toolName,
        $toolType ?? '',
        number_format($unitWeightKg, 3, '.', ''),
    ]);

    if (!isset($aggregated[$key])) {
        $aggregated[$key] = [
            'tool_id' => $toolId !== null ? (int)$toolId : null,
            'tool_name' => $toolName,
            'tool_type' => $toolType,
            'quantity' => 0,
            'unit_weight_kg' => $unitWeightKg,
            'total_weight_kg' => 0.0,
            'notes' => null,
        ];
    }

    $aggregated[$key]['quantity'] += (int)round((float)($summary['quantity'] ?? 0));
    $aggregated[$key]['total_weight_kg'] = round(
        (float)$aggregated[$key]['total_weight_kg'] + (float)($summary['total_weight_kg'] ?? 0),
        3
    );
}

/**
 * @return array<int,array<string,mixed>>
 */
function parseShippingOrderToolStatisticsSuggestions(string $toolStatistics, int $totalQuantity, float $totalWeightKg): array
{
    $normalized = trim($toolStatistics);
    if ($normalized === '' || $totalQuantity <= 0) {
        return [];
    }

    $segments = preg_split('/[、\r\n]+/u', $normalized) ?: [];
    $avgUnitWeightKg = $totalQuantity > 0 && $totalWeightKg > 0
        ? round($totalWeightKg / $totalQuantity, 3)
        : 0.0;
    $result = [];
    $allocatedQuantity = 0;

    foreach ($segments as $segment) {
        $segment = trim((string)$segment);
        if ($segment === '') {
            continue;
        }

        $quantity = 0;
        $toolName = $segment;
        if (preg_match('/^(.*?)\s+(\d+)\s*個\s*$/u', $segment, $matches) === 1) {
            $toolName = trim((string)$matches[1]);
            $quantity = (int)$matches[2];
        } elseif (count($segments) === 1) {
            $quantity = $totalQuantity;
        }

        if ($toolName === '' || $quantity <= 0) {
            continue;
        }

        $unitWeightKg = $avgUnitWeightKg;
        if (preg_match('/^\s*([\d.]+)\s*KG/iu', $toolName, $weightMatches) === 1) {
            $unitWeightKg = round((float)$weightMatches[1], 3);
        }

        $lineTotalWeightKg = $unitWeightKg > 0
            ? round($quantity * $unitWeightKg, 3)
            : round($quantity * $avgUnitWeightKg, 3);

        $allocatedQuantity += $quantity;
        $result[] = [
            'tool_id' => null,
            'tool_name' => $toolName,
            'tool_type' => null,
            'quantity' => $quantity,
            'unit_weight_kg' => $unitWeightKg,
            'total_weight_kg' => $lineTotalWeightKg,
            'notes' => null,
        ];
    }

    if ($result !== []) {
        return $result;
    }

    return [[
        'tool_id' => null,
        'tool_name' => $normalized,
        'tool_type' => null,
        'quantity' => $totalQuantity,
        'unit_weight_kg' => $avgUnitWeightKg,
        'total_weight_kg' => $totalWeightKg > 0 ? round($totalWeightKg, 3) : round($totalQuantity * $avgUnitWeightKg, 3),
        'notes' => null,
    ]];
}

/**
 * 更新出貨單不良品摘要
 *
 * @param array<string,mixed>|null $summary
 */
function saveShippingOrderDefectSummary(PDO $pdo, int $shippingOrderId, ?array $summary): void
{
    if ($summary === null) {
        $pdo->prepare('DELETE FROM shipping_order_defect_summaries WHERE shipping_order_id = ?')
            ->execute([$shippingOrderId]);
        return;
    }

    $existingStmt = $pdo->prepare('SELECT id FROM shipping_order_defect_summaries WHERE shipping_order_id = ? LIMIT 1');
    $existingStmt->execute([$shippingOrderId]);
    $existingId = $existingStmt->fetchColumn();

    if ($existingId) {
        $pdo->prepare("
            UPDATE shipping_order_defect_summaries
            SET
                source_shipping_order_id = :source_shipping_order_id,
                source_work_order_id = :source_work_order_id,
                source_inventory_item_id = :source_inventory_item_id,
                defect_quantity = :defect_quantity,
                weight_per_unit_g = :weight_per_unit_g,
                total_weight_kg = :total_weight_kg,
                notes = :notes,
                updated_at = NOW()
            WHERE shipping_order_id = :shipping_order_id
        ")->execute([
            'source_shipping_order_id' => $summary['source_shipping_order_id'],
            'source_work_order_id' => $summary['source_work_order_id'],
            'source_inventory_item_id' => $summary['source_inventory_item_id'],
            'defect_quantity' => $summary['defect_quantity'],
            'weight_per_unit_g' => $summary['weight_per_unit_g'],
            'total_weight_kg' => $summary['total_weight_kg'],
            'notes' => $summary['notes'],
            'shipping_order_id' => $shippingOrderId,
        ]);
        return;
    }

    $pdo->prepare("
        INSERT INTO shipping_order_defect_summaries (
            shipping_order_id,
            source_shipping_order_id,
            source_work_order_id,
            source_inventory_item_id,
            defect_quantity,
            weight_per_unit_g,
            total_weight_kg,
            notes
        ) VALUES (
            :shipping_order_id,
            :source_shipping_order_id,
            :source_work_order_id,
            :source_inventory_item_id,
            :defect_quantity,
            :weight_per_unit_g,
            :total_weight_kg,
            :notes
        )
    ")->execute([
        'shipping_order_id' => $shippingOrderId,
        'source_shipping_order_id' => $summary['source_shipping_order_id'],
        'source_work_order_id' => $summary['source_work_order_id'],
        'source_inventory_item_id' => $summary['source_inventory_item_id'],
        'defect_quantity' => $summary['defect_quantity'],
        'weight_per_unit_g' => $summary['weight_per_unit_g'],
        'total_weight_kg' => $summary['total_weight_kg'],
        'notes' => $summary['notes'],
    ]);
}

/**
 * 取代出貨單載具摘要
 *
 * @param array<int,array<string,mixed>> $summaries
 */
function replaceShippingOrderToolSummaries(PDO $pdo, int $shippingOrderId, array $summaries): void
{
    $pdo->prepare('DELETE FROM shipping_order_tool_summaries WHERE shipping_order_id = ?')
        ->execute([$shippingOrderId]);

    if ($summaries === []) {
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO shipping_order_tool_summaries (
            shipping_order_id,
            tool_id,
            tool_name,
            tool_type,
            unit_weight_kg,
            quantity,
            total_weight_kg,
            notes
        ) VALUES (
            :shipping_order_id,
            :tool_id,
            :tool_name,
            :tool_type,
            :unit_weight_kg,
            :quantity,
            :total_weight_kg,
            :notes
        )
    ");

    foreach ($summaries as $summary) {
        $stmt->execute([
            'shipping_order_id' => $shippingOrderId,
            'tool_id' => $summary['tool_id'],
            'tool_name' => $summary['tool_name'],
            'tool_type' => $summary['tool_type'],
            'unit_weight_kg' => $summary['unit_weight_kg'],
            'quantity' => $summary['quantity'],
            'total_weight_kg' => $summary['total_weight_kg'],
            'notes' => $summary['notes'],
        ]);
    }
}

/**
 * 轉換出貨單為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫原始資料
 * @return array<string,mixed>
 */
function transformShippingOrder(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'shipping_order_number' => $row['shipping_order_number'],
        'customer_id' => $row['customer_id'] ? (int)$row['customer_id'] : null,
        'customer_name' => $row['customer_name'] ?? null,
        'order_id' => $row['order_id'] ? (int)$row['order_id'] : null,
        'order_number' => $row['order_number'] ?? null,
        'shipping_date' => $row['shipping_date'],
        'delivery_method' => $row['delivery_method'],
        'carrier' => $row['carrier'] ?? null,
        'shipment_purpose' => $row['shipment_purpose'] ?? 'normal',
        'tracking_number' => $row['tracking_number'] ?? null,
        'consignee_name' => $row['consignee_name'],
        'consignee_address' => $row['consignee_address'],
        'status' => $row['status'],
        'status_label' => $row['status_label'] ?? null,
        'allowed_status_transitions' => getAllowedShippingOrderTransitions((string)$row['status']),
        'return_status' => $row['return_status'] ?? 'none',
        'has_return' => isset($row['has_return']) ? (bool)$row['has_return'] : false,
        'notes' => $row['notes'],
        'item_count' => isset($row['item_count']) ? (int)$row['item_count'] : 0,
        'total_quantity' => isset($row['total_quantity']) ? (float)$row['total_quantity'] : 0,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * 依 ID 查詢出貨單（含關聯資料）
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findShippingOrder(PDO $pdo, int $id): ?array
{
    $sql = "
        SELECT
            so.*,
            c.name AS customer_name,
            o.order_number,
            lv.value_label AS status_label,
            (SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS item_count,
            (SELECT SUM(soi.shipped_quantity) FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AS total_quantity
        FROM shipping_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN orders o ON so.order_id = o.id
        LEFT JOIN lookup_values lv ON so.status = lv.value_key
            AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'shipping_status')
        WHERE so.id = :id AND so.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 檢查出貨單是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function shippingOrderExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM shipping_orders WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 重新計算庫存品項狀態
 *
 * 根據 quantity_on_hand、quantity_allocated、quantity_shipped 自動判斷狀態：
 * - shipped:   全部出貨完畢（在庫為 0 且有出貨紀錄）
 * - allocated: 有配貨中的數量
 * - in_stock:  正常在庫
 *
 * @param PDO $pdo
 * @param int $inventoryItemId 庫存品項 ID
 * @return string|null 更新後的狀態，找不到品項時回傳 null
 */
function recalculateInventoryStatus(PDO $pdo, int $inventoryItemId): ?string
{
    $stmt = $pdo->prepare("
        SELECT quantity_on_hand, quantity_allocated, quantity_shipped
        FROM inventory_items
        WHERE id = ? AND deleted_at IS NULL
    ");
    $stmt->execute([$inventoryItemId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        return null;
    }

    $onHand = (float)$item['quantity_on_hand'];
    $allocated = (float)$item['quantity_allocated'];
    $shipped = (float)$item['quantity_shipped'];

    if ($onHand <= 0 && $shipped > 0) {
        $newStatus = 'shipped';
    } elseif ($allocated > 0) {
        $newStatus = 'allocated';
    } else {
        $newStatus = 'in_stock';
    }

    $pdo->prepare("UPDATE inventory_items SET status = ? WHERE id = ?")
        ->execute([$newStatus, $inventoryItemId]);

    return $newStatus;
}

/**
 * 重新計算訂單品項的出貨統計
 *
 * 以 shipping_order_items 中對應已出貨（shipped）出貨單為真實來源，
 * 重新計算 total_shipped_quantity 與 shipping_status。
 * 避免增量更新造成的冪等性問題。
 *
 * @param PDO $pdo
 * @param int $orderItemId 訂單品項 ID
 * @return void
 */
function recalculateOrderItemShipping(PDO $pdo, int $orderItemId): void
{
    // 以已出貨的出貨單品項合計為真實來源
    $sumStmt = $pdo->prepare("
        SELECT COALESCE(SUM(soi.shipped_quantity), 0) AS total_shipped
        FROM shipping_order_items soi
        JOIN shipping_orders so ON soi.shipping_order_id = so.id
        WHERE soi.order_item_id = ?
          AND so.status IN ('shipped', 'delivered')
          AND so.deleted_at IS NULL
    ");
    $sumStmt->execute([$orderItemId]);
    $totalShipped = (float)$sumStmt->fetchColumn();

    // 取得訂單品項的總數量
    $oiStmt = $pdo->prepare("SELECT total_units FROM order_items WHERE id = ?");
    $oiStmt->execute([$orderItemId]);
    $totalUnits = (float)$oiStmt->fetchColumn();

    // 推導出貨狀態
    if ($totalShipped <= 0) {
        $shippingStatus = 'not_shipped';
    } elseif ($totalUnits > 0 && $totalShipped >= $totalUnits) {
        $shippingStatus = 'fully_shipped';
    } else {
        $shippingStatus = 'partial_shipped';
    }

    $pdo->prepare("
        UPDATE order_items
        SET total_shipped_quantity = ?,
            shipping_status = ?
        WHERE id = ?
    ")->execute([$totalShipped, $shippingStatus, $orderItemId]);
}

/**
 * 建立庫存異動紀錄
 *
 * @param PDO    $pdo
 * @param int    $inventoryItemId 庫存品項 ID
 * @param string $refType         參照類型 (shipping_order / return_order / work_order / adjustment)
 * @param int    $refId           參照 ID
 * @param string $direction       方向 (inbound / outbound / adjustment)
 * @param float  $quantity        異動數量（正數）
 * @param float  $afterQuantity   異動後在庫數量
 * @param string $notes           備註
 * @param int|null $createdByEmployeeId 操作人員 ID
 * @return void
 */
function createInventoryTransaction(
    PDO $pdo,
    int $inventoryItemId,
    string $refType,
    int $refId,
    string $direction,
    float $quantity,
    float $afterQuantity,
    string $notes = '',
    ?int $createdByEmployeeId = null
): void {
    // 取得庫存品項的關聯資料
    $invStmt = $pdo->prepare("
        SELECT order_id, order_item_id, work_order_id
        FROM inventory_items WHERE id = ?
    ");
    $invStmt->execute([$inventoryItemId]);
    $inv = $invStmt->fetch(PDO::FETCH_ASSOC);

    // 取得下一個交易 ID
    require_once __DIR__ . '/../inventory_items/helpers.php';
    $pdo->prepare("
        INSERT INTO inventory_transactions
            (inventory_item_id, order_id, order_item_id, work_order_id,
             ref_type, ref_id, direction, quantity, after_quantity,
             notes, created_by_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ")->execute([
        $inventoryItemId,
        $inv['order_id'] ?? null,
        $inv['order_item_id'] ?? null,
        $inv['work_order_id'] ?? null,
        $refType,
        $refId,
        $direction,
        $quantity,
        max(0, $afterQuantity),
        $notes,
        $createdByEmployeeId
    ]);
}

/**
 * 取得當前登入使用者 ID
 *
 * @return int|null
 */
function getCurrentEmployeeId(): ?int
{
    $employee = $_SESSION['employee'] ?? null;
    return $employee ? (int)$employee['id'] : null;
}

/**
 * 處理寫入 PDO 例外
 *
 * @param PDOException $e
 * @return array<string,mixed>
 */
function handleShippingOrderWriteException(PDOException $e): array
{
    $code = $e->getCode();
    $message = $e->getMessage();

    error_log("ShippingOrder PDO Exception: [{$code}] {$message}");

    // 唯一約束
    if ($code === '23000' && str_contains($message, 'Duplicate entry')) {
        if (str_contains($message, 'shipping_order_number')) {
            return [
                'success' => false,
                'message' => '出貨單編號已存在，請勿重複。',
            ];
        }
        return [
            'success' => false,
            'message' => '資料重複或違反完整性約束，請確認輸入資料。',
        ];
    }

    // 外鍵約束
    if ($code === '23000' && str_contains($message, 'foreign key constraint')) {
        return [
            'success' => false,
            'message' => '關聯資料不存在或已刪除，請確認資料正確。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}

/**
 * 以尚未出貨且未取消的出貨品項重算配貨量，修復增量更新可能產生的漂移。
 */
function recalculateInventoryAllocation(PDO $pdo, int $inventoryItemId): float
{
    $stmt = $pdo->prepare("
        SELECT COALESCE(SUM(soi.shipped_quantity), 0)
        FROM shipping_order_items soi
        INNER JOIN shipping_orders so ON so.id = soi.shipping_order_id
        WHERE soi.inventory_item_id = ?
          AND so.deleted_at IS NULL
          AND so.status IN ('draft', 'confirmed', 'preparing', 'packed')
    ");
    $stmt->execute([$inventoryItemId]);
    $allocated = max(0.0, (float)$stmt->fetchColumn());

    $pdo->prepare("
        UPDATE inventory_items
        SET quantity_allocated = ?
        WHERE id = ? AND deleted_at IS NULL
    ")->execute([$allocated, $inventoryItemId]);

    return $allocated;
}
