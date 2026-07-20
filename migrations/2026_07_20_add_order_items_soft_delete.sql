-- Add the soft-delete contract required by the order item APIs and workflow guard.
SET @add_deleted_at_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'order_items'
          AND column_name = 'deleted_at'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at'
);
PREPARE stmt FROM @add_deleted_at_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_active_index_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.statistics
        WHERE table_schema = DATABASE()
          AND table_name = 'order_items'
          AND index_name = 'idx_order_items_order_active'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD INDEX idx_order_items_order_active (order_id, deleted_at)'
);
PREPARE stmt FROM @add_active_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
