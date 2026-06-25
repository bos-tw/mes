<?php
declare(strict_types=1);

require_once __DIR__ . '/../number_sequences/helpers.php';
require_once __DIR__ . '/../work_orders/helpers.php';

function generateRescreenBatchNumber(PDO $pdo): string
{
    return generateManagedDocumentNumber($pdo, 'RB');
}

function rescreenBatchStatusOptions(): array
{
    return ['draft', 'planned', 'in_progress', 'completed', 'cancelled'];
}

function rescreenBatchTypeOptions(): array
{
    return ['strict_rescreen', 'relaxed_rescreen'];
}

function defaultSecondScreeningReasonText(?string $requestReasonCode = null, ?string $rescreenType = null): string
{
    $legacyReason = trim((string)$requestReasonCode);
    if ($legacyReason === 'high_defect_relax') {
        return '不良過多，客戶放寬後再篩';
    }
    if ($legacyReason === 'customer_strict_request') {
        return '客戶每批要求二次篩選';
    }

    return $rescreenType === 'relaxed_rescreen'
        ? '不良過多，客戶放寬後再篩'
        : '客戶每批要求二次篩選';
}

function normalizeSecondScreeningReason(?string $reason, ?string $requestReasonCode = null, ?string $rescreenType = null): string
{
    $normalized = trim((string)$reason);
    if ($normalized !== '') {
        return mb_substr($normalized, 0, 255);
    }

    return defaultSecondScreeningReasonText($requestReasonCode, $rescreenType);
}

function legacyRequestReasonCodeFromRescreenType(string $rescreenType): string
{
    return $rescreenType === 'relaxed_rescreen'
        ? 'high_defect_relax'
        : 'customer_strict_request';
}

function validateRescreenBatchPayload(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (array_key_exists('source_return_order_id', $payload)) {
        $returnOrderId = filter_var(
            $payload['source_return_order_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        if ($returnOrderId !== false) {
            $data['source_return_order_id'] = (int)$returnOrderId;
        }
    }

    if (array_key_exists('source_work_order_id', $payload)) {
        $sourceWorkOrderId = filter_var(
            $payload['source_work_order_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        if ($sourceWorkOrderId !== false) {
            $data['source_work_order_id'] = (int)$sourceWorkOrderId;
        }
    }

    if (!$isUpdate || array_key_exists('rescreen_type', $payload)) {
        $rescreenType = trim((string)($payload['rescreen_type'] ?? 'strict_rescreen'));
        if (!in_array($rescreenType, rescreenBatchTypeOptions(), true)) {
            $errors['rescreen_type'] = '二次篩選類型必須為 strict_rescreen 或 relaxed_rescreen。';
        } else {
            $data['rescreen_type'] = $rescreenType;
        }
    }

    if (array_key_exists('request_reason_code', $payload)) {
        $requestReasonCode = trim((string)($payload['request_reason_code'] ?? ''));
        $data['request_reason_code'] = $requestReasonCode !== '' ? mb_substr($requestReasonCode, 0, 50) : null;
    }

    if (!$isUpdate || array_key_exists('second_screening_reason', $payload)) {
        $rawSecondScreeningReason = trim((string)($payload['second_screening_reason'] ?? ''));
        if ($rawSecondScreeningReason === '' && $isUpdate) {
            $errors['second_screening_reason'] = '二次篩選原因為必填。';
        }
        $secondScreeningReason = normalizeSecondScreeningReason(
            isset($payload['second_screening_reason']) ? (string)$payload['second_screening_reason'] : null,
            isset($payload['request_reason_code']) ? (string)$payload['request_reason_code'] : null,
            $data['rescreen_type'] ?? null
        );
        if ($secondScreeningReason === '') {
            $errors['second_screening_reason'] = '二次篩選原因為必填。';
        } else {
            $data['second_screening_reason'] = $secondScreeningReason;
            if (!isset($data['request_reason_code']) && isset($data['rescreen_type'])) {
                $data['request_reason_code'] = legacyRequestReasonCodeFromRescreenType((string)$data['rescreen_type']);
            }
        }
    }

    if (array_key_exists('customer_approval_reference', $payload)) {
        $approvalReference = trim((string)($payload['customer_approval_reference'] ?? ''));
        $data['customer_approval_reference'] = $approvalReference !== '' ? $approvalReference : null;
    }

    if (array_key_exists('source_requirement_id', $payload)) {
        $sourceRequirementId = filter_var(
            $payload['source_requirement_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        $data['source_requirement_id'] = $sourceRequirementId !== false ? (int)$sourceRequirementId : null;
    }

    if (array_key_exists('source_defect_history_record_id', $payload)) {
        $sourceDefectHistoryRecordId = filter_var(
            $payload['source_defect_history_record_id'] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => 1]]
        );
        $data['source_defect_history_record_id'] = $sourceDefectHistoryRecordId !== false ? (int)$sourceDefectHistoryRecordId : null;
    }

    if (array_key_exists('result_category', $payload)) {
        $resultCategory = trim((string)($payload['result_category'] ?? ''));
        $data['result_category'] = $resultCategory !== '' ? mb_substr($resultCategory, 0, 30) : null;
    }

    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? 'draft'));
        if ($status !== '' && !in_array($status, rescreenBatchStatusOptions(), true)) {
            $errors['status'] = '案件狀態不正確。';
        } else {
            $data['status'] = $status !== '' ? $status : 'draft';
        }
    }

    $numericFields = [
        'rescreen_output_good_units',
        'rescreen_output_defect_units',
        'rescreen_output_scrap_units',
    ];
    foreach ($numericFields as $field) {
        if (!array_key_exists($field, $payload)) {
            continue;
        }
        $value = $payload[$field];
        if ($value === null || $value === '') {
            $data[$field] = null;
            continue;
        }
        $numericValue = filter_var($value, FILTER_VALIDATE_FLOAT);
        if ($numericValue === false || $numericValue < 0) {
            $errors[$field] = '數值必須為非負數。';
            continue;
        }
        $data[$field] = round((float)$numericValue, 2);
    }

    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    if (array_key_exists('started_at', $payload)) {
        $data['started_at'] = normalizeRescreenDateTime($payload['started_at']);
    }

    if (array_key_exists('completed_at', $payload)) {
        $data['completed_at'] = normalizeRescreenDateTime($payload['completed_at']);
    }

    return ['data' => $data, 'errors' => $errors];
}

function normalizeRescreenDateTime($value): ?string
{
    $text = trim((string)($value ?? ''));
    if ($text === '') {
        return null;
    }

    foreach (['Y-m-d\TH:i', 'Y-m-d H:i', 'Y-m-d H:i:s', 'Y-m-d'] as $format) {
        $date = DateTime::createFromFormat($format, $text);
        if ($date instanceof DateTime) {
            if ($format === 'Y-m-d') {
                $date->setTime(0, 0, 0);
            } elseif ($format === 'Y-m-d\TH:i' || $format === 'Y-m-d H:i') {
                $date->setTime((int)$date->format('H'), (int)$date->format('i'), 0);
            }
            return $date->format('Y-m-d H:i:s');
        }
    }

    return null;
}

/**
 * @param array<int,array<string,mixed>> $rows
 * @return array{data: array<int,array<string,mixed>>, errors: array<string,string>}
 */
