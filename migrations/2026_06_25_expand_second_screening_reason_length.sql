SET @alter_second_screening_reason_length = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'second_screening_reason'
          AND (
              CHARACTER_MAXIMUM_LENGTH IS NULL
              OR CHARACTER_MAXIMUM_LENGTH < 255
          )
    ),
    'ALTER TABLE `rescreen_batches` MODIFY `second_screening_reason` VARCHAR(255) DEFAULT NULL COMMENT ''二次篩選原因；由使用者自行輸入''',
    'DO 0'
);
PREPARE stmt FROM @alter_second_screening_reason_length;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
