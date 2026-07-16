<?php
/**
 * 跨模組共用狀態機與狀態轉換歷程。
 */
declare(strict_types=1);

/** @return array<string, array<string, list<string>>> */
function getWorkflowTransitionDefinitions(): array
{
    return [
        'orders' => [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['pending', 'in_progress', 'cancelled'],
            'in_progress' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ],
        'order_items' => [
            'pending' => ['in_progress', 'cancelled'],
            'in_progress' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ],
        'work_orders' => [
            'pending' => ['in_progress', 'cancelled'],
            'in_progress' => ['paused', 'completed', 'cancelled'],
            'paused' => ['in_progress', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ],
        'inventory_items' => [
            'in_stock' => ['allocated', 'consumed'],
            'allocated' => ['in_stock', 'shipped', 'consumed'],
            'shipped' => [],
            'consumed' => [],
        ],
        'shipping_orders' => [
            'draft' => ['confirmed', 'cancelled'],
            'confirmed' => ['draft', 'preparing', 'cancelled'],
            'preparing' => ['confirmed', 'draft', 'packed', 'cancelled'],
            'packed' => ['preparing', 'draft', 'shipped', 'cancelled'],
            'shipped' => ['delivered', 'cancelled'],
            'delivered' => [],
            'cancelled' => [],
        ],
        'return_orders' => [
            'pending' => ['processing', 'rejected'],
            'processing' => ['pending', 'completed', 'rejected'],
            'completed' => [],
            'rejected' => [],
        ],
    ];
}

/** @return list<string> */
function getAllowedWorkflowTransitions(string $module, string $status): array
{
    return getWorkflowTransitionDefinitions()[$module][$status] ?? [];
}

function canTransitionWorkflowStatus(string $module, string $fromStatus, string $toStatus): bool
{
    return $fromStatus === $toStatus
        || in_array($toStatus, getAllowedWorkflowTransitions($module, $fromStatus), true);
}

/**
 * @param array<string,mixed>|null $metadata
 */
function recordWorkflowStatusTransition(
    PDO $pdo,
    string $module,
    int $entityId,
    string $fromStatus,
    string $toStatus,
    ?int $employeeId = null,
    ?string $reason = null,
    ?array $metadata = null
): void {
    if ($fromStatus === $toStatus) {
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO workflow_status_transitions
            (module_name, entity_id, from_status, to_status, reason, metadata, changed_by_employee_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $module,
        $entityId,
        $fromStatus,
        $toStatus,
        $reason !== null && trim($reason) !== '' ? trim($reason) : null,
        $metadata !== null ? json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        $employeeId,
    ]);
}

function resolveLookupValueKey(PDO $pdo, int $lookupId, ?string $domainKey = null): ?string
{
    if ($lookupId <= 0) {
        return null;
    }
    $sql = "
        SELECT lv.value_key
        FROM lookup_values lv
        INNER JOIN lookup_domains ld ON ld.id = lv.domain_id
        WHERE lv.id = ?
    ";
    $params = [$lookupId];
    if ($domainKey !== null) {
        $sql .= ' AND ld.domain_key = ?';
        $params[] = $domainKey;
    }
    $stmt = $pdo->prepare($sql . ' LIMIT 1');
    $stmt->execute($params);
    $value = $stmt->fetchColumn();
    return $value !== false ? (string)$value : null;
}
