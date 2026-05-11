<?php
/**
 * 供應商管理 API - 刪除端點
 *
 * 提供供應商資料的軟刪除功能（設定 deleted_at）。
 *
 * @endpoint DELETE /api/suppliers/delete.php?id={id}
 *
 * @auth 必須登入
 * @table suppliers
 *
 * @input DELETE
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 供應商 ID |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "message": "供應商資料已刪除。"
 * }
 * ```
 *
 * @error 400 無效的供應商 ID
 * @error 404 找不到指定的供應商
 *
 * @logic
 * 1. 使用交易確保資料一致性
 * 2. 查詢供應商資料（用於稽核記錄）
 * 3. 執行軟刪除（設定 deleted_at）
 * 4. 記錄稽核日誌
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod('DELETE');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的供應商ID。',
    ], 400);
}

$pdo = db();

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT supplier_number, name FROM suppliers WHERE id = ? AND deleted_at IS NULL');
    $stmt->execute([$id]);
    $supplier = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$supplier) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的供應商。',
        ], 404);
    }

    $deleteStmt = $pdo->prepare('UPDATE suppliers SET deleted_at = NOW(), delete_token = id WHERE id = ? AND deleted_at IS NULL');
    $deleteStmt->execute([$id]);

    if ($deleteStmt->rowCount() === 0) {
        $pdo->rollBack();
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的供應商。',
        ], 404);
    }

    logAuditAction('Soft deleted supplier', 'Suppliers', $id, [
        'supplier_number' => $supplier['supplier_number'],
        'name' => $supplier['name'],
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '供應商資料已刪除。',
    ]);
} catch (Throwable $exception) {
    $pdo->rollBack();
    error_log('Failed to delete supplier: ' . $exception->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '刪除供應商資料失敗，請稍後再試。',
    ], 500);
}
