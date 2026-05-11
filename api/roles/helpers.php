<?php
/**
 * 角色管理 API - 輔助函式
 *
 * 本檔案包含角色模組的共用函式：
 *
 * @module roles
 * @table roles
 *
 * @functions
 * - readRolePayload(): 讀取請求資料
 * - validateRoleData(): 驗證並正規化資料
 * - findRole(): 依 ID 查詢角色
 * - transformRole(): 轉換為 API 回應格式
 * - roleExists(): 檢查角色是否存在
 * - roleNameExists(): 檢查角色名稱是否重複
 * - canDeleteRole(): 檢查是否可安全刪除
 * - handleRolePdoWriteException(): 處理 PDO 寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 讀取請求資料，支援 JSON 與表單格式
 *
 * @return array<string,mixed>
 */
function readRolePayload(): array
{
    return readRequestPayload();
}

/**
 * 驗證並正規化角色資料
 *
 * @param array<string,mixed> $payload 請求資料
 * @param bool $isUpdate 是否為更新模式
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateRoleData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 角色名稱 (必填)
    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if (!$isUpdate && $name === '') {
            $errors['name'] = '角色名稱為必填。';
        } elseif ($name !== '') {
            if (mb_strlen($name) > 50) {
                $errors['name'] = '角色名稱不可超過 50 字。';
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
 * 依 ID 查詢角色資料
 *
 * @param PDO $pdo 資料庫連線
 * @param int $id 角色 ID
 * @return array|null
 */
function findRole(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * 轉換為 API 回應格式
 *
 * @param array<string,mixed> $row 資料庫查詢結果
 * @return array<string,mixed>
 */
function transformRole(array $row): array
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
 * 檢查角色是否存在
 *
 * @param PDO $pdo 資料庫連線
 * @param int $id 角色 ID
 * @return bool
 */
function roleExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM roles WHERE id = :id');
    $stmt->execute(['id' => $id]);

    return $stmt->fetchColumn() !== false;
}

/**
 * 檢查角色名稱是否已存在（排重）
 *
 * @param PDO $pdo 資料庫連線
 * @param string $name 角色名稱
 * @param int|null $excludeId 排除的 ID（用於更新時排除自身）
 * @return bool
 */
function roleNameExists(PDO $pdo, string $name, ?int $excludeId = null): bool
{
    $sql = 'SELECT 1 FROM roles WHERE name = :name';
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
 * 檢查是否可安全刪除角色
 *
 * @param PDO $pdo 資料庫連線
 * @param int $id 角色 ID
 * @return bool
 */
function canDeleteRole(PDO $pdo, int $id): bool
{
    // 檢查是否有員工使用此角色
    $stmt = $pdo->prepare('SELECT 1 FROM employee_roles WHERE role_id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    if ($stmt->fetchColumn() !== false) {
        return false;
    }

    // 檢查是否有關聯權限
    $stmt = $pdo->prepare('SELECT 1 FROM role_permissions WHERE role_id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    if ($stmt->fetchColumn() !== false) {
        return false;
    }

    return true;
}

/**
 * 處理 PDO 寫入例外
 *
 * @param PDOException $exception
 */
function handleRolePdoWriteException(PDOException $exception): void
{
    $code = (int)$exception->getCode();
    $message = $exception->getMessage();

    if ($code === 23000) {
        if (strpos($message, 'name') !== false || strpos($message, 'Duplicate') !== false) {
            jsonResponse([
                'success' => false,
                'message' => '角色名稱已存在，請使用不同的名稱。',
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