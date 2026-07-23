<?php
/**
 * 訂單管理 - 輔助函式
 *
 * 本檔案包含訂單管理模組的共用函式：
 * - readOrderPayload()              讀取請求資料
 * - validateOrderData()             驗證並正規化訂單輸入資料
 * - findOrder()                     查詢單筆訂單（含關聯資料）
 * - orderExists()                   檢查訂單是否存在
 * - orderNumberExists()             檢查訂單號碼是否重複
 * - customerExists()                檢查客戶是否存在
 * - findCustomerScreeningItemHistory() 查詢同客戶歷史受篩產品
 * - transformOrder()                轉換訂單資料為 API 回應格式
 * - generateOrderNumber()           產生訂單號碼
 * - handleOrderPdoWriteException()  統一處理 PDO 寫入例外
 *
 * @see /api/orders/index.php   列表與新增
 * @see /api/orders/show.php    單筆查詢
 * @see /api/orders/update.php  更新
 * @see /api/orders/delete.php  刪除
 */
declare(strict_types=1);

require_once __DIR__ . '/../number_sequences/helpers.php';
require_once __DIR__ . '/../lookup_values/helpers.php';

function getOrderStatusLookupId(PDO $pdo, string $status): int
{
    $lookupId = getLookupValueId($pdo, 'status_order', $status);
    if ($lookupId === null) {
        throw new RuntimeException('找不到對應的訂單狀態設定。');
    }

    return $lookupId;
}

/**
 * 讀取訂單請求資料
 *
 * 支援 JSON (Content-Type: application/json) 和 FormData 兩種格式。
 * 優先讀取 JSON，若無 JSON 內容則讀取 $_POST。
 *
 * @return array<string,mixed> 請求資料，可能的欄位包含：
 *   - customer_id: int              客戶 ID
 *   - order_date: string            訂單日期 (YYYY-MM-DD)
 *   - expected_delivery_date: string 預訂交期 (YYYY-MM-DD)
 *   - expected_delivery_period: string 預訂交期時段 (morning/noon/afternoon/evening)
 *   - customer_po_number: string    客戶訂單號
 *   - status: string                訂單狀態
 *   - total_amount: float           訂單總金額
 *   - final_quote_per_m: float      最終報價（元/M）
 *   - single_ppm: int               單一 PPM
 *   - notes: string                 備註
 *   - _method: string               HTTP 方法覆蓋
 */
function readOrderPayload(): array
{
    return readRequestPayload();
}

function normalizeOrderNullableString(mixed $value): string
{
    $text = trim((string)($value ?? ''));
    return strtolower($text) === 'null' ? '' : $text;
}

/**
 * 驗證並正規化訂單輸入資料
 *
 * 執行以下驗證：
 * - customer_id:              正整數，新增時必填
 * - order_date:               YYYY-MM-DD 格式，新增時必填
 * - expected_delivery_date:   YYYY-MM-DD 格式，可選
 * - expected_delivery_period: morning/noon/afternoon/evening，可選
 * - customer_po_number:       字串最長 100 字，可選
 * - status:                   狀態代碼最長 50 字，可選
 * - total_amount:             非負浮點數，可選（通常由系統計算）
 * - final_quote_per_m:        非負浮點數，可選（元/M）
 * - single_ppm:               非負整數，可選
 * - notes:                    備註文字，可選
 *
 * @param array<string,mixed> $payload  請求資料
 * @param bool $isUpdate 是否為更新模式
 *   - false (新增): customer_id 和 order_date 為必填
 *   - true (更新): 只驗證有提供的欄位，至少需有一個欄位
 *
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 *   - data:   驗證通過的正規化資料
 *   - errors: 欄位名稱 => 錯誤訊息 的關聯陣列
 *
 * @example 驗證結果範例
 * [
 *   'data' => ['customer_id' => 1, 'order_date' => '2025-01-15'],
 *   'errors' => []
 * ]
 */
function validateOrderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 訂單號碼 - 由系統自動生成，不需要從前端輸入
    // 如果前端傳入訂單號碼，則忽略該欄位
    if (array_key_exists('order_number', $payload)) {
        // 忽略前端傳入的訂單號碼，因為會由系統自動生成
        unset($payload['order_number']);
    }

    // 客戶ID - 新增時必填
    if (!$isUpdate || array_key_exists('customer_id', $payload)) {
        $customerId = $payload['customer_id'] ?? null;
        if (!$isUpdate && ($customerId === null || $customerId === '')) {
            $errors['customer_id'] = '客戶為必填。';
        } elseif ($customerId !== null && $customerId !== '') {
            $customerIdInt = filter_var($customerId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($customerIdInt === false) {
                $errors['customer_id'] = '客戶ID必須為正整數。';
            } else {
                $data['customer_id'] = $customerIdInt;
            }
        }
    }

    // 訂單日期 - 新增時必填
    if (!$isUpdate || array_key_exists('order_date', $payload)) {
        $orderDate = trim((string)($payload['order_date'] ?? ''));
        if (!$isUpdate && $orderDate === '') {
            $errors['order_date'] = '訂單日期為必填。';
        } elseif ($orderDate !== '') {
            $date = DateTime::createFromFormat('Y-m-d', $orderDate);
            if (!$date || $date->format('Y-m-d') !== $orderDate) {
                $errors['order_date'] = '訂單日期格式不正確。';
            } else {
                $data['order_date'] = $orderDate;
            }
        }
    }

    // 預訂交期 - 可選，由使用者自行維護
    if (array_key_exists('expected_delivery_date', $payload)) {
        $expectedDeliveryDate = normalizeOrderNullableString($payload['expected_delivery_date'] ?? '');
        if ($expectedDeliveryDate === '') {
            $data['expected_delivery_date'] = null;
        } else {
            $date = DateTime::createFromFormat('Y-m-d', $expectedDeliveryDate);
            if (!$date || $date->format('Y-m-d') !== $expectedDeliveryDate) {
                $errors['expected_delivery_date'] = '預訂交期格式不正確。';
            } else {
                $data['expected_delivery_date'] = $expectedDeliveryDate;
            }
        }
    }

    // 客戶訂單號 - 可選
    if (array_key_exists('customer_po_number', $payload)) {
        $customerPoNumber = normalizeOrderNullableString($payload['customer_po_number'] ?? '');
        $data['customer_po_number'] = $customerPoNumber === '' ? null : mb_substr($customerPoNumber, 0, 100);
    }

    // 訂單狀態 - 可選
    if (array_key_exists('status', $payload)) {
        $status = normalizeOrderNullableString($payload['status'] ?? '');
        $allowedStatuses = array_keys(getWorkflowTransitionDefinitions()['orders']);
        if ($status === '' && !$isUpdate) {
            // HTML select 會送出空字串；新增時依 API 契約套用預設狀態。
            $data['status'] = 'pending';
        } elseif ($status === '') {
            $errors['status'] = '訂單狀態不可為空。';
        } elseif (!in_array($status, $allowedStatuses, true)) {
            $errors['status'] = '訂單狀態不在允許清單中。';
        } else {
            $data['status'] = $status;
        }
    }

    // 訂單總金額 - 可選，通常由系統計算
    if (array_key_exists('total_amount', $payload)) {
        $totalAmount = $payload['total_amount'];
        if ($totalAmount === null || $totalAmount === '') {
            $data['total_amount'] = 0.00;
        } else {
            $amount = filter_var($totalAmount, FILTER_VALIDATE_FLOAT);
            if ($amount === false || $amount < 0) {
                $errors['total_amount'] = '訂單總金額必須為非負數。';
            } else {
                $data['total_amount'] = round($amount, 2);
            }
        }
    }

    // 最終報價(元/M) - 可選
    if (array_key_exists('final_quote_per_m', $payload)) {
        $finalQuotePerM = $payload['final_quote_per_m'];
        if ($finalQuotePerM === null || $finalQuotePerM === '') {
            $data['final_quote_per_m'] = null;
        } else {
            $quote = filter_var($finalQuotePerM, FILTER_VALIDATE_FLOAT);
            if ($quote === false || $quote < 0) {
                $errors['final_quote_per_m'] = '最終報價必須為非負數。';
            } else {
                $data['final_quote_per_m'] = round($quote, 2);
            }
        }
    }

    // 預訂交期時段 - 可選，由使用者自行維護
    if (array_key_exists('expected_delivery_period', $payload)) {
        $expectedDeliveryPeriod = normalizeOrderNullableString($payload['expected_delivery_period'] ?? '');
        if ($expectedDeliveryPeriod === '') {
            $data['expected_delivery_period'] = null;
        } else {
            $allowedPeriods = ['morning', 'noon', 'afternoon', 'evening'];
            if (!in_array($expectedDeliveryPeriod, $allowedPeriods, true)) {
                $errors['expected_delivery_period'] = '預訂交期時段格式不正確。';
            } else {
                $data['expected_delivery_period'] = $expectedDeliveryPeriod;
            }
        }
    }

    // 單一 PPM - 可選
    if (array_key_exists('single_ppm', $payload)) {
        $singlePpm = $payload['single_ppm'];
        if ($singlePpm === null || $singlePpm === '') {
            $data['single_ppm'] = null;
        } else {
            $ppm = filter_var($singlePpm, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
            if ($ppm === false) {
                $errors['single_ppm'] = '單一 PPM 必須為非負整數。';
            } else {
                $data['single_ppm'] = $ppm;
            }
        }
    }

    // 備註 - 可選
    if (array_key_exists('notes', $payload)) {
        $notes = normalizeOrderNullableString($payload['notes'] ?? '');
        $data['notes'] = $notes === '' ? null : $notes;
    }

    if ($isUpdate && $data === []) {
        $errors['general'] = '沒有任何可更新的欄位。';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆訂單記錄（含關聯資料）
 *
 * 關聯查詢：
 * - customers:      客戶名稱、客戶編號
 * - lookup_values:  狀態標籤（透過 domain_key = 'status_order'）
 *
 * @param PDO $pdo 資料庫連線實例
 * @param int $id  訂單 ID
 *
 * @return array<string,mixed>|null 訂單資料（含關聯欄位），找不到時回傳 null
 *   傳回欄位：id, order_number, customer_id, order_date, expected_delivery_date, expected_delivery_period,
 *             customer_po_number, status, total_amount, notes, created_at,
 *             updated_at, deleted_at, customer_name, customer_number, status_label
 */
function findOrder(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT o.id, o.order_number, o.customer_id, o.order_date, o.expected_delivery_date, o.expected_delivery_period, '
        . 'o.customer_po_number, o.status, o.total_amount, o.final_quote_per_m, o.single_ppm, o.notes, o.created_at, o.updated_at, o.deleted_at, '
        . 'c.name AS customer_name, c.customer_number, '
        . 'c.minimum_order_amount AS customer_minimum_order_amount, '
        . 'lv.value_label AS status_label '
        . 'FROM orders o '
        . 'LEFT JOIN customers c ON o.customer_id = c.id '
        . 'LEFT JOIN lookup_values lv ON o.status = lv.value_key AND lv.domain_id = (SELECT id FROM lookup_domains WHERE domain_key = "status_order") '
        . 'WHERE o.id = :id AND o.deleted_at IS NULL';

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * 檢查訂單是否存在且未被刪除
 *
 * 用途：更新或刪除前確認訂單存在性
 *
 * @param PDO $pdo 資料庫連線實例
 * @param int $id  訂單 ID
 *
 * @return bool true=存在且未刪除, false=不存在或已刪除
 */
function orderExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM orders WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);

    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查訂單號碼是否已存在（唯一性驗證）
 *
 * 用途：
 * - 新增訂單前檢查號碼是否重複
 * - 更新時可排除自身 ID
 *
 * @param PDO $pdo               資料庫連線實例
 * @param string $orderNumber    要檢查的訂單號碼
 * @param int|null $excludeId    排除的訂單 ID（更新時使用）
 *
 * @return bool true=已存在（重複）, false=不存在（可用）
 */
function orderNumberExists(PDO $pdo, string $orderNumber, ?int $excludeId = null): bool
{
    $sql = 'SELECT 1 FROM orders WHERE order_number = :order_number AND deleted_at IS NULL';
    $params = ['order_number' => $orderNumber];

    if ($excludeId !== null) {
        $sql .= ' AND id != :exclude_id';
        $params['exclude_id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查客戶是否存在且未被刪除
 *
 * 用途：建立訂單前確認客戶 ID 有效性
 *
 * @param PDO $pdo       資料庫連線實例
 * @param int $customerId 客戶 ID
 *
 * @return bool true=存在且未刪除, false=不存在或已刪除
 */
function customerExists(PDO $pdo, int $customerId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM customers WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $customerId]);

    return $stmt->fetchColumn() !== false;
}

/**
 * 轉換訂單資料為 API 回應格式
 *
 * 主要轉換：
 * - 數值欄位轉為正確型別 (int/float)
 * - 客戶資訊整合為 customer 物件
 * - 狀態標籤獨立欄位
 *
 * @param array<string,mixed> $row 資料庫查詢結果列
 *
 * @return array<string,mixed> API 回應格式：
 * ```json
 * {
 *   "id": 1,
 *   "order_number": "ORDER-20250115-0001",
 *   "customer": {
 *     "id": 10,
 *     "name": "測試客戶",
 *     "customer_number": "CUST-001"
 *   },
 *   "order_date": "2025-01-15",
 *   "expected_delivery_date": "2025-01-30",
 *   "expected_delivery_period": "morning",
 *   "customer_po_number": "PO-2025-001",
 *   "status": "pending",
 *   "status_label": "待處理",
 *   "total_amount": 15000.00,
 *   "notes": "急件",
 *   "created_at": "2025-01-15T10:00:00",
 *   "updated_at": "2025-01-15T10:00:00",
 *   "deleted_at": null
 * }
 * ```
 */
function transformOrder(array $row): array
{
    $totalAmount = isset($row['total_amount']) ? (float)$row['total_amount'] : 0.0;
    $finalQuotePerM = isset($row['final_quote_per_m']) && $row['final_quote_per_m'] !== null
        ? (float)$row['final_quote_per_m']
        : null;
    $singlePpm = isset($row['single_ppm']) && $row['single_ppm'] !== null
        ? (int)$row['single_ppm']
        : null;
    $customerMinimumOrderAmount = isset($row['customer_minimum_order_amount']) ? (float)$row['customer_minimum_order_amount'] : 0.0;

    return [
        'id' => (int)$row['id'],
        'order_number' => $row['order_number'],
        'customer' => [
            'id' => isset($row['customer_id']) ? (int)$row['customer_id'] : null,
            'name' => $row['customer_name'] ?? null,
            'customer_number' => $row['customer_number'] ?? null,
            'minimum_order_amount' => $customerMinimumOrderAmount,
        ],
        'order_date' => $row['order_date'],
        'expected_delivery_date' => $row['expected_delivery_date'],
        'expected_delivery_period' => normalizeOrderNullableString($row['expected_delivery_period'] ?? '') ?: null,
        'customer_po_number' => normalizeOrderNullableString($row['customer_po_number'] ?? '') ?: null,
        'status' => $row['status'],
        'status_label' => $row['status_label'] ?? null,
        'total_amount' => $totalAmount,
        'final_quote_per_m' => $finalQuotePerM,
        'single_ppm' => $singlePpm,
        'is_below_minimum_amount' => $customerMinimumOrderAmount > 0 && $totalAmount < $customerMinimumOrderAmount,
        'notes' => $row['notes'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'deleted_at' => $row['deleted_at'] ?? null,
    ];
}

/**
 * 產生下一個訂單號碼
 *
 * 格式：ORDER-YYYYMMDD-NNNN
 * - YYYYMMDD: 訂單日期
 * - NNNN: 每日序號，從 0001 開始，每日重置
 *
 * 邏輯：
 * 1. 查詢當日最大訂單號碼
 * 2. 提取序號部分並加 1
 * 3. 若當日無訂單則從 0001 開始
 *
 * @param PDO $pdo            資料庫連線實例
 * @param string|null $date   訂單日期 (YYYY-MM-DD)，預設為今日
 *
 * @return string 產生的訂單號碼，例如 "ORDER-20250115-0001"
 *
 * @throws RuntimeException 產生失敗時拋出例外
 *
 * @example
 * $orderNumber = generateOrderNumber($pdo);               // 今日日期
 * $orderNumber = generateOrderNumber($pdo, '2025-01-15'); // 指定日期
 */
function generateOrderNumber(PDO $pdo, ?string $date = null): string
{
    return generateManagedDocumentNumber($pdo, 'ORDER', $date);
}

/**
 * 查詢指定訂單所屬客戶過往使用的受篩產品。
 *
 * @return array<string,mixed>|null 訂單不存在時回傳 null
 */
function findCustomerScreeningItemHistory(PDO $pdo, int $orderId): ?array
{
    $orderStmt = $pdo->prepare(
        'SELECT o.customer_id, c.name AS customer_name
         FROM orders o
         INNER JOIN customers c ON c.id = o.customer_id AND c.deleted_at IS NULL
         WHERE o.id = :order_id AND o.deleted_at IS NULL'
    );
    $orderStmt->execute(['order_id' => $orderId]);
    $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        return null;
    }

    $historyStmt = $pdo->prepare(
        'SELECT o.order_date,
                si.id AS screening_item_id,
                si.item_number,
                si.name AS screening_item_name,
                si.weight_per_unit_g,
                si.unit_price
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id AND oi.deleted_at IS NULL
         INNER JOIN screening_items si ON si.id = oi.screening_item_id
         WHERE o.customer_id = :customer_id
           AND o.id <> :order_id
           AND o.deleted_at IS NULL
         ORDER BY o.order_date DESC, oi.id DESC
         LIMIT 300'
    );
    $historyStmt->execute([
        'customer_id' => (int)$order['customer_id'],
        'order_id' => $orderId,
    ]);

    $items = [];
    foreach ($historyStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $items[] = [
            'order_date' => $row['order_date'],
            'screening_item' => [
                'id' => (int)$row['screening_item_id'],
                'item_number' => $row['item_number'],
                'name' => $row['screening_item_name'],
                'weight_per_unit_g' => $row['weight_per_unit_g'] !== null ? (float)$row['weight_per_unit_g'] : null,
                'unit_price' => $row['unit_price'] !== null ? (float)$row['unit_price'] : null,
            ],
        ];
    }

    return [
        'customer' => [
            'id' => (int)$order['customer_id'],
            'name' => $order['customer_name'],
        ],
        'items' => $items,
    ];
}

/**
 * 統一處理訂單 PDO 寫入例外
 *
 * 錯誤代碼對應：
 * - 23000: 唯一鍵衝突或外鍵參照錯誤（訂單號碼重複、客戶不存在）
 * - 其他:  一般資料庫錯誤
 *
 * @param PDOException $exception PDO 例外物件
 *
 * @return never 函式不會正常返回，一律以 JSON 回應終止
 *
 * @output HTTP 409 Conflict
 * ```json
 * {
 *   "success": false,
 *   "message": "資料重覆或違反參照限制，請檢查訂單號碼或客戶是否存在。",
 *   "error": "SQLSTATE[23000]: ..."
 * }
 * ```
 */
function handleOrderPdoWriteException(PDOException $exception): void
{
    if ((int)$exception->getCode() === 23000) {
        $errMsg = $exception->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            if (stripos($errMsg, 'order_number') !== false) {
                $message = '訂單編號已存在，請使用其他編號。';
            } else {
                $message = '資料重複，請檢查輸入資料。';
            }
        } elseif (stripos($errMsg, 'foreign key') !== false) {
            $message = '關聯資料不存在，請確認客戶是否存在。';
        } else {
            $message = '資料重複或違反參照限制，請檢查訂單編號或客戶是否存在。';
        }
    } else {
        $message = '資料庫寫入失敗，請稍後再試。';
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
        'error' => $exception->getMessage(),
    ], 409);
}
