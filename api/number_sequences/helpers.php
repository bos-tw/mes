<?php
/**
 * 編號序號 API - 共用輔助函式
 *
 * 提供編號序號模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module number_sequences
 * @table number_sequences
 *
 * @functions
 * - validateNumberSequenceData(): 驗證並正規化流水號輸入資料
 * - findNumberSequence(): 查詢單筆流水號
 * - transformNumberSequence(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證並正規化流水號輸入資料
 */
function validateNumberSequenceData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // seq_key - 必填
    $seqKey = trim((string)($payload['seq_key'] ?? ''));
    if ($seqKey === '') {
        if (!$isUpdate) {
            $errors['seq_key'] = '序列鍵為必填欄位。';
        }
    } elseif (strlen($seqKey) > 50) {
        $errors['seq_key'] = '序列鍵不可超過 50 個字元。';
    } else {
        $data['seq_key'] = $seqKey;
    }

    // date_scope - 必填
    $dateScope = trim((string)($payload['date_scope'] ?? ''));
    if ($dateScope === '') {
        if (!$isUpdate) {
            $errors['date_scope'] = '日期範圍為必填欄位。';
        }
    } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateScope)) {
        $errors['date_scope'] = '日期範圍格式無效（應為 YYYY-MM-DD）。';
    } else {
        $data['date_scope'] = $dateScope;
    }

    // current_value - 選填
    if (isset($payload['current_value'])) {
        $currentValue = (int)$payload['current_value'];
        if ($currentValue < 0) {
            $errors['current_value'] = '目前值不可為負數。';
        } else {
            $data['current_value'] = $currentValue;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆流水號
 */
function findNumberSequence(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, seq_key, date_scope, current_value, created_at, updated_at FROM number_sequences WHERE id = :id');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 */
function transformNumberSequence(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'seq_key' => $row['seq_key'],
        'date_scope' => $row['date_scope'],
        'current_value' => (int)$row['current_value'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
