<?php
/**
 * 訂單項目 API - 共用輔助函式
 *
 * 提供訂單項目模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module order_items
 * @table order_items
 *
 * @functions
 * - readOrderItemPayload(): 讀取請求資料 (JSON/FormData)
 * - validateOrderItemData(): 驗證輸入資料（訂單ID、受篩產品、重量等）
 * - findScreeningItem(): 查詢受篩產品
 * - fetchToolsByIds(): 批量查詢載具資料
 * - fetchScreeningServicesByIds(): 批量查詢篩分服務
 * - normaliseToolPayload(): 正規化載具輸入
 * - normaliseServicePayload(): 正規化篩分服務輸入
 * - calculateOrderItemMetrics(): 計算品項總支數與金額
 * - saveOrderItemTools(): 儲存品項載具關聯
 * - saveOrderItemScreeningDetails(): 儲存品項篩分服務關聯
 * - recalculateOrderTotalAmount(): 重算訂單總金額
 * - findOrderItem(): 查詢單筆訂單品項（含關聯）
 * - findOrderItemsByOrder(): 查詢訂單下所有品項
 * - getOrderItemTools(): 取得品項的載具列表
 * - getOrderItemScreeningDetails(): 取得品項的篩分服務列表
 * - getOrderItemDrawings(): 取得品項的圖面檔案
 * - getOrderItemAttachments(): 取得品項的附件檔案
 * - transformOrderItem(): 轉換品項資料為 API 回應格式
 * - ensureOrderExists(): 確認訂單存在
 * - fetchOrderItemOptions(): 取得表單下拉選項
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

const ORDER_ITEM_STATUS_DOMAIN = 'status_work_order';
const ORDER_ITEM_SAMPLE_STATUS_DOMAIN = 'customer_sample_status';

/**
 * Read order item payload supporting JSON or form submissions.
 *
 * @return array<string,mixed>
 */
function readOrderItemPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;

        // 解析 JSON 字串欄位
        if (isset($payload['tools']) && is_string($payload['tools'])) {
            $payload['tools'] = json_decode($payload['tools'], true) ?? [];
        }
        if (isset($payload['screening_details']) && is_string($payload['screening_details'])) {
            $payload['screening_details'] = json_decode($payload['screening_details'], true) ?? [];
        }
    }

    return is_array($payload) ? $payload : [];
}

/**
 * Validate and normalise incoming payload for order items.
 *
 * @param array<string,mixed> $payload
 * @return array{
 *     data: array<string,mixed>,
 *     tools: list<array<string,mixed>>,
 *     services: list<array<string,mixed>>,
 *     errors: array<string,string|array<int,string>>
 * }
 */
