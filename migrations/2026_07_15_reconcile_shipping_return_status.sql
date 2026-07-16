-- 依有效退貨品項回填出貨單退貨旗標；不改動出貨或庫存數量。

UPDATE shipping_orders so
SET
    so.has_return = CASE
        WHEN EXISTS (
            SELECT 1
            FROM shipping_order_items soi
            INNER JOIN return_order_items roi ON roi.shipping_order_item_id = soi.id
            INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
            WHERE soi.shipping_order_id = so.id
        ) THEN 1 ELSE 0
    END,
    so.return_status = CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM shipping_order_items soi
            INNER JOIN return_order_items roi ON roi.shipping_order_item_id = soi.id
            INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
            WHERE soi.shipping_order_id = so.id
        ) THEN 'none'
        WHEN EXISTS (
            SELECT 1 FROM shipping_order_items soi WHERE soi.shipping_order_id = so.id
        ) AND NOT EXISTS (
            SELECT 1
            FROM shipping_order_items soi
            WHERE soi.shipping_order_id = so.id
              AND COALESCE((
                  SELECT SUM(roi.returned_quantity)
                  FROM return_order_items roi
                  INNER JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
                  WHERE roi.shipping_order_item_id = soi.id
              ), 0) < soi.shipped_quantity
        ) THEN 'full'
        ELSE 'partial'
    END;
