<?php
/**
 * 工單首件尺寸 API - 共用輔助函式
 *
 * 提供工單首件尺寸模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module work_order_first_piece_dimensions
 * @table work_order_first_piece_dimensions
 *
 * @functions
 * - getFirstPieceDimensionFields(): 取得可更新欄位清單
 * - readFirstPieceDimensionPayload(): 讀取請求資料
 * - validateFirstPieceDimensionData(): 驗證並正規化輸入資料
 * - transformFirstPieceDimension(): 轉換 API 回應格式
 * - findFirstPieceDimension(): 查詢單筆記錄（含關聯資料）
 * - firstPieceDimensionExists(): 檢查記錄是否存在
 * - validateWorkOrderExists(): 驗證工單是否存在
 * - handleFirstPieceDimensionWriteException(): 統一處理 PDO 寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 取得可更新欄位清單
 *
 * @param bool $includeWorkOrderId 是否包含 work_order_id（新增時需要）
 * @return array<string>
 */
function getFirstPieceDimensionFields(bool $includeWorkOrderId = false): array
{
    $fields = [
        'measured_at',
        'measured_by_employee_id',
        'notes',
        'head_height',
        'head_width',
        'length',
        'thread_outer_diameter',
        'washer_diameter',
        'outer_diameter',
        'hole_diameter',
        'thickness',
    ];

    if ($includeWorkOrderId) {
        array_unshift($fields, 'work_order_id');
    }

    return $fields;
}

/**
 * 讀取首件尺寸請求資料
 *
 * @return array<string,mixed>
 */
function readFirstPieceDimensionPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }
    return is_array($payload) ? $payload : [];
}

/**
 * 驗證並正規化首件尺寸輸入資料
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateFirstPieceDimensionData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 工單 ID - 新增時必填
    if (!$isUpdate && array_key_exists('work_order_id', $payload)) {
        $workOrderId = $payload['work_order_id'] ?? null;
        if ($workOrderId === null || $workOrderId === '') {
            $errors['work_order_id'] = '請選擇工單。';
        } else {
            $workOrderIdInt = filter_var($workOrderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($workOrderIdInt === false) {
                $errors['work_order_id'] = '工單 ID 必須為正整數。';
            } else {
                $data['work_order_id'] = $workOrderIdInt;
            }
        }
    }

    // 量測時間
    if (array_key_exists('measured_at', $payload)) {
        $measuredAt = $payload['measured_at'];
        if ($measuredAt !== null && $measuredAt !== '') {
            $data['measured_at'] = $measuredAt;
        } else {
            $data['measured_at'] = null;
        }
    }

    // 量測人員 ID
    if (array_key_exists('measured_by_employee_id', $payload)) {
        $employeeId = $payload['measured_by_employee_id'];
        if ($employeeId !== null && $employeeId !== '') {
            $employeeIdInt = filter_var($employeeId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($employeeIdInt === false) {
                $errors['measured_by_employee_id'] = '量測人員 ID 必須為正整數。';
            } else {
                $data['measured_by_employee_id'] = $employeeIdInt;
            }
        } else {
            $data['measured_by_employee_id'] = null;
        }
    }

    // 數值欄位驗證
    $decimalFields = [
        'head_height' => '頭高',
        'head_width' => '頭寬',
        'length' => '長度',
        'thread_outer_diameter' => '螺牙外徑',
        'washer_diameter' => '墨片徑',
        'outer_diameter' => '外徑',
        'hole_diameter' => '孔徑',
        'thickness' => '厚度',
    ];

    foreach ($decimalFields as $field => $label) {
        if (array_key_exists($field, $payload)) {
            $value = $payload[$field];
            if ($value !== null && $value !== '') {
                $floatVal = filter_var($value, FILTER_VALIDATE_FLOAT);
                if ($floatVal === false) {
                    $errors[$field] = "{$label}必須為數值。";
                } else {
                    $data[$field] = $floatVal;
                }
            } else {
                $data[$field] = null;
            }
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
 * 轉換首件尺寸資料為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫記錄
 * @return array<string,mixed>
 */
function transformFirstPieceDimension(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'work_order_id' => (int)$row['work_order_id'],
        'work_order_number' => $row['work_order_number'] ?? null,
        'work_order_status' => $row['work_order_status'] ?? null,
        'customer_batch_number' => $row['customer_batch_number'] ?? null,
        'customer_name' => $row['customer_name'] ?? null,
        'screening_item_name' => $row['screening_item_name'] ?? null,
        'measured_at' => $row['measured_at'],
        'measured_by_employee_id' => $row['measured_by_employee_id'] ? (int)$row['measured_by_employee_id'] : null,
        'measured_by_name' => $row['measured_by_name'] ?? null,
        'head_height' => $row['head_height'] !== null ? (float)$row['head_height'] : null,
        'head_width' => $row['head_width'] !== null ? (float)$row['head_width'] : null,
        'length' => $row['length'] !== null ? (float)$row['length'] : null,
        'thread_outer_diameter' => $row['thread_outer_diameter'] !== null ? (float)$row['thread_outer_diameter'] : null,
        'washer_diameter' => $row['washer_diameter'] !== null ? (float)$row['washer_diameter'] : null,
        'outer_diameter' => $row['outer_diameter'] !== null ? (float)$row['outer_diameter'] : null,
        'hole_diameter' => $row['hole_diameter'] !== null ? (float)$row['hole_diameter'] : null,
        'thickness' => $row['thickness'] !== null ? (float)$row['thickness'] : null,
        'notes' => $row['notes'],
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

/**
 * 查詢單筆首件尺寸（含關聯資料）
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findFirstPieceDimension(PDO $pdo, int $id): ?array
{
    $sql = "
        SELECT
            fpd.*,
            wo.work_order_number,
            work_order_status.value_key AS work_order_status,
            e.name AS measured_by_name,
            oi.customer_batch_number,
            c.name AS customer_name,
            si.name AS screening_item_name
        FROM work_order_first_piece_dimensions fpd
        LEFT JOIN work_orders wo ON fpd.work_order_id = wo.id
        LEFT JOIN lookup_values work_order_status ON wo.status_lookup_id = work_order_status.id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN employees e ON fpd.measured_by_employee_id = e.id
        WHERE fpd.id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 檢查首件尺寸記錄是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function firstPieceDimensionExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_order_first_piece_dimensions WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 驗證工單是否存在
 *
 * @param PDO $pdo
 * @param int $workOrderId
 * @return bool
 */
function validateWorkOrderExists(PDO $pdo, int $workOrderId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_orders WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$workOrderId]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 統一處理 PDO 寫入例外
 *
 * @param PDOException $e
 * @return array<string,mixed>
 */
function handleFirstPieceDimensionWriteException(PDOException $e): array
{
    $code = $e->getCode();
    $message = $e->getMessage();

    error_log("FirstPieceDimension PDO Exception: [{$code}] {$message}");

    // 外鍵約束
    if ($code === '23000' && str_contains($message, 'foreign key constraint')) {
        return [
            'success' => false,
            'message' => '關聯資料不存在（工單或量測人員）。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}
