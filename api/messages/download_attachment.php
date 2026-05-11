<?php
/**
 * 附件下載 API
 *
 * 提供訊息附件的安全下載功能。
 *
 * @endpoint GET /api/messages/download_attachment.php?id={id}
 *
 * @auth 必須登入，且為訊息的發送者或收件者
 *
 * @input Query string
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 附件 ID |
 *
 * @output 成功回應
 * - 檔案內容（Content-Type 對應檔案類型）
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();

// 取得附件 ID
$attachmentId = (int)($_GET['id'] ?? 0);
if ($attachmentId <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '附件 ID 無效。',
    ], 400);
}

// 查詢附件
$attachment = findAttachment($attachmentId);
if (!$attachment) {
    jsonResponse([
        'success' => false,
        'message' => '附件不存在。',
    ], 404);
}

// 檢查存取權限
$access = checkMessageAccess((int)$attachment['message_id'], (int)$currentUser['id']);
if (!$access['can_access']) {
    jsonResponse([
        'success' => false,
        'message' => '您沒有權限下載此附件。',
    ], 403);
}

// 取得檔案路徑
$filePath = MESSAGE_ATTACHMENTS_DIR . $attachment['file_path'];
if (!file_exists($filePath)) {
    jsonResponse([
        'success' => false,
        'message' => '檔案不存在。',
    ], 404);
}

// 設定下載標頭
$mimeType = $attachment['mime_type'] ?: 'application/octet-stream';
$fileName = $attachment['file_name'];
$fileSize = filesize($filePath);

// 判斷是否為行內顯示模式（圖片預覽）
$inline = isset($_GET['inline']) && $_GET['inline'] === '1';
$isImage = str_starts_with($mimeType, 'image/');

// 清除之前的輸出緩衝
while (ob_get_level()) {
    ob_end_clean();
}

// 設定標頭
header('Content-Type: ' . $mimeType);

if ($inline && $isImage) {
    // 行內顯示模式（圖片預覽）
    header('Content-Disposition: inline; filename="' . rawurlencode($fileName) . '"; filename*=UTF-8\'\'' . rawurlencode($fileName));
    header('Cache-Control: private, max-age=3600');
} else {
    // 強制下載模式
    header('Content-Disposition: attachment; filename="' . rawurlencode($fileName) . '"; filename*=UTF-8\'\'' . rawurlencode($fileName));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
}

header('Content-Length: ' . $fileSize);
header('Content-Transfer-Encoding: binary');

// 輸出檔案
readfile($filePath);
exit;
