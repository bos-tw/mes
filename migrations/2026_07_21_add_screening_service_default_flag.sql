-- Mark services that should be preloaded for newly created order items.
SET @add_is_default_sql = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'screening_services'
          AND column_name = 'is_default'
    ),
    'DO 0',
    'ALTER TABLE screening_services ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''新增客戶批號時預設帶入'' AFTER is_active'
);
PREPARE stmt FROM @add_is_default_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
