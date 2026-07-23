-- Store customer delivery commitments at the order-item level.
-- The order header remains an independent, manually maintained commitment.

SET @add_expected_delivery_date_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'order_items'
          AND column_name = 'expected_delivery_date'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD COLUMN expected_delivery_date DATE NULL COMMENT ''訂單細項預計交期'' AFTER customer_sample_status'
);
PREPARE stmt FROM @add_expected_delivery_date_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_expected_delivery_period_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'order_items'
          AND column_name = 'expected_delivery_period'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD COLUMN expected_delivery_period VARCHAR(20) NULL COMMENT ''訂單細項預計交期時段(morning/noon/afternoon/evening)'' AFTER expected_delivery_date'
);
PREPARE stmt FROM @add_expected_delivery_period_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Existing details inherit the former header-level commitment exactly once.
UPDATE order_items oi
JOIN orders o ON o.id = oi.order_id
SET oi.expected_delivery_date = o.expected_delivery_date,
    oi.expected_delivery_period = o.expected_delivery_period
WHERE oi.expected_delivery_date IS NULL
  AND oi.expected_delivery_period IS NULL;

SET @add_order_item_delivery_index_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'order_items'
          AND index_name = 'idx_order_items_delivery_schedule'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD INDEX idx_order_items_delivery_schedule (order_id, deleted_at, expected_delivery_date)'
);
PREPARE stmt FROM @add_order_item_delivery_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
