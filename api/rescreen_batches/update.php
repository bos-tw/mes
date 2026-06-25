<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod(['PUT', 'PATCH']);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少有效的案件 ID。'], 400);
}

$payload = getJsonInput();
if (!is_array($payload) || $payload === []) {
    jsonResponse(['success' => false, 'message' => '請提供有效的 JSON 資料。'], 400);
}

$pdo = db();
$existing = getRescreenBatchDetails($pdo, $id);
if ($existing === null) {
    jsonResponse(['success' => false, 'message' => '找不到指定的二次篩選案件。'], 404);
}

$validation = validateRescreenBatchPayload($payload, true);
if ($validation['errors'] !== []) {
    jsonResponse([
        'success' => false,
        'message' => '資料驗證失敗。',
        'errors' => $validation['errors'],
    ], 400);
}

$data = $validation['data'];
$rulesPayload = isset($payload['rules']) && is_array($payload['rules']) ? $payload['rules'] : null;

if ($data === [] && $rulesPayload === null) {
    jsonResponse(['success' => false, 'message' => '沒有可更新的欄位。'], 400);
}

try {
    $pdo->beginTransaction();

    if ($data !== []) {
        $setParts = [];
        foreach (array_keys($data) as $column) {
            $setParts[] = "`{$column}` = :{$column}";
        }
        $stmt = $pdo->prepare("
            UPDATE rescreen_batches
            SET " . implode(', ', $setParts) . "
            WHERE id = :id
        ");
        $stmt->execute(array_merge($data, ['id' => $id]));
    }

    if ($rulesPayload !== null) {
        $replaceStmt = $pdo->prepare("
            UPDATE rescreen_batch_rules
            SET
                is_enabled = :is_enabled,
                tolerance_plus_value = :tolerance_plus_value,
                tolerance_plus_over = :tolerance_plus_over,
                tolerance_minus_value = :tolerance_minus_value,
                tolerance_minus_over = :tolerance_minus_over,
                ppm_standard = :ppm_standard,
                notes = :notes
            WHERE id = :id
              AND rescreen_batch_id = :rescreen_batch_id
        ");

        foreach (['original', 'rescreen'] as $stage) {
            $rows = isset($rulesPayload[$stage]) && is_array($rulesPayload[$stage]) ? $rulesPayload[$stage] : [];
            foreach ($rows as $row) {
                $ruleId = filter_var($row['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
                if ($ruleId === false) {
                    continue;
                }
                $replaceStmt->execute([
                    'id' => (int)$ruleId,
                    'rescreen_batch_id' => $id,
                    'is_enabled' => !empty($row['is_enabled']) ? 1 : 0,
                    'tolerance_plus_value' => ($row['tolerance_plus_value'] ?? '') !== '' ? (float)$row['tolerance_plus_value'] : null,
                    'tolerance_plus_over' => trim((string)($row['tolerance_plus_over'] ?? '')) ?: null,
                    'tolerance_minus_value' => ($row['tolerance_minus_value'] ?? '') !== '' ? (float)$row['tolerance_minus_value'] : null,
                    'tolerance_minus_over' => trim((string)($row['tolerance_minus_over'] ?? '')) ?: null,
                    'ppm_standard' => ($row['ppm_standard'] ?? '') !== '' ? (float)$row['ppm_standard'] : null,
                    'notes' => trim((string)($row['notes'] ?? '')) ?: null,
                ]);
            }
        }
    }

    $updated = getRescreenBatchDetails($pdo, $id);
    logAuditAction('Update rescreen batch', 'rescreen_batches', $id, [
        'updated_fields' => array_keys($data),
        'rules_updated' => $rulesPayload !== null,
    ]);
    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => '二次篩選案件已更新。',
        'data' => $updated,
    ]);
} catch (Exception $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Update rescreen batch failed: ' . $exception->getMessage());
    jsonResponse([
        'success' => false,
        'message' => safeErrorMessage($exception, '更新二次篩選案件失敗，請稍後重試。'),
    ], 500);
}
