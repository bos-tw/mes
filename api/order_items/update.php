<?php
/**
 * 訂單品項 API - 更新
 *
 * 更新指定品項資料，支援檔案上傳與刪除。
 *
 * @endpoint PUT/PATCH /api/order_items/update.php?id={int}
 * @method POST + _method=PUT/PATCH (表單上傳時使用)
 *
 * @auth 必須登入
 *
 * @input GET 參數:
 * | 參數 | 類型 | 必填 | 說明       |
 * |-----|------|-----|------------|
 * | id  | int  | 是  | 訂單品項 ID |
 *
 * @input FormData (POST with _method=PUT):
 * | 參數                       | 類型     | 必填 | 說明                    |
 * |--------------------------|----------|-----|-------------------------|
 * | screening_item_id        | int      | 否  | 受篩產品 ID              |
 * | total_weight_kg          | float    | 否  | 總重量 (kg)              |
 * | unit_price_per_thousand  | float    | 否  | 單價 (元/千支)           |
 * | status                   | string   | 否  | 狀態代碼                  |
 * | tools                    | JSON     | 否  | 載具陣列                  |
 * | screening_details        | JSON     | 否  | 篩分服務陣列              |
 * | drawing_files[]          | file     | 否  | 新增的圖面檔案            |
 * | drawing_numbers          | JSON     | 否  | 新圖面編號                |
 * | existing_drawing_numbers | JSON     | 否  | 更新現有圖面編號 {id: number}|
 * | deleted_drawing_ids      | JSON     | 否  | 要刪除的圖面 ID          |
 * | attachment_files[]       | file     | 否  | 新增的附件檔案            |
 * | deleted_attachment_ids   | JSON     | 否  | 要刪除的附件 ID          |
 *
 * @output 成功 (200):
 * ```json
 * {
 *   "success": true,
 *   "message": "訂單品項更新成功。",
 *   "data": { ... }
 * }
 * ```
 *
 * @error 400 ID 無效
 * @error 404 訂單品項不存在
 * @error 422 欄位驗證失敗 / 總重量必須大於載具重量
 */
declare(strict_types=1);

// 開啟錯誤報告以便調試
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 設置錯誤處理器
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile on line $errline");
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// 設置異常處理器
set_exception_handler(function($exception) {
    error_log("Uncaught Exception: " . $exception->getMessage());
    error_log("Stack trace: " . $exception->getTraceAsString());

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => '伺服器錯誤：' . $exception->getMessage(),
        'error' => $exception->getMessage(),
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString(),
    ], JSON_UNESCAPED_UNICODE);
    exit;
});

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$method = requireMethod(['PUT', 'PATCH']);

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) {
    jsonResponse([
        'success' => false,
        'message' => '請提供有效的客戶批號 ID。',
    ], 400);
}

$pdo = db();

$orderItem = findOrderItem($pdo, $id);
if (!$orderItem) {
    jsonResponse([
        'success' => false,
        'message' => '找不到對應的客戶批號資料。',
    ], 404);
}

$payload = readOrderItemPayload();

// 處理要刪除的圖面
$deletedDrawingIds = [];
if (!empty($payload['deleted_drawing_ids'])) {
    $deletedIdsJson = is_string($payload['deleted_drawing_ids'])
        ? $payload['deleted_drawing_ids']
        : json_encode($payload['deleted_drawing_ids']);
    $deletedDrawingIds = json_decode($deletedIdsJson, true) ?? [];
}

// 處理要刪除的檔案附件
$deletedAttachmentIds = [];
if (!empty($payload['deleted_attachment_ids'])) {
    $deletedIdsJson = is_string($payload['deleted_attachment_ids'])
        ? $payload['deleted_attachment_ids']
        : json_encode($payload['deleted_attachment_ids']);
    $deletedAttachmentIds = json_decode($deletedIdsJson, true) ?? [];
}

// 解析圖面編號
$drawingNumbers = [];
if (isset($_POST['drawing_numbers'])) {
    $drawingNumbersJson = $_POST['drawing_numbers'];
    $drawingNumbers = json_decode($drawingNumbersJson, true) ?? [];
}

