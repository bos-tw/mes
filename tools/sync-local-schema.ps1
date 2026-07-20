param(
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[sync-local-schema] $Message"
}

function Get-PhpConstantString {
    param(
        [string]$PhpContent,
        [string]$ConstantName
    )

    $pattern = 'const\s+{0}\s*=\s*''([^'']*)'';' -f [regex]::Escape($ConstantName)
    $match = [regex]::Match($PhpContent, $pattern)
    if (-not $match.Success) {
        throw "Cannot read constant '$ConstantName' from api/config.php."
    }

    return $match.Groups[1].Value
}

function Get-PhpConstantInt {
    param(
        [string]$PhpContent,
        [string]$ConstantName
    )

    $pattern = 'const\s+{0}\s*=\s*([0-9]+);' -f [regex]::Escape($ConstantName)
    $match = [regex]::Match($PhpContent, $pattern)
    if (-not $match.Success) {
        throw "Cannot read constant '$ConstantName' from api/config.php."
    }

    return [int]$match.Groups[1].Value
}

function Get-MySqlExePath {
    $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = @(
        'C:\mysql-8.0.44\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
        'C:\xampp\mysql\bin\mysql.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw 'Cannot find mysql.exe. Install MySQL CLI or add it to PATH.'
}

function Invoke-MySqlScalar {
    param(
        [string]$MySqlExe,
        [string]$DbHost,
        [int]$Port,
        [string]$User,
        [string]$Password,
        [string]$Database,
        [string]$Query
    )

    $args = @(
        "--host=$DbHost",
        "--port=$Port",
        "--user=$User",
        "--default-character-set=utf8mb4",
        '--batch',
        '--skip-column-names',
        "--execute=$Query",
        $Database
    )

    $previousMysqlPwd = $env:MYSQL_PWD
    try {
        if ($Password -ne '') {
            $env:MYSQL_PWD = $Password
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }

        $output = & $MySqlExe @args
        if ($LASTEXITCODE -ne 0) {
            throw "SQL check failed. Query: $Query"
        }

        if ($output -is [array]) {
            $output = $output -join "`n"
        }

        return ($output | Out-String).Trim()
    } finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        } else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

function Invoke-MySqlFile {
    param(
        [string]$MySqlExe,
        [string]$DbHost,
        [int]$Port,
        [string]$User,
        [string]$Password,
        [string]$Database,
        [string]$SqlFilePath
    )

    $sqlFileForMysql = $SqlFilePath -replace '\\', '/'
    $executeCommand = "source $sqlFileForMysql"

    $args = @(
        "--host=$DbHost",
        "--port=$Port",
        "--user=$User",
        "--default-character-set=utf8mb4",
        "--execute=$executeCommand",
        $Database
    )

    $previousMysqlPwd = $env:MYSQL_PWD
    try {
        if ($Password -ne '') {
            $env:MYSQL_PWD = $Password
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }

        & $MySqlExe @args | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed: $SqlFilePath"
        }
    } finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        } else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configPath = Join-Path $repoRoot 'api\config.php'
$migrationsDir = Join-Path $repoRoot 'migrations'

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Missing file: $configPath"
}

if (-not (Test-Path -LiteralPath $migrationsDir)) {
    throw "Missing folder: $migrationsDir"
}

$phpConfig = Get-Content -Raw -LiteralPath $configPath

$dbHost = if ($env:SCREWSYSTEM_DB_HOST) { $env:SCREWSYSTEM_DB_HOST } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_HOST' }
$dbPort = if ($env:SCREWSYSTEM_DB_PORT) { [int]$env:SCREWSYSTEM_DB_PORT } else { Get-PhpConstantInt -PhpContent $phpConfig -ConstantName 'DB_PORT' }
$dbName = if ($env:SCREWSYSTEM_DB_NAME) { $env:SCREWSYSTEM_DB_NAME } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_NAME' }
$dbUser = if ($env:SCREWSYSTEM_DB_USER) { $env:SCREWSYSTEM_DB_USER } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_USER' }
$dbPassword = if ($env:SCREWSYSTEM_DB_PASSWORD) { $env:SCREWSYSTEM_DB_PASSWORD } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_PASSWORD' }

$mysqlExe = Get-MySqlExePath

Write-Step ("Database: {0}@{1}:{2}" -f $dbName, $dbHost, $dbPort)
Write-Step "mysql.exe: $mysqlExe"

