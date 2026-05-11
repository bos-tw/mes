<?php
/**
 * @deprecated 請使用標準端點 GET /api/report_descriptions/
 * @see index.php
 */
declare(strict_types=1);
require __DIR__ . '/index.php';


header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db();

    // 分頁參數
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $perPage = isset($_GET['per_page']) ? max(1, min(100, intval($_GET['per_page']))) : 20;
    $offset = ($page - 1) * $perPage;

    // 排序參數
    $allowedSortFields = ['id', 'report_code', 'report_name', 'is_active', 'created_at', 'updated_at'];
    $sortField = isset($_GET['sort']) && in_array($_GET['sort'], $allowedSortFields) ? $_GET['sort'] : 'report_code';
    $sortOrder = isset($_GET['order']) && strtolower($_GET['order']) === 'desc' ? 'DESC' : 'ASC';

    // 篩選參數
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $isActive = isset($_GET['is_active']) && $_GET['is_active'] !== '' ? intval($_GET['is_active']) : null;

    // 建立 WHERE 條件
    $conditions = [];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = "(report_code LIKE ? OR report_name LIKE ? OR report_name_en LIKE ?)";
        $keywordParam = '%' . $keyword . '%';
        $params[] = $keywordParam;
        $params[] = $keywordParam;
        $params[] = $keywordParam;
    }

    if ($isActive !== null) {
        $conditions[] = "is_active = ?";
        $params[] = $isActive;
    }

    $whereClause = count($conditions) > 0 ? 'WHERE ' . implode(' AND ', $conditions) : '';

    // 查詢總數
    $countSql = "SELECT COUNT(*) FROM report_descriptions {$whereClause}";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = $countStmt->fetchColumn();
    $totalPages = ceil($totalCount / $perPage);

    // 查詢資料
    $sql = "SELECT id, report_code, report_name, report_name_en, description, description_en,
                   is_active, created_at, updated_at
            FROM report_descriptions
            {$whereClause}
            ORDER BY {$sortField} {$sortOrder}
            LIMIT ? OFFSET ?";

    $params[] = $perPage;
    $params[] = $offset;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $data,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total_count' => (int)$totalCount,
            'total_pages' => (int)$totalPages
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('Report description list failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => safeErrorMessage($e, '查詢失敗，請稍後重試。')
    ], JSON_UNESCAPED_UNICODE);
}