function validateOrderItemData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];
    $tools = [];
    $services = [];

    // order_id
    if (!$isUpdate || array_key_exists('order_id', $payload)) {
        $orderId = $payload['order_id'] ?? null;
        if (!$isUpdate && ($orderId === null || $orderId === '')) {
            $errors['order_id'] = '訂單為必填。';
        } elseif ($orderId !== null && $orderId !== '') {
            $orderIdInt = filter_var($orderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderIdInt === false) {
                $errors['order_id'] = '訂單 ID 必須為正整數。';
            } else {
                $data['order_id'] = $orderIdInt;
            }
        }
    }

    // screening_item_id
    if (!$isUpdate || array_key_exists('screening_item_id', $payload)) {
        $screeningItemId = $payload['screening_item_id'] ?? null;
        if (!$isUpdate && ($screeningItemId === null || $screeningItemId === '')) {
            $errors['screening_item_id'] = '受篩產品為必填。';
        } elseif ($screeningItemId !== null && $screeningItemId !== '') {
            $screeningItemIdInt = filter_var($screeningItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($screeningItemIdInt === false) {
                $errors['screening_item_id'] = '受篩產品 ID 必須為正整數。';
            } else {
                $data['screening_item_id'] = $screeningItemIdInt;
            }
        }
    }

    // total_weight_kg
    if (!$isUpdate || array_key_exists('total_weight_kg', $payload)) {
        $totalWeight = $payload['total_weight_kg'] ?? null;
        if (!$isUpdate && ($totalWeight === null || $totalWeight === '')) {
            $errors['total_weight_kg'] = '總重量為必填。';
        } elseif ($totalWeight !== null && $totalWeight !== '') {
            $value = filter_var($totalWeight, FILTER_VALIDATE_FLOAT);
            if ($value === false || $value <= 0) {
                $errors['total_weight_kg'] = '總重量必須為大於 0 的數值。';
            } else {
                $data['total_weight_kg'] = round($value, 2);
            }
        }
    }

    // unit_price_per_thousand
    if (array_key_exists('unit_price_per_thousand', $payload)) {
        $unitPrice = $payload['unit_price_per_thousand'] ?? null;
        if ($unitPrice !== null && $unitPrice !== '') {
            $value = filter_var($unitPrice, FILTER_VALIDATE_FLOAT);
            if ($value === false || $value < 0) {
                $errors['unit_price_per_thousand'] = '單價必須為大於或等於 0 的數值。';
            } else {
                $data['unit_price_per_thousand'] = round($value, 2);
            }
        } else {
            $data['unit_price_per_thousand'] = null;
        }
    }

    // status
    if (array_key_exists('status', $payload)) {
        $status = trim((string)$payload['status']);
        $allowedStatuses = array_keys(getWorkflowTransitionDefinitions()['order_items']);
        if (!in_array($status, $allowedStatuses, true)) {
            $errors['status'] = '訂單品項狀態不在允許清單中。';
        } else {
            $data['status'] = $status;
        }
    }

    // sub_item_number
    if (array_key_exists('sub_item_number', $payload)) {
        $value = trim((string)$payload['sub_item_number']);
        $data['sub_item_number'] = $value === '' ? null : mb_substr($value, 0, 100);
    }

    // part_number
    if (array_key_exists('part_number', $payload)) {
        $value = trim((string)$payload['part_number']);
        $data['part_number'] = $value === '' ? null : mb_substr($value, 0, 100);
    }

    // customer_batch_number
    if (array_key_exists('customer_batch_number', $payload)) {
        $value = trim((string)$payload['customer_batch_number']);
        $data['customer_batch_number'] = $value === '' ? null : mb_substr($value, 0, 100);
    }

    // customer_sample_status
    if (array_key_exists('customer_sample_status', $payload)) {
        $value = trim((string)$payload['customer_sample_status']);
        $data['customer_sample_status'] = $value === '' ? null : mb_substr($value, 0, 50);
    }

    // delivery_location
    if (array_key_exists('delivery_location', $payload)) {
        $value = trim((string)$payload['delivery_location']);
        $data['delivery_location'] = $value === '' ? null : $value;
    }

    // notes
    if (array_key_exists('notes', $payload)) {
        $value = trim((string)$payload['notes']);
        $data['notes'] = $value === '' ? null : $value;
    }

    // drawing_number
    if (array_key_exists('drawing_number', $payload)) {
        $value = trim((string)$payload['drawing_number']);
        $data['drawing_number'] = $value === '' ? null : mb_substr($value, 0, 255);
    }

    // customer_provided_weight - 客戶提供重量
    if (array_key_exists('customer_provided_weight', $payload)) {
        $value = $payload['customer_provided_weight'];
        if ($value !== null && $value !== '') {
            $floatValue = filter_var($value, FILTER_VALIDATE_FLOAT);
            if ($floatValue === false || $floatValue < 0) {
                $errors['customer_provided_weight'] = '客戶提供重量必須為大於或等於 0 的數值。';
            } else {
                $data['customer_provided_weight'] = round($floatValue, 2);
            }
        } else {
            $data['customer_provided_weight'] = null;
        }
    }

    // confirmed_weight - 我方確認重量
    if (array_key_exists('confirmed_weight', $payload)) {
        $value = $payload['confirmed_weight'];
        if ($value !== null && $value !== '') {
            $floatValue = filter_var($value, FILTER_VALIDATE_FLOAT);
            if ($floatValue === false || $floatValue < 0) {
                $errors['confirmed_weight'] = '我方確認重量必須為大於或等於 0 的數值。';
            } else {
                $data['confirmed_weight'] = round($floatValue, 2);
            }
        } else {
            $data['confirmed_weight'] = null;
        }
    }

    // actual_production_weight - 實際生產重量
    if (array_key_exists('actual_production_weight', $payload)) {
        $value = $payload['actual_production_weight'];
        if ($value !== null && $value !== '') {
            $floatValue = filter_var($value, FILTER_VALIDATE_FLOAT);
            if ($floatValue === false || $floatValue < 0) {
                $errors['actual_production_weight'] = '實際生產重量必須為大於或等於 0 的數值。';
            } else {
                $data['actual_production_weight'] = round($floatValue, 2);
            }
        } else {
            $data['actual_production_weight'] = null;
        }
    }

    // tools
    if (array_key_exists('tools', $payload)) {
        if (!is_array($payload['tools'])) {
            $errors['tools'] = '載具資料格式不正確。';
        } else {
            foreach ($payload['tools'] as $index => $toolRow) {
                if (!is_array($toolRow)) {
                    $errors['tools'] = '載具資料格式不正確。';
                    break;
                }

                $toolIdRaw = $toolRow['tool_id'] ?? null;
                $quantityRaw = $toolRow['quantity'] ?? null;

                $toolId = filter_var($toolIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                $quantity = filter_var($quantityRaw, FILTER_VALIDATE_FLOAT);

                if ($toolId === false) {
                    $errors['tools'][$index] = '載具 ID 無效。';
                    continue;
                }
                if ($quantity === false || $quantity <= 0) {
                    $errors['tools'][$index] = '載具數量必須大於 0。';
                    continue;
                }

                $tools[] = [
                    'tool_id' => $toolId,
                    'quantity' => (int)round($quantity),
                ];
            }
        }
    }

    // services
    if (array_key_exists('screening_details', $payload)) {
        if (!is_array($payload['screening_details'])) {
            $errors['screening_details'] = '篩分服務資料格式不正確。';
        } else {
            foreach ($payload['screening_details'] as $index => $detailRow) {
                if (!is_array($detailRow)) {
                    $errors['screening_details'] = '篩分服務資料格式不正確。';
                    break;
                }

                $serviceIdRaw = $detailRow['screening_service_id'] ?? null;
                $serviceId = filter_var($serviceIdRaw, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($serviceId === false) {
                    $errors['screening_details'][$index] = '篩分服務 ID 無效。';
                    continue;
                }

                $priceRaw = $detailRow['actual_price_per_unit'] ?? null;
                $price = $priceRaw === null || $priceRaw === '' ? null : filter_var($priceRaw, FILTER_VALIDATE_FLOAT);
                if ($price !== null && $price !== false && $price < 0) {
                    $errors['screening_details'][$index] = '篩分服務單價不可為負數。';
                    continue;
                }

                $services[] = [
                    'screening_service_id' => $serviceId,
                    'service_name' => isset($detailRow['service_name']) ? mb_substr(trim((string)$detailRow['service_name']), 0, 255) : null,
                    'actual_price_per_unit' => $price === false ? null : ($price === null ? null : round($price, 2)),
                    'tolerance_plus_value' => isset($detailRow['tolerance_plus_value']) && $detailRow['tolerance_plus_value'] !== '' ? round((float)$detailRow['tolerance_plus_value'], 4) : null,
                    'tolerance_plus_over' => isset($detailRow['tolerance_plus_over']) && $detailRow['tolerance_plus_over'] !== '' ? round((float)$detailRow['tolerance_plus_over'], 4) : null,
                    'tolerance_minus_value' => isset($detailRow['tolerance_minus_value']) && $detailRow['tolerance_minus_value'] !== '' ? round((float)$detailRow['tolerance_minus_value'], 4) : null,
                    'tolerance_minus_over' => isset($detailRow['tolerance_minus_over']) && $detailRow['tolerance_minus_over'] !== '' ? round((float)$detailRow['tolerance_minus_over'], 4) : null,
                    'ppm_standard' => isset($detailRow['ppm_standard']) && $detailRow['ppm_standard'] !== '' ? round((float)$detailRow['ppm_standard'], 3) : null,
                    'notes' => isset($detailRow['notes']) ? trim((string)$detailRow['notes']) : null,
                    'description' => isset($detailRow['description']) ? trim((string)$detailRow['description']) : null,
                ];
            }
        }
    }

    if (!$isUpdate && $services === []) {
        $errors['screening_details'] = '至少需要設定一項篩分服務。';
    }

    return [
        'data' => $data,
        'tools' => $tools,
        'services' => $services,
        'errors' => $errors,
    ];
}

/**
 * Fetch a screening item record.
 *
 * @return array<string,mixed>|null
 */
function findScreeningItem(PDO $pdo, int $id, bool $forUpdate = false): ?array
{
    $sql = 'SELECT id, item_number, name, weight_per_unit_g FROM screening_items WHERE id = :id';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Fetch multiple tools by their IDs.
 *
 * @param int[] $ids
 * @return array<int,array<string,mixed>>
 */
function fetchToolsByIds(PDO $pdo, array $ids): array
{
    if ($ids === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        'SELECT id, tool_number, name, type, weight_kg
         FROM tools
         WHERE id IN (' . $placeholders . ')'
    );
    $stmt->execute(array_values($ids));

    $rows = $stmt->fetchAll();
    $result = [];
    foreach ($rows as $row) {
        $result[(int)$row['id']] = $row;
    }

    return $result;
}

/**
 * Fetch multiple screening services by their IDs.
 *
 * @param int[] $ids
 * @return array<int,array<string,mixed>>
 */
function fetchScreeningServicesByIds(PDO $pdo, array $ids): array
{
    if ($ids === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare(
        'SELECT id, name, category, default_price_per_unit,
                tolerance_plus_value, tolerance_plus_over,
                tolerance_minus_value, tolerance_minus_over,
                ppm_standard, description
         FROM screening_services
         WHERE id IN (' . $placeholders . ')'
    );
    $stmt->execute(array_values($ids));

    $rows = $stmt->fetchAll();
    $result = [];
    foreach ($rows as $row) {
        $result[(int)$row['id']] = $row;
    }

    return $result;
}

/**
 * Normalise tool payload by merging with tool master data.
 *
 * @param list<array{tool_id:int,quantity:float}> $toolPayload
 * @return list<array<string,mixed>>
 */
function normaliseToolPayload(PDO $pdo, array $toolPayload): array
{
    if ($toolPayload === []) {
        return [];
    }

    $aggregated = [];
    foreach ($toolPayload as $row) {
        $toolId = $row['tool_id'];
        $quantity = $row['quantity'];

        if (!isset($aggregated[$toolId])) {
            $aggregated[$toolId] = [
                'tool_id' => $toolId,
                'quantity' => 0.0,
            ];
        }
        $aggregated[$toolId]['quantity'] += $quantity;
    }

    $toolIds = array_keys($aggregated);
    $toolDefinitions = fetchToolsByIds($pdo, $toolIds);

    $normalised = [];
    foreach ($aggregated as $toolId => $row) {
        if (!isset($toolDefinitions[$toolId])) {
            throw new InvalidArgumentException('找不到指定的載具。');
        }

        $definition = $toolDefinitions[$toolId];
        $weightKg = isset($definition['weight_kg']) ? (float)$definition['weight_kg'] : 0.0;
        $quantity = (float)$row['quantity'];

        $normalised[] = [
            'tool_id' => $toolId,
            'tool_type' => $definition['type'] ?? null,
            'tool_number' => $definition['tool_number'] ?? null,
            'tool_name' => $definition['name'] ?? null,
            'weight_kg' => $weightKg,
            'quantity' => (int)round($quantity),
            'total_weight_kg' => round($quantity * $weightKg, 4),
        ];
    }

    return $normalised;
}

/**
 * Normalise screening service payload by merging defaults.
 *
 * @param list<array<string,mixed>> $servicePayload
 * @return list<array<string,mixed>>
 */
function normaliseServicePayload(PDO $pdo, array $servicePayload): array
{
    if ($servicePayload === []) {
        return [];
    }

    $serviceIds = array_values(array_unique(array_map(static fn(array $row): int => $row['screening_service_id'], $servicePayload)));
    $serviceDefinitions = fetchScreeningServicesByIds($pdo, $serviceIds);

    $normalised = [];
    foreach ($servicePayload as $row) {
        $serviceId = $row['screening_service_id'];
        if (!isset($serviceDefinitions[$serviceId])) {
            throw new InvalidArgumentException('找不到指定的篩分服務。');
        }

        $definition = $serviceDefinitions[$serviceId];
        $actualPrice = $row['actual_price_per_unit'];
        if ($actualPrice === null) {
            $actualPrice = isset($definition['default_price_per_unit']) ? (float)$definition['default_price_per_unit'] : 0.0;
        }

        $normalised[] = [
            'screening_service_id' => $serviceId,
            'service_name' => $row['service_name'] ?? ($definition['name'] ?? null),
            'actual_price_per_unit' => round((float)$actualPrice, 2),
            'tolerance_plus_value' => $row['tolerance_plus_value'] ?? ($definition['tolerance_plus_value'] !== null ? round((float)$definition['tolerance_plus_value'], 4) : null),
            'tolerance_plus_over' => $row['tolerance_plus_over'] ?? ($definition['tolerance_plus_over'] !== null ? round((float)$definition['tolerance_plus_over'], 4) : null),
            'tolerance_minus_value' => $row['tolerance_minus_value'] ?? ($definition['tolerance_minus_value'] !== null ? round((float)$definition['tolerance_minus_value'], 4) : null),
            'tolerance_minus_over' => $row['tolerance_minus_over'] ?? ($definition['tolerance_minus_over'] !== null ? round((float)$definition['tolerance_minus_over'], 4) : null),
            'ppm_standard' => $row['ppm_standard'] ?? ($definition['ppm_standard'] !== null ? round((float)$definition['ppm_standard'], 3) : null),
            'notes' => $row['notes'] ?? null,
            'description' => $row['description'] ?? ($definition['description'] ?? null),
        ];
    }

    return $normalised;
}

/**
 * Calculate derived metrics for order item totals.
 *
 * @param array<string,mixed> $screeningItem
 * @param list<array<string,mixed>> $tools
 * @param list<array<string,mixed>> $services
 * @return array{total_units: float, total_price: float, total_tool_weight_kg: float, service_unit_price_sum: float}
 */
function calculateOrderItemMetrics(array $screeningItem, float $totalWeightKg, array $tools, array $services, ?float $unitPricePerThousand = null): array
{
    $toolWeight = 0.0;
    foreach ($tools as $tool) {
        $toolWeight += (float)$tool['total_weight_kg'];
    }
    $toolWeight = round($toolWeight, 4);

    $screeningWeight = isset($screeningItem['weight_per_unit_g']) ? (float)$screeningItem['weight_per_unit_g'] : 0.0;
    if ($screeningWeight <= 0) {
        throw new InvalidArgumentException('受篩產品的單支重量設定有誤。');
    }

    $netWeightKg = $totalWeightKg - $toolWeight;
    if ($netWeightKg <= 0) {
        throw new InvalidArgumentException('總重量必須大於載具重量總和，請檢查輸入。');
    }

    $totalUnits = ($netWeightKg * 1000) / $screeningWeight;
    $totalUnits = round($totalUnits, 4);

    $unitPriceSum = 0.0;
    foreach ($services as $service) {
        $unitPriceSum += isset($service['actual_price_per_unit']) ? (float)$service['actual_price_per_unit'] : 0.0;
    }
    $unitPriceSum = round($unitPriceSum, 4);

    // 新計算邏輯: 總支數 × 單價(元/M) ÷ 1000
    if ($unitPricePerThousand !== null && $unitPricePerThousand > 0) {
        $totalPrice = round($totalUnits * $unitPricePerThousand / 1000, 2);
    } else {
        // 如果沒有單價,使用篩分服務價格總和(舊邏輯,向下相容)
        $totalPrice = round($totalUnits * $unitPriceSum, 2);
    }

    return [
        'total_units' => $totalUnits,
        'total_price' => $totalPrice,
        'total_tool_weight_kg' => $toolWeight,
        'service_unit_price_sum' => $unitPriceSum,
    ];
}

/**
 * Persist order item tools.
 *
 * @param list<array<string,mixed>> $tools
 */
function saveOrderItemTools(PDO $pdo, int $orderItemId, array $tools): void
{
    if ($tools === []) {
        return;
    }

    // Fetch tool details to get weight
    $toolIds = array_column($tools, 'tool_id');
    $toolInfos = fetchToolsByIds($pdo, $toolIds);

    $stmt = $pdo->prepare('INSERT INTO order_item_tools (order_item_id, tool_id, tool_type, quantity, total_weight) VALUES (?, ?, ?, ?, ?)');
    foreach ($tools as $tool) {
        $toolId = $tool['tool_id'];
        $quantity = $tool['quantity'];
        $weightKg = isset($toolInfos[$toolId]) ? (float)$toolInfos[$toolId]['weight_kg'] : 0.0;
        $totalWeight = round($weightKg * $quantity, 2);

        $stmt->execute([
            $orderItemId,
            $toolId,
            $tool['tool_type'] ?? null,
            $quantity,
            $totalWeight
        ]);
    }
}

/**
 * Persist order item screening details.
 *
 * @param list<array<string,mixed>> $services
 */
function saveOrderItemScreeningDetails(PDO $pdo, int $orderItemId, array $services): void
{
    if ($services === []) {
        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO order_item_screening_details (
            order_item_id,
            screening_service_id,
            service_name,
            actual_price_per_unit,
            tolerance_plus_value,
            tolerance_plus_over,
            tolerance_minus_value,
            tolerance_minus_over,
            ppm_standard,
            notes,
            description
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )'
    );

    foreach ($services as $service) {
        $stmt->execute([
            $orderItemId,
            $service['screening_service_id'],
            $service['service_name'],
            $service['actual_price_per_unit'],
            $service['tolerance_plus_value'],
            $service['tolerance_plus_over'],
            $service['tolerance_minus_value'],
            $service['tolerance_minus_over'],
            $service['ppm_standard'],
            $service['notes'],
            $service['description'],
        ]);
    }
}

/**
 * Recalculate the total amount of an order.
 */
function recalculateOrderTotalAmount(PDO $pdo, int $orderId): void
{
    $stmt = $pdo->prepare('UPDATE orders SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM order_items
        WHERE order_id = ?
    ) WHERE id = ?');
    $stmt->execute([$orderId, $orderId]);
}

/**
 * Retrieve order item base data.
 *
 * @return array<string,mixed>|null
 */
function findOrderItem(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT oi.*, '
        . 'o.order_number, c.name AS customer_name, '
        . 'si.item_number AS screening_item_number, si.name AS screening_item_name, si.weight_per_unit_g, '
        . 'lv_status.value_label AS status_label, '
        . 'lv_sample.value_label AS customer_sample_status_label, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) > 0 AS has_work_order, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) AS work_order_count, '
        . '(SELECT wo.work_order_number FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL ORDER BY wo.id LIMIT 1) AS work_order_number '
        . 'FROM order_items oi '
        . 'JOIN orders o ON oi.order_id = o.id '
        . 'JOIN customers c ON o.customer_id = c.id '
        . 'JOIN screening_items si ON oi.screening_item_id = si.id '
        . 'LEFT JOIN lookup_values lv_status ON oi.status = lv_status.value_key '
        . ' AND lv_status.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :statusDomain) '
        . 'LEFT JOIN lookup_values lv_sample ON oi.customer_sample_status = lv_sample.value_key '
        . ' AND lv_sample.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :sampleDomain) '
        . 'WHERE oi.id = :id';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'id' => $id,
        'statusDomain' => ORDER_ITEM_STATUS_DOMAIN,
        'sampleDomain' => ORDER_ITEM_SAMPLE_STATUS_DOMAIN,
    ]);

    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Fetch order items for a given order.
 *
 * @return list<array<string,mixed>>
 */
function findOrderItemsByOrder(PDO $pdo, int $orderId): array
{
    $sql = 'SELECT oi.*, '
        . 'o.order_number, c.name AS customer_name, '
        . 'si.item_number AS screening_item_number, si.name AS screening_item_name, si.weight_per_unit_g, '
        . 'lv_status.value_label AS status_label, '
        . 'lv_sample.value_label AS customer_sample_status_label, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) > 0 AS has_work_order, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) AS work_order_count, '
        . '(SELECT wo.work_order_number FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL ORDER BY wo.id LIMIT 1) AS work_order_number '
        . 'FROM order_items oi '
        . 'JOIN orders o ON oi.order_id = o.id '
        . 'JOIN customers c ON o.customer_id = c.id '
        . 'JOIN screening_items si ON oi.screening_item_id = si.id '
        . 'LEFT JOIN lookup_values lv_status ON oi.status = lv_status.value_key '
        . ' AND lv_status.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :statusDomain) '
        . 'LEFT JOIN lookup_values lv_sample ON oi.customer_sample_status = lv_sample.value_key '
        . ' AND lv_sample.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :sampleDomain) '
        . 'WHERE oi.order_id = :order_id '
        . 'ORDER BY oi.id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'order_id' => $orderId,
        'statusDomain' => ORDER_ITEM_STATUS_DOMAIN,
        'sampleDomain' => ORDER_ITEM_SAMPLE_STATUS_DOMAIN,
    ]);

    $rows = $stmt->fetchAll();

    return $rows ?: [];
}

/**
 * Fetch tools linked to order items.
 *
 * @param int[] $orderItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function getOrderItemTools(PDO $pdo, array $orderItemIds): array
{
    if ($orderItemIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $stmt = $pdo->prepare(
        'SELECT ot.id, ot.order_item_id, ot.tool_id, ot.tool_type, ot.quantity, ot.total_weight,
                t.tool_number, t.name AS tool_name, t.type AS tool_type_current, t.weight_kg
         FROM order_item_tools ot
         JOIN tools t ON ot.tool_id = t.id
         WHERE ot.order_item_id IN (' . $placeholders . ')
         ORDER BY ot.id'
    );
    $stmt->execute(array_values($orderItemIds));

    $rows = $stmt->fetchAll();

    $grouped = [];
    foreach ($rows as $row) {
        $orderItemId = (int)$row['order_item_id'];
        if (!isset($grouped[$orderItemId])) {
            $grouped[$orderItemId] = [];
        }

        $quantity = isset($row['quantity']) ? (float)$row['quantity'] : 0.0;
        $weight = isset($row['weight_kg']) ? (float)$row['weight_kg'] : 0.0;

        // 優先使用快照的 tool_type,如果沒有則使用當前的 tool_type_current
        $toolType = !empty($row['tool_type']) ? $row['tool_type'] : $row['tool_type_current'];

        $grouped[$orderItemId][] = [
            'id' => (int)$row['id'],
            'tool_id' => (int)$row['tool_id'],
            'tool_number' => $row['tool_number'],
            'tool_name' => $row['tool_name'],
            'tool_type' => $toolType,
            'weight_kg' => $weight,
            'quantity' => (int)round($quantity),
            'total_weight_kg' => round($quantity * $weight, 4),
        ];
    }

    return $grouped;
}

/**
 * Fetch screening details linked to order items.
 *
 * @param int[] $orderItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function getOrderItemScreeningDetails(PDO $pdo, array $orderItemIds): array
{
    if ($orderItemIds === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $stmt = $pdo->prepare(
        'SELECT d.id, d.order_item_id, d.screening_service_id, d.service_name,
                d.actual_price_per_unit, d.tolerance_plus_value, d.tolerance_plus_over,
                d.tolerance_minus_value, d.tolerance_minus_over, d.ppm_standard,
                d.notes, d.description,
                s.name AS screening_service_name, s.category, s.default_price_per_unit
         FROM order_item_screening_details d
         JOIN screening_services s ON d.screening_service_id = s.id
         WHERE d.order_item_id IN (' . $placeholders . ')
         ORDER BY d.id'
    );
    $stmt->execute(array_values($orderItemIds));

    $rows = $stmt->fetchAll();

    $grouped = [];
    foreach ($rows as $row) {
        $orderItemId = (int)$row['order_item_id'];
        if (!isset($grouped[$orderItemId])) {
            $grouped[$orderItemId] = [];
        }

        $grouped[$orderItemId][] = [
            'id' => (int)$row['id'],
            'screening_service_id' => (int)$row['screening_service_id'],
            'service_name' => $row['service_name'] ?? $row['screening_service_name'],
            'actual_price_per_unit' => isset($row['actual_price_per_unit']) ? (float)$row['actual_price_per_unit'] : 0.0,
            'tolerance_plus_value' => $row['tolerance_plus_value'] !== null ? (float)$row['tolerance_plus_value'] : null,
            'tolerance_plus_over' => $row['tolerance_plus_over'] !== null ? (float)$row['tolerance_plus_over'] : null,
            'tolerance_minus_value' => $row['tolerance_minus_value'] !== null ? (float)$row['tolerance_minus_value'] : null,
            'tolerance_minus_over' => $row['tolerance_minus_over'] !== null ? (float)$row['tolerance_minus_over'] : null,
            'ppm_standard' => $row['ppm_standard'] !== null ? (float)$row['ppm_standard'] : null,
            'notes' => $row['notes'],
            'description' => $row['description'],
            'defaults' => [
                'name' => $row['screening_service_name'],
                'category' => $row['category'],
                'default_price_per_unit' => $row['default_price_per_unit'] !== null ? (float)$row['default_price_per_unit'] : null,
            ],
        ];
    }

    return $grouped;
}

/**
 * Get drawings for order items.
 *
 * @param PDO $pdo
 * @param list<int> $orderItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function getOrderItemDrawings(PDO $pdo, array $orderItemIds): array
{
    if (empty($orderItemIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $sql = "
        SELECT
            id,
            order_item_id,
            drawing_number,
            file_name,
            file_path,
            file_size,
            mime_type,
            uploaded_at
        FROM order_item_drawings
        WHERE order_item_id IN ($placeholders)
        ORDER BY uploaded_at ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($orderItemIds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $grouped = [];
    foreach ($rows as $row) {
        $orderItemId = (int)$row['order_item_id'];
        if (!isset($grouped[$orderItemId])) {
            $grouped[$orderItemId] = [];
        }
        $grouped[$orderItemId][] = [
            'id' => (int)$row['id'],
            'drawing_number' => $row['drawing_number'],
            'file_name' => $row['file_name'],
            'file_path' => $row['file_path'],
            'file_size' => (int)$row['file_size'],
            'mime_type' => $row['mime_type'],
            'uploaded_at' => $row['uploaded_at'],
        ];
    }

    return $grouped;
}

/**
 * Fetch order item attachments.
 *
 * @param list<int> $orderItemIds
 * @return array<int,list<array<string,mixed>>>
 */
function getOrderItemAttachments(PDO $pdo, array $orderItemIds): array
{
    if (empty($orderItemIds)) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $sql = "
        SELECT
            id,
            order_item_id,
            file_name,
            file_path,
            file_size,
            mime_type,
            uploaded_at
        FROM order_item_attachments
        WHERE order_item_id IN ($placeholders)
        ORDER BY uploaded_at ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($orderItemIds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $grouped = [];
    foreach ($rows as $row) {
        $orderItemId = (int)$row['order_item_id'];
        if (!isset($grouped[$orderItemId])) {
            $grouped[$orderItemId] = [];
        }
        $grouped[$orderItemId][] = [
            'id' => (int)$row['id'],
            'file_name' => $row['file_name'],
            'file_path' => $row['file_path'],
            'file_size' => (int)$row['file_size'],
            'mime_type' => $row['mime_type'],
            'uploaded_at' => $row['uploaded_at'],
        ];
    }

    return $grouped;
}

/**
 * Transform order item row into API structure.
 *
 * @param array<string,mixed> $row
 * @param list<array<string,mixed>> $tools
 * @param list<array<string,mixed>> $details
 * @param list<array<string,mixed>> $drawings
 * @param list<array<string,mixed>> $attachments
 * @return array<string,mixed>
 */
function transformOrderItem(array $row, array $tools, array $details, array $drawings = [], array $attachments = []): array
{
    $toolWeight = 0.0;
    foreach ($tools as $tool) {
        $toolWeight += isset($tool['total_weight_kg']) ? (float)$tool['total_weight_kg'] : 0.0;
    }
    $toolWeight = round($toolWeight, 4);

    $unitPriceSum = 0.0;
    foreach ($details as $detail) {
        $unitPriceSum += isset($detail['actual_price_per_unit']) ? (float)$detail['actual_price_per_unit'] : 0.0;
    }
    $unitPriceSum = round($unitPriceSum, 4);

    $totalWeight = isset($row['total_weight_kg']) ? (float)$row['total_weight_kg'] : 0.0;
    $netWeight = $totalWeight - $toolWeight;
    if ($netWeight < 0) {
        $netWeight = 0.0;
    }
    $netWeight = round($netWeight, 4);

    // 即時計算 total_units 和 total_price，確保使用最新的 weight_per_unit_g
    $weightPerUnitG = isset($row['weight_per_unit_g']) ? (float)$row['weight_per_unit_g'] : 0.0;
    $unitPricePerThousand = isset($row['unit_price_per_thousand']) ? (float)$row['unit_price_per_thousand'] : 0.0;

    // 計算總支數：淨重(kg) * 1000 / 單支重(g)
    $totalUnits = 0.0;
    if ($weightPerUnitG > 0 && $netWeight > 0) {
        $totalUnits = ($netWeight * 1000) / $weightPerUnitG;
    }
    $totalUnits = round($totalUnits, 2);

    // 計算預估總金額：總支數 × 單價(元/M) ÷ 1000
    $totalPrice = $totalUnits * $unitPricePerThousand / 1000;
    $totalPrice = round($totalPrice, 2);

    return [
        'id' => (int)$row['id'],
        'order_id' => (int)$row['order_id'],
        'order_item_sequence' => isset($row['order_item_sequence']) ? (int)$row['order_item_sequence'] : null,
        'order_item_number' => $row['order_item_number'] ?? null,
        'order_number' => $row['order_number'] ?? null,
        'customer_name' => $row['customer_name'] ?? null,
        'screening_item' => [
            'id' => (int)$row['screening_item_id'],
            'item_number' => $row['screening_item_number'] ?? null,
            'name' => $row['screening_item_name'] ?? null,
            'weight_per_unit_g' => $weightPerUnitG > 0 ? $weightPerUnitG : null,
        ],
        'total_weight_kg' => $totalWeight,
        'total_units' => $totalUnits,
        'total_price' => $totalPrice,
        'unit_price_per_thousand' => $unitPricePerThousand > 0 ? $unitPricePerThousand : null,
        'status' => $row['status'] ?? null,
        'status_label' => $row['status_label'] ?? null,
        'drawing_number' => $row['drawing_number'] ?? null, // Add drawing_number
        'has_work_order' => (bool)($row['has_work_order'] ?? false),
        'work_order_number' => $row['work_order_number'] ?? null,
        'work_order_count' => isset($row['work_order_count']) ? (int)$row['work_order_count'] : ((bool)($row['has_work_order'] ?? false) ? 1 : 0),
        'inventory_item_count' => isset($row['inventory_item_count']) ? (int)$row['inventory_item_count'] : 0,
        'shipping_order_item_count' => isset($row['shipping_order_item_count']) ? (int)$row['shipping_order_item_count'] : 0,
        'return_order_item_count' => isset($row['return_order_item_count']) ? (int)$row['return_order_item_count'] : 0,
        'sub_item_number' => $row['sub_item_number'] ?? null,
        'part_number' => $row['part_number'] ?? null,
        'customer_batch_number' => $row['customer_batch_number'] ?? null,
        'customer_sample_status' => $row['customer_sample_status'] ?? null,
        'customer_sample_status_label' => $row['customer_sample_status_label'] ?? null,
        'delivery_location' => $row['delivery_location'] ?? null,
        'notes' => $row['notes'] ?? null,
        // 重量追蹤欄位
        'customer_provided_weight' => isset($row['customer_provided_weight']) ? (float)$row['customer_provided_weight'] : null,
        'confirmed_weight' => isset($row['confirmed_weight']) ? (float)$row['confirmed_weight'] : null,
        'actual_production_weight' => isset($row['actual_production_weight']) ? (float)$row['actual_production_weight'] : null,
        // 出貨追蹤欄位
        'total_shipped_quantity' => isset($row['total_shipped_quantity']) ? (float)$row['total_shipped_quantity'] : 0.0,
        'shipping_status' => $row['shipping_status'] ?? 'not_shipped',
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
        'tools' => $tools,
        'screening_details' => $details,
        'drawings' => $drawings,
        'attachments' => $attachments,
        'totals' => [
            'tool_weight_kg' => $toolWeight,
            'net_weight_kg' => $netWeight,
            'service_unit_price_sum' => $unitPriceSum,
        ],
    ];
}

/**
 * Reserve the next stable identifier for a new order item.
 * The parent order row must be locked by this query before the sequence is read.
 *
 * @return array{order_id:int,order_number:string,order_item_sequence:int,order_item_number:string}
 */
function reserveNextOrderItemIdentity(PDO $pdo, int $orderId): array
{
    $orderStmt = $pdo->prepare(
        'SELECT id, order_number
         FROM orders
         WHERE id = :id AND deleted_at IS NULL
         FOR UPDATE'
    );
    $orderStmt->execute(['id' => $orderId]);
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

    if (!$order || trim((string)($order['order_number'] ?? '')) === '') {
        throw new InvalidArgumentException('找不到對應的訂單資料。');
    }

    $sequenceStmt = $pdo->prepare(
        'SELECT COALESCE(MAX(order_item_sequence), 0) + 1
         FROM order_items
         WHERE order_id = :order_id'
    );
    $sequenceStmt->execute(['order_id' => $orderId]);
    $sequence = (int)$sequenceStmt->fetchColumn();

    if ($sequence < 1 || $sequence > 99) {
        throw new InvalidArgumentException('此訂單明細已達 L99 上限，請先確認例外編號策略。');
    }

    $orderNumber = trim((string)$order['order_number']);

    return [
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'order_item_sequence' => $sequence,
        'order_item_number' => sprintf('%s-L%02d', $orderNumber, $sequence),
    ];
}

/**
 * Fetch all order items for the global customer-batch work area.
 *
 * @return list<array<string,mixed>>
 */
function findAllOrderItems(PDO $pdo, ?string $keyword = null): array
{
    $sql = 'SELECT oi.*, '
        . 'o.order_number, c.name AS customer_name, '
        . 'si.item_number AS screening_item_number, si.name AS screening_item_name, si.weight_per_unit_g, '
        . 'lv_status.value_label AS status_label, '
        . 'lv_sample.value_label AS customer_sample_status_label, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) > 0 AS has_work_order, '
        . '(SELECT COUNT(*) FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL) AS work_order_count, '
        . '(SELECT wo.work_order_number FROM work_orders wo WHERE wo.order_item_id = oi.id AND wo.deleted_at IS NULL ORDER BY wo.id LIMIT 1) AS work_order_number, '
        . '(SELECT COUNT(*) FROM inventory_items ii WHERE ii.order_item_id = oi.id AND ii.deleted_at IS NULL) AS inventory_item_count, '
        . '(SELECT COUNT(*) FROM shipping_order_items soi WHERE soi.order_item_id = oi.id) AS shipping_order_item_count, '
        . '(SELECT COUNT(*) FROM return_order_items roi JOIN shipping_order_items soi_return ON soi_return.id = roi.shipping_order_item_id WHERE soi_return.order_item_id = oi.id) AS return_order_item_count '
        . 'FROM order_items oi '
        . 'JOIN orders o ON oi.order_id = o.id '
        . 'JOIN customers c ON o.customer_id = c.id '
        . 'JOIN screening_items si ON oi.screening_item_id = si.id '
        . 'LEFT JOIN lookup_values lv_status ON oi.status = lv_status.value_key '
        . ' AND lv_status.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :statusDomain) '
        . 'LEFT JOIN lookup_values lv_sample ON oi.customer_sample_status = lv_sample.value_key '
        . ' AND lv_sample.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = :sampleDomain) ';

    $params = [
        'statusDomain' => ORDER_ITEM_STATUS_DOMAIN,
        'sampleDomain' => ORDER_ITEM_SAMPLE_STATUS_DOMAIN,
    ];

    if ($keyword !== null && trim($keyword) !== '') {
        $sql .= 'WHERE oi.order_item_number LIKE :keyword '
            . ' OR oi.customer_batch_number LIKE :keyword '
            . ' OR o.order_number LIKE :keyword '
            . ' OR c.name LIKE :keyword '
            . ' OR EXISTS (SELECT 1 FROM work_orders wo_search WHERE wo_search.order_item_id = oi.id AND wo_search.work_order_number LIKE :keyword) ';
        $params['keyword'] = '%' . trim($keyword) . '%';
    }

    $sql .= 'ORDER BY oi.id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return $rows ?: [];
}

/**
 * Verify order exists.
 */
function ensureOrderExists(PDO $pdo, int $orderId, bool $forUpdate = false): bool
{
    $sql = 'SELECT 1 FROM orders WHERE id = :id AND deleted_at IS NULL';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $orderId]);

    return (bool)$stmt->fetchColumn();
}