function validateRescreenDefectPayload(array $rows): array
{
    $errors = [];
    $data = [];

    foreach ($rows as $index => $row) {
        if (!is_array($row)) {
            $errors["defects.$index"] = '二次篩分服務明細格式不正確。';
            continue;
        }

        $serviceId = filter_var($row['screening_service_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $serviceName = trim((string)($row['service_name'] ?? ''));
        if ($serviceName === '' && $serviceId === false) {
            $errors["defects.$index.service_name"] = '二次篩分服務名稱不可空白。';
            continue;
        }

        $defectQuantity = filter_var($row['defect_quantity'] ?? 0, FILTER_VALIDATE_FLOAT);
        if ($defectQuantity === false || $defectQuantity < 0) {
            $errors["defects.$index.defect_quantity"] = '二次篩分不良數量必須為非負數。';
            continue;
        }

        $defectWeightKg = null;
        if (($row['defect_weight_kg'] ?? '') !== '') {
            $defectWeightKg = filter_var($row['defect_weight_kg'], FILTER_VALIDATE_FLOAT);
            if ($defectWeightKg === false || $defectWeightKg < 0) {
                $errors["defects.$index.defect_weight_kg"] = '二次篩分不良重量必須為非負數。';
                continue;
            }
        }

        $defectUnits = null;
        if (($row['defect_units'] ?? '') !== '') {
            $defectUnits = filter_var($row['defect_units'], FILTER_VALIDATE_FLOAT);
            if ($defectUnits === false || $defectUnits < 0) {
                $errors["defects.$index.defect_units"] = '二次篩分不良支數必須為非負數。';
                continue;
            }
        }

        $recordedAt = normalizeRescreenDateTime($row['recorded_at'] ?? null) ?? date('Y-m-d H:i:s');
        $disposition = trim((string)($row['disposition'] ?? ''));
        $notes = trim((string)($row['notes'] ?? ''));

        $data[] = [
            'id' => filter_var($row['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
            'screening_service_id' => $serviceId !== false ? (int)$serviceId : null,
            'service_name' => $serviceName !== '' ? mb_substr($serviceName, 0, 255) : ('服務#' . (string)$serviceId),
            'defect_quantity' => round((float)$defectQuantity, 2),
            'defect_weight_kg' => $defectWeightKg !== null ? round((float)$defectWeightKg, 3) : 0.0,
            'defect_units' => $defectUnits !== null ? round((float)$defectUnits, 2) : 0.0,
            'disposition' => $disposition !== '' ? mb_substr($disposition, 0, 30) : null,
            'notes' => $notes !== '' ? $notes : null,
            'recorded_at' => $recordedAt,
            'source_defect_history_record_id' => filter_var($row['source_defect_history_record_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
            'sort_order' => $index + 1,
        ];
    }

    return ['data' => $data, 'errors' => $errors];
}

function isMeaningfulRescreenProductionRecord(array $row): bool
{
    foreach ([
        'card_number',
        'weight_kg',
        'production_date',
        'production_time',
        'machine_id',
        'tool_name',
        'tool_weight_kg',
        'notes',
    ] as $field) {
        $value = $row[$field] ?? null;
        if ($value !== null && trim((string)$value) !== '') {
            return true;
        }
    }

    return false;
}

/**
 * @param array<int,array<string,mixed>> $rows
 * @return array{data: array<int,array<string,mixed>>, errors: array<string,string>}
 */
function validateRescreenProductionRecordPayload(array $rows): array
{
    $errors = [];
    $data = [];

    foreach ($rows as $index => $row) {
        if (!is_array($row) || !isMeaningfulRescreenProductionRecord($row)) {
            continue;
        }

        $weightKg = null;
        if (($row['weight_kg'] ?? '') !== '') {
            $weightKg = filter_var($row['weight_kg'], FILTER_VALIDATE_FLOAT);
            if ($weightKg === false || $weightKg < 0) {
                $errors["production_records.$index.weight_kg"] = '二次篩選生產記錄重量必須為非負數。';
                continue;
            }
        }

        $toolWeightKg = null;
        if (($row['tool_weight_kg'] ?? '') !== '') {
            $toolWeightKg = filter_var($row['tool_weight_kg'], FILTER_VALIDATE_FLOAT);
            if ($toolWeightKg === false || $toolWeightKg < 0) {
                $errors["production_records.$index.tool_weight_kg"] = '二次篩選生產記錄載具重量必須為非負數。';
                continue;
            }
        }

        $machineId = filter_var($row['machine_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $productionDate = trim((string)($row['production_date'] ?? ''));
        $productionTime = trim((string)($row['production_time'] ?? ''));
        $notes = trim((string)($row['notes'] ?? ''));

        $data[] = [
            'id' => filter_var($row['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]) ?: null,
            'production_source_mode' => trim((string)($row['production_source_mode'] ?? '')) ?: 'preset',
            'card_number' => trim((string)($row['card_number'] ?? '')) ?: null,
            'weight_kg' => $weightKg !== null ? round((float)$weightKg, 2) : null,
            'production_date' => $productionDate !== '' ? $productionDate : null,
            'production_time' => $productionTime !== '' ? $productionTime : null,
            'machine_id' => $machineId !== false ? (int)$machineId : null,
            'machine_type' => trim((string)($row['machine_type'] ?? '')) ?: null,
            'tool_name' => trim((string)($row['tool_name'] ?? '')) ?: null,
            'tool_weight_kg' => $toolWeightKg !== null ? round((float)$toolWeightKg, 3) : null,
            'notes' => $notes !== '' ? $notes : null,
            'sort_order' => $index + 1,
        ];
    }

    return ['data' => $data, 'errors' => $errors];
}

function fetchReturnOrderSourceProfile(PDO $pdo, int $returnOrderId): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            ro.id,
            ro.return_order_number,
            ro.original_shipping_order_id,
            ro.customer_id,
            ro.return_date,
            ro.return_reason,
            ro.notes,
            c.name AS customer_name
        FROM return_orders ro
        LEFT JOIN customers c ON c.id = ro.customer_id
        WHERE ro.id = :id
          AND ro.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['id' => $returnOrderId]);
    $returnOrder = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$returnOrder) {
        return null;
    }

    $itemsStmt = $pdo->prepare("
        SELECT
            roi.id AS return_order_item_id,
            roi.returned_quantity,
            roi.returned_unit,
            roi.reason,
            soi.id AS shipping_order_item_id,
            soi.shipping_order_id,
            soi.order_item_id,
            soi.inventory_item_id,
            soi.shipped_quantity,
            soi.shipped_unit,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            oi.part_number,
            oi.sub_item_number,
            si.name AS screening_item_name,
            inv.work_order_id AS source_work_order_id,
            inv.weight_per_unit_g,
            inv.net_weight_kg AS inventory_net_weight_kg
        FROM return_order_items roi
        INNER JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
        INNER JOIN order_items oi ON oi.id = soi.order_item_id
        LEFT JOIN screening_items si ON si.id = oi.screening_item_id
        LEFT JOIN inventory_items inv ON inv.id = soi.inventory_item_id
        WHERE roi.return_order_id = :return_order_id
        ORDER BY roi.id ASC
    ");
    $itemsStmt->execute(['return_order_id' => $returnOrderId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    if ($items === []) {
        throw new RuntimeException('此退貨單沒有可建立二次篩選的退貨品項。');
    }

    $sourceOrderIds = [];
    $sourceOrderItemIds = [];
    $sourceWorkOrderIds = [];
    $receivedTotalQuantity = 0.0;
    $receivedTotalWeightKg = 0.0;

    foreach ($items as &$item) {
        $orderId = isset($item['order_id']) ? (int)$item['order_id'] : 0;
        $orderItemId = isset($item['order_item_id']) ? (int)$item['order_item_id'] : 0;
        $workOrderId = isset($item['source_work_order_id']) ? (int)$item['source_work_order_id'] : 0;
        $returnedQuantity = round((float)($item['returned_quantity'] ?? 0), 2);
        $weightPerUnitG = round((float)($item['weight_per_unit_g'] ?? 0), 3);
        $estimatedWeightKg = $weightPerUnitG > 0
            ? round(($returnedQuantity * $weightPerUnitG) / 1000, 3)
            : 0.0;

        $item['estimated_weight_kg'] = $estimatedWeightKg;
        $receivedTotalQuantity += $returnedQuantity;
        $receivedTotalWeightKg += $estimatedWeightKg;

        if ($orderId > 0) {
            $sourceOrderIds[$orderId] = true;
        }
        if ($orderItemId > 0) {
            $sourceOrderItemIds[$orderItemId] = true;
        }
        if ($workOrderId > 0) {
            $sourceWorkOrderIds[$workOrderId] = true;
        }
    }
    unset($item);

    $primaryItem = $items[0];

    return [
        'return_order' => $returnOrder,
        'items' => $items,
        'source_order_ids' => array_keys($sourceOrderIds),
        'source_order_item_ids' => array_keys($sourceOrderItemIds),
        'source_work_order_ids' => array_keys($sourceWorkOrderIds),
        'primary_order_id' => isset($primaryItem['order_id']) ? (int)$primaryItem['order_id'] : null,
        'primary_order_item_id' => isset($primaryItem['order_item_id']) ? (int)$primaryItem['order_item_id'] : null,
        'primary_work_order_id' => isset($primaryItem['source_work_order_id']) ? (int)$primaryItem['source_work_order_id'] : null,
        'received_total_quantity' => round($receivedTotalQuantity, 2),
        'received_total_weight_kg' => round($receivedTotalWeightKg, 3),
    ];
}

function fetchWorkOrderSecondScreeningSourceProfile(PDO $pdo, int $workOrderId): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            wo.id AS source_work_order_id,
            wo.work_order_number,
            wo.order_item_id,
            wo.total_weight_kg,
            wo.total_units,
            wo.weight_per_unit_g,
            wo.customer_instructions,
            wo.other_notes,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            oi.part_number,
            oi.sub_item_number,
            oi.total_weight_kg AS order_item_total_weight_kg,
            oi.total_units AS order_item_total_units,
            si.name AS screening_item_name,
            o.customer_id,
            o.order_number,
            c.name AS customer_name
        FROM work_orders wo
        INNER JOIN order_items oi ON oi.id = wo.order_item_id
        INNER JOIN orders o ON o.id = oi.order_id
        LEFT JOIN screening_items si ON si.id = oi.screening_item_id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE wo.id = :id
          AND wo.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['id' => $workOrderId]);
    $sourceWorkOrder = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$sourceWorkOrder) {
        return null;
    }

    $weightPerUnitG = round((float)($sourceWorkOrder['weight_per_unit_g'] ?? 0), 3);
    $sourceQuantity = round((float)($sourceWorkOrder['total_units'] ?? 0), 2);
    if ($sourceQuantity <= 0) {
        $sourceQuantity = round((float)($sourceWorkOrder['order_item_total_units'] ?? 0), 2);
    }
    $sourceWeightKg = round((float)($sourceWorkOrder['total_weight_kg'] ?? 0), 3);
    if ($sourceWeightKg <= 0) {
        $sourceWeightKg = round((float)($sourceWorkOrder['order_item_total_weight_kg'] ?? 0), 3);
    }
    if ($sourceWeightKg <= 0 && $weightPerUnitG > 0 && $sourceQuantity > 0) {
        $sourceWeightKg = round(($sourceQuantity * $weightPerUnitG) / 1000, 3);
    }

    $item = [
        'return_order_item_id' => null,
        'shipping_order_item_id' => null,
        'shipping_order_id' => null,
        'inventory_item_id' => null,
        'order_id' => (int)$sourceWorkOrder['order_id'],
        'order_item_id' => (int)$sourceWorkOrder['order_item_id'],
        'source_work_order_id' => (int)$sourceWorkOrder['source_work_order_id'],
        'returned_quantity' => $sourceQuantity,
        'returned_unit' => '支',
        'shipped_unit' => '支',
        'estimated_weight_kg' => $sourceWeightKg,
        'reason' => '客戶規格要求二次篩選',
        'source_notes' => trim((string)($sourceWorkOrder['other_notes'] ?? '')) ?: null,
        'screening_item_name' => $sourceWorkOrder['screening_item_name'] ?? null,
    ];

    return [
        'return_order' => null,
        'source_work_order' => $sourceWorkOrder,
        'items' => [$item],
        'source_order_ids' => [(int)$sourceWorkOrder['order_id']],
        'source_order_item_ids' => [(int)$sourceWorkOrder['order_item_id']],
        'source_work_order_ids' => [(int)$sourceWorkOrder['source_work_order_id']],
        'primary_order_id' => (int)$sourceWorkOrder['order_id'],
        'primary_order_item_id' => (int)$sourceWorkOrder['order_item_id'],
        'primary_work_order_id' => (int)$sourceWorkOrder['source_work_order_id'],
        'primary_customer_id' => (int)$sourceWorkOrder['customer_id'],
        'primary_shipping_order_id' => null,
        'received_total_quantity' => $sourceQuantity,
        'received_total_weight_kg' => $sourceWeightKg,
    ];
}

function createRescreenBatchFromReturnOrder(PDO $pdo, int $returnOrderId, array $payload, ?array $currentEmployee): array
{
    $sourceProfile = fetchReturnOrderSourceProfile($pdo, $returnOrderId);
    if ($sourceProfile === null) {
        throw new RuntimeException('找不到指定的退貨單。');
    }

    $existingStmt = $pdo->prepare("
        SELECT id, rescreen_batch_number
        FROM rescreen_batches
        WHERE source_return_order_id = :source_return_order_id
          AND deleted_at IS NULL
        LIMIT 1
    ");
    $existingStmt->execute(['source_return_order_id' => $returnOrderId]);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        throw new RuntimeException('此退貨單已建立二次篩選案件：' . (string)$existing['rescreen_batch_number']);
    }

    $payload['source_return_order_id'] = $returnOrderId;
    if (empty($payload['second_screening_reason']) && empty($payload['request_reason_code'])) {
        $payload['second_screening_reason'] = defaultSecondScreeningReasonText(null, 'relaxed_rescreen');
    }
    if (empty($payload['rescreen_type'])) {
        $payload['rescreen_type'] = 'relaxed_rescreen';
    }

    return createSecondScreeningBatchFromSourceProfile($pdo, $sourceProfile, $payload, $currentEmployee);
}

function createRescreenBatchFromWorkOrder(PDO $pdo, int $workOrderId, array $payload, ?array $currentEmployee): array
{
    $sourceProfile = fetchWorkOrderSecondScreeningSourceProfile($pdo, $workOrderId);
    if ($sourceProfile === null) {
        throw new RuntimeException('找不到指定的來源工單。');
    }

    $rescreenType = isset($payload['rescreen_type']) ? trim((string)$payload['rescreen_type']) : 'strict_rescreen';
    if ($rescreenType === '') {
        $rescreenType = 'strict_rescreen';
    }
    $secondScreeningReason = normalizeSecondScreeningReason(
        isset($payload['second_screening_reason']) ? (string)$payload['second_screening_reason'] : defaultSecondScreeningReasonText(null, $rescreenType),
        isset($payload['request_reason_code']) ? (string)$payload['request_reason_code'] : null,
        $rescreenType
    );
    $sourceDefectHistoryRecordId = filter_var(
        $payload['source_defect_history_record_id'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1]]
    );
    if ($rescreenType === 'relaxed_rescreen' && $sourceDefectHistoryRecordId === false) {
        throw new InvalidArgumentException('從不良紀錄建立放寬後二次篩選時，必須帶入來源不良紀錄。');
    }

    $existingSql = "
        SELECT id, rescreen_batch_number
        FROM rescreen_batches
        WHERE source_work_order_id = :source_work_order_id
          AND rescreen_type = :rescreen_type
          AND deleted_at IS NULL
    ";
    $existingParams = [
        'source_work_order_id' => $workOrderId,
        'rescreen_type' => $rescreenType,
    ];
    if ($sourceDefectHistoryRecordId !== false) {
        $existingSql .= " AND source_defect_history_record_id = :source_defect_history_record_id";
        $existingParams['source_defect_history_record_id'] = (int)$sourceDefectHistoryRecordId;
    }
    $existingSql .= " LIMIT 1";

    $existingStmt = $pdo->prepare($existingSql);
    $existingStmt->execute($existingParams);
    $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        throw new RuntimeException('此工單已建立二次篩選案件：' . (string)$existing['rescreen_batch_number']);
    }

    $payload['source_work_order_id'] = $workOrderId;
    $payload['second_screening_reason'] = $secondScreeningReason;
    if (empty($payload['rescreen_type'])) {
        $payload['rescreen_type'] = $rescreenType;
    }

    return createSecondScreeningBatchFromSourceProfile($pdo, $sourceProfile, $payload, $currentEmployee);
}

function createSecondScreeningBatchFromSourceProfile(PDO $pdo, array $sourceProfile, array $payload, ?array $currentEmployee): array
{
    $validation = validateRescreenBatchPayload($payload, false);
    if ($validation['errors'] !== []) {
        throw new InvalidArgumentException(implode(' ', array_values($validation['errors'])));
    }
    $data = $validation['data'];

    $returnOrder = $sourceProfile['return_order'] ?? null;
    $sourceWorkOrder = $sourceProfile['source_work_order'] ?? null;
    $sourceReturnOrderId = isset($data['source_return_order_id']) ? (int)$data['source_return_order_id'] : null;
    $sourceWorkOrderId = isset($sourceProfile['primary_work_order_id']) ? (int)$sourceProfile['primary_work_order_id'] : null;
    $customerId = $returnOrder !== null
        ? (int)$returnOrder['customer_id']
        : (int)($sourceProfile['primary_customer_id'] ?? 0);
    if ($customerId <= 0) {
        throw new RuntimeException('來源資料缺少客戶資訊，無法建立二次篩選案件。');
    }

    $status = (string)($data['status'] ?? 'draft');
    $rescreenType = (string)($data['rescreen_type'] ?? 'strict_rescreen');
    $secondScreeningReason = normalizeSecondScreeningReason(
        $data['second_screening_reason'] ?? null,
        $data['request_reason_code'] ?? null,
        $rescreenType
    );
    $employeeId = isset($currentEmployee['id']) ? (int)$currentEmployee['id'] : null;

    $batchNumber = generateRescreenBatchNumber($pdo);
    $insertBatchStmt = $pdo->prepare("
        INSERT INTO rescreen_batches (
            rescreen_batch_number,
            source_return_order_id,
            source_shipping_order_id,
            customer_id,
            source_order_id,
            source_order_item_id,
            source_work_order_id,
            rescreen_type,
            request_reason_code,
            second_screening_reason,
            customer_approval_reference,
            source_requirement_id,
            source_defect_history_record_id,
            result_category,
            status,
            rescreen_round,
            source_item_count,
            source_work_order_count,
            received_total_quantity,
            received_total_weight_kg,
            notes,
            created_by_employee_id,
            started_at,
            completed_at
        ) VALUES (
            :rescreen_batch_number,
            :source_return_order_id,
            :source_shipping_order_id,
            :customer_id,
            :source_order_id,
            :source_order_item_id,
            :source_work_order_id,
            :rescreen_type,
            :request_reason_code,
            :second_screening_reason,
            :customer_approval_reference,
            :source_requirement_id,
            :source_defect_history_record_id,
            :result_category,
            :status,
            1,
            :source_item_count,
            :source_work_order_count,
            :received_total_quantity,
            :received_total_weight_kg,
            :notes,
            :created_by_employee_id,
            :started_at,
            :completed_at
        )
    ");
    $insertBatchStmt->execute([
        'rescreen_batch_number' => $batchNumber,
        'source_return_order_id' => $sourceReturnOrderId,
        'source_shipping_order_id' => $returnOrder['original_shipping_order_id'] ?? ($sourceProfile['primary_shipping_order_id'] ?? null),
        'customer_id' => $customerId,
        'source_order_id' => $sourceProfile['primary_order_id'] ?: null,
        'source_order_item_id' => $sourceProfile['primary_order_item_id'] ?: null,
        'source_work_order_id' => $sourceWorkOrderId ?: null,
        'rescreen_type' => $rescreenType,
        'request_reason_code' => $data['request_reason_code'] ?? legacyRequestReasonCodeFromRescreenType($rescreenType),
        'second_screening_reason' => $secondScreeningReason,
        'customer_approval_reference' => $data['customer_approval_reference'] ?? null,
        'source_requirement_id' => $data['source_requirement_id'] ?? null,
        'source_defect_history_record_id' => $data['source_defect_history_record_id'] ?? null,
        'result_category' => $data['result_category'] ?? null,
        'status' => $status,
        'source_item_count' => count($sourceProfile['items']),
        'source_work_order_count' => count($sourceProfile['source_work_order_ids']),
        'received_total_quantity' => $sourceProfile['received_total_quantity'],
        'received_total_weight_kg' => $sourceProfile['received_total_weight_kg'],
        'notes' => $data['notes'] ?? null,
        'created_by_employee_id' => $employeeId,
        'started_at' => $data['started_at'] ?? null,
        'completed_at' => $data['completed_at'] ?? null,
    ]);

    $batchId = (int)$pdo->lastInsertId();

    $insertItemStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_items (
            rescreen_batch_id,
            return_order_item_id,
            shipping_order_item_id,
            source_shipping_order_id,
            source_inventory_item_id,
            source_order_id,
            source_order_item_id,
            source_work_order_id,
            returned_quantity,
            returned_unit,
            estimated_weight_kg,
            source_notes
        ) VALUES (
            :rescreen_batch_id,
            :return_order_item_id,
            :shipping_order_item_id,
            :source_shipping_order_id,
            :source_inventory_item_id,
            :source_order_id,
            :source_order_item_id,
            :source_work_order_id,
            :returned_quantity,
            :returned_unit,
            :estimated_weight_kg,
            :source_notes
        )
    ");

    foreach ($sourceProfile['items'] as $item) {
        $insertItemStmt->execute([
            'rescreen_batch_id' => $batchId,
            'return_order_item_id' => !empty($item['return_order_item_id']) ? (int)$item['return_order_item_id'] : null,
            'shipping_order_item_id' => isset($item['shipping_order_item_id']) ? (int)$item['shipping_order_item_id'] : null,
            'source_shipping_order_id' => isset($item['shipping_order_id']) ? (int)$item['shipping_order_id'] : null,
            'source_inventory_item_id' => isset($item['inventory_item_id']) ? (int)$item['inventory_item_id'] : null,
            'source_order_id' => isset($item['order_id']) ? (int)$item['order_id'] : null,
            'source_order_item_id' => isset($item['order_item_id']) ? (int)$item['order_item_id'] : null,
            'source_work_order_id' => isset($item['source_work_order_id']) ? (int)$item['source_work_order_id'] : null,
            'returned_quantity' => round((float)($item['returned_quantity'] ?? 0), 2),
            'returned_unit' => $item['returned_unit'] ?: ($item['shipped_unit'] ?: null),
            'estimated_weight_kg' => round((float)($item['estimated_weight_kg'] ?? 0), 3),
            'source_notes' => $item['reason'] ?: ($item['source_notes'] ?? null),
        ]);
    }

    seedRescreenBatchRulesFromOrderItem($pdo, $batchId, (int)($sourceProfile['primary_order_item_id'] ?? 0));
    seedRescreenBatchDefectRowsFromRules($pdo, $batchId, (int)($sourceProfile['primary_work_order_id'] ?? 0));

    $currentEmployeeId = isset($currentEmployee['id']) ? (int)$currentEmployee['id'] : null;
    if (isset($payload['defects']) && is_array($payload['defects'])) {
        $defectValidation = validateRescreenDefectPayload($payload['defects']);
        if ($defectValidation['errors'] !== []) {
            throw new InvalidArgumentException(implode(' ', array_values($defectValidation['errors'])));
        }
        saveRescreenBatchDefectRows($pdo, $batchId, $defectValidation['data'], $currentEmployeeId);
    }
    if (isset($payload['production_records']) && is_array($payload['production_records'])) {
        $recordValidation = validateRescreenProductionRecordPayload($payload['production_records']);
        if ($recordValidation['errors'] !== []) {
            throw new InvalidArgumentException(implode(' ', array_values($recordValidation['errors'])));
        }
        saveRescreenBatchProductionRecords($pdo, $batchId, (int)($sourceProfile['primary_work_order_id'] ?? 0), $recordValidation['data'], $currentEmployeeId);
    }
    refreshRescreenBatchExecutionSummary($pdo, $batchId);

    return getRescreenBatchDetails($pdo, $batchId) ?? [];
}

function seedRescreenBatchDefectRowsFromRules(PDO $pdo, int $batchId, int $sourceWorkOrderId = 0): void
{
    if ($batchId <= 0) {
        return;
    }

    $existingStmt = $pdo->prepare("
        SELECT COUNT(*)
        FROM rescreen_batch_defects
        WHERE rescreen_batch_id = :rescreen_batch_id
    ");
    $existingStmt->execute(['rescreen_batch_id' => $batchId]);
    if ((int)$existingStmt->fetchColumn() > 0) {
        return;
    }

    $itemStmt = $pdo->prepare("
        SELECT id, return_order_item_id
        FROM rescreen_batch_items
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY id ASC
        LIMIT 1
    ");
    $itemStmt->execute(['rescreen_batch_id' => $batchId]);
    $firstItem = $itemStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $rulesStmt = $pdo->prepare("
        SELECT screening_service_id, service_name
        FROM rescreen_batch_rules
        WHERE rescreen_batch_id = :rescreen_batch_id
          AND rule_stage = 'rescreen'
        ORDER BY id ASC
    ");
    $rulesStmt->execute(['rescreen_batch_id' => $batchId]);
    $rows = $rulesStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($rows === []) {
        return;
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_defects (
            rescreen_batch_id,
            rescreen_batch_item_id,
            screening_service_id,
            service_name,
            defect_quantity,
            defect_weight_kg,
            defect_units,
            source_return_order_item_id,
            source_defect_history_record_id,
            rescreen_round,
            notes,
            disposition,
            recorded_at,
            recorded_by_employee_id
        ) VALUES (
            :rescreen_batch_id,
            :rescreen_batch_item_id,
            :screening_service_id,
            :service_name,
            0,
            0,
            0,
            :source_return_order_item_id,
            NULL,
            1,
            NULL,
            NULL,
            NOW(),
            NULL
        )
    ");

    foreach ($rows as $row) {
        $insertStmt->execute([
            'rescreen_batch_id' => $batchId,
            'rescreen_batch_item_id' => !empty($firstItem['id']) ? (int)$firstItem['id'] : null,
            'screening_service_id' => !empty($row['screening_service_id']) ? (int)$row['screening_service_id'] : null,
            'service_name' => trim((string)($row['service_name'] ?? '')) ?: '未命名服務',
            'source_return_order_item_id' => !empty($firstItem['return_order_item_id']) ? (int)$firstItem['return_order_item_id'] : null,
        ]);
    }
}

/**
 * @param array<int,array<string,mixed>> $rows
 */
function saveRescreenBatchDefectRows(PDO $pdo, int $batchId, array $rows, ?int $employeeId): float
{
    $batchItemStmt = $pdo->prepare("
        SELECT id, return_order_item_id
        FROM rescreen_batch_items
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY id ASC
        LIMIT 1
    ");
    $batchItemStmt->execute(['rescreen_batch_id' => $batchId]);
    $firstItem = $batchItemStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $pdo->prepare('DELETE FROM rescreen_batch_defects WHERE rescreen_batch_id = :rescreen_batch_id')
        ->execute(['rescreen_batch_id' => $batchId]);

    if ($rows === []) {
        return 0.0;
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_defects (
            rescreen_batch_id,
            rescreen_batch_item_id,
            screening_service_id,
            service_name,
            defect_quantity,
            defect_weight_kg,
            defect_units,
            source_return_order_item_id,
            source_defect_history_record_id,
            rescreen_round,
            notes,
            disposition,
            recorded_at,
            recorded_by_employee_id
        ) VALUES (
            :rescreen_batch_id,
            :rescreen_batch_item_id,
            :screening_service_id,
            :service_name,
            :defect_quantity,
            :defect_weight_kg,
            :defect_units,
            :source_return_order_item_id,
            :source_defect_history_record_id,
            1,
            :notes,
            :disposition,
            :recorded_at,
            :recorded_by_employee_id
        )
    ");

    $totalDefectQuantity = 0.0;
    foreach ($rows as $row) {
        $insertStmt->execute([
            'rescreen_batch_id' => $batchId,
            'rescreen_batch_item_id' => !empty($firstItem['id']) ? (int)$firstItem['id'] : null,
            'screening_service_id' => $row['screening_service_id'],
            'service_name' => $row['service_name'],
            'defect_quantity' => $row['defect_quantity'],
            'defect_weight_kg' => $row['defect_weight_kg'],
            'defect_units' => $row['defect_units'],
            'source_return_order_item_id' => !empty($firstItem['return_order_item_id']) ? (int)$firstItem['return_order_item_id'] : null,
            'source_defect_history_record_id' => $row['source_defect_history_record_id'],
            'notes' => $row['notes'],
            'disposition' => $row['disposition'],
            'recorded_at' => $row['recorded_at'],
            'recorded_by_employee_id' => $employeeId,
        ]);
        $totalDefectQuantity += (float)$row['defect_quantity'];
    }

    return round($totalDefectQuantity, 2);
}

/**
 * @param array<int,array<string,mixed>> $rows
 */
function saveRescreenBatchProductionRecords(PDO $pdo, int $batchId, int $sourceWorkOrderId, array $rows, ?int $employeeId): void
{
    $pdo->prepare('DELETE FROM rescreen_batch_production_records WHERE rescreen_batch_id = :rescreen_batch_id')
        ->execute(['rescreen_batch_id' => $batchId]);

    if ($rows === []) {
        return;
    }

    $machineStmt = $pdo->prepare('SELECT name FROM machines WHERE id = :id LIMIT 1');
    $insertStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_production_records (
            rescreen_batch_id,
            source_work_order_id,
            production_source_mode,
            card_number,
            weight_kg,
            production_date,
            production_time,
            machine_id,
            machine_type,
            tool_name,
            tool_weight_kg,
            employee_id,
            notes,
            sort_order
        ) VALUES (
            :rescreen_batch_id,
            :source_work_order_id,
            :production_source_mode,
            :card_number,
            :weight_kg,
            :production_date,
            :production_time,
            :machine_id,
            :machine_type,
            :tool_name,
            :tool_weight_kg,
            :employee_id,
            :notes,
            :sort_order
        )
    ");

    foreach ($rows as $row) {
        $machineType = $row['machine_type'];
        if (!empty($row['machine_id'])) {
            $machineStmt->execute(['id' => (int)$row['machine_id']]);
            $machineType = $machineStmt->fetchColumn() ?: $machineType;
        }
        $insertStmt->execute([
            'rescreen_batch_id' => $batchId,
            'source_work_order_id' => $sourceWorkOrderId > 0 ? $sourceWorkOrderId : null,
            'production_source_mode' => $row['production_source_mode'],
            'card_number' => $row['card_number'],
            'weight_kg' => $row['weight_kg'],
            'production_date' => $row['production_date'],
            'production_time' => $row['production_time'],
            'machine_id' => $row['machine_id'],
            'machine_type' => $machineType,
            'tool_name' => $row['tool_name'],
            'tool_weight_kg' => $row['tool_weight_kg'],
            'employee_id' => $employeeId,
            'notes' => $row['notes'],
            'sort_order' => $row['sort_order'],
        ]);
    }
}

function buildRescreenBatchExecutionTimestamp(?string $productionDate, ?string $productionTime): ?string
{
    $date = trim((string)$productionDate);
    if ($date === '') {
        return null;
    }
    $time = trim((string)$productionTime);
    if ($time === '') {
        $time = '00:00:00';
    } elseif (strlen($time) === 5) {
        $time .= ':00';
    }

    return "{$date} {$time}";
}

function resolveRescreenBatchDefectUnitsValue(array $row, float $unitWeightG): float
{
    $defectUnits = round((float)($row['defect_units'] ?? 0), 2);
    if ($defectUnits > 0.0001) {
        return $defectUnits;
    }

    $defectQuantity = round((float)($row['defect_quantity'] ?? 0), 2);
    if ($defectQuantity > 0.0001) {
        return $defectQuantity;
    }

    $defectWeightKg = round((float)($row['defect_weight_kg'] ?? 0), 3);
    if ($defectWeightKg > 0.0001 && $unitWeightG > 0.0001) {
        return round(($defectWeightKg * 1000) / $unitWeightG, 2);
    }

    return 0.0;
}

function refreshRescreenBatchExecutionSummary(PDO $pdo, int $batchId): void
{
    if ($batchId <= 0) {
        return;
    }

    $batchStmt = $pdo->prepare("
        SELECT
            rb.id,
            rb.status,
            rb.started_at,
            rb.completed_at,
            rb.received_total_quantity,
            rb.source_work_order_id,
            wo.weight_per_unit_g
        FROM rescreen_batches rb
        LEFT JOIN work_orders wo ON wo.id = rb.source_work_order_id
        WHERE rb.id = :id
          AND rb.deleted_at IS NULL
        LIMIT 1
    ");
    $batchStmt->execute(['id' => $batchId]);
    $batch = $batchStmt->fetch(PDO::FETCH_ASSOC);
    if (!$batch) {
        return;
    }

    $unitWeightG = round((float)($batch['weight_per_unit_g'] ?? 0), 3);

    $defectStmt = $pdo->prepare("
        SELECT defect_quantity, defect_weight_kg, defect_units, disposition, recorded_at
        FROM rescreen_batch_defects
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY id ASC
    ");
    $defectStmt->execute(['rescreen_batch_id' => $batchId]);
    $defectRows = $defectStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $productionStmt = $pdo->prepare("
        SELECT weight_kg, tool_weight_kg, production_date, production_time
        FROM rescreen_batch_production_records
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY sort_order ASC, id ASC
    ");
    $productionStmt->execute(['rescreen_batch_id' => $batchId]);
    $productionRows = $productionStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $defectUnits = 0.0;
    $scrapUnits = 0.0;
    $timestamps = [];

    foreach ($defectRows as $row) {
        $rowUnits = resolveRescreenBatchDefectUnitsValue($row, $unitWeightG);
        if ($rowUnits <= 0.0001) {
            continue;
        }
        $disposition = trim((string)($row['disposition'] ?? ''));
        if ($disposition === 'scrap') {
            $scrapUnits += $rowUnits;
        } else {
            $defectUnits += $rowUnits;
        }
        $recordedAt = trim((string)($row['recorded_at'] ?? ''));
        if ($recordedAt !== '') {
            $timestamps[] = $recordedAt;
        }
    }

    $processedGrossWeightKg = 0.0;
    $processedToolWeightKg = 0.0;
    foreach ($productionRows as $row) {
        $processedGrossWeightKg += max(0, (float)($row['weight_kg'] ?? 0));
        $processedToolWeightKg += max(0, (float)($row['tool_weight_kg'] ?? 0));
        $executionTimestamp = buildRescreenBatchExecutionTimestamp(
            isset($row['production_date']) ? (string)$row['production_date'] : null,
            isset($row['production_time']) ? (string)$row['production_time'] : null
        );
        if ($executionTimestamp !== null) {
            $timestamps[] = $executionTimestamp;
        }
    }

    $processedNetWeightKg = max(0, $processedGrossWeightKg - $processedToolWeightKg);
    $processedUnits = $unitWeightG > 0.0001
        ? round(($processedNetWeightKg * 1000) / $unitWeightG, 2)
        : 0.0;

    $goodUnits = 0.0;
    if ($processedUnits > 0.0001) {
        $goodUnits = max(0, $processedUnits - $defectUnits - $scrapUnits);
    } elseif (trim((string)($batch['status'] ?? '')) === 'completed') {
        $goodUnits = max(0, round((float)($batch['received_total_quantity'] ?? 0), 2) - $defectUnits - $scrapUnits);
    }

    sort($timestamps);
    $existingStartedAt = trim((string)($batch['started_at'] ?? ''));
    $existingCompletedAt = trim((string)($batch['completed_at'] ?? ''));
    $startedAt = $existingStartedAt !== '' ? $existingStartedAt : ($timestamps[0] ?? null);
    $completedAt = $existingCompletedAt !== '' ? $existingCompletedAt : null;
    if (trim((string)($batch['status'] ?? '')) === 'completed') {
        $completedAt = $existingCompletedAt !== '' ? $existingCompletedAt : (!empty($timestamps) ? end($timestamps) : $startedAt);
    }

    $resultCategory = determineRescreenResultCategory(
        round($goodUnits, 2),
        round($defectUnits, 2),
        round($scrapUnits, 2),
        (string)($batch['status'] ?? 'draft')
    );

    $updateStmt = $pdo->prepare("
        UPDATE rescreen_batches
        SET
            started_at = :started_at,
            completed_at = :completed_at,
            rescreen_output_good_units = :rescreen_output_good_units,
            rescreen_output_defect_units = :rescreen_output_defect_units,
            rescreen_output_scrap_units = :rescreen_output_scrap_units,
            result_category = :result_category
        WHERE id = :id
    ");
    $updateStmt->execute([
        'started_at' => $startedAt,
        'completed_at' => $completedAt,
        'rescreen_output_good_units' => round($goodUnits, 2),
        'rescreen_output_defect_units' => round($defectUnits, 2),
        'rescreen_output_scrap_units' => round($scrapUnits, 2),
        'result_category' => $resultCategory,
        'id' => $batchId,
    ]);
}

function seedRescreenBatchRulesFromOrderItem(PDO $pdo, int $batchId, int $orderItemId): void
{
    if ($orderItemId <= 0) {
        return;
    }

    $stmt = $pdo->prepare("
        SELECT
            oisd.screening_service_id,
            COALESCE(ss.name, oisd.service_name, '') AS service_name,
            oisd.tolerance_plus_value,
            oisd.tolerance_plus_over,
            oisd.tolerance_minus_value,
            oisd.tolerance_minus_over,
            oisd.ppm_standard,
            oisd.notes
        FROM order_item_screening_details oisd
        LEFT JOIN screening_services ss ON ss.id = oisd.screening_service_id
        WHERE oisd.order_item_id = :order_item_id
        ORDER BY oisd.id ASC
    ");
    $stmt->execute(['order_item_id' => $orderItemId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($rows === []) {
        return;
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_rules (
            rescreen_batch_id,
            rule_stage,
            screening_service_id,
            service_name,
            is_enabled,
            tolerance_plus_value,
            tolerance_plus_over,
            tolerance_minus_value,
            tolerance_minus_over,
            ppm_standard,
            notes
        ) VALUES (
            :rescreen_batch_id,
            :rule_stage,
            :screening_service_id,
            :service_name,
            :is_enabled,
            :tolerance_plus_value,
            :tolerance_plus_over,
            :tolerance_minus_value,
            :tolerance_minus_over,
            :ppm_standard,
            :notes
        )
    ");

    foreach ($rows as $row) {
        foreach (['original', 'rescreen'] as $stage) {
            $insertStmt->execute([
                'rescreen_batch_id' => $batchId,
                'rule_stage' => $stage,
                'screening_service_id' => isset($row['screening_service_id']) ? (int)$row['screening_service_id'] : null,
                'service_name' => trim((string)($row['service_name'] ?? '')) ?: '未命名服務',
                'is_enabled' => 1,
                'tolerance_plus_value' => $row['tolerance_plus_value'] !== null ? (float)$row['tolerance_plus_value'] : null,
                'tolerance_plus_over' => $row['tolerance_plus_over'] ?: null,
                'tolerance_minus_value' => $row['tolerance_minus_value'] !== null ? (float)$row['tolerance_minus_value'] : null,
                'tolerance_minus_over' => $row['tolerance_minus_over'] ?: null,
                'ppm_standard' => $row['ppm_standard'] !== null ? (float)$row['ppm_standard'] : null,
                'notes' => $row['notes'] ?: null,
            ]);
        }
    }
}

function maybeCreateRescreenExecutionWorkOrder(PDO $pdo, int $batchId, array $sourceProfile, ?array $currentEmployee): int
{
    $orderItemIds = array_values(array_filter(array_map('intval', $sourceProfile['source_order_item_ids'] ?? [])));
    if (count($orderItemIds) !== 1) {
        return 0;
    }

    $orderItemId = $orderItemIds[0];
    $existingStmt = $pdo->prepare("
        SELECT id
        FROM work_orders
        WHERE order_item_id = :order_item_id
          AND source_rescreen_batch_id = :source_rescreen_batch_id
          AND deleted_at IS NULL
        LIMIT 1
    ");
    $existingStmt->execute([
        'order_item_id' => $orderItemId,
        'source_rescreen_batch_id' => $batchId,
    ]);
    $existingId = (int)($existingStmt->fetchColumn() ?: 0);
    if ($existingId > 0) {
        return $existingId;
    }

    $orderItemDetails = fetchOrderItemDetailsForWorkOrder($pdo, $orderItemId);
    if (!$orderItemDetails) {
        return 0;
    }

    $pendingStatusStmt = $pdo->prepare("
        SELECT id
        FROM lookup_values
        WHERE domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'status_work_order' LIMIT 1)
          AND value_key = 'pending'
        LIMIT 1
    ");
    $pendingStatusStmt->execute();
    $pendingStatusId = (int)($pendingStatusStmt->fetchColumn() ?: 0);

    $weightPerUnitG = round((float)($orderItemDetails['weight_per_unit_g'] ?? 0), 3);
    $totalWeightKg = round((float)($sourceProfile['received_total_weight_kg'] ?? 0), 2);
    $totalUnits = $weightPerUnitG > 0
        ? round(((float)($sourceProfile['received_total_quantity'] ?? 0)), 2)
        : round((float)($sourceProfile['received_total_quantity'] ?? 0), 2);

    $insertStmt = $pdo->prepare("
        INSERT INTO work_orders (
            work_order_number,
            work_order_type,
            order_item_id,
            source_rescreen_batch_id,
            quantity_to_produce,
            total_weight_kg,
            weight_per_unit_g,
            total_units,
            tool_statistics,
            customer_instructions,
            other_notes,
            status,
            status_lookup_id
        ) VALUES (
            :work_order_number,
            'rescreen',
            :order_item_id,
            :source_rescreen_batch_id,
            :quantity_to_produce,
            :total_weight_kg,
            :weight_per_unit_g,
            :total_units,
            :tool_statistics,
            :customer_instructions,
            :other_notes,
            :status,
            :status_lookup_id
        )
    ");
    $insertStmt->execute([
        'work_order_number' => generateWorkOrderNumber($pdo),
        'order_item_id' => $orderItemId,
        'source_rescreen_batch_id' => $batchId,
        'quantity_to_produce' => round((float)($sourceProfile['received_total_quantity'] ?? 0), 2),
        'total_weight_kg' => $totalWeightKg,
        'weight_per_unit_g' => $weightPerUnitG > 0 ? $weightPerUnitG : (float)($orderItemDetails['weight_per_unit_g'] ?? 0),
        'total_units' => $totalUnits,
        'tool_statistics' => '二次篩選批',
        'customer_instructions' => null,
        'other_notes' => '系統自動建立之二次篩選執行工單；來源案件 #' . $batchId,
        'status' => 'pending',
        'status_lookup_id' => $pendingStatusId > 0 ? $pendingStatusId : null,
    ]);

    $workOrderId = (int)$pdo->lastInsertId();

    logAuditAction('Create rescreen execution work order', 'work_orders', $workOrderId, [
        'source_rescreen_batch_id' => $batchId,
        'order_item_id' => $orderItemId,
        'source_return_order_id' => (int)($sourceProfile['return_order']['id'] ?? 0),
        'created_by' => isset($currentEmployee['id']) ? (int)$currentEmployee['id'] : null,
    ]);

    return $workOrderId;
}

function findRescreenBatchContextByWorkOrder(PDO $pdo, int $workOrderId): ?array
{
    if ($workOrderId <= 0) {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT
            wo.id AS work_order_id,
            wo.work_order_type,
            wo.order_item_id,
            wo.source_rescreen_batch_id,
            wo.actual_start_date,
            wo.completed_at,
            wo.shortage_units,
            wo.weight_per_unit_g,
            lv.value_key AS status_key,
            rb.id AS rescreen_batch_id,
            rb.source_return_order_id,
            rb.rescreen_round,
            rb.status AS batch_status,
            rb.started_at AS batch_started_at,
            rb.completed_at AS batch_completed_at
        FROM work_orders wo
        LEFT JOIN lookup_values lv ON lv.id = wo.status_lookup_id
        LEFT JOIN rescreen_batches rb
            ON rb.id = NULLIF(wo.source_rescreen_batch_id, 0)
           AND rb.deleted_at IS NULL
        WHERE wo.id = :work_order_id
          AND wo.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['work_order_id' => $workOrderId]);
    $context = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$context || (int)($context['rescreen_batch_id'] ?? 0) <= 0) {
        return null;
    }

    return $context;
}

function fetchRescreenBatchItemsForSync(PDO $pdo, int $batchId): array
{
    if ($batchId <= 0) {
        return [];
    }

    $stmt = $pdo->prepare("
        SELECT
            id,
            return_order_item_id,
            shipping_order_item_id,
            source_shipping_order_id,
            source_order_id,
            source_order_item_id,
            source_work_order_id,
            source_notes
        FROM rescreen_batch_items
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY id ASC
    ");
    $stmt->execute(['rescreen_batch_id' => $batchId]);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

function resolveRescreenBatchStatusFromWorkOrder(array $context): string
{
    $statusKey = strtolower(trim((string)($context['status_key'] ?? '')));
    if (!empty($context['completed_at']) || $statusKey === 'completed') {
        return 'completed';
    }

    if ($statusKey === 'cancelled') {
        return 'cancelled';
    }

    if (!empty($context['actual_start_date']) || in_array($statusKey, ['in_progress', 'paused'], true)) {
        return 'in_progress';
    }

    return 'planned';
}

function determineRescreenResultCategory(float $goodUnits, float $defectUnits, float $scrapUnits, string $status): ?string
{
    if ($status !== 'completed') {
        return null;
    }

    $hasGood = $goodUnits > 0.0001;
    $hasDefect = $defectUnits > 0.0001;
    $hasScrap = $scrapUnits > 0.0001;

    if ($hasGood && !$hasDefect && !$hasScrap) {
        return 'good_only';
    }
    if (!$hasGood && $hasDefect && !$hasScrap) {
        return 'defect_only';
    }
    if (!$hasGood && !$hasDefect && $hasScrap) {
        return 'scrap_only';
    }
    if ($hasGood && $hasDefect && !$hasScrap) {
        return 'good_and_defect';
    }
    if ($hasGood && !$hasDefect && $hasScrap) {
        return 'good_and_scrap';
    }
    if (!$hasGood && $hasDefect && $hasScrap) {
        return 'defect_and_scrap';
    }
    if ($hasGood || $hasDefect || $hasScrap) {
        return 'mixed';
    }

    return 'no_output';
}

function syncRescreenInventoryItemSources(PDO $pdo, array $context, array $batchItems): void
{
    $workOrderId = (int)($context['work_order_id'] ?? 0);
    $batchId = (int)($context['rescreen_batch_id'] ?? 0);
    if ($workOrderId <= 0 || $batchId <= 0) {
        return;
    }

    $deleteStmt = $pdo->prepare("
        DELETE iis
        FROM inventory_item_sources iis
        INNER JOIN inventory_items ii ON ii.id = iis.inventory_item_id
        WHERE ii.work_order_id = :work_order_id
    ");
    $deleteStmt->execute(['work_order_id' => $workOrderId]);

    if ($batchItems === []) {
        return;
    }

    $inventoryStmt = $pdo->prepare("
        SELECT id
        FROM inventory_items
        WHERE work_order_id = :work_order_id
          AND deleted_at IS NULL
        ORDER BY id ASC
    ");
    $inventoryStmt->execute(['work_order_id' => $workOrderId]);
    $inventoryIds = array_map('intval', $inventoryStmt->fetchAll(PDO::FETCH_COLUMN) ?: []);
    if ($inventoryIds === []) {
        return;
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO inventory_item_sources (
            inventory_item_id,
            source_type,
            source_id,
            source_order_id,
            source_order_item_id,
            source_work_order_id,
            source_shipping_order_id,
            source_shipping_order_item_id,
            source_return_order_id,
            source_return_order_item_id,
            source_rescreen_batch_id,
            source_rescreen_batch_item_id,
            source_defect_history_record_id,
            notes
        ) VALUES (
            :inventory_item_id,
            'rescreen_batch_item',
            :source_id,
            :source_order_id,
            :source_order_item_id,
            :source_work_order_id,
            :source_shipping_order_id,
            :source_shipping_order_item_id,
            :source_return_order_id,
            :source_return_order_item_id,
            :source_rescreen_batch_id,
            :source_rescreen_batch_item_id,
            NULL,
            :notes
        )
    ");

    foreach ($inventoryIds as $inventoryItemId) {
        foreach ($batchItems as $batchItem) {
            $batchItemId = (int)($batchItem['id'] ?? 0);
            if ($batchItemId <= 0) {
                continue;
            }

            $insertStmt->execute([
                'inventory_item_id' => $inventoryItemId,
                'source_id' => $batchItemId,
                'source_order_id' => !empty($batchItem['source_order_id']) ? (int)$batchItem['source_order_id'] : null,
                'source_order_item_id' => !empty($batchItem['source_order_item_id']) ? (int)$batchItem['source_order_item_id'] : null,
                'source_work_order_id' => !empty($batchItem['source_work_order_id']) ? (int)$batchItem['source_work_order_id'] : null,
                'source_shipping_order_id' => !empty($batchItem['source_shipping_order_id']) ? (int)$batchItem['source_shipping_order_id'] : null,
                'source_shipping_order_item_id' => !empty($batchItem['shipping_order_item_id']) ? (int)$batchItem['shipping_order_item_id'] : null,
                'source_return_order_id' => !empty($context['source_return_order_id']) ? (int)$context['source_return_order_id'] : null,
                'source_return_order_item_id' => !empty($batchItem['return_order_item_id']) ? (int)$batchItem['return_order_item_id'] : null,
                'source_rescreen_batch_id' => $batchId,
                'source_rescreen_batch_item_id' => $batchItemId,
                'notes' => trim((string)($batchItem['source_notes'] ?? '')) ?: null,
            ]);
        }
    }
}

function resolveRescreenDefectBatchItem(array $batchItems, int $orderItemId): ?array
{
    if (count($batchItems) === 1) {
        return $batchItems[0];
    }

    $matches = [];
    foreach ($batchItems as $batchItem) {
        if ((int)($batchItem['source_order_item_id'] ?? 0) === $orderItemId) {
            $matches[] = $batchItem;
        }
    }

    return count($matches) === 1 ? $matches[0] : null;
}

function syncRescreenBatchDefects(PDO $pdo, array $context, array $batchItems): float
{
    $batchId = (int)($context['rescreen_batch_id'] ?? 0);
    $workOrderId = (int)($context['work_order_id'] ?? 0);
    if ($batchId <= 0 || $workOrderId <= 0) {
        return 0.0;
    }

    $deleteStmt = $pdo->prepare("
        DELETE FROM rescreen_batch_defects
        WHERE rescreen_batch_id = :rescreen_batch_id
    ");
    $deleteStmt->execute(['rescreen_batch_id' => $batchId]);

    $screeningStmt = $pdo->prepare("
        SELECT
            wosd.id,
            wosd.screening_service_id,
            COALESCE(NULLIF(wosd.service_name, ''), ss.name, CONCAT('服務#', wosd.screening_service_id)) AS service_name,
            CAST(wosd.defect_quantity AS DECIMAL(14,2)) AS defect_quantity,
            wosd.notes
        FROM work_order_screening_defects wosd
        LEFT JOIN screening_services ss ON ss.id = wosd.screening_service_id
        WHERE wosd.work_order_id = :work_order_id
        ORDER BY wosd.id ASC
    ");
    $screeningStmt->execute(['work_order_id' => $workOrderId]);
    $screeningRows = $screeningStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    if ($screeningRows === []) {
        return 0.0;
    }

    $batchItem = resolveRescreenDefectBatchItem($batchItems, (int)($context['order_item_id'] ?? 0));
    $weightPerUnitG = round((float)($context['weight_per_unit_g'] ?? 0), 3);
    $rescreenRound = max(1, (int)($context['rescreen_round'] ?? 1));
    $insertStmt = $pdo->prepare("
        INSERT INTO rescreen_batch_defects (
            rescreen_batch_id,
            rescreen_batch_item_id,
            screening_service_id,
            service_name,
            defect_quantity,
            defect_weight_kg,
            defect_units,
            source_return_order_item_id,
            source_defect_history_record_id,
            rescreen_round,
            notes
        ) VALUES (
            :rescreen_batch_id,
            :rescreen_batch_item_id,
            :screening_service_id,
            :service_name,
            :defect_quantity,
            :defect_weight_kg,
            :defect_units,
            :source_return_order_item_id,
            :source_defect_history_record_id,
            :rescreen_round,
            :notes
        )
    ");

    $totalDefectUnits = 0.0;
    foreach ($screeningRows as $screeningRow) {
        $defectUnits = round((float)($screeningRow['defect_quantity'] ?? 0), 2);
        if ($defectUnits <= 0) {
            continue;
        }

        $defectWeightKg = $weightPerUnitG > 0
            ? round(($defectUnits * $weightPerUnitG) / 1000, 3)
            : 0.0;
        $totalDefectUnits += $defectUnits;

        $insertStmt->execute([
            'rescreen_batch_id' => $batchId,
            'rescreen_batch_item_id' => $batchItem ? (int)($batchItem['id'] ?? 0) : null,
            'screening_service_id' => !empty($screeningRow['screening_service_id']) ? (int)$screeningRow['screening_service_id'] : null,
            'service_name' => trim((string)($screeningRow['service_name'] ?? '')) ?: '未命名服務',
            'defect_quantity' => $defectUnits,
            'defect_weight_kg' => $defectWeightKg,
            'defect_units' => $defectUnits,
            'source_return_order_item_id' => $batchItem && !empty($batchItem['return_order_item_id']) ? (int)$batchItem['return_order_item_id'] : null,
            'source_defect_history_record_id' => (int)($screeningRow['id'] ?? 0),
            'rescreen_round' => $rescreenRound,
            'notes' => trim((string)($screeningRow['notes'] ?? '')) ?: null,
        ]);
    }

    return round($totalDefectUnits, 2);
}

function syncRescreenBatchFromWorkOrder(PDO $pdo, int $workOrderId): void
{
    $context = findRescreenBatchContextByWorkOrder($pdo, $workOrderId);
    if ($context === null) {
        return;
    }

    $batchId = (int)($context['rescreen_batch_id'] ?? 0);
    $batchItems = fetchRescreenBatchItemsForSync($pdo, $batchId);

    syncRescreenInventoryItemSources($pdo, $context, $batchItems);
    $defectUnits = syncRescreenBatchDefects($pdo, $context, $batchItems);

    $inventorySummaryStmt = $pdo->prepare("
        SELECT
            COALESCE(SUM(total_good_units), 0) AS total_good_units
        FROM inventory_items
        WHERE work_order_id = :work_order_id
          AND deleted_at IS NULL
    ");
    $inventorySummaryStmt->execute(['work_order_id' => $workOrderId]);
    $inventorySummary = $inventorySummaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

    $goodUnits = round((float)($inventorySummary['total_good_units'] ?? 0), 2);
    $scrapUnits = round(max((float)($context['shortage_units'] ?? 0), 0), 2);
    $status = resolveRescreenBatchStatusFromWorkOrder($context);
    $startedAt = $status === 'planned'
        ? null
        : ($context['actual_start_date'] ?: $context['batch_started_at'] ?: date('Y-m-d H:i:s'));
    $completedAt = $status === 'completed'
        ? ($context['completed_at'] ?: $context['batch_completed_at'] ?: date('Y-m-d H:i:s'))
        : null;
    $resultCategory = determineRescreenResultCategory($goodUnits, $defectUnits, $scrapUnits, $status);

    $updateStmt = $pdo->prepare("
        UPDATE rescreen_batches
        SET
            status = :status,
            started_at = :started_at,
            completed_at = :completed_at,
            rescreen_output_good_units = :rescreen_output_good_units,
            rescreen_output_defect_units = :rescreen_output_defect_units,
            rescreen_output_scrap_units = :rescreen_output_scrap_units,
            result_category = :result_category
        WHERE id = :id
    ");
    $updateStmt->execute([
        'status' => $status,
        'started_at' => $startedAt,
        'completed_at' => $completedAt,
        'rescreen_output_good_units' => $goodUnits,
        'rescreen_output_defect_units' => $defectUnits,
        'rescreen_output_scrap_units' => $scrapUnits,
        'result_category' => $resultCategory,
        'id' => $batchId,
    ]);
}

function getRescreenBatchDetails(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("
        SELECT
            rb.*,
            c.name AS customer_name,
            ro.return_order_number,
            ro.return_date,
            ro.processing_status AS return_processing_status,
            so.shipping_order_number,
            o.order_number,
            oi.customer_batch_number,
            oi.part_number,
            si.name AS screening_item_name,
            source_wo.work_order_number AS source_work_order_number,
            exec_wo.work_order_number AS rescreen_work_order_number,
            exec_wo.actual_start_date AS rescreen_work_order_started_at,
            exec_wo.actual_end_date AS rescreen_work_order_ended_at,
            exec_wo.completed_at AS rescreen_work_order_completed_at,
            exec_assigned.name AS rescreen_assigned_employee_name,
            exec_calibration.name AS rescreen_calibration_employee_name
        FROM rescreen_batches rb
        LEFT JOIN customers c ON c.id = rb.customer_id
        LEFT JOIN return_orders ro ON ro.id = rb.source_return_order_id
        LEFT JOIN shipping_orders so ON so.id = rb.source_shipping_order_id
        LEFT JOIN orders o ON o.id = rb.source_order_id
        LEFT JOIN order_items oi ON oi.id = rb.source_order_item_id
        LEFT JOIN screening_items si ON si.id = oi.screening_item_id
        LEFT JOIN work_orders source_wo ON source_wo.id = rb.source_work_order_id
        LEFT JOIN work_orders exec_wo ON exec_wo.id = rb.rescreen_work_order_id
        LEFT JOIN employees exec_assigned ON exec_assigned.id = exec_wo.assigned_employee_id
        LEFT JOIN employees exec_calibration ON exec_calibration.id = exec_wo.calibration_employee_id
        WHERE rb.id = :id
          AND rb.deleted_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['id' => $id]);
    $batch = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$batch) {
        return null;
    }

    $itemsStmt = $pdo->prepare("
        SELECT
            rbi.*,
            roi.reason AS return_reason,
            roi.returned_quantity AS return_order_quantity,
            soi.shipped_quantity,
            soi.shipped_unit,
            oi.customer_batch_number,
            oi.part_number,
            oi.sub_item_number,
            si.name AS screening_item_name,
            inv.inventory_number,
            source_wo.work_order_number AS source_work_order_number
        FROM rescreen_batch_items rbi
        LEFT JOIN return_order_items roi ON roi.id = rbi.return_order_item_id
        LEFT JOIN shipping_order_items soi ON soi.id = rbi.shipping_order_item_id
        LEFT JOIN order_items oi ON oi.id = rbi.source_order_item_id
        LEFT JOIN screening_items si ON si.id = oi.screening_item_id
        LEFT JOIN inventory_items inv ON inv.id = rbi.source_inventory_item_id
        LEFT JOIN work_orders source_wo ON source_wo.id = rbi.source_work_order_id
        WHERE rbi.rescreen_batch_id = :rescreen_batch_id
        ORDER BY rbi.id ASC
    ");
    $itemsStmt->execute(['rescreen_batch_id' => $id]);
    $batch['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $rulesStmt = $pdo->prepare("
        SELECT *
        FROM rescreen_batch_rules
        WHERE rescreen_batch_id = :rescreen_batch_id
        ORDER BY rule_stage ASC, id ASC
    ");
    $rulesStmt->execute(['rescreen_batch_id' => $id]);
    $ruleRows = $rulesStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $batch['rules'] = [
        'original' => [],
        'rescreen' => [],
    ];
    foreach ($ruleRows as $ruleRow) {
        $stage = (string)($ruleRow['rule_stage'] ?? 'original');
        if (!isset($batch['rules'][$stage])) {
            $batch['rules'][$stage] = [];
        }
        $batch['rules'][$stage][] = $ruleRow;
    }

    $defectsStmt = $pdo->prepare("
        SELECT
            rbd.*,
            rbd.recorded_at AS defect_recorded_at,
            defect_employee.name AS defect_recorded_by_name
        FROM rescreen_batch_defects rbd
        LEFT JOIN employees defect_employee ON defect_employee.id = rbd.recorded_by_employee_id
        WHERE rbd.rescreen_batch_id = :rescreen_batch_id
        ORDER BY rbd.id ASC
    ");
    $defectsStmt->execute(['rescreen_batch_id' => $id]);
    $batch['defects'] = $defectsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    $productionStmt = $pdo->prepare("
        SELECT
            rbpr.*,
            m.name AS machine_name,
            e.name AS employee_name
        FROM rescreen_batch_production_records rbpr
        LEFT JOIN machines m ON m.id = rbpr.machine_id
        LEFT JOIN employees e ON e.id = rbpr.employee_id
        WHERE rbpr.rescreen_batch_id = :rescreen_batch_id
        ORDER BY rbpr.sort_order ASC, rbpr.id ASC
    ");
    $productionStmt->execute(['rescreen_batch_id' => $id]);
    $batch['production_records'] = $productionStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    return $batch;
}

function listRescreenBatches(PDO $pdo, array $filters): array
{
    $page = max(1, (int)($filters['page'] ?? 1));
    $perPage = min(100, max(1, (int)($filters['perPage'] ?? 20)));
    $offset = ($page - 1) * $perPage;

    $sortFieldMap = [
        'id' => 'rb.id',
        'rescreen_batch_number' => 'rb.rescreen_batch_number',
        'customer_name' => 'c.name',
        'return_date' => 'ro.return_date',
        'status' => 'rb.status',
        'created_at' => 'rb.created_at',
    ];

    $sortField = $sortFieldMap[$filters['sortField'] ?? 'id'] ?? 'rb.id';
    $sortDirection = strtoupper((string)($filters['sortDirection'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

    $where = ['rb.deleted_at IS NULL'];
    $params = [];

    $keyword = trim((string)($filters['keyword'] ?? ''));
    if ($keyword !== '') {
        $where[] = "(rb.rescreen_batch_number LIKE :keyword
            OR ro.return_order_number LIKE :keyword
            OR so.shipping_order_number LIKE :keyword
            OR source_wo.work_order_number LIKE :keyword
            OR exec_wo.work_order_number LIKE :keyword
            OR c.name LIKE :keyword)";
        $params['keyword'] = '%' . $keyword . '%';
    }

    $customerId = filter_var($filters['customer_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($customerId !== false) {
        $where[] = 'rb.customer_id = :customer_id';
        $params['customer_id'] = (int)$customerId;
    }

    $status = trim((string)($filters['status'] ?? ''));
    if ($status !== '') {
        $where[] = 'rb.status = :status';
        $params['status'] = $status;
    }

    $rescreenType = trim((string)($filters['rescreen_type'] ?? ''));
    if ($rescreenType !== '') {
        $where[] = 'rb.rescreen_type = :rescreen_type';
        $params['rescreen_type'] = $rescreenType;
    }

    $secondScreeningReason = trim((string)($filters['second_screening_reason'] ?? ''));
    if ($secondScreeningReason !== '') {
        $where[] = 'rb.second_screening_reason LIKE :second_screening_reason';
        $params['second_screening_reason'] = '%' . $secondScreeningReason . '%';
    }

    $sourceReturnOrderId = filter_var($filters['source_return_order_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($sourceReturnOrderId !== false) {
        $where[] = 'rb.source_return_order_id = :source_return_order_id';
        $params['source_return_order_id'] = (int)$sourceReturnOrderId;
    }

    $sourceWorkOrderId = filter_var($filters['source_work_order_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($sourceWorkOrderId !== false) {
        $where[] = 'rb.source_work_order_id = :source_work_order_id';
        $params['source_work_order_id'] = (int)$sourceWorkOrderId;
    }

    $whereSql = implode(' AND ', $where);

    $baseFrom = "
        FROM rescreen_batches rb
        LEFT JOIN customers c ON c.id = rb.customer_id
        LEFT JOIN return_orders ro ON ro.id = rb.source_return_order_id
        LEFT JOIN shipping_orders so ON so.id = rb.source_shipping_order_id
        LEFT JOIN work_orders source_wo ON source_wo.id = rb.source_work_order_id
        LEFT JOIN work_orders exec_wo ON exec_wo.id = rb.rescreen_work_order_id
        WHERE {$whereSql}
    ";

    $countStmt = $pdo->prepare("SELECT COUNT(*) {$baseFrom}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT
            rb.id,
            rb.rescreen_batch_number,
            rb.rescreen_type,
            rb.second_screening_reason,
            rb.customer_approval_reference,
            rb.source_requirement_id,
            rb.source_defect_history_record_id,
            rb.status,
            rb.source_item_count,
            rb.received_total_quantity,
            rb.received_total_weight_kg,
            rb.created_at,
            c.name AS customer_name,
            ro.return_order_number,
            ro.return_date,
            so.shipping_order_number,
            source_wo.work_order_number AS source_work_order_number,
            exec_wo.work_order_number AS rescreen_work_order_number
        {$baseFrom}
        ORDER BY {$sortField} {$sortDirection}
        LIMIT :limit OFFSET :offset
    ");
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    return [
        'data' => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [],
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / $perPage),
        ],
    ];
}
