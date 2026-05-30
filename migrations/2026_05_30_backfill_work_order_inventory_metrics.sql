-- 修復工單轉庫存時未帶入數量/重量造成 0 庫存的歷史資料（可重複執行）

UPDATE `work_orders` wo
JOIN `order_items` oi ON oi.`id` = wo.`order_item_id`
JOIN `screening_items` si ON si.`id` = oi.`screening_item_id`
LEFT JOIN (
    SELECT
        `order_item_id`,
        COALESCE(SUM(`total_weight`), 0) AS `total_tool_weight`,
        COALESCE(SUM(`quantity`), 0) AS `total_tool_quantity`
    FROM `order_item_tools`
    GROUP BY `order_item_id`
) tool_totals ON tool_totals.`order_item_id` = oi.`id`
LEFT JOIN (
    SELECT
        oit.`order_item_id`,
        GROUP_CONCAT(CONCAT(t.`name`, ' ', CAST(oit.`quantity` AS UNSIGNED), '個') ORDER BY t.`name` SEPARATOR '、') AS `tool_statistics`
    FROM `order_item_tools` oit
    JOIN `tools` t ON t.`id` = oit.`tool_id`
    GROUP BY oit.`order_item_id`
) tool_stats ON tool_stats.`order_item_id` = oi.`id`
SET
    wo.`total_weight_kg` = CASE
        WHEN COALESCE(wo.`total_weight_kg`, 0) = 0
            THEN ROUND(GREATEST(oi.`total_weight_kg` - COALESCE(tool_totals.`total_tool_weight`, 0), 0), 2)
        ELSE wo.`total_weight_kg`
    END,
    wo.`weight_per_unit_g` = CASE
        WHEN COALESCE(wo.`weight_per_unit_g`, 0) = 0
            THEN si.`weight_per_unit_g`
        ELSE wo.`weight_per_unit_g`
    END,
    wo.`total_units` = CASE
        WHEN COALESCE(wo.`total_units`, 0) = 0 AND COALESCE(si.`weight_per_unit_g`, 0) > 0
            THEN ROUND(GREATEST(oi.`total_weight_kg` - COALESCE(tool_totals.`total_tool_weight`, 0), 0) * 1000 / si.`weight_per_unit_g`, 2)
        ELSE wo.`total_units`
    END,
    wo.`tool_statistics` = CASE
        WHEN TRIM(COALESCE(wo.`tool_statistics`, '')) = ''
            THEN tool_stats.`tool_statistics`
        ELSE wo.`tool_statistics`
    END
WHERE wo.`deleted_at` IS NULL
  AND (
      COALESCE(wo.`total_weight_kg`, 0) = 0
      OR COALESCE(wo.`weight_per_unit_g`, 0) = 0
      OR COALESCE(wo.`total_units`, 0) = 0
      OR TRIM(COALESCE(wo.`tool_statistics`, '')) = ''
  );

