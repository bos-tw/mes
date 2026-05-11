<?php
/**
 * 退貨單明細 API - 輔助函式
 *
 * 本檔案包含退貨單明細模組的共用函式：
 *
 * @module return_order_items
 * @table return_order_items
 *
 * @functions
 * - readReturnOrderItemPayload(): 讀取請求資料
 * - validateReturnOrderItemData(): 驗證並正規化資料
 * - transformReturnOrderItem(): 轉換 API 回應格式
 * - findReturnOrderItem(): 依 ID 查詢退貨單明細（含關聯資料）
 * - returnOrderItemExists(): 檢查退貨單明細是否存在
 * - generateReturnOrderItemId(): 產生退貨單明細 ID
 * - handleReturnOrderItemWriteException(): 處理寫入 PDO 例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 讀取退貨單明細請求資料
 *
 * 支援 JSON (Content-Type: application/json) 及 FormData 兩種格式。
 * 優先讀取 JSON，若無 JSON 則讀取 $_POST。
 *
 * @return array<string,mixed> 請求資料
 */
function readReturnOrderItemPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化退貨單明細輸入資料
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 *
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateReturnOrderItemData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 退貨單 ID - 新增時必填
    if (!$isUpdate || array_key_exists('return_order_id', $payload)) {
        $returnOrderId = $payload['return_order_id'] ?? null;
        if (!$isUpdate && ($returnOrderId === null || $returnOrderId === '')) {
            $errors['return_order_id'] = '退貨單 ID 為必填。';
        } elseif ($returnOrderId !== null && $returnOrderId !== '') {
            $returnOrderIdInt = filter_var($returnOrderId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($returnOrderIdInt === false) {
                $errors['return_order_id'] = '退貨單 ID 必須為正整數。';
            } else {
                $data['return_order_id'] = $returnOrderIdInt;
            }
        }
    }

    // 訂單項目 ID - 新增時必填
    if (!$isUpdate || array_key_exists('order_item_id', $payload)) {
        $orderItemId = $payload['order_item_id'] ?? null;
        if (!$isUpdate && ($orderItemId === null || $orderItemId === '')) {
            $errors['order_item_id'] = '訂單項目 ID 為必填。';
        } elseif ($orderItemId !== null && $orderItemId !== '') {
            $orderItemIdInt = filter_var($orderItemId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($orderItemIdInt === false) {
                $errors['order_item_id'] = '訂單項目 ID 必須為正整數。';
            } else {
                $data['order_item_id'] = $orderItemIdInt;
            }
        }
    }

    // 退貨數量 - 新增時必填
    if (!$isUpdate || array_key_exists('returned_quantity', $payload)) {
        $returnedQuantity = $payload['returned_quantity'] ?? null;
        if (!$isUpdate && ($returnedQuantity === null || $returnedQuantity === '')) {
            $errors['returned_quantity'] = '退貨數量為必填。';
        } elseif ($returnedQuantity !== null && $returnedQuantity !== '') {
            $qty = filter_var($returnedQuantity, FILTER_VALIDATE_FLOAT);
            if ($qty === false || $qty <= 0) {
                $errors['returned_quantity'] = '退貨數量必須大於 0。';
            } else {
                $data['returned_quantity'] = $qty;
            }
        }
    }

    // 退貨單位
    if (array_key_exists('returned_unit', $payload)) {
        $returnedUnit = trim((string)($payload['returned_unit'] ?? ''));
        $data['returned_unit'] = $returnedUnit !== '' ? mb_substr($returnedUnit, 0, 20) : '件';
    }

    // 退貨原因
    if (array_key_exists('return_reason', $payload)) {
        $returnReason = trim((string)($payload['return_reason'] ?? ''));
        $data['return_reason'] = $returnReason !== '' ? $returnReason : null;
    }

    // 備註
    if (array_key_exists('notes', $payload)) {
        $notes = trim((string)($payload['notes'] ?? ''));
        $data['notes'] = $notes !== '' ? $notes : null;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 轉換退貨單明細為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫原始資料
 * @return array<string,mixed>
 */
function transformReturnOrderItem(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'return_order_id' => (int)$row['return_order_id'],
        'return_order_number' => $row['return_order_number'] ?? null,
        'order_item_id' => (int)$row['order_item_id'],
        'sub_item_number' => $row['sub_item_number'] ?? null,
        'part_number' => $row['part_number'] ?? null,
        'customer_batch_number' => $row['customer_batch_number'] ?? null,
        'screening_item_name' => $row['screening_item_name'] ?? null,
        'returned_quantity' => (float)$row['returned_quantity'],
        'returned_unit' => $row['returned_unit'],
        'return_reason' => $row['return_reason'] ?? null,
        'notes' => $row['notes'] ?? null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

/**
 * 依 ID 查詢退貨單明細（含關聯資料）
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findReturnOrderItem(PDO $pdo, int $id): ?array
{
    $sql = "
        SELECT
            roi.*,
            oi.sub_item_number,
            oi.customer_batch_number,
            oi.part_number,
            si.name AS screening_item_name,
            ro.return_order_number
        FROM return_order_items roi
        LEFT JOIN order_items oi ON roi.order_item_id = oi.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN return_orders ro ON roi.return_order_id = ro.id
        WHERE roi.id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 檢查退貨單明細是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function returnOrderItemExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM return_order_items WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 產生退貨單明細 ID
 *
 * @return int
 */
function generateReturnOrderItemId(): int
{
    return (int)(microtime(true) * 10000) + random_int(0, 9999);
}

/**
 * 處理寫入 PDO 例外
 *
 * @param PDOException $e
 * @return array<string,mixed>
 */
function handleReturnOrderItemWriteException(PDOException $e): array
{
    $code = $e->getCode();
    $message = $e->getMessage();

    error_log("ReturnOrderItem PDO Exception: [{$code}] {$message}");

    // 外鍵約束
    if ($code === '23000' && str_contains($message, 'foreign key constraint')) {
        return [
            'success' => false,
            'message' => '關聯資料不存在或已刪除，請確認資料正確。',
        ];
    }

    // 唯一約束
    if ($code === '23000' && str_contains($message, 'Duplicate entry')) {
        return [
            'success' => false,
            'message' => '資料重複，請檢查輸入資料。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}