$migrationChecks = [ordered]@{
    '2026_05_09_create_system_update_jobs.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_update_jobs'), 1, 0);"
        Description = 'system_update_jobs table'
    }
    '2026_05_09_create_system_update_logs.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_update_logs'), 1, 0);"
        Description = 'system_update_logs table'
    }
    '2026_05_11_add_orders_final_quote_per_m.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'final_quote_per_m'), 1, 0);"
        Description = 'orders.final_quote_per_m column'
    }
    '2026_05_11_add_orders_single_ppm.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'single_ppm'), 1, 0);"
        Description = 'orders.single_ppm column'
    }
    '2026_05_12_add_work_orders_completed_at.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'completed_at') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'idx_work_orders_completed_at'), 1, 0);"
        Description = 'work_orders.completed_at column and index'
    }
    '2026_05_14_add_work_orders_machine_sequence.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'machine_sequence') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'idx_work_orders_machine_sequence'), 1, 0);"
        Description = 'work_orders.machine_sequence column and index'
    }
    '2026_05_16_update_permissions_display_names.sql' = @{
        CheckSql = "SELECT IF((SELECT HEX(name) FROM permissions WHERE id = 1 LIMIT 1) = 'E585ACE58FB8E59FBAE69CACE8B387E69699' AND (SELECT HEX(name) FROM permissions WHERE id = 20 LIMIT 1) = 'E6AC8AE99990E8A8ADE5AE9A' AND (SELECT HEX(name) FROM permissions WHERE id = 26 LIMIT 1) = 'E58897E58DB0E5A0B1E8A1A8E8AAAAE6988E', 1, 0);"
        Description = 'permissions display names migration applied'
    }
    '2026_05_18_add_production_work_order_schedule_permission.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM permissions WHERE name = 'production_work_order_schedule.read'), 1, 0);"
        Description = 'production_work_order_schedule.read permission exists'
    }
    '2026_05_30_add_orders_expected_delivery_period.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'expected_delivery_period'), 1, 0);"
        Description = 'orders.expected_delivery_period column'
    }
    '2026_05_30_backfill_work_order_inventory_metrics.sql' = @{
        CheckSql = "SELECT IF(NOT EXISTS(SELECT 1 FROM inventory_items ii JOIN work_orders wo ON wo.id = ii.work_order_id JOIN order_items oi ON oi.id = wo.order_item_id JOIN screening_items si ON si.id = oi.screening_item_id WHERE ii.deleted_at IS NULL AND ii.work_order_id IS NOT NULL AND COALESCE(ii.quantity_allocated, 0) = 0 AND COALESCE(ii.quantity_shipped, 0) = 0 AND (COALESCE(ii.quantity_on_hand, 0) = 0 OR COALESCE(ii.total_good_units, 0) = 0 OR COALESCE(ii.weight_per_unit_g, 0) = 0 OR COALESCE(wo.total_units, 0) = 0 OR COALESCE(wo.weight_per_unit_g, 0) = 0) AND COALESCE(oi.total_weight_kg, 0) > 0 AND COALESCE(si.weight_per_unit_g, 0) > 0), 1, 0);"
        Description = 'backfilled work order and inventory metrics'
    }
    '2026_05_31_add_split_work_order_foundation.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'work_order_type') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'inventory_items' AND column_name = 'receipt_type') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'production_records' AND column_name = 'machine_run_id') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs' AND column_name = 'calibration_employee_id') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs' AND column_name = 'quantity_to_produce') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs' AND column_name = 'screening_speed') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_defects') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs' AND index_name = 'idx_womr_machine_sequence') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_defects' AND index_name = 'uk_womd_run_service') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND index_name = 'idx_wopr_receipt_status') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'production_records' AND index_name = 'idx_production_records_machine_run') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'production_records' AND constraint_name = 'fk_production_records_machine_run') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_machine_runs' AND constraint_name = 'fk_womr_calibration_employee'), 1, 0);"
        Description = 'split work order foundation tables and columns'
    }
    '2026_06_07_add_production_record_tool_fields.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'production_records' AND column_name = 'production_source_mode') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'production_records' AND column_name = 'tool_name') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'production_records' AND column_name = 'tool_weight_kg'), 1, 0);"
        Description = 'production_records source mode and tool fields'
    }
    '2026_06_16_rebuild_number_sequences_management.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND column_name = 'seq_prefix') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND column_name = 'active_from') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND column_name = 'active_until') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND column_name = 'last_generated_on') AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND column_name = 'date_scope') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'number_sequences' AND index_name = 'uk_number_sequences_seq_key_active_from') AND EXISTS(SELECT 1 FROM number_sequences WHERE seq_key IN ('ORDER','WO','INV','SO','RO','WOPR')), 1, 0);"
        Description = 'number_sequences prefix and active-time management rebuild'
    }
    '2026_06_16_add_machine_capabilities_management.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'machine_capabilities') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'machine_capability_assignments') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'machine_capability_assignments' AND index_name = 'PRIMARY'), 1, 0);"
        Description = 'machine capability master and assignment tables'
    }
    '2026_06_16_add_machine_capability_to_machines.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'machines' AND column_name = 'machine_capability_id') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'machines' AND index_name = 'idx_machines_machine_capability_id') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'machines' AND constraint_name = 'fk_machines_machine_capability'), 1, 0);"
        Description = 'machines.machine_capability_id one-to-many relation and GENERAL seed'
    }
    '2026_06_20_add_work_order_order_item_unique.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'uk_work_orders_order_item_active' AND non_unique = 0) OR EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'uk_work_orders_order_item_source_active' AND non_unique = 0), 1, 0);"
        Description = 'active work order unique guard for order item / source chain'
    }
    '2026_06_20_add_work_order_execution_image_tables.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_completion_images') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_defect_images') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_tool_condition_images') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_completion_images' AND constraint_name = 'fk_woci_work_order') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_defect_images' AND constraint_name = 'fk_wodi_work_order') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_tool_condition_images' AND constraint_name = 'fk_wotci_work_order'), 1, 0);"
        Description = 'work order completion, defect, and tool condition image tables'
    }
    '2026_06_20_add_work_order_operation_logs.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_operation_logs') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_order_operation_logs' AND index_name = 'idx_wool_work_order_id') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_operation_logs' AND constraint_name = 'fk_wool_work_order'), 1, 0);"
        Description = 'work order operation logs table'
    }
    '2026_06_27_add_work_order_pre_production_images.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_pre_production_images') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_order_pre_production_images' AND index_name = 'idx_woppi_work_order_id') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_pre_production_images' AND constraint_name = 'fk_woppi_work_order') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_pre_production_images' AND constraint_name = 'fk_woppi_uploaded_by_employee'), 1, 0);"
        Description = 'work order pre-production reference image table'
    }
    '2026_07_15_assign_access_pending_role.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM roles WHERE name = 'access_pending') AND NOT EXISTS(SELECT 1 FROM employees e LEFT JOIN employee_roles er ON er.employee_id = e.id WHERE e.deleted_at IS NULL AND e.status = 'active' GROUP BY e.id HAVING COUNT(er.role_id) = 0), 1, 0);"
        Description = 'active roleless employees assigned to zero-permission access_pending role'
    }
    '2026_07_15_reconcile_shipping_return_status.sql' = @{
        CheckSql = "SELECT IF(NOT EXISTS(SELECT 1 FROM shipping_orders so WHERE so.has_return <> CASE WHEN EXISTS(SELECT 1 FROM shipping_order_items soi INNER JOIN return_order_items roi ON roi.shipping_order_item_id = soi.id INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL WHERE soi.shipping_order_id = so.id) THEN 1 ELSE 0 END OR so.return_status <> CASE WHEN NOT EXISTS(SELECT 1 FROM shipping_order_items soi INNER JOIN return_order_items roi ON roi.shipping_order_item_id = soi.id INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL WHERE soi.shipping_order_id = so.id) THEN 'none' WHEN EXISTS(SELECT 1 FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id) AND NOT EXISTS(SELECT 1 FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id AND COALESCE((SELECT SUM(roi.returned_quantity) FROM return_order_items roi INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL WHERE roi.shipping_order_item_id = soi.id), 0) < soi.shipped_quantity) THEN 'full' ELSE 'partial' END), 1, 0);"
        Description = 'shipping return flags reconciled from active return order items'
    }
    '2026_07_16_unify_work_order_status.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'workflow_status_transitions') AND NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'status') AND NOT EXISTS(SELECT 1 FROM work_orders WHERE status_lookup_id IS NULL) AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'inventory_item_sources' AND index_name = 'uq_inventory_item_source') AND NOT EXISTS(SELECT 1 FROM inventory_items ii WHERE ii.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM inventory_item_sources iis WHERE iis.inventory_item_id = ii.id)) AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND column_name = 'id' AND extra LIKE '%auto_increment%' AND table_name IN ('calendar_event_reminders','daily_machine_inspection_items','daily_machine_inspections','dashboard_calendar_events','domain_event_outbox','inventory_transactions','lookup_domains','machine_maintenance_tasks','number_sequences','production_quality_records','quality_issue_reports','return_order_items','return_orders','shipping_order_items','shipping_orders','shipping_quality_inspections','system_parameters')) = 17, 1, 0);"
        Description = 'single-source work order status, workflow history, and complete inventory source chain'
    }
    '2026_07_16_backfill_return_inventory_sources.sql' = @{
        CheckSql = "SELECT IF(NOT EXISTS(SELECT 1 FROM return_order_items roi JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id WHERE soi.inventory_item_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM inventory_item_sources iis WHERE iis.source_type = 'return_order_item' AND iis.source_id = roi.id AND iis.inventory_item_id = soi.inventory_item_id)), 1, 0);"
        Description = 'return items traced back to their original inventory source'
    }
    '2026_07_16_enforce_immutable_audit_logs.sql' = @{
        CheckSql = "SELECT IF((SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE() AND trigger_name IN ('trg_audit_logs_block_update','trg_audit_logs_block_delete','trg_workflow_transitions_block_update','trg_workflow_transitions_block_delete')) = 4, 1, 0);"
        Description = 'database-enforced immutable audit and workflow transition evidence'
    }
    '2026_06_21_add_partial_receipt_control_fields.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_net_weight_kg') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_units') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_reason_code') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_notes') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_confirmed_by') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'shortage_confirmed_at') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND constraint_name = 'fk_work_orders_shortage_confirmed_by') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND column_name = 'shipping_tool_details') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND column_name = 'reversed_at') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND column_name = 'reversed_by_employee_id') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND column_name = 'reverse_reason') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND constraint_name = 'fk_wopr_reversed_by') AND EXISTS(SELECT 1 FROM permissions WHERE name = 'work_orders.partial_receipt') AND EXISTS(SELECT 1 FROM permissions WHERE name = 'work_orders.reverse_partial_receipt') AND EXISTS(SELECT 1 FROM permissions WHERE name = 'work_orders.confirm_shortage'), 1, 0);"
        Description = 'partial receipt control fields and permissions'
    }
    '2026_06_21_add_partial_receipt_shipping_tool_details_table.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipt_tools') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipts' AND column_name = 'shipping_tool_details' AND data_type = 'text') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipt_tools' AND constraint_name = 'fk_woprt_partial_receipt') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipt_tools' AND constraint_name = 'fk_woprt_order_item_tool') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'work_order_partial_receipt_tools' AND constraint_name = 'fk_woprt_tool'), 1, 0);"
        Description = 'partial receipt shipping tool detail table and text summary column'
    }
    '2026_06_22_add_shipping_phase1_summary_tables.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'shipping_orders' AND column_name = 'shipment_purpose') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'shipping_order_defect_summaries') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'shipping_order_tool_summaries') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'shipping_order_defect_summaries' AND index_name = 'uk_sods_shipping_order_id' AND non_unique = 0) AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'shipping_order_defect_summaries' AND constraint_name = 'fk_sods_shipping_order') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'shipping_order_tool_summaries' AND constraint_name = 'fk_sots_shipping_order'), 1, 0);"
        Description = 'shipping phase1 shipment purpose, defect summary, and tool summary tables'
    }
    '2026_06_23_add_rescreen_batches_foundation.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_items') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_rules') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_defects') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'inventory_item_sources') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'source_rescreen_batch_id') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'uk_work_orders_order_item_source_active' AND non_unique = 0) AND EXISTS(SELECT 1 FROM number_sequences WHERE seq_key = 'RB'), 1, 0);"
        Description = 'rescreen batch foundation tables, work order source linkage, and RB number sequence'
    }
    '2026_06_25_refine_second_screening_model.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'source_return_order_id' AND is_nullable = 'YES') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_items' AND column_name = 'return_order_item_id' AND is_nullable = 'YES') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'second_screening_reason') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'customer_approval_reference') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'source_requirement_id') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'source_defect_history_record_id') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND index_name = 'idx_rescreen_batches_second_reason'), 1, 0);"
        Description = 'second screening reason, work-order source, approval reference, and traceability fields'
    }
    '2026_06_25_expand_second_screening_reason_length.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'second_screening_reason' AND character_maximum_length >= 255), 1, 0);"
        Description = 'second_screening_reason expanded for free-text user input'
    }
    '2026_06_25_add_rescreen_execution_details.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_defects' AND column_name = 'disposition') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_defects' AND column_name = 'recorded_at') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_defects' AND column_name = 'recorded_by_employee_id') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_defects' AND constraint_name = 'fk_rescreen_batch_defects_recorded_by') AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_production_records'), 1, 0);"
        Description = 'editable rescreen service results and dedicated rescreen production records'
    }
    '2026_06_25_archive_rescreen_execution_work_orders.sql' = @{
        CheckSql = "SELECT IF(NOT EXISTS(SELECT cleanup.work_order_id FROM (SELECT wo.id AS work_order_id FROM work_orders wo LEFT JOIN inventory_items ii ON ii.work_order_id = wo.id AND ii.deleted_at IS NULL LEFT JOIN work_order_machine_runs womr ON womr.work_order_id = wo.id LEFT JOIN work_order_screening_defects wosd ON wosd.work_order_id = wo.id LEFT JOIN production_records pr ON pr.work_order_id = wo.id LEFT JOIN work_order_images woi ON woi.work_order_id = wo.id AND woi.deleted_at IS NULL LEFT JOIN work_order_completion_images woci ON woci.work_order_id = wo.id AND woci.deleted_at IS NULL LEFT JOIN work_order_defect_images wodi ON wodi.work_order_id = wo.id AND wodi.deleted_at IS NULL LEFT JOIN work_order_tool_condition_images wotci ON wotci.work_order_id = wo.id AND wotci.deleted_at IS NULL WHERE wo.deleted_at IS NULL AND wo.work_order_type = 'rescreen' AND COALESCE(wo.source_rescreen_batch_id, 0) > 0 GROUP BY wo.id HAVING COUNT(ii.id) = 0 AND COUNT(womr.id) = 0 AND COUNT(wosd.id) = 0 AND COUNT(pr.id) = 0 AND COUNT(woi.id) = 0 AND COUNT(woci.id) = 0 AND COUNT(wodi.id) = 0 AND COUNT(wotci.id) = 0) AS cleanup), 1, 0);"
        Description = 'archive empty-shell rescreen execution work orders and detach them from batches'
    }
    '2026_06_26_add_rescreen_work_order_execution_model.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'scheduled_start_date') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'machine_id') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND column_name = 'first_piece_length') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'rescreen_batches' AND constraint_name = 'fk_rescreen_batches_machine'), 1, 0);"
        Description = 'rescreen work-order-level execution schedule and first-piece fields'
    }
    '2026_06_26_add_rescreen_batch_images.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_images') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_images' AND column_name = 'rescreen_batch_id') AND EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'rescreen_batch_images' AND constraint_name = 'fk_rescreen_batch_images_batch'), 1, 0);"
        Description = 'rescreen batch site image uploads'
    }
    '2026_07_18_repair_lookup_and_message_metadata.sql' = @{
        CheckSql = "SELECT IF((SELECT HEX(description) FROM lookup_domains WHERE id = 0 AND domain_key = 'service_category' LIMIT 1) = 'E794A8E696BCE5AE9AE7BEA9E69C8DE58B99E58886E9A19E' AND (SELECT HEX(COLUMN_COMMENT) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'message_attachments' AND column_name = 'file_name') = 'E6AA94E6A188E5908DE7A8B1' AND (SELECT HEX(TABLE_COMMENT) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'message_attachments') = 'E8A88AE681AFE99984E4BBB6', 1, 0);"
        Description = 'lookup domain and message attachment metadata repaired'
    }
    '2026_07_18_reconcile_status_lookup_mirrors.sql' = @{
        CheckSql = "SELECT IF(NOT EXISTS(SELECT 1 FROM employees e WHERE e.status_lookup_id IS NULL OR NOT EXISTS(SELECT 1 FROM lookup_values lv JOIN lookup_domains ld ON ld.id = lv.domain_id AND ld.domain_key = 'employee_status' WHERE lv.id = e.status_lookup_id AND lv.value_key = e.status)) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.status_lookup_id IS NULL OR NOT EXISTS(SELECT 1 FROM lookup_values lv JOIN lookup_domains ld ON ld.id = lv.domain_id AND ld.domain_key = 'status_order' WHERE lv.id = o.status_lookup_id AND lv.value_key = o.status)) AND NOT EXISTS(SELECT 1 FROM shipping_orders so WHERE so.status_lookup_id IS NULL OR NOT EXISTS(SELECT 1 FROM lookup_values lv JOIN lookup_domains ld ON ld.id = lv.domain_id AND ld.domain_key = 'shipping_status' WHERE lv.id = so.status_lookup_id AND lv.value_key = so.status)) AND NOT EXISTS(SELECT 1 FROM tools t WHERE t.status_lookup_id IS NULL OR NOT EXISTS(SELECT 1 FROM lookup_values lv JOIN lookup_domains ld ON ld.id = lv.domain_id AND ld.domain_key = 'tool_status' WHERE lv.id = t.status_lookup_id AND lv.value_key = t.status)) AND EXISTS(SELECT 1 FROM lookup_values lv JOIN lookup_domains ld ON ld.id = lv.domain_id WHERE ld.domain_key = 'tool_status' AND lv.value_key = 'retired'), 1, 0);"
        Description = 'legacy status lookup mirrors reconciled'
    }
    '2026_07_19_add_order_item_number.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_items' AND column_name = 'order_item_sequence' AND is_nullable = 'NO') AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_items' AND column_name = 'order_item_number' AND is_nullable = 'NO') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'uk_order_items_order_item_number' AND non_unique = 0) AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'uk_order_items_order_sequence' AND non_unique = 0), 1, 0);"
        Description = 'stable order detail identifier and per-order sequence'
    }
    '2026_07_20_add_order_items_soft_delete.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_items' AND column_name = 'deleted_at' AND is_nullable = 'YES') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_order_active'), 1, 0);"
        Description = 'order item soft-delete column and active-order index'
    }
    '2026_07_19_add_basic_settings_permission.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM permissions WHERE name = 'basic_settings.read'), 1, 0);"
        Description = 'basic_settings.read permission exists'
    }
}

