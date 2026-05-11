<?php
/**
 * 客戶管理 API - 刪除客戶（軟刪除，含唯一值處理）
 *
 * @endpoint DELETE /api/customers/delete.php?id={id}
 *
 * @auth 需要登入
 * @table customers
 *
 * 執行軟刪除，並修改客戶編號以釋放唯一索引，允許未來重新使用相同編號。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明                         |
 * |---------|------|------|------------------------------|
 * | id      | int  | 是   | 客戶 ID，必須 > 0 且資料存在   |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "客戶資料已刪除。"
 * }
 *
 * @logic 業務邏輯:
 * - 使用軟刪除（設定 deleted_at 時間戳記）
 * - 刪除時會將客戶編號加上 `_deleted_{YmdHis}` 後綴，釋放唯一索引
 *   例如：C001 → C001_deleted_20240101120000
 * - 刪除前會檢查是否有關聯資料（訂單、客戶批號、工單、庫存），若有則無法刪除
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境               | message                                              |
 * |------------|-------------------|-----------------------------------------------------|
 * | 400        | id 參數無效        | "無效的客戶ID。"                                      |
 * | 400        | 有關聯資料無法刪除  | "此客戶有相關的訂單、客戶批號資料，請先刪除相關資料後再刪除客戶。"|
 * | 401        | 未登入            | "尚未登入或登入已過期。"                               |
 * | 404        | 客戶不存在或已刪除  | "找不到指定的客戶。"                                   |
 * | 405        | 不支援的 HTTP 方法  | "不支援的請求方法。"                                   |
 * | 500        | 資料庫錯誤         | "刪除客戶資料失敗，請稍後再試。"                        |
 *
 * @see /api/customers/update.php DELETE 方法（不處理唯一值）
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的客戶ID。',
    ], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    // Get customer data before deletion for audit log
    $stmt = $pdo->prepare('SELECT customer_number, name FROM customers WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    $customer = $stmt->fetch();

    if (!$customer) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的客戶。',
        ], 404);
    }

    // 檢查是否有關聯資料
    $relatedLabels = [];
    
    // 檢查訂單（直接關聯）
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE customer_id = ? AND deleted_at IS NULL");
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() > 0) {
        $relatedLabels[] = '訂單';
    }
    
    // 檢查客戶批號（透過 orders 關聯）
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM order_items oi 
        INNER JOIN orders o ON oi.order_id = o.id 
        WHERE o.customer_id = ? AND o.deleted_at IS NULL
    ");
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() > 0) {
        $relatedLabels[] = '客戶批號';
    }
    
    // 檢查生產工單（透過 order_items → orders 關聯）
    $stmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM work_orders wo 
        INNER JOIN order_items oi ON wo.order_item_id = oi.id 
        INNER JOIN orders o ON oi.order_id = o.id 
        WHERE o.customer_id = ? AND wo.deleted_at IS NULL AND o.deleted_at IS NULL
    ");
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() > 0) {
        $relatedLabels[] = '生產工單';
    }
    
    // 檢查庫存項目（直接關聯）
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM inventory_items WHERE customer_id = ? AND deleted_at IS NULL");
    $stmt->execute([$id]);
    if ((int)$stmt->fetchColumn() > 0) {
        $relatedLabels[] = '庫存項目';
    }
    
    if (!empty($relatedLabels)) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '此客戶有相關的' . implode('、', $relatedLabels) . '資料，請先刪除相關資料後再刪除客戶。',
        ], 400);
    }

    // Soft delete - 設定 delete_token = id 以釋放唯一索引，允許未來重新使用相同編號
    $stmt = $pdo->prepare('UPDATE customers SET deleted_at = NOW(), delete_token = id WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的客戶。',
        ], 404);
    }

    // Log the action
    logAuditAction('Soft deleted customer', 'Customers', $id, [
        'customer_number' => $customer['customer_number'],
        'name' => $customer['name'],
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '客戶資料已刪除。',
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    error_log('Failed to delete customer: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '刪除客戶資料失敗，請稍後再試。',
    ], 500);
}