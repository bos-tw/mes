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
        $normalizedSeqKey = strtoupper($seqKey);
        if (!array_key_exists($normalizedSeqKey, getManagedNumberSequenceDefinitions())) {
            $errors['seq_key'] = '序列鍵不在系統支援的流水號類型內。';
        } else {
            $data['seq_key'] = $normalizedSeqKey;
        }
    }

    // seq_prefix - 必填
    $seqPrefix = strtoupper(trim((string)($payload['seq_prefix'] ?? '')));
    if ($seqPrefix === '') {
        if (!$isUpdate) {
            $errors['seq_prefix'] = '流水號前綴為必填欄位。';
        }
    } elseif (!preg_match('/^[A-Z0-9_-]{1,50}$/', $seqPrefix)) {
        $errors['seq_prefix'] = '流水號前綴只能包含英數字、底線或連字號，且不可超過 50 字元。';
    } else {
        $data['seq_prefix'] = $seqPrefix;
    }

    // active_from - 必填
    $activeFrom = trim((string)($payload['active_from'] ?? ''));
    if ($activeFrom === '') {
        if (!$isUpdate) {
            $errors['active_from'] = '啟用時間為必填欄位。';
        }
    } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/', $activeFrom)) {
        $errors['active_from'] = '啟用時間格式無效。';
    } else {
        $normalized = normalizeNumberSequenceDateTime($activeFrom);
        if ($normalized === null) {
            $errors['active_from'] = '啟用時間格式無效。';
        } else {
            $data['active_from'] = $normalized;
        }
    }

    // active_until - 選填
    if (array_key_exists('active_until', $payload)) {
        $activeUntil = trim((string)($payload['active_until'] ?? ''));
        if ($activeUntil === '') {
            $data['active_until'] = null;
        } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/', $activeUntil)) {
            $errors['active_until'] = '停用時間格式無效。';
        } else {
            $normalized = normalizeNumberSequenceDateTime($activeUntil);
            if ($normalized === null) {
                $errors['active_until'] = '停用時間格式無效。';
            } else {
                $data['active_until'] = $normalized;
            }
        }
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

    if (
        isset($data['active_from'])
        && array_key_exists('active_until', $data)
        && $data['active_until'] !== null
        && strtotime($data['active_until']) < strtotime($data['active_from'])
    ) {
        $errors['active_until'] = '停用時間不可早於啟用時間。';
    }

    return ['data' => $data, 'errors' => $errors];
}

function normalizeNumberSequenceDateTime(string $value): ?string
{
    $value = trim($value);
    if ($value === '') {
        return null;
    }

    foreach (['Y-m-d\TH:i', 'Y-m-d H:i', 'Y-m-d H:i:s', 'Y-m-d'] as $format) {
        $date = DateTime::createFromFormat($format, $value);
        if ($date instanceof DateTime) {
            if ($format === 'Y-m-d') {
                $date->setTime(0, 0, 0);
            } elseif ($format === 'Y-m-d\TH:i' || $format === 'Y-m-d H:i') {
                $date->setTime((int)$date->format('H'), (int)$date->format('i'), 0);
            }
            return $date->format('Y-m-d H:i:s');
        }
    }

    return null;
}

/**
 * 查詢單筆流水號
 */
function findNumberSequence(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, seq_key, seq_prefix, active_from, active_until, current_value, last_generated_on, created_at, updated_at FROM number_sequences WHERE id = :id');
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
        'seq_prefix' => $row['seq_prefix'],
        'active_from' => $row['active_from'],
        'active_until' => $row['active_until'],
        'current_value' => (int)$row['current_value'],
        'last_generated_on' => $row['last_generated_on'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function getManagedNumberSequenceDefinitions(): array
{
    return [
        'ORDER' => ['label' => '訂單', 'default_prefix' => 'ORDER'],
        'WO' => ['label' => '工單', 'default_prefix' => 'WO'],
        'INV' => ['label' => '庫存', 'default_prefix' => 'INV'],
        'SO' => ['label' => '出貨單', 'default_prefix' => 'SO'],
        'RO' => ['label' => '退貨單', 'default_prefix' => 'RO'],
        'RB' => ['label' => '二次重篩案件', 'default_prefix' => 'RB'],
        'WOPR' => ['label' => '部分入庫', 'default_prefix' => 'WOPR'],
    ];
}

function generateManagedDocumentNumber(PDO $pdo, string $seqKey, ?string $date = null): string
{
    $seqKey = strtoupper(trim($seqKey));
    $targetDate = $date ? date('Y-m-d', strtotime($date)) : date('Y-m-d');
    $targetMoment = $date
        ? date('Y-m-d 12:00:00', strtotime($date))
        : date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("
        SELECT id, seq_prefix, current_value, last_generated_on
        FROM number_sequences
        WHERE seq_key = :seq_key
          AND active_from <= :target_moment_start
          AND (active_until IS NULL OR active_until >= :target_moment_end)
        ORDER BY active_from DESC, id DESC
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([
        'seq_key' => $seqKey,
        'target_moment_start' => $targetMoment,
        'target_moment_end' => $targetMoment,
    ]);
    $sequence = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$sequence) {
        throw new RuntimeException("找不到 {$seqKey} 對應的有效流水號設定。請先到「流水號管理」建立或啟用設定。");
    }

    $nextValue = ((string)($sequence['last_generated_on'] ?? '') === $targetDate)
        ? ((int)$sequence['current_value'] + 1)
        : 1;

    $updateStmt = $pdo->prepare("
        UPDATE number_sequences
        SET current_value = :current_value,
            last_generated_on = :last_generated_on,
            updated_at = NOW()
        WHERE id = :id
    ");
    $updateStmt->execute([
        'current_value' => $nextValue,
        'last_generated_on' => $targetDate,
        'id' => (int)$sequence['id'],
    ]);

    return sprintf(
        '%s-%s-%04d',
        (string)$sequence['seq_prefix'],
        date('Ymd', strtotime($targetDate)),
        $nextValue
    );
}
