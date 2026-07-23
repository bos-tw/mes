<?php
/**
 * 不良品庫存可用包／袋。
 *
 * @endpoint GET /api/inventory_items/packages.php?inventory_item_id={id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('GET');

$inventoryItemId = (int)($_GET['inventory_item_id'] ?? 0);
if ($inventoryItemId <= 0) {
    jsonResponse(['success' => false, 'message' => '無效的庫存ID。'], 400);
}

$pdo = db();
$itemStmt = $pdo->prepare("
    SELECT id, stock_category
    FROM inventory_items
    WHERE id = :id
      AND deleted_at IS NULL
    LIMIT 1
");
$itemStmt->execute(['id' => $inventoryItemId]);
$item = $itemStmt->fetch(PDO::FETCH_ASSOC);
if (!$item) {
    jsonResponse(['success' => false, 'message' => '找不到庫存項目。'], 404);
}
if ($item['stock_category'] !== 'defect') {
    jsonResponse(['success' => true, 'data' => []]);
}

$stmt = $pdo->prepare("
    SELECT id, package_number, package_unit, package_quantity,
           contained_units, content_weight_kg, package_status
    FROM inventory_packages
    WHERE inventory_item_id = :inventory_item_id
      AND package_status = 'available'
    ORDER BY id
");
$stmt->execute(['inventory_item_id' => $inventoryItemId]);
jsonResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []]);
