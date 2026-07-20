<?php
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../api/common/workflow_state_machine.php';
require_once __DIR__ . '/../../api/order_items/helpers.php';

final class OrderItemValidationTest extends TestCase
{
    private function validCreatePayload(): array
    {
        return [
            'order_id' => '1',
            'screening_item_id' => '1',
            'total_weight_kg' => '600',
            'screening_details' => [
                ['screening_service_id' => 1, 'actual_price_per_unit' => '0'],
            ],
        ];
    }

    public function testCreateUsesPendingWhenStatusIsMissing(): void
    {
        $result = validateOrderItemData($this->validCreatePayload());

        self::assertSame([], $result['errors']);
        self::assertSame('pending', $result['data']['status']);
    }

    public function testCreateUsesPendingWhenStatusSelectIsBlank(): void
    {
        $payload = $this->validCreatePayload();
        $payload['status'] = null;

        $result = validateOrderItemData($payload);

        self::assertSame([], $result['errors']);
        self::assertSame('pending', $result['data']['status']);
    }

    public function testUpdateReportsTheSpecificBlankStatusField(): void
    {
        $result = validateOrderItemData(['status' => null], true);

        self::assertSame('生產狀態不可為空。', $result['errors']['status']);
    }

    public function testUnknownStatusIsRejectedWithTheSpecificFieldName(): void
    {
        $payload = $this->validCreatePayload();
        $payload['status'] = 'unknown';

        $result = validateOrderItemData($payload);

        self::assertSame('生產狀態不在允許清單中。', $result['errors']['status']);
    }
}
