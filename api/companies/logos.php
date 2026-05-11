<?php
/**
 * 公司 LOGO 管理 API
 *
 * 提供公司 LOGO 的列表查詢、上傳、啟用設定及刪除功能。
 *
 * @endpoint GET    /api/companies/logos.php?company_id={id}   取得公司所有 LOGO
 * @endpoint POST   /api/companies/logos.php                   上傳新 LOGO
 * @endpoint PUT    /api/companies/logos.php?id={logo_id}      設定啟用狀態
 * @endpoint DELETE /api/companies/logos.php?id={logo_id}      刪除 LOGO
 *
 * @auth 必須登入
 * @table company_logos, companies
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

$method = requireMethod(['GET', 'POST', 'PUT', 'DELETE']);

switch ($method) {
    case 'GET':
        handleListLogos();
        break;
    case 'POST':
        handleUploadLogo();
        break;
    case 'PUT':
        handleUpdateLogo();
        break;
    case 'DELETE':
        handleDeleteLogo();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

/**
 * GET - 取得公司 LOGO 列表
 */
function handleListLogos(): void
{
    $companyId = isset($_GET['company_id']) ? (int)$_GET['company_id'] : 0;

    if ($companyId <= 0) {
        jsonResponse(['success' => false, 'message' => '請提供有效的公司 ID。'], 400);
    }

    $pdo = db();

    // 驗證公司存在
    $companyStmt = $pdo->prepare("SELECT id FROM companies WHERE id = :id AND deleted_at IS NULL");
    $companyStmt->execute(['id' => $companyId]);
    if (!$companyStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '找不到指定的公司。'], 404);
    }

    // 取得 LOGO 列表
    $sql = "
        SELECT
            l.id,
            l.company_id,
            l.file_name,
            l.file_path,
            l.file_size,
            l.mime_type,
            l.is_active,
            l.sort_order,
            l.uploaded_at,
            e.name AS uploaded_by_name
        FROM company_logos l
        LEFT JOIN employees e ON l.uploaded_by_employee_id = e.id
        WHERE l.company_id = :company_id AND l.deleted_at IS NULL
        ORDER BY l.is_active DESC, l.sort_order ASC, l.uploaded_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['company_id' => $companyId]);
    $logos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 轉換 is_active 為布林值
    foreach ($logos as &$logo) {
        $logo['is_active'] = (bool)$logo['is_active'];
    }

    jsonResponse([
        'success' => true,
        'data' => $logos,
    ]);
}

/**
 * POST - 上傳新 LOGO
 */
