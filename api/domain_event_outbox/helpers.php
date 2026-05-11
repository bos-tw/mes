<?php
/**
 * 領域事件發件箱 API - 共用輔助函式
 *
 * 提供領域事件發件箱模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module domain_event_outbox
 * @table domain_event_outbox
 *
 * @functions
 * - validateEventData(): 驗證事件資料
 * - findEvent(): 根據 ID 查詢事件
 * - transformEvent(): 轉換事件資料格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證事件資料
 */
function validateEventData(array $data, bool $isUpdate = false): array
{
    $errors = [];

    if (!$isUpdate) {
        if (empty($data['aggregate_type'])) {
            $errors[] = '聚合類型為必填';
        }
        if (empty($data['aggregate_id'])) {
            $errors[] = '聚合 ID 為必填';
        }
        if (empty($data['event_type'])) {
            $errors[] = '事件類型為必填';
        }
    }

    if (isset($data['aggregate_type']) && strlen($data['aggregate_type']) > 50) {
        $errors[] = '聚合類型不可超過 50 字元';
    }

    if (isset($data['event_type']) && strlen($data['event_type']) > 50) {
        $errors[] = '事件類型不可超過 50 字元';
    }

    if (isset($data['process_status']) && strlen($data['process_status']) > 50) {
        $errors[] = '處理狀態不可超過 50 字元';
    }

    if (isset($data['last_error']) && strlen($data['last_error']) > 500) {
        $errors[] = '錯誤訊息不可超過 500 字元';
    }

    return $errors;
}

/**
 * 根據 ID 查詢事件
 */
function findEvent(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("SELECT * FROM domain_event_outbox WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}

/**
 * 轉換事件資料格式
 */
function transformEvent(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'aggregate_type' => $row['aggregate_type'],
        'aggregate_id' => (int)$row['aggregate_id'],
        'event_type' => $row['event_type'],
        'payload' => $row['payload'],
        'process_status' => $row['process_status'],
        'retry_count' => (int)$row['retry_count'],
        'last_error' => $row['last_error'],
        'created_at' => $row['created_at'],
        'processed_at' => $row['processed_at'],
    ];
}
