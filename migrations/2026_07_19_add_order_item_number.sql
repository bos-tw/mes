-- Add a stable system identifier for every order detail.
-- customer_batch_number remains customer-supplied data and is not replaced.

SET @add_sequence_sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'order_items'
          AND column_name = 'order_item_sequence'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD COLUMN order_item_sequence SMALLINT UNSIGNED NULL AFTER order_id'
);
PREPARE stmt FROM @add_sequence_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_number_sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'order_items'
          AND column_name = 'order_item_number'
    ),
    'DO 0',
    'ALTER TABLE order_items ADD COLUMN order_item_number VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER order_item_sequence'
);
PREPARE stmt FROM @add_number_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- The update executor runs each statement through PDO::exec(). Keep this
-- backfill free of mysql-client DELIMITER/stored-procedure syntax so it can
-- be applied by both the local schema sync and the one-click updater.
DROP TEMPORARY TABLE IF EXISTS order_item_number_backfill;
CREATE TEMPORARY TABLE order_item_number_backfill (
    order_item_id BIGINT NOT NULL PRIMARY KEY,
    order_item_sequence SMALLINT UNSIGNED NOT NULL,
    order_item_number VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
);

INSERT INTO order_item_number_backfill (order_item_id, order_item_sequence, order_item_number)
SELECT ranked.id,
       ranked.sequence_number,
       CONCAT(ranked.order_number, '-L', LPAD(ranked.sequence_number, 2, '0'))
FROM (
    SELECT oi.id,
           o.order_number,
           ROW_NUMBER() OVER (PARTITION BY oi.order_id ORDER BY oi.id) AS sequence_number
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
) ranked
WHERE ranked.sequence_number <= 99;

UPDATE order_items oi
JOIN order_item_number_backfill backfill ON backfill.order_item_id = oi.id
SET oi.order_item_sequence = COALESCE(oi.order_item_sequence, backfill.order_item_sequence),
    oi.order_item_number = CASE
        WHEN oi.order_item_number IS NULL OR TRIM(oi.order_item_number) = ''
            THEN backfill.order_item_number
        ELSE oi.order_item_number
    END;

-- Missing parents, over-99 details, blank identities and duplicate identities
-- are intentionally rejected by the following NOT NULL/UNIQUE constraints.
ALTER TABLE order_items
    MODIFY COLUMN order_item_sequence SMALLINT UNSIGNED NOT NULL,
    MODIFY COLUMN order_item_number VARCHAR(160) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

DROP TEMPORARY TABLE IF EXISTS order_item_number_backfill;

SET @add_number_unique_sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'order_items'
          AND index_name = 'uk_order_items_order_item_number' AND non_unique = 0
    ),
    'DO 0',
    'ALTER TABLE order_items ADD UNIQUE KEY uk_order_items_order_item_number (order_item_number)'
);
PREPARE stmt FROM @add_number_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_sequence_unique_sql = IF(
    EXISTS(
        SELECT 1 FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = 'order_items'
          AND index_name = 'uk_order_items_order_sequence' AND non_unique = 0
    ),
    'DO 0',
    'ALTER TABLE order_items ADD UNIQUE KEY uk_order_items_order_sequence (order_id, order_item_sequence)'
);
PREPARE stmt FROM @add_sequence_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
