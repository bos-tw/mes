<?php
/**
 * 工單管理 - 輔助函式
 *
 * 本檔案包含工單模組的共用函式：
 *
 * ## 資料讀取與驗證
 * - readWorkOrderPayload()      讀取請求資料 (JSON/FormData)
 * - validateWorkOrderData()     驗證輸入資料
 *
 * ## 工單號碼生成
 * - generateWorkOrderNumber()   產生工單號碼 (WO-YYYYMMDD-NNNN)
 *
 * ## 驗證欄位說明
 * - order_item_id:              訂單品項 ID，新增時必填
 * - machine_id:                 機台 ID，可選
 * - assigned_employee_id:       指定員工 ID，可選
 * - calibration_employee_id:    校機人員 ID，可選
 * - scheduled_start_date:       預定開始日期 (Y-m-d\TH:i)
 * - scheduled_end_date:         預定結束日期
 * - actual_start_date:          實際開始日期
 * - actual_end_date:            實際結束日期
 * - quantity_to_produce:        生產數量，非負數
 * - screening_speed:            篩選速度
 * - customer_instructions:      客戶交辦事項
 * - other_notes:                其他說明備註
 *
 * @see /api/work_orders/index.php   列表與新增
 * @see /api/work_orders/show.php    單筆查詢
 * @see /api/work_orders/update.php  更新
 * @see /api/work_orders/delete.php  刪除
 */
declare(strict_types=1);

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readWorkOrderPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

/**
 * Check whether a submitted value should be treated as actual user-entered data.
 *
 * @param mixed $value
 */
function hasFilledWorkOrderValue($value): bool
{
    if ($value === null) {
        return false;
    }

    if (is_string($value)) {
        return trim($value) !== '';
    }

    return $value !== '';
}

/**
 * Production rows can be auto-generated as planning/card-number rows.
 * Only rows with actual production data should be persisted or block deletion.
 *
 * @param array<string,mixed> $record
 */
function isMeaningfulProductionRecord(array $record): bool
{
    foreach (['weight_kg', 'production_date', 'production_time', 'machine_id', 'notes'] as $field) {
        if (array_key_exists($field, $record) && hasFilledWorkOrderValue($record[$field])) {
            return true;
        }
    }

    return false;
}

/**
 * @param array<int,array<string,mixed>>|array<mixed> $records
 * @return array<int,array<string,mixed>>
 */
function filterMeaningfulProductionRecords(array $records): array
{
    $filtered = [];

    foreach ($records as $record) {
        if (!is_array($record)) {
            continue;
        }

        if (empty($record['card_number']) || !isMeaningfulProductionRecord($record)) {
            continue;
        }

        $filtered[] = $record;
    }

    return $filtered;
}

/**
 * Empty first-piece shells should not be saved or treated as real inspection data.
 *
 * @param array<string,mixed> $data
 */
function isMeaningfulFirstPieceDimension(array $data): bool
{
    foreach ([
        'head_height',
        'head_width',
        'length',
        'thread_outer_diameter',
        'washer_diameter',
        'outer_diameter',
        'hole_diameter',
        'thickness',
        'measured_at',
        'measured_by_employee_id',
        'notes',
    ] as $field) {
        if (array_key_exists($field, $data) && hasFilledWorkOrderValue($data[$field])) {
            return true;
        }
    }

    return false;
}

/**
 * Resolve a work order status lookup ID to its stable value key.
 */
