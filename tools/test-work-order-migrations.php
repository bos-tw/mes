<?php
declare(strict_types=1);

$root = dirname(__DIR__);
require $root . '/api/config.php';
require $root . '/api/system_update_common.php';

function quoteMigrationIdentifier(string $name): string
{
    return '`' . str_replace('`', '``', $name) . '`';
}

function assertMigrationTest(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function schemaObjectExists(PDO $pdo, string $objectType, string $table, string $name): bool
{
    $sources = [
        'column' => ['COLUMNS', 'COLUMN_NAME'],
        'index' => ['STATISTICS', 'INDEX_NAME'],
        'table' => ['TABLES', 'TABLE_NAME'],
    ];
    if (!isset($sources[$objectType])) {
        throw new InvalidArgumentException('Unsupported schema object type: ' . $objectType);
    }

    [$source, $nameColumn] = $sources[$objectType];
    $sql = "SELECT COUNT(*) FROM information_schema.$source WHERE TABLE_SCHEMA = DATABASE()";
    $params = [':name' => $name];
    if ($objectType !== 'table') {
        $sql .= ' AND TABLE_NAME = :table';
        $params[':table'] = $table;
    }
    $sql .= " AND $nameColumn = :name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (int)$stmt->fetchColumn() > 0;
}

function dropMigrationIndexIfExists(PDO $pdo, string $table, string $index): void
{
    if (!schemaObjectExists($pdo, 'index', $table, $index)) {
        return;
    }
    $pdo->exec(
        'ALTER TABLE ' . quoteMigrationIdentifier($table)
        . ' DROP INDEX ' . quoteMigrationIdentifier($index)
    );
}

function dropMigrationColumnIfExists(PDO $pdo, string $table, string $column): void
{
    if (!schemaObjectExists($pdo, 'column', $table, $column)) {
        return;
    }
    $pdo->exec(
        'ALTER TABLE ' . quoteMigrationIdentifier($table)
        . ' DROP COLUMN ' . quoteMigrationIdentifier($column)
    );
}

$config = getDatabaseConfig();
$sourceDb = (string)$config['dbname'];
$testDb = 'mes_migration_test_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3));
assertMigrationTest(
    preg_match('/^mes_migration_test_[0-9]{8}_[0-9]{6}_[0-9a-f]{6}$/', $testDb) === 1,
    'Unsafe test database name.'
);

$serverDsn = sprintf(
    'mysql:host=%s;port=%d;charset=%s',
    $config['host'],
    $config['port'],
    $config['charset']
);
$admin = new PDO($serverDsn, $config['user'], $config['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$admin->exec(
    'CREATE DATABASE ' . quoteMigrationIdentifier($testDb)
    . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'
);
$testPdo = null;

try {
    $tableStmt = $admin->prepare(
        "SELECT TABLE_NAME
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = :schema
           AND TABLE_TYPE = 'BASE TABLE'
         ORDER BY TABLE_NAME"
    );
    $tableStmt->execute([':schema' => $sourceDb]);
    $tables = $tableStmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        $admin->exec(
            'CREATE TABLE ' . quoteMigrationIdentifier($testDb) . '.' . quoteMigrationIdentifier((string)$table)
            . ' LIKE ' . quoteMigrationIdentifier($sourceDb) . '.' . quoteMigrationIdentifier((string)$table)
        );
    }

    $testDsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $testDb,
        $config['charset']
    );
    $testPdo = new PDO($testDsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    $fixtureTables = [
        'customers',
        'employees',
        'orders',
        'order_items',
        'work_orders',
        'screening_services',
        'order_item_screening_details',
        'work_order_machine_runs',
        'work_order_machine_defects',
        'work_order_first_piece_dimensions',
        'production_records',
        'order_item_tools',
        'tools',
        'inventory_items',
        'shipping_order_items',
        'inventory_item_sources',
    ];
    foreach ($fixtureTables as $table) {
        assertMigrationTest(in_array($table, $tables, true), 'Fixture table missing: ' . $table);
        $testPdo->exec(
            'INSERT INTO ' . quoteMigrationIdentifier($table)
            . ' SELECT * FROM ' . quoteMigrationIdentifier($sourceDb) . '.' . quoteMigrationIdentifier($table)
            . ' LIMIT 25'
        );
    }

    $newTables = [
        'shipping_order_item_packages',
        'inventory_packages',
        'work_order_machine_output_tools',
        'work_order_stage_transfers',
        'work_order_machine_result_packages',
        'work_order_machine_result_images',
        'work_order_machine_input_tools',
        'work_order_machine_results',
        'work_order_image_requirements',
        'work_order_stage_services',
        'work_order_stages',
    ];
    foreach ($newTables as $table) {
        $testPdo->exec('DROP TABLE IF EXISTS ' . quoteMigrationIdentifier($table));
    }

    $indexes = [
        'order_items' => ['idx_order_items_delivery_schedule'],
        'work_order_machine_runs' => ['idx_womr_stage'],
        'work_order_machine_defects' => ['idx_womd_machine_result'],
        'work_order_first_piece_dimensions' => ['idx_wofpd_stage', 'idx_wofpd_machine_round'],
        'production_records' => [
            'idx_production_records_stage',
            'idx_production_records_card_sequence',
            'idx_production_records_weighed_by',
            'idx_production_records_locked_by',
        ],
        'inventory_items' => ['idx_inventory_stock_category'],
        'inventory_item_sources' => [
            'idx_iis_source_stage',
            'idx_iis_source_machine_result',
            'idx_iis_source_stage_transfer',
        ],
    ];
    foreach ($indexes as $table => $indexNames) {
        foreach ($indexNames as $indexName) {
            dropMigrationIndexIfExists($testPdo, $table, $indexName);
        }
    }

    $columns = [
        'customers' => ['production_image_min_count', 'production_image_requirement'],
        'order_items' => [
            'production_image_min_count',
            'production_image_requirement',
            'expected_delivery_period',
            'expected_delivery_date',
        ],
        'work_order_machine_runs' => ['stage_id'],
        'work_order_machine_defects' => ['machine_result_id'],
        'work_order_first_piece_dimensions' => [
            'inspection_result',
            'inspection_round',
            'machine_run_id',
            'stage_id',
        ],
        'production_records' => [
            'card_locked_by_employee_id',
            'card_locked_at',
            'weighed_by_employee_id',
            'weighed_at',
            'actual_net_weight_kg',
            'actual_gross_weight_kg',
            'planned_units',
            'card_reference_units',
            'card_sequence',
            'stage_id',
        ],
        'inventory_items' => ['stock_category'],
        'shipping_order_items' => ['stock_category_snapshot'],
        'inventory_item_sources' => [
            'source_stage_transfer_id',
            'source_machine_result_id',
            'source_stage_id',
        ],
    ];
    foreach ($columns as $table => $columnNames) {
        foreach ($columnNames as $columnName) {
            dropMigrationColumnIfExists($testPdo, $table, $columnName);
        }
    }

    $deliveryMigration = $root . '/migrations/2026_07_22_add_order_item_expected_delivery.sql';
    $flowMigration = $root . '/migrations/2026_07_23_add_work_order_production_flow.sql';

    $deliveryFirst = executeSqlMigrationFile($testPdo, $deliveryMigration);
    $deliveryRetry = executeSqlMigrationFile($testPdo, $deliveryMigration);
    $deliveryBackfill = (int)$testPdo->query(
        'SELECT COUNT(*)
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.expected_delivery_date IS NOT NULL
           AND oi.expected_delivery_date = o.expected_delivery_date'
    )->fetchColumn();
    assertMigrationTest($deliveryBackfill > 0, 'Order-item delivery backfill did not preserve old data.');

    $flowSql = file_get_contents($flowMigration);
    assertMigrationTest($flowSql !== false, 'Unable to read production-flow migration.');
    $flowStatements = splitSqlStatements($flowSql);
    $partialMarker = 'CREATE TABLE IF NOT EXISTS `work_order_machine_results`';
    $partialStop = null;
    foreach ($flowStatements as $index => $statement) {
        if (str_contains($statement, $partialMarker)) {
            $partialStop = $index;
            break;
        }
    }
    assertMigrationTest(is_int($partialStop) && $partialStop > 0, 'Safe partial boundary not found.');

    for ($index = 0; $index < $partialStop; $index++) {
        $statement = trim($flowStatements[$index]);
        if ($statement !== '' && preg_match('/^USE\s+/i', $statement) !== 1) {
            $testPdo->exec($statement);
        }
    }
    assertMigrationTest(
        schemaObjectExists($testPdo, 'table', '', 'work_order_stages')
        && !schemaObjectExists($testPdo, 'table', '', 'work_order_machine_results'),
        'Partial migration scenario was not established.'
    );

    $flowAfterPartial = executeSqlMigrationFile($testPdo, $flowMigration);
    $flowRetry = executeSqlMigrationFile($testPdo, $flowMigration);

    $expectedTables = [
        'work_order_stages',
        'work_order_stage_services',
        'work_order_machine_results',
        'work_order_stage_transfers',
        'work_order_machine_result_images',
        'work_order_machine_input_tools',
        'work_order_machine_output_tools',
        'work_order_machine_result_packages',
        'inventory_packages',
        'shipping_order_item_packages',
        'work_order_image_requirements',
    ];
    foreach ($expectedTables as $table) {
        assertMigrationTest(
            schemaObjectExists($testPdo, 'table', '', $table),
            'Missing migrated table: ' . $table
        );
    }

    $stageBackfill = (int)$testPdo->query('SELECT COUNT(*) FROM work_order_stages')->fetchColumn();
    assertMigrationTest($stageBackfill > 0, 'Production-flow stage backfill did not preserve old work orders.');

    $checkColumns = [
        ['customers', 'production_image_requirement'],
        ['order_items', 'expected_delivery_date'],
        ['order_items', 'production_image_requirement'],
        ['work_order_machine_runs', 'stage_id'],
        ['production_records', 'card_sequence'],
        ['inventory_items', 'stock_category'],
        ['shipping_order_items', 'stock_category_snapshot'],
        ['inventory_item_sources', 'source_stage_transfer_id'],
    ];
    foreach ($checkColumns as [$table, $column]) {
        assertMigrationTest(
            schemaObjectExists($testPdo, 'column', $table, $column),
            "Missing migrated column: $table.$column"
        );
    }

    echo "Migration old-schema/PDO test passed.\n";
    echo "Delivery statements: first=$deliveryFirst, retry=$deliveryRetry, backfilled=$deliveryBackfill\n";
    echo "Flow statements: partial=$partialStop, retry-full=$flowAfterPartial, "
        . "idempotent-full=$flowRetry, stages=$stageBackfill\n";
} finally {
    $testPdo = null;
    $admin->exec('DROP DATABASE IF EXISTS ' . quoteMigrationIdentifier($testDb));
    echo "Temporary migration database removed.\n";
}
