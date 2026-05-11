<?php
/**
 * 公司管理 API - 單筆資料端點
 *
 * 提供公司單筆資料的查詢、更新、刪除功能。
 *
 * @endpoint GET    /api/companies/update.php?id={id}  取得單筆公司
 * @endpoint PUT    /api/companies/update.php?id={id}  更新公司
 * @endpoint DELETE /api/companies/update.php?id={id}  刪除公司
 *
 * @auth 必須登入
 * @table companies
 *
 * @input GET/PUT/DELETE 共用
 * | 參數 | 類型 | 必填 | 說明 |
 * |------|------|------|------|
 * | id   | int  | Y    | 公司 ID |
 *
 * @input PUT (JSON body)
 * | 參數   | 類型   | 必填 | 說明 |
 * |--------|--------|------|------|
 * | name   | string | N    | 公司名稱 |
 * | address| string | N    | 地址 |
 * | phone  | string | N    | 電話 |
 * | email  | string | N    | Email |
 * | tax_id | string | N    | 統一編號 |
 *
 * @output 成功回應
 * ```json
 * {
 *   "success": true,
 *   "data": {"id": 1, "name": "玉軒企業"}
 * }
 * ```
 *
 * @error 400 無效的公司 ID
 * @error 404 找不到指定的公司
 * @error 405 不支援的請求方法
 * @error 422 欄位驗證失敗
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的公司ID。',
    ], 400);
}

$method = requireMethod(['GET', 'PUT', 'DELETE']);

switch ($method) {
    case 'GET':
        handleShowCompany($id);
        break;
    case 'PUT':
        handleUpdateCompany($id);
        break;
    case 'DELETE':
        handleDeleteCompany($id);
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}

function handleShowCompany(int $id): void
{
    $pdo = db();

    $stmt = $pdo->prepare('SELECT id, name, name_en, address, phone, fax, email, tax_id, created_at, updated_at FROM companies WHERE id = ?');
    $stmt->execute([$id]);

    $company = $stmt->fetch();
    if (!$company) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的公司。',
        ], 404);
    }

    jsonResponse([
        'success' => true,
        'data' => transformCompany($company),
    ]);
}

function handleUpdateCompany(int $id): void
{
    $pdo = db();

    // 先檢查公司是否存在
    $checkStmt = $pdo->prepare('SELECT id FROM companies WHERE id = ?');
    $checkStmt->execute([$id]);
    if (!$checkStmt->fetch()) {
        jsonResponse([
            'success' => false,
            'message' => '找不到指定的公司。',
        ], 404);
    }

    $payload = readCompanyPayload();

    $validated = validateCompanyData($payload, true);
    if ($validated['errors'] !== []) {
        jsonResponse([
            'success' => false,
            'message' => '欄位驗證失敗。',
            'errors' => $validated['errors'],
        ], 422);
    }

    $data = $validated['data'];

    // 如果沒有任何欄位需要更新，直接回傳成功（例如只是上傳 LOGO 後儲存）
    if ($data === []) {
        jsonResponse([
            'success' => true,
            'message' => '公司資料已儲存。',
        ]);
    }

    try {
        $pdo->beginTransaction();

        $setParts = [];
        $params = [];
        foreach ($data as $column => $value) {
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        $params[] = $id;

        $sql = 'UPDATE companies SET ' . implode(', ', $setParts) . ' WHERE id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // rowCount() 為 0 表示資料沒有變更，但這不是錯誤
        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '公司資料已更新。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleCompanyWriteException($e);
        jsonResponse($response, 500);
    }
}

function handleDeleteCompany(int $id): void
{
    $pdo = db();

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('DELETE FROM companies WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            jsonResponse([
                'success' => false,
                'message' => '找不到指定的公司。',
            ], 404);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => '公司資料已刪除。',
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        $response = handleCompanyWriteException($e);
        jsonResponse($response, 500);
    }
}