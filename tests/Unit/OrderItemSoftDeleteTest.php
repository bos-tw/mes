<?php
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/common/workflow_state_machine.php';
require_once __DIR__ . '/../../api/order_items/helpers.php';

#[Group('database')]
final class OrderItemSoftDeleteTest extends TestCase
{
    public function testSoftDeletedItemIsHiddenAndExcludedFromOrderTotal(): void
    {
        $pdo = getTestDb();
        $pdo->beginTransaction();

        try {
            $pdo->exec("INSERT INTO customers (customer_number, name) VALUES ('SOFT-DELETE-CUSTOMER', 'Soft Delete Test')");
            $customerId = (int)$pdo->lastInsertId();

            $pdo->exec("INSERT INTO screening_items (item_number, name, weight_per_unit_g) VALUES ('SOFT-DELETE-ITEM', 'Soft Delete Item', 1.00)");
            $screeningItemId = (int)$pdo->lastInsertId();

            $orderStmt = $pdo->prepare("INSERT INTO orders
                (order_number, customer_id, order_date, status, total_amount)
                VALUES ('ORDER-SOFT-DELETE', :customer_id, '2026-07-20', 'pending', 125.00)");
            $orderStmt->execute(['customer_id' => $customerId]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare("INSERT INTO order_items
                (order_id, order_item_sequence, order_item_number, screening_item_id,
                 total_weight_kg, total_units, total_price, status)
                VALUES (:order_id, 1, 'ORDER-SOFT-DELETE-L01', :screening_item_id,
                        1.00, 1000, 125.00, 'pending')");
            $itemStmt->execute([
                'order_id' => $orderId,
                'screening_item_id' => $screeningItemId,
            ]);
            $orderItemId = (int)$pdo->lastInsertId();

            self::assertNotNull(findOrderItem($pdo, $orderItemId));
            self::assertTrue(softDeleteOrderItem($pdo, $orderItemId));
            self::assertNull(findOrderItem($pdo, $orderItemId));
            self::assertSame([], findOrderItemsByOrder($pdo, $orderId));

            recalculateOrderTotalAmount($pdo, $orderId);
            $totalStmt = $pdo->prepare('SELECT total_amount FROM orders WHERE id = :id');
            $totalStmt->execute(['id' => $orderId]);
            self::assertSame(0.0, (float)$totalStmt->fetchColumn());
            self::assertFalse(softDeleteOrderItem($pdo, $orderItemId));
        } finally {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
        }
    }
}
