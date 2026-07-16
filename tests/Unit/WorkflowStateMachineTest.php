<?php
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/common/workflow_state_machine.php';

final class WorkflowStateMachineTest extends TestCase
{
    public function testEveryP1WorkflowHasDefinedStates(): void
    {
        $definitions = getWorkflowTransitionDefinitions();
        foreach (['orders', 'order_items', 'work_orders', 'inventory_items', 'shipping_orders', 'return_orders'] as $module) {
            self::assertArrayHasKey($module, $definitions);
            self::assertNotEmpty($definitions[$module]);
        }
    }

    public function testTerminalStatesCannotReopen(): void
    {
        self::assertFalse(canTransitionWorkflowStatus('orders', 'completed', 'pending'));
        self::assertFalse(canTransitionWorkflowStatus('work_orders', 'completed', 'in_progress'));
        self::assertFalse(canTransitionWorkflowStatus('shipping_orders', 'delivered', 'draft'));
        self::assertFalse(canTransitionWorkflowStatus('return_orders', 'completed', 'processing'));
        self::assertFalse(canTransitionWorkflowStatus('inventory_items', 'shipped', 'in_stock'));
    }

    public function testExpectedForwardTransitionsAreAllowed(): void
    {
        self::assertTrue(canTransitionWorkflowStatus('orders', 'pending', 'confirmed'));
        self::assertTrue(canTransitionWorkflowStatus('work_orders', 'in_progress', 'completed'));
        self::assertTrue(canTransitionWorkflowStatus('shipping_orders', 'packed', 'shipped'));
        self::assertTrue(canTransitionWorkflowStatus('return_orders', 'processing', 'completed'));
    }
}