// 解析已存在圖面的編號更新
$existingDrawingNumbers = [];
if (isset($_POST['existing_drawing_numbers'])) {
    $existingDrawingNumbers = $_POST['existing_drawing_numbers'];
}

// 處理圖面檔案上傳
$uploadedDrawings = [];
if (!empty($_FILES['drawing_files']['name'])) {
    $uploadDir = __DIR__ . '/../../uploads/order_item_drawings/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileCount = is_array($_FILES['drawing_files']['name'])
        ? count($_FILES['drawing_files']['name'])
        : 1;

    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = is_array($_FILES['drawing_files']['name'])
            ? $_FILES['drawing_files']['name'][$i]
            : $_FILES['drawing_files']['name'];

        $fileTmpName = is_array($_FILES['drawing_files']['tmp_name'])
            ? $_FILES['drawing_files']['tmp_name'][$i]
            : $_FILES['drawing_files']['tmp_name'];

        $fileSize = is_array($_FILES['drawing_files']['size'])
            ? $_FILES['drawing_files']['size'][$i]
            : $_FILES['drawing_files']['size'];

        $fileError = is_array($_FILES['drawing_files']['error'])
            ? $_FILES['drawing_files']['error'][$i]
            : $_FILES['drawing_files']['error'];

        if ($fileError === UPLOAD_ERR_OK) {
            // 驗證副檔名（白名單）
            if (!isAllowedExtension($fileName, ['jpg', 'jpeg', 'png', 'gif', 'pdf'])) {
                continue;
            }

            // 伺服器端 MIME 類型偵測
            $detectedMime = detectMimeType($fileTmpName);
            $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!in_array($detectedMime, $allowedTypes, true)) {
                continue;
            }

            // 驗證檔案大小 (10MB)
            if ($fileSize > 10 * 1024 * 1024) {
                continue;
            }

            // 生成唯一檔案名
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $uniqueName = uniqid('drawing_', true) . '.' . $fileExt;
            $targetPath = $uploadDir . $uniqueName;

            if (move_uploaded_file($fileTmpName, $targetPath)) {
                $drawingNumber = isset($drawingNumbers[$i]) ? $drawingNumbers[$i] : null;
                $uploadedDrawings[] = [
                    'file_name' => $fileName,
                    'file_path' => 'uploads/order_item_drawings/' . $uniqueName,
                    'file_size' => $fileSize,
                    'mime_type' => $detectedMime,
                    'drawing_number' => $drawingNumber,
                ];
            }
        }
    }
}

// 處理檔案附件上傳
$uploadedAttachments = [];
if (!empty($_FILES['attachment_files']['name'])) {
    $uploadDir = __DIR__ . '/../../uploads/order_items/attachments/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileCount = is_array($_FILES['attachment_files']['name'])
        ? count($_FILES['attachment_files']['name'])
        : 1;

    for ($i = 0; $i < $fileCount; $i++) {
        $fileName = is_array($_FILES['attachment_files']['name'])
            ? $_FILES['attachment_files']['name'][$i]
            : $_FILES['attachment_files']['name'];

        $fileTmpName = is_array($_FILES['attachment_files']['tmp_name'])
            ? $_FILES['attachment_files']['tmp_name'][$i]
            : $_FILES['attachment_files']['tmp_name'];

        $fileSize = is_array($_FILES['attachment_files']['size'])
            ? $_FILES['attachment_files']['size'][$i]
            : $_FILES['attachment_files']['size'];

        $fileError = is_array($_FILES['attachment_files']['error'])
            ? $_FILES['attachment_files']['error'][$i]
            : $_FILES['attachment_files']['error'];

        if ($fileError === UPLOAD_ERR_OK) {
            // 驗證副檔名（白名單）
            if (!isAllowedExtension($fileName, ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip'])) {
                continue;
            }

            // 伺服器端 MIME 類型偵測
            $detectedMime = detectMimeType($fileTmpName);

            // 驗證檔案大小 (10MB)
            if ($fileSize > 10 * 1024 * 1024) {
                continue;
            }

            // 生成唯一檔案名
            $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $uniqueName = uniqid('attachment_', true) . '.' . $fileExt;
            $targetPath = $uploadDir . $uniqueName;

            if (move_uploaded_file($fileTmpName, $targetPath)) {
                $uploadedAttachments[] = [
                    'file_name' => $fileName,
                    'file_path' => 'uploads/order_items/attachments/' . $uniqueName,
                    'file_size' => $fileSize,
                    'mime_type' => $detectedMime,
                ];
            }
        }
    }
}

$validated = validateOrderItemData($payload, true);
if ($validated['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '欄位驗證失敗。',
        'errors' => $validated['errors'],
    ], 422);
}

