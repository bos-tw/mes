-- 將有效但尚未配置角色的員工明確標記為「待指派權限」。
-- 此角色不含任何權限；fail-closed 仍會拒絕所有業務模組，管理員可再改派正式角色。

INSERT INTO roles (name, description)
SELECT 'access_pending', '待管理員確認職責並指派正式角色；此角色不授予任何權限。'
WHERE NOT EXISTS (
    SELECT 1 FROM roles WHERE name = 'access_pending'
);

SET @access_pending_role_id = (
    SELECT id FROM roles WHERE name = 'access_pending' LIMIT 1
);

INSERT IGNORE INTO employee_roles (employee_id, role_id)
SELECT e.id, @access_pending_role_id
FROM employees e
LEFT JOIN employee_roles er ON er.employee_id = e.id
WHERE e.deleted_at IS NULL
  AND e.status = 'active'
GROUP BY e.id
HAVING COUNT(er.role_id) = 0;
