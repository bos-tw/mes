<?php
/**
 * 部門管理 API - 共用輔助函式
 *
 * 提供部門模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module departments
 * @table departments
 *
 * @functions
 * - readDepartmentPayload(): 讀取請求資料
 * - validateDepartmentData(): 驗證並正規化輸入資料
 * - findDepartment(): 查詢單筆部門
 * - transformDepartment(): 轉換為 API 回應格式
 * - departmentExists(): 檢查部門是否存在
 * - handleDepartmentPdoWriteException(): 處理 PDO 寫入例外
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * Retrieve request payload supporting JSON and form submissions.
 *
 * @return array<string,mixed>
 */
function readDepartmentPayload(): array
{
    return readRequestPayload();
}

/**
 * Validate and normalise department input data.
 *
 * @param array<string,mixed> $payload
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateDepartmentData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = '部門名稱為必填。';
        } else {
            $data['name'] = mb_substr($name, 0, 100);
        }
    }

    if (array_key_exists('parent_department_id', $payload)) {
        $rawParentId = $payload['parent_department_id'];
        if ($rawParentId === '' || $rawParentId === null) {
            $data['parent_department_id'] = null;
        } else {
            $parentDepartmentId = filter_var($rawParentId, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($parentDepartmentId === false) {
                $errors['parent_department_id'] = '上級部門 ID 必須為正整數或留空。';
            } else {
                $data['parent_department_id'] = $parentDepartmentId;
            }
        }
    }

    if ($isUpdate && $data === []) {
        $errors['general'] = '沒有任何可更新的欄位。';
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * Fetch a single department record with parent information.
 */
function findDepartment(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT d.id, d.name, d.parent_department_id, d.status_lookup_id, d.created_at, d.updated_at, d.deleted_at, '
        . 'p.name AS parent_name '
        . 'FROM departments d '
        . 'LEFT JOIN departments p ON p.id = d.parent_department_id '
        . 'WHERE d.id = :id AND d.deleted_at IS NULL';

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    return $row !== false ? $row : null;
}

/**
 * Convert raw department row to API response format.
 *
 * @param array<string,mixed> $row
 * @return array<string,mixed>
 */
function transformDepartment(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'name' => $row['name'],
        'parent' => [
            'id' => isset($row['parent_department_id']) && $row['parent_department_id'] !== null
                ? (int)$row['parent_department_id']
                : null,
            'name' => $row['parent_name'] ?? null,
        ],
        'status_lookup_id' => isset($row['status_lookup_id']) ? (int)$row['status_lookup_id'] : null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'deleted_at' => $row['deleted_at'] ?? null,
    ];
}

/**
 * Standardise PDO write exception handling for department operations.
 */
function handleDepartmentPdoWriteException(PDOException $exception): void
{
    if ((int)$exception->getCode() === 23000) {
        $errMsg = $exception->getMessage();
        if (stripos($errMsg, 'Duplicate entry') !== false) {
            $message = '部門名稱已存在，請使用其他名稱。';
        } elseif (stripos($errMsg, 'foreign key constraint') !== false) {
            $message = '此部門仍被其他資料引用，無法執行此操作。';
        } else {
            $message = '資料重複或違反參照限制，請檢查部門名稱。';
        }
    } else {
        $message = '資料庫寫入失敗，請稍後再試。';
    }

    jsonResponse([
        'success' => false,
        'message' => $message,
        'error' => $exception->getMessage(),
    ], 409);
}

function departmentExists(PDO $pdo, int $id): bool
{
    $stmt = $pdo->prepare('SELECT 1 FROM departments WHERE id = :id AND deleted_at IS NULL');
    $stmt->execute(['id' => $id]);

    return $stmt->fetchColumn() !== false;
}
