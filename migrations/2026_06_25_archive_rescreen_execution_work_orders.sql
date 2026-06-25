START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_rescreen_execution_work_orders_to_archive;

CREATE TEMPORARY TABLE tmp_rescreen_execution_work_orders_to_archive (
    work_order_id BIGINT NOT NULL PRIMARY KEY,
    batch_id BIGINT NOT NULL
)
AS
SELECT
    wo.id AS work_order_id,
    wo.source_rescreen_batch_id AS batch_id
FROM work_orders wo
LEFT JOIN inventory_items ii
    ON ii.work_order_id = wo.id
   AND ii.deleted_at IS NULL
LEFT JOIN work_order_machine_runs womr
    ON womr.work_order_id = wo.id
LEFT JOIN work_order_screening_defects wosd
    ON wosd.work_order_id = wo.id
LEFT JOIN production_records pr
    ON pr.work_order_id = wo.id
LEFT JOIN work_order_images woi
    ON woi.work_order_id = wo.id
   AND woi.deleted_at IS NULL
LEFT JOIN work_order_completion_images woci
    ON woci.work_order_id = wo.id
   AND woci.deleted_at IS NULL
LEFT JOIN work_order_defect_images wodi
    ON wodi.work_order_id = wo.id
   AND wodi.deleted_at IS NULL
LEFT JOIN work_order_tool_condition_images wotci
    ON wotci.work_order_id = wo.id
   AND wotci.deleted_at IS NULL
WHERE wo.deleted_at IS NULL
  AND wo.work_order_type = 'rescreen'
  AND COALESCE(wo.source_rescreen_batch_id, 0) > 0
GROUP BY wo.id, wo.source_rescreen_batch_id
HAVING
    COUNT(ii.id) = 0
    AND COUNT(womr.id) = 0
    AND COUNT(wosd.id) = 0
    AND COUNT(pr.id) = 0
    AND COUNT(woi.id) = 0
    AND COUNT(woci.id) = 0
    AND COUNT(wodi.id) = 0
    AND COUNT(wotci.id) = 0;

UPDATE rescreen_batches rb
INNER JOIN tmp_rescreen_execution_work_orders_to_archive tmp
    ON tmp.work_order_id = rb.rescreen_work_order_id
SET
    rb.rescreen_work_order_id = NULL,
    rb.updated_at = NOW();

UPDATE work_orders wo
INNER JOIN tmp_rescreen_execution_work_orders_to_archive tmp
    ON tmp.work_order_id = wo.id
SET
    wo.deleted_at = NOW(),
    wo.delete_token = wo.id,
    wo.updated_at = NOW();

DROP TEMPORARY TABLE IF EXISTS tmp_rescreen_execution_work_orders_to_archive;

COMMIT;
