INSERT INTO inventory_item_sources (
    inventory_item_id, source_type, source_id,
    source_order_id, source_order_item_id,
    source_shipping_order_id, source_shipping_order_item_id,
    source_return_order_id, source_return_order_item_id, notes
)
SELECT
    soi.inventory_item_id,
    'return_order_item',
    roi.id,
    so.order_id,
    soi.order_item_id,
    soi.shipping_order_id,
    soi.id,
    roi.return_order_id,
    roi.id,
    'P1 既有退貨來源鏈回填'
FROM return_order_items roi
JOIN return_orders ro ON ro.id = roi.return_order_id AND ro.deleted_at IS NULL
JOIN shipping_order_items soi ON soi.id = roi.shipping_order_item_id
JOIN shipping_orders so ON so.id = soi.shipping_order_id
WHERE soi.inventory_item_id IS NOT NULL
ON DUPLICATE KEY UPDATE notes = VALUES(notes);
