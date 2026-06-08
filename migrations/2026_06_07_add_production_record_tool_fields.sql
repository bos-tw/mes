-- 生產記錄補強：來源模式、載具種類、載具重量，支援一般/拆分工單的預設與自行輸入模式。

SET @add_production_source_mode_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `COLUMN_NAME` = 'production_source_mode'
    ) = 0,
    'ALTER TABLE `production_records` ADD COLUMN `production_source_mode` VARCHAR(20) NOT NULL DEFAULT ''preset'' COMMENT ''生產記錄來源模式(preset=預設, manual=自行輸入)'' AFTER `machine_run_id`',
    'DO 0'
);

PREPARE stmt FROM @add_production_source_mode_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_production_tool_name_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `COLUMN_NAME` = 'tool_name'
    ) = 0,
    'ALTER TABLE `production_records` ADD COLUMN `tool_name` VARCHAR(100) NULL COMMENT ''載具種類'' AFTER `machine_type`',
    'DO 0'
);

PREPARE stmt FROM @add_production_tool_name_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_production_tool_weight_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'production_records'
          AND `COLUMN_NAME` = 'tool_weight_kg'
    ) = 0,
    'ALTER TABLE `production_records` ADD COLUMN `tool_weight_kg` DECIMAL(10,3) NULL COMMENT ''載具重量(kg)'' AFTER `tool_name`',
    'DO 0'
);

PREPARE stmt FROM @add_production_tool_weight_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `production_records`
SET `production_source_mode` = 'preset'
WHERE `production_source_mode` IS NULL OR TRIM(`production_source_mode`) = '';
