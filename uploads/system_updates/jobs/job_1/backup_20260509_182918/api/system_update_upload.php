<?php
/**
 * 系統更新上傳 API
 *
 * @endpoint POST /api/system_update_upload.php
 *
 * @auth 必須登入
 * @table system_update_jobs
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/system_update_common.php';

$employee = requireAuth();
requireMethod('POST');

if (!isset($_FILES['update_package'])) {
    jsonResponse([
        'success' => false,
        'message' => '請先選擇更新壓縮檔。',
    ], 400);
}

$file = $_FILES['update_package'];
$errorCode = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
if ($errorCode !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => '檔案大小超過伺服器限制。',
        UPLOAD_ERR_FORM_SIZE => '檔案大小超過表單限制。',
        UPLOAD_ERR_PARTIAL => '檔案僅部分上傳完成。',
        UPLOAD_ERR_NO_FILE => '沒有檔案被上傳。',
        UPLOAD_ERR_NO_TMP_DIR => '找不到暫存資料夾。',
        UPLOAD_ERR_CANT_WRITE => '暫存檔寫入失敗。',
        UPLOAD_ERR_EXTENSION => '檔案上傳被系統阻擋。',
    ];

    jsonResponse([
        'success' => false,
        'message' => $errorMessages[$errorCode] ?? '更新檔上傳失敗。',
    ], 400);
}

$originalName = trim((string)($file['name'] ?? ''));
if ($originalName === '') {
    jsonResponse([
        'success' => false,
        'message' => '更新檔名稱無效。',
    ], 400);
}

$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
if ($extension !== 'zip') {
    jsonResponse([
        'success' => false,
        'message' => '僅支援 ZIP 格式更新檔。',
    ], 400);
}

$maxBytes = 300 * 1024 * 1024; // 300MB
$fileSize = (int)($file['size'] ?? 0);
if ($fileSize <= 0 || $fileSize > $maxBytes) {
    jsonResponse([
        'success' => false,
        'message' => '更新檔大小需介於 1 byte 到 300MB 之間。',
    ], 400);
}

try {
    $storageRoot = systemUpdateStorageRoot();
    $packageDir = $storageRoot . '/packages';
    ensureDirectoryExists($storageRoot);
    ensureDirectoryExists($packageDir);

    $storedName = 'update_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.zip';
    $relativePackagePath = 'uploads/system_updates/packages/' . $storedName;
    $absolutePackagePath = systemUpdateProjectRoot() . '/' . $relativePackagePath;

    if (!move_uploaded_file($file['tmp_name'], $absolutePackagePath)) {
        throw new RuntimeException('儲存更新壓縮檔失敗。');
    }

    $sha256 = hash_file('sha256', $absolutePackagePath);
    if ($sha256 === false) {
        @unlink($absolutePackagePath);
        throw new RuntimeException('計算更新檔雜湊失敗。');
    }

    $manifest = parseSystemUpdateManifestFromZip($absolutePackagePath);

    $pdo = db();
    if (!systemUpdateTableExists($pdo, 'system_update_jobs')) {
        jsonResponse([
            'success' => false,
            'message' => '系統更新模組尚未初始化，請先執行 migration：2026_05_09_create_system_update_jobs.sql。',
        ], 503);
    }

    $createdBy = (string)($employee['name'] ?? $employee['account'] ?? 'system');

    $jobId = createSystemUpdateJob($pdo, [
        'package_name' => $originalName,
        'package_path' => $relativePackagePath,
        'package_sha256' => $sha256,
        'package_size' => $fileSize,
        'status' => 'validated',
        'version_number' => $manifest['version_number'],
        'file_version' => $manifest['file_version'],
        'release_date' => $manifest['release_date'],
        'change_summary' => $manifest['change_summary'],
        'files_root' => $manifest['files_root'],
        'migration_files' => $manifest['migrations'],
        'file_count' => $manifest['file_count'],
        'result_message' => '更新包已上傳並通過驗證。',
        'created_by' => $createdBy,
    ]);

    $job = getSystemUpdateJob($pdo, $jobId);

    logAuditAction('上傳系統更新包', 'system_update_jobs', $jobId, [
        'version_number' => $manifest['version_number'],
        'file_count' => $manifest['file_count'],
        'migration_count' => count($manifest['migrations']),
    ]);

    jsonResponse([
        'success' => true,
        'message' => '更新包上傳完成，已通過驗證。',
        'data' => [
            'job' => $job,
            'manifest' => $manifest,
        ],
    ]);
} catch (Throwable $exception) {
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception instanceof Exception ? $exception : new RuntimeException($exception->getMessage()), '上傳更新包失敗。'),
    ], 500);
}
