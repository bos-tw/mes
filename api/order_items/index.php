<?php
/**
 * 訂單品項 API - 列表與新增
 *
 * 管理訂單下的品項記錄，包含受篩產品、載具、篩分服務等資訊。
 *
 * @endpoint GET  /api/order_items?order_id={int}  取得訂單品項列表
 * @endpoint POST /api/order_items                 建立新品項
 *
 * @auth 必須登入
 *
 * @table order_items           主表 - 訂單品項基本資料
 * @table order_item_tools      關聯表 - 品項使用的載具
 * @table order_item_screening_details 關聯表 - 品項的篩分服務
 * @table order_item_drawings   關聯表 - 品項的圖面檔案
 * @table order_item_attachments 關聯表 - 品項的附件檔案
 *
 * @input GET 參數:
 * | 參數      | 類型 | 必填 | 說明        |
 * |----------|------|-----|-------------|
 * | order_id | int  | 是  | 訂單 ID     |
 *
 * @input POST FormData (支援檔案上傳):
 * | 參數                    | 類型     | 必填 | 說明                          |
 * |------------------------|----------|-----|-------------------------------|
 * | order_id               | int      | 是  | 訂單 ID                        |
 * | screening_item_id      | int      | 是  | 受篩產品 ID                    |
 * | total_weight_kg        | float    | 是  | 總重量 (kg)，必須 > 載具重量   |
 * | unit_price_per_thousand| float    | 否  | 單價 (元/千支)                 |
 * | status                 | string   | 否  | 狀態代碼                       |
 * | sub_item_number        | string   | 否  | 次項號                         |
 * | part_number            | string   | 否  | 料號                           |
 * | customer_batch_number  | string   | 否  | 客戶批號                       |
 * | customer_sample_status | string   | 否  | 樣品狀態                       |
 * | delivery_location      | string   | 否  | 交貨地點                       |
 * | notes                  | string   | 否  | 備註                           |
 * | tools                  | JSON     | 否  | 載具陣列 [{tool_id, quantity}] |
 * | screening_details      | JSON     | 是  | 篩分服務陣列                   |
 * | drawing_files[]        | file     | 否  | 圖面檔案 (JPEG/PNG/GIF/PDF)    |
 * | drawing_numbers        | JSON     | 否  | 圖面編號陣列                   |
 * | attachment_files[]     | file     | 否  | 附件檔案                       |
 * | copied_drawing_ids     | JSON     | 否  | 要複製關聯的既有圖面 ID 陣列   |
 * | copied_drawing_numbers | JSON     | 否  | 覆寫圖面編號映射 {id:number}   |
 * | copied_attachment_ids  | JSON     | 否  | 要複製關聯的既有附件 ID 陣列   |
 *
 * @output 成功 (GET):
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "order_id": 10,
 *     "screening_item": {"id": 5, "item_number": "SI-001", "name": "M3x10"},
 *     "total_weight_kg": 50.00,
 *     "total_units": 12500.00,
 *     "total_price": 1875.00,
 *     "tools": [...],
 *     "screening_details": [...],
 *     "drawings": [...],
 *     "attachments": [...]
 *   }]
 * }
 * ```
 *
 * @error 422 欄位驗證失敗 / 訂單不存在 / 受篩產品不存在
 *
 * @see /api/order_items/helpers.php 輔助函式
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

$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListOrderItems();
        break;
    case 'POST':
        handleCreateOrderItem();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleListOrderItems(): void
{
    $orderId = null;
    if (isset($_GET['order_id']) && (string)$_GET['order_id'] !== '') {
        $parsedOrderId = filter_var($_GET['order_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($parsedOrderId === false) {
            jsonResponse([
                'success' => false,
                'message' => '請提供有效的訂單 ID。',
            ], 400);
        }
        $orderId = (int)$parsedOrderId;
    }

    $pdo = db();

    if ($orderId !== null && !ensureOrderExists($pdo, $orderId)) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的訂單資料。',
        ], 404);
    }

    $excludeHasWorkOrder = (string)($_GET['exclude_has_work_order'] ?? '') === '1';
    $keyword = isset($_GET['keyword']) ? trim((string)$_GET['keyword']) : null;

    $rows = $orderId !== null
        ? findOrderItemsByOrder($pdo, $orderId)
        : findAllOrderItems($pdo, $keyword);
    if ($excludeHasWorkOrder) {
        $rows = array_values(array_filter($rows, static function (array $row): bool {
            return empty($row['has_work_order']);
        }));
    }
    $orderItemIds = array_map(static fn(array $row): int => (int)$row['id'], $rows);

    $toolsMap = getOrderItemTools($pdo, $orderItemIds);
    $detailsMap = getOrderItemScreeningDetails($pdo, $orderItemIds);
    $drawingsMap = getOrderItemDrawings($pdo, $orderItemIds);
    $attachmentsMap = getOrderItemAttachments($pdo, $orderItemIds);

    $data = array_map(
        static function (array $row) use ($toolsMap, $detailsMap, $drawingsMap, $attachmentsMap): array {
            $id = (int)$row['id'];
            $tools = $toolsMap[$id] ?? [];
            $details = $detailsMap[$id] ?? [];
            $drawings = $drawingsMap[$id] ?? [];
            $attachments = $attachmentsMap[$id] ?? [];
            return transformOrderItem($row, $tools, $details, $drawings, $attachments);
        },
        $rows
    );

    jsonResponse([
        'success' => true,
        'data' => $data,
    ]);
}

function handleCreateOrderItem(): void
{
    $pdo = db();
    $payload = readOrderItemPayload();

    // 解析複製圖面 ID
    $copiedDrawingIds = [];
    if (isset($_POST['copied_drawing_ids']) && is_string($_POST['copied_drawing_ids'])) {
        $copiedDrawingIdsRaw = json_decode($_POST['copied_drawing_ids'], true);
        if (is_array($copiedDrawingIdsRaw)) {
            foreach ($copiedDrawingIdsRaw as $value) {
                $parsedId = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($parsedId !== false) {
                    $copiedDrawingIds[] = (int)$parsedId;
                }
            }
            $copiedDrawingIds = array_values(array_unique($copiedDrawingIds));
        }
    }

    // 解析複製圖面編號覆寫
    $copiedDrawingNumbers = [];
    if (isset($_POST['copied_drawing_numbers']) && is_string($_POST['copied_drawing_numbers'])) {
        $copiedDrawingNumbersRaw = json_decode($_POST['copied_drawing_numbers'], true);
        if (is_array($copiedDrawingNumbersRaw)) {
            foreach ($copiedDrawingNumbersRaw as $key => $value) {
                $parsedId = filter_var($key, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($parsedId === false) {
                    continue;
                }
                $normalizedValue = trim((string)$value);
                $copiedDrawingNumbers[(int)$parsedId] = $normalizedValue !== '' ? mb_substr($normalizedValue, 0, 255) : null;
            }
        }
    }

    // 解析複製附件 ID
    $copiedAttachmentIds = [];
    if (isset($_POST['copied_attachment_ids']) && is_string($_POST['copied_attachment_ids'])) {
        $copiedAttachmentIdsRaw = json_decode($_POST['copied_attachment_ids'], true);
        if (is_array($copiedAttachmentIdsRaw)) {
            foreach ($copiedAttachmentIdsRaw as $value) {
                $parsedId = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($parsedId !== false) {
                    $copiedAttachmentIds[] = (int)$parsedId;
                }
            }
            $copiedAttachmentIds = array_values(array_unique($copiedAttachmentIds));
        }
    }

    // 解析圖面編號
    $drawingNumbers = [];
    if (isset($_POST['drawing_numbers'])) {
        $drawingNumbersJson = $_POST['drawing_numbers'];
        $drawingNumbers = json_decode($drawingNumbersJson, true) ?? [];
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

            $fileType = is_array($_FILES['drawing_files']['type'])
                ? $_FILES['drawing_files']['type'][$i]
                : $_FILES['drawing_files']['type'];

            if ($fileError === UPLOAD_ERR_OK) {
                // 驗證檔案類型 — 使用伺服器端 MIME 偵測
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
                $detectedMime = detectMimeType($fileTmpName);
                if (!in_array($detectedMime, $allowedTypes, true)) {
                    continue;
                }

                // 驗證副檔名白名單
                $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
                if (!isAllowedExtension($fileName, $allowedExt)) {
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

            $fileType = is_array($_FILES['attachment_files']['type'])
                ? $_FILES['attachment_files']['type'][$i]
                : $_FILES['attachment_files']['type'];

            if ($fileError === UPLOAD_ERR_OK) {
                // 驗證檔案大小 (10MB)
                if ($fileSize > 10 * 1024 * 1024) {
                    continue;
                }

                // 伺服器端 MIME 偵測 & 副檔名白名單
                $detectedMime = detectMimeType($fileTmpName);
                $allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip'];
                if (!isAllowedExtension($fileName, $allowedExt)) {
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

    $validated = validateOrderItemData($payload, false);
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

    if (!isset($data['order_id']) || !ensureOrderExists($pdo, (int)$data['order_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '找不到對應的訂單資料。',
            'errors' => ['order_id' => '指定的訂單不存在。'],
        ], 422);
    }

    if (!isset($data['screening_item_id'])) {
        jsonResponse([
            'success' => false,
            'message' => '受篩產品為必填。',
        ], 422);
    }

    $screeningItem = findScreeningItem($pdo, (int)$data['screening_item_id']);
    if (!$screeningItem) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的受篩產品。',
            'errors' => ['screening_item_id' => '指定的受篩產品不存在。'],
        ], 422);
    }

    $totalWeightKg = isset($data['total_weight_kg']) ? (float)$data['total_weight_kg'] : 0.0;
    if ($totalWeightKg <= 0) {
        jsonResponse([
            'success' => false,
            'message' => '總重量必須為正數。',
        ], 422);
    }

    try {
        $pdo->beginTransaction();

        $orderIdentity = reserveNextOrderItemIdentity($pdo, (int)$data['order_id']);

        $screeningItem = findScreeningItem($pdo, (int)$data['screening_item_id'], true);
        if (!$screeningItem) {
            throw new InvalidArgumentException('找不到指定的受篩產品。');
        }

        $normalisedTools = normaliseToolPayload($pdo, $toolsPayload);
        $normalisedServices = normaliseServicePayload($pdo, $servicePayload);

        $unitPricePerThousand = isset($data['unit_price_per_thousand']) ? (float)$data['unit_price_per_thousand'] : null;

        $metrics = calculateOrderItemMetrics($screeningItem, $totalWeightKg, $normalisedTools, $normalisedServices, $unitPricePerThousand);

        $insert = [
            'order_id' => $data['order_id'],
            'order_item_sequence' => $orderIdentity['order_item_sequence'],
            'order_item_number' => $orderIdentity['order_item_number'],
            'screening_item_id' => $data['screening_item_id'],
            'unit_price_per_thousand' => $unitPricePerThousand !== null ? round($unitPricePerThousand, 2) : null,
            'total_weight_kg' => round($totalWeightKg, 2),
            'total_units' => $metrics['total_units'],
            'total_price' => $metrics['total_price'],
            'status' => $data['status'] ?? null,
            'sub_item_number' => $data['sub_item_number'] ?? null,
            'part_number' => $data['part_number'] ?? null,
            'customer_batch_number' => $data['customer_batch_number'] ?? null,
            'customer_sample_status' => $data['customer_sample_status'] ?? null,
            'expected_delivery_date' => $data['expected_delivery_date'] ?? null,
            'expected_delivery_period' => $data['expected_delivery_period'] ?? null,
            'delivery_location' => $data['delivery_location'] ?? null,
            'notes' => $data['notes'] ?? null,
        ];

        $columns = array_keys($insert);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $stmt = $pdo->prepare('INSERT INTO order_items (' . implode(', ', $columns) . ') VALUES (' . $placeholders . ')');
        $values = array_values($insert);
        $stmt->execute($values);

        $orderItemId = (int)$pdo->lastInsertId();

        saveOrderItemTools($pdo, $orderItemId, $normalisedTools);
        saveOrderItemScreeningDetails($pdo, $orderItemId, $normalisedServices);

        // 儲存上傳的圖面檔案
        if (!empty($uploadedDrawings)) {
            $insertDrawingStmt = $pdo->prepare(
                'INSERT INTO order_item_drawings (order_item_id, drawing_number, file_name, file_path, file_size, mime_type)
                 VALUES (:order_item_id, :drawing_number, :file_name, :file_path, :file_size, :mime_type)'
            );
            foreach ($uploadedDrawings as $drawing) {
                $insertDrawingStmt->execute([
                    'order_item_id' => $orderItemId,
                    'drawing_number' => $drawing['drawing_number'] ?? null,
                    'file_name' => $drawing['file_name'],
                    'file_path' => $drawing['file_path'],
                    'file_size' => $drawing['file_size'],
                    'mime_type' => $drawing['mime_type'],
                ]);
            }
        }

        // 複製既有圖面關聯（共用同一實體檔案）
        if (!empty($copiedDrawingIds)) {
            $drawingPlaceholders = implode(',', array_fill(0, count($copiedDrawingIds), '?'));
            $copiedDrawingsStmt = $pdo->prepare(
                "SELECT id, drawing_number, file_name, file_path, file_size, mime_type
                 FROM order_item_drawings
                 WHERE id IN ({$drawingPlaceholders})"
            );
            $copiedDrawingsStmt->execute($copiedDrawingIds);
            $copiedDrawings = $copiedDrawingsStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($copiedDrawings)) {
                $insertCopiedDrawingStmt = $pdo->prepare(
                    'INSERT INTO order_item_drawings (order_item_id, drawing_number, file_name, file_path, file_size, mime_type)
                     VALUES (:order_item_id, :drawing_number, :file_name, :file_path, :file_size, :mime_type)'
                );
                foreach ($copiedDrawings as $drawing) {
                    $sourceDrawingId = isset($drawing['id']) ? (int)$drawing['id'] : 0;
                    $drawingNumber = array_key_exists($sourceDrawingId, $copiedDrawingNumbers)
                        ? $copiedDrawingNumbers[$sourceDrawingId]
                        : ($drawing['drawing_number'] ?? null);
                    $insertCopiedDrawingStmt->execute([
                        'order_item_id' => $orderItemId,
                        'drawing_number' => $drawingNumber,
                        'file_name' => $drawing['file_name'],
                        'file_path' => $drawing['file_path'],
                        'file_size' => $drawing['file_size'],
                        'mime_type' => $drawing['mime_type'],
                    ]);
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
                    'order_item_id' => $orderItemId,
                    'file_name' => $attachment['file_name'],
                    'file_path' => $attachment['file_path'],
                    'file_size' => $attachment['file_size'],
                    'mime_type' => $attachment['mime_type'],
                ]);
            }
        }

        // 複製既有附件關聯（共用同一實體檔案）
        if (!empty($copiedAttachmentIds)) {
            $attachmentPlaceholders = implode(',', array_fill(0, count($copiedAttachmentIds), '?'));
            $copiedAttachmentsStmt = $pdo->prepare(
                "SELECT id, file_name, file_path, file_size, mime_type
                 FROM order_item_attachments
                 WHERE id IN ({$attachmentPlaceholders})"
            );
            $copiedAttachmentsStmt->execute($copiedAttachmentIds);
            $copiedAttachments = $copiedAttachmentsStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($copiedAttachments)) {
                $insertCopiedAttachmentStmt = $pdo->prepare(
                    'INSERT INTO order_item_attachments (order_item_id, file_name, file_path, file_size, mime_type)
                     VALUES (:order_item_id, :file_name, :file_path, :file_size, :mime_type)'
                );
                foreach ($copiedAttachments as $attachment) {
                    $insertCopiedAttachmentStmt->execute([
                        'order_item_id' => $orderItemId,
                        'file_name' => $attachment['file_name'],
                        'file_path' => $attachment['file_path'],
                        'file_size' => $attachment['file_size'],
                        'mime_type' => $attachment['mime_type'],
                    ]);
                }
            }
        }

        recalculateOrderTotalAmount($pdo, (int)$data['order_id']);

        logAuditAction('新增訂單品項', 'OrderItems', $orderItemId, [
            'order_id' => $data['order_id'],
            'screening_item_id' => $data['screening_item_id'],
            'total_weight_kg' => $insert['total_weight_kg'],
            'total_units' => $metrics['total_units'],
            'total_price' => $metrics['total_price'],
        ]);

        $pdo->commit();
    } catch (InvalidArgumentException $exception) {
        $pdo->rollBack();

        $message = $exception->getMessage();
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($message === '找不到對應的訂單資料。') {
            $response['errors'] = ['order_id' => '指定的訂單不存在或已被刪除。'];
        } elseif ($message === '找不到指定的受篩產品。') {
            $response['errors'] = ['screening_item_id' => '指定的受篩產品不存在或已被刪除。'];
        }

        jsonResponse($response, 422);
    } catch (PDOException $exception) {
        $pdo->rollBack();

        if ($exception->getCode() === '23000') {
            $message = $exception->getMessage();

            if (strpos($message, 'OrderItems_ibfk_1') !== false) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到對應的訂單資料。',
                ], 422);
            }

            if (strpos($message, 'OrderItems_ibfk_2') !== false) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的受篩產品，請重新選擇。',
                    'errors' => ['screening_item_id' => '指定的受篩產品不存在或已被刪除。'],
                ], 422);
            }

            if (strpos($message, 'OrderItemTools_ibfk_2') !== false) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的載具，請重新選擇。',
                    'errors' => ['tools' => ['指定的載具不存在或已被刪除。']],
                ], 422);
            }

            if (strpos($message, 'OrderItemScreeningDetails_ibfk_2') !== false) {
                jsonResponse([
                    'success' => false,
                    'message' => '找不到指定的篩分服務，請重新選擇。',
                    'errors' => ['screening_details' => ['指定的篩分服務不存在或已被刪除。']],
                ], 422);
            }
        }

        jsonResponse([
            'success' => false,
            'message' => '無法建立訂單品項，請稍後再試。',
            'error' => $exception->getMessage(),
        ], 500);
    } catch (Throwable $exception) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '無法建立訂單品項，請稍後再試。',
            'error' => $exception->getMessage(),
        ], 500);
    }

    $orderItem = findOrderItem($pdo, $orderItemId);
    $toolsMap = getOrderItemTools($pdo, [$orderItemId]);
    $detailsMap = getOrderItemScreeningDetails($pdo, [$orderItemId]);
    $drawingsMap = getOrderItemDrawings($pdo, [$orderItemId]);
    $attachmentsMap = getOrderItemAttachments($pdo, [$orderItemId]);

    jsonResponse([
        'success' => true,
        'message' => '訂單品項建立成功。',
        'data' => $orderItem ? transformOrderItem($orderItem, $toolsMap[$orderItemId] ?? [], $detailsMap[$orderItemId] ?? [], $drawingsMap[$orderItemId] ?? [], $attachmentsMap[$orderItemId] ?? []) : null,
    ], 201);
}
