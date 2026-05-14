-- 為工單排程新增機台內排序欄位，支援拖拉順序永久保存。
SET @add_machine_sequence_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'machine_sequence'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `machine_sequence` INT NULL COMMENT ''機台排程序號'' AFTER `machine_id`',
    'SELECT 1'
);

PREPARE stmt FROM @add_machine_sequence_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_machine_sequence_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `INDEX_NAME` = 'idx_work_orders_machine_sequence'
    ) = 0,
    'ALTER TABLE `work_orders` ADD KEY `idx_work_orders_machine_sequence` (`machine_id`, `machine_sequence`)',
    'SELECT 1'
);

PREPARE stmt FROM @add_machine_sequence_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 回填既有資料：同機台依預定開始時間排序，沒有預定開始時間則依 ID。
SET @queue_rank := 0;
UPDATE `work_orders`
SET `machine_sequence` = (@queue_rank := @queue_rank + 1)
WHERE `deleted_at` IS NULL
  AND `machine_id` IS NULL
ORDER BY `scheduled_start_date` IS NULL, `scheduled_start_date`, `id`;

-- 針對每台機台分別排序。
SET @prev_machine_id := NULL;
SET @machine_rank := 0;

UPDATE `work_orders` wo
JOIN (
    SELECT
        id,
        machine_id,
        @machine_rank := IF(@prev_machine_id = machine_id, @machine_rank + 1, 1) AS new_rank,
        @prev_machine_id := machine_id AS _machine_marker
    FROM `work_orders`
    WHERE `deleted_at` IS NULL
      AND `machine_id` IS NOT NULL
    ORDER BY `machine_id`, `scheduled_start_date` IS NULL, `scheduled_start_date`, `id`
) ranked ON ranked.id = wo.id
SET wo.`machine_sequence` = ranked.new_rank;
