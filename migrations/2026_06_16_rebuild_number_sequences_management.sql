SET @has_seq_prefix := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'seq_prefix'
);
SET @sql := IF(@has_seq_prefix = 0,
    'ALTER TABLE number_sequences ADD COLUMN seq_prefix VARCHAR(50) NOT NULL DEFAULT '''' COMMENT ''流水號前綴'' AFTER seq_key',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_active_from := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'active_from'
);
SET @sql := IF(@has_active_from = 0,
    'ALTER TABLE number_sequences ADD COLUMN active_from DATETIME NULL COMMENT ''啟用時間'' AFTER seq_prefix',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_active_until := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'active_until'
);
SET @sql := IF(@has_active_until = 0,
    'ALTER TABLE number_sequences ADD COLUMN active_until DATETIME NULL COMMENT ''停用時間'' AFTER active_from',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_last_generated_on := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'last_generated_on'
);
SET @sql := IF(@has_last_generated_on = 0,
    'ALTER TABLE number_sequences ADD COLUMN last_generated_on DATE NULL COMMENT ''最近產生流水號日期'' AFTER current_value',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE number_sequences
SET seq_prefix = COALESCE(NULLIF(TRIM(seq_prefix), ''''), seq_key)
WHERE COALESCE(NULLIF(TRIM(seq_prefix), ''), '') = '';

SET @has_date_scope := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'date_scope'
);
SET @sql := IF(@has_date_scope > 0,
    'UPDATE number_sequences SET active_from = COALESCE(active_from, CONCAT(date_scope, '' 00:00:00'')) WHERE active_from IS NULL',
    'UPDATE number_sequences SET active_from = COALESCE(active_from, ''2026-01-01 00:00:00'') WHERE active_from IS NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_old_unique := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND INDEX_NAME = 'seq_key_date'
);
SET @sql := IF(@has_old_unique > 0,
    'ALTER TABLE number_sequences DROP INDEX seq_key_date',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_new_unique := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND INDEX_NAME = 'uk_number_sequences_seq_key_active_from'
);
SET @sql := IF(@has_new_unique = 0,
    'ALTER TABLE number_sequences ADD UNIQUE KEY uk_number_sequences_seq_key_active_from (seq_key, active_from)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_active_lookup_idx := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND INDEX_NAME = 'idx_number_sequences_active_lookup'
);
SET @sql := IF(@has_active_lookup_idx = 0,
    'ALTER TABLE number_sequences ADD KEY idx_number_sequences_active_lookup (seq_key, active_from, active_until)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_date_scope := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'number_sequences'
      AND COLUMN_NAME = 'date_scope'
);
SET @sql := IF(@has_date_scope > 0,
    'ALTER TABLE number_sequences DROP COLUMN date_scope',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @base_id := (SELECT COALESCE(MAX(id), 0) FROM number_sequences);
INSERT INTO number_sequences (
    id,
    seq_key,
    seq_prefix,
    active_from,
    active_until,
    current_value,
    last_generated_on,
    created_at,
    updated_at
)
SELECT
    @base_id := @base_id + 1,
    seed.seq_key,
    seed.seq_prefix,
    seed.active_from,
    NULL,
    0,
    NULL,
    NOW(),
    NOW()
FROM (
    SELECT 'ORDER' AS seq_key, 'ORDER' AS seq_prefix, '2026-01-01 00:00:00' AS active_from
    UNION ALL SELECT 'WO', 'WO', '2026-01-01 00:00:00'
    UNION ALL SELECT 'INV', 'INV', '2026-01-01 00:00:00'
    UNION ALL SELECT 'SO', 'SO', '2026-01-01 00:00:00'
    UNION ALL SELECT 'RO', 'RO', '2026-01-01 00:00:00'
    UNION ALL SELECT 'WOPR', 'WOPR', '2026-01-01 00:00:00'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM number_sequences ns
    WHERE ns.seq_key = seed.seq_key
);
