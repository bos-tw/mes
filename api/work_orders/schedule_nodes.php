<?php
/**
 * 生產工單排程節點 API
 *
 * 一般工單以 work_orders 為排程節點；拆分工單以 work_order_machine_runs
 * 為排程節點，讓同一主工單可分別排到多台機台。
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
$pdo = db();
$method = requireMethod(['GET', 'PUT', 'PATCH']);

if ($method === 'GET') {
    handleScheduleNodesList($pdo);
    return;
}

handleScheduleNodeUpdate($pdo);

function handleScheduleNodesList(PDO $pdo): void
{
    $normalSql = "
        SELECT
            CONCAT('wo:', wo.id) AS node_key,
            'work_order' AS node_type,
            wo.id AS node_id,
            wo.id AS work_order_id,
            NULL AS machine_run_id,
            wo.work_order_number,
            wo.work_order_type,
            NULL AS run_label,
            wo.machine_id,
            wo.machine_sequence,
            wo.scheduled_start_date,
            wo.scheduled_end_date,
            wo.actual_start_date,
            wo.actual_end_date,
            lv.value_key AS status,
            wo.status_lookup_id,
            wo.completed_at,
            o.order_number,
            c.name AS customer_name,
            si.name AS screening_item_name,
            m.name AS machine_name,
            lv.value_label AS status_label,
            lv.value_key AS status_key,
            COALESCE(womr_summary.machine_run_count, 0) AS machine_run_count,
            COALESCE(womr_summary.scheduled_machine_run_count, 0) AS scheduled_machine_run_count
        FROM work_orders wo
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON wo.machine_id = m.id
        LEFT JOIN lookup_values lv ON wo.status_lookup_id = lv.id
        LEFT JOIN (
            SELECT
                work_order_id,
                COUNT(*) AS machine_run_count,
                SUM(CASE WHEN machine_id IS NOT NULL THEN 1 ELSE 0 END) AS scheduled_machine_run_count
            FROM work_order_machine_runs
            WHERE deleted_at IS NULL
            GROUP BY work_order_id
        ) womr_summary ON womr_summary.work_order_id = wo.id
        WHERE wo.deleted_at IS NULL
          AND COALESCE(wo.work_order_type, 'normal') != 'split'
    ";

    $splitSql = "
        SELECT
            CONCAT('mr:', womr.id) AS node_key,
            'machine_run' AS node_type,
            womr.id AS node_id,
            wo.id AS work_order_id,
            womr.id AS machine_run_id,
            wo.work_order_number,
            wo.work_order_type,
            womr.run_label,
            womr.machine_id,
            womr.machine_sequence,
            womr.scheduled_start_date,
            womr.scheduled_end_date,
            womr.actual_start_date,
            womr.actual_end_date,
            womr.status,
            wo.status_lookup_id,
            wo.completed_at,
            o.order_number,
            c.name AS customer_name,
            si.name AS screening_item_name,
            m.name AS machine_name,
            womr.status AS status_label,
            womr.status AS status_key,
            womr_summary.machine_run_count,
            womr_summary.scheduled_machine_run_count
        FROM work_order_machine_runs womr
        JOIN work_orders wo ON wo.id = womr.work_order_id
        LEFT JOIN order_items oi ON wo.order_item_id = oi.id
        LEFT JOIN orders o ON oi.order_id = o.id
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN screening_items si ON oi.screening_item_id = si.id
        LEFT JOIN machines m ON womr.machine_id = m.id
        LEFT JOIN (
            SELECT
                work_order_id,
                COUNT(*) AS machine_run_count,
                SUM(CASE WHEN machine_id IS NOT NULL THEN 1 ELSE 0 END) AS scheduled_machine_run_count
            FROM work_order_machine_runs
            WHERE deleted_at IS NULL
            GROUP BY work_order_id
        ) womr_summary ON womr_summary.work_order_id = wo.id
        WHERE wo.deleted_at IS NULL
          AND womr.deleted_at IS NULL
          AND COALESCE(wo.work_order_type, 'normal') = 'split'
    ";

    $stmt = $pdo->query("SELECT * FROM (($normalSql) UNION ALL ($splitSql)) schedule_nodes ORDER BY work_order_id ASC, node_type ASC, COALESCE(machine_sequence, 2147483647), node_id ASC");
    $nodes = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];

    jsonResponse([
        'success' => true,
        'data' => $nodes,
    ]);
}

function handleScheduleNodeUpdate(PDO $pdo): void
{
    $payload = getJsonInput();
    $nodeKey = trim((string)($payload['node_key'] ?? ($_GET['node_key'] ?? '')));

    if (!preg_match('/^(wo|mr):(\d+)$/', $nodeKey, $matches)) {
        jsonResponse(['success' => false, 'message' => '排程節點格式不正確。'], 400);
    }

    $nodeType = $matches[1];
    $nodeId = (int)$matches[2];
    $machineId = $payload['machine_id'] ?? null;
    $machineId = ($machineId === '' || $machineId === null) ? null : (int)$machineId;
    $machineSequence = $payload['machine_sequence'] ?? null;
    $machineSequence = ($machineSequence === '' || $machineSequence === null) ? null : (int)$machineSequence;

    $fields = [
        'machine_id' => $machineId,
        'machine_sequence' => $machineSequence,
        'scheduled_start_date' => normalizeWorkOrderDateTimeValue($payload['scheduled_start_date'] ?? null),
        'scheduled_end_date' => normalizeWorkOrderDateTimeValue($payload['scheduled_end_date'] ?? null),
        'actual_start_date' => normalizeWorkOrderDateTimeValue($payload['actual_start_date'] ?? null),
        'actual_end_date' => normalizeWorkOrderDateTimeValue($payload['actual_end_date'] ?? null),
    ];

    try {
        $pdo->beginTransaction();

        if ($nodeType === 'wo') {
            $stmt = $pdo->prepare("
                UPDATE work_orders
                SET machine_id = :machine_id,
                    machine_sequence = :machine_sequence,
                    scheduled_start_date = :scheduled_start_date,
                    scheduled_end_date = :scheduled_end_date,
                    actual_start_date = :actual_start_date,
                    actual_end_date = :actual_end_date
                WHERE id = :id AND deleted_at IS NULL
            ");
            $stmt->execute($fields + ['id' => $nodeId]);
            $workOrderId = $nodeId;
        } else {
            $lookup = $pdo->prepare("
                SELECT work_order_id
                FROM work_order_machine_runs
                WHERE id = :id AND deleted_at IS NULL
                LIMIT 1
            ");
            $lookup->execute(['id' => $nodeId]);
            $workOrderId = (int)($lookup->fetchColumn() ?: 0);
            if ($workOrderId <= 0) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => '找不到排程機台明細。'], 404);
            }

            $stmt = $pdo->prepare("
                UPDATE work_order_machine_runs
                SET machine_id = :machine_id,
                    machine_sequence = :machine_sequence,
                    scheduled_start_date = :scheduled_start_date,
                    scheduled_end_date = :scheduled_end_date,
                    actual_start_date = :actual_start_date,
                    actual_end_date = :actual_end_date,
                    status = CASE
                        WHEN :machine_id_for_status IS NULL THEN 'pending'
                        WHEN status = 'pending' THEN 'scheduled'
                        ELSE status
                    END
                WHERE id = :id AND deleted_at IS NULL
            ");
            $stmt->execute($fields + [
                'machine_id_for_status' => $machineId,
                'id' => $nodeId,
            ]);
        }

        logAuditAction('Updated work order schedule node', 'work_orders', $workOrderId, [
            'node_key' => $nodeKey,
            'machine_id' => $machineId,
            'machine_sequence' => $machineSequence,
        ]);

        $pdo->commit();
        jsonResponse([
            'success' => true,
            'message' => '排程節點已更新。',
            'data' => [
                'node_key' => $nodeKey,
                'work_order_id' => $workOrderId,
            ],
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log('Update schedule node failed: ' . $e->getMessage());
        jsonResponse([
            'success' => false,
            'message' => safeErrorMessage($e, '更新排程節點失敗，請稍後重試。'),
        ], 500);
    }
}
