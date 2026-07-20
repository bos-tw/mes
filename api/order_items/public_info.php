<?php
/**
 * 訂單品項公開資訊 API（供列印頁面使用）
 *
 * 此 API 不需要登入認證，僅回傳訂單品項的公開資訊。
 *
 * @endpoint GET /api/order_items/public_info.php?order_id={id}
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// 此 API 不需要登入認證，但限制 HTTP 方法
requireMethod('GET');

// 防止被嵌入 iframe
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;

if ($orderId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的訂單 ID。',
    ], 400);
}

$pdo = db();

// 查詢訂單品項，並關聯受篩產品資訊
$stmt = $pdo->prepare('
    SELECT
        oi.id,
        oi.order_id,
        oi.screening_item_id,
        oi.unit_price_per_thousand,
        oi.total_weight_kg,
        oi.total_units,
        oi.total_price,
        oi.status,
        oi.drawing_number,
        oi.sub_item_number,
        oi.part_number,
        oi.customer_batch_number,
        oi.customer_sample_status,
        oi.delivery_location,
        oi.notes,
        si.item_number,
        si.name AS item_name,
        si.material,
        si.thread_type,
        si.weight_per_unit_g
    FROM order_items oi
    LEFT JOIN screening_items si ON oi.screening_item_id = si.id
    WHERE oi.order_id = ?
      AND oi.deleted_at IS NULL
    ORDER BY oi.id ASC
');
$stmt->execute([$orderId]);

$orderItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($orderItems)) {
    jsonResponse([
        'success' => true,
        'data' => [],
        'message' => '此訂單沒有品項資料。',
    ]);
}

// 取得所有訂單品項的 ID
$orderItemIds = array_column($orderItems, 'id');

// 查詢載具資訊
$toolsMap = [];
if (!empty($orderItemIds)) {
    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            oit.order_item_id,
            oit.tool_id,
            oit.quantity,
            t.name AS tool_name,
            t.tool_number,
            t.weight_kg AS tool_weight_kg
        FROM order_item_tools oit
        LEFT JOIN tools t ON oit.tool_id = t.id
        WHERE oit.order_item_id IN ($placeholders)
        ORDER BY oit.id ASC
    ");
    $stmt->execute($orderItemIds);

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $tool) {
        $itemId = (int)$tool['order_item_id'];
        if (!isset($toolsMap[$itemId])) {
            $toolsMap[$itemId] = [];
        }
        $toolsMap[$itemId][] = [
            'tool_id' => (int)$tool['tool_id'],
            'tool_name' => $tool['tool_name'],
            'tool_number' => $tool['tool_number'],
            'tool_weight_kg' => $tool['tool_weight_kg'] !== null ? (float)$tool['tool_weight_kg'] : null,
            'quantity' => (int)$tool['quantity'],
        ];
    }
}

// 查詢篩選細項
$screeningDetailsMap = [];
if (!empty($orderItemIds)) {
    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            oisd.order_item_id,
            oisd.screening_service_id,
            oisd.service_name,
            oisd.actual_price_per_unit,
            oisd.tolerance_plus_value,
            oisd.tolerance_plus_over,
            oisd.tolerance_minus_value,
            oisd.tolerance_minus_over,
            oisd.ppm_standard,
            oisd.notes,
            oisd.description,
            ss.name AS screening_service_name,
            ss.category AS screening_category
        FROM order_item_screening_details oisd
        LEFT JOIN screening_services ss ON oisd.screening_service_id = ss.id
        WHERE oisd.order_item_id IN ($placeholders)
        ORDER BY oisd.id ASC
    ");
    $stmt->execute($orderItemIds);

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $detail) {
        $itemId = (int)$detail['order_item_id'];
        if (!isset($screeningDetailsMap[$itemId])) {
            $screeningDetailsMap[$itemId] = [];
        }

        // 組合公差顯示字串
        $toleranceDisplay = '';
        if ($detail['tolerance_minus_value'] !== null || $detail['tolerance_plus_value'] !== null) {
            $minus = $detail['tolerance_minus_value'] ?? '';
            $plus = $detail['tolerance_plus_value'] ?? '';
            if ($minus !== '' && $plus !== '') {
                $toleranceDisplay = $minus . ' - ' . $plus;
            } elseif ($minus !== '') {
                $toleranceDisplay = '≥ ' . $minus;
            } elseif ($plus !== '') {
                $toleranceDisplay = '≤ ' . $plus;
            }
        }

        $screeningDetailsMap[$itemId][] = [
            'screening_service_id' => (int)$detail['screening_service_id'],
            'service_name' => $detail['service_name'] ?? $detail['screening_service_name'],
            'category' => $detail['screening_category'],
            'actual_price_per_unit' => $detail['actual_price_per_unit'] !== null ? (float)$detail['actual_price_per_unit'] : null,
            'tolerance_display' => $toleranceDisplay,
            'tolerance_plus_value' => $detail['tolerance_plus_value'] !== null ? (float)$detail['tolerance_plus_value'] : null,
            'tolerance_minus_value' => $detail['tolerance_minus_value'] !== null ? (float)$detail['tolerance_minus_value'] : null,
            'ppm_standard' => $detail['ppm_standard'] !== null ? (int)$detail['ppm_standard'] : null,
            'notes' => $detail['notes'],
            'description' => $detail['description'],
        ];
    }
}

// 查詢圖面檔案
$drawingsMap = [];
if (!empty($orderItemIds)) {
    $placeholders = implode(',', array_fill(0, count($orderItemIds), '?'));
    $stmt = $pdo->prepare("
        SELECT
            order_item_id,
            id,
            file_name,
            file_path,
            drawing_number
        FROM order_item_drawings
        WHERE order_item_id IN ($placeholders)
        ORDER BY id ASC
    ");
    $stmt->execute($orderItemIds);

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $drawing) {
        $itemId = (int)$drawing['order_item_id'];
        if (!isset($drawingsMap[$itemId])) {
            $drawingsMap[$itemId] = [];
        }
        $drawingsMap[$itemId][] = [
            'id' => (int)$drawing['id'],
            'file_name' => $drawing['file_name'],
            'file_path' => $drawing['file_path'],
            'drawing_number' => $drawing['drawing_number'],
        ];
    }
}

// 組裝回傳資料
$result = [];
foreach ($orderItems as $item) {
    $itemId = (int)$item['id'];

    // 計算載具總數量
    $tools = $toolsMap[$itemId] ?? [];
    $totalToolQuantity = 0;
    $totalToolWeight = 0;
    foreach ($tools as $tool) {
        $totalToolQuantity += $tool['quantity'];
        if ($tool['tool_weight_kg'] !== null) {
            $totalToolWeight += $tool['tool_weight_kg'] * $tool['quantity'];
        }
    }

    $totalWeightKg = $item['total_weight_kg'] !== null ? (float)$item['total_weight_kg'] : null;
    $netWeightKg = $totalWeightKg !== null ? round(max(0, $totalWeightKg - $totalToolWeight), 4) : null;

    $result[] = [
        'id' => $itemId,
        'order_id' => (int)$item['order_id'],
        // 受篩產品資訊
        'screening_item' => [
            'id' => (int)$item['screening_item_id'],
            'item_number' => $item['item_number'],
            'name' => $item['item_name'],
            'material' => $item['material'],
            'thread_type' => $item['thread_type'],
            'weight_per_unit_g' => $item['weight_per_unit_g'] !== null ? (float)$item['weight_per_unit_g'] : null,
        ],
        // 訂單品項資訊
        'part_number' => $item['part_number'],
        'drawing_number' => $item['drawing_number'],
        'sub_item_number' => $item['sub_item_number'],
        'customer_batch_number' => $item['customer_batch_number'],
        'customer_sample_status' => $item['customer_sample_status'],
        'delivery_location' => $item['delivery_location'],
        // 數量與價格
        'total_weight_kg' => $totalWeightKg,
        'total_units' => $item['total_units'] !== null ? (float)$item['total_units'] : null,
        'total_price' => $item['total_price'] !== null ? (float)$item['total_price'] : null,
        'unit_price_per_thousand' => $item['unit_price_per_thousand'] !== null ? (float)$item['unit_price_per_thousand'] : null,
        // 載具資訊
        'tools' => $tools,
        'tools_summary' => [
            'total_quantity' => $totalToolQuantity,
            'total_weight_kg' => round($totalToolWeight, 2),
        ],
        'totals' => [
            'tool_weight_kg' => round($totalToolWeight, 2),
            'net_weight_kg' => $netWeightKg,
        ],
        // 篩選細項
        'screening_details' => $screeningDetailsMap[$itemId] ?? [],
        // 圖面
        'drawings' => $drawingsMap[$itemId] ?? [],
        // 其他
        'status' => $item['status'],
        'notes' => $item['notes'],
    ];
}

jsonResponse([
    'success' => true,
    'data' => $result,
]);
