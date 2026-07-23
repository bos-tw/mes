<?php
/**
 * 機台結果圖片。
 *
 * @endpoint GET    /api/work_orders/result_images.php?machine_result_id={id}
 * @endpoint POST   /api/work_orders/result_images.php
 * @endpoint DELETE /api/work_orders/result_images.php?id={image_id}
 */
declare(strict_types=1);

require_once __DIR__ . '/../work_order_execution_image_common.php';
require_once __DIR__ . '/flow_helpers.php';
require_once __DIR__ . '/../work_order_operation_logs_helper.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST', 'DELETE']);

try {
    if ($method === 'GET') {
        $machineResultId = workOrderFlowPositiveId($_GET['machine_result_id'] ?? null, '機台結果ID');
        $stmt = $pdo->prepare("
            SELECT image_row.*, employee.name AS uploaded_by_name
            FROM work_order_machine_result_images image_row
            LEFT JOIN employees employee ON employee.id = image_row.uploaded_by_employee_id
            WHERE image_row.machine_result_id = :machine_result_id
              AND image_row.deleted_at IS NULL
            ORDER BY image_row.sort_order, image_row.id
        ");
        $stmt->execute(['machine_result_id' => $machineResultId]);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC) ?: []]);
        return;
    }

    $pdo->beginTransaction();
    $employeeId = workOrderFlowRequireEmployeeId();
    if ($method === 'POST') {
        $machineResultId = workOrderFlowPositiveId($_POST['machine_result_id'] ?? null, '機台結果ID');
        $resultStmt = $pdo->prepare("
            SELECT result_row.id, result_row.work_order_id, result_row.machine_run_id, result_row.result_status
            FROM work_order_machine_results result_row
            WHERE result_row.id = :id
            LIMIT 1
            FOR UPDATE
        ");
        $resultStmt->execute(['id' => $machineResultId]);
        $result = $resultStmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            throw new WorkOrderFlowException('找不到指定的機台結果。', 404);
        }
        if ($result['result_status'] !== 'draft') {
            throw new WorkOrderFlowException('已確認結果的圖片不可直接增刪，請建立更正版本。', 409);
        }
        if (!isset($_FILES['image'])) {
            throw new WorkOrderFlowException('請選擇要上傳的圖片。', 400);
        }
        $validation = validateExecutionImageFile($_FILES['image']);
        if (!$validation['valid']) {
            throw new WorkOrderFlowException((string)$validation['error'], 400);
        }

        $file = $_FILES['image'];
        $baseDir = ensureExecutionImageUploadDirectory('uploads/work_order_machine_results');
        $targetDir = $baseDir . DIRECTORY_SEPARATOR . $machineResultId;
        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new WorkOrderFlowException('無法建立圖片儲存目錄。', 500);
        }
        $generatedName = generateExecutionImageFileName(
            (string)$file['name'],
            $machineResultId,
            'wo_machine_result'
        );
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $generatedName;
        $relativePath = 'uploads/work_order_machine_results/' . $machineResultId . '/' . $generatedName;
        if (!move_uploaded_file((string)$file['tmp_name'], $targetPath)) {
            throw new WorkOrderFlowException('儲存圖片失敗。', 500);
        }

        $stmt = $pdo->prepare("
            INSERT INTO work_order_machine_result_images (
                machine_result_id, image_type, file_name, file_path,
                file_size, mime_type, sort_order, description,
                uploaded_by_employee_id
            ) VALUES (
                :machine_result_id, :image_type, :file_name, :file_path,
                :file_size, :mime_type, :sort_order, :description,
                :uploaded_by_employee_id
            )
        ");
        $stmt->execute([
            'machine_result_id' => $machineResultId,
            'image_type' => mb_substr(trim((string)($_POST['image_type'] ?? 'machine_screen')), 0, 30),
            'file_name' => (string)$file['name'],
            'file_path' => $relativePath,
            'file_size' => (int)$file['size'],
            'mime_type' => $validation['mime_type'],
            'sort_order' => (int)($_POST['sort_order'] ?? 0),
            'description' => nullableResultImageText($_POST['description'] ?? null),
            'uploaded_by_employee_id' => $employeeId,
        ]);
        $imageId = (int)$pdo->lastInsertId();
        appendWorkOrderOperationLog($pdo, (int)$result['work_order_id'], 'upload_machine_result_image', '上傳機台結果圖片', [
            'related_table' => 'work_order_machine_result_images',
            'related_id' => $imageId,
            'payload' => [
                'machine_result_id' => $machineResultId,
                'file_name' => $file['name'],
            ],
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Uploaded work order machine result image', 'work_order_machine_result_images', $imageId, [
            'work_order_id' => (int)$result['work_order_id'],
            'machine_result_id' => $machineResultId,
        ]);
        $message = '機台結果圖片上傳成功。';
        $workOrderId = (int)$result['work_order_id'];
        $statusCode = 201;
    } else {
        $imageId = workOrderFlowPositiveId($_GET['id'] ?? null, '圖片ID');
        $imageStmt = $pdo->prepare("
            SELECT image_row.id, image_row.machine_result_id,
                   result_row.work_order_id, result_row.result_status
            FROM work_order_machine_result_images image_row
            JOIN work_order_machine_results result_row ON result_row.id = image_row.machine_result_id
            WHERE image_row.id = :id
              AND image_row.deleted_at IS NULL
            LIMIT 1
            FOR UPDATE
        ");
        $imageStmt->execute(['id' => $imageId]);
        $image = $imageStmt->fetch(PDO::FETCH_ASSOC);
        if (!$image) {
            throw new WorkOrderFlowException('找不到指定圖片。', 404);
        }
        if ($image['result_status'] !== 'draft') {
            throw new WorkOrderFlowException('已確認結果的圖片不可直接刪除。', 409);
        }
        $pdo->prepare("
            UPDATE work_order_machine_result_images
            SET deleted_at = NOW()
            WHERE id = :id
        ")->execute(['id' => $imageId]);
        appendWorkOrderOperationLog($pdo, (int)$image['work_order_id'], 'remove_machine_result_image', '移除機台結果圖片', [
            'related_table' => 'work_order_machine_result_images',
            'related_id' => $imageId,
            'created_by_employee_id' => $employeeId,
        ]);
        logAuditAction('Removed work order machine result image', 'work_order_machine_result_images', $imageId, [
            'work_order_id' => (int)$image['work_order_id'],
            'machine_result_id' => (int)$image['machine_result_id'],
        ]);
        $message = '機台結果圖片已移除。';
        $workOrderId = (int)$image['work_order_id'];
        $statusCode = 200;
    }

    $pdo->commit();
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => fetchWorkOrderFlow($pdo, $workOrderId),
    ], $statusCode);
} catch (Throwable $throwable) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    respondWorkOrderFlowFailure($throwable, '處理機台結果圖片失敗，請稍後重試。');
}

function nullableResultImageText($value): ?string
{
    $text = trim((string)($value ?? ''));
    return $text === '' ? null : mb_substr($text, 0, 2000);
}