function handleUploadLogo(): void
{
    $companyId = isset($_POST['company_id']) ? (int)$_POST['company_id'] : 0;
    $setActive = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 0;

    if ($companyId <= 0) {
        jsonResponse(['success' => false, 'message' => '請提供有效的公司 ID。'], 400);
    }

    $pdo = db();

    // 驗證公司存在
    $companyStmt = $pdo->prepare("SELECT id FROM companies WHERE id = :id AND deleted_at IS NULL");
    $companyStmt->execute(['id' => $companyId]);
    if (!$companyStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '找不到指定的公司。'], 404);
    }

    // 檢查檔案上傳
    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => '檔案大小超過伺服器限制。',
            UPLOAD_ERR_FORM_SIZE => '檔案大小超過表單限制。',
            UPLOAD_ERR_PARTIAL => '檔案只有部分被上傳。',
            UPLOAD_ERR_NO_FILE => '沒有檔案被上傳。',
            UPLOAD_ERR_NO_TMP_DIR => '找不到暫存資料夾。',
            UPLOAD_ERR_CANT_WRITE => '檔案寫入失敗。',
            UPLOAD_ERR_EXTENSION => '檔案上傳被擴充功能阻止。',
        ];
        $errorCode = $_FILES['logo']['error'] ?? UPLOAD_ERR_NO_FILE;
        $message = $errorMessages[$errorCode] ?? '檔案上傳失敗。';
        jsonResponse(['success' => false, 'message' => $message], 400);
    }

    $file = $_FILES['logo'];

    // 驗證檔案類型
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    $mimeType = '';

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $result = finfo_file($finfo, $file['tmp_name']);
            if ($result !== false) {
                $mimeType = $result;
            }
            finfo_close($finfo);
        }
    }

    if (!$mimeType && function_exists('mime_content_type')) {
        $result = mime_content_type($file['tmp_name']);
        if ($result !== false) {
            $mimeType = $result;
        }
    }

    if (!$mimeType) {
        $mimeType = $file['type'] ?? '';
    }

    if (!in_array($mimeType, $allowedTypes)) {
        jsonResponse(['success' => false, 'message' => '不支援的圖片格式。僅支援 PNG, JPG, SVG, WebP。'], 400);
    }

    // 驗證檔案大小 (最大 2MB)
    $maxSize = 2 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        jsonResponse(['success' => false, 'message' => '圖片大小不可超過 2MB。'], 400);
    }

    try {
        $pdo->beginTransaction();

        // 建立上傳目錄
        $uploadDir = __DIR__ . '/../../uploads/company_logos/' . $companyId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // 產生唯一檔名
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'logo_' . uniqid() . '.' . $extension;
        $filePath = $uploadDir . '/' . $fileName;
        $relativeFilePath = 'uploads/company_logos/' . $companyId . '/' . $fileName;

        // 移動上傳檔案
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '儲存圖片失敗。'], 500);
            return;
        }

        // 如果要設為啟用，先停用其他 LOGO
        if ($setActive) {
            $deactivateStmt = $pdo->prepare("
                UPDATE company_logos SET is_active = 0 WHERE company_id = :company_id AND deleted_at IS NULL
            ");
            $deactivateStmt->execute(['company_id' => $companyId]);
        }

        // 取得目前員工 ID
        $employeeId = $_SESSION['employee_id'] ?? null;

        // 新增資料庫記錄
        $stmt = $pdo->prepare("
            INSERT INTO company_logos
            (company_id, file_name, file_path, file_size, mime_type, is_active, uploaded_by_employee_id)
            VALUES
            (:company_id, :file_name, :file_path, :file_size, :mime_type, :is_active, :uploaded_by_employee_id)
        ");

        $stmt->execute([
            'company_id' => $companyId,
            'file_name' => $file['name'],
            'file_path' => $relativeFilePath,
            'file_size' => $file['size'],
            'mime_type' => $mimeType,
            'is_active' => $setActive,
            'uploaded_by_employee_id' => $employeeId,
        ]);

        $logoId = (int)$pdo->lastInsertId();

        logAuditAction('Uploaded company logo', 'CompanyLogos', $logoId, [
            'company_id' => $companyId,
            'file_name' => $file['name'],
        ]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => 'LOGO 上傳成功。',
            'data' => [
                'id' => $logoId,
                'file_path' => $relativeFilePath,
            ],
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Logo upload error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}

/**
 * PUT - 更新 LOGO（設定啟用狀態）
 */
function handleUpdateLogo(): void
{
    $logoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($logoId <= 0) {
        jsonResponse(['success' => false, 'message' => '請提供有效的 LOGO ID。'], 400);
    }

    $input = getJsonInput();
    $setActive = isset($input['is_active']) ? (int)$input['is_active'] : null;

    if ($setActive === null) {
        jsonResponse(['success' => false, 'message' => '請提供 is_active 參數。'], 400);
    }

    $pdo = db();

    // 取得 LOGO 資訊
    $logoStmt = $pdo->prepare("
        SELECT id, company_id, is_active FROM company_logos WHERE id = :id AND deleted_at IS NULL
    ");
    $logoStmt->execute(['id' => $logoId]);
    $logo = $logoStmt->fetch(PDO::FETCH_ASSOC);

    if (!$logo) {
        jsonResponse(['success' => false, 'message' => '找不到指定的 LOGO。'], 404);
    }

    try {
        $pdo->beginTransaction();

        if ($setActive) {
            // 先停用同公司其他 LOGO
            $deactivateStmt = $pdo->prepare("
                UPDATE company_logos SET is_active = 0 WHERE company_id = :company_id AND deleted_at IS NULL
            ");
            $deactivateStmt->execute(['company_id' => $logo['company_id']]);
        }

        // 更新此 LOGO 的啟用狀態
        $updateStmt = $pdo->prepare("UPDATE company_logos SET is_active = :is_active WHERE id = :id");
        $updateStmt->execute(['is_active' => $setActive, 'id' => $logoId]);

        logAuditAction($setActive ? 'Activated company logo' : 'Deactivated company logo', 'CompanyLogos', $logoId, [
            'company_id' => $logo['company_id'],
        ]);

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => $setActive ? '已設定為使用中的 LOGO。' : 'LOGO 已停用。',
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Logo update error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}

/**
 * DELETE - 刪除 LOGO（硬刪除）
 */
function handleDeleteLogo(): void
{
    $logoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($logoId <= 0) {
        jsonResponse(['success' => false, 'message' => '請提供有效的 LOGO ID。'], 400);
    }

    $pdo = db();

    // 取得 LOGO 資訊
    $logoStmt = $pdo->prepare("
        SELECT id, company_id, file_path, is_active FROM company_logos WHERE id = :id
    ");
    $logoStmt->execute(['id' => $logoId]);
    $logo = $logoStmt->fetch(PDO::FETCH_ASSOC);

    if (!$logo) {
        jsonResponse(['success' => false, 'message' => '找不到指定的 LOGO。'], 404);
    }

    // 檢查是否為使用中的 LOGO
    if ($logo['is_active']) {
        jsonResponse(['success' => false, 'message' => '無法刪除使用中的 LOGO，請先設定其他 LOGO 為使用中。'], 400);
    }

    try {
        // 刪除實體檔案
        $filePath = __DIR__ . '/../../' . $logo['file_path'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }

        // 從資料庫刪除記錄
        $deleteStmt = $pdo->prepare("DELETE FROM company_logos WHERE id = :id");
        $deleteStmt->execute(['id' => $logoId]);

        logAuditAction('Deleted company logo', 'CompanyLogos', $logoId, [
            'company_id' => $logo['company_id'],
            'file_path' => $logo['file_path'],
        ]);

        jsonResponse([
            'success' => true,
            'message' => 'LOGO 已刪除。',
        ]);

    } catch (Exception $e) {
        error_log("Logo delete error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}
