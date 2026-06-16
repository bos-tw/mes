<?php
declare(strict_types=1);

function readMachineCapabilityPayload(): array
{
    return readRequestPayload();
}

function validateMachineCapabilityData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    if (!$isUpdate || array_key_exists('capability_code', $payload)) {
        $code = strtoupper(trim((string)($payload['capability_code'] ?? '')));
        if ($code === '') {
            $errors['capability_code'] = '能力代碼為必填。';
        } elseif (!preg_match('/^[A-Z0-9_-]{1,50}$/', $code)) {
            $errors['capability_code'] = '能力代碼只能包含英數字、底線或連字號，且不可超過 50 字元。';
        } else {
            $data['capability_code'] = $code;
        }
    }

    if (!$isUpdate || array_key_exists('capability_name', $payload)) {
        $name = trim((string)($payload['capability_name'] ?? ''));
        if ($name === '') {
            $errors['capability_name'] = '能力名稱為必填。';
        } else {
            $data['capability_name'] = mb_substr($name, 0, 100);
        }
    }

    if (array_key_exists('description', $payload)) {
        $description = trim((string)($payload['description'] ?? ''));
        $data['description'] = $description !== '' ? mb_substr($description, 0, 255) : null;
    }

    if (array_key_exists('sort_order', $payload)) {
        $sortOrderRaw = $payload['sort_order'];
        if ($sortOrderRaw === null || $sortOrderRaw === '') {
            $data['sort_order'] = 0;
        } elseif (!is_numeric((string)$sortOrderRaw)) {
            $errors['sort_order'] = '排序必須為數字。';
        } else {
            $data['sort_order'] = (int)$sortOrderRaw;
        }
    } elseif (!$isUpdate) {
        $data['sort_order'] = 0;
    }

    if (array_key_exists('is_active', $payload)) {
        $activeRaw = $payload['is_active'];
        $data['is_active'] = in_array($activeRaw, [1, '1', true, 'true', 'on'], true) ? 1 : 0;
    } elseif (!$isUpdate) {
        $data['is_active'] = 1;
    }

    return ['data' => $data, 'errors' => $errors];
}

function transformMachineCapability(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'capability_code' => $row['capability_code'],
        'capability_name' => $row['capability_name'],
        'description' => $row['description'],
        'sort_order' => (int)($row['sort_order'] ?? 0),
        'is_active' => (bool)($row['is_active'] ?? false),
        'machine_count' => isset($row['machine_count']) ? (int)$row['machine_count'] : 0,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function findMachineCapability(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("
        SELECT mc.id, mc.capability_code, mc.capability_name, mc.description, mc.sort_order, mc.is_active, mc.created_at, mc.updated_at,
               COUNT(m.id) AS machine_count
        FROM machine_capabilities mc
        LEFT JOIN machines m ON m.machine_capability_id = mc.id
        WHERE mc.id = :id
        GROUP BY mc.id, mc.capability_code, mc.capability_name, mc.description, mc.sort_order, mc.is_active, mc.created_at, mc.updated_at
        LIMIT 1
    ");
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row ?: null;
}
