-- 新增訂單主表預計交期時段欄位（可重複執行）
SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'orders'
      AND column_name = 'expected_delivery_period'
);

SET @sql := IF(
    @column_exists = 0,
    'ALTER TABLE `orders` ADD COLUMN `expected_delivery_period` VARCHAR(20) NULL COMMENT ''預計交期時段(morning/noon/afternoon/evening)'' AFTER `expected_delivery_date`',
    'SELECT ''orders.expected_delivery_period already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