function getWorkOrderStatusKey(PDO $pdo, ?int $statusLookupId): string
{
    if ($statusLookupId === null || $statusLookupId <= 0) {
        return '';
    }

    $stmt = $pdo->prepare('SELECT value_key FROM lookup_values WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $statusLookupId]);
    $valueKey = $stmt->fetchColumn();

    return strtolower(trim((string)($valueKey ?: '')));
}

/**
 * Check if a work order status represents the completed lifecycle state.
 */
function isCompletedWorkOrderStatus(PDO $pdo, ?int $statusLookupId, ?string $legacyStatus = null, ?string $statusLabel = null): bool
{
    return getWorkOrderStatusKey($pdo, $statusLookupId) === 'completed'
        || strtolower(trim((string)$legacyStatus)) === 'completed'
        || trim((string)$statusLabel) === '已完成';
}

/**
 * Validate and normalise work order input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateWorkOrderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 工單號碼 - 由系統自動生成
    if (array_key_exists('work_order_number', $payload)) {
        unset($payload['work_order_number']);
    }

    // 客戶批號ID - 新增時必填
    if (!$isUpdate || array_key_exists('order_item_id', $payload)) {
        $orderItemId = $payload['order_item_id'] ?? null;
        if (!$isUpdate && ($orderItemId === null || $orderItemId === '')) {
            $errors['order_item_id'] = '客戶批號為必填。';
        } elseif ($orderItemId !== null && $orderItemId !== '') {
            $orderItemIdInt = filter_var($orderItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderItemIdInt === false) {
                $errors['order_item_id'] = '客戶批號ID必須為正整數。';
            } else {
                $data['order_item_id'] = $orderItemIdInt;
            }
        }
    }

    // 機台ID - 可選
    if (array_key_exists('machine_id', $payload)) {
        $machineId = $payload['machine_id'] ?? null;
        if ($machineId === null || $machineId === '') {
            $data['machine_id'] = null;
        } else {
            $machineIdInt = filter_var($machineId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($machineIdInt === false) {
                $errors['machine_id'] = '機台ID必須為正整數。';
            } else {
                $data['machine_id'] = $machineIdInt;
            }
        }
    }

    // 指定員工ID - 可選
    if (array_key_exists('assigned_employee_id', $payload)) {
        $assignedEmployeeId = $payload['assigned_employee_id'] ?? null;
        if ($assignedEmployeeId === null || $assignedEmployeeId === '') {
            $data['assigned_employee_id'] = null;
        } else {
            $assignedEmployeeIdInt = filter_var($assignedEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($assignedEmployeeIdInt === false) {
                $errors['assigned_employee_id'] = '指定員工ID必須為正整數。';
            } else {
                $data['assigned_employee_id'] = $assignedEmployeeIdInt;
            }
        }
    }

    // 校機人員ID - 可選
    if (array_key_exists('calibration_employee_id', $payload)) {
        $calibrationEmployeeId = $payload['calibration_employee_id'] ?? null;
        if ($calibrationEmployeeId === null || $calibrationEmployeeId === '') {
            $data['calibration_employee_id'] = null;
        } else {
            $calibrationEmployeeIdInt = filter_var($calibrationEmployeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($calibrationEmployeeIdInt === false) {
                $errors['calibration_employee_id'] = '校機人員ID必須為正整數。';
            } else {
                $data['calibration_employee_id'] = $calibrationEmployeeIdInt;
            }
        }
    }

    // 日期時間欄位處理
    $dateTimeFields = [
        'scheduled_start_date' => '預定開始日期',
        'scheduled_end_date' => '預定結束日期',
        'actual_start_date' => '實際開始日期',
        'actual_end_date' => '實際結束日期'
    ];

    foreach ($dateTimeFields as $field => $label) {
        if (array_key_exists($field, $payload)) {
            $value = trim((string)($payload[$field] ?? ''));
            if ($value === '') {
                $data[$field] = null;
            } else {
                $date = DateTime::createFromFormat('Y-m-d\TH:i', $value);
                if (!$date) {
                    $errors[$field] = "{$label}格式不正確。";
                } else {
                    $data[$field] = $date->format('Y-m-d H:i:s');
                }
            }
        }
    }

    // 生產數量 - 可選
    if (array_key_exists('quantity_to_produce', $payload)) {
        $quantity = $payload['quantity_to_produce'];
        if ($quantity === null || $quantity === '') {
            $data['quantity_to_produce'] = null;
        } else {
            $quantityFloat = filter_var($quantity, FILTER_VALIDATE_FLOAT);
            if ($quantityFloat === false || $quantityFloat < 0) {
                $errors['quantity_to_produce'] = '生產數量必須為非負數。';
            } else {
                $data['quantity_to_produce'] = $quantityFloat;
            }
        }
    }

    // 篩選速度 - 可選
    if (array_key_exists('screening_speed', $payload)) {
        $screeningSpeed = trim((string)($payload['screening_speed'] ?? ''));
        $data['screening_speed'] = $screeningSpeed === '' ? null : mb_substr($screeningSpeed, 0, 50);
    }

    // 客戶交辦事項 - 可選
    if (array_key_exists('customer_instructions', $payload)) {
        $customerInstructions = trim((string)($payload['customer_instructions'] ?? ''));
        $data['customer_instructions'] = $customerInstructions === '' ? null : $customerInstructions;
    }

    // 其他說明備註 - 可選
    if (array_key_exists('other_notes', $payload)) {
        $otherNotes = trim((string)($payload['other_notes'] ?? ''));
        $data['other_notes'] = $otherNotes === '' ? null : $otherNotes;
    }

    // 狀態 - 可選
    if (array_key_exists('status', $payload)) {
        $status = trim((string)($payload['status'] ?? ''));
        $data['status'] = $status === '' ? null : mb_substr($status, 0, 50);
    }

    // 狀態 Lookup ID - 可選
    if (array_key_exists('status_lookup_id', $payload)) {
        $statusLookupId = $payload['status_lookup_id'] ?? null;
        if ($statusLookupId === null || $statusLookupId === '') {
            $data['status_lookup_id'] = null;
        } else {
            $statusLookupIdInt = filter_var($statusLookupId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($statusLookupIdInt === false) {
                $errors['status_lookup_id'] = '狀態ID必須為正整數。';
            } else {
                $data['status_lookup_id'] = $statusLookupIdInt;
            }
        }
    }

    // 首件尺寸檢驗資料處理
    $fpFields = [
        'fp_head_height' => 'head_height',
        'fp_head_width' => 'head_width',
        'fp_length' => 'length',
        'fp_thread_outer_diameter' => 'thread_outer_diameter',
        'fp_washer_diameter' => 'washer_diameter',
        'fp_outer_diameter' => 'outer_diameter',
        'fp_hole_diameter' => 'hole_diameter',
        'fp_thickness' => 'thickness'
    ];

    $firstPieceData = [];
    $hasFpData = false;

    foreach ($fpFields as $key => $dbColumn) {
        if (array_key_exists($key, $payload)) {
            $hasFpData = true;
            $val = $payload[$key];
            if ($val === null || $val === '') {
                $firstPieceData[$dbColumn] = null;
            } else {
                $floatVal = filter_var($val, FILTER_VALIDATE_FLOAT);
                if ($floatVal === false) {
                    $errors[$key] = "數值格式不正確。";
                } else {
                    $firstPieceData[$dbColumn] = $floatVal;
                }
            }
        }
    }

    if (array_key_exists('fp_measured_at', $payload)) {
        $hasFpData = true;
        $val = $payload['fp_measured_at'];
        if ($val === null || $val === '') {
            $firstPieceData['measured_at'] = null;
        } else {
            $date = DateTime::createFromFormat('Y-m-d\TH:i', $val);
            if (!$date) {
                $date = DateTime::createFromFormat('Y-m-d H:i:s', $val);
            }

            if ($date) {
                $firstPieceData['measured_at'] = $date->format('Y-m-d H:i:s');
            } else {
                // 如果格式不正確但有值，視為無效或忽略
                $firstPieceData['measured_at'] = null;
            }
        }
    }

    if (array_key_exists('fp_measured_by_employee_id', $payload)) {
        $hasFpData = true;
        $val = $payload['fp_measured_by_employee_id'];
        if ($val === null || $val === '') {
            $firstPieceData['measured_by_employee_id'] = null;
        } else {
            $intVal = filter_var($val, FILTER_VALIDATE_INT);
            if ($intVal === false) {
                $errors['fp_measured_by_employee_id'] = "測量人員ID必須為整數。";
            } else {
                $firstPieceData['measured_by_employee_id'] = $intVal;
            }
        }
    }

    if (array_key_exists('fp_notes', $payload)) {
        $hasFpData = true;
        $notes = trim((string)($payload['fp_notes'] ?? ''));
        $firstPieceData['notes'] = $notes === '' ? null : mb_substr($notes, 0, 255);
    }

    if ($hasFpData && isMeaningfulFirstPieceDimension($firstPieceData)) {
        $data['first_piece_dimensions'] = $firstPieceData;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Generate a unique work order number.
 *
 * @param PDO $pdo
 * @return string
 */
function generateWorkOrderNumber(PDO $pdo): string
{
    $date = date('Ymd');
    $prefix = "WO-{$date}-";

    $stmt = $pdo->prepare("
        SELECT work_order_number
        FROM work_orders
        WHERE work_order_number LIKE :prefix
        ORDER BY work_order_number DESC
        LIMIT 1
    ");
    $stmt->execute(['prefix' => $prefix . '%']);
    $lastNumber = $stmt->fetchColumn();

    if ($lastNumber) {
        $sequence = (int)substr($lastNumber, -4);
        $newSequence = $sequence + 1;
    } else {
        $newSequence = 1;
    }

    return $prefix . str_pad((string)$newSequence, 4, '0', STR_PAD_LEFT);
}

/**
 * Fetch order item details for work order creation.
 *
 * @param PDO $pdo
 * @param int $orderItemId
 * @return array<string,mixed>|null
 */
function fetchOrderItemDetailsForWorkOrder(PDO $pdo, int $orderItemId): ?array
{
    $sql = "
        SELECT
            oi.id,
            oi.order_id,
            oi.screening_item_id,
            oi.customer_batch_number,
            oi.sub_item_number,
            oi.part_number,
            oi.drawing_number,
            oi.total_weight_kg,
            oi.total_units,
            oi.unit_price_per_thousand,
            oi.status AS order_item_status,
            oi.customer_sample_status,
            oi.delivery_location,
            oi.notes AS order_item_notes,
            lv_status.value_label AS order_item_status_label,
            lv.value_label AS customer_sample_status_label,
            o.order_number,
            o.customer_id,
            o.customer_po_number,
            o.expected_delivery_date,
            c.name AS customer_name,
            si.name AS screening_item_name,
            si.weight_per_unit_g
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN customers c ON o.customer_id = c.id
        JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN lookup_values lv ON oi.customer_sample_status = lv.value_key AND lv.domain_id = 19
        LEFT JOIN lookup_values lv_status ON oi.status = lv_status.value_key
            AND lv_status.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = 'status_work_order')
        WHERE oi.id = :order_item_id AND o.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['order_item_id' => $orderItemId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$result) {
        return null;
    }

    // Fetch tools statistics (載具類型統計 + 總重量)
    try {
        $toolsStmt = $pdo->prepare("
            SELECT
                t.name AS tool_name,
                t.type AS tool_type,
                oit.quantity,
                oit.total_weight
            FROM order_item_tools oit
            JOIN tools t ON oit.tool_id = t.id
            WHERE oit.order_item_id = :order_item_id
            ORDER BY t.name
        ");
        $toolsStmt->execute(['order_item_id' => $orderItemId]);
        $tools = $toolsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 格式化成 "船 1個、桶 2個" 的形式,使用頓號分隔更清晰
        $toolStatistics = [];
        $totalContainerQuantity = 0;
        $totalToolWeight = 0.0;
        foreach ($tools as $tool) {
            $quantity = (int)$tool['quantity'];
            $toolStatistics[] = $tool['tool_name'] . ' ' . $quantity . '個';
            $totalContainerQuantity += $quantity;
            $totalToolWeight += (float)$tool['total_weight'];
        }
        $result['tool_statistics'] = implode('、', $toolStatistics);
        $result['tool_quantity'] = $totalContainerQuantity; // 總載具數量(桶數/船數總和)
        $result['total_tool_weight'] = round($totalToolWeight, 2); // 載具總重量 (kg)
    } catch (Exception $e) {
        error_log('Fetch tools statistics error: ' . $e->getMessage());
        $result['tool_statistics'] = '';
        $result['tool_quantity'] = 0;
        $result['total_tool_weight'] = 0.0;
        $totalToolWeight = 0.0;
    }

    // 即時計算 total_units，確保使用最新的 weight_per_unit_g 和 tool_weight
    $totalWeight = isset($result['total_weight_kg']) ? (float)$result['total_weight_kg'] : 0.0;
    $weightPerUnitG = isset($result['weight_per_unit_g']) ? (float)$result['weight_per_unit_g'] : 0.0;
    $netWeight = $totalWeight - $totalToolWeight;
    if ($netWeight < 0) {
        $netWeight = 0.0;
    }

    // 計算總支數：淨重(kg) * 1000 / 單支重(g)
    $calculatedTotalUnits = 0.0;
    if ($weightPerUnitG > 0 && $netWeight > 0) {
        $calculatedTotalUnits = ($netWeight * 1000) / $weightPerUnitG;
    }
    $result['total_units'] = round($calculatedTotalUnits, 2);
    $result['net_weight'] = round($netWeight, 4); // 也提供淨重供前端使用

    // Fetch screening services details (篩分服務明細)
    try {
        $servicesStmt = $pdo->prepare("
            SELECT
                ss.name AS screening_service_name,
                oisd.service_name AS custom_service_name,
                oisd.actual_price_per_unit,
                oisd.tolerance_plus_value,
                oisd.tolerance_plus_over,
                oisd.tolerance_minus_value,
                oisd.tolerance_minus_over,
                oisd.ppm_standard,
                oisd.notes
            FROM order_item_screening_details oisd
            JOIN screening_services ss ON oisd.screening_service_id = ss.id
            WHERE oisd.order_item_id = :order_item_id
            ORDER BY oisd.id
        ");
        $servicesStmt->execute(['order_item_id' => $orderItemId]);
        $result['screening_services_details'] = $servicesStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        error_log('Fetch screening services details error: ' . $e->getMessage());
        $result['screening_services_details'] = [];
    }

    // Fetch drawing number from order_item_drawings if OrderItems.drawing_number is empty
    // 如果 OrderItems.drawing_number 為空，則從 OrderItemDrawings 表中取得圖面編號
    if (empty($result['drawing_number'])) {
        try {
            $drawingStmt = $pdo->prepare("
                SELECT drawing_number
                FROM order_item_drawings
                WHERE order_item_id = :order_item_id
                ORDER BY id DESC
                LIMIT 1
            ");
            $drawingStmt->execute(['order_item_id' => $orderItemId]);
            $drawing = $drawingStmt->fetch(PDO::FETCH_ASSOC);

            if ($drawing && !empty($drawing['drawing_number'])) {
                $result['drawing_number'] = $drawing['drawing_number'];
            }
        } catch (Exception $e) {
            error_log('Fetch drawing number from order_item_drawings error: ' . $e->getMessage());
        }
    }

    return $result;
}

// ===============================
// HTTP Request Handler
// ===============================

// 如果是直接呼叫此檔案 (GET 請求取得客戶批號詳細資料)
if (basename($_SERVER['PHP_SELF']) === 'helpers.php' && strcasecmp($_SERVER['REQUEST_METHOD'] ?? '', 'GET') === 0) {
    require_once __DIR__ . '/../bootstrap.php';
    requireAuth();

    $action = $_GET['action'] ?? '';

    if ($action === 'get_order_item_details') {
        $orderItemId = $_GET['order_item_id'] ?? null;

        if (!$orderItemId) {
            jsonResponse([
                'success' => false,
                'message' => '缺少客戶批號ID參數。'
            ], 400);
        }

        $orderItemIdInt = filter_var($orderItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($orderItemIdInt === false) {
            jsonResponse([
                'success' => false,
                'message' => '客戶批號ID格式錯誤。'
            ], 400);
        }

        try {
            $pdo = db();
            $details = fetchOrderItemDetailsForWorkOrder($pdo, $orderItemIdInt);

            if ($details === null) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的客戶批號。'
                ], 404);
            }

            jsonResponse([
                'success' => true,
                'data' => $details
            ]);

        } catch (Exception $e) {
            error_log('Fetch order item details error: ' . $e->getMessage());
            jsonResponse([
                'success' => false,
                'message' => '載入客戶批號詳細資料失敗：' . $e->getMessage()
            ], 500);
        }
    } else {
        jsonResponse([
            'success' => false,
            'message' => '不支援的操作。'
        ], 400);
    }
}

