<?php
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

#[Group('database')]
final class P1SchemaContractTest extends TestCase
{
    public function testP1SchemaUsesSingleStatusAndDatabaseGeneratedIds(): void
    {
        $pdo = getTestDb();
        $database = (string)$pdo->query('SELECT DATABASE()')->fetchColumn();

        $statusStmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = ? AND table_name = 'work_orders' AND column_name = 'status'");
        $statusStmt->execute([$database]);
        self::assertSame(0, (int)$statusStmt->fetchColumn());

        $tables = [
            'calendar_event_reminders', 'daily_machine_inspection_items',
            'daily_machine_inspections', 'dashboard_calendar_events',
            'inventory_transactions', 'lookup_domains', 'machine_maintenance_tasks',
            'number_sequences', 'production_quality_records', 'quality_issue_reports',
            'return_order_items', 'return_orders', 'shipping_order_items',
            'shipping_orders', 'shipping_quality_inspections', 'system_parameters',
        ];
        $placeholders = implode(',', array_fill(0, count($tables), '?'));
        $idStmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns
            WHERE table_schema = ? AND column_name = 'id'
              AND extra LIKE '%auto_increment%' AND table_name IN ({$placeholders})");
        $idStmt->execute(array_merge([$database], $tables));
        self::assertSame(count($tables), (int)$idStmt->fetchColumn());
    }

    public function testEveryActiveInventoryHasAFormalSource(): void
    {
        $pdo = getTestDb();
        $missing = $pdo->query("SELECT COUNT(*) FROM inventory_items ii
            WHERE ii.deleted_at IS NULL AND NOT EXISTS (
                SELECT 1 FROM inventory_item_sources iis WHERE iis.inventory_item_id = ii.id
            )")->fetchColumn();
        self::assertSame(0, (int)$missing);
    }
}