$data = $validated['data'];
$toolsPayload = $validated['tools'];
$servicePayload = $validated['services'];

$originalOrderId = (int)$orderItem['order_id'];
$newOrderId = $originalOrderId;
if (isset($data['order_id'])) {
    $newOrderId = (int)$data['order_id'];
    if (!ensureOrderExists($pdo, $newOrderId)) {
        jsonResponse([
            'success' => false,
            'message' => '指定的訂單不存在。',
            'errors' => ['order_id' => '指定的訂單不存在。'],
        ], 422);
    }
}

$screeningItemId = isset($data['screening_item_id']) ? (int)$data['screening_item_id'] : (int)$orderItem['screening_item_id'];
$screeningItem = findScreeningItem($pdo, $screeningItemId);
if (!$screeningItem) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的受篩產品。',
        'errors' => ['screening_item_id' => '指定的受篩產品不存在。'],
    ], 422);
}

$unitPricePerThousand = isset($data['unit_price_per_thousand']) ? (float)$data['unit_price_per_thousand'] : (isset($orderItem['unit_price_per_thousand']) ? (float)$orderItem['unit_price_per_thousand'] : null);

$totalWeightKg = isset($data['total_weight_kg']) ? (float)$data['total_weight_kg'] : (float)$orderItem['total_weight_kg'];
if ($totalWeightKg <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '總重量必須為正數。',
    ], 422);
}

$currentToolsMap = getOrderItemTools($pdo, [$id]);
$currentDetailsMap = getOrderItemScreeningDetails($pdo, [$id]);
$currentTools = $currentToolsMap[$id] ?? [];
$currentDetails = $currentDetailsMap[$id] ?? [];

$replaceTools = array_key_exists('tools', $payload);
$replaceDetails = array_key_exists('screening_details', $payload);

