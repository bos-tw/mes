-- Keep legacy status API contracts usable while repairing their derived lookup
-- mirrors. The string status remains the compatibility source for these four
-- modules until a later breaking migration removes it.

INSERT INTO lookup_values (id, domain_id, value_key, value_label, sort_order, is_active)
SELECT (SELECT COALESCE(MAX(all_values.id), 0) + 1 FROM lookup_values all_values),
       ld.id,
       'retired',
       '已退役',
       6,
       1
FROM lookup_domains ld
LEFT JOIN lookup_values existing
       ON existing.domain_id = ld.id
      AND existing.value_key = 'retired'
WHERE ld.domain_key = 'tool_status'
  AND existing.id IS NULL;

UPDATE employees e
JOIN lookup_domains ld ON ld.domain_key = 'employee_status'
JOIN lookup_values lv ON lv.domain_id = ld.id AND lv.value_key = e.status
SET e.status_lookup_id = lv.id
WHERE e.status_lookup_id IS NULL OR e.status_lookup_id <> lv.id;

UPDATE orders o
JOIN lookup_domains ld ON ld.domain_key = 'status_order'
JOIN lookup_values lv ON lv.domain_id = ld.id AND lv.value_key = o.status
SET o.status_lookup_id = lv.id
WHERE o.status_lookup_id IS NULL OR o.status_lookup_id <> lv.id;

UPDATE shipping_orders so
JOIN lookup_domains ld ON ld.domain_key = 'shipping_status'
JOIN lookup_values lv ON lv.domain_id = ld.id AND lv.value_key = so.status
SET so.status_lookup_id = lv.id
WHERE so.status_lookup_id IS NULL OR so.status_lookup_id <> lv.id;

UPDATE tools t
JOIN lookup_domains ld ON ld.domain_key = 'tool_status'
JOIN lookup_values lv ON lv.domain_id = ld.id AND lv.value_key = t.status
SET t.status_lookup_id = lv.id
WHERE t.status_lookup_id IS NULL OR t.status_lookup_id <> lv.id;