$migrationFiles = @()
$knownMigrationNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($migrationName in $migrationChecks.Keys) {
    [void]$knownMigrationNames.Add($migrationName)
    $migrationPath = Join-Path $migrationsDir $migrationName
    if (Test-Path -LiteralPath $migrationPath -PathType Leaf) {
        $migrationFiles += Get-Item -LiteralPath $migrationPath
    }
}

$unknownMigrations = @()
$pendingMigrations = @()
$appliedMigrations = @()

foreach ($migrationFile in (Get-ChildItem -LiteralPath $migrationsDir -File)) {
    if (-not $knownMigrationNames.Contains($migrationFile.Name)) {
        $unknownMigrations += $migrationFile.Name
    }
}

foreach ($migrationFile in $migrationFiles) {
    $name = $migrationFile.Name
    $checkDefinition = $migrationChecks[$name]
    $checkResult = Invoke-MySqlScalar `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -Query $checkDefinition.CheckSql

    if ($checkResult -eq '1') {
        $appliedMigrations += $name
    } else {
        $pendingMigrations += $migrationFile
    }
}

if ($unknownMigrations.Count -gt 0) {
    Write-Warning "Unknown migrations found:"
    foreach ($item in $unknownMigrations) {
        Write-Warning "- $item"
    }
    Write-Warning 'Update $migrationChecks in tools/sync-local-schema.ps1 before running again.'
    exit 2
}

Write-Step ("Applied: {0}, Pending: {1}" -f $appliedMigrations.Count, $pendingMigrations.Count)

if ($pendingMigrations.Count -eq 0) {
    Write-Step 'Schema is already in sync.'
    exit 0
}

if ($DryRun) {
    Write-Step 'DryRun enabled. Pending migrations:'
    foreach ($migration in $pendingMigrations) {
        Write-Host "- $($migration.Name)"
    }
    exit 0
}

Write-Step 'Applying pending migrations...'
foreach ($migration in $pendingMigrations) {
    Write-Step "Applying: $($migration.Name)"
    Invoke-MySqlFile `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -SqlFilePath $migration.FullName
}

Write-Step 'Verifying all migration checks...'
foreach ($migrationFile in $migrationFiles) {
    $name = $migrationFile.Name
    $checkDefinition = $migrationChecks[$name]
    $checkResult = Invoke-MySqlScalar `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -Query $checkDefinition.CheckSql

    if ($checkResult -ne '1') {
        throw "Post-check failed for $name ($($checkDefinition.Description))."
    }
}

Write-Step 'Local schema sync completed successfully.'