try {
    $pdo->beginTransaction();

    $normalisedTools = $replaceTools ? normaliseToolPayload($pdo, $toolsPayload) : $currentTools;
    $normalisedServices = $replaceDetails ? normaliseServicePayload($pdo, $servicePayload) : $currentDetails;

    if ($normalisedServices === []) {
        throw new InvalidArgumentException('至少需要設定一項篩分服務。');
    }

    $metrics = calculateOrderItemMetrics($screeningItem, $totalWeightKg, $normalisedTools, $normalisedServices, $unitPricePerThousand);

    $updateData = [
        'order_id' => $newOrderId,
        'screening_item_id' => $screeningItemId,
        'unit_price_per_thousand' => $unitPricePerThousand !== null ? round($unitPricePerThousand, 2) : null,
        'total_weight_kg' => round($totalWeightKg, 2),
        'total_units' => $metrics['total_units'],
        'total_price' => $metrics['total_price'],
        'status' => $data['status'] ?? $orderItem['status'],
        'drawing_number' => $data['drawing_number'] ?? $orderItem['drawing_number'] ?? null,
        'sub_item_number' => $data['sub_item_number'] ?? $orderItem['sub_item_number'],
        'part_number' => $data['part_number'] ?? $orderItem['part_number'],
        'customer_batch_number' => $data['customer_batch_number'] ?? $orderItem['customer_batch_number'],
        'customer_sample_status' => $data['customer_sample_status'] ?? $orderItem['customer_sample_status'],
        'delivery_location' => $data['delivery_location'] ?? $orderItem['delivery_location'],
        'notes' => $data['notes'] ?? $orderItem['notes'],
        // 重量追蹤欄位
        'customer_provided_weight' => array_key_exists('customer_provided_weight', $data) ? $data['customer_provided_weight'] : ($orderItem['customer_provided_weight'] ?? null),
        'confirmed_weight' => array_key_exists('confirmed_weight', $data) ? $data['confirmed_weight'] : ($orderItem['confirmed_weight'] ?? null),
        'actual_production_weight' => array_key_exists('actual_production_weight', $data) ? $data['actual_production_weight'] : ($orderItem['actual_production_weight'] ?? null),
    ];

    $setClauses = [];
    foreach ($updateData as $column => $value) {
        $setClauses[] = "$column = :$column";
    }

    $stmt = $pdo->prepare('UPDATE order_items SET ' . implode(', ', $setClauses) . ' WHERE id = :id');
    foreach ($updateData as $column => $value) {
        if ($value === null) {
            $stmt->bindValue(':' . $column, null, PDO::PARAM_NULL);
        } elseif (is_int($value)) {
            $stmt->bindValue(':' . $column, $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(':' . $column, $value);
        }
    }
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();

    if ($replaceTools) {
        $pdo->prepare('DELETE FROM order_item_tools WHERE order_item_id = :id')->execute(['id' => $id]);
        saveOrderItemTools($pdo, $id, $normalisedTools);
    }

    if ($replaceDetails) {
        $pdo->prepare('DELETE FROM order_item_screening_details WHERE order_item_id = :id')->execute(['id' => $id]);
        saveOrderItemScreeningDetails($pdo, $id, $normalisedServices);
    }

    // 處理要刪除的圖面
    if (!empty($deletedDrawingIds)) {
        $deleteDrawingStmt = $pdo->prepare('SELECT id, file_path FROM order_item_drawings WHERE id = :id AND order_item_id = :order_item_id');
        $removeDrawingStmt = $pdo->prepare('DELETE FROM order_item_drawings WHERE id = :id AND order_item_id = :order_item_id');
        $countDrawingRefStmt = $pdo->prepare('SELECT COUNT(*) FROM order_item_drawings WHERE file_path = :file_path');

        foreach ($deletedDrawingIds as $drawingId) {
            if (!is_int($drawingId)) {
                continue;
            }

            // 獲取檔案路徑
            $deleteDrawingStmt->execute(['id' => $drawingId, 'order_item_id' => $id]);
            $drawing = $deleteDrawingStmt->fetch(PDO::FETCH_ASSOC);

            // 刪除資料庫記錄
            $removeDrawingStmt->execute(['id' => $drawingId, 'order_item_id' => $id]);

            // 僅在沒有其他引用時才刪除實體檔案
            if ($drawing && !empty($drawing['file_path'])) {
                $countDrawingRefStmt->execute(['file_path' => $drawing['file_path']]);
                $remainingReferences = (int)$countDrawingRefStmt->fetchColumn();
                if ($remainingReferences === 0) {
                    $filePath = __DIR__ . '/../../' . $drawing['file_path'];
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                }
            }
        }
    }

    // 儲存上傳的圖面檔案
    if (!empty($uploadedDrawings)) {
        $insertDrawingStmt = $pdo->prepare(
            'INSERT INTO order_item_drawings (order_item_id, drawing_number, file_name, file_path, file_size, mime_type)
             VALUES (:order_item_id, :drawing_number, :file_name, :file_path, :file_size, :mime_type)'
        );
        foreach ($uploadedDrawings as $drawing) {
            $insertDrawingStmt->execute([
                'order_item_id' => $id,
                'drawing_number' => $drawing['drawing_number'] ?? null,
                'file_name' => $drawing['file_name'],
                'file_path' => $drawing['file_path'],
                'file_size' => $drawing['file_size'],
                'mime_type' => $drawing['mime_type'],
            ]);
        }
    }

    // 更新已存在圖面的編號
    if (!empty($existingDrawingNumbers)) {
        $updateDrawingNumberStmt = $pdo->prepare(
            'UPDATE order_item_drawings SET drawing_number = :drawing_number WHERE id = :id'
        );
        foreach ($existingDrawingNumbers as $drawingId => $drawingNumber) {
            $updateDrawingNumberStmt->execute([
                'id' => (int)$drawingId,
                'drawing_number' => $drawingNumber,
            ]);
        }
    }

    // 新增只有圖面編號的記錄
    if (!empty($_POST['new_drawing_numbers_only'])) {
        $numbersOnly = json_decode($_POST['new_drawing_numbers_only'], true);
        if (is_array($numbersOnly)) {
            $insertNumberOnlyStmt = $pdo->prepare(
                'INSERT INTO order_item_drawings (order_item_id, drawing_number) VALUES (:order_item_id, :drawing_number)'
            );
            foreach ($numbersOnly as $number) {
                if (!empty($number)) {
                    $insertNumberOnlyStmt->execute([
                        'order_item_id' => $id,
                        'drawing_number' => $number,
                    ]);
                }
            }
        }
    }

    // 處理要刪除的檔案附件
    if (!empty($deletedAttachmentIds)) {
        $deleteAttachmentStmt = $pdo->prepare('SELECT id, file_path FROM order_item_attachments WHERE id = :id AND order_item_id = :order_item_id');
        $removeAttachmentStmt = $pdo->prepare('DELETE FROM order_item_attachments WHERE id = :id AND order_item_id = :order_item_id');
        $countAttachmentRefStmt = $pdo->prepare('SELECT COUNT(*) FROM order_item_attachments WHERE file_path = :file_path');

        foreach ($deletedAttachmentIds as $attachmentId) {
            if (!is_int($attachmentId)) {
                continue;
            }

            // 獲取檔案路徑
            $deleteAttachmentStmt->execute(['id' => $attachmentId, 'order_item_id' => $id]);
            $attachment = $deleteAttachmentStmt->fetch(PDO::FETCH_ASSOC);

            // 刪除資料庫記錄
            $removeAttachmentStmt->execute(['id' => $attachmentId, 'order_item_id' => $id]);

            // 僅在沒有其他引用時才刪除實體檔案
            if ($attachment && !empty($attachment['file_path'])) {
                $countAttachmentRefStmt->execute(['file_path' => $attachment['file_path']]);
                $remainingReferences = (int)$countAttachmentRefStmt->fetchColumn();
                if ($remainingReferences === 0) {
                    $filePath = __DIR__ . '/../../' . $attachment['file_path'];
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                }
            }
        }
    }

    // 儲存檔案附件
    if (!empty($uploadedAttachments)) {
        $insertAttachmentStmt = $pdo->prepare(
            'INSERT INTO order_item_attachments (order_item_id, file_name, file_path, file_size, mime_type)
             VALUES (:order_item_id, :file_name, :file_path, :file_size, :mime_type)'
        );
        foreach ($uploadedAttachments as $attachment) {
            $insertAttachmentStmt->execute([
                'order_item_id' => $id,
                'file_name' => $attachment['file_name'],
                'file_path' => $attachment['file_path'],
                'file_size' => $attachment['file_size'],
                'mime_type' => $attachment['mime_type'],
            ]);
        }
    }

    recalculateOrderTotalAmount($pdo, $newOrderId);
    if ($originalOrderId !== $newOrderId) {
        recalculateOrderTotalAmount($pdo, $originalOrderId);
    }

    logAuditAction('更新客戶批號', 'OrderItems', $id, [
        'order_id' => $newOrderId,
        'screening_item_id' => $screeningItemId,
        'total_weight_kg' => $updateData['total_weight_kg'],
        'total_units' => $metrics['total_units'],
        'total_price' => $metrics['total_price'],
    ]);

    $pdo->commit();
} catch (InvalidArgumentException $exception) {
    $pdo->rollBack();
    jsonResponse([
        'success' => false,
        'message' => $exception->getMessage(),
    ], 422);
} catch (Throwable $exception) {
    $pdo->rollBack();
    jsonResponse([
        'success' => false,
        'message' => '無法更新客戶批號，請稍後再試。',
        'error' => $exception->getMessage(),
    ], 500);
}

$updated = findOrderItem($pdo, $id);
$toolsMap = getOrderItemTools($pdo, [$id]);
$detailsMap = getOrderItemScreeningDetails($pdo, [$id]);
$drawingsMap = getOrderItemDrawings($pdo, [$id]);
$attachmentsMap = getOrderItemAttachments($pdo, [$id]);

jsonResponse([
    'success' => true,
    'message' => '客戶批號已更新。',
    'data' => $updated ? transformOrderItem($updated, $toolsMap[$id] ?? [], $detailsMap[$id] ?? [], $drawingsMap[$id] ?? [], $attachmentsMap[$id] ?? []) : null,
]);
