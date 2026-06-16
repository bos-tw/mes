SET @column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'machines'
      AND column_name = 'machine_capability_id'
);

SET @sql := IF(
    @column_exists = 0,
    'ALTER TABLE `machines` ADD COLUMN `machine_capability_id` INT NULL COMMENT ''機台能力'' AFTER `status_lookup_id`',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'machines'
      AND index_name = 'idx_machines_machine_capability_id'
);

SET @sql := IF(
    @index_exists = 0,
    'ALTER TABLE `machines` ADD INDEX `idx_machines_machine_capability_id` (`machine_capability_id`)',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
    SELECT COUNT(*)
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = 'machines'
      AND constraint_name = 'fk_machines_machine_capability'
);

SET @sql := IF(
    @fk_exists = 0,
    'ALTER TABLE `machines` ADD CONSTRAINT `fk_machines_machine_capability` FOREIGN KEY (`machine_capability_id`) REFERENCES `machine_capabilities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
    'DO 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO `machine_capabilities` (`capability_code`, `capability_name`, `description`, `sort_order`, `is_active`)
SELECT 'GENERAL', '一般', '一般篩分能力', 0, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `machine_capabilities` WHERE `capability_code` = 'GENERAL'
);

UPDATE `machines` m
JOIN `machine_capabilities` mc ON mc.capability_code = 'GENERAL'
SET m.machine_capability_id = mc.id
WHERE m.machine_capability_id IS NULL;
