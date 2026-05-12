-- 記錄工單首次進入已完成狀態的時間，作為刪除生命週期鎖。
SET @add_completed_at_column = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `COLUMN_NAME` = 'completed_at'
    ) = 0,
    'ALTER TABLE `work_orders` ADD COLUMN `completed_at` DATETIME NULL COMMENT ''首次進入已完成狀態時間'' AFTER `status_lookup_id`',
    'SELECT 1'
);

PREPARE stmt FROM @add_completed_at_column;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_completed_at_index = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `INDEX_NAME` = 'idx_work_orders_completed_at'
    ) = 0,
    'ALTER TABLE `work_orders` ADD KEY `idx_work_orders_completed_at` (`completed_at`)',
    'SELECT 1'
);

PREPARE stmt FROM @add_completed_at_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 既有目前為已完成狀態的工單先回填，避免升級後仍能刪除。
UPDATE `work_orders` wo
LEFT JOIN `lookup_values` lv ON wo.`status_lookup_id` = lv.`id`
SET wo.`completed_at` = COALESCE(wo.`actual_end_date`, wo.`updated_at`, wo.`created_at`, NOW())
WHERE wo.`completed_at` IS NULL
  AND (
      lv.`value_key` = 'completed'
      OR wo.`status` = 'completed'
  );

-- 若稽核紀錄可辨識曾經切到已完成，也一併回填最早完成時間。
UPDATE `work_orders` wo
JOIN (
    SELECT
        al.`target_id` AS work_order_id,
        MIN(al.`created_at`) AS first_completed_at
    FROM `audit_logs` al
    WHERE LOWER(al.`target_table`) = 'work_orders'
      AND JSON_VALID(al.`details`)
      AND JSON_UNQUOTE(JSON_EXTRACT(al.`details`, '$.status_lookup_id')) REGEXP '^[0-9]+$'
      AND CAST(JSON_UNQUOTE(JSON_EXTRACT(al.`details`, '$.status_lookup_id')) AS UNSIGNED) IN (
          SELECT lv2.`id`
          FROM `lookup_values` lv2
          WHERE lv2.`value_key` = 'completed'
      )
    GROUP BY al.`target_id`
) completed_logs ON completed_logs.work_order_id = wo.`id`
SET wo.`completed_at` = completed_logs.first_completed_at
WHERE wo.`completed_at` IS NULL;
