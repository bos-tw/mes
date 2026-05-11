<?php
/**
 * 工單圖片 API - 共用輔助函式
 *
 * 提供工單圖片模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module work_order_images
 * @table work_order_images
 *
 * @functions
 * - getAllowedImageTypes(): 取得允許的圖片 MIME 類型
 * - getAllowedImageExtensions(): 取得允許的圖片副檔名
 * - getUploadDirectory(): 取得上傳目錄路徑
 * - getMaxImageFileSize(): 取得最大檔案大小
 * - validateImageFile(): 驗證上傳的圖片檔案
 * - generateImageFileName(): 產生唯一的檔案名稱
 * - transformWorkOrderImage(): 轉換 API 回應格式
 * - findWorkOrderImage(): 查詢單筆圖片記錄
 * - workOrderImageExists(): 檢查圖片記錄是否存在
 * - validateWorkOrderExistsForImage(): 驗證工單是否存在
 * - handleWorkOrderImageWriteException(): 統一處理 PDO 寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 取得允許的圖片 MIME 類型
 *
 * @return array<string>
 */
function getAllowedImageTypes(): array
{
    return [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ];
}

/**
 * 取得允許的圖片副檔名
 *
 * @return array<string>
 */
function getAllowedImageExtensions(): array
{
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'];
}

/**
 * 取得上傳目錄路徑
 *
 * @return string
 */
function getUploadDirectory(): string
{
    $uploadDir = __DIR__ . '/../../uploads/work_order_images/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    return $uploadDir;
}

/**
 * 取得最大檔案大小（位元組）
 *
 * @return int
 */
function getMaxImageFileSize(): int
{
    return 10 * 1024 * 1024; // 10MB
}

/**
 * 驗證上傳的圖片檔案
 *
 * @param array<string,mixed> $file $_FILES 中的檔案資訊
 * @return array{valid: bool, error: string|null, mime_type: string|null}
 */
function validateImageFile(array $file): array
{
    // 檢查上傳錯誤
    if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => '檔案大小超過伺服器限制。',
            UPLOAD_ERR_FORM_SIZE => '檔案大小超過表單限制。',
            UPLOAD_ERR_PARTIAL => '檔案只有部分被上傳。',
            UPLOAD_ERR_NO_FILE => '沒有選擇要上傳的檔案。',
            UPLOAD_ERR_NO_TMP_DIR => '缺少暫存資料夾。',
            UPLOAD_ERR_CANT_WRITE => '無法寫入檔案。',
            UPLOAD_ERR_EXTENSION => '檔案上傳被擴充功能阻止。',
        ];
        $error = $errorMessages[$file['error'] ?? 0] ?? '檔案上傳失敗。';
        return ['valid' => false, 'error' => $error, 'mime_type' => null];
    }

    // 檢查檔案大小
    $maxSize = getMaxImageFileSize();
    if ($file['size'] > $maxSize) {
        return [
            'valid' => false,
            'error' => '檔案大小超過限制（最大 ' . round($maxSize / 1024 / 1024) . 'MB）。',
            'mime_type' => null,
        ];
    }

    // 檢查 MIME 類型
    $mimeType = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
    } elseif (function_exists('mime_content_type')) {
        $mimeType = mime_content_type($file['tmp_name']);
    }

    $allowedTypes = getAllowedImageTypes();
    if (!in_array($mimeType, $allowedTypes, true)) {
        return [
            'valid' => false,
            'error' => '不支援的圖片格式，請上傳 JPG、PNG、GIF 或 WebP 格式。',
            'mime_type' => $mimeType,
        ];
    }

    // 檢查副檔名
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = getAllowedImageExtensions();
    if (!in_array($extension, $allowedExtensions, true)) {
        return [
            'valid' => false,
            'error' => '不支援的圖片副檔名。',
            'mime_type' => $mimeType,
        ];
    }

    return ['valid' => true, 'error' => null, 'mime_type' => $mimeType];
}

/**
 * 產生唯一的檔案名稱
 *
 * @param string $originalName 原始檔名
 * @param int $workOrderId 工單 ID
 * @return string
 */
function generateImageFileName(string $originalName, int $workOrderId): string
{
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $timestamp = date('YmdHis');
    $random = bin2hex(random_bytes(4));
    return "wo_{$workOrderId}_{$timestamp}_{$random}.{$extension}";
}

/**
 * 轉換工單圖片資料為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫記錄
 * @return array<string,mixed>
 */
function transformWorkOrderImage(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'work_order_id' => (int)$row['work_order_id'],
        'work_order_number' => $row['work_order_number'] ?? null,
        'image_type' => $row['image_type'],
        'file_path' => $row['file_path'],
        'description' => $row['description'],
        'sort_order' => (int)($row['sort_order'] ?? 0),
        'uploaded_at' => $row['uploaded_at'],
        'uploaded_by_employee_id' => $row['uploaded_by_employee_id'] ? (int)$row['uploaded_by_employee_id'] : null,
        'uploaded_by_name' => $row['uploaded_by_name'] ?? null,
    ];
}

/**
 * 查詢單筆工單圖片（含關聯資料）
 *
 * @param PDO $pdo
 * @param int $id
 * @return array|null
 */
function findWorkOrderImage(PDO $pdo, int $id): ?array
{
    $sql = "
        SELECT
            i.id,
            i.work_order_id,
            w.work_order_number,
            i.image_type,
            i.file_path,
            i.description,
            i.sort_order,
            i.uploaded_at,
            i.uploaded_by_employee_id,
            e.name AS uploaded_by_name
        FROM work_order_images i
        LEFT JOIN work_orders w ON i.work_order_id = w.id
        LEFT JOIN employees e ON i.uploaded_by_employee_id = e.id
        WHERE i.id = :id AND i.deleted_at IS NULL
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

/**
 * 檢查工單圖片記錄是否存在
 *
 * @param PDO $pdo
 * @param int $id
 * @return bool
 */
function workOrderImageExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_order_images WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 驗證工單是否存在
 *
 * @param PDO $pdo
 * @param int $workOrderId
 * @return bool
 */
function validateWorkOrderExistsForImage(PDO $pdo, int $workOrderId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_orders WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$workOrderId]);
    return $stmt->fetchColumn() !== false;
}

/**
 * 統一處理 PDO 寫入例外
 *
 * @param PDOException $e
 * @return array<string,mixed>
 */
function handleWorkOrderImageWriteException(PDOException $e): array
{
    $code = $e->getCode();
    $message = $e->getMessage();

    error_log("WorkOrderImage PDO Exception: [{$code}] {$message}");

    // 外鍵約束
    if ($code === '23000' && str_contains($message, 'foreign key constraint')) {
        return [
            'success' => false,
            'message' => '關聯資料不存在（工單）。',
        ];
    }

    return [
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
    ];
}
