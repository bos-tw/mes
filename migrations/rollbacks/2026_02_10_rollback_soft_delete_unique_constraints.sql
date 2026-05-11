-- ============================================================
-- Rollback: 還原軟刪除唯一約束修復
-- 日期: 2026-02-10
-- 用途: 如果 Migration 有問題，執行此腳本還原
--
-- ⚠️  執行前必讀：
-- 1. 若已有透過重用編號新增的記錄（即軟刪除後新增相同編號），
--    回滾時 ADD UNIQUE INDEX 會因唯一衝突而中止，請先手動處理重複值。
-- 2. 本腳本每張表使用單一 ALTER TABLE，確保各表操作的原子性
--    （DROP INDEX + ADD UNIQUE INDEX + DROP COLUMN 三步一起執行）。
-- 3. MySQL DDL 不支援跨表交易，若某張表失敗，下方其他表仍會繼續執行。
-- ============================================================

-- ⚠️  確認無重複值後再執行（先執行下方檢查語句）：
-- SELECT 'customers', customer_number, COUNT(*) FROM customers GROUP BY customer_number HAVING COUNT(*) > 1
-- UNION ALL SELECT 'employees', employee_number, COUNT(*) FROM employees GROUP BY employee_number HAVING COUNT(*) > 1
-- UNION ALL SELECT 'orders', order_number, COUNT(*) FROM orders GROUP BY order_number HAVING COUNT(*) > 1
-- UNION ALL SELECT 'suppliers', supplier_number, COUNT(*) FROM suppliers GROUP BY supplier_number HAVING COUNT(*) > 1;

USE `yucyuan`;

-- 1. customers
ALTER TABLE `customers`
    DROP INDEX `uk_customer_number_active`,
    ADD UNIQUE INDEX `customer_number` (`customer_number`),
    DROP COLUMN `delete_token`;

-- 2. departments
ALTER TABLE `departments`
    DROP INDEX `uk_department_name_active`,
    ADD UNIQUE INDEX `name` (`name`),
    DROP COLUMN `delete_token`;

-- 3. employees
ALTER TABLE `employees`
    DROP INDEX `uk_employee_number_active`,
    DROP INDEX `uk_email_active`,
    ADD UNIQUE INDEX `employee_number` (`employee_number`),
    ADD UNIQUE INDEX `email` (`email`),
    DROP COLUMN `delete_token`;

-- 4. inventory_items
ALTER TABLE `inventory_items`
    DROP INDEX `uk_inventory_number_active`,
    ADD UNIQUE INDEX `uk_inventory_number` (`inventory_number`),
    DROP COLUMN `delete_token`;

-- 5. orders
ALTER TABLE `orders`
    DROP INDEX `uk_order_number_active`,
    ADD UNIQUE INDEX `order_number` (`order_number`),
    DROP COLUMN `delete_token`;

-- 6. return_orders
ALTER TABLE `return_orders`
    DROP INDEX `uk_return_order_number_active`,
    ADD UNIQUE INDEX `return_order_number` (`return_order_number`),
    DROP COLUMN `delete_token`;

-- 7. shipping_orders
ALTER TABLE `shipping_orders`
    DROP INDEX `uk_shipping_order_number_active`,
    ADD UNIQUE INDEX `shipping_order_number` (`shipping_order_number`),
    DROP COLUMN `delete_token`;

-- 8. suppliers
ALTER TABLE `suppliers`
    DROP INDEX `uk_supplier_number_active`,
    ADD UNIQUE INDEX `supplier_number` (`supplier_number`),
    DROP COLUMN `delete_token`;

-- 9. tools
ALTER TABLE `tools`
    DROP INDEX `uk_tool_number_active`,
    ADD UNIQUE INDEX `tool_number` (`tool_number`),
    DROP COLUMN `delete_token`;

-- 10. work_orders
ALTER TABLE `work_orders`
    DROP INDEX `uk_work_order_number_active`,
    ADD UNIQUE INDEX `work_order_number` (`work_order_number`),
    DROP COLUMN `delete_token`;
