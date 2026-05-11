<?php
/**
 * 員工管理 API - 下拉選單端點
 *
 * 提供簡化的員工列表，供下拉選單使用。
 * 僅回傳 id 與 name 欄位，不包含已刪除的員工。
 *
 * @endpoint GET /api/employees/list_for_selector.php
 *
 * @auth 必須登入
 * @table employees
 *
 * @input GET - 無參數
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": [
 *     {"id": 1, "name": "張三"},
 *     {"id": 2, "name": "李四"}
 *   ]
 * }
 * ```
 *
 * @error 405 不支援的請求方法
 * @error 500 載入員工資料失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

requireAuth();

requireMethod('GET');

$pdo = db();

try {
    $stmt = $pdo->query(
        'SELECT id, name
         FROM employees
         WHERE deleted_at IS NULL
         ORDER BY name'
    );

    $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse([
        'success' => true,
        'data' => $employees,
    ]);
} catch (PDOException $e) {
    error_log('List employees failed: ' . $e->getMessage());
    jsonResponse([
        'success' => false,
        'message' => '載入員工資料失敗。',
    ], 500);
}
