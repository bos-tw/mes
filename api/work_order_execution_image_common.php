<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/**
 * @return array<string>
 */
function getExecutionImageAllowedTypes(): array
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
 * @return array<string>
 */
function getExecutionImageAllowedExtensions(): array
{
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'];
}

function getExecutionImageMaxFileSize(): int
{
    return 10 * 1024 * 1024;
}

/**
 * @param array<string,mixed> $file
 * @return array{valid: bool, error: string|null, mime_type: string|null}
 */
function validateExecutionImageFile(array $file): array
{
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

        return [
            'valid' => false,
            'error' => $errorMessages[$file['error'] ?? 0] ?? '檔案上傳失敗。',
            'mime_type' => null,
        ];
    }

    if (($file['size'] ?? 0) > getExecutionImageMaxFileSize()) {
        return [
            'valid' => false,
            'error' => '檔案大小超過限制（最大 10MB）。',
            'mime_type' => null,
        ];
    }

    $mimeType = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $result = finfo_file($finfo, (string)$file['tmp_name']);
            if ($result !== false) {
                $mimeType = $result;
            }
            finfo_close($finfo);
        }
    } elseif (function_exists('mime_content_type')) {
        $result = mime_content_type((string)$file['tmp_name']);
        if ($result !== false) {
            $mimeType = $result;
        }
    }

    if (!in_array($mimeType, getExecutionImageAllowedTypes(), true)) {
        return [
            'valid' => false,
            'error' => '不支援的圖片格式，請上傳 JPG、PNG、GIF 或 WebP 格式。',
            'mime_type' => $mimeType,
        ];
    }

    $extension = strtolower(pathinfo((string)($file['name'] ?? ''), PATHINFO_EXTENSION));
    if (!in_array($extension, getExecutionImageAllowedExtensions(), true)) {
        return [
            'valid' => false,
            'error' => '不支援的圖片副檔名。',
            'mime_type' => $mimeType,
        ];
    }

    return ['valid' => true, 'error' => null, 'mime_type' => $mimeType];
}

function ensureExecutionImageUploadDirectory(string $relativePath): string
{
    $uploadDir = __DIR__ . '/../' . trim($relativePath, '/\\');
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    return $uploadDir;
}

function generateExecutionImageFileName(string $originalName, int $workOrderId, string $prefix): string
{
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $timestamp = date('YmdHis');
    $random = bin2hex(random_bytes(4));
    return "{$prefix}_{$workOrderId}_{$timestamp}_{$random}.{$extension}";
}

function validateExecutionImageWorkOrderExists(PDO $pdo, int $workOrderId): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM work_orders WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$workOrderId]);
    return $stmt->fetchColumn() !== false;
}

/**
 * @return array<string,mixed>|null
 */
function findExecutionImageRecord(PDO $pdo, string $tableName, int $id): ?array
{
    $sql = "
        SELECT
            i.*,
            w.work_order_number,
            e.name AS uploaded_by_name
        FROM {$tableName} i
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
 * @return list<array<string,mixed>>
 */
function fetchExecutionImageRecordsByWorkOrder(PDO $pdo, string $tableName, int $workOrderId): array
{
    $sql = "
        SELECT
            i.*,
            e.name AS uploaded_by_name
        FROM {$tableName} i
        LEFT JOIN employees e ON i.uploaded_by_employee_id = e.id
        WHERE i.work_order_id = :work_order_id
          AND i.deleted_at IS NULL
        ORDER BY i.sort_order ASC, i.id ASC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['work_order_id' => $workOrderId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * @return array<string,mixed>
 */
function transformExecutionImageRecord(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'work_order_id' => (int)$row['work_order_id'],
        'work_order_number' => $row['work_order_number'] ?? null,
        'file_name' => $row['file_name'] ?? null,
        'file_path' => $row['file_path'] ?? null,
        'file_size' => isset($row['file_size']) ? (int)$row['file_size'] : null,
        'mime_type' => $row['mime_type'] ?? null,
        'sort_order' => isset($row['sort_order']) ? (int)$row['sort_order'] : 0,
        'description' => $row['description'] ?? null,
        'uploaded_at' => $row['uploaded_at'] ?? null,
        'uploaded_by_employee_id' => isset($row['uploaded_by_employee_id']) ? (int)$row['uploaded_by_employee_id'] : null,
        'uploaded_by_name' => $row['uploaded_by_name'] ?? null,
    ];
}
