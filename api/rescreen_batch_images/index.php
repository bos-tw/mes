<?php
declare(strict_types=1);

require_once __DIR__ . '/../work_order_execution_image_common.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);

if ($method === 'GET') {
    $batchId = (int)($_GET['rescreen_batch_id'] ?? 0);
    $where = ['i.deleted_at IS NULL'];
    $params = [];
    if ($batchId > 0) {
        $where[] = 'i.rescreen_batch_id = :rescreen_batch_id';
        $params['rescreen_batch_id'] = $batchId;
    }
    $stmt = $pdo->prepare("
        SELECT i.*, e.name AS uploaded_by_name
        FROM rescreen_batch_images i
        LEFT JOIN employees e ON e.id = i.uploaded_by_employee_id
        WHERE " . implode(' AND ', $where) . "
        ORDER BY i.sort_order ASC, i.id ASC
    ");
    $stmt->execute($params);
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []]);
}

$batchId = (int)($_POST['rescreen_batch_id'] ?? 0);
if ($batchId <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少有效的二次篩選案件 ID。'], 400);
}
$batchStmt = $pdo->prepare('SELECT id FROM rescreen_batches WHERE id = :id AND deleted_at IS NULL');
$batchStmt->execute(['id' => $batchId]);
if (!$batchStmt->fetchColumn()) {
    jsonResponse(['success' => false, 'message' => '找不到指定的二次篩選案件。'], 404);
}
if (!isset($_FILES['image'])) {
    jsonResponse(['success' => false, 'message' => '請選擇要上傳的圖片。'], 400);
}

$validation = validateExecutionImageFile($_FILES['image']);
if (!$validation['valid']) {
    jsonResponse(['success' => false, 'message' => $validation['error']], 400);
}

$imageType = trim((string)($_POST['image_type'] ?? 'site')) ?: 'site';
$description = trim((string)($_POST['description'] ?? ''));
$sortOrder = (int)($_POST['sort_order'] ?? 0);
$employeeId = $_SESSION['employee']['id'] ?? ($_SESSION['employee_id'] ?? null);

try {
    $pdo->beginTransaction();
    $baseDir = ensureExecutionImageUploadDirectory('uploads/rescreen_batch_images');
    $targetDir = $baseDir . DIRECTORY_SEPARATOR . $batchId;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $file = $_FILES['image'];
    $generatedName = generateExecutionImageFileName((string)$file['name'], $batchId, 'rescreen');
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $generatedName;
    $relativePath = 'uploads/rescreen_batch_images/' . $batchId . '/' . $generatedName;

    if (!move_uploaded_file((string)$file['tmp_name'], $targetPath)) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => '儲存圖片失敗。'], 500);
    }

    $stmt = $pdo->prepare("
        INSERT INTO rescreen_batch_images
        (rescreen_batch_id, image_type, file_name, file_path, file_size, mime_type, sort_order, description, uploaded_by_employee_id)
        VALUES
        (:rescreen_batch_id, :image_type, :file_name, :file_path, :file_size, :mime_type, :sort_order, :description, :uploaded_by_employee_id)
    ");
    $stmt->execute([
        'rescreen_batch_id' => $batchId,
        'image_type' => mb_substr($imageType, 0, 30),
        'file_name' => $file['name'],
        'file_path' => $relativePath,
        'file_size' => $file['size'],
        'mime_type' => $validation['mime_type'],
        'sort_order' => $sortOrder,
        'description' => $description !== '' ? $description : null,
        'uploaded_by_employee_id' => $employeeId ?: null,
    ]);

    $imageId = (int)$pdo->lastInsertId();
    logAuditAction('Upload rescreen batch image', 'rescreen_batch_images', $imageId, ['rescreen_batch_id' => $batchId]);
    $pdo->commit();

    jsonResponse(['success' => true, 'message' => '二次篩選圖片已上傳。', 'data' => ['id' => $imageId]], 201);
} catch (Exception $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Upload rescreen batch image failed: ' . $exception->getMessage());
    jsonResponse(['success' => false, 'message' => safeErrorMessage($exception, '圖片上傳失敗，請稍後重試。')], 500);
}