/**
 * Fetch selectable options for order item forms.
 */
function fetchOrderItemOptions(PDO $pdo): array
{
    $screeningItemsStmt = $pdo->query('SELECT id, item_number, name, weight_per_unit_g, unit_price FROM screening_items ORDER BY name');
    $screeningItems = $screeningItemsStmt ? $screeningItemsStmt->fetchAll() : [];

    $toolsStmt = $pdo->query('SELECT id, tool_number, name, type, weight_kg FROM tools ORDER BY tool_number');
    $tools = $toolsStmt ? $toolsStmt->fetchAll() : [];

    $servicesStmt = $pdo->query('SELECT id, service_number, name, category, default_price_per_unit FROM screening_services WHERE is_active = 1 ORDER BY name');
    $services = $servicesStmt ? $servicesStmt->fetchAll() : [];

    $sampleLookupStmt = $pdo->prepare('SELECT lv.value_key, lv.value_label FROM lookup_domains ld JOIN lookup_values lv ON ld.id = lv.domain_id WHERE ld.domain_key = :domain ORDER BY lv.sort_order, lv.id');
    $sampleLookupStmt->execute(['domain' => ORDER_ITEM_SAMPLE_STATUS_DOMAIN]);
    $sampleStatuses = $sampleLookupStmt->fetchAll() ?: [];

    $statusLookupStmt = $pdo->prepare('SELECT lv.value_key, lv.value_label FROM lookup_domains ld JOIN lookup_values lv ON ld.id = lv.domain_id WHERE ld.domain_key = :domain ORDER BY lv.sort_order, lv.id');
    $statusLookupStmt->execute(['domain' => ORDER_ITEM_STATUS_DOMAIN]);
    $statuses = $statusLookupStmt->fetchAll() ?: [];

    return [
        'screening_items' => array_map(static fn(array $row): array => [
            'id' => (int)$row['id'],
            'item_number' => $row['item_number'],
            'name' => $row['name'],
            'weight_per_unit_g' => isset($row['weight_per_unit_g']) ? (float)$row['weight_per_unit_g'] : null,
            'unit_price' => isset($row['unit_price']) ? (float)$row['unit_price'] : null,
        ], $screeningItems ?: []),
        'tools' => array_map(static fn(array $row): array => [
            'id' => (int)$row['id'],
            'tool_number' => $row['tool_number'],
            'name' => $row['name'],
            'type' => $row['type'] ?? null,
            'weight_kg' => isset($row['weight_kg']) ? (float)$row['weight_kg'] : null,
        ], $tools ?: []),
        'screening_services' => array_map(static fn(array $row): array => [
            'id' => (int)$row['id'],
            'service_number' => $row['service_number'],
            'name' => $row['name'],
            'category' => $row['category'],
            'default_price_per_unit' => isset($row['default_price_per_unit']) ? (float)$row['default_price_per_unit'] : null,
        ], $services ?: []),
        'customer_sample_statuses' => array_map(static fn(array $row): array => [
            'value' => $row['value_key'],
            'label' => $row['value_label'],
        ], $sampleStatuses),
        'statuses' => array_map(static fn(array $row): array => [
            'value' => $row['value_key'],
            'label' => $row['value_label'],
        ], $statuses),
    ];
}
