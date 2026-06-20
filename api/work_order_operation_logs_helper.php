<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

function getCurrentOperationLogEmployeeId(): ?int
{
    $employeeId = $_SESSION['employee']['id'] ?? ($_SESSION['employee_id'] ?? null);
    if ($employeeId === null || $employeeId === '') {
        return null;
    }

    $employeeId = (int)$employeeId;
    return $employeeId > 0 ? $employeeId : null;
}

/**
 * @return array{key: string|null, label: string|null}
 */
function resolveWorkOrderStatusSnapshot(PDO $pdo, ?int $statusLookupId, ?string $fallbackStatus = null): array
{
    if ($statusLookupId !== null && $statusLookupId > 0) {
        $stmt = $pdo->prepare('SELECT value_key, value_label FROM lookup_values WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $statusLookupId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return [
                'key' => isset($row['value_key']) ? (string)$row['value_key'] : null,
                'label' => isset($row['value_label']) ? (string)$row['value_label'] : null,
            ];
        }
    }

    $fallback = trim((string)($fallbackStatus ?? ''));
    return [
        'key' => $fallback !== '' ? $fallback : null,
        'label' => $fallback !== '' ? $fallback : null,
    ];
}

/**
 * @param array<string,mixed> $options
 */
function appendWorkOrderOperationLog(PDO $pdo, int $workOrderId, string $actionKey, string $actionLabel, array $options = []): int
{
    $payloadJson = null;
    if (array_key_exists('payload', $options) && is_array($options['payload']) && $options['payload'] !== []) {
        $payloadJson = json_encode($options['payload'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    $employeeId = array_key_exists('created_by_employee_id', $options)
        ? ($options['created_by_employee_id'] !== null ? (int)$options['created_by_employee_id'] : null)
        : getCurrentOperationLogEmployeeId();

    $stmt = $pdo->prepare("
        INSERT INTO work_order_operation_logs (
            work_order_id,
            action_key,
            action_label,
            status_from_key,
            status_from_label,
            status_to_key,
            status_to_label,
            related_table,
            related_id,
            notes,
            payload_json,
            created_by_employee_id
        ) VALUES (
            :work_order_id,
            :action_key,
            :action_label,
            :status_from_key,
            :status_from_label,
            :status_to_key,
            :status_to_label,
            :related_table,
            :related_id,
            :notes,
            :payload_json,
            :created_by_employee_id
        )
    ");
    $stmt->execute([
        'work_order_id' => $workOrderId,
        'action_key' => $actionKey,
        'action_label' => $actionLabel,
        'status_from_key' => $options['status_from_key'] ?? null,
        'status_from_label' => $options['status_from_label'] ?? null,
        'status_to_key' => $options['status_to_key'] ?? null,
        'status_to_label' => $options['status_to_label'] ?? null,
        'related_table' => $options['related_table'] ?? null,
        'related_id' => isset($options['related_id']) && $options['related_id'] !== null ? (int)$options['related_id'] : null,
        'notes' => $options['notes'] ?? null,
        'payload_json' => $payloadJson,
        'created_by_employee_id' => $employeeId,
    ]);

    return (int)$pdo->lastInsertId();
}

/**
 * @return array<string,mixed>
 */
function transformWorkOrderOperationLogRow(array $row): array
{
    $payload = null;
    if (!empty($row['payload_json'])) {
        $decoded = json_decode((string)$row['payload_json'], true);
        if (is_array($decoded)) {
            $payload = $decoded;
        }
    }

    return [
        'id' => (int)($row['id'] ?? 0),
        'work_order_id' => (int)($row['work_order_id'] ?? 0),
        'action_key' => (string)($row['action_key'] ?? ''),
        'action_label' => (string)($row['action_label'] ?? ''),
        'status_from_key' => $row['status_from_key'] ?? null,
        'status_from_label' => $row['status_from_label'] ?? null,
        'status_to_key' => $row['status_to_key'] ?? null,
        'status_to_label' => $row['status_to_label'] ?? null,
        'related_table' => $row['related_table'] ?? null,
        'related_id' => isset($row['related_id']) ? (int)$row['related_id'] : null,
        'notes' => $row['notes'] ?? null,
        'payload' => $payload,
        'created_at' => $row['created_at'] ?? null,
        'created_by_employee_id' => isset($row['created_by_employee_id']) ? (int)$row['created_by_employee_id'] : null,
        'created_by_name' => $row['created_by_name'] ?? null,
    ];
}

/**
 * @return array<int,array<string,mixed>>
 */
function fetchWorkOrderOperationLogs(PDO $pdo, int $workOrderId, int $limit = 50): array
{
    $limit = max(1, min(100, $limit));
    $stmt = $pdo->prepare("
        SELECT
            wool.*,
            e.name AS created_by_name
        FROM work_order_operation_logs wool
        LEFT JOIN employees e ON wool.created_by_employee_id = e.id
        WHERE wool.work_order_id = :work_order_id
        ORDER BY wool.created_at DESC, wool.id DESC
        LIMIT :limit
    ");
    $stmt->bindValue(':work_order_id', $workOrderId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    return array_map('transformWorkOrderOperationLogRow', $rows);
}