UPDATE `inventory_items` ii
JOIN `work_orders` wo ON wo.`id` = ii.`work_order_id`
JOIN `order_items` oi ON oi.`id` = wo.`order_item_id`
JOIN `screening_items` si ON si.`id` = oi.`screening_item_id`
LEFT JOIN (
    SELECT
        `order_item_id`,
        COALESCE(SUM(`total_weight`), 0) AS `total_tool_weight`,
        COALESCE(SUM(`quantity`), 0) AS `total_tool_quantity`
    FROM `order_item_tools`
    GROUP BY `order_item_id`
) tool_totals ON tool_totals.`order_item_id` = oi.`id`
LEFT JOIN (
    SELECT
        oit.`order_item_id`,
        GROUP_CONCAT(CONCAT(t.`name`, ' ', CAST(oit.`quantity` AS UNSIGNED), '個') ORDER BY t.`name` SEPARATOR '、') AS `tool_statistics`
    FROM `order_item_tools` oit
    JOIN `tools` t ON t.`id` = oit.`tool_id`
    GROUP BY oit.`order_item_id`
) tool_stats ON tool_stats.`order_item_id` = oi.`id`
LEFT JOIN (
    SELECT
        `work_order_id`,
        COALESCE(SUM(`defect_quantity`), 0) AS `total_defects`
    FROM `work_order_screening_defects`
    GROUP BY `work_order_id`
) defects ON defects.`work_order_id` = wo.`id`
SET
    ii.`total_good_units` = CASE
        WHEN COALESCE(ii.`total_good_units`, 0) = 0 AND COALESCE(si.`weight_per_unit_g`, 0) > 0
            THEN GREATEST(ROUND(GREATEST(oi.`total_weight_kg` - COALESCE(tool_totals.`total_tool_weight`, 0), 0) * 1000 / si.`weight_per_unit_g`, 2) - COALESCE(defects.`total_defects`, 0), 0)
        ELSE ii.`total_good_units`
    END,
    ii.`total_defect_units` = CASE
        WHEN COALESCE(ii.`total_defect_units`, 0) = 0
            THEN COALESCE(defects.`total_defects`, 0)
        ELSE ii.`total_defect_units`
    END,
    ii.`quantity_on_hand` = CASE
        WHEN COALESCE(ii.`quantity_on_hand`, 0) = 0 AND COALESCE(si.`weight_per_unit_g`, 0) > 0
            THEN GREATEST(ROUND(GREATEST(oi.`total_weight_kg` - COALESCE(tool_totals.`total_tool_weight`, 0), 0) * 1000 / si.`weight_per_unit_g`, 2) - COALESCE(defects.`total_defects`, 0), 0)
        ELSE ii.`quantity_on_hand`
    END,
    ii.`net_weight_kg` = CASE
        WHEN COALESCE(ii.`net_weight_kg`, 0) = 0
            THEN ROUND(GREATEST(oi.`total_weight_kg` - COALESCE(tool_totals.`total_tool_weight`, 0), 0), 2)
        ELSE ii.`net_weight_kg`
    END,
    ii.`gross_weight_kg` = CASE
        WHEN COALESCE(ii.`gross_weight_kg`, 0) = 0
            THEN oi.`total_weight_kg`
        ELSE ii.`gross_weight_kg`
    END,
    ii.`tool_weight_kg` = CASE
        WHEN COALESCE(ii.`tool_weight_kg`, 0) = 0
            THEN COALESCE(tool_totals.`total_tool_weight`, 0)
        ELSE ii.`tool_weight_kg`
    END,
    ii.`weight_per_unit_g` = CASE
        WHEN COALESCE(ii.`weight_per_unit_g`, 0) = 0
            THEN si.`weight_per_unit_g`
        ELSE ii.`weight_per_unit_g`
    END,
    ii.`tool_statistics` = CASE
        WHEN TRIM(COALESCE(ii.`tool_statistics`, '')) = ''
            THEN tool_stats.`tool_statistics`
        ELSE ii.`tool_statistics`
    END,
    ii.`total_tool_quantity` = CASE
        WHEN COALESCE(ii.`total_tool_quantity`, 0) = 0
            THEN COALESCE(tool_totals.`total_tool_quantity`, 0)
        ELSE ii.`total_tool_quantity`
    END
WHERE ii.`deleted_at` IS NULL
  AND ii.`work_order_id` IS NOT NULL
  AND COALESCE(ii.`quantity_allocated`, 0) = 0
  AND COALESCE(ii.`quantity_shipped`, 0) = 0
  AND (
      COALESCE(ii.`total_good_units`, 0) = 0
      OR COALESCE(ii.`quantity_on_hand`, 0) = 0
      OR COALESCE(ii.`net_weight_kg`, 0) = 0
      OR COALESCE(ii.`gross_weight_kg`, 0) = 0
      OR COALESCE(ii.`weight_per_unit_g`, 0) = 0
      OR TRIM(COALESCE(ii.`tool_statistics`, '')) = ''
  );

UPDATE `inventory_transactions` it
JOIN `inventory_items` ii ON ii.`id` = it.`inventory_item_id`
SET
    it.`quantity` = CASE WHEN COALESCE(it.`quantity`, 0) = 0 THEN ii.`quantity_on_hand` ELSE it.`quantity` END,
    it.`after_quantity` = CASE WHEN COALESCE(it.`after_quantity`, 0) = 0 THEN ii.`quantity_on_hand` ELSE it.`after_quantity` END,
    it.`notes` = CASE
        WHEN COALESCE(it.`quantity`, 0) = 0 OR COALESCE(it.`after_quantity`, 0) = 0
            THEN CONCAT('工單完工自動入庫，良品 ', ii.`quantity_on_hand`, '，不良品 ', ii.`total_defect_units`)
        ELSE it.`notes`
    END
WHERE ii.`deleted_at` IS NULL
  AND it.`ref_type` = 'work_order'
  AND it.`direction` = 'inbound'
  AND (COALESCE(it.`quantity`, 0) = 0 OR COALESCE(it.`after_quantity`, 0) = 0)
  AND COALESCE(ii.`quantity_on_hand`, 0) > 0;
