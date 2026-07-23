<?php
/**
 * 訂單品項 API - 直接複製
 *
 * 將指定訂單品項複製為同一張訂單的下一筆明細。複製基本欄位、載具、篩分服務、
 * 圖面及附件關聯；工單、庫存、出貨與退貨等下游流程資料不會被複製。
 *
 * @endpoint POST /api/order_items/copy.php
 *
 * @auth 必須登入
 *
 * @table order_items
 * @table order_item_tools
 * @table order_item_screening_details
 * @table order_item_drawings
 * @table order_item_attachments
 *
 * @input JSON Body:
 * | 參數名稱             | 類型 | 必填 | 說明                 |
 * |---------------------|------|------|----------------------|
 * | source_order_item_id| int  | 是   | 來源訂單品項 ID (> 0) |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *   "success": true,
 *   "message": "訂單細項已複製為 ORDER-20260722-0001-L02。",
 *   "data": { ...完整訂單品項資料... }
 * }
 *
 * @error 400 來源 ID 格式不正確
 * @error 404 找不到來源訂單品項
 * @error 422 訂單明細已達 L99 上限或來源資料失效
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('POST');

$payload = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($payload)) {
    $payload = $_POST;
}

$sourceOrderItemId = filter_var(
    $payload['source_order_item_id'] ?? null,
    FILTER_VALIDATE_INT,
    ['options' => ['min_range' => 1]]
);
if ($sourceOrderItemId === false || $sourceOrderItemId === null) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的來源訂單細項 ID。',
    ], 400);
}

$pdo = db();
$sourceLookupStmt = $pdo->prepare(
    'SELECT id, order_id
     FROM order_items
     WHERE id = :id AND deleted_at IS NULL'
);
$sourceLookupStmt->execute(['id' => (int)$sourceOrderItemId]);
$sourceLookup = $sourceLookupStmt->fetch(PDO::FETCH_ASSOC);
if (!$sourceLookup) {
    jsonResponse([
        'success' => false,
        'message' => '找不到要複製的訂單細項。',
    ], 404);
}

$newOrderItemId = 0;
$newOrderItemNumber = '';

try {
    $pdo->beginTransaction();

    $orderId = (int)$sourceLookup['order_id'];
    $orderIdentity = reserveNextOrderItemIdentity($pdo, $orderId);

    // 先鎖定父訂單再鎖定來源明細，確保序號配置與複製快照一致。
    $sourceStmt = $pdo->prepare(
        'SELECT *
         FROM order_items
         WHERE id = :id AND order_id = :order_id AND deleted_at IS NULL
         FOR UPDATE'
    );
    $sourceStmt->execute([
        'id' => (int)$sourceOrderItemId,
        'order_id' => $orderId,
    ]);
    $source = $sourceStmt->fetch(PDO::FETCH_ASSOC);
    if (!$source) {
        throw new InvalidArgumentException('來源訂單細項已不存在，請重新載入後再試。');
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO order_items (
            order_id,
            order_item_sequence,
            order_item_number,
            screening_item_id,
            unit_price_per_thousand,
            total_weight_kg,
            total_units,
            total_price,
            status,
            drawing_number,
            sub_item_number,
            part_number,
            customer_batch_number,
            customer_sample_status,
            expected_delivery_date,
            expected_delivery_period,
            delivery_location,
            notes,
            customer_provided_weight,
            confirmed_weight,
            actual_production_weight
        ) VALUES (
            :order_id,
            :order_item_sequence,
            :order_item_number,
            :screening_item_id,
            :unit_price_per_thousand,
            :total_weight_kg,
            :total_units,
            :total_price,
            :status,
            :drawing_number,
            :sub_item_number,
            :part_number,
            :customer_batch_number,
            :customer_sample_status,
            :expected_delivery_date,
            :expected_delivery_period,
            :delivery_location,
            :notes,
            :customer_provided_weight,
            :confirmed_weight,
            :actual_production_weight
        )'
    );
    $insertStmt->execute([
        'order_id' => $orderId,
        'order_item_sequence' => $orderIdentity['order_item_sequence'],
        'order_item_number' => $orderIdentity['order_item_number'],
        'screening_item_id' => (int)$source['screening_item_id'],
        'unit_price_per_thousand' => $source['unit_price_per_thousand'],
        'total_weight_kg' => $source['total_weight_kg'],
        'total_units' => $source['total_units'],
        'total_price' => $source['total_price'],
        'status' => $source['status'],
        'drawing_number' => $source['drawing_number'],
        'sub_item_number' => $source['sub_item_number'],
        'part_number' => $source['part_number'],
        'customer_batch_number' => $source['customer_batch_number'],
        'customer_sample_status' => $source['customer_sample_status'],
        'expected_delivery_date' => $source['expected_delivery_date'],
        'expected_delivery_period' => $source['expected_delivery_period'],
        'delivery_location' => $source['delivery_location'],
        'notes' => $source['notes'],
        'customer_provided_weight' => $source['customer_provided_weight'],
        'confirmed_weight' => $source['confirmed_weight'],
        'actual_production_weight' => $source['actual_production_weight'],
    ]);

    $newOrderItemId = (int)$pdo->lastInsertId();
    $newOrderItemNumber = (string)$orderIdentity['order_item_number'];

    $copyToolsStmt = $pdo->prepare(
        'INSERT INTO order_item_tools (order_item_id, tool_id, tool_type, quantity, total_weight)
         SELECT :new_order_item_id, tool_id, tool_type, quantity, total_weight
         FROM order_item_tools
         WHERE order_item_id = :source_order_item_id'
    );
    $copyToolsStmt->execute([
        'new_order_item_id' => $newOrderItemId,
        'source_order_item_id' => (int)$sourceOrderItemId,
    ]);

    $copyServicesStmt = $pdo->prepare(
        'INSERT INTO order_item_screening_details (
            order_item_id,
            screening_service_id,
            service_name,
            service_name_en,
            actual_price_per_unit,
            tolerance_plus_value,
            tolerance_plus_over,
            tolerance_minus_value,
            tolerance_minus_over,
            ppm_standard,
            notes,
            description
        )
        SELECT
            :new_order_item_id,
            screening_service_id,
            service_name,
            service_name_en,
            actual_price_per_unit,
            tolerance_plus_value,
            tolerance_plus_over,
            tolerance_minus_value,
            tolerance_minus_over,
            ppm_standard,
            notes,
            description
        FROM order_item_screening_details
        WHERE order_item_id = :source_order_item_id'
    );
    $copyServicesStmt->execute([
        'new_order_item_id' => $newOrderItemId,
        'source_order_item_id' => (int)$sourceOrderItemId,
    ]);

    $copyDrawingsStmt = $pdo->prepare(
        'INSERT INTO order_item_drawings (
            order_item_id, drawing_number, file_name, file_path, file_size, mime_type
        )
        SELECT :new_order_item_id, drawing_number, file_name, file_path, file_size, mime_type
        FROM order_item_drawings
        WHERE order_item_id = :source_order_item_id'
    );
    $copyDrawingsStmt->execute([
        'new_order_item_id' => $newOrderItemId,
        'source_order_item_id' => (int)$sourceOrderItemId,
    ]);

    $copyAttachmentsStmt = $pdo->prepare(
        'INSERT INTO order_item_attachments (
            order_item_id, file_name, file_path, file_size, mime_type
        )
        SELECT :new_order_item_id, file_name, file_path, file_size, mime_type
        FROM order_item_attachments
        WHERE order_item_id = :source_order_item_id'
    );
    $copyAttachmentsStmt->execute([
        'new_order_item_id' => $newOrderItemId,
        'source_order_item_id' => (int)$sourceOrderItemId,
    ]);

    recalculateOrderTotalAmount($pdo, $orderId);

    logAuditAction('複製訂單品項', 'OrderItems', $newOrderItemId, [
        'source_order_item_id' => (int)$sourceOrderItemId,
        'order_id' => $orderId,
        'order_item_number' => $newOrderItemNumber,
    ]);

    $pdo->commit();
} catch (InvalidArgumentException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 422);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('複製訂單品項失敗：' . $exception->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '無法複製訂單細項，請稍後再試。',
    ], 500);
}

$orderItem = findOrderItem($pdo, $newOrderItemId);
$toolsMap = getOrderItemTools($pdo, [$newOrderItemId]);
$detailsMap = getOrderItemScreeningDetails($pdo, [$newOrderItemId]);
$drawingsMap = getOrderItemDrawings($pdo, [$newOrderItemId]);
$attachmentsMap = getOrderItemAttachments($pdo, [$newOrderItemId]);

jsonResponse([
    'success' => true,
    'message' => "訂單細項已複製為 {$newOrderItemNumber}。",
    'data' => $orderItem
        ? transformOrderItem(
            $orderItem,
            $toolsMap[$newOrderItemId] ?? [],
            $detailsMap[$newOrderItemId] ?? [],
            $drawingsMap[$newOrderItemId] ?? [],
            $attachmentsMap[$newOrderItemId] ?? []
        )
        : null,
], 201);
