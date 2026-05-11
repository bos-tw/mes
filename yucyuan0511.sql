-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1:3306
-- 產生時間： 2026 年 05 月 11 日 10:48
-- 伺服器版本： 10.11.8-MariaDB-0ubuntu0.24.04.1
-- PHP 版本： 8.1.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `yucyuan`
--

-- --------------------------------------------------------

--
-- 資料表結構 `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) NOT NULL,
  `employee_id` bigint(20) DEFAULT NULL COMMENT '操作員工ID',
  `action` varchar(255) NOT NULL COMMENT '執行操作',
  `target_table` varchar(100) DEFAULT NULL COMMENT '目標資料表',
  `target_id` bigint(20) DEFAULT NULL COMMENT '目標紀錄ID',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '詳細資訊',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP位址',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `employee_id`, `action`, `target_table`, `target_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.234.130\"}', '1.175.234.130', '2026-05-06 15:31:46'),
(2, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 00:48:11'),
(3, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.234.130\"}', '1.175.234.130', '2026-05-07 03:48:20'),
(4, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 04:32:57'),
(5, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-07 04:33:12'),
(6, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 04:55:08'),
(7, 11, '新增訂單', 'Orders', 1, '{\"customer_id\":32,\"order_date\":\"2026-05-07\",\"expected_delivery_date\":\"2026-05-22\",\"customer_po_number\":\"EB00344795\",\"status\":\"confirmed\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260507-0001\"}', '218.166.10.178', '2026-05-07 05:47:02'),
(8, 11, '新增訂單品項', 'OrderItems', 1, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1448,\"total_units\":347242.2062,\"total_price\":5208.63}', '218.166.10.178', '2026-05-07 05:58:26'),
(9, 11, '更新客戶批號', 'OrderItems', 1, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1448,\"total_units\":306235.012,\"total_price\":4593.53}', '218.166.10.178', '2026-05-07 06:05:09'),
(10, 11, '更新客戶批號', 'OrderItems', 1, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1448,\"total_units\":306235.012,\"total_price\":4593.53}', '218.166.10.178', '2026-05-07 06:06:28'),
(11, 11, '更新客戶批號', 'OrderItems', 1, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1448,\"total_units\":306235.012,\"total_price\":4593.53}', '218.166.10.178', '2026-05-07 06:12:49'),
(12, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.234.130\"}', '1.175.234.130', '2026-05-07 06:27:48'),
(13, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 06:57:27'),
(14, 10, '新增訂單品項', 'OrderItems', 2, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1448,\"total_units\":306235.012,\"total_price\":4593.53}', '218.166.10.178', '2026-05-07 06:58:33'),
(15, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 07:47:20'),
(16, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-07 07:48:25'),
(17, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-07 07:48:29'),
(18, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-07 07:48:32'),
(19, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-07 07:48:37'),
(20, 11, '登出系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 07:48:56'),
(21, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-07 07:49:09'),
(22, 11, '新增訂單品項', 'OrderItems', 3, '{\"order_id\":1,\"screening_item_id\":1,\"total_weight_kg\":1500,\"total_units\":305035.9712,\"total_price\":4575.54}', '218.166.10.178', '2026-05-07 08:00:09'),
(23, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.234.130\"}', '1.175.234.130', '2026-05-07 09:08:47'),
(24, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.234.130\"}', '1.175.234.130', '2026-05-07 15:05:36'),
(25, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 01:06:11'),
(26, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.10.178', '2026-05-08 01:09:42'),
(27, 10, '新增訂單', 'Orders', 2, '{\"customer_id\":52,\"order_date\":\"2026-04-23\",\"expected_delivery_date\":\"2026-05-08\",\"customer_po_number\":\"260101\",\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260423-0001\"}', '218.166.10.178', '2026-05-08 02:52:47'),
(28, 10, '新增訂單品項', 'OrderItems', 4, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":459,\"total_units\":655714.2857,\"total_price\":10491.43}', '218.166.10.178', '2026-05-08 02:54:55'),
(29, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 02:56:36'),
(30, 10, '登入系統', 'employees', 10, '{\"account\":\"YVONNE\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 02:56:45'),
(31, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":459,\"total_units\":571428.5714,\"total_price\":9142.86}', '218.166.10.178', '2026-05-08 03:01:42'),
(32, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":459,\"total_units\":571428.5714,\"total_price\":9142.86}', '218.166.10.178', '2026-05-08 03:01:55'),
(33, 10, '新增訂單品項', 'OrderItems', 5, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":399,\"total_units\":485714.2857,\"total_price\":7771.43}', '218.166.10.178', '2026-05-08 03:03:03'),
(34, 10, '更新客戶批號', 'OrderItems', 5, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":399,\"total_units\":485714.2857,\"total_price\":7771.43}', '218.166.10.178', '2026-05-08 03:03:18'),
(35, 10, 'Added new work order', 'WorkOrders', 1, '{\"work_order_number\":\"WO-20260508-0001\",\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:05:17'),
(36, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:06:08'),
(37, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:06:34'),
(38, 10, 'Added new work order', 'WorkOrders', 2, '{\"work_order_number\":\"WO-20260508-0002\",\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:08:48'),
(39, 10, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":\"2026-04-30 13:20:00\",\"actual_start_date\":\"2026-04-28 13:20:00\",\"actual_end_date\":\"2026-04-30 17:28:00\",\"quantity_to_produce\":13365,\"screening_speed\":\"225*99%\",\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:09:59'),
(40, 10, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":\"2026-04-30 13:20:00\",\"actual_start_date\":\"2026-04-28 13:20:00\",\"actual_end_date\":\"2026-04-30 17:28:00\",\"quantity_to_produce\":13365,\"screening_speed\":\"225*99%\",\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:10:20'),
(41, 10, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":\"2026-04-30 13:20:00\",\"actual_start_date\":\"2026-04-28 13:20:00\",\"actual_end_date\":\"2026-04-30 17:28:00\",\"quantity_to_produce\":13365,\"screening_speed\":\"225*99%\",\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:10:34'),
(42, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.174.115.117\"}', '1.174.115.117', '2026-05-08 03:25:19'),
(43, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:34:36'),
(44, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:34:45'),
(45, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:35:16'),
(46, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:36:11'),
(47, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:36:37'),
(48, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:37:01'),
(49, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:38:31'),
(50, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 03:42:31'),
(51, 10, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":\"2026-04-30 13:20:00\",\"actual_start_date\":\"2026-04-28 13:20:00\",\"actual_end_date\":\"2026-04-30 17:28:00\",\"quantity_to_produce\":13365,\"screening_speed\":\"225*99%\",\"status_lookup_id\":28,\"screening_defects_count\":5,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:43:43'),
(52, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":459,\"total_units\":571428.5714,\"total_price\":9142.86}', '218.166.10.178', '2026-05-08 03:44:45'),
(53, 10, '更新客戶批號', 'OrderItems', 5, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":399,\"total_units\":485714.2857,\"total_price\":7771.43}', '218.166.10.178', '2026-05-08 03:45:15'),
(54, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":459,\"total_units\":571428.5714,\"total_price\":9142.86}', '218.166.10.178', '2026-05-08 03:45:24'),
(55, 10, '更新客戶批號', 'OrderItems', 5, '{\"order_id\":2,\"screening_item_id\":3,\"total_weight_kg\":399,\"total_units\":485714.2857,\"total_price\":7771.43}', '218.166.10.178', '2026-05-08 03:45:28'),
(56, 10, '新增庫存品項', 'inventory_items', 3, '{\"work_order_id\":\"2\"}', '218.166.10.178', '2026-05-08 03:46:20'),
(57, 10, '新增庫存品項', 'inventory_items', 4, '{\"work_order_id\":\"1\"}', '218.166.10.178', '2026-05-08 03:47:12'),
(58, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:48:38'),
(59, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:49:37'),
(60, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:50:10'),
(61, 10, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-04-30 17:34:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"220*99%\",\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":1}', '218.166.10.178', '2026-05-08 03:50:17'),
(62, 10, '新增庫存品項', 'inventory_items', 5, '{\"work_order_id\":\"1\"}', '218.166.10.178', '2026-05-08 03:51:03'),
(63, 10, '新增庫存品項', 'inventory_items', 6, '{\"work_order_id\":\"2\"}', '218.166.10.178', '2026-05-08 03:52:14'),
(64, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 04:34:17'),
(65, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.10.178\"}', '218.166.10.178', '2026-05-08 04:34:27'),
(66, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.171.62\"}', '36.238.171.62', '2026-05-11 02:35:29'),
(67, 10, '新增庫存品項', 'inventory_items', 7, '{\"work_order_id\":\"2\"}', '36.238.171.62', '2026-05-11 02:52:51'),
(68, 10, '新增庫存品項', 'inventory_items', 8, '{\"work_order_id\":\"1\"}', '36.238.171.62', '2026-05-11 02:54:47'),
(69, 10, '新增庫存品項', 'inventory_items', 9, '{\"work_order_id\":\"1\"}', '36.238.171.62', '2026-05-11 02:55:20'),
(70, 10, '新增庫存品項', 'inventory_items', 10, '{\"work_order_id\":\"2\"}', '36.238.171.62', '2026-05-11 02:57:33'),
(71, 10, '新增庫存品項', 'inventory_items', 11, '{\"work_order_id\":\"2\"}', '36.238.171.62', '2026-05-11 02:59:45'),
(72, 10, '新增庫存品項', 'inventory_items', 12, '{\"work_order_id\":\"1\"}', '36.238.171.62', '2026-05-11 02:59:55'),
(73, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.171.62\"}', '36.238.171.62', '2026-05-11 06:41:38'),
(74, 10, '新增員工', 'employees', 12, '{\"employee_number\":\"YC1070903001\",\"name\":\"王璿閔\"}', '36.238.171.62', '2026-05-11 06:43:35'),
(75, 10, '新增員工', 'employees', 13, '{\"employee_number\":\"YC1090401001\",\"name\":\"王乙智\"}', '36.238.171.62', '2026-05-11 06:45:03'),
(76, 10, 'Soft deleted customer', 'Customers', 16, '{\"customer_number\":\"CUST-016\",\"name\":\"音速音響科技\"}', '36.238.171.62', '2026-05-11 06:50:22'),
(77, 10, 'Soft deleted customer', 'Customers', 15, '{\"customer_number\":\"CUST-015\",\"name\":\"百變家具設計\"}', '36.238.171.62', '2026-05-11 06:50:23'),
(78, 10, 'Soft deleted customer', 'Customers', 14, '{\"customer_number\":\"CUST-014\",\"name\":\"奇巧精密模具\"}', '36.238.171.62', '2026-05-11 06:50:25'),
(79, 10, 'Soft deleted customer', 'Customers', 10, '{\"customer_number\":\"CUST-010\",\"name\":\"穩固建築五金\"}', '36.238.171.62', '2026-05-11 06:50:27'),
(80, 10, 'Soft deleted customer', 'Customers', 7, '{\"customer_number\":\"CUST-007\",\"name\":\"巨力螺絲廠\"}', '36.238.171.62', '2026-05-11 06:50:29'),
(81, 10, 'Soft deleted customer', 'Customers', 3, '{\"customer_number\":\"CUST-003\",\"name\":\"創新科技材料\"}', '36.238.171.62', '2026-05-11 06:50:31'),
(82, 10, 'Added new customer', 'Customers', 53, '{\"customer_number\":\"CU-A0024\",\"name\":\"政一工業股份有限公司\"}', '36.238.171.62', '2026-05-11 06:57:07'),
(83, 10, 'Added new customer', 'Customers', 54, '{\"customer_number\":\"CU-A0025\",\"name\":\"睿鋼工業有限公司\"}', '36.238.171.62', '2026-05-11 06:59:19'),
(84, 10, 'Updated customer data', 'customers', 54, '{\"customer_number\":\"CU-A0025\",\"name\":\"睿鋼工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"睿鋼工業有限公司\",\"company_registered_address\":null,\"invoice_address\":\"821008 高雄市路竹區華正路1-1號\",\"shipping_address\":\"821008 高雄市路竹區華正路1-1號\",\"contact_person\":null,\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":\"吳先生\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0960007751\",\"sales_contact_email\":null,\"finance_contact_person\":\"吳小姐\",\"finance_contact_extension\":null,\"finance_contact_mobile\":\"0929234108\",\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"票期60天\",\"tax_id\":\"42808929\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/e70b0883c4c25949cc58a192a72c1b29.jpg\",\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2500,\"weight_tolerance_percentage\":3}', '36.238.171.62', '2026-05-11 07:00:48'),
(85, 10, 'Updated customer data', 'customers', 54, '{\"customer_number\":\"CU-A0025\",\"name\":\"睿鋼工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"睿鋼工業有限公司\",\"company_registered_address\":null,\"invoice_address\":\"821008 高雄市路竹區華正路1-1號\",\"shipping_address\":\"821008 高雄市路竹區華正路1-1號\",\"contact_person\":null,\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":\"吳先生\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0960007751\",\"sales_contact_email\":null,\"finance_contact_person\":\"吳小姐\",\"finance_contact_extension\":null,\"finance_contact_mobile\":\"0929234108\",\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"票期60天\",\"tax_id\":\"42808929\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/e70b0883c4c25949cc58a192a72c1b29.jpg\",\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2500,\"weight_tolerance_percentage\":3}', '36.238.171.62', '2026-05-11 07:01:00'),
(86, 10, '新增訂單', 'Orders', 3, '{\"customer_id\":54,\"order_date\":\"2026-05-11\",\"expected_delivery_date\":\"2026-05-15\",\"customer_po_number\":\"圓形焊帽\",\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260511-0001\"}', '36.238.171.62', '2026-05-11 07:01:52'),
(87, 10, '刪除訂單', 'Orders', 3, NULL, '36.238.171.62', '2026-05-11 07:02:40'),
(88, 10, '新增訂單', 'Orders', 4, '{\"customer_id\":54,\"order_date\":\"2026-05-11\",\"expected_delivery_date\":\"2026-05-15\",\"customer_po_number\":\"圓形焊圈帽\",\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260511-0001\"}', '36.238.171.62', '2026-05-11 07:03:34'),
(89, 10, '新增訂單品項', 'OrderItems', 6, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":126258.3384,\"total_price\":2525.17}', '36.238.171.62', '2026-05-11 07:16:50'),
(90, 10, '更新客戶批號', 'OrderItems', 6, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":122619.7696,\"total_price\":2452.4}', '36.238.171.62', '2026-05-11 07:24:11'),
(91, 10, '新增訂單品項', 'OrderItems', 7, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2630,\"total_units\":154639.1753,\"total_price\":3092.78}', '36.238.171.62', '2026-05-11 08:01:14'),
(92, 10, 'Added new work order', 'WorkOrders', 3, '{\"work_order_number\":\"WO-20260511-0001\",\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.171.62', '2026-05-11 08:02:04'),
(93, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.171.62', '2026-05-11 08:02:22'),
(94, 10, 'Added new work order', 'WorkOrders', 4, '{\"work_order_number\":\"WO-20260511-0002\",\"screening_defects_count\":0,\"production_records_count\":8}', '36.238.171.62', '2026-05-11 08:05:12'),
(95, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2630,\"total_units\":154639.1753,\"total_price\":3092.78}', '36.238.171.62', '2026-05-11 08:07:14'),
(96, 10, '新增訂單品項', 'OrderItems', 8, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":122619.7696,\"total_price\":2452.4}', '36.238.171.62', '2026-05-11 08:28:17'),
(97, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":29,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.171.62', '2026-05-11 08:37:32'),
(98, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":29,\"screening_defects_count\":0,\"production_records_count\":8}', '36.238.171.62', '2026-05-11 08:37:39'),
(99, 10, '更新客戶批號', 'OrderItems', 8, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":122619.7696,\"total_price\":2452.4}', '36.238.171.62', '2026-05-11 08:38:01'),
(100, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":8}', '36.238.171.62', '2026-05-11 08:39:58'),
(101, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.171.62', '2026-05-11 08:40:02'),
(102, 10, '更新客戶批號', 'OrderItems', 8, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":122619.7696,\"total_price\":2452.4}', '36.238.171.62', '2026-05-11 08:40:18'),
(103, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.240.73\"}', '1.175.240.73', '2026-05-11 08:43:45'),
(104, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.171.62\"}', '36.238.171.62', '2026-05-11 08:45:48'),
(105, 10, '更新客戶批號', 'OrderItems', 6, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2082,\"total_units\":122619.7696,\"total_price\":2452.4}', '36.238.171.62', '2026-05-11 08:46:17'),
(106, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":4,\"screening_item_id\":4,\"total_weight_kg\":2630,\"total_units\":154639.1753,\"total_price\":3092.78}', '36.238.171.62', '2026-05-11 08:46:27');

-- --------------------------------------------------------

--
-- 資料表結構 `calendar_event_participants`
--

CREATE TABLE `calendar_event_participants` (
  `event_id` bigint(20) NOT NULL COMMENT '關聯事件ID',
  `employee_id` bigint(20) NOT NULL COMMENT '參與員工ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `calendar_event_reminders`
--

CREATE TABLE `calendar_event_reminders` (
  `id` bigint(20) NOT NULL,
  `event_id` bigint(20) NOT NULL COMMENT '關聯事件ID',
  `employee_id` bigint(20) NOT NULL COMMENT '提醒對象員工ID',
  `reminder_datetime` datetime NOT NULL COMMENT '提醒時間',
  `reminder_type` varchar(50) DEFAULT NULL COMMENT '提醒方式',
  `is_sent` tinyint(1) DEFAULT 0 COMMENT '是否已發送',
  `sent_at` datetime DEFAULT NULL COMMENT '發送時間',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT '公司名稱',
  `name_en` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL COMMENT '公司地址',
  `phone` varchar(50) DEFAULT NULL COMMENT '聯絡電話',
  `fax` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL COMMENT '電子郵件',
  `tax_id` varchar(50) DEFAULT NULL COMMENT '統一編號',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `companies`
--

INSERT INTO `companies` (`id`, `name`, `name_en`, `address`, `phone`, `fax`, `email`, `tax_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '羽全有限公司', 'YU CYUAN CO., LTD', '82144高雄市路竹區大仁路584-23號', '07-696-2727', '07-696-1919', 'yc001@sort.com.tw', '59182131', '2025-08-11 14:32:07', '2026-03-03 14:43:33', NULL);

-- --------------------------------------------------------

--
-- 資料表結構 `company_logos`
--

CREATE TABLE `company_logos` (
  `id` bigint(20) NOT NULL,
  `company_id` bigint(20) NOT NULL COMMENT '所屬公司 ID',
  `file_name` varchar(255) NOT NULL COMMENT '原始檔名',
  `file_path` varchar(500) NOT NULL COMMENT '相對儲存路徑',
  `file_size` int(11) DEFAULT NULL COMMENT '檔案大小 (bytes)',
  `mime_type` varchar(50) DEFAULT NULL COMMENT 'MIME 類型',
  `is_active` tinyint(1) DEFAULT 0 COMMENT '是否為使用中的 LOGO (0=否, 1=是)',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序順序',
  `uploaded_by_employee_id` bigint(20) DEFAULT NULL COMMENT '上傳者員工 ID',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp() COMMENT '上傳時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '軟刪除時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公司 LOGO 圖片';

--
-- 傾印資料表的資料 `company_logos`
--

INSERT INTO `company_logos` (`id`, `company_id`, `file_name`, `file_path`, `file_size`, `mime_type`, `is_active`, `sort_order`, `uploaded_by_employee_id`, `uploaded_at`, `deleted_at`) VALUES
(1, 1, 'logo_697731b680a70.png', 'uploads/company_logos/1/logo_698b0139c5e01.png', 3789, 'image/png', 1, 0, NULL, '2026-02-10 09:58:17', NULL);

-- --------------------------------------------------------

--
-- 資料表結構 `customers`
--

CREATE TABLE `customers` (
  `id` bigint(20) NOT NULL,
  `customer_number` varchar(50) NOT NULL COMMENT '客戶編號',
  `name` varchar(255) NOT NULL COMMENT '客戶名稱',
  `company_registered_address` text DEFAULT NULL COMMENT '公司登記住址',
  `invoice_title` varchar(255) DEFAULT NULL COMMENT '發票抬頭',
  `invoice_address` text DEFAULT NULL COMMENT '發票寄送地址',
  `shipping_address` text DEFAULT NULL COMMENT '收/送貨地址',
  `website` varchar(255) DEFAULT NULL COMMENT '公司網址',
  `fax` varchar(50) DEFAULT NULL COMMENT '傳真',
  `product_category` varchar(100) DEFAULT NULL COMMENT '商品別',
  `contact_person` varchar(100) DEFAULT NULL COMMENT '聯絡人',
  `phone` varchar(50) DEFAULT NULL COMMENT '聯絡電話',
  `email` varchar(100) DEFAULT NULL COMMENT '電子郵件',
  `address` text DEFAULT NULL COMMENT '地址',
  `sales_contact_person` varchar(100) DEFAULT NULL COMMENT '業務聯絡人',
  `sales_contact_extension` varchar(20) DEFAULT NULL COMMENT '業務聯絡人分機',
  `sales_contact_mobile` varchar(50) DEFAULT NULL COMMENT '業務聯絡人手機',
  `sales_contact_email` varchar(255) DEFAULT NULL COMMENT '業務聯絡人EMAIL',
  `finance_contact_person` varchar(100) DEFAULT NULL COMMENT '財務聯絡人',
  `finance_contact_extension` varchar(20) DEFAULT NULL COMMENT '財務聯絡人分機',
  `finance_contact_mobile` varchar(50) DEFAULT NULL COMMENT '財務聯絡人手機',
  `finance_contact_email` varchar(255) DEFAULT NULL COMMENT '財務聯絡人EMAIL',
  `billing_day` int(11) DEFAULT NULL COMMENT '結帳日 (1-31)',
  `reconciliation_day` int(11) DEFAULT NULL COMMENT '對帳日 (1-31)',
  `payment_method` varchar(100) DEFAULT NULL COMMENT '付款方式',
  `tax_id` varchar(50) DEFAULT NULL COMMENT '統一編號',
  `notes` text DEFAULT NULL COMMENT '備註',
  `minimum_order_amount` decimal(14,2) DEFAULT 0.00 COMMENT '單筆最低委託額度',
  `weight_tolerance_percentage` decimal(5,2) DEFAULT 3.00 COMMENT '重量公差百分比(%)',
  `invoice_attachment_path` varchar(500) DEFAULT NULL COMMENT '發票附件路徑',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用(0:停用,1:啟用)',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `customers`
--

INSERT INTO `customers` (`id`, `customer_number`, `name`, `company_registered_address`, `invoice_title`, `invoice_address`, `shipping_address`, `website`, `fax`, `product_category`, `contact_person`, `phone`, `email`, `address`, `sales_contact_person`, `sales_contact_extension`, `sales_contact_mobile`, `sales_contact_email`, `finance_contact_person`, `finance_contact_extension`, `finance_contact_mobile`, `finance_contact_email`, `billing_day`, `reconciliation_day`, `payment_method`, `tax_id`, `notes`, `minimum_order_amount`, `weight_tolerance_percentage`, `invoice_attachment_path`, `is_active`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'CU-A0022', '鋐聯昇模具有限公司', '台南市歸仁區長榮路一段70巷51號', NULL, '台南市歸仁區長榮路一段70巷51號', '台南市歸仁區長榮路一段70巷51號', NULL, '06-2783332', NULL, '涂琳螢', '06-2782156 06-2783331', NULL, '台南市保安里文賢一段628號2樓', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 30, '月結60天', '89303631', '對帳日  -帳單寄出前', 0.00, 3.00, 'uploads/invoice_stamps/3ae85deb59aabd07d23b456567eaf252.png', 1, '2025-08-12 11:14:07', '2026-03-27 09:36:05', NULL, 0),
(2, 'CUST-002', '亞洲扣件有限公司', '亂七八糟路100號', '大大螺絲公司', NULL, '亂七八糟路100號', NULL, NULL, NULL, '劉大大', '07-11223344', 'dfgdg@gmail.com', '亂七八糟路100號', '劉大大', NULL, '07-11223344', 'dfgdg@gmail.com', '劉大大', NULL, '07-11223344', 'dfgdg@gmail.com', 20, NULL, '月結30天', '87654321', '新客戶', 0.00, 3.00, NULL, 1, '2025-08-13 07:34:18', '2026-03-10 03:50:33', '2026-03-10 03:50:33', 2),
(3, 'CUST-003', '創新科技材料', '路竹區100號', '小小螺絲工廠', NULL, '路竹區100號', NULL, NULL, NULL, '邱太太', '04-2496-1234', 'aaabb@gmail.com', '路竹區100號', '邱太太', NULL, '04-2496-1234', 'aaabb@gmail.com', '邱太太', NULL, '04-2496-1234', 'aaabb@gmail.com', 10, 25, '現金', '11223344', '中小型客戶', 0.00, 3.00, NULL, 1, '2025-08-18 05:21:39', '2026-05-11 06:50:31', '2026-05-11 06:50:31', 3),
(4, 'CUST-004', '鑽前螺絲', '大馬路100號', NULL, '大馬路100號', '大馬路100號', NULL, NULL, NULL, '柯先生', '1234253453', '45345@gtfreg.com', '大馬路100號', '柯先生', NULL, NULL, NULL, '柯先生', NULL, NULL, NULL, 15, NULL, '月結90天', NULL, NULL, 0.00, 3.00, 'uploads/invoice_stamps/bb2da502614ef71d45faa1eda08a36d8.jpg', 1, '2025-09-28 12:52:43', '2026-03-10 03:53:11', '2026-03-10 03:53:11', 4),
(5, 'CUST-005', '永固機械製造', '高雄市左營大道100號', '托福實業股份有限公司', '高雄市左營大道100號', '高雄市左營大道100號', NULL, NULL, NULL, '蔡先生', '07-4435745', 'email@email.com', '高雄市左營大道100號', '蔡先生', '07-4453567', NULL, 'email01@email.com', '江小姐', '07-557-6366', NULL, NULL, 20, 25, '月結60天', '81209958', '07-695-2608 (二倉電話)\r\n左營總公司傳真07-557-2177', 0.00, 3.00, NULL, 1, '2025-10-05 12:31:02', '2026-03-10 03:27:48', '2026-03-10 03:27:48', 5),
(6, 'CUST-006', '東方車料配件', '彰化縣鹿港鎮工業東三路6號', '東方車料配件股份有限公司', '彰化縣鹿港鎮工業東三路6號', '彰化縣鹿港鎮工業東三路6號', 'https://www.eastmoto.com', '04-781-1235', '汽車配件', '施副總', '04-781-1234', 'purchase@eastmoto.com', '彰化縣鹿港鎮工業東三路6號', '洪先生', '101', '0911-222-333', 'sales.hung@eastmoto.com', '廖小姐', '102', '0911-222-334', 'finance.liao@eastmoto.com', 31, 15, '月結75天', '45678901', '品質要求高', 0.00, 3.00, 'uploads/invoices/cust006.png', 1, '2025-12-04 13:01:24', '2026-03-04 10:24:47', '2026-03-04 10:24:47', 6),
(7, 'CUST-007', '巨力螺絲廠', '岡山區本工一路18號', '巨力螺絲廠', '岡山區本工一路18號', '岡山區本工一路18號', 'https://www.giant-screw.com.tw', '07-621-5567', '建築螺絲', '莊先生', '07-621-5566', 'gs@giant-screw.com.tw', '岡山區本工一路18號', '王小姐', '11', '0922-333-444', 'sales.wang@giant-screw.com.tw', '林先生', '12', '0922-333-445', 'finance.lin@giant-screw.com.tw', 20, 5, '票期60天', '56789012', '需求量大', 0.00, 3.00, 'uploads/invoices/cust007.pdf', 1, '2025-12-04 13:01:24', '2026-05-11 06:50:29', '2026-05-11 06:50:29', 7),
(8, 'CUST-008', '新世代電子', '新竹市東區科學園區創新一路1號', '新世代電子股份有限公司', '新竹市東區科學園區創新一路1號', '新竹市東區科學園區創新一路1號', 'https://www.newgen-e.com', '03-578-9012', '消費性電子', '彭採購', '03-578-9011', 'purchasing@newgen-e.com', '新竹市東區科學園區創新一路1號', '葉先生', '808', '0988-999-000', 'sales.yeh@newgen-e.com', '傅小姐', '809', '0988-999-001', 'finance.fu@newgen-e.com', 25, 10, '月結90天', '67890123', '急單多', 0.00, 3.00, 'uploads/invoices/cust008.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:11', '2026-05-05 05:51:11', 8),
(9, 'CUST-009', '飛馬自行車', '台中市大甲區順帆路10號', '飛馬自行車工業', '台中市大甲區順帆路10號', '台中市大甲區順帆路10號', 'https://www.pegasus-bike.com', '04-2681-5679', '自行車零件', '蕭廠長', '04-2681-5678', 'factory@pegasus-bike.com', '台中市大甲區順帆路10號', '侯先生', '222', '0937-123-456', 'sales.hou@pegasus-bike.com', '馬小姐', '223', '0937-123-457', 'finance.ma@pegasus-bike.com', 30, 15, '月結45天', '78901234', '合作開發', 0.00, 3.00, 'uploads/invoices/cust009.png', 1, '2025-12-04 13:01:24', '2026-03-10 03:50:37', '2026-03-10 03:50:37', 9),
(10, 'CUST-010', '穩固建築五金', '桃園市八德區和平路100號', '穩固建築五金行', '桃園市八德區和平路100號', '桃園市八德區和平路100號', 'https://www.solid-hardware.com', '03-368-8890', '建築五金', '呂老闆', '03-368-8889', 'solid@hardware.com', '桃園市八德區和平路100號', '宋先生', '02', '0910-987-654', 'sales.sung@solid-hardware.com', '趙小姐', '03', '0910-987-655', 'finance.chao@solid-hardware.com', 15, 1, '現金', '89012345', '零售客戶', 0.00, 3.00, 'uploads/invoices/cust010.pdf', 1, '2025-12-04 13:01:24', '2026-05-11 06:50:27', '2026-05-11 06:50:27', 10),
(11, 'CUST-011', '太陽能源科技', '台南市善化區南科三路3號', '太陽能源科技股份有限公司', '台南市善化區南科三路3號', '台南市善化區南科三路3號', 'https://www.solar-energy.com', '06-505-1002', '綠能產業', '田經理', '06-505-1001', 'contact@solar-energy.com', '台南市善化區南科三路3號', '溫先生', '168', '0919-888-777', 'sales.wen@solar-energy.com', '錢小姐', '169', '0919-888-778', 'finance.chien@solar-energy.com', 25, 10, '票期120天', '90123456', '新興產業', 0.00, 3.00, 'uploads/invoices/cust011.jpg', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:32', '2026-03-10 03:27:32', 11),
(12, 'CUST-012', '精準醫療器材', '嘉義縣太保市祥和一路東段1號', '精準醫療器材有限公司', '嘉義縣太保市祥和一路東段1號', '嘉義縣太保市祥和一路東段1號', 'https://www.precision-medical.com.tw', '05-362-8801', '醫療器材', '羅研發', '05-362-8800', 'rd@precision-medical.com.tw', '嘉義縣太保市祥和一路東段1號', '翁先生', '301', '0972-555-666', 'sales.weng@precision-medical.com.tw', '馮小姐', '302', '0972-555-667', 'finance.feng@precision-medical.com.tw', 20, 5, '月結60天', '11223344', '認證嚴格', 0.00, 3.00, 'uploads/invoices/cust012.png', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:35', '2026-03-10 03:27:35', 12),
(13, 'CUST-013', '宏觀國際物流', '桃園市大園區航站南路9號', '宏觀國際物流股份有限公司', '桃園市大園區航站南路9號', '桃園市大園區航站南路9號', 'https://www.macro-logistics.com', '03-398-3334', '物流服務', '潘主任', '03-398-3333', 'service@macro-logistics.com', '桃園市大園區航站南路9號', '姜先生', '500', '0939-222-111', 'sales.chiang@macro-logistics.com', '龍小姐', '501', '0939-222-112', 'finance.lung@macro-logistics.com', 31, 15, '月結30天', '22334455', '轉口貿易', 0.00, 3.00, 'uploads/invoices/cust013.pdf', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:38', '2026-03-10 03:27:38', 13),
(14, 'CUST-014', '奇巧精密模具', '新北市樹林區三俊街100號', '奇巧精密模具有限公司', '新北市樹林區三俊街100號', '新北市樹林區三俊街100號', 'https://www.q-mold.com', '02-8684-1123', '模具製造', '丁廠長', '02-8684-1122', 'factory@q-mold.com', '新北市樹林區三俊街100號', '藍先生', '20', '0918-333-444', 'sales.lan@q-mold.com', '萬小姐', '21', '0918-333-445', 'finance.wan@q-mold.com', 10, 25, '票期60天', '33445566', '開模合作', 0.00, 3.00, 'uploads/invoices/cust014.jpg', 1, '2025-12-04 13:01:24', '2026-05-11 06:50:25', '2026-05-11 06:50:25', 14),
(15, 'CUST-015', '百變家具設計', '桃園市龍潭區工五路20號', '百變家具設計有限公司', '桃園市龍潭區工五路20號', '桃園市龍潭區工五路20號', 'https://www.magic-furniture.com.tw', '03-479-5567', '家具製造', '范設計師', '03-479-5566', 'design@magic-furniture.com.tw', '桃園市龍潭區工五路20號', '鍾先生', '15', '0975-888-999', 'sales.chung@magic-furniture.com.tw', '彭小姐', '16', '0975-888-990', 'finance.peng@magic-furniture.com.tw', 25, 10, '月結45天', '44556677', '小批量多樣式', 0.00, 3.00, 'uploads/invoices/cust015.png', 1, '2025-12-04 13:01:24', '2026-05-11 06:50:23', '2026-05-11 06:50:23', 15),
(16, 'CUST-016', '音速音響科技', '台北市中正区八德路一段1號', '音速音響科技有限公司', '台北市中正区八德路一段1號', '新北市汐止区新台五路一段79號', 'https://www.sonic-audio.com', '02-2341-5679', '音響設備', '杜經理', '02-2341-5678', 'contact@sonic-audio.com', '台北市中正区八德路一段1號', '姚先生', '110', '0917-123-456', 'sales.yao@sonic-audio.com', '袁小姐', '111', '0917-123-457', 'finance.yuan@sonic-audio.com', 20, 5, '月結60天', '55667788', '聲音品質要求高', 0.00, 3.00, 'uploads/invoices/cust016.pdf', 1, '2025-12-04 13:01:24', '2026-05-11 06:50:22', '2026-05-11 06:50:22', 16),
(17, 'CUST-017', '天翔航空工業', '台中市沙鹿區中航路一段168號', '天翔航空工業股份有限公司', '台中市沙鹿區中航路一段168號', '台中市沙鹿區中航路一段168號', 'https://www.sky-aero.com', '04-2615-3333', '航空零件', '程主任', '04-2615-3332', 'purchase@sky-aero.com', '台中市沙鹿區中航路一段168號', '倪先生', '777', '0927-555-888', 'sales.ni@sky-aero.com', '康小姐', '778', '0927-555-889', 'finance.kang@sky-aero.com', 30, 15, '票期180天', '66778899', '航太認證', 0.00, 3.00, 'uploads/invoices/cust017.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:30', '2026-05-05 05:51:30', 17),
(18, 'CUST-018', '海洋船舶重工', '高雄市旗津區中洲三路1號', '海洋船舶重工有限公司', '高雄市旗津區中洲三路1號', '高雄市旗津區中洲三路1號', 'https://www.ocean-ship.com', '07-571-8890', '船舶修造', '邵組長', '07-571-8889', 'service@ocean-ship.com', '高雄市旗津區中洲三路1號', '易先生', '234', '0936-234-567', 'sales.yi@ocean-ship.com', '韋小姐', '235', '0936-234-568', 'finance.wei@ocean-ship.com', 15, 1, '月結90天', '77889900', '耐腐蝕要求', 0.00, 3.00, 'uploads/invoices/cust018.png', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:29', '2026-05-05 05:50:29', 18),
(19, 'CUST-019', '綠野農機設備', '屏東縣長治鄉德和路1號', '綠野農機設備製造廠', '屏東縣長治鄉德和路1號', '屏東縣長治鄉德和路1號', 'https://www.green-farm.com.tw', '08-762-3334', '農業機械', '柯廠長', '08-762-3333', 'factory@green-farm.com.tw', '屏東縣長治鄉德和路1號', '伍先生', '55', '0958-111-222', 'sales.wu@green-farm.com.tw', '戚小姐', '56', '0958-111-223', 'finance.chi@green-farm.com.tw', 25, 10, '票期60天', '88990011', '戶外耐用性', 0.00, 3.00, 'uploads/invoices/cust019.pdf', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:35', '2026-05-05 05:50:35', 19),
(20, 'CUST-020', '智造機器人', '桃園市中壢區遠東路1號', '智造機器人股份有限公司', '桃園市中壢區遠東路1號', '桃園市中壢區遠東路1號', 'https://www.smart-robot.com', '03-463-8801', '自動化設備', '涂博士', '03-463-8800', 'rd@smart-robot.com', '桃園市中壢區遠東路1號', '牟先生', '999', '0968-333-444', 'sales.mou@smart-robot.com', '葛小姐', '998', '0968-333-445', 'finance.ge@smart-robot.com', 20, 5, '月結75天', '99001122', '技術密集型', 0.00, 3.00, 'uploads/invoices/cust020.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:41', '2026-05-05 05:50:41', 20),
(21, 'CUST-021', '金鑽螺絲五金', '彰化縣和美鎮線東路一段100號', '金鑽螺絲五金行', '彰化縣和美鎮線東路一段100號', '彰化縣和美鎮線東路一段100號', 'https://www.gold-screw.com.tw', '04-755-2234', '五金零售', '謝頭家', '04-755-2233', 'service@gold-screw.com.tw', '彰化縣和美鎮線東路一段100號', '童先生', '1', '0925-999-888', 'sales.tung@gold-screw.com.tw', '裴小姐', '2', '0925-999-887', 'finance.pei@gold-screw.com.tw', 31, 15, '現金', '12121212', '地方經銷', 0.00, 3.00, 'uploads/invoices/cust021.png', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:45', '2026-05-05 05:50:45', 21),
(22, 'CUST-022', '聯合國際開發', '台北市中山區南京東路三段9號', '聯合國際開發有限公司', '台北市中山區南京東路三段9號', '新北市林口區文化三路一段2號', 'https://www.union-dev.com', '02-2507-1235', '建築開發', '房經理', '02-2507-1234', 'contact@union-dev.com', '台北市中山區南京東路三段9號', '左先生', '288', '0931-888-777', 'sales.tso@union-dev.com', '石小姐', '289', '0931-888-776', 'finance.shih@union-dev.com', 10, 25, '票期120天', '34343434', '大建案', 0.00, 3.00, 'uploads/invoices/cust022.pdf', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:51', '2026-05-05 05:50:51', 22),
(23, 'CUST-023', '幸福家居生活', '台中市北屯區環中路一段10號', '幸福家居生活館', '台中市北屯區環中路一段10號', '台中市北屯區環中路一段10號', 'https://www.happy-home.tw', '04-2422-8890', '家居用品', '阮店長', '04-2422-8889', 'store@happy-home.tw', '台中市北屯區環中路一段10號', '鄧先生', '10', '0953-222-111', 'sales.teng@happy-home.tw', '梅小姐', '11', '0953-222-112', 'finance.mei@happy-home.tw', 15, 30, '月結30天', '56565656', '零售通路', 0.00, 3.00, 'uploads/invoices/cust023.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:50:56', '2026-05-05 05:50:56', 23),
(24, 'CUST-024', '奔騰運動用品', '新北市新莊區化成路11巷2號', '奔騰運動用品有限公司', '新北市新莊區化成路11巷2號', '新北市新莊區化成路11巷2號', 'https://www.sprint-sports.com', '02-8521-7789', '運動器材', '焦採購', '02-8521-7788', 'purchase@sprint-sports.com', '新北市新莊區化成路11巷2號', '臧先生', '33', '0978-666-555', 'sales.tsang@sprint-sports.com', '費小姐', '34', '0978-666-554', 'finance.fei@sprint-sports.com', 25, 10, '月結60天', '78787878', '品牌代工', 0.00, 3.00, 'uploads/invoices/cust024.png', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:00', '2026-05-05 05:51:00', 24),
(25, 'CUST-025', '星辰精密光學', '台南市新市區中心路10號', '星辰精密光學股份有限公司', '台南市新市區中心路10號', '台南市新市區中心路10號', 'https://www.stella-optics.com', '06-589-1235', '光學鏡頭', '柳博士', '06-589-1234', 'rd@stella-optics.com', '台南市新市區中心路10號', '舒先生', '88', '0981-444-333', 'sales.shu@stella-optics.com', '茅小姐', '89', '0981-444-332', 'finance.mao@stella-optics.com', 20, 5, '票期90天', '90909090', '高精度要求', 0.00, 3.00, 'uploads/invoices/cust025.pdf', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:04', '2026-05-05 05:51:04', 25),
(26, 'CUST-026', '卓越模具科技', '桃園市平鎮區工業五路5號', '卓越模具科技有限公司', '桃園市平鎮區工業五路5號', '桃園市平鎮區工業五路5號', 'https://www.ace-mold.com.tw', '03-469-5555', '塑膠模具', '黎廠長', '03-469-5554', 'service@ace-mold.com.tw', '桃園市平鎮區工業五路5號', '甄先生', '168', '0926-789-123', 'sales.chen@ace-mold.com.tw', '畢小姐', '169', '0926-789-124', 'finance.pi@ace-mold.com.tw', 30, 15, '月結60天', '13579246', '客製化需求', 0.00, 3.00, 'uploads/invoices/cust026.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:25', '2026-05-05 05:51:25', 26),
(27, 'CUST-027', '世紀船舶配件公司', '高雄市前鎮區漁港南一路29號', '世紀船舶配件有限公司', '高雄市前鎮區漁港南一路29號', '高雄市前鎮區漁港南一路29號', 'https://www.century-marine.com', '07-813-1112', '船舶配件', '連經理', '07-813-1111', 'contact@century-marine.com', '高雄市前鎮區漁港南一路29號', '魯先生', '30', '0935-111-999', 'sales.lu@century-marine.com', '辛小姐', '31', '0935-111-998', 'finance.hsin@century-marine.com', 25, 10, '票期90天', '24681357', '船舶零件供應商', 0.00, 3.00, 'uploads/invoice_stamps/f5306b8717e3d376401581733bdda928.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:18', '2026-05-05 05:51:18', 27),
(28, 'CUST-028_deleted_20260210203445', '宏達五金百貨', '新北市板橋區中山路一段1號', '宏達五金百貨行', '新北市板橋區中山路一段1號', '新北市板橋區中山路一段1號', 'https://www.honda-hardware.com.tw', '02-2951-8889', '五金百貨', '金老闆', '02-2951-8888', 'service@honda-hardware.com.tw', '新北市板橋區中山路一段1號', '陶先生', '8', '0915-888-666', 'sales.tao@honda-hardware.com.tw', '龐小姐', '9', '0915-888-665', 'finance.pang@honda-hardware.com.tw', 15, 1, '現金', '97531864', '區域性批發', 0.00, 3.00, 'uploads/invoices/cust028.pdf', 1, '2025-12-04 13:01:24', '2026-02-10 13:11:48', '2026-02-10 12:34:45', 28),
(29, 'CUST-029_deleted_20260210203443', '宇航精密科技', '新竹縣竹北市光明六路東一段1號', '宇航精密科技股份有限公司', '新竹縣竹北市光明六路東一段1號', '新竹縣竹北市光明六路東一段1號', 'https://www.aerospace-tech.tw', '03-658-9999', '航太零組件', '凌博士', '03-658-9998', 'rd.ling@aerospace-tech.tw', '新竹縣竹北市光明六路東一段1號', '盛先生', '747', '0976-543-210', 'sales.sheng@aerospace-tech.tw', '厲小姐', '748', '0976-543-211', 'finance.li@aerospace-tech.tw', 31, 15, NULL, '86420975', '國際認證', 5000.00, 3.00, 'uploads/invoices/cust029.jpg', 1, '2025-12-04 13:01:24', '2026-02-10 13:11:48', '2026-02-10 12:34:43', 29),
(30, 'CUST-030_deleted_20260210203439', '遠東紡織機械', '台中市烏日區高鐵東路8號', '遠東紡織機械有限公司', '台中市烏日區高鐵東路8號', '台中市烏日區高鐵東路8號', 'https://www.fareast-textile.com', '04-3601-2346', '紡織機械', '齊廠長', '04-3601-2345', 'factory@fareast-textile.com', '台中市烏日區高鐵東路8號', '樂先生', '200', '0938-123-789', 'sales.yueh@fareast-textile.com', '滿小姐', '201', '0938-123-780', 'finance.man@fareast-textile.com', 20, 5, '月結90天', '75319864', '產業設備', 0.00, 3.00, 'uploads/invoices/cust030.png', 1, '2025-12-04 13:01:24', '2026-02-10 13:11:48', '2026-02-10 12:34:39', 30),
(31, 'CU-A0001', '托福實業股份有限公司', NULL, '托福實業股份有限公司', '81358 高雄市左營區博愛二路366號26樓之1號', '高雄市路竹區新生路334巷23號  (倉庫)', NULL, '07-695-1570', NULL, '鄭妁吟#23  又瑜#11', '07-695-2888', NULL, NULL, NULL, NULL, NULL, NULL, '江小姐', '07-557-6366', NULL, NULL, 20, 25, '票期60天', '81209958', 'TEL :07-695-2608 (二倉)\r\n高雄總公司FAX:07-557-2177 / 557-1977', 2000.00, 3.00, NULL, 1, '2026-03-03 04:44:47', '2026-03-09 09:08:30', NULL, 0),
(32, 'CU-A0002', '鑫穩企業有限公司', NULL, '鑫穩企業有限公司', '82943高雄市湖內區中華街74巷31號', '82943高雄市湖內區中華街74巷31號', NULL, '07-699-8356', NULL, '鄭安筑 #14  李錦秀#15', '07-699-8357', NULL, NULL, '林明德', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 10, NULL, '53261313', NULL, 1000.00, 1.00, NULL, 1, '2026-03-03 04:52:06', '2026-03-03 04:52:06', NULL, 0),
(33, 'CU-A0003', '益展工業股份有限公司', NULL, '益展工業股份有限公司', NULL, NULL, NULL, '07-632-1995(一樓) / 07-632-0069 (二樓)', NULL, '生管-蘇亭綺\'S、王盈淑\'S  品管-王雪芬\'S', '07-632-0068', NULL, NULL, '李忠義廠長', NULL, '0975207775', NULL, '黃惠雯\'S', '07-632-0069(-二樓傳真)', NULL, NULL, 25, 25, '票期90天', '89829798', '單重如在1.00以下，單重需做三位數', 2000.00, 1.00, NULL, 1, '2026-03-04 10:14:22', '2026-03-10 04:01:46', NULL, 0),
(34, 'CU-A0015', '晴岡企業股份有限公司', NULL, '晴岡企業股份有限公司', '820高雄市岡山區河華路6巷6-1號', '820高雄市岡山區河華路6巷6-1號', NULL, '07-623-3329', NULL, '生管-潘素卿\'S#23  品管-王信富課長#12  品管-林\'R#15', '07-624-0066', NULL, NULL, NULL, NULL, NULL, NULL, '黃小姐(對帳)', '02-87736423 #35', NULL, NULL, 30, 5, '票期60天', '24481957', NULL, 1000.00, 1.00, NULL, 1, '2026-03-04 10:22:28', '2026-03-10 03:59:12', NULL, 0),
(35, 'CU-A0005', '唯文股份有限公司', NULL, '唯文股份有限公司', '82063高雄市岡山區岡山北路15號', '82063高雄市岡山區岡山北路15號', NULL, '07-622-1188', NULL, '吳惠雪\'S', '07-622-1177', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 5, '票期60天', '22939923', NULL, 1000.00, 3.00, NULL, 1, '2026-03-04 10:57:29', '2026-03-05 04:35:25', NULL, 0),
(36, 'CU-A0006', '富詮工業股份有限公司', NULL, '富詮工業股份有限公司', '82945高雄市湖內區忠孝街14號', '82945高雄市湖內區忠孝街14號', NULL, '07-693-6281', NULL, '吳雨挌\'S', '07-693-5687', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 5, NULL, '80041974', NULL, 1200.00, 1.00, NULL, 1, '2026-03-05 04:38:14', '2026-03-05 04:38:34', NULL, 0),
(37, 'CU-A0007', '安拓實業股份有限公司', NULL, NULL, NULL, NULL, NULL, '07-622-6062 (潘\'R)', NULL, '潘一葳\'R # 161     思婷#168', '07-622-7799', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 3.00, NULL, 1, '2026-03-05 04:40:11', '2026-03-05 04:40:11', NULL, 0),
(38, 'CU-A0004', '尚展螺絲企業有限公司', NULL, NULL, NULL, NULL, NULL, '07-632-1995 一樓   / 07-632-0069 二樓', NULL, '生管-蘇\'S   王\'S   QC-王雪芬\'S', '07-632-0068', NULL, NULL, '李忠義廠長', NULL, '0975-207-775', NULL, '黃惠雯\'S', '07-632-0069', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2000.00, 3.00, 'uploads/invoice_stamps/345a1a677ac610e17351bc30760a2196.jpg', 1, '2026-03-05 09:46:02', '2026-03-10 04:01:19', NULL, 0),
(39, 'CU-A0009', '弘吉螺絲工業股份有限公司', NULL, '弘吉螺絲工業股份有限公司', '710026台南市永康區鹽行里中正三街453號 (辦公室)', NULL, NULL, '06-2548455', NULL, '楊\'S', '06-2539690', NULL, NULL, '林暢鋥\'r', NULL, '0932732251', NULL, NULL, NULL, NULL, NULL, 25, 5, '票期90天', '16415384', '弘吉=冠旺=展搏', 2000.00, 1.00, NULL, 1, '2026-03-05 09:50:11', '2026-03-17 02:07:04', NULL, 0),
(40, 'CU-A0010', '華峰螺絲企業有限公司', NULL, '華峰螺絲企業有限公司', '82944高雄市湖內區民族街372巷3弄15號', '82944高雄市湖內區民族街372巷3弄15號', NULL, '07-693-2832', NULL, '生管-劉承慶      品管-蔡宛蓁\'S', '07-693-3375', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 30, '票期30天', '89552928', '9號付款', 2000.00, 1.00, NULL, 1, '2026-03-09 09:08:13', '2026-03-09 09:08:13', NULL, 0),
(41, 'CU-A0011', '冠旺螺絲工業有限公司', NULL, '冠旺螺絲工業有限公司', '710026台南市永康區鹽行里中正三街453號 (辦公室)', NULL, NULL, '06-254-8455', NULL, '林暢鋥\'R    周\'S', '06-253-9691', NULL, NULL, '林暢鋥\'R', NULL, '0932732251', NULL, '周\'S', NULL, NULL, NULL, 25, 30, '票期90天', '22251043', '弘吉=冠旺=展搏', 2000.00, 1.00, NULL, 1, '2026-03-10 03:50:17', '2026-03-17 02:07:18', NULL, 0),
(42, 'CU-A0012', '展搏國際有限公司', '臺南市永康區塩行里中正五街156號', '展搏國際有限公司', '710026台南市永康區鹽行里中正三街453號 (辦公室)', NULL, NULL, '06-254-8455', NULL, '林暢鋥\'R   周\'S', '06-253-9691', NULL, NULL, NULL, NULL, '0932732251', NULL, '周\'S', NULL, NULL, NULL, 25, NULL, '票期90天', '45896501', '弘吉=冠旺=展搏', 2000.00, 1.00, NULL, 1, '2026-03-10 03:52:50', '2026-03-17 02:40:16', NULL, 0),
(43, 'CU-A0013', '力大螺絲工廠股份有限公司', NULL, '力大螺絲工廠股份有限公司', '82059高雄市岡山區本工東一路1號', NULL, NULL, '07-624-6033 / 07-624-6088', NULL, '廖勻凰#307', '07-624-8088', NULL, NULL, NULL, NULL, NULL, NULL, '孫\'S', NULL, NULL, NULL, 30, 5, '票期90天', '34426672', NULL, 2000.00, 1.00, NULL, 1, '2026-03-10 03:56:16', '2026-03-19 06:20:35', NULL, 0),
(44, 'CU-A0014', '玉錡企業股份有限公司', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '王珮瑜\'S #107   戴怡莉\'S#110', '07-696-1290', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2000.00, 1.00, NULL, 1, '2026-03-10 03:57:56', '2026-03-19 06:20:39', NULL, 0),
(45, 'CU-A0004', '尚展螺絲企業有限公司', NULL, NULL, NULL, NULL, NULL, '07-632-1995 一樓  , 07-632-0069 二樓', NULL, '蘇亭綺\'S  王盈淑\'S    QC-王雪芬\'S', '07-632-0068', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 3.00, NULL, 1, '2026-03-10 04:00:26', '2026-03-10 04:00:44', '2026-03-10 04:00:44', 45),
(46, 'CU-A0016', '展搏國際有限公司', NULL, '展搏國際有限公司', '71066 台南市永康區中正三街453號', NULL, NULL, NULL, NULL, '林暢鋥\'R   周\'S', NULL, NULL, NULL, '林暢鋥\'R', NULL, '0932732251', NULL, '周\'S', NULL, NULL, NULL, 25, 30, NULL, '45896501', '弘吉=冠旺=展搏', 2000.00, 1.00, NULL, 1, '2026-03-13 09:29:06', '2026-03-19 06:20:44', NULL, 0),
(47, 'CU-A0017', '福輝螺絲工廠股份有限公司', NULL, '福輝螺絲工廠股份有限公司', '820104高雄市岡山區嘉華路21號', NULL, NULL, '07-6282-117', NULL, '生管-藺鳳燕\'S #14      品管#19 陳先生', '07-628-1547', NULL, NULL, NULL, NULL, NULL, NULL, '高媛\'S # 28', NULL, NULL, NULL, 30, 5, '票期60天', '88732487', '發票 : 螺絲加工費 ，秀重量', 2500.00, 1.00, 'uploads/invoice_stamps/ac0dfc3f72c3039798208c599ab410e0.jpg', 1, '2026-03-16 06:43:22', '2026-03-16 07:05:20', NULL, 0),
(48, 'CU-A0018', '鉅群科技有限公司', NULL, NULL, '829007高雄市湖內區中華街74巷46號', NULL, NULL, '07-699-0222', NULL, '鄭尹瑄\'S #205', '07-699-5599', NULL, NULL, NULL, NULL, NULL, NULL, '會計陳文慧\'S', '#234', NULL, NULL, 30, 5, '月結60天', '42819741', '發票備註要寫公斤數', 3000.00, 1.00, NULL, 1, '2026-03-19 06:19:37', '2026-03-19 06:19:37', NULL, 0),
(49, 'CU-A0019', '神洲螺絲工業有限公司', NULL, '神洲螺絲工業有限公司', '82942高雄市湖內區中山路2段62巷40號', NULL, NULL, '07-699-2230 (生管)', NULL, '生管-吳家惠#224、洪千雅#226 、 翁課長#223', '07-699-0069', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 30, '票期30天', '28627763', NULL, 2000.00, 1.00, NULL, 1, '2026-03-24 11:06:22', '2026-03-24 11:06:22', NULL, 0),
(50, 'CU-A0020', '橙品工業股份有限公司', NULL, '橙品工業股份有限公司', '82057高雄市岡山區嘉興里信中街379巷197-50號', NULL, NULL, '07-622-7890', NULL, '黃韻錞\'S #30   廖小姐#14', '07-621-8166', NULL, NULL, NULL, NULL, NULL, NULL, '蔡淑美\'S #42', NULL, NULL, NULL, 25, 30, '月結60天', '53243630', NULL, 2000.00, 1.00, NULL, 1, '2026-03-24 11:08:35', '2026-04-02 11:35:18', NULL, 0),
(51, 'CU-A0021', '傑聯工業有限公司', '高雄市路竹區中山路136號', NULL, '高雄市路竹區中山路136號', '高雄市路竹區中山路136號', NULL, '07-6971725', NULL, '生管黃\'S', '07-6971723', NULL, '台北市內湖區新溯三路132號6樓', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 5, '票期60天', '84845117', NULL, 0.00, 3.00, NULL, 1, '2026-03-27 09:18:21', '2026-03-27 09:38:08', NULL, 0),
(52, 'CU-A0023', '三能螺栓工業股份有限公司', NULL, '三能螺栓工業股份有限公司', '高雄市岡山區本洲路381巷123號', NULL, NULL, '07-621-7668', NULL, '黃鼎盛\'r #307', '07-621-3795', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 5, '月結30天', '22098891', '電匯內扣手續費10元', 0.00, 3.00, NULL, 1, '2026-05-05 05:54:06', '2026-05-05 05:54:06', NULL, 0),
(53, 'CU-A0024', '政一工業股份有限公司', NULL, '政一工業股份有限公司', '821008 高雄市路竹區華正路1-1號', '821008 高雄市路竹區華正路1-1號', NULL, '07-698-2271', NULL, '杜建成', '07-698-2268', NULL, '821008 高雄市路竹區華正路1-1號', '杜建成', NULL, '0937491897', '1992.zhengyi@gmail.com', '杜建成', NULL, NULL, NULL, 30, 5, NULL, '86601002', '電匯，內扣匯費15元', 2500.00, 3.00, 'uploads/invoice_stamps/d0ae1d8276bc25cc8727411a2dc27e54.jpg', 1, '2026-05-11 06:57:07', '2026-05-11 06:57:07', NULL, 0),
(54, 'CU-A0025', '睿鋼工業有限公司', NULL, '睿鋼工業有限公司', '821008 高雄市路竹區華正路1-1號', '821008 高雄市路竹區華正路1-1號', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '吳先生', NULL, '0960007751', NULL, '吳小姐', NULL, '0929234108', NULL, 25, 30, '票期60天', '42808929', NULL, 2500.00, 3.00, 'uploads/invoice_stamps/e70b0883c4c25949cc58a192a72c1b29.jpg', 1, '2026-05-11 06:59:19', '2026-05-11 07:01:00', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `daily_machine_inspections`
--

CREATE TABLE `daily_machine_inspections` (
  `id` bigint(20) NOT NULL,
  `inspection_date` date NOT NULL COMMENT '檢驗日期',
  `machine_id` bigint(20) NOT NULL COMMENT '機台ID',
  `inspector_id` bigint(20) NOT NULL COMMENT '檢驗員工ID',
  `is_qualified` tinyint(1) NOT NULL COMMENT '是否合格(0:不合格,1:合格)',
  `notes` text DEFAULT NULL COMMENT '檢驗備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `daily_machine_inspection_items`
--

CREATE TABLE `daily_machine_inspection_items` (
  `id` bigint(20) NOT NULL,
  `inspection_id` bigint(20) NOT NULL COMMENT '每日檢驗ID',
  `item_name` varchar(100) NOT NULL COMMENT '檢驗項目名稱',
  `standard` varchar(255) DEFAULT NULL COMMENT '檢驗標準',
  `actual_result` varchar(255) DEFAULT NULL COMMENT '實際檢驗結果',
  `is_pass` tinyint(1) NOT NULL COMMENT '是否通過(0:不通過,1:通過)',
  `remarks` varchar(255) DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `dashboard_calendar_events`
--

CREATE TABLE `dashboard_calendar_events` (
  `id` bigint(20) NOT NULL,
  `event_type` varchar(50) NOT NULL COMMENT '事件類型',
  `reference_id` bigint(20) DEFAULT NULL COMMENT '關聯業務ID',
  `title` varchar(200) NOT NULL COMMENT '事件標題',
  `description` text DEFAULT NULL COMMENT '事件描述',
  `start_datetime` datetime NOT NULL COMMENT '開始時間',
  `end_datetime` datetime DEFAULT NULL COMMENT '結束時間',
  `is_all_day` tinyint(1) DEFAULT 0 COMMENT '是否全天事件(0:否,1:是)',
  `status` varchar(50) DEFAULT NULL COMMENT '事件狀態',
  `priority` varchar(50) DEFAULT NULL COMMENT '優先級',
  `color` varchar(7) DEFAULT '#3788d8' COMMENT '顯示顏色',
  `created_by_employee_id` bigint(20) DEFAULT NULL COMMENT '建立者員工ID',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '部門名稱',
  `parent_department_id` bigint(20) DEFAULT NULL COMMENT '上級部門ID',
  `manager_id` bigint(20) DEFAULT NULL,
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '部門狀態(關聯LookupValues)',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `departments`
--

INSERT INTO `departments` (`id`, `name`, `parent_department_id`, `manager_id`, `status_lookup_id`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, '資訊部', NULL, NULL, NULL, '2025-08-12 05:00:40', '2025-08-12 05:00:40', NULL, 0),
(2, '會計部', NULL, NULL, NULL, '2025-08-12 10:56:06', '2025-08-12 10:56:06', NULL, 0),
(3, '篩分部', NULL, NULL, NULL, '2025-08-12 11:18:12', '2025-08-12 11:18:12', NULL, 0),
(4, '總務部', NULL, NULL, NULL, '2025-08-18 05:22:46', '2025-08-18 05:22:46', NULL, 0),
(5, '便當部', NULL, NULL, NULL, '2025-09-28 06:29:06', '2025-09-28 06:29:06', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `domain_event_outbox`
--

CREATE TABLE `domain_event_outbox` (
  `id` bigint(20) NOT NULL,
  `aggregate_type` varchar(50) NOT NULL COMMENT '聚合類型',
  `aggregate_id` bigint(20) NOT NULL COMMENT '聚合ID',
  `event_type` varchar(50) NOT NULL COMMENT '事件類型',
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '事件資料',
  `process_status` varchar(50) NOT NULL COMMENT '處理狀態',
  `retry_count` int(11) DEFAULT 0 COMMENT '重試次數',
  `last_error` varchar(500) DEFAULT NULL COMMENT '最後錯誤訊息',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '處理時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `employees`
--

CREATE TABLE `employees` (
  `id` bigint(20) NOT NULL,
  `employee_number` varchar(50) NOT NULL COMMENT '員工編號',
  `account` varchar(100) NOT NULL COMMENT '帳號',
  `name` varchar(100) NOT NULL COMMENT '員工姓名',
  `department_id` bigint(20) DEFAULT NULL COMMENT '所屬部門',
  `job_title` varchar(100) DEFAULT NULL COMMENT '職稱',
  `email` varchar(100) NOT NULL COMMENT '電子郵件',
  `password_hash` varchar(255) NOT NULL COMMENT '密碼雜湊',
  `status` varchar(50) DEFAULT NULL COMMENT '帳號狀態',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '帳號狀態(關聯LookupValues)',
  `last_login_at` datetime DEFAULT NULL COMMENT '上次登入時間',
  `session_token` varchar(64) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `employees`
--

INSERT INTO `employees` (`id`, `employee_number`, `account`, `name`, `department_id`, `job_title`, `email`, `password_hash`, `status`, `status_lookup_id`, `last_login_at`, `session_token`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'EMP001', 'admin', '管理員', 1, '系統管理員', 'admin@example.com', '$2y$12$0wMAc0U4ZpqQfjrxNK7Uve8M5cz8oXpl0dj6lKAwEFviEROuXRvWa', 'active', 12, '2026-05-11 16:43:45', '661ba62d8ee8b0889b47013ab87cbb9523606d5a6974a61da7ba0b98729aec3e', '2025-08-11 14:32:07', '2026-05-11 08:43:45', NULL, 0),
(3, 'EMP002', 'yang', '楊小姐', 2, '會計', 'aaa@gmail.com', '$2a$10$OLHJkUvds0n0VG.Afb4gX.1znA.8MBvSGwbtrGXgGY3xBVUZg2o/O', 'active', 12, '2025-08-21 05:36:18', NULL, '2025-08-12 11:13:09', '2026-03-03 04:59:59', '2026-03-03 04:59:59', 3),
(4, 'EMP003', 'lin', '林天才', 3, '現場人員', 'aaaacc@gmail.com', '$2a$10$.B6Vf4cXnRaUClcTy1PmS.7rJHRAXi.woKM2dRerhUlRMDYAybT0G', 'active', 12, '2025-08-21 05:31:39', NULL, '2025-08-18 05:23:26', '2026-03-03 04:59:56', '2026-03-03 04:59:56', 4),
(5, 'EMP004', 'wang', '王老大', 5, '訂便當', 'abcd@sort.com', '$2y$10$FLYyRj/M5lJ8yO391B1nm.NFymfxWG8pENZb0YEF3n6ud8MrGkBQa', 'active', 12, NULL, NULL, '2025-09-28 09:15:28', '2026-02-10 13:11:48', '2026-02-10 12:40:56', 5),
(9, 'YC001', 'wang', '王振羽', 1, NULL, 'yc001@sort.com.tw', '$2y$10$Yzx3jTALd.jY7Kb9TJutH.Xk4WtxGgarB.QCMn5LTrpHDacgeLepS', 'active', 12, '2026-03-09 15:35:06', 'e74669187d1fb243d795069a121ec25196e7b49d0036db1b110b002d635aeedb', '2026-02-12 12:58:53', '2026-03-09 07:35:06', NULL, 0),
(10, 'YC1060301002', 'yvonne', '江乙芳', NULL, NULL, 'yc004@sort.com.tw', '$2y$10$4HNnuA3kYw2mjhHz2ZjXmeStcbH4kJGqUoP9tGE40ljiTyaS4gZ/m', 'active', 12, '2026-05-11 16:45:48', '26f3c8a6f4eda8a6c772cbe876fba0ce90e2a07f6c1e1f89cbd42d55635a2e88', '2026-03-03 02:49:35', '2026-05-11 08:45:48', NULL, 0),
(11, 'YC1100913001', 'KUO', '郭芸彤', NULL, NULL, 'yc006@sort.com.tw', '$2y$10$WO5d1f.ROFDSD6RvKsxM8.2ylXk3raaC69NRTmshDX9xiC5WMvJke', 'active', 12, '2026-05-07 15:49:09', 'e27bf1bf2dfcb1106c2e3dc2fe9895a514b9b14420677867e7d214523af4e16f', '2026-03-03 02:51:55', '2026-05-07 07:49:09', NULL, 0),
(12, 'YC1070903001', 'ttt21088178', '王璿閔', 3, NULL, 'ttt21088178@gmail.com', '$2y$10$IEwh9CtqhoWs/AXNIC10JOtvmtHNjSbE7ZDfjwqa2GyWMWOhFaW76', 'active', 12, NULL, NULL, '2026-05-11 06:43:35', '2026-05-11 06:43:35', NULL, 0),
(13, 'YC1090401001', 'lbjaakk23', '王乙智', NULL, NULL, 'lbjaakk23@yahoo.com.tw', '$2y$10$/Vy2uUB66jVa.Jwl6eyzauRT3gBlYQoJfpKFLpqmmZBnS3ufTvFcy', 'active', 12, NULL, NULL, '2026-05-11 06:45:03', '2026-05-11 06:45:03', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `employee_roles`
--

CREATE TABLE `employee_roles` (
  `employee_id` bigint(20) NOT NULL COMMENT '員工ID',
  `role_id` bigint(20) NOT NULL COMMENT '角色ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `employee_roles`
--

INSERT INTO `employee_roles` (`employee_id`, `role_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- 資料表結構 `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` bigint(20) NOT NULL,
  `screening_item_id` bigint(20) NOT NULL COMMENT '篩分品項ID (關聯 ScreeningItems)',
  `inventory_number` varchar(50) NOT NULL COMMENT '庫存編號 (系統自動生成,如 INV-20251124-0001)',
  `work_order_id` bigint(20) NOT NULL COMMENT '生產工單ID (關聯 WorkOrders)',
  `order_item_id` bigint(20) NOT NULL COMMENT '訂單品項ID (關聯 OrderItems，即客戶批號)',
  `order_id` bigint(20) NOT NULL COMMENT '訂單ID (關聯 Orders)',
  `customer_id` bigint(20) NOT NULL COMMENT '客戶ID (關聯 Customers)',
  `customer_batch_number` varchar(100) DEFAULT NULL COMMENT '客戶批號 (冗餘欄位,來自 OrderItems)',
  `internal_lot_number` varchar(50) DEFAULT NULL COMMENT '內部批號 (可選,用於內部管理)',
  `total_good_units` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '良品總支數',
  `total_defect_units` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '不良品總支數',
  `quantity_on_hand` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '現有庫存數量 (可用良品支數)',
  `quantity_allocated` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '已分配數量 (已配給出貨單但未出貨)',
  `quantity_reserved` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '保留數量 (保留給特定用途)',
  `quantity_shipped` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT '已出貨數量',
  `net_weight_kg` decimal(10,2) NOT NULL COMMENT '淨重 (kg，不含載具)',
  `gross_weight_kg` decimal(10,2) NOT NULL COMMENT '總重 (kg，含載具)',
  `tool_weight_kg` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '載具總重 (kg)',
  `weight_per_unit_g` decimal(10,3) NOT NULL COMMENT '產品單支重 (g)',
  `tool_statistics` text DEFAULT NULL COMMENT '載具統計 (如: 10kg標準桶 2個、52kg標準船 1個)',
  `total_tool_quantity` int(11) NOT NULL DEFAULT 0 COMMENT '載具總數量',
  `quality_status` varchar(50) DEFAULT 'qualified' COMMENT '質量狀態 (qualified=合格, quarantine=隔離, rejected=拒收)',
  `inspection_date` datetime DEFAULT NULL COMMENT '檢驗日期',
  `inspector_employee_id` bigint(20) DEFAULT NULL COMMENT '檢驗人員ID',
  `quality_notes` text DEFAULT NULL COMMENT '質量備註',
  `warehouse_location` varchar(100) DEFAULT NULL COMMENT '倉庫位置',
  `storage_zone` varchar(50) DEFAULT NULL COMMENT '儲區',
  `shelf_number` varchar(50) DEFAULT NULL COMMENT '貨架號',
  `status` varchar(50) DEFAULT 'in_stock' COMMENT '庫存狀態 (in_stock=在庫, allocated=已配貨, shipped=已出貨, consumed=已耗用)',
  `notes` text DEFAULT NULL COMMENT '備註',
  `received_at` datetime NOT NULL COMMENT '入庫時間',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `created_by_employee_id` bigint(20) DEFAULT NULL COMMENT '建立者員工ID',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間 (軟刪除)',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='庫存項目表';

--
-- 傾印資料表的資料 `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `screening_item_id`, `inventory_number`, `work_order_id`, `order_item_id`, `order_id`, `customer_id`, `customer_batch_number`, `internal_lot_number`, `total_good_units`, `total_defect_units`, `quantity_on_hand`, `quantity_allocated`, `quantity_reserved`, `quantity_shipped`, `net_weight_kg`, `gross_weight_kg`, `tool_weight_kg`, `weight_per_unit_g`, `tool_statistics`, `total_tool_quantity`, `quality_status`, `inspection_date`, `inspector_employee_id`, `quality_notes`, `warehouse_location`, `storage_zone`, `shelf_number`, `status`, `notes`, `received_at`, `created_at`, `updated_at`, `created_by_employee_id`, `deleted_at`, `delete_token`) VALUES
(1, 3, 'INV-20260508-0001', 1, 4, 2, 52, '145518 H13R11', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:06:34', '2026-05-08 03:06:34', '2026-05-08 03:38:03', 10, '2026-05-08 03:38:03', 1),
(2, 3, 'INV-20260508-0002', 2, 5, 2, 52, '144518 H13R09', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:10:34', '2026-05-08 03:10:34', '2026-05-08 03:38:05', 10, '2026-05-08 03:38:05', 2),
(3, 3, 'INV-20260508-0003', 2, 5, 2, 52, '144518 H13R09', NULL, 485714.00, 417.00, 485714.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 0.700, '59KG 1個', 1, 'qualified', '2026-05-07 10:00:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:45:00', '2026-05-08 03:46:20', '2026-05-08 03:51:39', 10, '2026-05-08 03:51:39', 3),
(4, 3, 'INV-20260508-0004', 1, 4, 2, 52, '145518 H13R11', NULL, 487143.00, 1316.00, 487143.00, 0.00, 0.00, 0.00, 341.00, 400.00, 59.00, 0.700, '59KG 1個', 1, 'qualified', '2026-05-07 11:00:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:46:00', '2026-05-08 03:47:12', '2026-05-08 03:49:53', 10, '2026-05-08 03:49:53', 4),
(5, 3, 'INV-20260508-0005', 1, 4, 2, 52, '145518 H13R11', NULL, 572164.00, 1316.00, 527164.00, 0.00, 0.00, 0.00, 400.00, 459.00, 59.00, 0.700, '59KG 1個', 1, 'qualified', '2026-05-08 11:00:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:50:00', '2026-05-08 03:51:03', '2026-05-11 02:51:44', 10, '2026-05-11 02:51:44', 5),
(6, 3, 'INV-20260508-0006', 2, 5, 2, 52, '144518 H13R09', NULL, 489209.00, 417.00, 489209.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 0.700, '59KG 1個', 1, 'qualified', '2026-05-08 09:00:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-08 11:51:00', '2026-05-08 03:52:14', '2026-05-11 02:51:42', 10, '2026-05-11 02:51:42', 6),
(7, 3, 'INV-20260511-0001', 2, 5, 2, 52, '144518 H13R09', NULL, 340000.00, 92.00, 340000.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', NULL, 10, NULL, NULL, NULL, NULL, 'allocated', NULL, '2026-05-11 10:52:00', '2026-05-11 02:52:51', '2026-05-11 02:57:03', 10, '2026-05-11 02:57:03', 7),
(8, 3, 'INV-20260511-0002', 1, 4, 2, 52, '145518 H13R11', NULL, 400000.00, 2112.00, 400000.00, 0.00, 0.00, 0.00, 400.00, 459.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', '2026-05-08 08:15:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-11 10:54:00', '2026-05-11 02:54:47', '2026-05-11 02:55:02', 10, '2026-05-11 02:55:02', 8),
(9, 3, 'INV-20260511-0003', 1, 4, 2, 52, '145518 H13R11', NULL, 340000.00, 92.00, 340000.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', '2026-05-09 12:00:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-11 10:55:00', '2026-05-11 02:55:20', '2026-05-11 02:59:37', 10, '2026-05-11 02:59:37', 9),
(10, 3, 'INV-20260511-0004', 2, 5, 2, 52, '144518 H13R09', NULL, 340000.00, 92.00, 340000.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-11 10:57:00', '2026-05-11 02:57:33', '2026-05-11 02:59:38', 10, '2026-05-11 02:59:38', 10),
(11, 3, 'INV-20260511-0005', 2, 5, 2, 52, '144518 H13R09', NULL, 340000.00, 92.00, 340000.00, 0.00, 0.00, 0.00, 340.00, 399.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-11 10:59:00', '2026-05-11 02:59:45', '2026-05-11 02:59:45', 10, NULL, 0),
(12, 3, 'INV-20260511-0006', 1, 4, 2, 52, '145518 H13R11', NULL, 400000.00, 2112.00, 400000.00, 0.00, 0.00, 0.00, 400.00, 459.00, 59.00, 1.000, '59KG 1個', 1, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-11 10:59:00', '2026-05-11 02:59:55', '2026-05-11 02:59:55', 10, NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` bigint(20) NOT NULL,
  `inventory_item_id` bigint(20) NOT NULL COMMENT '庫存項目ID',
  `order_id` bigint(20) DEFAULT NULL,
  `order_item_id` bigint(20) DEFAULT NULL,
  `work_order_id` bigint(20) DEFAULT NULL,
  `ref_type` varchar(30) NOT NULL COMMENT '關聯類型',
  `ref_id` bigint(20) NOT NULL COMMENT '關聯ID',
  `direction` varchar(50) NOT NULL COMMENT '異動方向(進/出)',
  `direction_lookup_id` bigint(20) DEFAULT NULL,
  `quantity` decimal(14,2) NOT NULL COMMENT '異動數量',
  `after_quantity` decimal(14,2) NOT NULL COMMENT '異動後數量',
  `notes` varchar(255) DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `created_by_employee_id` bigint(20) DEFAULT NULL COMMENT '建立者員工ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `inventory_item_id`, `order_id`, `order_item_id`, `work_order_id`, `ref_type`, `ref_id`, `direction`, `direction_lookup_id`, `quantity`, `after_quantity`, `notes`, `created_at`, `created_by_employee_id`) VALUES
(1, 1, 2, 4, 1, 'work_order', 1, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-05-08 03:06:34', 10),
(2, 2, 2, 5, 2, 'work_order', 2, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-05-08 03:10:34', 10),
(3, 3, NULL, NULL, NULL, 'work_order', 2, 'inbound', NULL, 485714.00, 485714.00, '生產工單入庫', '2026-05-08 03:46:20', 10),
(4, 4, NULL, NULL, NULL, 'work_order', 1, 'inbound', NULL, 487143.00, 487143.00, '生產工單入庫', '2026-05-08 03:47:12', 10),
(5, 5, NULL, NULL, NULL, 'work_order', 1, 'inbound', NULL, 572164.00, 527164.00, '生產工單入庫', '2026-05-08 03:51:03', 10),
(6, 6, NULL, NULL, NULL, 'work_order', 2, 'inbound', NULL, 489209.00, 589209.00, '生產工單入庫', '2026-05-08 03:52:14', 10),
(7, 6, NULL, NULL, NULL, 'adjustment', 6, 'outbound', NULL, 100000.00, 489209.00, '庫存調整', '2026-05-08 03:52:53', 10),
(8, 7, NULL, NULL, NULL, 'work_order', 2, 'inbound', NULL, 340000.00, 340000.00, '生產工單入庫', '2026-05-11 02:52:51', 10),
(9, 8, NULL, NULL, NULL, 'work_order', 1, 'inbound', NULL, 400000.00, 400000.00, '生產工單入庫', '2026-05-11 02:54:47', 10),
(10, 9, NULL, NULL, NULL, 'work_order', 1, 'inbound', NULL, 400000.00, 400000.00, '生產工單入庫', '2026-05-11 02:55:20', 10),
(11, 10, NULL, NULL, NULL, 'work_order', 2, 'inbound', NULL, 340000.00, 340000.00, '生產工單入庫', '2026-05-11 02:57:33', 10),
(12, 9, NULL, NULL, NULL, 'adjustment', 9, 'outbound', NULL, 60000.00, 340000.00, '庫存調整', '2026-05-11 02:57:49', 10),
(13, 11, NULL, NULL, NULL, 'work_order', 2, 'inbound', NULL, 340000.00, 340000.00, '生產工單入庫', '2026-05-11 02:59:45', 10),
(14, 12, NULL, NULL, NULL, 'work_order', 1, 'inbound', NULL, 400000.00, 400000.00, '生產工單入庫', '2026-05-11 02:59:55', 10);

-- --------------------------------------------------------

--
-- 資料表結構 `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `account` varchar(100) NOT NULL DEFAULT '',
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `attempted_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `ip_address`, `account`, `success`, `attempted_at`) VALUES
(1, '1.175.234.130', 'admin', 1, '2026-05-06 23:31:46'),
(2, '218.166.10.178', 'yvonne', 1, '2026-05-07 08:48:11'),
(3, '1.175.234.130', 'admin', 1, '2026-05-07 11:48:20'),
(4, '218.166.10.178', 'yvonne', 1, '2026-05-07 12:32:57'),
(5, '218.166.10.178', 'KUO', 1, '2026-05-07 12:55:08'),
(6, '1.175.234.130', 'admin', 1, '2026-05-07 14:27:48'),
(8, '218.166.10.178', 'yvonne', 1, '2026-05-07 14:57:27'),
(9, '218.166.10.178', 'KUO', 1, '2026-05-07 15:47:20'),
(10, '218.166.10.178', 'KUO', 1, '2026-05-07 15:49:09'),
(11, '1.175.234.130', 'admin', 1, '2026-05-07 17:08:47'),
(12, '1.175.234.130', 'admin', 1, '2026-05-07 23:05:36'),
(14, '218.166.10.178', 'yvonne', 1, '2026-05-08 09:06:11'),
(15, '218.166.10.178', 'YVONNE', 1, '2026-05-08 10:56:45'),
(16, '1.174.115.117', 'admin', 1, '2026-05-08 11:25:19'),
(17, '218.166.10.178', 'yvonne', 1, '2026-05-08 11:34:45'),
(18, '218.166.10.178', 'yvonne', 1, '2026-05-08 11:36:11'),
(19, '218.166.10.178', 'yvonne', 1, '2026-05-08 11:37:01'),
(20, '218.166.10.178', 'yvonne', 1, '2026-05-08 11:42:31'),
(21, '218.166.10.178', 'yvonne', 1, '2026-05-08 12:34:27'),
(22, '36.238.171.62', 'yvonne', 1, '2026-05-11 10:35:29'),
(23, '36.238.171.62', 'yvonne', 1, '2026-05-11 14:41:38'),
(24, '1.175.240.73', 'admin', 1, '2026-05-11 16:43:45'),
(25, '36.238.171.62', 'yvonne', 1, '2026-05-11 16:45:48');

-- --------------------------------------------------------

--
-- 資料表結構 `lookup_domains`
--

CREATE TABLE `lookup_domains` (
  `id` bigint(20) NOT NULL,
  `domain_key` varchar(50) NOT NULL COMMENT '領域鍵值',
  `description` varchar(255) DEFAULT NULL COMMENT '領域描述',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `lookup_domains`
--

INSERT INTO `lookup_domains` (`id`, `domain_key`, `description`, `created_at`, `updated_at`) VALUES
(0, 'service_category', '用於定義員工的在職狀態', '2025-08-17 13:12:59', '2025-08-18 04:27:49'),
(1, 'status_order', '訂單狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(2, 'status_work_order', '工單狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(3, 'unit', '計量單位', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(4, 'employee_status', '員工狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(5, 'machine_status', '機台狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(6, 'tool_status', '載具狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(7, 'shipping_status', '出貨狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(8, 'return_processing_status', '退貨處理狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(9, 'inspection_result', '檢驗結果', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(10, 'issue_source_type', '異常來源類型', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(11, 'event_type', '行事曆事件類型', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(12, 'event_status', '行事曆事件狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(13, 'event_priority', '行事曆事件優先級', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(14, 'reminder_type', '提醒方式', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(15, 'inventory_direction', '庫存交易方向', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(16, 'maintenance_task_type', '維修任務類型', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(17, 'maintenance_task_status', '維修任務狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(18, 'outbox_process_status', 'Outbox處理狀態', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(19, 'customer_sample_status', '客戶樣品狀態', '2025-08-18 13:09:06', '2025-08-18 13:09:06');

-- --------------------------------------------------------

--
-- 資料表結構 `lookup_values`
--

CREATE TABLE `lookup_values` (
  `id` bigint(20) NOT NULL,
  `domain_id` bigint(20) NOT NULL COMMENT '領域ID',
  `value_key` varchar(50) NOT NULL COMMENT '數值鍵值',
  `value_label` varchar(100) NOT NULL COMMENT '數值標籤',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序順序',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用(0:停用,1:啟用)',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `lookup_values`
--

INSERT INTO `lookup_values` (`id`, `domain_id`, `value_key`, `value_label`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(0, 0, 'general', '一般全檢', 1, 1, '2025-08-17 13:12:59', '2025-08-17 13:12:59'),
(1, 1, 'pending', '待處理', 1, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(2, 1, 'confirmed', '已確認', 2, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(3, 1, 'in_progress', '進行中', 3, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(4, 1, 'completed', '已完成', 4, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(5, 1, 'cancelled', '已取消', 5, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(10, 3, 'pcs', '件', 1, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(11, 3, 'kg', '公斤', 2, 1, '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(12, 4, 'active', '在職', 1, 1, '2025-08-18 04:41:56', '2025-08-18 04:41:56'),
(13, 4, 'resigned', '離職', 2, 1, '2025-08-18 04:41:56', '2025-08-18 04:41:56'),
(14, 4, 'unpaid_leave', '留職停薪', 3, 1, '2025-08-18 04:41:56', '2025-08-18 04:41:56'),
(15, 5, 'operational', '正常運作', 1, 1, '2025-08-18 04:47:27', '2025-08-18 04:47:27'),
(16, 5, 'maintenance', '歲修停機', 2, 1, '2025-08-18 04:47:27', '2025-08-18 04:47:27'),
(17, 5, 'vendor_service', '廠商維護', 3, 1, '2025-08-18 04:47:27', '2025-08-18 04:47:27'),
(18, 5, 'unknown', '不明原因', 4, 1, '2025-08-18 04:47:27', '2025-08-18 04:47:27'),
(19, 6, 'available', '啟用', 1, 1, '2025-08-18 04:50:18', '2025-08-18 04:50:18'),
(20, 6, 'inactive', '停用', 2, 1, '2025-08-18 04:50:18', '2025-08-18 04:50:18'),
(21, 0, 'special', '特殊加選', 2, 1, '2025-08-18 04:59:38', '2025-08-18 04:59:38'),
(22, 19, 'yes', '有', 1, 1, '2025-08-18 12:39:23', '2025-08-18 13:09:47'),
(23, 19, 'no', '無', 2, 1, '2025-08-18 12:39:23', '2025-08-18 13:09:47'),
(24, 19, 'return_required', '有，須歸還', 3, 1, '2025-08-18 12:39:23', '2025-08-18 13:09:47'),
(25, 2, 'pending', '待開始', 1, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(26, 2, 'in_progress', '進行中', 2, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(27, 2, 'paused', '暫停', 3, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(28, 2, 'completed', '已完成', 4, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(29, 2, 'cancelled', '已取消', 5, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(30, 6, 'in_use', '使用中', 3, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(31, 6, 'maintenance', '維護中', 4, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(32, 6, 'damaged', '損壞', 5, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(33, 7, 'preparing', '準備中', 1, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(34, 7, 'packed', '已包裝', 2, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(35, 7, 'shipped', '已出貨', 3, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(36, 7, 'delivered', '已送達', 4, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(37, 8, 'received', '已收到', 1, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(38, 8, 'processing', '處理中', 2, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(39, 8, 'completed', '已完成', 3, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(40, 8, 'rejected', '已拒絕', 4, 1, '2025-09-30 00:00:00', '2025-09-30 00:00:00'),
(1765120625007, 7, 'draft', '草稿', 0, 1, '2025-12-07 15:17:04', '2025-12-07 15:17:04'),
(1765120625012, 7, 'cancelled', '已取消', 5, 1, '2025-12-07 15:17:04', '2025-12-07 15:17:04'),
(1765120625514, 7, 'confirmed', '已確認', 1, 1, '2025-12-07 15:17:04', '2025-12-07 15:17:04'),
(1765120625515, 15, 'inbound', '入庫', 1, 1, '2025-12-08 09:34:48', '2025-12-08 09:34:48'),
(1765120625516, 15, 'outbound', '出庫', 2, 1, '2025-12-08 09:34:48', '2025-12-08 09:34:48'),
(1765120625517, 15, 'adjustment', '調整', 3, 1, '2025-12-08 09:34:48', '2025-12-08 09:34:48'),
(1765200001001, 13, 'low', '低', 1, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200001002, 13, 'medium', '中', 2, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200001003, 13, 'high', '高', 3, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200001004, 13, 'urgent', '緊急', 4, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200002001, 12, 'scheduled', '已排程', 1, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200002002, 12, 'in_progress', '進行中', 2, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200002003, 12, 'completed', '已完成', 3, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200002004, 12, 'cancelled', '已取消', 4, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200003001, 11, 'meeting', '會議', 1, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200003002, 11, 'maintenance', '維護保養', 2, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200003003, 11, 'deadline', '截止日期', 3, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200003004, 11, 'reminder', '提醒事項', 4, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200003005, 11, 'other', '其他', 5, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200004001, 9, 'pass', '合格', 1, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200004002, 9, 'fail', '不合格', 2, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200004003, 9, 'conditional', '條件合格', 3, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200004004, 9, 'pending', '待檢驗', 4, 1, '2026-02-01 13:20:54', '2026-02-01 13:20:54'),
(1765200005001, 10, 'incoming', '進料', 1, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200005002, 10, 'production', '生產', 2, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200005003, 10, 'shipping', '出貨', 3, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200005004, 10, 'customer_return', '客戶退貨', 4, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200005005, 10, 'internal_audit', '內部稽核', 5, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200006001, 17, 'pending', '待處理', 1, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200006002, 17, 'in_progress', '進行中', 2, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200006003, 17, 'completed', '已完成', 3, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200006004, 17, 'cancelled', '已取消', 4, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200007001, 16, 'routine', '例行保養', 1, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200007002, 16, 'repair', '維修', 2, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200007003, 16, 'calibration', '校正', 3, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200007004, 16, 'inspection', '檢查', 4, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200007005, 16, 'replacement', '零件更換', 5, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200008001, 18, 'pending', '待處理', 1, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200008002, 18, 'processing', '處理中', 2, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200008003, 18, 'completed', '已完成', 3, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200008004, 18, 'failed', '失敗', 4, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200009001, 14, 'email', '電子郵件', 1, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200009002, 14, 'system', '系統通知', 2, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05'),
(1765200009003, 14, 'sms', '簡訊', 3, 1, '2026-02-01 13:21:05', '2026-02-01 13:21:05');

-- --------------------------------------------------------

--
-- 資料表結構 `machines`
--

CREATE TABLE `machines` (
  `id` bigint(20) NOT NULL,
  `machine_number` varchar(50) NOT NULL COMMENT '機台編號',
  `name` varchar(100) NOT NULL COMMENT '機台種類',
  `model` varchar(100) DEFAULT NULL COMMENT '型號',
  `purchase_date` date DEFAULT NULL COMMENT '採購日期',
  `department_id` bigint(20) DEFAULT NULL COMMENT '負責部門',
  `lens_count` int(11) DEFAULT NULL COMMENT '鏡頭數',
  `length_mm` decimal(10,2) DEFAULT NULL COMMENT '長度(mm)',
  `thread_outer_diameter_mm` decimal(10,2) DEFAULT NULL COMMENT '牙外徑(mm)',
  `notes` text DEFAULT NULL COMMENT '備註',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '機台狀態(關聯LookupValues)',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `machine_maintenance_tasks`
--

CREATE TABLE `machine_maintenance_tasks` (
  `id` bigint(20) NOT NULL,
  `machine_id` bigint(20) NOT NULL COMMENT '機台ID',
  `task_type` varchar(50) NOT NULL COMMENT '任務類型',
  `title` varchar(150) NOT NULL COMMENT '任務標題',
  `description` text DEFAULT NULL COMMENT '任務描述',
  `scheduled_start` datetime NOT NULL COMMENT '預定開始時間',
  `scheduled_end` datetime DEFAULT NULL COMMENT '預定結束時間',
  `actual_start` datetime DEFAULT NULL COMMENT '實際開始時間',
  `actual_end` datetime DEFAULT NULL COMMENT '實際結束時間',
  `status` varchar(50) DEFAULT NULL COMMENT '任務狀態',
  `next_due_date` date DEFAULT NULL COMMENT '下次到期日',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `message_attachments`
--

CREATE TABLE `message_attachments` (
  `id` bigint(20) NOT NULL COMMENT '??辣ID',
  `message_id` bigint(20) NOT NULL COMMENT '??????ID',
  `file_name` varchar(255) NOT NULL COMMENT '???瑼??',
  `file_path` varchar(500) NOT NULL COMMENT '?脣?頝臬?',
  `file_size` int(10) UNSIGNED DEFAULT NULL COMMENT '瑼??憭批?(bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME憿??',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '銝?????'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='?????辣銵';

-- --------------------------------------------------------

--
-- 資料表結構 `message_recipients`
--

CREATE TABLE `message_recipients` (
  `id` bigint(20) NOT NULL,
  `message_id` bigint(20) NOT NULL,
  `recipient_id` bigint(20) NOT NULL COMMENT '收件者',
  `read_at` datetime DEFAULT NULL COMMENT '已讀時間',
  `deleted_at` datetime DEFAULT NULL COMMENT '刪除時間（軟刪除）',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='留言收件人表';

-- --------------------------------------------------------

--
-- 資料表結構 `notification_reads`
--

CREATE TABLE `notification_reads` (
  `id` bigint(20) NOT NULL,
  `notification_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `read_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='通知已讀記錄表';

-- --------------------------------------------------------

--
-- 資料表結構 `number_sequences`
--

CREATE TABLE `number_sequences` (
  `id` bigint(20) NOT NULL,
  `seq_key` varchar(50) NOT NULL COMMENT '序列鍵',
  `date_scope` date NOT NULL COMMENT '日期範圍',
  `current_value` int(11) DEFAULT 0 COMMENT '目前值',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) NOT NULL,
  `order_number` varchar(50) NOT NULL COMMENT '訂單號碼',
  `customer_id` bigint(20) NOT NULL COMMENT '客戶ID',
  `order_date` date NOT NULL COMMENT '訂單日期',
  `expected_delivery_date` date DEFAULT NULL COMMENT '預計交期',
  `customer_po_number` varchar(100) DEFAULT NULL COMMENT '客戶訂單號',
  `status` varchar(50) DEFAULT NULL COMMENT '訂單狀態',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '訂單狀態(關聯LookupValues)',
  `total_amount` decimal(14,2) NOT NULL COMMENT '訂單總金額',
  `final_quote_per_m` decimal(14,2) DEFAULT NULL COMMENT '最終報價(元/M)',
  `single_ppm` int(11) DEFAULT NULL COMMENT '單一PPM',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `customer_id`, `order_date`, `expected_delivery_date`, `customer_po_number`, `status`, `status_lookup_id`, `total_amount`, `notes`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'ORDER-20260507-0001', 32, '2026-05-07', '2026-05-22', 'EB00344795', 'confirmed', NULL, 13762.60, NULL, '2026-05-07 05:47:02', '2026-05-07 08:00:09', NULL, 0),
(2, 'ORDER-20260423-0001', 52, '2026-04-23', '2026-05-08', '260101', 'pending', NULL, 16914.29, NULL, '2026-05-08 02:52:47', '2026-05-08 03:03:03', NULL, 0),
(3, 'ORDER-20260511-0001', 54, '2026-05-11', '2026-05-15', '圓形焊帽', 'pending', NULL, 0.00, NULL, '2026-05-11 07:01:52', '2026-05-11 07:02:40', '2026-05-11 07:02:40', 3),
(4, 'ORDER-20260511-0001', 54, '2026-05-11', '2026-05-15', '圓形焊圈帽', 'pending', NULL, 7997.58, NULL, '2026-05-11 07:03:34', '2026-05-11 08:28:17', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) NOT NULL COMMENT '訂單品項ID',
  `order_id` bigint(20) NOT NULL COMMENT '關聯訂單ID',
  `screening_item_id` bigint(20) NOT NULL COMMENT '受篩產品ID (關聯 ScreeningItems)',
  `unit_price_per_thousand` decimal(10,2) DEFAULT NULL COMMENT '單價（元/M，即元/千支）',
  `total_weight_kg` decimal(10,2) NOT NULL COMMENT '總重量（含載具，公斤）',
  `total_units` decimal(14,2) NOT NULL COMMENT '總支數（計算得出）',
  `total_price` decimal(14,2) NOT NULL COMMENT '品項總金額（計算得出）',
  `status` varchar(50) DEFAULT 'pending' COMMENT '生產狀態',
  `drawing_number` varchar(255) DEFAULT NULL COMMENT '主要圖面編號（來自第一張圖面）',
  `sub_item_number` varchar(100) DEFAULT NULL COMMENT '品項編號',
  `part_number` varchar(100) DEFAULT NULL COMMENT '料號',
  `customer_batch_number` varchar(100) DEFAULT NULL COMMENT '客戶批號',
  `customer_sample_status` varchar(50) DEFAULT NULL COMMENT '客戶樣品狀態',
  `delivery_location` text DEFAULT NULL COMMENT '指送地點',
  `notes` text DEFAULT NULL COMMENT '備註',
  `customer_provided_weight` decimal(10,2) DEFAULT NULL COMMENT '客戶提供重量(kg)',
  `confirmed_weight` decimal(10,2) DEFAULT NULL COMMENT '我方確認重量(kg)',
  `actual_production_weight` decimal(10,2) DEFAULT NULL COMMENT '實際生產重量(kg)',
  `total_shipped_quantity` decimal(14,2) DEFAULT 0.00 COMMENT '累計已出貨數量',
  `shipping_status` enum('not_shipped','partial_shipped','fully_shipped') DEFAULT 'not_shipped' COMMENT '出貨狀態',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='訂單品項表';

--
-- 傾印資料表的資料 `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `screening_item_id`, `unit_price_per_thousand`, `total_weight_kg`, `total_units`, `total_price`, `status`, `drawing_number`, `sub_item_number`, `part_number`, `customer_batch_number`, `customer_sample_status`, `delivery_location`, `notes`, `customer_provided_weight`, `confirmed_weight`, `actual_production_weight`, `total_shipped_quantity`, `shipping_status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 15.00, 1448.00, 306235.01, 4593.53, 'pending', '2023-11-27(5)', 'QD260506-009', 'S003691', 'S-202603006-01', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-07 05:58:26', '2026-05-07 06:05:09'),
(2, 1, 1, 15.00, 1448.00, 306235.01, 4593.53, 'pending', NULL, 'QD260506-009', 'S003691', 'S-202603006-01', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(3, 1, 1, 15.00, 1500.00, 305035.97, 4575.54, 'pending', NULL, '123', 'S003691', '456', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(4, 2, 3, 16.00, 459.00, 571428.57, 9142.86, 'completed', 'B226037', NULL, 'B226037', '145518 H13R11', 'no', NULL, NULL, 400.00, 400.00, NULL, 0.00, 'not_shipped', '2026-05-08 02:54:55', '2026-05-08 03:45:24'),
(5, 2, 3, 16.00, 399.00, 485714.29, 7771.43, 'completed', NULL, NULL, 'B226037', '144518 H13R09', 'no', NULL, NULL, 340.00, 340.00, NULL, 0.00, 'not_shipped', '2026-05-08 03:03:03', '2026-05-08 03:45:28'),
(6, 4, 4, 20.00, 2082.00, 122619.77, 2452.40, 'pending', '720883HFVGRT', NULL, '圓形焊圈帽', '260430-11', 'no', '良品出蓁豪，不良品送回睿鋼', '完工換蓁豪船桶', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-11 07:16:50', '2026-05-11 07:24:11'),
(7, 4, 4, 20.00, 2630.00, 154639.18, 3092.78, 'pending', '720883HFVGRT(A4v)', NULL, '圓形焊圈帽', '260507-21', 'no', '良品出蓁豪，不良品送回睿鋼', '完工換蓁豪船桶', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-11 08:01:14', '2026-05-11 08:07:14'),
(8, 4, 4, 20.00, 2082.00, 122619.77, 2452.40, 'cancelled', NULL, NULL, '圓形焊圈帽', '260430-11', 'no', '良品出蓁豪，不良品送回睿鋼', '完工換蓁豪船桶', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-11 08:28:17', '2026-05-11 08:40:18');

-- --------------------------------------------------------

--
-- 資料表結構 `order_item_attachments`
--

CREATE TABLE `order_item_attachments` (
  `id` bigint(20) NOT NULL COMMENT '檔案附件ID',
  `order_item_id` bigint(20) NOT NULL COMMENT '關聯的訂單品項ID',
  `file_name` varchar(255) DEFAULT NULL COMMENT '檔案名稱',
  `file_path` varchar(500) DEFAULT NULL COMMENT '檔案路徑',
  `file_size` bigint(20) DEFAULT NULL COMMENT '檔案大小(bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME類型',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp() COMMENT '上傳時間',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='訂單品項檔案附件表';

-- --------------------------------------------------------

--
-- 資料表結構 `order_item_drawings`
--

CREATE TABLE `order_item_drawings` (
  `id` bigint(20) NOT NULL COMMENT '圖面附件ID',
  `order_item_id` bigint(20) NOT NULL COMMENT '關聯的訂單品項ID',
  `drawing_number` varchar(100) DEFAULT NULL COMMENT '圖面編號',
  `file_name` varchar(255) DEFAULT NULL COMMENT '檔案名稱',
  `file_path` varchar(500) DEFAULT NULL COMMENT '檔案路徑',
  `file_size` bigint(20) DEFAULT NULL COMMENT '檔案大小(bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME類型',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp() COMMENT '上傳時間',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='訂單品項圖面附件表';

--
-- 傾印資料表的資料 `order_item_drawings`
--

INSERT INTO `order_item_drawings` (`id`, `order_item_id`, `drawing_number`, `file_name`, `file_path`, `file_size`, `mime_type`, `uploaded_at`, `created_at`, `updated_at`) VALUES
(1, 1, '2023-11-27(5)', '鑫穩M6-1.0X16-S003691.pdf', 'uploads/order_item_drawings/drawing_69fc2a02c4c117.22247410.pdf', 1672487, 'application/pdf', '2026-05-07 05:58:26', '2026-05-07 05:58:26', '2026-05-07 05:58:26'),
(2, 4, 'B226037', '三能(M3-P1.12X10)B226037.pdf', 'uploads/order_item_drawings/drawing_69fd507f6ba679.11622531.pdf', 896272, 'application/pdf', '2026-05-08 02:54:55', '2026-05-08 02:54:55', '2026-05-08 02:54:55'),
(3, 6, '720883HFVGRT', '睿鋼(M10-18.5X11) 720883HFVGRT.pdf', 'uploads/order_item_drawings/drawing_6a01826249af91.30371635.pdf', 870654, 'application/pdf', '2026-05-11 07:16:50', '2026-05-11 07:16:50', '2026-05-11 07:16:50'),
(4, 7, '720883HFVGRT(A4v)', '睿鋼(M10-18.5X11) 720883HFVGRT.pdf', 'uploads/order_item_drawings/drawing_6a018e326026f6.41751412.pdf', 870654, 'application/pdf', '2026-05-11 08:07:14', '2026-05-11 08:07:14', '2026-05-11 08:07:14');

-- --------------------------------------------------------

--
-- 資料表結構 `order_item_screening_details`
--

CREATE TABLE `order_item_screening_details` (
  `id` bigint(20) NOT NULL COMMENT '明細ID',
  `order_item_id` bigint(20) NOT NULL COMMENT '關聯的訂單品項ID',
  `screening_service_id` bigint(20) NOT NULL COMMENT '關聯的篩分服務ID',
  `service_name` varchar(255) DEFAULT NULL COMMENT '服務名稱（快照）',
  `service_name_en` varchar(255) DEFAULT NULL COMMENT '服務英文名稱',
  `actual_price_per_unit` decimal(14,2) NOT NULL COMMENT '本次報價的實際單價（每支）',
  `tolerance_plus_value` decimal(10,4) DEFAULT NULL COMMENT '篩選公差值(+)',
  `tolerance_plus_over` decimal(10,4) DEFAULT NULL COMMENT '正值(+)',
  `tolerance_minus_value` decimal(10,4) DEFAULT NULL COMMENT '篩選公差值(-)',
  `tolerance_minus_over` decimal(10,4) DEFAULT NULL COMMENT '負值(-)',
  `ppm_standard` int(11) DEFAULT NULL COMMENT 'PPM 標準值',
  `notes` text DEFAULT NULL COMMENT '備註',
  `description` text DEFAULT NULL COMMENT '獨立的服務說明',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='訂單品項篩分明細表';

--
-- 傾印資料表的資料 `order_item_screening_details`
--

INSERT INTO `order_item_screening_details` (`id`, `order_item_id`, `screening_service_id`, `service_name`, `service_name_en`, `actual_price_per_unit`, `tolerance_plus_value`, `tolerance_plus_over`, `tolerance_minus_value`, `tolerance_minus_over`, `ppm_standard`, `notes`, `description`, `created_at`, `updated_at`) VALUES
(40, 1, 1, '頭高', NULL, 9.00, 1.4000, NULL, 1.6000, NULL, 25, NULL, NULL, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(41, 1, 2, '頭寬', NULL, 0.00, 13.8000, NULL, 14.2000, NULL, 25, NULL, NULL, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(42, 1, 3, '頭下長度', NULL, 0.00, 15.6000, NULL, 16.0000, NULL, 25, NULL, NULL, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(43, 1, 5, '牙外徑', NULL, 0.00, 5.1800, NULL, 5.9000, NULL, 25, NULL, NULL, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(44, 1, 6, '有無牙', NULL, 0.00, 0.0000, NULL, 0.0000, NULL, 25, NULL, NULL, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(45, 2, 1, '頭高', NULL, 9.00, 1.4000, NULL, 1.6000, NULL, 25, NULL, NULL, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(46, 2, 2, '頭寬', NULL, 0.00, 13.8000, NULL, 14.2000, NULL, 25, NULL, NULL, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(47, 2, 3, '頭下長度', NULL, 0.00, 15.6000, NULL, 16.0000, NULL, 25, NULL, NULL, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(48, 2, 5, '牙外徑', NULL, 0.00, 5.1800, NULL, 5.9000, NULL, 25, NULL, NULL, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(49, 2, 6, '有無牙', NULL, 0.00, NULL, NULL, 0.0000, NULL, 25, NULL, NULL, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(50, 3, 1, '頭高', NULL, 9.00, 1.4000, NULL, 1.6000, NULL, 25, NULL, NULL, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(51, 3, 2, '頭寬', NULL, 0.00, 13.8000, NULL, 14.2000, NULL, 25, NULL, NULL, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(52, 3, 3, '頭下長度', NULL, 0.00, 15.6000, NULL, 16.0000, NULL, 25, NULL, NULL, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(53, 3, 5, '牙外徑', NULL, 0.00, 5.1800, NULL, 5.9000, NULL, 25, NULL, NULL, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(54, 3, 6, '有無牙', NULL, 0.00, NULL, NULL, 0.0000, NULL, 25, NULL, NULL, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(144, 4, 1, '頭高', NULL, 16.00, 2.1800, NULL, 2.4200, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(145, 4, 2, '頭寬', NULL, 0.00, 5.9200, NULL, 6.5000, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(146, 4, 3, '頭下長度', NULL, 0.00, 9.5500, NULL, 10.4500, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(147, 4, 5, '牙外徑', NULL, 0.00, 3.0000, NULL, 3.1000, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(148, 4, 6, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(149, 4, 7, '混料、雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(150, 4, 8, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(151, 4, 23, '頭下第一牙', NULL, 5.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(152, 4, 14, '節距', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(153, 4, 15, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(154, 4, 17, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(155, 5, 1, '頭高', NULL, 16.00, 2.1800, NULL, 2.4200, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(156, 5, 2, '頭寬', NULL, 0.00, 5.9200, NULL, 6.5000, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(157, 5, 3, '頭下長度', NULL, 0.00, 9.5500, NULL, 10.4500, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(158, 5, 5, '牙外徑', NULL, 0.00, 3.0000, NULL, 3.1000, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(159, 5, 6, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(160, 5, 7, '混料、雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(161, 5, 8, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(162, 5, 23, '頭下第一牙', NULL, 5.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(163, 5, 14, '節距', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(164, 5, 15, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(165, 5, 17, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(237, 8, 44, '外徑', NULL, 20.00, 17.9800, NULL, 18.5000, NULL, 50, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(238, 8, 45, '總厚度', NULL, 0.00, 10.6400, NULL, 11.0000, NULL, 50, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(239, 8, 45, '焊點厚度', NULL, 0.00, 1.0000, NULL, 1.2000, NULL, 50, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(240, 8, 46, '內孔徑', NULL, 0.00, 8.4080, NULL, 8.6760, NULL, 50, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(241, 8, 6, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(242, 8, 7, '混料、雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 1, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(243, 8, 47, '毛邊、孔內異物', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(244, 6, 44, '外徑', NULL, 20.00, 17.9800, NULL, 18.5000, NULL, 50, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(245, 6, 45, '總厚度', NULL, 0.00, 11.6400, NULL, 12.2000, NULL, 50, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(246, 6, 46, '內孔徑', NULL, 0.00, 8.4080, NULL, 8.6760, NULL, 50, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(247, 6, 6, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(248, 6, 7, '混料、雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(249, 6, 47, '毛邊、孔內異物', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(250, 7, 44, '外徑', NULL, 20.00, 17.9800, NULL, 18.5000, NULL, 50, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27'),
(251, 7, 45, '總厚度', NULL, 0.00, 11.6400, NULL, 12.2000, NULL, 50, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27'),
(252, 7, 46, '內孔徑', NULL, 0.00, 8.4080, NULL, 8.6760, NULL, 50, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27'),
(253, 7, 6, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27'),
(254, 7, 7, '混料、雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27'),
(255, 7, 47, '毛邊、孔內異物', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-11 08:46:27', '2026-05-11 08:46:27');

-- --------------------------------------------------------

--
-- 資料表結構 `order_item_tools`
--

CREATE TABLE `order_item_tools` (
  `id` bigint(20) NOT NULL,
  `order_item_id` bigint(20) NOT NULL COMMENT '關聯的訂單品項ID',
  `tool_id` bigint(20) NOT NULL COMMENT '關聯的載具ID',
  `tool_type` varchar(50) DEFAULT NULL COMMENT '載具類型(冗餘快照,方便統計)',
  `quantity` decimal(10,2) NOT NULL COMMENT '該載具的數量',
  `total_weight` decimal(10,2) DEFAULT 0.00 COMMENT '載具總重量',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='訂單品項載具表';

--
-- 傾印資料表的資料 `order_item_tools`
--

INSERT INTO `order_item_tools` (`id`, `order_item_id`, `tool_id`, `tool_type`, `quantity`, `total_weight`, `created_at`, `updated_at`) VALUES
(3, 1, 1, '船', 3.00, 171.00, '2026-05-07 06:12:49', '2026-05-07 06:12:49'),
(4, 2, 1, '船', 3.00, 171.00, '2026-05-07 06:58:33', '2026-05-07 06:58:33'),
(5, 3, 1, '船', 4.00, 228.00, '2026-05-07 08:00:09', '2026-05-07 08:00:09'),
(12, 4, 3, '船', 1.00, 59.00, '2026-05-08 03:45:24', '2026-05-08 03:45:24'),
(13, 5, 3, '船', 1.00, 59.00, '2026-05-08 03:45:28', '2026-05-08 03:45:28'),
(19, 8, 4, '10KG 圓', 6.00, 60.00, '2026-05-11 08:40:18', '2026-05-11 08:40:18'),
(20, 6, 4, '10KG 圓', 6.00, 60.00, '2026-05-11 08:46:17', '2026-05-11 08:46:17'),
(21, 7, 4, '10KG 圓', 8.00, 80.00, '2026-05-11 08:46:27', '2026-05-11 08:46:27');

-- --------------------------------------------------------

--
-- 資料表結構 `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT '權限名稱',
  `description` varchar(255) DEFAULT NULL COMMENT '權限描述',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'manage_companies', '管理公司資料', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(2, 'manage_customers', '管理客戶資料', '2025-08-11 14:32:07', '2025-08-11 14:32:07'),
(3, 'manage_suppliers', '管理供應商資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(4, 'manage_departments', '管理部門資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(5, 'manage_employees', '管理員工資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(6, 'manage_machines', '管理機台資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(7, 'manage_tools', '管理載具資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(8, 'manage_screening_items', '管理受篩產品規格', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(9, 'manage_screening_services', '管理篩分服務項目', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(10, 'manage_orders', '管理訂單資料', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(11, 'manage_work_orders', '管理生產工單', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(12, 'manage_production_records', '管理生產紀錄', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(13, 'manage_shipping_orders', '管理出貨單', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(14, 'manage_return_orders', '管理退貨單', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(15, 'manage_daily_inspections', '管理每日機台巡檢', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(16, 'manage_production_quality', '管理生產品質檢驗', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(17, 'manage_shipping_quality', '管理出貨品質檢驗', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(18, 'manage_quality_issues', '管理品質異常處理', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(19, 'manage_roles', '管理角色', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(20, 'manage_permissions', '管理權限', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(21, 'manage_system_parameters', '管理系統參數', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(22, 'view_audit_logs', '查看操作日誌', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(23, 'manage_calendar_events', '管理行事曆事件', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(24, 'manage_inventory', '管理庫存', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(25, 'manage_maintenance_tasks', '管理機台維修任務', '2025-08-17 12:54:37', '2025-08-17 12:54:37'),
(26, 'view_reports', '查看報表', '2025-08-17 12:54:37', '2025-08-17 12:54:37');

-- --------------------------------------------------------

--
-- 資料表結構 `production_quality_records`
--

CREATE TABLE `production_quality_records` (
  `id` bigint(20) NOT NULL,
  `production_record_id` bigint(20) NOT NULL COMMENT '生產紀錄ID',
  `inspection_datetime` datetime NOT NULL COMMENT '檢驗時間',
  `inspector_id` bigint(20) NOT NULL COMMENT '檢驗員工ID',
  `sample_quantity_pcs` int(11) NOT NULL COMMENT '抽樣數量(件)',
  `defective_quantity_pcs` int(11) NOT NULL COMMENT '不良數量(件)',
  `rejection_rate_ppm` decimal(10,3) NOT NULL COMMENT '不良率(ppm)',
  `inspection_result` varchar(50) DEFAULT NULL COMMENT '檢驗結果',
  `rework_needed` tinyint(1) NOT NULL COMMENT '是否需要重工(0:否,1:是)',
  `notes` text DEFAULT NULL COMMENT '檢驗備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `production_records`
--

CREATE TABLE `production_records` (
  `id` bigint(20) NOT NULL,
  `work_order_id` bigint(20) NOT NULL COMMENT '工單ID',
  `card_number` varchar(50) DEFAULT NULL COMMENT '卡號(目標支數)',
  `weight_kg` decimal(10,2) DEFAULT NULL COMMENT '重量(含載具,kg)',
  `production_date` date DEFAULT NULL COMMENT '生產日期',
  `production_time` time DEFAULT NULL COMMENT '生產時間',
  `machine_id` bigint(20) DEFAULT NULL COMMENT '機台編號',
  `machine_type` varchar(100) DEFAULT NULL COMMENT '機台種類(冗餘欄位)',
  `employee_id` bigint(20) NOT NULL COMMENT '登錄者ID',
  `notes` text DEFAULT NULL COMMENT '生產備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='生產紀錄表';

--
-- 傾印資料表的資料 `production_records`
--

INSERT INTO `production_records` (`id`, `work_order_id`, `card_number`, `weight_kg`, `production_date`, `production_time`, `machine_id`, `machine_type`, `employee_id`, `notes`, `created_at`, `updated_at`) VALUES
(8, 2, '485714.29', 399.00, '2026-04-30', '17:28:00', NULL, '', 10, '399-59', '2026-05-08 03:43:43', '2026-05-08 03:43:43'),
(12, 1, '571428.57', 459.00, '2026-05-04', '14:20:00', NULL, '', 10, '247-59 + 271-59', '2026-05-08 03:50:17', '2026-05-08 03:50:17'),
(47, 4, '19330', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(48, 4, '38660', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(49, 4, '57990', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(50, 4, '77320', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(51, 4, '96650', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(52, 4, '115980', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(53, 4, '135310', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(54, 4, '154639.18', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:39:58', '2026-05-11 08:39:58'),
(55, 3, '20437', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02'),
(56, 3, '40874', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02'),
(57, 3, '61311', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02'),
(58, 3, '81748', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02'),
(59, 3, '102185', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02'),
(60, 3, '122619.77', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-11 08:40:02', '2026-05-11 08:40:02');

-- --------------------------------------------------------

--
-- 資料表結構 `quality_issue_reports`
--

CREATE TABLE `quality_issue_reports` (
  `id` bigint(20) NOT NULL,
  `report_datetime` datetime NOT NULL COMMENT '報告時間',
  `reported_by_employee_id` bigint(20) NOT NULL COMMENT '報告者員工ID',
  `issue_source_type` varchar(50) NOT NULL COMMENT '異常來源類型',
  `issue_source_id` bigint(20) DEFAULT NULL COMMENT '異常來源ID',
  `issue_description` text NOT NULL COMMENT '異常描述',
  `root_cause_analysis` text DEFAULT NULL COMMENT '根本原因分析',
  `corrective_actions` text DEFAULT NULL COMMENT '矯正措施',
  `preventive_actions` text DEFAULT NULL COMMENT '預防措施',
  `responsible_department_id` bigint(20) DEFAULT NULL COMMENT '負責部門ID',
  `status` varchar(50) DEFAULT NULL COMMENT '處理狀態',
  `completion_date` datetime DEFAULT NULL COMMENT '完成日期',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `report_descriptions`
--

CREATE TABLE `report_descriptions` (
  `id` int(11) NOT NULL,
  `report_code` varchar(50) NOT NULL COMMENT '報表代碼',
  `report_name` varchar(100) NOT NULL COMMENT '報表名稱',
  `report_name_en` varchar(100) DEFAULT NULL COMMENT '報表英文名稱',
  `description` text DEFAULT NULL COMMENT '報表說明內容',
  `description_en` text DEFAULT NULL COMMENT '報表說明英文內容',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='列印報表說明';

-- --------------------------------------------------------

--
-- 資料表結構 `return_orders`
--

CREATE TABLE `return_orders` (
  `id` bigint(20) NOT NULL,
  `return_order_number` varchar(50) NOT NULL COMMENT '退貨單號',
  `original_shipping_order_id` bigint(20) DEFAULT NULL COMMENT '原出貨單ID',
  `customer_id` bigint(20) NOT NULL COMMENT '客戶ID',
  `return_date` date NOT NULL COMMENT '退貨日期',
  `return_reason` text DEFAULT NULL COMMENT '退貨原因',
  `processing_status` varchar(50) DEFAULT NULL COMMENT '處理狀態',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '處理狀態(關聯LookupValues)',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `return_order_items`
--

CREATE TABLE `return_order_items` (
  `id` bigint(20) NOT NULL,
  `return_order_id` bigint(20) NOT NULL COMMENT '退貨單ID',
  `shipping_order_item_id` bigint(20) NOT NULL COMMENT '出貨單明細ID',
  `returned_quantity` decimal(14,2) NOT NULL COMMENT '退貨數量',
  `returned_unit` varchar(50) DEFAULT NULL COMMENT '退貨單位',
  `reason` varchar(255) DEFAULT NULL COMMENT '退貨原因',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'admin', '系統管理員', '2025-08-11 14:32:07', '2025-08-11 14:32:07');

-- --------------------------------------------------------

--
-- 資料表結構 `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` bigint(20) NOT NULL COMMENT '角色ID',
  `permission_id` bigint(20) NOT NULL COMMENT '權限ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26);

-- --------------------------------------------------------

--
-- 資料表結構 `screening_items`
--

CREATE TABLE `screening_items` (
  `id` bigint(20) NOT NULL COMMENT '產品ID',
  `item_number` varchar(50) DEFAULT NULL COMMENT '產品料號',
  `name` varchar(255) NOT NULL COMMENT '產品規格描述（如 M3-1.5x13.5）',
  `material` varchar(50) DEFAULT NULL COMMENT '材質（如 鋼、不銹鋼）',
  `thread_type` varchar(50) DEFAULT NULL COMMENT '螺紋類型（如 公制、英制）',
  `weight_per_unit_g` decimal(10,2) NOT NULL COMMENT '單支重量（克）',
  `unit_price` decimal(10,2) DEFAULT NULL COMMENT '單價 (元/M)',
  `unit` varchar(50) DEFAULT 'pcs' COMMENT '計量單位（使用 LookupValues，如 pcs）',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='V4.2 受篩產品規格表';

--
-- 傾印資料表的資料 `screening_items`
--

INSERT INTO `screening_items` (`id`, `item_number`, `name`, `material`, `thread_type`, `weight_per_unit_g`, `unit_price`, `unit`, `notes`, `created_at`, `updated_at`) VALUES
(1, 'S003691', 'M6-1.0X16', NULL, NULL, 4.17, 15.00, 'pcs', NULL, '2026-05-07 05:49:43', '2026-05-07 05:49:43'),
(3, 'B226037', 'M3-1.12X10', NULL, NULL, 1.00, 16.00, 'pcs', '頭下第一牙', '2026-05-08 02:53:18', '2026-05-08 04:07:41'),
(4, '720883HFVGRT', 'M10X18.5X11', NULL, NULL, 16.49, 20.00, 'pcs', '圓形焊圈帽\n完工換蓁豪桶', '2026-05-11 07:06:55', '2026-05-11 07:06:55');

-- --------------------------------------------------------

--
-- 資料表結構 `screening_services`
--

CREATE TABLE `screening_services` (
  `id` bigint(20) NOT NULL COMMENT '服務ID',
  `service_number` varchar(50) DEFAULT NULL COMMENT '服務編號',
  `name` varchar(255) NOT NULL COMMENT '服務名稱（如 頭部同心度檢測）',
  `name_en` varchar(255) DEFAULT NULL COMMENT '英文名稱',
  `category` varchar(100) DEFAULT NULL COMMENT '服務類別（如 一般全檢, 特殊加選）',
  `description` text DEFAULT NULL COMMENT '服務內容描述',
  `default_price_per_unit` decimal(14,2) NOT NULL COMMENT '預設單價（每支）',
  `tolerance_plus_value` decimal(10,4) DEFAULT NULL COMMENT '篩選公差值(+)',
  `tolerance_plus_over` decimal(10,4) DEFAULT NULL COMMENT '正值(+)',
  `tolerance_minus_value` decimal(10,4) DEFAULT NULL COMMENT '篩選公差值(-)',
  `tolerance_minus_over` decimal(10,4) DEFAULT NULL COMMENT '負值(-)',
  `ppm_standard` int(11) DEFAULT NULL COMMENT 'PPM 標準值',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用 (1:啟用, 0:停用)',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='篩分服務項目主列表';

--
-- 傾印資料表的資料 `screening_services`
--

INSERT INTO `screening_services` (`id`, `service_number`, `name`, `name_en`, `category`, `description`, `default_price_per_unit`, `tolerance_plus_value`, `tolerance_plus_over`, `tolerance_minus_value`, `tolerance_minus_over`, `ppm_standard`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SV-S-001', '頭高', 'Thickness of Head', NULL, NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:33:36', '2026-05-07 04:33:36'),
(2, 'SV-S-002', '頭寬', 'Diameter of Head', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:34:02', '2026-05-07 04:34:02'),
(3, 'SV-S-003', '頭下長度', 'Length under Head', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:34:23', '2026-05-07 04:34:23'),
(4, 'SV-S-004', '總長度', 'Length', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:34:44', '2026-05-07 04:34:44'),
(5, 'SV-S-005', '牙外徑', 'Major Diameter of Thread', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:35:04', '2026-05-07 04:35:04'),
(6, 'SV-S-006', '有無牙', 'With Thread', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:35:50', '2026-05-07 05:13:09'),
(7, 'SV-T-001', '混料、雜質', 'lmpurity、Mixed', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 0, 1, '2026-05-07 04:36:39', '2026-05-07 04:36:39'),
(8, 'SV-S-007', '有無針孔', 'With Screw Recess', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:37:01', '2026-05-07 05:13:03'),
(9, 'SV-S-008', '頭裂', 'Head Crack', '特殊加選', NULL, 10.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:38:13', '2026-05-07 04:38:46'),
(10, 'SV-S-009', '側裂', 'Head Crack', '特殊加選', NULL, 10.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:38:39', '2026-05-07 04:38:39'),
(11, 'SV-S-011', '真圓度', 'Roundness', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:39:22', '2026-05-07 04:39:22'),
(12, 'SV-S-012', '跳牙', 'Pitch、Cross Thread、Thread Quality', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:41:25', '2026-05-07 04:41:25'),
(14, 'SV-S-013', '節距', 'Pitch', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:41:53', '2026-05-07 04:41:53'),
(15, 'SV-S-014', '斜牙', 'Cross Thread', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:42:22', '2026-05-07 04:42:22'),
(17, 'SV-S-015', '牙品質', 'Thread Quality', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:42:52', '2026-05-07 04:42:52'),
(18, 'SV-S-016', '桿長', 'Body Legth', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:43:45', '2026-05-07 04:43:45'),
(19, 'SV-S-017', '桿徑', 'Body Diameter', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:44:08', '2026-05-07 04:44:08'),
(20, 'SV-S-018', '狗尾徑', 'Point Diameter', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:44:31', '2026-05-07 04:44:31'),
(21, 'SV-S-019', '有無狗尾', 'With Dog Point', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:44:56', '2026-05-07 04:44:56'),
(23, 'SV-S-020', '頭下第一牙', 'First  Thread', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:45:43', '2026-05-07 04:45:43'),
(24, 'SV-T-002', '有無直齒', 'with Straight Toothed', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:46:32', '2026-05-07 04:53:47'),
(25, 'SV-S-021', '華司徑', 'Washer Diameter', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:47:10', '2026-05-07 04:47:10'),
(26, 'SV-S-022', '華司厚', 'Washer Thickness', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:47:42', '2026-05-07 04:47:50'),
(27, 'SV-T-003', '有無焊點', 'With Welding', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:48:28', '2026-05-07 04:48:28'),
(28, 'SV-S-024', '偏心', 'Concentricity', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:49:13', '2026-05-07 04:49:13'),
(29, 'SV-S-025', '華司正反面', 'Washer Orientation Check', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:51:10', '2026-05-07 04:51:10'),
(30, 'SV-S-026', '對邊', 'Width Across Flats', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:51:59', '2026-05-07 04:51:59'),
(31, 'SV-S-027', '對角', 'Across Corners', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:52:40', '2026-05-07 04:53:26'),
(34, 'SV-S-028', '牙底徑', 'Minor Diameter', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:55:48', '2026-05-07 04:55:48'),
(35, 'SV-S-029', '上桿徑', 'Upper Body Diameter', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:56:23', '2026-05-07 04:56:23'),
(36, 'SV-S-030', '上段長', 'Length of Upper Body', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:56:50', '2026-05-07 04:56:50'),
(38, 'SV-S-031', '下桿徑', 'Lower Body Diameter', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:57:17', '2026-05-07 04:57:17'),
(39, 'SV-S-032', '下桿長', 'Length of Lower  Body', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 04:57:48', '2026-05-07 04:57:48'),
(41, 'SV-S-033', '合BIT', 'Bit Fitment Check', '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 05:00:31', '2026-05-07 05:00:31'),
(43, 'SV-S-034', '六角厚度', 'Hex Thickness', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-07 05:10:02', '2026-05-07 05:10:02'),
(44, 'SV-N-001', '外徑', 'Diameter', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-11 06:46:42', '2026-05-11 06:46:42'),
(45, 'SV-N-002', '厚度', 'Thickness', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-11 06:47:13', '2026-05-11 06:47:13'),
(46, 'SV-N-003', '內孔徑', 'Hole Diameter', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-11 06:48:38', '2026-05-11 06:48:38'),
(47, 'SV-N-004', '毛邊、孔內異物', 'Burrs / Chips', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-05-11 06:49:28', '2026-05-11 06:49:28');

-- --------------------------------------------------------

--
-- 資料表結構 `shipping_orders`
--

CREATE TABLE `shipping_orders` (
  `id` bigint(20) NOT NULL,
  `shipping_order_number` varchar(50) NOT NULL COMMENT '出貨單號',
  `order_id` bigint(20) DEFAULT NULL,
  `customer_id` bigint(20) DEFAULT NULL,
  `shipping_date` date NOT NULL COMMENT '出貨日期',
  `delivery_method` varchar(100) DEFAULT NULL COMMENT '配送方式',
  `tracking_number` varchar(100) DEFAULT NULL COMMENT '追蹤號碼',
  `consignee_name` varchar(100) DEFAULT NULL COMMENT '收貨人姓名',
  `consignee_address` text DEFAULT NULL COMMENT '收貨地址',
  `carrier` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL COMMENT '出貨狀態',
  `return_status` enum('none','partial','full') NOT NULL DEFAULT 'none' COMMENT '??疏???: none=?⊿?鞎? partial=?典???疏, full=?券???疏',
  `has_return` tinyint(1) NOT NULL DEFAULT 0 COMMENT '?臬????鞎刻????敹恍?蝭拚??剁?',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '出貨狀態(關聯LookupValues)',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `shipping_orders`
--

INSERT INTO `shipping_orders` (`id`, `shipping_order_number`, `order_id`, `customer_id`, `shipping_date`, `delivery_method`, `tracking_number`, `consignee_name`, `consignee_address`, `carrier`, `status`, `return_status`, `has_return`, `status_lookup_id`, `notes`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(17784684333785, 'SO-20260511-0001', NULL, 52, '2026-05-11', 'pickup', NULL, NULL, NULL, NULL, 'draft', 'none', 0, NULL, NULL, '2026-05-11 03:00:32', '2026-05-11 03:00:32', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `shipping_order_items`
--

CREATE TABLE `shipping_order_items` (
  `id` bigint(20) NOT NULL,
  `shipping_order_id` bigint(20) NOT NULL COMMENT '出貨單ID',
  `order_item_id` bigint(20) NOT NULL COMMENT '訂單品項ID',
  `inventory_item_id` bigint(20) DEFAULT NULL,
  `shipped_quantity` decimal(14,2) NOT NULL COMMENT '出貨數量',
  `shipped_unit` varchar(50) DEFAULT NULL COMMENT '出貨單位',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `shipping_quality_inspections`
--

CREATE TABLE `shipping_quality_inspections` (
  `id` bigint(20) NOT NULL,
  `shipping_order_id` bigint(20) NOT NULL COMMENT '出貨單ID',
  `inspection_datetime` datetime NOT NULL COMMENT '檢驗時間',
  `inspector_id` bigint(20) NOT NULL COMMENT '檢驗員工ID',
  `sample_quantity_pcs` int(11) NOT NULL COMMENT '抽樣數量(件)',
  `defective_quantity_pcs` int(11) NOT NULL COMMENT '不良數量(件)',
  `rejection_rate_ppm` decimal(10,3) NOT NULL COMMENT '不良率(ppm)',
  `inspection_result` varchar(50) DEFAULT NULL COMMENT '檢驗結果',
  `notes` text DEFAULT NULL COMMENT '檢驗備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `suppliers`
--

CREATE TABLE `suppliers` (
  `id` bigint(20) NOT NULL,
  `supplier_number` varchar(50) NOT NULL COMMENT '供應商編號',
  `name` varchar(255) NOT NULL COMMENT '供應商名稱',
  `service_type` varchar(100) DEFAULT NULL COMMENT '服務類型',
  `contact_person` varchar(100) DEFAULT NULL COMMENT '聯絡人',
  `phone` varchar(50) DEFAULT NULL COMMENT '電話',
  `email` varchar(100) DEFAULT NULL COMMENT '電子郵件',
  `address` text DEFAULT NULL COMMENT '地址',
  `supplier_type` varchar(100) DEFAULT NULL COMMENT '供應商性質',
  `tax_id` varchar(50) DEFAULT NULL COMMENT '統一編號',
  `owner` varchar(100) DEFAULT NULL COMMENT '負責人',
  `contact_mobile` varchar(50) DEFAULT NULL COMMENT '聯絡人手機',
  `fax` varchar(50) DEFAULT NULL COMMENT '傳真',
  `factory_address` text DEFAULT NULL COMMENT '工廠住址',
  `product_category` varchar(100) DEFAULT NULL COMMENT '供應產品別',
  `bank_account_name` varchar(100) DEFAULT NULL COMMENT '匯款戶名',
  `bank_name` varchar(100) DEFAULT NULL COMMENT '銀行名稱',
  `bank_code` varchar(10) DEFAULT NULL COMMENT '銀行代號',
  `bank_branch_name` varchar(100) DEFAULT NULL COMMENT '銀行分行名稱',
  `bank_branch_code` varchar(10) DEFAULT NULL COMMENT '銀行分行代號',
  `bank_account_number` varchar(50) DEFAULT NULL COMMENT '匯款帳號',
  `payment_method` varchar(100) DEFAULT NULL COMMENT '付款方式',
  `attachment_path` varchar(500) DEFAULT NULL COMMENT '附件路徑',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 資料表結構 `system_notifications`
--

CREATE TABLE `system_notifications` (
  `id` bigint(20) NOT NULL,
  `title` varchar(200) NOT NULL COMMENT '標題',
  `content` text NOT NULL COMMENT '內容',
  `notification_type` enum('announcement','system_alert') NOT NULL DEFAULT 'announcement' COMMENT '類型：announcement=公告, system_alert=系統警示',
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal' COMMENT '優先級',
  `target_type` enum('all','department','role','user') DEFAULT 'all' COMMENT '目標類型',
  `target_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '目標ID清單（部門/角色/使用者）',
  `related_module` varchar(50) DEFAULT NULL COMMENT '關聯模組',
  `related_id` bigint(20) DEFAULT NULL COMMENT '關聯資料ID',
  `created_by` bigint(20) DEFAULT NULL COMMENT '建立者（系統自動為NULL）',
  `expires_at` datetime DEFAULT NULL COMMENT '過期時間',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用',
  `status` enum('draft','published') NOT NULL DEFAULT 'published' COMMENT '???嚗?raft=??阮, published=撌脩?撣',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- 資料表結構 `system_parameters`
--

CREATE TABLE `system_parameters` (
  `id` bigint(20) NOT NULL,
  `param_key` varchar(100) NOT NULL COMMENT '參數鍵值',
  `param_value` text NOT NULL COMMENT '參數值',
  `description` varchar(255) DEFAULT NULL COMMENT '參數描述',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `system_parameters`
--

INSERT INTO `system_parameters` (`id`, `param_key`, `param_value`, `description`, `created_at`, `updated_at`) VALUES
(1, 'REPORT_EXTERNAL_URL', 'https://report.your-company.com', 'QR Code 報表外部網址（客戶掃描後連結到的網站）', '2026-02-02 08:39:37', '2026-02-02 08:39:37'),
(2, 'REPORT_EXPORT_PATH', 'export/qrcode_pages', 'QR Code 靜態頁面本地匯出路徑', '2026-02-02 08:39:37', '2026-02-02 08:39:37'),
(3, 'REPORT_AUTO_GENERATE', '1', '列印報表時是否自動產生 QR Code 靜態頁面（1=是, 0=否）', '2026-02-02 08:39:37', '2026-02-02 08:39:37'),
(4, 'COMPANY_SHORT_NAME', '裕全', '公司簡稱（用於報表顯示）', '2026-02-02 08:39:37', '2026-02-02 08:39:37'),
(5, 'security.auto_refresh.enabled', '1', '版本更新偵測', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(6, 'security.auto_refresh.interval_minutes', '60', '版本檢查間隔（分鐘）', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(7, 'security.auto_logout.enabled', '0', '閒置自動登出', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(8, 'security.auto_logout.idle_minutes', '480', '閒置逾時（分鐘）', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(9, 'security.auto_logout.warning_seconds', '100', '登出前警告秒數', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(10, 'security.lockout.enabled', '0', '登入失敗鎖定', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(11, 'security.lockout.max_attempts', '5', '最大失敗次數', '2026-03-03 14:41:57', '2026-05-08 01:09:42'),
(12, 'security.lockout.window_minutes', '15', '鎖定時間窗口（分鐘）', '2026-03-03 14:41:57', '2026-05-08 01:09:42');

-- --------------------------------------------------------

--
-- 資料表結構 `tools`
--

CREATE TABLE `tools` (
  `id` bigint(20) NOT NULL,
  `tool_number` varchar(50) NOT NULL COMMENT '載具編號',
  `name` varchar(100) NOT NULL COMMENT '載具名稱',
  `type` varchar(50) DEFAULT NULL COMMENT '載具類型',
  `status` varchar(50) DEFAULT NULL COMMENT '狀態',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '狀態(關聯LookupValues)',
  `current_location` varchar(100) DEFAULT NULL COMMENT '目前位置',
  `weight_kg` decimal(10,2) NOT NULL COMMENT '載具實際重量（公斤）',
  `capacity_kg` decimal(10,2) DEFAULT NULL COMMENT '載具最大承重（公斤）',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- 傾印資料表的資料 `tools`
--

INSERT INTO `tools` (`id`, `tool_number`, `name`, `type`, `status`, `status_lookup_id`, `current_location`, `weight_kg`, `capacity_kg`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'DD-004', '57KG', '船', 'available', 19, NULL, 57.00, NULL, '2026-05-07 06:00:00', '2026-05-11 07:17:20', NULL, 0),
(2, 'DD-002', '40KG', '船', 'available', 19, NULL, 40.00, NULL, '2026-05-07 06:00:27', '2026-05-11 07:17:04', NULL, 0),
(3, 'DD-003', '59KG', '船', 'available', 19, NULL, 59.00, NULL, '2026-05-08 02:55:18', '2026-05-11 07:17:09', NULL, 0),
(4, 'DD-001', '圓桶', '10KG 圓', 'available', NULL, NULL, 10.00, NULL, '2026-05-11 07:17:43', '2026-05-11 07:17:43', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `user_messages`
--

CREATE TABLE `user_messages` (
  `id` bigint(20) NOT NULL,
  `sender_id` bigint(20) NOT NULL COMMENT '發送者',
  `subject` varchar(200) NOT NULL COMMENT '主旨',
  `content` text DEFAULT NULL COMMENT '????批捆(?舀?HTML)',
  `reply_to_id` bigint(20) DEFAULT NULL COMMENT '回覆哪則留言',
  `send_to_all` tinyint(1) NOT NULL DEFAULT 0 COMMENT '?臬??潮?蝯血?擃??撌',
  `status` enum('draft','sent') NOT NULL DEFAULT 'sent' COMMENT '???嚗?raft=??阮, sent=撌脩??',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sender_deleted_at` datetime DEFAULT NULL COMMENT '寄件者刪除時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='使用者留言表';

-- --------------------------------------------------------

--
-- 資料表結構 `work_orders`
--

CREATE TABLE `work_orders` (
  `id` bigint(20) NOT NULL,
  `work_order_number` varchar(50) NOT NULL COMMENT '工單號碼',
  `order_item_id` bigint(20) NOT NULL COMMENT '訂單品項ID',
  `machine_id` bigint(20) DEFAULT NULL COMMENT '指定機台ID',
  `assigned_employee_id` bigint(20) DEFAULT NULL COMMENT '指定員工ID',
  `scheduled_start_date` datetime DEFAULT NULL COMMENT '預定開始日期',
  `scheduled_end_date` datetime DEFAULT NULL COMMENT '預定結束日期',
  `actual_start_date` datetime DEFAULT NULL COMMENT '實際開始日期',
  `actual_end_date` datetime DEFAULT NULL COMMENT '實際結束日期',
  `quantity_to_produce` decimal(14,2) DEFAULT NULL COMMENT '生產數量',
  `total_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '入貨重量(淨重) kg',
  `weight_per_unit_g` decimal(10,3) DEFAULT NULL COMMENT '產品單支重 g',
  `total_units` decimal(14,2) DEFAULT NULL COMMENT '總支數',
  `tool_statistics` text DEFAULT NULL COMMENT '載具類型統計(桶數)',
  `screening_speed` varchar(50) DEFAULT NULL COMMENT '篩選速度',
  `calibration_employee_id` bigint(20) DEFAULT NULL COMMENT '校機人員ID',
  `customer_instructions` text DEFAULT NULL COMMENT '客戶交辦事項',
  `other_notes` text DEFAULT NULL COMMENT '其他說明備註',
  `status` varchar(50) DEFAULT NULL COMMENT '工單狀態',
  `status_lookup_id` bigint(20) DEFAULT NULL COMMENT '工單狀態(關聯LookupValues)',
  `is_printed` tinyint(1) DEFAULT 0 COMMENT '是否已列印',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `delete_token` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='生產工單表';

--
-- 傾印資料表的資料 `work_orders`
--

INSERT INTO `work_orders` (`id`, `work_order_number`, `order_item_id`, `machine_id`, `assigned_employee_id`, `scheduled_start_date`, `scheduled_end_date`, `actual_start_date`, `actual_end_date`, `quantity_to_produce`, `total_weight_kg`, `weight_per_unit_g`, `total_units`, `tool_statistics`, `screening_speed`, `calibration_employee_id`, `customer_instructions`, `other_notes`, `status`, `status_lookup_id`, `is_printed`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'WO-20260508-0001', 4, NULL, NULL, NULL, NULL, '2026-04-30 17:34:00', NULL, NULL, NULL, NULL, NULL, NULL, '220*99%', NULL, '單重4位數', NULL, NULL, 28, 0, '2026-05-08 03:05:17', '2026-05-08 03:06:34', NULL, 0),
(2, 'WO-20260508-0002', 5, NULL, NULL, NULL, '2026-04-30 13:20:00', '2026-04-28 13:20:00', '2026-04-30 17:28:00', 13365.00, NULL, NULL, NULL, NULL, '225*99%', NULL, '單重小數點4位數\n0.6978', NULL, NULL, 28, 0, '2026-05-08 03:08:48', '2026-05-08 03:10:34', NULL, 0),
(3, 'WO-20260511-0001', 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '完工換船桶\n良品出蓁豪，不良品出送回睿鋼', NULL, NULL, 25, 1, '2026-05-11 08:02:04', '2026-05-11 08:40:02', NULL, 0),
(4, 'WO-20260511-0002', 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '良品出蓁豪，不良品回睿鋼\n完工裝船桶', NULL, NULL, 25, 1, '2026-05-11 08:05:12', '2026-05-11 08:39:58', NULL, 0);

-- --------------------------------------------------------

--
-- 資料表結構 `work_order_first_piece_dimensions`
--

CREATE TABLE `work_order_first_piece_dimensions` (
  `id` bigint(20) NOT NULL,
  `work_order_id` bigint(20) NOT NULL COMMENT '工單ID',
  `head_height` decimal(10,4) DEFAULT NULL COMMENT '頭高(mm)',
  `head_width` decimal(10,4) DEFAULT NULL COMMENT '頭寬(mm)',
  `length` decimal(10,4) DEFAULT NULL COMMENT '長度(mm)',
  `thread_outer_diameter` decimal(10,4) DEFAULT NULL COMMENT '牙外徑(mm)',
  `washer_diameter` decimal(10,4) DEFAULT NULL COMMENT '華司徑(mm)',
  `outer_diameter` decimal(10,4) DEFAULT NULL COMMENT '外徑(mm)',
  `hole_diameter` decimal(10,4) DEFAULT NULL COMMENT '孔徑(mm)',
  `thickness` decimal(10,4) DEFAULT NULL COMMENT '厚度(mm)',
  `measured_at` datetime DEFAULT current_timestamp() COMMENT '測量時間',
  `measured_by_employee_id` bigint(20) DEFAULT NULL COMMENT '測量人員ID',
  `notes` varchar(255) DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT '建立時間',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '更新時間'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單首件尺寸檢驗記錄';

--
-- 傾印資料表的資料 `work_order_first_piece_dimensions`
--

INSERT INTO `work_order_first_piece_dimensions` (`id`, `work_order_id`, `head_height`, `head_width`, `length`, `thread_outer_diameter`, `washer_diameter`, `outer_diameter`, `hole_diameter`, `thickness`, `measured_at`, `measured_by_employee_id`, `notes`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 03:05:17', '2026-05-08 03:05:17'),
(2, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-08 03:08:48', '2026-05-08 03:08:48'),
(3, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-11 08:02:04', '2026-05-11 08:02:04'),
(4, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-11 08:05:12', '2026-05-11 08:05:12');

-- --------------------------------------------------------

--
-- 資料表結構 `work_order_images`
--

CREATE TABLE `work_order_images` (
  `id` bigint(20) NOT NULL,
  `work_order_id` bigint(20) NOT NULL COMMENT '工單ID',
  `image_type` varchar(50) DEFAULT 'general' COMMENT '圖片類型(首件/過程/完工)',
  `file_name` varchar(255) NOT NULL COMMENT '檔案名稱',
  `file_path` varchar(500) NOT NULL COMMENT '檔案路徑',
  `file_size` bigint(20) DEFAULT NULL COMMENT '檔案大小(bytes)',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME類型',
  `sort_order` int(11) DEFAULT 0 COMMENT '排序順序',
  `description` text DEFAULT NULL COMMENT '描述',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp() COMMENT '上傳時間',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '刪除時間',
  `uploaded_by_employee_id` bigint(20) DEFAULT NULL COMMENT '上傳人員ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單圖片附件';

-- --------------------------------------------------------

--
-- 資料表結構 `work_order_screening_defects`
--

CREATE TABLE `work_order_screening_defects` (
  `id` bigint(20) NOT NULL,
  `work_order_id` bigint(20) NOT NULL COMMENT '工單ID',
  `screening_service_id` bigint(20) NOT NULL COMMENT '篩分服務ID',
  `service_name` varchar(255) DEFAULT NULL COMMENT '服務名稱(冗余儲存)',
  `defect_quantity` int(11) DEFAULT 0 COMMENT '不良品數量(支數)',
  `recorded_at` timestamp NULL DEFAULT current_timestamp() COMMENT '記錄時間',
  `recorded_by_employee_id` bigint(20) DEFAULT NULL COMMENT '記錄人員ID',
  `notes` text DEFAULT NULL COMMENT '備註'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單篩分服務不良品記錄表';

--
-- 傾印資料表的資料 `work_order_screening_defects`
--

INSERT INTO `work_order_screening_defects` (`id`, `work_order_id`, `screening_service_id`, `service_name`, `defect_quantity`, `recorded_at`, `recorded_by_employee_id`, `notes`) VALUES
(1, 2, 1, '頭高', 14, '2026-05-07 19:43:43', 10, NULL),
(2, 2, 2, '頭寬', 2, '2026-05-07 19:43:43', 10, NULL),
(3, 2, 3, '頭下長度', 2, '2026-05-07 19:43:43', 10, NULL),
(4, 2, 5, '牙外徑', 14, '2026-05-07 19:43:43', 10, NULL),
(5, 2, 23, '頭下第一牙', 60, '2026-05-07 19:43:43', 10, NULL),
(27, 1, 1, '頭高', 516, '2026-05-07 19:50:17', 10, NULL),
(28, 1, 2, '頭寬', 1, '2026-05-07 19:50:17', 10, NULL),
(29, 1, 3, '頭下長度', 11, '2026-05-07 19:50:17', 10, NULL),
(30, 1, 5, '牙外徑', 769, '2026-05-07 19:50:17', 10, NULL),
(31, 1, 23, '頭下第一牙', 578, '2026-05-07 19:50:17', 10, NULL),
(32, 1, 14, '節距', 24, '2026-05-07 19:50:17', 10, NULL),
(33, 1, 15, '斜牙', 213, '2026-05-07 19:50:17', 10, NULL);

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_target_table` (`target_table`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_ip_address` (`ip_address`);

--
-- 資料表索引 `calendar_event_participants`
--
ALTER TABLE `calendar_event_participants`
  ADD PRIMARY KEY (`event_id`,`employee_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- 資料表索引 `calendar_event_reminders`
--
ALTER TABLE `calendar_event_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- 資料表索引 `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_tax_id` (`tax_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- 資料表索引 `company_logos`
--
ALTER TABLE `company_logos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_uploaded_by` (`uploaded_by_employee_id`);

--
-- 資料表索引 `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_customer_number_active` (`customer_number`,`delete_token`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_contact_person` (`contact_person`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_tax_id` (`tax_id`),
  ADD KEY `idx_sales_contact_email` (`sales_contact_email`),
  ADD KEY `idx_finance_contact_email` (`finance_contact_email`),
  ADD KEY `idx_billing_day` (`billing_day`),
  ADD KEY `idx_reconciliation_day` (`reconciliation_day`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- 資料表索引 `daily_machine_inspections`
--
ALTER TABLE `daily_machine_inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `machine_id` (`machine_id`),
  ADD KEY `inspector_id` (`inspector_id`),
  ADD KEY `idx_inspection_date` (`inspection_date`);

--
-- 資料表索引 `daily_machine_inspection_items`
--
ALTER TABLE `daily_machine_inspection_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inspection_id` (`inspection_id`);

--
-- 資料表索引 `dashboard_calendar_events`
--
ALTER TABLE `dashboard_calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by_employee_id` (`created_by_employee_id`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- 資料表索引 `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_department_name_active` (`name`,`delete_token`),
  ADD KEY `idx_parent_department_id` (`parent_department_id`),
  ADD KEY `idx_status_lookup_id` (`status_lookup_id`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_manager_id` (`manager_id`);

--
-- 資料表索引 `domain_event_outbox`
--
ALTER TABLE `domain_event_outbox`
  ADD PRIMARY KEY (`id`);

--
-- 資料表索引 `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_employee_number_active` (`employee_number`,`delete_token`),
  ADD UNIQUE KEY `uk_email_active` (`email`,`delete_token`),
  ADD KEY `idx_account` (`account`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_department_id` (`department_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_status_lookup_id` (`status_lookup_id`);

--
-- 資料表索引 `employee_roles`
--
ALTER TABLE `employee_roles`
  ADD PRIMARY KEY (`employee_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- 資料表索引 `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_inventory_number_active` (`inventory_number`,`delete_token`),
  ADD KEY `idx_work_order_id` (`work_order_id`),
  ADD KEY `idx_order_item_id` (`order_item_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_screening_item_id` (`screening_item_id`),
  ADD KEY `idx_customer_batch_number` (`customer_batch_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_quality_status` (`quality_status`),
  ADD KEY `idx_received_at` (`received_at`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `fk_inventory_inspector` (`inspector_employee_id`),
  ADD KEY `fk_inventory_creator` (`created_by_employee_id`);

--
-- 資料表索引 `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventory_item_id` (`inventory_item_id`),
  ADD KEY `idx_it_order_id` (`order_id`),
  ADD KEY `idx_it_order_item_id` (`order_item_id`),
  ADD KEY `idx_it_work_order_id` (`work_order_id`),
  ADD KEY `idx_it_direction_lookup_id` (`direction_lookup_id`),
  ADD KEY `idx_created_by` (`created_by_employee_id`);

--
-- 資料表索引 `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_time` (`ip_address`,`attempted_at`),
  ADD KEY `idx_cleanup` (`attempted_at`);

--
-- 資料表索引 `lookup_domains`
--
ALTER TABLE `lookup_domains`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `domain_key` (`domain_key`);

--
-- 資料表索引 `lookup_values`
--
ALTER TABLE `lookup_values`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `domain_id` (`domain_id`,`value_key`);

--
-- 資料表索引 `machines`
--
ALTER TABLE `machines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `machine_number` (`machine_number`),
  ADD KEY `Machines_StatusLookup_FK` (`status_lookup_id`),
  ADD KEY `idx_department_id` (`department_id`);

--
-- 資料表索引 `machine_maintenance_tasks`
--
ALTER TABLE `machine_maintenance_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `machine_id` (`machine_id`);

--
-- 資料表索引 `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_message_id` (`message_id`);

--
-- 資料表索引 `message_recipients`
--
ALTER TABLE `message_recipients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_recipient` (`message_id`,`recipient_id`),
  ADD KEY `idx_recipient` (`recipient_id`),
  ADD KEY `idx_message` (`message_id`),
  ADD KEY `idx_read` (`read_at`),
  ADD KEY `idx_deleted` (`deleted_at`);

--
-- 資料表索引 `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_read` (`notification_id`,`user_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_notification` (`notification_id`);

--
-- 資料表索引 `number_sequences`
--
ALTER TABLE `number_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seq_key_date` (`seq_key`,`date_scope`);

--
-- 資料表索引 `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_order_number_active` (`order_number`,`delete_token`),
  ADD KEY `Orders_StatusLookup_FK` (`status_lookup_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_order_date` (`order_date`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_orders_dashboard` (`deleted_at`,`status`,`order_date`);

--
-- 資料表索引 `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `screening_item_id` (`screening_item_id`);

--
-- 資料表索引 `order_item_attachments`
--
ALTER TABLE `order_item_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_item_id` (`order_item_id`);

--
-- 資料表索引 `order_item_drawings`
--
ALTER TABLE `order_item_drawings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_item_id` (`order_item_id`);

--
-- 資料表索引 `order_item_screening_details`
--
ALTER TABLE `order_item_screening_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_item_id` (`order_item_id`),
  ADD KEY `screening_service_id` (`screening_service_id`);

--
-- 資料表索引 `order_item_tools`
--
ALTER TABLE `order_item_tools`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_item_id` (`order_item_id`),
  ADD KEY `idx_tool_id` (`tool_id`);

--
-- 資料表索引 `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- 資料表索引 `production_quality_records`
--
ALTER TABLE `production_quality_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `production_record_id` (`production_record_id`),
  ADD KEY `idx_inspector_id` (`inspector_id`);

--
-- 資料表索引 `production_records`
--
ALTER TABLE `production_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `machine_id` (`machine_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- 資料表索引 `quality_issue_reports`
--
ALTER TABLE `quality_issue_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reported_by_employee_id` (`reported_by_employee_id`),
  ADD KEY `idx_responsible_dept` (`responsible_department_id`);

--
-- 資料表索引 `report_descriptions`
--
ALTER TABLE `report_descriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `report_code` (`report_code`);

--
-- 資料表索引 `return_orders`
--
ALTER TABLE `return_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_return_order_number_active` (`return_order_number`,`delete_token`),
  ADD KEY `ReturnOrders_StatusLookup_FK` (`status_lookup_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_original_shipping_order_id` (`original_shipping_order_id`),
  ADD KEY `idx_return_date` (`return_date`),
  ADD KEY `idx_return_orders_original_shipping_order_id` (`original_shipping_order_id`);

--
-- 資料表索引 `return_order_items`
--
ALTER TABLE `return_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_return_order_id` (`return_order_id`),
  ADD KEY `idx_shipping_order_item_id` (`shipping_order_item_id`);

--
-- 資料表索引 `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- 資料表索引 `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- 資料表索引 `screening_items`
--
ALTER TABLE `screening_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_number` (`item_number`);

--
-- 資料表索引 `screening_services`
--
ALTER TABLE `screening_services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `service_number` (`service_number`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- 資料表索引 `shipping_orders`
--
ALTER TABLE `shipping_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_shipping_order_number_active` (`shipping_order_number`,`delete_token`),
  ADD KEY `ShippingOrders_StatusLookup_FK` (`status_lookup_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_shipping_date` (`shipping_date`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_shipping_orders_dashboard` (`deleted_at`,`status`,`shipping_date`),
  ADD KEY `idx_shipping_orders_return_status` (`return_status`),
  ADD KEY `idx_shipping_orders_status_has_return` (`status`,`has_return`);

--
-- 資料表索引 `shipping_order_items`
--
ALTER TABLE `shipping_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shipping_order_id` (`shipping_order_id`),
  ADD KEY `idx_inventory_item_id` (`inventory_item_id`),
  ADD KEY `idx_order_item_id` (`order_item_id`);

--
-- 資料表索引 `shipping_quality_inspections`
--
ALTER TABLE `shipping_quality_inspections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shipping_order_id` (`shipping_order_id`),
  ADD KEY `idx_inspector_id` (`inspector_id`);

--
-- 資料表索引 `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_number_active` (`supplier_number`,`delete_token`),
  ADD KEY `idx_tax_id` (`tax_id`),
  ADD KEY `idx_supplier_type` (`supplier_type`),
  ADD KEY `idx_product_category` (`product_category`),
  ADD KEY `idx_bank_code` (`bank_code`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- 資料表索引 `system_notifications`
--
ALTER TABLE `system_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_type` (`notification_type`),
  ADD KEY `idx_target` (`target_type`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_expires` (`expires_at`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by_status` (`created_by`,`status`);

--
-- 資料表索引 `system_parameters`
--
ALTER TABLE `system_parameters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `param_key` (`param_key`);

--
-- 資料表索引 `tools`
--
ALTER TABLE `tools`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_tool_number_active` (`tool_number`,`delete_token`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_current_location` (`current_location`),
  ADD KEY `idx_status_lookup_id` (`status_lookup_id`),
  ADD KEY `idx_tools_deleted_at` (`deleted_at`);

--
-- 資料表索引 `user_messages`
--
ALTER TABLE `user_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_reply` (`reply_to_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sender_status` (`sender_id`,`status`);

--
-- 資料表索引 `work_orders`
--
ALTER TABLE `work_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_work_order_number_active` (`work_order_number`,`delete_token`),
  ADD KEY `WorkOrders_ibfk_1` (`order_item_id`),
  ADD KEY `machine_id` (`machine_id`),
  ADD KEY `assigned_employee_id` (`assigned_employee_id`),
  ADD KEY `calibration_employee_id` (`calibration_employee_id`),
  ADD KEY `status_lookup_id` (`status_lookup_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_deleted_at` (`deleted_at`),
  ADD KEY `idx_scheduled_start_date` (`scheduled_start_date`),
  ADD KEY `idx_work_orders_dashboard` (`deleted_at`,`status`,`scheduled_start_date`);

--
-- 資料表索引 `work_order_first_piece_dimensions`
--
ALTER TABLE `work_order_first_piece_dimensions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `measured_by_employee_id` (`measured_by_employee_id`);

--
-- 資料表索引 `work_order_images`
--
ALTER TABLE `work_order_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `uploaded_by_employee_id` (`uploaded_by_employee_id`);

--
-- 資料表索引 `work_order_screening_defects`
--
ALTER TABLE `work_order_screening_defects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_order_id` (`work_order_id`),
  ADD KEY `screening_service_id` (`screening_service_id`),
  ADD KEY `recorded_by_employee_id` (`recorded_by_employee_id`),
  ADD KEY `idx_recorded_at` (`recorded_at`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `company_logos`
--
ALTER TABLE `company_logos`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `customers`
--
ALTER TABLE `customers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `machines`
--
ALTER TABLE `machines`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `message_attachments`
--
ALTER TABLE `message_attachments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '??辣ID';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `message_recipients`
--
ALTER TABLE `message_recipients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `notification_reads`
--
ALTER TABLE `notification_reads`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '訂單品項ID', AUTO_INCREMENT=9;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_attachments`
--
ALTER TABLE `order_item_attachments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '檔案附件ID';

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_drawings`
--
ALTER TABLE `order_item_drawings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '圖面附件ID', AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_screening_details`
--
ALTER TABLE `order_item_screening_details`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '明細ID', AUTO_INCREMENT=256;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_tools`
--
ALTER TABLE `order_item_tools`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `production_records`
--
ALTER TABLE `production_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `report_descriptions`
--
ALTER TABLE `report_descriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `screening_items`
--
ALTER TABLE `screening_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '產品ID', AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `screening_services`
--
ALTER TABLE `screening_services`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '服務ID', AUTO_INCREMENT=48;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `system_notifications`
--
ALTER TABLE `system_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `tools`
--
ALTER TABLE `tools`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_messages`
--
ALTER TABLE `user_messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_orders`
--
ALTER TABLE `work_orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_first_piece_dimensions`
--
ALTER TABLE `work_order_first_piece_dimensions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_images`
--
ALTER TABLE `work_order_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_screening_defects`
--
ALTER TABLE `work_order_screening_defects`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `AuditLogs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `calendar_event_participants`
--
ALTER TABLE `calendar_event_participants`
  ADD CONSTRAINT `fk_event_participants_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_event_participants_event` FOREIGN KEY (`event_id`) REFERENCES `dashboard_calendar_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `calendar_event_reminders`
--
ALTER TABLE `calendar_event_reminders`
  ADD CONSTRAINT `fk_event_reminders_event` FOREIGN KEY (`event_id`) REFERENCES `dashboard_calendar_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `company_logos`
--
ALTER TABLE `company_logos`
  ADD CONSTRAINT `fk_company_logos_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `daily_machine_inspections`
--
ALTER TABLE `daily_machine_inspections`
  ADD CONSTRAINT `fk_inspections_inspector` FOREIGN KEY (`inspector_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inspections_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `daily_machine_inspection_items`
--
ALTER TABLE `daily_machine_inspection_items`
  ADD CONSTRAINT `fk_inspection_items_inspection` FOREIGN KEY (`inspection_id`) REFERENCES `daily_machine_inspections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_departments_parent` FOREIGN KEY (`parent_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `Employees_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_employees_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `employee_roles`
--
ALTER TABLE `employee_roles`
  ADD CONSTRAINT `fk_employee_roles_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employee_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `fk_inventory_creator` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inventory_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_inventory_inspector` FOREIGN KEY (`inspector_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inventory_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_inventory_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  ADD CONSTRAINT `fk_inventory_screening_item` FOREIGN KEY (`screening_item_id`) REFERENCES `screening_items` (`id`),
  ADD CONSTRAINT `fk_inventory_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`);

--
-- 資料表的限制式 `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `fk_inv_trans_created_by` FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inv_trans_item` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `lookup_values`
--
ALTER TABLE `lookup_values`
  ADD CONSTRAINT `fk_lookup_values_domain` FOREIGN KEY (`domain_id`) REFERENCES `lookup_domains` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `machines`
--
ALTER TABLE `machines`
  ADD CONSTRAINT `Machines_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_machines_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `machine_maintenance_tasks`
--
ALTER TABLE `machine_maintenance_tasks`
  ADD CONSTRAINT `fk_maintenance_tasks_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `message_attachments`
--
ALTER TABLE `message_attachments`
  ADD CONSTRAINT `message_attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `user_messages` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `message_recipients`
--
ALTER TABLE `message_recipients`
  ADD CONSTRAINT `message_recipients_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `user_messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_recipients_ibfk_2` FOREIGN KEY (`recipient_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `notification_reads`
--
ALTER TABLE `notification_reads`
  ADD CONSTRAINT `notification_reads_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `system_notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notification_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `Orders_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `OrderItems_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `OrderItems_ibfk_2` FOREIGN KEY (`screening_item_id`) REFERENCES `screening_items` (`id`);

--
-- 資料表的限制式 `order_item_attachments`
--
ALTER TABLE `order_item_attachments`
  ADD CONSTRAINT `OrderItemAttachments_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_item_drawings`
--
ALTER TABLE `order_item_drawings`
  ADD CONSTRAINT `OrderItemDrawings_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `order_item_screening_details`
--
ALTER TABLE `order_item_screening_details`
  ADD CONSTRAINT `fk_screening_details_oi` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_screening_details_service` FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `order_item_tools`
--
ALTER TABLE `order_item_tools`
  ADD CONSTRAINT `fk_order_item_tools_oi` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_item_tools_tool` FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `production_quality_records`
--
ALTER TABLE `production_quality_records`
  ADD CONSTRAINT `fk_pqr_inspector` FOREIGN KEY (`inspector_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pqr_production_record` FOREIGN KEY (`production_record_id`) REFERENCES `production_records` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `production_records`
--
ALTER TABLE `production_records`
  ADD CONSTRAINT `ProductionRecords_Employee_FK` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  ADD CONSTRAINT `fk_production_records_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_production_records_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `quality_issue_reports`
--
ALTER TABLE `quality_issue_reports`
  ADD CONSTRAINT `fk_qir_department` FOREIGN KEY (`responsible_department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_qir_reporter` FOREIGN KEY (`reported_by_employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `return_orders`
--
ALTER TABLE `return_orders`
  ADD CONSTRAINT `ReturnOrders_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_return_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_return_orders_original_shipping_order` FOREIGN KEY (`original_shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `return_order_items`
--
ALTER TABLE `return_order_items`
  ADD CONSTRAINT `fk_roi_return_order` FOREIGN KEY (`return_order_id`) REFERENCES `return_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_roi_shipping_order_item` FOREIGN KEY (`shipping_order_item_id`) REFERENCES `shipping_order_items` (`id`);

--
-- 資料表的限制式 `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `shipping_orders`
--
ALTER TABLE `shipping_orders`
  ADD CONSTRAINT `ShippingOrders_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_shipping_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipping_orders_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- 資料表的限制式 `shipping_order_items`
--
ALTER TABLE `shipping_order_items`
  ADD CONSTRAINT `fk_shipping_order_items_inventory` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`),
  ADD CONSTRAINT `fk_shipping_order_items_order` FOREIGN KEY (`shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipping_order_items_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON UPDATE CASCADE;

--
-- 資料表的限制式 `shipping_quality_inspections`
--
ALTER TABLE `shipping_quality_inspections`
  ADD CONSTRAINT `fk_sqi_inspector` FOREIGN KEY (`inspector_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sqi_shipping_order` FOREIGN KEY (`shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `system_notifications`
--
ALTER TABLE `system_notifications`
  ADD CONSTRAINT `system_notifications_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `employees` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `tools`
--
ALTER TABLE `tools`
  ADD CONSTRAINT `Tools_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `user_messages`
--
ALTER TABLE `user_messages`
  ADD CONSTRAINT `user_messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_messages_ibfk_2` FOREIGN KEY (`reply_to_id`) REFERENCES `user_messages` (`id`) ON DELETE SET NULL;

--
-- 資料表的限制式 `work_orders`
--
ALTER TABLE `work_orders`
  ADD CONSTRAINT `WorkOrders_AssignedEmployee_FK` FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `WorkOrders_CalibrationEmployee_FK` FOREIGN KEY (`calibration_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `WorkOrders_Machine_FK` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `WorkOrders_StatusLookup_FK` FOREIGN KEY (`status_lookup_id`) REFERENCES `lookup_values` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `WorkOrders_ibfk_1` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE;

--
-- 資料表的限制式 `work_order_first_piece_dimensions`
--
ALTER TABLE `work_order_first_piece_dimensions`
  ADD CONSTRAINT `FirstPiece_Employee_FK` FOREIGN KEY (`measured_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_work_order_fpd_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `work_order_images`
--
ALTER TABLE `work_order_images`
  ADD CONSTRAINT `WorkOrderImages_Employee_FK` FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_work_order_images_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- 資料表的限制式 `work_order_screening_defects`
--
ALTER TABLE `work_order_screening_defects`
  ADD CONSTRAINT `WorkOrderScreeningDefects_Employee_FK` FOREIGN KEY (`recorded_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `WorkOrderScreeningDefects_ScreeningService_FK` FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `WorkOrderScreeningDefects_WorkOrder_FK` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE;

--
-- 本地開發進度補丁（2026-05-11）
-- 1) 更新客戶光篩代工委託確認單的報表備註（report_descriptions）
-- 2) 回填已設定的最終報價（orders.final_quote_per_m）
--
INSERT INTO `report_descriptions` (`report_code`, `report_name`, `report_name_en`, `description`, `description_en`, `is_active`, `created_at`, `updated_at`)
SELECT 'order_confirmation', '客戶光篩代工委託確認單', 'Customer Optical Screening Outsourcing Confirmation', '', '', 1, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM `report_descriptions` WHERE `report_code` = 'order_confirmation'
);

UPDATE `report_descriptions`
SET `description` = '請依第三項貴司指定篩選項目及各項公差值複驗品質，唯在篩選過程中，會有輕微電鍍磨損，望貴司知悉。\n入貨檢驗請貴司務必於貨物入廠簽收完成後(一週內)進行進貨檢驗動作，經檢驗發現品質異常時，煩請於第一時間回饋本公司，本公司將竭盡所能進行對策改善及服務。超出期限，恕不負責。\n茲因貨物一旦未於期限驗收完成，出貨到海外有諸多不可控因素，實為我司無法掌控，望請貴司海涵。',
    `updated_at` = CURRENT_TIMESTAMP
WHERE `report_code` = 'order_confirmation';

UPDATE `orders`
SET `final_quote_per_m` = 12.00
WHERE `order_number` = 'ORDER-20260505-0001';
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
