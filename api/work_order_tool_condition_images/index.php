<?php
declare(strict_types=1);

require_once __DIR__ . '/../work_order_execution_image_common.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);
$config = [
    'table' => 'work_order_tool_condition_images',
    'label' => '工單載具狀況圖片',
    'upload_dir' => 'uploads/work_order_tool_condition_images',
    'file_prefix' => 'wo_tool',
    'audit_table' => 'work_order_tool_condition_images',
    'success_message' => '載具狀況圖片上傳成功。',
    'audit_action' => 'Uploaded tool condition work order image',
    'operation_log_action_key' => 'upload_tool_condition_image',
    'operation_log_action_label' => '上傳載具狀況圖片',
];

if ($method === 'GET') {
    handleListToolConditionImages($pdo, $config);
    return;
}

handleUploadToolConditionImage($pdo, $config);

function handleListToolConditionImages(PDO $pdo, array $config): void
{
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
    $workOrderId = (int)($_GET['work_order_id'] ?? 0);
    $offset = ($page - 1) * $limit;
    $where = ['i.deleted_at IS NULL'];
    $params = [];
    if ($workOrderId > 0) {
        $where[] = 'i.work_order_id = :work_order_id';
        $params['work_order_id'] = $workOrderId;
    }
    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM {$config['table']} i WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("
        SELECT i.*, w.work_order_number, e.name AS uploaded_by_name
        FROM {$config['table']} i
        LEFT JOIN work_orders w ON i.work_order_id = w.id
        LEFT JOIN employees e ON i.uploaded_by_employee_id = e.id
        WHERE {$whereSql}
        ORDER BY i.sort_order ASC, i.id ASC
        LIMIT :limit OFFSET :offset
    ");
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    jsonResponse([
        'success' => true,
        'data' => array_map('transformExecutionImageRecord', $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []),
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / $limit),
        ],
    ]);
}

function handleUploadToolConditionImage(PDO $pdo, array $config): void
{
    $workOrderId = (int)($_POST['work_order_id'] ?? 0);
    if ($workOrderId <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
    }
    if (!validateExecutionImageWorkOrderExists($pdo, $workOrderId)) {
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }
    if (!isset($_FILES['image'])) {
        jsonResponse(['success' => false, 'message' => '請選擇要上傳的圖片。'], 400);
    }
    $validation = validateExecutionImageFile($_FILES['image']);
    if (!$validation['valid']) {
        jsonResponse(['success' => false, 'message' => $validation['error']], 400);
    }

    $description = trim((string)($_POST['description'] ?? ''));
    $sortOrder = (int)($_POST['sort_order'] ?? 0);
    $employeeId = $_SESSION['employee']['id'] ?? ($_SESSION['employee_id'] ?? null);

    try {
        $pdo->beginTransaction();
        $baseDir = ensureExecutionImageUploadDirectory($config['upload_dir']);
        $targetDir = $baseDir . DIRECTORY_SEPARATOR . $workOrderId;
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        $file = $_FILES['image'];
        $generatedName = generateExecutionImageFileName((string)$file['name'], $workOrderId, $config['file_prefix']);
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $generatedName;
        $relativePath = trim($config['upload_dir'], '/\\') . '/' . $workOrderId . '/' . $generatedName;

        if (!move_uploaded_file((string)$file['tmp_name'], $targetPath)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '儲存圖片失敗。'], 500);
        }

        $stmt = $pdo->prepare("
            INSERT INTO {$config['table']}
            (work_order_id, file_name, file_path, file_size, mime_type, sort_order, description, uploaded_by_employee_id)
            VALUES
            (:work_order_id, :file_name, :file_path, :file_size, :mime_type, :sort_order, :description, :uploaded_by_employee_id)
        ");
        $stmt->execute([
            'work_order_id' => $workOrderId,
            'file_name' => $file['name'],
            'file_path' => $relativePath,
            'file_size' => $file['size'],
            'mime_type' => $validation['mime_type'],
            'sort_order' => $sortOrder,
            'description' => $description !== '' ? $description : null,
            'uploaded_by_employee_id' => $employeeId ?: null,
        ]);

        $imageId = (int)$pdo->lastInsertId();
        logAuditAction($config['audit_action'], $config['audit_table'], $imageId, ['work_order_id' => $workOrderId]);
        appendWorkOrderOperationLog($pdo, $workOrderId, $config['operation_log_action_key'], $config['operation_log_action_label'], [
            'related_table' => $config['table'],
            'related_id' => $imageId,
            'notes' => $description !== '' ? $description : null,
            'payload' => [
                'file_name' => $file['name'],
                'sort_order' => $sortOrder,
            ],
            'created_by_employee_id' => $employeeId ? (int)$employeeId : null,
        ]);
        $pdo->commit();

        $record = findExecutionImageRecord($pdo, $config['table'], $imageId);
        jsonResponse([
            'success' => true,
            'message' => $config['success_message'],
            'data' => $record ? transformExecutionImageRecord($record) : null,
        ], 201);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Upload tool condition image failed: ' . $e->getMessage());
        jsonResponse(['success' => false, 'message' => safeErrorMessage($e, '圖片上傳失敗，請稍後重試。')], 500);
    }
}
