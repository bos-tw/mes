<?php
/**
 * 系統參數 API - 共用輔助函式
 *
 * 提供系統參數模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module system_parameters
 * @table system_parameters
 *
 * @functions
 * - validateSystemParameterData(): 驗證並正規化系統參數輸入資料
 * - findSystemParameter(): 查詢單筆系統參數
 * - transformSystemParameter(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證並正規化系統參數輸入資料
 */
function validateSystemParameterData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // param_key - 必填
    $paramKey = trim((string)($payload['param_key'] ?? ''));
    if ($paramKey === '') {
        if (!$isUpdate) {
            $errors['param_key'] = '參數鍵值為必填欄位。';
        }
    } elseif (strlen($paramKey) > 100) {
        $errors['param_key'] = '參數鍵值不可超過 100 個字元。';
    } else {
        $data['param_key'] = $paramKey;
    }

    // param_value - 必填
    $paramValue = isset($payload['param_value']) ? (string)$payload['param_value'] : '';
    if ($paramValue === '' && !$isUpdate) {
        $errors['param_value'] = '參數值為必填欄位。';
    } elseif ($paramValue !== '') {
        $data['param_value'] = $paramValue;
    }

    // description - 選填
    $description = isset($payload['description']) ? trim((string)$payload['description']) : null;
    if ($description !== null && strlen($description) > 255) {
        $errors['description'] = '參數描述不可超過 255 個字元。';
    } else {
        $data['description'] = $description === '' ? null : $description;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆系統參數
 */
function findSystemParameter(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, param_key, param_value, description, created_at, updated_at FROM system_parameters WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 */
function transformSystemParameter(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'param_key' => $row['param_key'],
        'param_value' => $row['param_value'],
        'description' => $row['description'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
