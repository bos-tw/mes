<?php
/**
 * 查詢領域 API - 共用輔助函式
 *
 * 提供查詢領域模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module lookup_domains
 * @table lookup_domains
 *
 * @functions
 * - validateLookupDomainData(): 驗證並正規化代碼領域輸入資料
 * - findLookupDomain(): 查詢單筆代碼領域
 * - transformLookupDomain(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證並正規化代碼領域輸入資料
 *
 * @param array<string,mixed> $payload
 * @param bool $isUpdate
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateLookupDomainData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // domain_key - 必填
    $domainKey = trim((string)($payload['domain_key'] ?? ''));
    if ($domainKey === '') {
        if (!$isUpdate) {
            $errors['domain_key'] = '領域鍵值為必填欄位。';
        }
    } elseif (strlen($domainKey) > 50) {
        $errors['domain_key'] = '領域鍵值不可超過 50 個字元。';
    } elseif (!preg_match('/^[a-z][a-z0-9_]*$/i', $domainKey)) {
        $errors['domain_key'] = '領域鍵值只能包含英文字母、數字及底線，且必須以字母開頭。';
    } else {
        $data['domain_key'] = $domainKey;
    }

    // description - 選填
    $description = isset($payload['description']) ? trim((string)$payload['description']) : null;
    if ($description !== null && strlen($description) > 255) {
        $errors['description'] = '領域描述不可超過 255 個字元。';
    } else {
        $data['description'] = $description === '' ? null : $description;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆代碼領域
 *
 * @param int $id
 * @return array|null
 */
function findLookupDomain(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, domain_key, description, created_at, updated_at FROM lookup_domains WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 *
 * @param array $row
 * @return array
 */
function transformLookupDomain(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'domain_key' => $row['domain_key'],
        'description' => $row['description'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
