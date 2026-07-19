START TRANSACTION;

INSERT INTO permissions (name, description, created_at, updated_at)
SELECT
    'basic_settings.read',
    'Technical key: basic_settings.read; module: basic_settings.',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'basic_settings.read'
);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT DISTINCT
    rp.role_id,
    p_new.id
FROM permissions AS p_new
JOIN permissions AS p_legacy
    ON p_legacy.name IN ('manage_system_parameters', '系統參數')
JOIN role_permissions AS rp
    ON rp.permission_id = p_legacy.id
WHERE p_new.name = 'basic_settings.read';

COMMIT;
