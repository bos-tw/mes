<?php
/**
 * 工單圖片管理 API - 列表與上傳端點
 *
 * 提供工單相關圖片的列表查詢（含分頁、篩選）及上傳功能。
 *
 * @endpoint GET  /api/work_order_images/          取得圖片列表
 * @endpoint POST /api/work_order_images/          上傳圖片
 *
 * @auth 必須登入
 * @table work_order_images, work_orders
 *
 * @input GET (Query string)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | page          | int    | N    | 頁碼，預設 1 |
 * | limit         | int    | N    | 每頁筆數，預設 20 |
 * | keyword       | string | N    | 關鍵字搜尋（工單號、描述）|
 * | image_type    | string | N    | 圖片類型篩選 |
 * | start_date    | string | N    | 上傳日期起始 |
 * | end_date      | string | N    | 上傳日期結束 |
 * | work_order_id | int    | N    | 依工單 ID 篩選 |
 *
 * @input POST (multipart/form-data)
 * | 參數          | 類型   | 必填 | 說明 |
 * |---------------|--------|------|------|
 * | work_order_id | int    | Y    | 工單 ID |
 * | image         | file   | Y    | 圖片檔案 |
 * | image_type    | string | N    | 圖片類型 |
 * | description   | string | N    | 描述 |
 * | sort_order    | int    | N    | 排序順序 |
 *
 * @output 成功回應 (GET)
 * ```json
 * {
 *   "success": true,
 *   "data": [{
 *     "id": 1,
 *     "work_order_id": 100,
 *     "work_order_number": "WO-001",
 *     "file_path": "/uploads/work_order_images/xxx.jpg",
 *     "image_type": "defect",
 *     "uploaded_at": "2024-01-01 10:00:00"
 *   }],
 *   "pagination": {"page": 1, "limit": 20, "total": 50, "totalPages": 3}
 * }
 * ```
 *
 * @error 400 請提供工單 ID / 請選擇要上傳的圖片
 * @error 404 找不到指定的工單
 * @error 405 不支援的請求方法
 * @error 500 圖片上傳失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$pdo = db();
$method = requireMethod(['GET', 'POST']);

switch ($method) {
    case 'GET':
        handleListImages($pdo);
        break;
    case 'POST':
        handleUploadImage($pdo);
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法。'], 405);
}

/**
 * Handle GET - List images
 */
function handleListImages(PDO $pdo): void
{
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $imageType = isset($_GET['image_type']) ? trim($_GET['image_type']) : '';
    $startDate = isset($_GET['start_date']) ? trim($_GET['start_date']) : '';
    $endDate = isset($_GET['end_date']) ? trim($_GET['end_date']) : '';
    $workOrderId = isset($_GET['work_order_id']) ? (int)$_GET['work_order_id'] : 0;

    $offset = ($page - 1) * $limit;

    $where = ["i.deleted_at IS NULL"];
    $params = [];

    if ($workOrderId > 0) {
        $where[] = "i.work_order_id = :work_order_id";
        $params['work_order_id'] = $workOrderId;
    }

    if ($keyword !== '') {
        $where[] = "(w.work_order_number LIKE :keyword OR i.description LIKE :keyword)";
        $params['keyword'] = "%$keyword%";
    }

    if ($imageType !== '') {
        $where[] = "i.image_type = :image_type";
        $params['image_type'] = $imageType;
    }

    if ($startDate !== '') {
        $where[] = "DATE(i.uploaded_at) >= :start_date";
        $params['start_date'] = $startDate;
    }

    if ($endDate !== '') {
        $where[] = "DATE(i.uploaded_at) <= :end_date";
        $params['end_date'] = $endDate;
    }

    $whereClause = implode(' AND ', $where);

    // Count total
    $countSql = "
        SELECT COUNT(*)
        FROM work_order_images i
        LEFT JOIN work_orders w ON i.work_order_id = w.id
        WHERE $whereClause
    ";
    $stmt = $pdo->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();

    // Fetch data
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
            e.name as uploaded_by_name
        FROM work_order_images i
        LEFT JOIN work_orders w ON i.work_order_id = w.id
        LEFT JOIN employees e ON i.uploaded_by_employee_id = e.id
        WHERE $whereClause
        ORDER BY i.uploaded_at DESC, i.id DESC
        LIMIT :limit OFFSET :offset
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Handle POST - Upload image
 */
function handleUploadImage(PDO $pdo): void
{
    $workOrderId = isset($_POST['work_order_id']) ? (int)$_POST['work_order_id'] : 0;

    if ($workOrderId <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的工單ID。'], 400);
    }

    // Validate work order exists
    $woStmt = $pdo->prepare("SELECT id FROM work_orders WHERE id = :id AND deleted_at IS NULL");
    $woStmt->execute(['id' => $workOrderId]);
    if (!$woStmt->fetch()) {
        jsonResponse(['success' => false, 'message' => '找不到該工單。'], 404);
    }

    // Check if file was uploaded
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        jsonResponse(['success' => false, 'message' => '圖片上傳失敗。'], 400);
    }

    $file = $_FILES['image'];
    $imageType = $_POST['image_type'] ?? 'general';
    $sortOrder = isset($_POST['sort_order']) ? (int)$_POST['sort_order'] : 0;
    $description = $_POST['description'] ?? '';

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
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
        jsonResponse(['success' => false, 'message' => '不支援的圖片格式。僅支援 JPG, PNG, GIF, WebP。'], 400);
    }

    // Validate file size (max 10MB)
    $maxSize = 10 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        jsonResponse(['success' => false, 'message' => '圖片大小不可超過 10MB。'], 400);
    }

    try {
        $pdo->beginTransaction();

        // Create upload directory if not exists
        $uploadDir = __DIR__ . '/../../uploads/work_orders/' . $workOrderId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = uniqid('wo_img_') . '.' . $extension;
        $filePath = $uploadDir . '/' . $fileName;
        $relativeFilePath = 'uploads/work_orders/' . $workOrderId . '/' . $fileName;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => '儲存圖片失敗。'], 500);
            return;
        }

        // Get current user (employee_id from session)
        $employeeId = $_SESSION['employee_id'] ?? null;

        // Insert database record
        $stmt = $pdo->prepare("
            INSERT INTO work_order_images
            (work_order_id, image_type, file_name, file_path, file_size, mime_type, sort_order, description, uploaded_by_employee_id)
            VALUES
            (:work_order_id, :image_type, :file_name, :file_path, :file_size, :mime_type, :sort_order, :description, :uploaded_by_employee_id)
        ");

        $stmt->execute([
            'work_order_id' => $workOrderId,
            'image_type' => $imageType,
            'file_name' => $file['name'],
            'file_path' => $relativeFilePath,
            'file_size' => $file['size'],
            'mime_type' => $mimeType,
            'sort_order' => $sortOrder,
            'description' => $description,
            'uploaded_by_employee_id' => $employeeId
        ]);

        $imageId = (int)$pdo->lastInsertId();

        logAuditAction('Uploaded work order image', 'WorkOrderImages', $imageId, [
            'work_order_id' => $workOrderId,
            'file_name' => $file['name']
        ]);

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => '圖片上傳成功。']);

    } catch (Exception $e) {
        $pdo->rollBack();
        error_log("Upload error: " . $e->getMessage());
        jsonResponse(['success' => false, 'message' => '系統發生錯誤。'], 500);
    }
}
