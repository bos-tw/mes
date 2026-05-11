<?php
/**
 * 權限管理 API - 輔助函式
 *
 * 本檔案包含權限管理模組的共用函式：
 *
 * @module permissions
 * @table permissions
 *
 * @functions
 * - readPermissionPayload(): 讀取請求資料
 * - validatePermissionData(): 驗證並正規化權限資料
 * - findPermission(): 依 ID 查詢權限資料
 * - transformPermission(): 轉換為 API 回應格式
 * - permissionExists(): 檢查權限是否存在
 * - permissionNameExists(): 檢查權限名稱是否已存在（排重）
 * - canDeletePermission(): 檢查權限是否可刪除
 * - handlePermissionPdoWriteException(): 處理寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 讀取請求資料
 *
 * @return array<string,mixed>
 */
function readPermissionPayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化權限資料
 *
 * @param array<string,mixed> $payload 請求資料
 * @param bool $isUpdate 是否為更新模式
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validatePermissionData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 權限名稱 (必填)
    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if (!$isUpdate && $name === '') {
            $errors['name'] = '權限名稱為必填。';
        } elseif ($name !== '') {
            if (mb_strlen($name) > 100) {
                $errors['name'] = '權限名稱不可超過 100 字。';
            } else {
                $data['name'] = $name;
            }
        }
    }

    // 描述 (選填)
    if (array_key_exists('description', $payload)) {
        $description = trim((string)($payload['description'] ?? ''));
        if ($description !== '') {
            $data['description'] = mb_substr($description, 0, 255);
        } else {
            $data['description'] = null;
        }
    }

    if ($isUpdate && $data === []) {
        $errors['general'] = '請至少提供一個可更新欄位。';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 依 ID 查詢權限資料
 */
function findPermission(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT id, name, description, created_at, updated_at FROM permissions WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * 轉換為 API 回應格式
 */
function transformPermission(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'description' => $row['description'] ?? null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

/**
 * 檢查權限是否存在
 */
function permissionExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM permissions WHERE id = :id');
    $stmt->execute(['id' => $id]);

    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查權限名稱是否已存在（排重）
 */
function permissionNameExists(PDO $pdo, string $name, ?int $excludeId = null): bool
{
    $sql = 'SELECT 1 FROM permissions WHERE name = :name';
    $params = ['name' => $name];

    if ($excludeId !== null) {
        $sql .= ' AND id != :exclude_id';
        $params['exclude_id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查是否可安全刪除權限
 */
function canDeletePermission(PDO $pdo, int $id): bool
{
    // 檢查是否有角色使用此權限
    $stmt = $pdo->prepare('SELECT 1 FROM role_permissions WHERE permission_id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);

    return $stmt->fetchColumn() === false;
}

/**
 * 處理 PDO 寫入例外
 */
function handlePermissionPdoWriteException(PDOException $exception): void
{
    $code = (int)$exception->getCode();
    $message = $exception->getMessage();

    if ($code === 23000) {
        if (strpos($message, 'name') !== false || strpos($message, 'Duplicate') !== false) {
            jsonResponse([
                'success' => false,
                'message' => '權限名稱已存在，請使用不同的名稱。',
            ], 409);
        }
        jsonResponse([
            'success' => false,
            'message' => '資料重複或違反完整性約束。',
        ], 409);
    }

    jsonResponse([
        'success' => false,
        'message' => '資料庫操作失敗，請稍後再試。',
        'error' => $message,
    ], 500);
}