START TRANSACTION;

INSERT INTO permissions (name, description, created_at, updated_at)
SELECT
    'production_work_order_schedule.read',
    'Technical key: production_work_order_schedule.read; module: production_work_order_schedule.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'production_work_order_schedule.read'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT DISTINCT
    rp.role_id,
    p_new.id
FROM permissions AS p_new
JOIN permissions AS p_legacy
    ON p_legacy.name IN ('manage_work_orders', '生產工單')
JOIN role_permissions AS rp
    ON rp.permission_id = p_legacy.id
WHERE p_new.name = 'production_work_order_schedule.read';

COMMIT;
