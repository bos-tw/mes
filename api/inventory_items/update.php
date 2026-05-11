<?php
/**
 * 庫存品項 API - 更新
 *
 * 更新指定庫存品項的資料。
 *
 * @endpoint PUT/PATCH /api/inventory_items/update.php
 *
 * @auth 必須登入
 *
 * @input JSON Body:
 * | 參數                   | 類型     | 必填 | 說明              |
 * |------------------------|----------|-----|-----------------|
 * | id                     | int      | 是  | 庫存品項 ID        |
 * | internal_lot_number    | string   | 否  | 內部批號          |
 * | quantity_on_hand       | float    | 否  | 庫存數量          |
 * | quality_status         | string   | 否  | 品質狀態          |
 * | warehouse_location     | string   | 否  | 倉庫位置          |
 * | storage_zone           | string   | 否  | 儲存區域          |
 * | shelf_number           | string   | 否  | 貨架編號          |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "庫存品項更新成功。",
 *   "item": { ... }
 * }
 * ```
 *
 * @error 400 ID 無效 / 驗證失敗
 * @error 404 庫存品項不存在
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

/**
 * Inventory Item Update API Endpoint
 *
 * PUT/PATCH - Update inventory item
 */

requireAuth();

requireMethod(['PUT', 'PATCH']);

$pdo = db();

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的ID。'], 400);
}

// Check if item exists
$existingItem = getInventoryItemDetails($pdo, $id);
if (!$existingItem) {
    jsonResponse(['success' => false, 'message' => '庫存項目不存在。'], 404);
}

// Validate data
$errors = validateInventoryItemData($data, true);
if (!empty($errors)) {
    jsonResponse(['success' => false, 'message' => '驗證失敗。', 'errors' => $errors], 400);
}

try {
    $pdo->beginTransaction();

    // Build update query
    $updateFields = [];
    $params = ['id' => $id];

    // Allowed update fields
    $allowedFields = [
        'internal_lot_number',
        'total_good_units',
        'total_defect_units',
        'quantity_on_hand',
        'quantity_allocated',
        'quantity_reserved',
        'quantity_shipped',
        'net_weight_kg',
        'gross_weight_kg',
        'tool_weight_kg',
        'weight_per_unit_g',
        'tool_statistics',
        'total_tool_quantity',
        'quality_status',
        'inspection_date',
        'inspector_employee_id',
        'quality_notes',
        'warehouse_location',
        'storage_zone',
        'shelf_number',
        'status',
        'notes',
    ];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $updateFields[] = "{$field} = :{$field}";
            $params[$field] = $data[$field];
        }
    }

    if (empty($updateFields)) {
        jsonResponse(['success' => false, 'message' => '沒有要更新的欄位。'], 400);
    }

    $sql = "UPDATE inventory_items SET " . implode(', ', $updateFields) . " WHERE id = :id AND deleted_at IS NULL";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // If quantity changed, create transaction record
    if (isset($data['quantity_on_hand']) && $data['quantity_on_hand'] != $existingItem['quantity_on_hand']) {
        $currentUser = requireAuth();
        $quantityDiff = $data['quantity_on_hand'] - $existingItem['quantity_on_hand'];
        $direction = $quantityDiff > 0 ? 'inbound' : 'outbound';

        $transactionId = getNextInventoryTransactionId($pdo);

        $transStmt = $pdo->prepare("
            INSERT INTO inventory_transactions (
                id,
                inventory_item_id,
                ref_type,
                ref_id,
                direction,
                quantity,
                after_quantity,
                notes,
                created_by_employee_id
            ) VALUES (
                :id,
                :inventory_item_id,
                'adjustment',
                :ref_id,
                :direction,
                :quantity,
                :after_quantity,
                :notes,
                :created_by_employee_id
            )
        ");

        $transStmt->execute([
            'id' => $transactionId,
            'inventory_item_id' => $id,
            'ref_id' => $id,
            'direction' => $direction,
            'quantity' => abs($quantityDiff),
            'after_quantity' => $data['quantity_on_hand'],
            'notes' => $data['adjustment_notes'] ?? '庫存調整',
            'created_by_employee_id' => $currentUser['id'] ?? null,
        ]);
    }

    $pdo->commit();

    // Fetch updated item
    $item = getInventoryItemDetails($pdo, $id);

    jsonResponse([
        'success' => true,
        'message' => '庫存項目更新成功。',
        'item' => $item,
    ]);

} catch (Throwable $e) {
    $pdo->rollBack();
    error_log('Inventory item update failed: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '更新失敗，請稍後重試。')], 500);
}
