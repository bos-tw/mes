<?php
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/common/workflow_state_machine.php';
require_once __DIR__ . '/../../api/orders/helpers.php';

final class OrderValidationTest extends TestCase
{
    public function testCreateUsesPendingWhenStatusSelectIsBlank(): void
    {
        $result = validateOrderData([
            'customer_id' => '13',
            'order_date' => '2026-07-20',
            'status' => null,
            'total_amount' => '0.00',
        ]);

        self::assertSame([], $result['errors']);
        self::assertSame('pending', $result['data']['status']);
    }

    public function testCreateRejectsUnknownStatus(): void
    {
        $result = validateOrderData([
            'customer_id' => '13',
            'order_date' => '2026-07-20',
            'status' => 'unknown',
        ]);

        self::assertSame('訂單狀態不在允許清單中。', $result['errors']['status']);
    }
}
