-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1:3306
-- 產生時間： 2026 年 05 月 06 日 15:43
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
(1, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-10 08:34:23'),
(2, 1, 'Uploaded company logo', 'CompanyLogos', 1, '{\"company_id\":1,\"file_name\":\"logo_697731b680a70.png\"}', '::1', '2026-02-10 09:58:17'),
(3, 1, 'Activated company logo', 'CompanyLogos', 1, '{\"company_id\":1}', '::1', '2026-02-10 09:58:20'),
(4, 1, '新增訂單', 'Orders', 1, '{\"customer_id\":30,\"order_date\":\"2026-02-10\",\"expected_delivery_date\":\"2026-02-28\",\"customer_po_number\":\"SS-2034-34\",\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260210-0001\"}', '::1', '2026-02-10 10:04:48'),
(5, 1, '刪除訂單', 'Orders', 1, NULL, '::1', '2026-02-10 10:34:07'),
(6, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-10 10:34:40'),
(7, 1, '客戶停用', 'Customers', 30, '{\"customer_number\":\"CUST-030\",\"name\":\"遠東紡織機械\",\"is_active\":0}', '::1', '2026-02-10 10:35:09'),
(8, 1, '客戶啟用', 'Customers', 30, '{\"customer_number\":\"CUST-030\",\"name\":\"遠東紡織機械\",\"is_active\":1}', '::1', '2026-02-10 10:35:16'),
(9, 1, '客戶停用', 'Customers', 30, '{\"customer_number\":\"CUST-030\",\"name\":\"遠東紡織機械\",\"is_active\":0}', '::1', '2026-02-10 10:35:20'),
(10, 1, '客戶啟用', 'Customers', 30, '{\"customer_number\":\"CUST-030\",\"name\":\"遠東紡織機械\",\"is_active\":1}', '::1', '2026-02-10 10:35:24'),
(11, 1, '登出系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-10 12:32:49'),
(12, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-10 12:32:51'),
(13, 1, 'Soft deleted customer', 'Customers', 30, '{\"original_customer_number\":\"CUST-030\",\"renamed_to\":\"CUST-030_deleted_20260210203439\",\"name\":\"遠東紡織機械\"}', '::1', '2026-02-10 12:34:39'),
(14, 1, 'Soft deleted customer', 'Customers', 29, '{\"original_customer_number\":\"CUST-029\",\"renamed_to\":\"CUST-029_deleted_20260210203443\",\"name\":\"宇航精密科技\"}', '::1', '2026-02-10 12:34:43'),
(15, 1, 'Soft deleted customer', 'Customers', 28, '{\"original_customer_number\":\"CUST-028\",\"renamed_to\":\"CUST-028_deleted_20260210203445\",\"name\":\"宏達五金百貨\"}', '::1', '2026-02-10 12:34:45'),
(16, 1, 'Updated customer data', 'customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"product_category\":\"船舶配件\",\"website\":\"https:\\/\\/www.century-marine.com\",\"fax\":\"07-813-1112\",\"invoice_title\":\"世紀船舶配件有限公司\",\"company_registered_address\":\"高雄市前鎮區漁港南一路29號\",\"invoice_address\":\"高雄市前鎮區漁港南一路29號\",\"shipping_address\":\"高雄市前鎮區漁港南一路29號\",\"contact_person\":\"連經理\",\"phone\":\"07-813-1111\",\"email\":\"contact@century-marine.com\",\"address\":\"高雄市前鎮區漁港南一路29號\",\"sales_contact_person\":\"魯先生\",\"sales_contact_extension\":\"30\",\"sales_contact_mobile\":\"0935-111-999\",\"sales_contact_email\":\"sales.lu@century-marine.com\",\"finance_contact_person\":\"辛小姐\",\"finance_contact_extension\":\"31\",\"finance_contact_mobile\":\"0935-111-998\",\"finance_contact_email\":\"finance.hsin@century-marine.com\",\"billing_day\":25,\"reconciliation_day\":10,\"payment_method\":\"票期90天\",\"tax_id\":\"24681357\",\"invoice_attachment_path\":\"uploads\\/invoices\\/cust027.png\",\"notes\":\"船舶零件供應商\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '::1', '2026-02-10 12:35:11'),
(17, 1, 'Updated customer data', 'customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"product_category\":\"船舶配件\",\"website\":\"https:\\/\\/www.century-marine.com\",\"fax\":\"07-813-1112\",\"invoice_title\":\"世紀船舶配件有限公司\",\"company_registered_address\":\"高雄市前鎮區漁港南一路29號\",\"invoice_address\":\"高雄市前鎮區漁港南一路29號\",\"shipping_address\":\"高雄市前鎮區漁港南一路29號\",\"contact_person\":\"連經理\",\"phone\":\"07-813-1111\",\"email\":\"contact@century-marine.com\",\"address\":\"高雄市前鎮區漁港南一路29號\",\"sales_contact_person\":\"魯先生\",\"sales_contact_extension\":\"30\",\"sales_contact_mobile\":\"0935-111-999\",\"sales_contact_email\":\"sales.lu@century-marine.com\",\"finance_contact_person\":\"辛小姐\",\"finance_contact_extension\":\"31\",\"finance_contact_mobile\":\"0935-111-998\",\"finance_contact_email\":\"finance.hsin@century-marine.com\",\"billing_day\":25,\"reconciliation_day\":10,\"payment_method\":\"票期90天\",\"tax_id\":\"24681357\",\"invoice_attachment_path\":null,\"notes\":\"船舶零件供應商\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '::1', '2026-02-10 12:35:53'),
(18, 1, 'Updated customer data', 'customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"product_category\":\"船舶配件\",\"website\":\"https:\\/\\/www.century-marine.com\",\"fax\":\"07-813-1112\",\"invoice_title\":\"世紀船舶配件有限公司\",\"company_registered_address\":\"高雄市前鎮區漁港南一路29號\",\"invoice_address\":\"高雄市前鎮區漁港南一路29號\",\"shipping_address\":\"高雄市前鎮區漁港南一路29號\",\"contact_person\":\"連經理\",\"phone\":\"07-813-1111\",\"email\":\"contact@century-marine.com\",\"address\":\"高雄市前鎮區漁港南一路29號\",\"sales_contact_person\":\"魯先生\",\"sales_contact_extension\":\"30\",\"sales_contact_mobile\":\"0935-111-999\",\"sales_contact_email\":\"sales.lu@century-marine.com\",\"finance_contact_person\":\"辛小姐\",\"finance_contact_extension\":\"31\",\"finance_contact_mobile\":\"0935-111-998\",\"finance_contact_email\":\"finance.hsin@century-marine.com\",\"billing_day\":25,\"reconciliation_day\":10,\"payment_method\":\"票期90天\",\"tax_id\":\"24681357\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/f5306b8717e3d376401581733bdda928.jpg\",\"notes\":\"船舶零件供應商\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '::1', '2026-02-10 12:37:56'),
(19, 1, '客戶停用', 'Customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"is_active\":0}', '::1', '2026-02-10 12:38:01'),
(20, 1, '客戶啟用', 'Customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"is_active\":1}', '::1', '2026-02-10 12:41:23'),
(21, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-12 06:40:48'),
(22, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"::1\"}', '::1', '2026-02-12 08:41:30'),
(23, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.174.102.249\"}', '1.174.102.249', '2026-02-12 09:19:19'),
(24, 1, 'Uploaded company logo', 'CompanyLogos', 2, '{\"company_id\":1,\"file_name\":\"logo_697730673f55f.png\"}', '1.174.102.249', '2026-02-12 09:20:10'),
(25, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"36.238.160.152\"}', '36.238.160.152', '2026-02-12 09:54:27'),
(26, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"36.238.160.152\"}', '36.238.160.152', '2026-02-12 09:54:56'),
(27, 1, '登出系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"36.238.160.152\"}', '36.238.160.152', '2026-02-12 10:20:07'),
(28, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"36.238.160.152\"}', '36.238.160.152', '2026-02-12 10:20:13'),
(29, 1, 'Activated company logo', 'CompanyLogos', 2, '{\"company_id\":1}', '36.238.160.152', '2026-02-12 10:28:38'),
(30, 1, '客戶停用', 'Customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"is_active\":0}', '36.238.160.152', '2026-02-12 10:38:08'),
(31, 1, '客戶啟用', 'Customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\",\"is_active\":1}', '36.238.160.152', '2026-02-12 10:38:17'),
(32, 1, 'Updated supplier data', 'suppliers', 1, '{\"supplier_number\":\"SUPP-001\",\"name\":\"精銳材料科技\",\"service_type\":\"原物料\",\"supplier_type\":\"原料供應商\",\"product_category\":\"特殊鋼材\",\"owner\":\"吳董事長\",\"contact_person\":\"吳經理\",\"contact_mobile\":\"0933-123-456\",\"phone\":\"03-452-1122\",\"fax\":\"03-452-1123\",\"address\":\"桃園市中壢區中正路50號\",\"factory_address\":\"桃園市觀音區工業三路10號\",\"payment_method\":\"月結60天\",\"bank_account_name\":\"精銳材料科技股份有限公司\",\"bank_name\":\"玉山銀行\",\"bank_code\":\"808\",\"bank_branch_name\":\"中壢分行\",\"bank_branch_code\":\"0069\",\"email\":\"sales@jingray.com.tw\",\"tax_id\":\"12312312\",\"bank_account_number\":\"0069-1234567890\",\"attachment_path\":\"uploads\\/suppliers\\/Pb7CWNY.jpg\",\"notes\":\"品質穩定\"}', '36.238.160.152', '2026-02-12 10:44:29'),
(33, 1, '新增訂單', 'Orders', 2, '{\"customer_id\":1,\"order_date\":\"2026-02-12\",\"expected_delivery_date\":\"2026-02-28\",\"customer_po_number\":null,\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260212-0001\"}', '36.238.160.152', '2026-02-12 10:58:40'),
(34, 1, '新增訂單品項', 'OrderItems', 1, '{\"order_id\":2,\"screening_item_id\":1,\"total_weight_kg\":999,\"total_units\":327241.3793,\"total_price\":4908.62}', '36.238.160.152', '2026-02-12 11:09:32'),
(35, 1, 'Added new work order', 'WorkOrders', 1, '{\"work_order_number\":\"WO-20260212-0001\",\"screening_defects_count\":0,\"production_records_count\":1}', '36.238.160.152', '2026-02-12 11:17:54'),
(36, 1, '新增訂單品項', 'OrderItems', 2, '{\"order_id\":2,\"screening_item_id\":1,\"total_weight_kg\":999,\"total_units\":327241.3793,\"total_price\":4254.14}', '36.238.160.152', '2026-02-12 11:30:01'),
(37, 1, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":3,\"production_records_count\":1}', '36.238.160.152', '2026-02-12 11:56:18'),
(38, 1, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":\"2026-02-12 19:56:00\",\"scheduled_end_date\":\"2026-02-16 19:56:00\",\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":3,\"production_records_count\":1}', '36.238.160.152', '2026-02-12 11:56:42'),
(39, 1, 'Uploaded work order image', 'WorkOrderImages', 1, '{\"work_order_id\":1,\"file_name\":\"Pb7CWNY.jpg\"}', '36.238.160.152', '2026-02-12 12:01:25'),
(40, 1, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":3,\"production_records_count\":1}', '36.238.160.152', '2026-02-12 12:01:41'),
(41, 1, 'Updated work order', 'work_orders', 1, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":3,\"production_records_count\":1}', '36.238.160.152', '2026-02-12 12:09:09'),
(42, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"36.238.160.152\"}', '36.238.160.152', '2026-02-12 12:32:50'),
(43, 1, '新增員工', 'employees', 9, '{\"employee_number\":\"EMP004\",\"name\":\"王\"}', '36.238.160.152', '2026-02-12 12:58:53'),
(44, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.214.214\"}', '1.175.214.214', '2026-02-23 23:16:54'),
(45, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.246.194\"}', '1.175.246.194', '2026-02-26 01:37:44'),
(46, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.174.92.17\"}', '1.174.92.17', '2026-02-28 08:02:25'),
(47, 1, 'Added new work order', 'WorkOrders', 2, '{\"work_order_number\":\"WO-20260228-0001\",\"screening_defects_count\":0,\"production_records_count\":1}', '1.174.92.17', '2026-02-28 08:02:52'),
(48, 1, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":1}', '1.174.92.17', '2026-02-28 08:03:05'),
(49, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.199.96\"}', '1.175.199.96', '2026-03-02 15:09:28'),
(50, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.227.96\"}', '1.175.227.96', '2026-03-02 21:41:02'),
(51, 9, '登入系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 02:47:49'),
(52, 9, '新增員工', 'employees', 10, '{\"employee_number\":\"YC1060301002\",\"name\":\"江乙芳\"}', '36.238.166.134', '2026-03-03 02:49:35'),
(53, 9, '新增員工', 'employees', 11, '{\"employee_number\":\"YC1100913001\",\"name\":\"郭芸彤\"}', '36.238.166.134', '2026-03-03 02:51:55'),
(54, 9, '登出系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 02:52:06'),
(55, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 02:52:16'),
(56, 10, 'Added new customer', 'Customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\"}', '36.238.166.134', '2026-03-03 04:44:47'),
(57, 10, 'Updated customer data', 'customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"鄭妁吟#23\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:45:14'),
(58, 10, 'Updated customer data', 'customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-695-1570\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"鄭妁吟#23  又瑜#11\",\"phone\":\"07-695-2888\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:45:54'),
(59, 10, 'Updated customer data', 'customers', 5, '{\"customer_number\":\"CUST-005\",\"name\":\"永固機械製造\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":null,\"company_registered_address\":\"高雄市左營大道100號\",\"invoice_address\":\"高雄市左營大道100號\",\"shipping_address\":\"高雄市左營大道100號\",\"contact_person\":\"蔡先生\",\"phone\":\"07-4435745\",\"email\":\"email@email.com\",\"address\":\"高雄市左營大道100號\",\"sales_contact_person\":\"蔡先生\",\"sales_contact_extension\":\"07-4453567\",\"sales_contact_mobile\":null,\"sales_contact_email\":\"email01@email.com\",\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":10,\"reconciliation_day\":5,\"payment_method\":\"現金\",\"tax_id\":\"22445533\",\"invoice_attachment_path\":null,\"notes\":\"07-695-2608 (二倉電話)\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:46:19'),
(60, 10, 'Updated customer data', 'customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-695-1570\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":\"81358 高雄市左營區博愛二路366號26樓之1號\",\"shipping_address\":\"高雄市路竹區新生路334巷23號  (倉庫)\",\"contact_person\":\"鄭妁吟#23  又瑜#11\",\"phone\":\"07-695-2888\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:46:57'),
(61, 10, 'Updated customer data', 'customers', 5, '{\"customer_number\":\"CUST-005\",\"name\":\"永固機械製造\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":null,\"company_registered_address\":\"高雄市左營大道100號\",\"invoice_address\":\"高雄市左營大道100號\",\"shipping_address\":\"高雄市左營大道100號\",\"contact_person\":\"蔡先生\",\"phone\":\"07-4435745\",\"email\":\"email@email.com\",\"address\":\"高雄市左營大道100號\",\"sales_contact_person\":\"蔡先生\",\"sales_contact_extension\":\"07-4453567\",\"sales_contact_mobile\":null,\"sales_contact_email\":\"email01@email.com\",\"finance_contact_person\":\"江小姐\",\"finance_contact_extension\":\"07-557-6366\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":10,\"reconciliation_day\":5,\"payment_method\":\"現金\",\"tax_id\":\"22445533\",\"invoice_attachment_path\":null,\"notes\":\"07-695-2608 (二倉電話)\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:47:23'),
(62, 10, 'Updated customer data', 'customers', 5, '{\"customer_number\":\"CUST-005\",\"name\":\"永固機械製造\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"托福實業股份有限公司\",\"company_registered_address\":\"高雄市左營大道100號\",\"invoice_address\":\"高雄市左營大道100號\",\"shipping_address\":\"高雄市左營大道100號\",\"contact_person\":\"蔡先生\",\"phone\":\"07-4435745\",\"email\":\"email@email.com\",\"address\":\"高雄市左營大道100號\",\"sales_contact_person\":\"蔡先生\",\"sales_contact_extension\":\"07-4453567\",\"sales_contact_mobile\":null,\"sales_contact_email\":\"email01@email.com\",\"finance_contact_person\":\"江小姐\",\"finance_contact_extension\":\"07-557-6366\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":20,\"reconciliation_day\":25,\"payment_method\":\"月結60天\",\"tax_id\":\"81209958\",\"invoice_attachment_path\":null,\"notes\":\"07-695-2608 (二倉電話)\\r\\n左營總公司傳真07-557-2177\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-03 04:49:12'),
(63, 10, 'Added new customer', 'Customers', 32, '{\"customer_number\":\"CU-A0002\",\"name\":\"鑫穩企業有限公司\"}', '36.238.166.134', '2026-03-03 04:52:06'),
(64, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 04:54:05'),
(65, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 04:57:19'),
(66, 9, '登入系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 04:57:42'),
(67, 9, '登出系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 05:30:22'),
(68, 9, '登入系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 05:30:30'),
(69, 9, '登出系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 05:33:06'),
(70, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 05:33:17'),
(71, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-03 08:08:36'),
(72, 10, 'Added new calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"晴岡M3.5-0.6X7.5\",\"description\":null,\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":0,\"status\":\"pending\",\"priority\":null,\"color\":\"#000000\"}', '36.238.166.134', '2026-03-03 08:10:37'),
(73, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"晴岡M3.5-0.6X7.5\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":0,\"status\":\"pending\",\"priority\":null,\"color\":\"#000000\"}', '36.238.166.134', '2026-03-03 08:10:49'),
(74, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"晴岡M3.5-0.6X7.5\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"pending\",\"priority\":null,\"color\":\"#000000\"}', '36.238.166.134', '2026-03-03 08:10:55'),
(75, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"晴岡M3.5-0.6X7.5(追亞太)\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"pending\",\"priority\":null,\"color\":\"#000000\"}', '36.238.166.134', '2026-03-03 08:11:49'),
(76, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.227.96\"}', '1.175.227.96', '2026-03-03 14:07:45'),
(77, 1, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '1.175.227.96', '2026-03-03 14:41:57'),
(78, 1, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '1.175.227.96', '2026-03-03 14:42:07'),
(79, 1, '登出系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.227.96\"}', '1.175.227.96', '2026-03-03 14:42:57'),
(80, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.227.96\"}', '1.175.227.96', '2026-03-03 14:43:05'),
(81, 1, 'Activated company logo', 'CompanyLogos', 1, '{\"company_id\":1}', '1.175.227.96', '2026-03-03 14:43:24'),
(82, 1, 'Deleted company logo', 'CompanyLogos', 2, '{\"company_id\":1,\"file_path\":\"uploads\\/company_logos\\/1\\/logo_698d9b4a9e469.png\"}', '1.175.227.96', '2026-03-03 14:43:38'),
(83, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-04 02:15:43'),
(84, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3.5-0.6X7.5(亞太)\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"pending\",\"priority\":null,\"color\":\"#000000\"}', '36.238.166.134', '2026-03-04 02:16:08'),
(85, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.243.246\"}', '1.175.243.246', '2026-03-04 07:01:17'),
(86, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-04 09:13:31'),
(87, 10, 'Added new customer', 'Customers', 33, '{\"customer_number\":\"CU-A0003\",\"name\":\"益展工業股份有限公司\"}', '36.238.166.134', '2026-03-04 10:14:22'),
(88, 10, 'Updated customer data', 'customers', 33, '{\"customer_number\":\"CU-A0003\",\"name\":\"益展工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-1995(一樓)\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇小姐、王小姐  品管-王小姐\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-04 10:15:13'),
(89, 10, 'Updated customer data', 'customers', 33, '{\"customer_number\":\"CU-A0003\",\"name\":\"益展工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-1995(一樓)\",\"invoice_title\":\"益展工業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇亭綺\'S、王盈淑\'S  品管-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975207775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069(-二樓)\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":25,\"payment_method\":\"票期90天\",\"tax_id\":\"89829798\",\"invoice_attachment_path\":null,\"notes\":\"單重如在1.00以下，單重需做三位數\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.166.134', '2026-03-04 10:18:26'),
(90, 10, 'Added new customer', 'Customers', 34, '{\"customer_number\":\"CU-A0004\",\"name\":\"晴岡企業股份有限公司\"}', '36.238.166.134', '2026-03-04 10:22:28'),
(91, 10, 'Updated customer data', 'customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-695-1570\",\"invoice_title\":\"托福實業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"81358 高雄市左營區博愛二路366號26樓之1號\",\"shipping_address\":\"高雄市路竹區新生路334巷23號  (倉庫)\",\"contact_person\":\"鄭妁吟#23  又瑜#11\",\"phone\":\"07-695-2888\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"江小姐\",\"finance_contact_extension\":\"07-557-6366\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":20,\"reconciliation_day\":25,\"payment_method\":\"票期60天\",\"tax_id\":\"81209958\",\"invoice_attachment_path\":null,\"notes\":\"TEL :07-695-2608 (二倉)\\r\\n高雄總公司FAX:07-557-2177 \\/ 557-1977\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-04 10:24:15'),
(92, 10, 'Soft deleted customer', 'Customers', 6, '{\"customer_number\":\"CUST-006\",\"name\":\"東方車料配件\"}', '36.238.166.134', '2026-03-04 10:24:47'),
(93, 10, 'Added new customer', 'Customers', 35, '{\"customer_number\":\"CU-A-0006\",\"name\":\"唯文股份有限公司\"}', '36.238.166.134', '2026-03-04 10:57:29'),
(94, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-04 11:09:25'),
(95, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-04 11:18:24'),
(96, 10, '新增訂單', 'Orders', 3, '{\"customer_id\":33,\"order_date\":\"2026-03-03\",\"expected_delivery_date\":\"2026-03-05\",\"customer_po_number\":\"099-11412024\",\"status\":\"pending\",\"total_amount\":0,\"notes\":\"3\\/5(四)中午前必入\",\"order_number\":\"ORDER-20260303-0001\"}', '36.238.166.134', '2026-03-04 11:27:16'),
(97, 10, '新增訂單品項', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1384,\"total_units\":182345.191,\"total_price\":3646.9}', '36.238.166.134', '2026-03-04 11:36:49'),
(98, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1384,\"total_units\":182345.191,\"total_price\":3646.9}', '36.238.166.134', '2026-03-04 11:37:31'),
(99, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1384,\"total_units\":182345.191,\"total_price\":3646.9}', '36.238.166.134', '2026-03-04 11:37:50'),
(100, 10, 'Added new work order', 'WorkOrders', 3, '{\"work_order_number\":\"WO-20260304-0001\",\"screening_defects_count\":0,\"production_records_count\":0}', '36.238.166.134', '2026-03-04 11:39:27'),
(101, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1384,\"total_units\":167325.4282,\"total_price\":3346.51}', '36.238.166.134', '2026-03-04 11:42:17'),
(102, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1387,\"total_units\":167720.6851,\"total_price\":3354.41}', '36.238.166.134', '2026-03-04 11:42:48'),
(103, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1387,\"total_units\":162714.0975,\"total_price\":3254.28}', '36.238.166.134', '2026-03-04 11:43:00'),
(104, 10, '更新客戶批號', 'OrderItems', 3, '{\"order_id\":3,\"screening_item_id\":12,\"total_weight_kg\":1387,\"total_units\":162714.0975,\"total_price\":3254.28}', '36.238.166.134', '2026-03-04 11:43:17'),
(105, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.166.134', '2026-03-04 11:45:13'),
(106, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.166.134', '2026-03-04 11:45:19'),
(107, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.166.134', '2026-03-04 11:45:27'),
(108, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"39.10.57.9\"}', '39.10.57.9', '2026-03-04 11:52:56'),
(109, 10, '登入系統', 'employees', 10, '{\"account\":\"Yvonne\",\"ip\":\"39.10.57.9\"}', '39.10.57.9', '2026-03-04 11:53:28'),
(110, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-04 11:55:34'),
(111, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-03-03 17:00:00\",\"actual_end_date\":\"2026-03-04 11:07:00\",\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.166.134', '2026-03-04 11:58:36'),
(112, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":4}', '36.238.166.134', '2026-03-04 12:02:30'),
(113, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.243.246\"}', '1.175.243.246', '2026-03-04 13:20:17'),
(114, 1, '登出系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.243.246\"}', '1.175.243.246', '2026-03-04 13:27:48'),
(115, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.243.246\"}', '1.175.243.246', '2026-03-04 14:31:17'),
(116, 1, 'Updated work order', 'work_orders', 2, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":1}', '1.175.243.246', '2026-03-04 14:31:51'),
(117, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.243.246\"}', '1.175.243.246', '2026-03-05 01:57:02'),
(118, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 04:34:49'),
(119, 10, 'Updated customer data', 'customers', 35, '{\"customer_number\":\"CU-A0005\",\"name\":\"唯文股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-622-1188\",\"invoice_title\":\"唯文股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"82063高雄市岡山區岡山北路15號\",\"shipping_address\":\"82063高雄市岡山區岡山北路15號\",\"contact_person\":\"吳惠雪\'S\",\"phone\":\"07-622-1177\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"22939923\",\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":1000,\"weight_tolerance_percentage\":3}', '36.238.166.134', '2026-03-05 04:35:25'),
(120, 10, 'Added new customer', 'Customers', 36, '{\"customer_number\":\"CU-A0006\",\"name\":\"富詮工業股份有限公司\"}', '36.238.166.134', '2026-03-05 04:38:14'),
(121, 10, '客戶啟用', 'Customers', 36, '{\"customer_number\":\"CU-A0006\",\"name\":\"富詮工業股份有限公司\",\"is_active\":1}', '36.238.166.134', '2026-03-05 04:38:34'),
(122, 10, 'Added new customer', 'Customers', 37, '{\"customer_number\":\"CU-A0007\",\"name\":\"安拓實業股份有限公司\"}', '36.238.166.134', '2026-03-05 04:40:11'),
(123, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-03-03 17:00:00\",\"actual_end_date\":\"2026-03-04 20:50:00\",\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":4}', '36.238.166.134', '2026-03-05 05:37:46'),
(124, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":4}', '36.238.166.134', '2026-03-05 05:59:04'),
(125, 10, '新增庫存品項', 'inventory_items', 4, '{\"work_order_id\":\"3\"}', '36.238.166.134', '2026-03-05 06:20:01'),
(126, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":3,\"production_records_count\":4}', '36.238.166.134', '2026-03-05 06:29:31'),
(127, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 06:37:02'),
(128, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":3,\"production_records_count\":4}', '36.238.166.134', '2026-03-05 06:38:36'),
(129, 10, 'Updated work order', 'work_orders', 3, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"470\",\"status_lookup_id\":28,\"screening_defects_count\":3,\"production_records_count\":4}', '36.238.166.134', '2026-03-05 06:39:47'),
(130, 10, '新增庫存品項', 'inventory_items', 5, '{\"work_order_id\":\"3\"}', '36.238.166.134', '2026-03-05 07:23:45'),
(131, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 07:37:32'),
(132, 11, 'Updated customer data', 'customers', 33, '{\"customer_number\":\"CU-A0003\",\"name\":\"益展工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-1995(一樓)\",\"invoice_title\":\"益展工業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇亭綺\'S、王盈淑\'S  品管-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975207775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069(-二樓)\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":25,\"payment_method\":\"票期90天\",\"tax_id\":\"89829798\",\"invoice_attachment_path\":null,\"notes\":\"單重如在1.00以下，單重需做三位數\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.166.134', '2026-03-05 07:56:54'),
(133, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 09:42:46'),
(134, 10, 'Added new customer', 'Customers', 38, '{\"customer_number\":\"CU-A0008\",\"name\":\"尚展螺絲企業有限公司\"}', '36.238.166.134', '2026-03-05 09:46:02'),
(135, 10, 'Added new customer', 'Customers', 39, '{\"customer_number\":\"CU-A0009\",\"name\":\"弘吉螺絲工業股份有限公司\"}', '36.238.166.134', '2026-03-05 09:50:11'),
(136, 10, '新增訂單', 'Orders', 4, '{\"customer_id\":39,\"order_date\":\"2026-03-05\",\"expected_delivery_date\":\"2026-03-09\",\"customer_po_number\":\"PO:251105002\",\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260305-0001\"}', '36.238.166.134', '2026-03-05 09:52:09'),
(137, 10, '新增訂單品項', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":157493.5401,\"total_price\":3937.34}', '36.238.166.134', '2026-03-05 09:58:48'),
(138, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.166.134', '2026-03-05 10:00:40'),
(139, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.166.134', '2026-03-05 10:05:06'),
(140, 10, '新增訂單品項', 'OrderItems', 5, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":11677,\"total_units\":465676.1413,\"total_price\":11641.9}', '36.238.166.134', '2026-03-05 10:06:10'),
(141, 10, '更新客戶批號', 'OrderItems', 5, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":11677,\"total_units\":461197.2438,\"total_price\":11529.93}', '36.238.166.134', '2026-03-05 10:07:35'),
(142, 10, 'Added new work order', 'WorkOrders', 4, '{\"work_order_number\":\"WO-20260305-0001\",\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:08:04'),
(143, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.166.134', '2026-03-05 10:10:22'),
(144, 10, '新增訂單品項', 'OrderItems', 6, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":11677,\"total_units\":461197.2438,\"total_price\":11529.93}', '36.238.166.134', '2026-03-05 10:11:51'),
(145, 10, 'Added new work order', 'WorkOrders', 5, '{\"work_order_number\":\"WO-20260305-0002\",\"screening_defects_count\":0,\"production_records_count\":18}', '36.238.166.134', '2026-03-05 10:12:40'),
(146, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-03-04 17:00:00\",\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:16:36'),
(147, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:16:51'),
(148, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:17:44'),
(149, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 10:19:29'),
(150, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 10:20:07'),
(151, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:21:36'),
(152, 10, '新增庫存品項', 'inventory_items', 7, '{\"work_order_id\":\"4\"}', '36.238.166.134', '2026-03-05 10:21:53'),
(153, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:25:08'),
(154, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:26:28'),
(155, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:27:32'),
(156, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:27:41'),
(157, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:28:01'),
(158, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.166.134', '2026-03-05 10:28:07'),
(159, 10, '新增庫存品項', 'inventory_items', 8, '{\"work_order_id\":\"4\"}', '36.238.166.134', '2026-03-05 10:30:18'),
(160, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 10:56:01'),
(161, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.166.134', '2026-03-05 11:03:33'),
(162, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 11:04:20'),
(163, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 11:04:29'),
(164, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.166.134', '2026-03-05 11:06:00'),
(165, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.166.134', '2026-03-05 11:06:32'),
(166, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 11:09:46'),
(167, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 11:12:34'),
(168, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.166.134', '2026-03-05 11:12:59'),
(169, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.166.134\"}', '36.238.166.134', '2026-03-05 11:13:48'),
(170, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 03:26:41'),
(171, 10, 'Soft deleted supplier', 'Suppliers', 30, '{\"supplier_number\":\"SUPP-030\",\"name\":\"阿斯嘉特防鏽\"}', '36.238.159.8', '2026-03-06 04:42:17'),
(172, 10, 'Added new supplier', 'Suppliers', 31, '{\"supplier_number\":\"SUP-C-001\",\"name\":\"精湛光學科技股份有限公司\"}', '36.238.159.8', '2026-03-06 04:42:55'),
(173, 10, 'Updated supplier data', 'suppliers', 31, '{\"supplier_number\":\"SUP-C-001\",\"name\":\"精湛光學科技股份有限公司\",\"service_type\":null,\"supplier_type\":null,\"product_category\":null,\"owner\":null,\"contact_person\":\"蔡侑霖\",\"contact_mobile\":\"0932-558-061\",\"phone\":\"07-693-7937\",\"fax\":\"07-693-7071\",\"address\":\"82945高雄市湖內區忠孝街110巷58號\",\"factory_address\":\"82945高雄市湖內區忠孝街110巷58號\",\"payment_method\":\"月結60天\",\"bank_account_name\":null,\"bank_name\":null,\"bank_code\":null,\"bank_branch_name\":null,\"bank_branch_code\":null,\"email\":null,\"tax_id\":\"89855649\",\"bank_account_number\":null,\"attachment_path\":\"\\/uploads\\/suppliers\\/supp020.jpg\",\"notes\":null}', '36.238.159.8', '2026-03-06 04:44:24'),
(174, 10, 'Updated supplier data', 'suppliers', 31, '{\"supplier_number\":\"SUP-C-001\",\"name\":\"精湛光學科技股份有限公司\",\"service_type\":null,\"supplier_type\":null,\"product_category\":\"篩選機\",\"owner\":\"吳俊男\",\"contact_person\":\"蔡侑霖\",\"contact_mobile\":\"0932-558-061\",\"phone\":\"07-693-7937\",\"fax\":\"07-693-7071\",\"address\":\"82945高雄市湖內區忠孝街110巷58號\",\"factory_address\":\"82945高雄市湖內區忠孝街110巷58號\",\"payment_method\":\"月結60天\",\"bank_account_name\":\"精湛光學科技股份有限公司\",\"bank_name\":\"土地銀行\",\"bank_code\":\"005\",\"bank_branch_name\":\"路竹分行\",\"bank_branch_code\":\"0706\",\"email\":null,\"tax_id\":\"89855649\",\"bank_account_number\":null,\"attachment_path\":\"uploads\\/suppliers\\/精湛_頁面_2.jpg\",\"notes\":null}', '36.238.159.8', '2026-03-06 04:47:30');
INSERT INTO `audit_logs` (`id`, `employee_id`, `action`, `target_table`, `target_id`, `details`, `ip_address`, `created_at`) VALUES
(175, 10, 'Updated supplier data', 'suppliers', 31, '{\"supplier_number\":\"SUP-C-001\",\"name\":\"精湛光學科技股份有限公司\",\"service_type\":\"篩選機\",\"supplier_type\":\"製造\",\"product_category\":null,\"owner\":\"吳俊男\",\"contact_person\":\"蔡侑霖\",\"contact_mobile\":\"0932-558-061\",\"phone\":\"07-693-7937\",\"fax\":\"07-693-7071\",\"address\":\"82945高雄市湖內區忠孝街110巷58號\",\"factory_address\":\"82945高雄市湖內區忠孝街110巷58號\",\"payment_method\":\"月結60天\",\"bank_account_name\":\"精湛光學科技股份有限公司\",\"bank_name\":\"土地銀行\",\"bank_code\":\"005\",\"bank_branch_name\":\"路竹分行\",\"bank_branch_code\":\"0706\",\"email\":null,\"tax_id\":\"89855649\",\"bank_account_number\":null,\"attachment_path\":\"uploads\\/suppliers\\/精湛_頁面_2.jpg\",\"notes\":null}', '36.238.159.8', '2026-03-06 04:48:12'),
(176, 10, 'Added new supplier', 'Suppliers', 32, '{\"supplier_number\":\"SUP-C-002\",\"name\":\"昱權工業有限公司\"}', '36.238.159.8', '2026-03-06 04:54:15'),
(177, 10, '新增訂單', 'Orders', 5, '{\"customer_id\":32,\"order_date\":\"2026-02-23\",\"expected_delivery_date\":\"2026-03-02\",\"customer_po_number\":\"C5091960024A\",\"status\":\"confirmed\",\"total_amount\":0,\"notes\":\"1.完工抽夾子\\n2. 與S001774鍍層不同，勿混批，請先清潔料斗\",\"order_number\":\"ORDER-20260223-0001\"}', '36.238.159.8', '2026-03-06 05:19:11'),
(178, 10, '新增訂單品項', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 05:21:29'),
(179, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 05:26:14'),
(180, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 05:26:33'),
(181, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 05:38:36'),
(182, 10, '更新訂單', 'Orders', 5, '{\"customer_id\":32,\"order_date\":\"2026-02-23\",\"expected_delivery_date\":\"2026-03-02\",\"customer_po_number\":\"C5091960024A\",\"status\":\"confirmed\",\"total_amount\":14417.91,\"notes\":\"1.完工抽夾子\\n2. 與S001774鍍層不同，勿混批，請先清潔料斗.\\n3.二次良品超過10公斤，請用船型桶，\\n  使用前須清潔船桶，不可有油汙。清潔人員需於工單簽名。\\n   If second-time goods OVER 10 KG，pls use drum.\\n   Must clean drum before use and must not be dirty.\"}', '36.238.159.8', '2026-03-06 05:39:57'),
(183, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 05:45:18'),
(184, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 05:46:02'),
(185, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-06 05:46:49'),
(186, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 05:55:42'),
(187, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 06:01:15'),
(188, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 06:03:00'),
(189, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1201492.5373,\"total_price\":14417.91}', '36.238.159.8', '2026-03-06 06:09:03'),
(190, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1031343.2836,\"total_price\":12376.12}', '36.238.159.8', '2026-03-06 06:10:06'),
(191, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:10:46'),
(192, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:11:40'),
(193, 10, '新增訂單品項', 'OrderItems', 8, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:12:17'),
(194, 10, '新增訂單品項', 'OrderItems', 9, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:12:44'),
(195, 10, 'Added new work order', 'WorkOrders', 6, '{\"work_order_number\":\"WO-20260306-0001\",\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.159.8', '2026-03-06 06:17:08'),
(196, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 06:18:07'),
(197, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-06 06:18:26'),
(198, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-06 06:18:27'),
(199, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-06 06:18:28'),
(200, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-06 06:18:41'),
(201, 10, '更新訂單', 'Orders', 4, '{\"customer_id\":39,\"order_date\":\"2026-03-05\",\"expected_delivery_date\":\"2026-03-09\",\"customer_po_number\":\"null\",\"status\":\"pending\",\"total_amount\":26648.36,\"notes\":\"null\"}', '36.238.159.8', '2026-03-06 06:20:26'),
(202, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 06:20:35'),
(203, 10, '更新客戶批號', 'OrderItems', 7, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:24:17'),
(204, 10, '更新客戶批號', 'OrderItems', 8, '{\"order_id\":5,\"screening_item_id\":14,\"total_weight_kg\":1610,\"total_units\":1044029.8507,\"total_price\":12528.36}', '36.238.159.8', '2026-03-06 06:26:10'),
(205, 10, 'Added new work order', 'WorkOrders', 7, '{\"work_order_number\":\"WO-20260306-0002\",\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.159.8', '2026-03-06 06:26:30'),
(206, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 06:34:26'),
(207, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-06 06:34:26'),
(208, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"114.47.71.75\"}', '114.47.71.75', '2026-03-07 07:16:07'),
(209, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '114.47.71.75', '2026-03-07 07:16:40'),
(210, 10, '新增生產品質檢驗紀錄', 'production_quality_records', 1, '{\"id\":\"\",\"production_record_id\":\"140\",\"inspection_datetime\":\"2026-03-07T15:20\",\"inspector_id\":\"10\",\"sample_quantity_pcs\":\"10\",\"defective_quantity_pcs\":\"2\",\"inspection_result\":\"合格\",\"rework_needed\":\"0\",\"notes\":\"\"}', '114.47.71.75', '2026-03-07 07:20:55'),
(211, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-09 04:44:58'),
(212, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-09 04:45:47'),
(213, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.159.8', '2026-03-09 04:45:52'),
(214, 11, 'Updated customer data', 'customers', 38, '{\"customer_number\":\"CU-A0008\",\"name\":\"尚展螺絲企業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-0069\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇\'S   王\'S   QC-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975-207-775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.159.8', '2026-03-09 04:47:08'),
(215, 11, 'Updated work order', 'work_orders', 7, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":null,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.159.8', '2026-03-09 04:47:51'),
(216, 11, 'Updated work order', 'work_orders', 7, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":null,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.159.8', '2026-03-09 04:48:39'),
(217, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-09 04:54:19'),
(218, 11, 'Updated work order', 'work_orders', 7, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":null,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.159.8', '2026-03-09 04:54:54'),
(219, 9, '登入系統', 'employees', 9, '{\"account\":\"wang\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-09 07:35:06'),
(220, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.159.8\"}', '36.238.159.8', '2026-03-09 08:58:22'),
(221, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3.5-0.6X7.5(亞太)\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"completed\",\"priority\":null,\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 08:58:41'),
(222, 10, 'Added new calendar event', 'DashboardCalendarEvents', 2, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3X21 (鍍膜)\",\"description\":\"3\\/11鍍膜入M3.0-1.0X21.0MM 753+290kg 3\\/20交貨\",\"start_datetime\":\"2026-03-10 09:00:00\",\"end_datetime\":null,\"is_all_day\":0,\"status\":\"pending\",\"priority\":\"low\",\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 09:00:23'),
(223, 10, 'Updated calendar event', 'DashboardCalendarEvents', 2, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3X21 (鍍膜)\",\"description\":\"3\\/11鍍膜入M3.0-1.0X21.0MM 753+290kg 3\\/20交貨\",\"start_datetime\":\"2026-03-10 09:00:00\",\"end_datetime\":null,\"is_all_day\":0,\"status\":\"pending\",\"priority\":\"low\",\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 09:00:45'),
(224, 10, 'Updated calendar event', 'DashboardCalendarEvents', 1, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3.5-0.6X7.5(亞太)\",\"description\":\"亞太M3.5-0.6X7.5MM    1,526.042pcs 3\\/10交貨,趕3\\/17交貨\",\"start_datetime\":\"2026-03-09 10:10:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"completed\",\"priority\":null,\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 09:00:50'),
(225, 10, 'Updated calendar event', 'DashboardCalendarEvents', 2, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3X21 (鍍膜)\",\"description\":\"3\\/11鍍膜入M3.0-1.0X21.0MM 753+290kg 3\\/20交貨\",\"start_datetime\":\"2026-03-10 09:00:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"pending\",\"priority\":\"low\",\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 09:00:55'),
(226, 10, 'Updated calendar event', 'DashboardCalendarEvents', 2, '{\"event_type\":\"reminder\",\"title\":\"追貨-晴岡M3X21 (鍍膜)\",\"description\":\"3\\/11鍍膜入M3.0-1.0X21.0MM 753+290kg 3\\/20交貨\",\"start_datetime\":\"2026-03-10 09:00:00\",\"end_datetime\":null,\"is_all_day\":1,\"status\":\"pending\",\"priority\":\"low\",\"color\":\"#000000\"}', '36.238.159.8', '2026-03-09 09:01:03'),
(227, 10, 'Added new customer', 'Customers', 40, '{\"customer_number\":\"CU-A0010\",\"name\":\"華峰螺絲企業有限公司\"}', '36.238.159.8', '2026-03-09 09:08:13'),
(228, 10, 'Updated customer data', 'customers', 31, '{\"customer_number\":\"CU-A0001\",\"name\":\"托福實業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-695-1570\",\"invoice_title\":\"托福實業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"81358 高雄市左營區博愛二路366號26樓之1號\",\"shipping_address\":\"高雄市路竹區新生路334巷23號  (倉庫)\",\"contact_person\":\"鄭妁吟#23  又瑜#11\",\"phone\":\"07-695-2888\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"江小姐\",\"finance_contact_extension\":\"07-557-6366\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":20,\"reconciliation_day\":25,\"payment_method\":\"票期60天\",\"tax_id\":\"81209958\",\"invoice_attachment_path\":null,\"notes\":\"TEL :07-695-2608 (二倉)\\r\\n高雄總公司FAX:07-557-2177 \\/ 557-1977\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.159.8', '2026-03-09 09:08:30'),
(229, 10, 'Updated customer data', 'customers', 38, '{\"customer_number\":\"CU-A0008\",\"name\":\"尚展螺絲企業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-0069\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇\'S   王\'S   QC-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975-207-775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/345a1a677ac610e17351bc30760a2196.jpg\",\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.159.8', '2026-03-09 09:09:10'),
(230, 10, '新增訂單', 'Orders', 6, '{\"customer_id\":40,\"order_date\":\"2026-03-09\",\"expected_delivery_date\":\"2026-03-12\",\"customer_po_number\":null,\"status\":\"pending\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260309-0001\"}', '36.238.159.8', '2026-03-09 09:09:39'),
(231, 10, '新增訂單品項', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":42652.3297,\"total_price\":639.78}', '36.238.159.8', '2026-03-09 09:13:07'),
(232, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":42652.3297,\"total_price\":639.78}', '36.238.159.8', '2026-03-09 09:13:21'),
(233, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":42652.3297,\"total_price\":639.78}', '36.238.159.8', '2026-03-09 09:13:36'),
(234, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":39068.1004,\"total_price\":586.02}', '36.238.159.8', '2026-03-09 09:17:40'),
(235, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":39068.1004,\"total_price\":586.02}', '36.238.159.8', '2026-03-09 09:21:51'),
(236, 10, 'Added new work order', 'WorkOrders', 8, '{\"work_order_number\":\"WO-20260309-0001\",\"screening_defects_count\":0,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:24:52'),
(237, 10, 'Uploaded work order image', 'WorkOrderImages', 2, '{\"work_order_id\":8,\"file_name\":\"安拓-安克螺栓NG.jpg\"}', '36.238.159.8', '2026-03-09 09:25:33'),
(238, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:26:24'),
(239, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":4,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:27:30'),
(240, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":39068.1004,\"total_price\":586.02}', '36.238.159.8', '2026-03-09 09:28:27'),
(241, 10, '更新客戶批號', 'OrderItems', 10, '{\"order_id\":6,\"screening_item_id\":15,\"total_weight_kg\":119,\"total_units\":39068.1004,\"total_price\":586.02}', '36.238.159.8', '2026-03-09 09:28:36'),
(242, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":5,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:29:06'),
(243, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":5,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:39:09'),
(244, 10, 'Update First Piece Dimension', 'work_order_first_piece_dimensions', 8, '{\"measured_at\":\"2026-03-03T19:44\",\"measured_by_employee_id\":\"10\",\"notes\":null,\"head_height\":\"2.75\",\"head_width\":\"11.40\",\"length\":\"12.35\",\"thread_outer_diameter\":\"4.70\",\"washer_diameter\":null,\"outer_diameter\":null,\"hole_diameter\":null,\"thickness\":null,\"id\":8}', '36.238.159.8', '2026-03-09 09:42:57'),
(245, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":5,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 09:57:17'),
(246, 10, 'Updated work order', 'work_orders', 8, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":5,\"production_records_count\":1}', '36.238.159.8', '2026-03-09 10:00:23'),
(247, 10, '新增庫存品項', 'inventory_items', 10, '{\"work_order_id\":\"8\"}', '36.238.159.8', '2026-03-09 10:00:57'),
(248, 10, '新增庫存品項', 'inventory_items', 11, '{\"work_order_id\":\"8\"}', '36.238.159.8', '2026-03-09 10:06:38'),
(249, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.159.8', '2026-03-09 10:11:12'),
(250, 10, '新增訂單品項', 'OrderItems', 11, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.159.8', '2026-03-09 10:11:24'),
(251, 10, '更新訂單', 'Orders', 4, '{\"customer_id\":39,\"order_date\":\"2026-03-05\",\"expected_delivery_date\":\"2026-03-09\",\"customer_po_number\":\"null\",\"status\":\"pending\",\"total_amount\":30236.86,\"notes\":\"null\"}', '36.238.159.8', '2026-03-09 10:12:13'),
(252, 10, '更新客戶批號', 'OrderItems', 11, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3657,\"total_units\":143540.0517,\"total_price\":3588.5}', '36.238.159.8', '2026-03-09 10:12:33'),
(253, 10, '更新客戶批號', 'OrderItems', 6, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":11677,\"total_units\":461197.2438,\"total_price\":11529.93}', '36.238.159.8', '2026-03-09 10:12:44'),
(254, 10, '新增庫存品項', 'inventory_items', 12, '{\"work_order_id\":\"4\"}', '36.238.159.8', '2026-03-09 10:14:01'),
(255, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.172.173\"}', '36.238.172.173', '2026-03-10 00:16:17'),
(256, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.172.173\"}', '36.238.172.173', '2026-03-10 02:47:54'),
(257, 10, '新增訂單', 'Orders', 7, '{\"customer_id\":36,\"order_date\":\"2026-02-23\",\"expected_delivery_date\":\"2026-03-18\",\"customer_po_number\":null,\"status\":\"pending\",\"total_amount\":0,\"notes\":\"2\\/23+3\\/9\",\"order_number\":\"ORDER-20260223-0002\"}', '36.238.172.173', '2026-03-10 02:49:25'),
(258, 10, '新增訂單品項', 'OrderItems', 12, '{\"order_id\":7,\"screening_item_id\":16,\"total_weight_kg\":1446,\"total_units\":808750,\"total_price\":24262.5}', '36.238.172.173', '2026-03-10 02:53:06'),
(259, 10, '更新客戶批號', 'OrderItems', 12, '{\"order_id\":7,\"screening_item_id\":16,\"total_weight_kg\":1446,\"total_units\":808750,\"total_price\":24262.5}', '36.238.172.173', '2026-03-10 02:59:18'),
(260, 10, '更新客戶批號', 'OrderItems', 12, '{\"order_id\":7,\"screening_item_id\":16,\"total_weight_kg\":1446,\"total_units\":808750,\"total_price\":24262.5}', '36.238.172.173', '2026-03-10 03:00:16'),
(261, 10, 'Added new work order', 'WorkOrders', 9, '{\"work_order_number\":\"WO-20260310-0001\",\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.172.173', '2026-03-10 03:00:40'),
(262, 10, 'Updated work order', 'work_orders', 9, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.172.173', '2026-03-10 03:04:59'),
(263, 10, 'Updated work order', 'work_orders', 9, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":4}', '36.238.172.173', '2026-03-10 03:05:09'),
(264, 10, '更新客戶批號', 'OrderItems', 12, '{\"order_id\":7,\"screening_item_id\":16,\"total_weight_kg\":1858,\"total_units\":1042500,\"total_price\":31275}', '36.238.172.173', '2026-03-10 03:05:59'),
(265, 10, '更新客戶批號', 'OrderItems', 12, '{\"order_id\":7,\"screening_item_id\":16,\"total_weight_kg\":1858,\"total_units\":1042500,\"total_price\":31275}', '36.238.172.173', '2026-03-10 03:06:40'),
(266, 10, 'Updated work order', 'work_orders', 9, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":5}', '36.238.172.173', '2026-03-10 03:09:36'),
(267, 10, '新增訂單', 'Orders', 8, '{\"customer_id\":36,\"order_date\":\"2026-02-05\",\"expected_delivery_date\":null,\"customer_po_number\":\"33049-2\",\"status\":\"pending\",\"total_amount\":0,\"notes\":\"2\\/5+2\\/6+3\\/2+3\\/9\",\"order_number\":\"ORDER-20260205-0001\"}', '36.238.172.173', '2026-03-10 03:15:54'),
(268, 10, '新增訂單品項', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":745,\"total_units\":120540.5405,\"total_price\":2169.73}', '36.238.172.173', '2026-03-10 03:20:08'),
(269, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":745,\"total_units\":120540.5405,\"total_price\":2169.73}', '36.238.172.173', '2026-03-10 03:20:15'),
(270, 10, '新增訂單品項', 'OrderItems', 14, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":5577,\"total_units\":915855.8559,\"total_price\":16485.41}', '36.238.172.173', '2026-03-10 03:21:44'),
(271, 10, '更新訂單', 'Orders', 7, '{\"customer_id\":36,\"order_date\":\"2026-02-23\",\"expected_delivery_date\":\"2026-03-18\",\"customer_po_number\":\"100880\",\"status\":\"pending\",\"total_amount\":31275,\"notes\":\"2\\/23+3\\/9\"}', '36.238.172.173', '2026-03-10 03:22:14'),
(272, 10, 'Soft deleted customer', 'Customers', 11, '{\"customer_number\":\"CUST-011\",\"name\":\"太陽能源科技\"}', '36.238.172.173', '2026-03-10 03:27:32'),
(273, 10, 'Soft deleted customer', 'Customers', 12, '{\"customer_number\":\"CUST-012\",\"name\":\"精準醫療器材\"}', '36.238.172.173', '2026-03-10 03:27:35'),
(274, 10, 'Soft deleted customer', 'Customers', 13, '{\"customer_number\":\"CUST-013\",\"name\":\"宏觀國際物流\"}', '36.238.172.173', '2026-03-10 03:27:38'),
(275, 10, 'Soft deleted customer', 'Customers', 5, '{\"customer_number\":\"CUST-005\",\"name\":\"永固機械製造\"}', '36.238.172.173', '2026-03-10 03:27:48'),
(276, 10, 'Added new customer', 'Customers', 41, '{\"customer_number\":\"CU-A0011\",\"name\":\"冠旺螺絲工業有限公司\"}', '36.238.172.173', '2026-03-10 03:50:17'),
(277, 10, 'Soft deleted customer', 'Customers', 2, '{\"customer_number\":\"CUST-002\",\"name\":\"亞洲扣件有限公司\"}', '36.238.172.173', '2026-03-10 03:50:33'),
(278, 10, 'Soft deleted customer', 'Customers', 9, '{\"customer_number\":\"CUST-009\",\"name\":\"飛馬自行車\"}', '36.238.172.173', '2026-03-10 03:50:37'),
(279, 10, 'Added new customer', 'Customers', 42, '{\"customer_number\":\"CU-A0012\",\"name\":\"展搏國際有限公司\"}', '36.238.172.173', '2026-03-10 03:52:50'),
(280, 10, '客戶啟用', 'Customers', 42, '{\"customer_number\":\"CU-A0012\",\"name\":\"展搏國際有限公司\",\"is_active\":1}', '36.238.172.173', '2026-03-10 03:53:02'),
(281, 10, 'Soft deleted customer', 'Customers', 4, '{\"customer_number\":\"CUST-004\",\"name\":\"鑽前螺絲\"}', '36.238.172.173', '2026-03-10 03:53:11'),
(282, 10, 'Added new customer', 'Customers', 43, '{\"customer_number\":\"CU-A0013\",\"name\":\"力大螺絲工廠股份有限公司\"}', '36.238.172.173', '2026-03-10 03:56:16'),
(283, 10, 'Added new customer', 'Customers', 44, '{\"customer_number\":\"CU-A0014\",\"name\":\"玉錡企業股份有限公司\"}', '36.238.172.173', '2026-03-10 03:57:56'),
(284, 10, 'Updated customer data', 'customers', 34, '{\"customer_number\":\"CU-A0015\",\"name\":\"晴岡企業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-623-3329\",\"invoice_title\":\"晴岡企業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"820高雄市岡山區河華路6巷6-1號\",\"shipping_address\":\"820高雄市岡山區河華路6巷6-1號\",\"contact_person\":\"生管-潘素卿\'S#23  品管-王信富課長#12  品管-林\'R#15\",\"phone\":\"07-624-0066\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"黃小姐(對帳)\",\"finance_contact_extension\":\"02-87736423 #35\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"24481957\",\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":1000,\"weight_tolerance_percentage\":1}', '36.238.172.173', '2026-03-10 03:59:12'),
(285, 10, 'Added new customer', 'Customers', 45, '{\"customer_number\":\"CU-A0004\",\"name\":\"尚展螺絲企業有限公司\"}', '36.238.172.173', '2026-03-10 04:00:26'),
(286, 10, 'Soft deleted customer', 'Customers', 45, '{\"customer_number\":\"CU-A0004\",\"name\":\"尚展螺絲企業有限公司\"}', '36.238.172.173', '2026-03-10 04:00:44'),
(287, 10, 'Updated customer data', 'customers', 38, '{\"customer_number\":\"CU-A0004\",\"name\":\"尚展螺絲企業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-0069\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇\'S   王\'S   QC-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975-207-775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/345a1a677ac610e17351bc30760a2196.jpg\",\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.172.173', '2026-03-10 04:00:51'),
(288, 10, 'Updated customer data', 'customers', 38, '{\"customer_number\":\"CU-A0004\",\"name\":\"尚展螺絲企業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-1995 一樓   \\/ 07-632-0069 二樓\",\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇\'S   王\'S   QC-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975-207-775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/345a1a677ac610e17351bc30760a2196.jpg\",\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.172.173', '2026-03-10 04:01:19'),
(289, 10, 'Updated customer data', 'customers', 33, '{\"customer_number\":\"CU-A0003\",\"name\":\"益展工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-632-1995(一樓) \\/ 07-632-0069 (二樓)\",\"invoice_title\":\"益展工業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"生管-蘇亭綺\'S、王盈淑\'S  品管-王雪芬\'S\",\"phone\":\"07-632-0068\",\"email\":null,\"address\":null,\"sales_contact_person\":\"李忠義廠長\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0975207775\",\"sales_contact_email\":null,\"finance_contact_person\":\"黃惠雯\'S\",\"finance_contact_extension\":\"07-632-0069(-二樓傳真)\",\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":25,\"payment_method\":\"票期90天\",\"tax_id\":\"89829798\",\"invoice_attachment_path\":null,\"notes\":\"單重如在1.00以下，單重需做三位數\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.172.173', '2026-03-10 04:01:46'),
(290, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.172.173\"}', '36.238.172.173', '2026-03-11 00:29:25'),
(291, 10, 'Updated work order', 'work_orders', 5, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":26,\"screening_defects_count\":0,\"production_records_count\":18}', '36.238.172.173', '2026-03-11 00:30:15'),
(292, 10, 'Updated work order', 'work_orders', 5, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":18}', '36.238.172.173', '2026-03-11 00:33:09'),
(293, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:35:05'),
(294, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":5,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:35:33'),
(295, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3763,\"total_units\":148191.2145,\"total_price\":3704.78}', '36.238.172.173', '2026-03-11 00:38:17'),
(296, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3763,\"total_units\":148191.2145,\"total_price\":3704.78}', '36.238.172.173', '2026-03-11 00:38:56'),
(297, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:39:26'),
(298, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:39:50'),
(299, 10, 'Uploaded work order image', 'WorkOrderImages', 3, '{\"work_order_id\":4,\"file_name\":\"MX-3640FN_20260311_072519_001.jpg\"}', '36.238.172.173', '2026-03-11 00:41:13'),
(300, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-03-04 17:00:00\",\"actual_end_date\":\"2026-03-05 10:30:00\",\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:41:45'),
(301, 10, 'Updated work order', 'work_orders', 4, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":7,\"production_records_count\":6}', '36.238.172.173', '2026-03-11 00:44:05'),
(302, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3763,\"total_units\":148191.2145,\"total_price\":3704.78}', '36.238.172.173', '2026-03-11 00:45:16'),
(303, 10, '更新客戶批號', 'OrderItems', 4, '{\"order_id\":4,\"screening_item_id\":13,\"total_weight_kg\":3763,\"total_units\":148191.2145,\"total_price\":3704.78}', '36.238.172.173', '2026-03-11 00:58:15'),
(304, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.172.173\"}', '36.238.172.173', '2026-03-13 02:34:59'),
(305, 10, 'Added new supplier', 'Suppliers', 33, '{\"supplier_number\":\"SUP-D-001\",\"name\":\"陳木全\"}', '36.238.172.173', '2026-03-13 02:35:54'),
(306, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.172.173\"}', '36.238.172.173', '2026-03-13 09:09:20'),
(307, 10, 'Added new supplier', 'Suppliers', 34, '{\"supplier_number\":\"SUP-D-002\",\"name\":\"第一銀行\"}', '36.238.172.173', '2026-03-13 09:12:01'),
(308, 10, 'Added new supplier', 'Suppliers', 35, '{\"supplier_number\":\"SUP-D-003\",\"name\":\"平實會計事務所\"}', '36.238.172.173', '2026-03-13 09:14:15'),
(309, 10, 'Added new customer', 'Customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\"}', '36.238.172.173', '2026-03-13 09:29:06'),
(310, 10, 'Updated customer data', 'customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":null,\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.172.173', '2026-03-13 09:29:27'),
(311, 10, 'Updated customer data', 'customers', 39, '{\"customer_number\":\"CU-A0009\",\"name\":\"弘吉螺絲工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-2548455\",\"invoice_title\":\"弘吉螺絲工業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"710026台南市永康區鹽行里中正三街453號 (辦公室)\",\"shipping_address\":null,\"contact_person\":\"楊\'S\",\"phone\":\"06-2539690\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":5,\"payment_method\":\"票期90天\",\"tax_id\":\"16415384\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.172.173', '2026-03-13 09:29:37'),
(312, 10, 'Updated customer data', 'customers', 41, '{\"customer_number\":\"CU-A0011\",\"name\":\"冠旺螺絲工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-254-8455\",\"invoice_title\":\"冠旺螺絲工業有限公司\",\"company_registered_address\":null,\"invoice_address\":\"710026台南市永康區鹽行里中正三街453號 (辦公室)\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R    周\'S\",\"phone\":\"06-253-9691\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"票期90天\",\"tax_id\":\"22251043\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.172.173', '2026-03-13 09:29:44'),
(313, 10, 'Updated customer data', 'customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":null,\"invoice_address\":\"71066 台南市永康區中正三街453號\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":null,\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.172.173', '2026-03-13 09:30:22'),
(314, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.4.144\"}', '218.166.4.144', '2026-03-16 06:39:52'),
(315, 10, 'Added new customer', 'Customers', 47, '{\"customer_number\":\"CU-A0017\",\"name\":\"福輝螺絲工廠股份有限公司\"}', '218.166.4.144', '2026-03-16 06:43:22'),
(316, 10, 'Updated customer data', 'customers', 47, '{\"customer_number\":\"CU-A0017\",\"name\":\"福輝螺絲工廠股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-6282-117\",\"invoice_title\":\"福輝螺絲工廠股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"820104高雄市岡山區嘉華路21號\",\"shipping_address\":null,\"contact_person\":\"生管-藺鳳燕\'S #14      品管#19\",\"phone\":\"07-628-1547\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"高媛\'S # 28\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"88732487\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/ac0dfc3f72c3039798208c599ab410e0.jpg\",\"notes\":\"發票 : 螺絲加工費 ，\\u000b秀重量\",\"is_active\":1,\"minimum_order_amount\":2500,\"weight_tolerance_percentage\":1}', '218.166.4.144', '2026-03-16 06:43:49'),
(317, 10, 'Updated customer data', 'customers', 47, '{\"customer_number\":\"CU-A0017\",\"name\":\"福輝螺絲工廠股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-6282-117\",\"invoice_title\":\"福輝螺絲工廠股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"820104高雄市岡山區嘉華路21號\",\"shipping_address\":null,\"contact_person\":\"生管-藺鳳燕\'S #14      品管#19 陳先生\",\"phone\":\"07-628-1547\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"高媛\'S # 28\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"88732487\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/ac0dfc3f72c3039798208c599ab410e0.jpg\",\"notes\":\"發票 : 螺絲加工費 ，\\u000b秀重量\",\"is_active\":1,\"minimum_order_amount\":2500,\"weight_tolerance_percentage\":1}', '218.166.4.144', '2026-03-16 07:05:20'),
(318, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.4.144\"}', '218.166.4.144', '2026-03-17 02:06:36'),
(319, 10, 'Updated customer data', 'customers', 39, '{\"customer_number\":\"CU-A0009\",\"name\":\"弘吉螺絲工業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-2548455\",\"invoice_title\":\"弘吉螺絲工業股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"710026台南市永康區鹽行里中正三街453號 (辦公室)\",\"shipping_address\":null,\"contact_person\":\"楊\'S\",\"phone\":\"06-2539690\",\"email\":null,\"address\":null,\"sales_contact_person\":\"林暢鋥\'r\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":5,\"payment_method\":\"票期90天\",\"tax_id\":\"16415384\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '218.166.4.144', '2026-03-17 02:07:04'),
(320, 10, 'Updated customer data', 'customers', 41, '{\"customer_number\":\"CU-A0011\",\"name\":\"冠旺螺絲工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-254-8455\",\"invoice_title\":\"冠旺螺絲工業有限公司\",\"company_registered_address\":null,\"invoice_address\":\"710026台南市永康區鹽行里中正三街453號 (辦公室)\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R    周\'S\",\"phone\":\"06-253-9691\",\"email\":null,\"address\":null,\"sales_contact_person\":\"林暢鋥\'R\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"票期90天\",\"tax_id\":\"22251043\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '218.166.4.144', '2026-03-17 02:07:18'),
(321, 10, 'Updated customer data', 'customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":null,\"invoice_address\":\"71066 台南市永康區中正三街453號\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":\"林暢鋥\'R\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":null,\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '218.166.4.144', '2026-03-17 02:07:34'),
(322, 10, 'Updated customer data', 'customers', 42, '{\"customer_number\":\"CU-A0012\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-254-8455\",\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":\"臺南市永康區塩行里中正五街156號\",\"invoice_address\":\"710026台南市永康區鹽行里中正三街453號 (辦公室)\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":\"06-253-9691\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":null,\"payment_method\":\"票期90天\",\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '218.166.4.144', '2026-03-17 02:40:16'),
(323, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"218.166.4.144\"}', '218.166.4.144', '2026-03-17 09:52:48'),
(324, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"218.166.4.144\"}', '218.166.4.144', '2026-03-17 09:57:28'),
(325, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '218.166.4.144', '2026-03-17 09:58:51'),
(326, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":775,\"total_units\":125945.9459,\"total_price\":2267.03}', '218.166.4.144', '2026-03-17 10:15:29'),
(327, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":775,\"total_units\":125945.9459,\"total_price\":2267.03}', '218.166.4.144', '2026-03-17 10:15:47');
INSERT INTO `audit_logs` (`id`, `employee_id`, `action`, `target_table`, `target_id`, `details`, `ip_address`, `created_at`) VALUES
(328, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":775,\"total_units\":124144.1441,\"total_price\":2234.59}', '218.166.4.144', '2026-03-17 10:17:31'),
(329, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":775,\"total_units\":125945.9459,\"total_price\":2267.03}', '218.166.4.144', '2026-03-17 10:21:04'),
(330, 10, 'Added new work order', 'WorkOrders', 10, '{\"work_order_number\":\"WO-20260317-0001\",\"screening_defects_count\":0,\"production_records_count\":2}', '218.166.4.144', '2026-03-17 10:22:48'),
(331, 10, 'Updated work order', 'work_orders', 10, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"300\",\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":2}', '218.166.4.144', '2026-03-17 10:23:32'),
(332, 10, 'Updated work order', 'work_orders', 10, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":\"300\",\"status_lookup_id\":28,\"screening_defects_count\":3,\"production_records_count\":2}', '218.166.4.144', '2026-03-17 10:23:48'),
(333, 10, '更新客戶批號', 'OrderItems', 13, '{\"order_id\":8,\"screening_item_id\":17,\"total_weight_kg\":775,\"total_units\":125945.9459,\"total_price\":2267.03}', '218.166.4.144', '2026-03-17 10:51:02'),
(334, 10, '新增庫存品項', 'inventory_items', 13, '{\"work_order_id\":\"10\"}', '218.166.4.144', '2026-03-17 10:55:16'),
(335, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.150.195\"}', '36.238.150.195', '2026-03-18 05:44:07'),
(336, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.150.195', '2026-03-18 05:44:23'),
(337, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.150.195\"}', '36.238.150.195', '2026-03-19 06:16:29'),
(338, 10, 'Added new customer', 'Customers', 48, '{\"customer_number\":\"CU-A0018\",\"name\":\"鉅群科技有限公司\"}', '36.238.150.195', '2026-03-19 06:19:37'),
(339, 10, 'Updated customer data', 'customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":null,\"invoice_address\":\"71066 台南市永康區中正三街453號\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":\"林暢鋥\'R\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":null,\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.150.195', '2026-03-19 06:20:20'),
(340, 10, 'Updated customer data', 'customers', 44, '{\"customer_number\":\"CU-A0014\",\"name\":\"玉錡企業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"王珮瑜\'S #107   戴怡莉\'S#110\",\"phone\":\"07-696-1290\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":3}', '36.238.150.195', '2026-03-19 06:20:29'),
(341, 10, 'Updated customer data', 'customers', 43, '{\"customer_number\":\"CU-A0013\",\"name\":\"力大螺絲工廠股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-624-6033 \\/ 07-624-6088\",\"invoice_title\":\"力大螺絲工廠股份有限公司\",\"company_registered_address\":null,\"invoice_address\":\"82059高雄市岡山區本工東一路1號\",\"shipping_address\":null,\"contact_person\":\"廖勻凰#307\",\"phone\":\"07-624-8088\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":\"孫\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期90天\",\"tax_id\":\"34426672\",\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.150.195', '2026-03-19 06:20:35'),
(342, 10, 'Updated customer data', 'customers', 44, '{\"customer_number\":\"CU-A0014\",\"name\":\"玉錡企業股份有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":null,\"company_registered_address\":null,\"invoice_address\":null,\"shipping_address\":null,\"contact_person\":\"王珮瑜\'S #107   戴怡莉\'S#110\",\"phone\":\"07-696-1290\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":null,\"reconciliation_day\":null,\"payment_method\":null,\"tax_id\":null,\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.150.195', '2026-03-19 06:20:39'),
(343, 10, 'Updated customer data', 'customers', 46, '{\"customer_number\":\"CU-A0016\",\"name\":\"展搏國際有限公司\",\"product_category\":null,\"website\":null,\"fax\":null,\"invoice_title\":\"展搏國際有限公司\",\"company_registered_address\":null,\"invoice_address\":\"71066 台南市永康區中正三街453號\",\"shipping_address\":null,\"contact_person\":\"林暢鋥\'R   周\'S\",\"phone\":null,\"email\":null,\"address\":null,\"sales_contact_person\":\"林暢鋥\'R\",\"sales_contact_extension\":null,\"sales_contact_mobile\":\"0932732251\",\"sales_contact_email\":null,\"finance_contact_person\":\"周\'S\",\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":null,\"tax_id\":\"45896501\",\"invoice_attachment_path\":null,\"notes\":\"弘吉=冠旺=展搏\",\"is_active\":1,\"minimum_order_amount\":2000,\"weight_tolerance_percentage\":1}', '36.238.150.195', '2026-03-19 06:20:44'),
(344, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.150.195\"}', '36.238.150.195', '2026-03-20 01:55:09'),
(345, 10, 'Added new supplier', 'Suppliers', 36, '{\"supplier_number\":\"SUP-D-004\",\"name\":\"回收大姐-琴仔\"}', '36.238.150.195', '2026-03-20 02:07:18'),
(346, 10, 'Updated supplier data', 'suppliers', 36, '{\"supplier_number\":\"SUP-D-004\",\"name\":\"回收大姐-琴仔\",\"service_type\":\"資源回收\",\"supplier_type\":null,\"product_category\":null,\"owner\":null,\"contact_person\":\"回收大姐-琴仔\",\"contact_mobile\":\"0921-263-122\",\"phone\":null,\"fax\":null,\"address\":null,\"factory_address\":null,\"payment_method\":null,\"bank_account_name\":null,\"bank_name\":null,\"bank_code\":null,\"bank_branch_name\":null,\"bank_branch_code\":null,\"email\":null,\"tax_id\":null,\"bank_account_number\":null,\"attachment_path\":null,\"notes\":null}', '36.238.150.195', '2026-03-20 02:07:50'),
(347, 10, 'Added new supplier', 'Suppliers', 37, '{\"supplier_number\":\"SUP-D-005\",\"name\":\"柏泉企業社\"}', '36.238.150.195', '2026-03-20 02:09:55'),
(348, 10, 'Updated supplier data', 'suppliers', 37, '{\"supplier_number\":\"SUP-D-005\",\"name\":\"柏泉企業社\",\"service_type\":\"桶裝水\",\"supplier_type\":null,\"product_category\":null,\"owner\":null,\"contact_person\":\"張俊國\'r\",\"contact_mobile\":\"0983-023-816\",\"phone\":\"07-607-5158\",\"fax\":null,\"address\":null,\"factory_address\":null,\"payment_method\":\"月結30天\",\"bank_account_name\":null,\"bank_name\":null,\"bank_code\":null,\"bank_branch_name\":null,\"bank_branch_code\":null,\"email\":null,\"tax_id\":null,\"bank_account_number\":null,\"attachment_path\":null,\"notes\":null}', '36.238.150.195', '2026-03-20 02:10:13'),
(349, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.132.227\"}', '36.238.132.227', '2026-03-21 01:07:58'),
(350, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"61.227.49.223\"}', '61.227.49.223', '2026-03-22 06:06:32'),
(351, 10, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '61.227.49.223', '2026-03-22 08:02:41'),
(352, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.162.19\"}', '36.238.162.19', '2026-03-23 01:15:24'),
(353, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.162.19\"}', '36.238.162.19', '2026-03-24 03:36:39'),
(354, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.162.19\"}', '36.238.162.19', '2026-03-24 11:03:44'),
(355, 10, 'Added new customer', 'Customers', 49, '{\"customer_number\":\"CU-A0019\",\"name\":\"神洲螺絲工業有限公司\"}', '36.238.162.19', '2026-03-24 11:06:22'),
(356, 10, 'Added new customer', 'Customers', 50, '{\"customer_number\":\"CU-A0020\",\"name\":\"橙品工業股份有限公司\"}', '36.238.162.19', '2026-03-24 11:08:35'),
(357, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.180.83\"}', '36.238.180.83', '2026-03-27 08:58:59'),
(358, 11, '更新安全設定', 'SystemParameters', NULL, '{\"updated_keys\":[\"security.auto_refresh.enabled\",\"security.auto_refresh.interval_minutes\",\"security.auto_logout.enabled\",\"security.auto_logout.idle_minutes\",\"security.auto_logout.warning_seconds\",\"security.lockout.enabled\",\"security.lockout.max_attempts\",\"security.lockout.window_minutes\"]}', '36.238.180.83', '2026-03-27 08:59:06'),
(359, 11, '登入系統', 'employees', 11, '{\"account\":\"KUO\",\"ip\":\"36.238.180.83\"}', '36.238.180.83', '2026-03-27 09:02:50'),
(360, 11, 'Added new customer', 'Customers', 51, '{\"customer_number\":\"CU-A0021\",\"name\":\"傑聯工業有限公司\"}', '36.238.180.83', '2026-03-27 09:18:21'),
(361, 11, 'Updated customer data', 'customers', 1, '{\"customer_number\":\"CU-A0022\",\"name\":\"鋐聯昇模具有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-2783332\",\"invoice_title\":null,\"company_registered_address\":\"台南市歸仁區長榮路一段70巷51號\",\"invoice_address\":\"台南市歸仁區長榮路一段70巷51號\",\"shipping_address\":\"台南市歸仁區長榮路一段70巷51號\",\"contact_person\":\"涂琳螢\",\"phone\":\"06-2782156 06-2783331\",\"email\":null,\"address\":\"台南市歸仁區長榮路一段70巷51號\",\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"月結60天\",\"tax_id\":null,\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/3ae85deb59aabd07d23b456567eaf252.png\",\"notes\":\"對帳日  -帳單寄出前\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.180.83', '2026-03-27 09:29:16'),
(362, 11, 'Updated customer data', 'customers', 51, '{\"customer_number\":\"CU-A0021\",\"name\":\"傑聯工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-6971725\",\"invoice_title\":null,\"company_registered_address\":\"高雄市路竹區中山路136號\",\"invoice_address\":\"高雄市路竹區中山路136號\",\"shipping_address\":\"高雄市路竹區中山路136號\",\"contact_person\":\"生管黃\'S\",\"phone\":\"07-6971723\",\"email\":null,\"address\":null,\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"89303631\",\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.180.83', '2026-03-27 09:31:49'),
(363, 11, 'Updated customer data', 'customers', 1, '{\"customer_number\":\"CU-A0022\",\"name\":\"鋐聯昇模具有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"06-2783332\",\"invoice_title\":null,\"company_registered_address\":\"台南市歸仁區長榮路一段70巷51號\",\"invoice_address\":\"台南市歸仁區長榮路一段70巷51號\",\"shipping_address\":\"台南市歸仁區長榮路一段70巷51號\",\"contact_person\":\"涂琳螢\",\"phone\":\"06-2782156 06-2783331\",\"email\":null,\"address\":\"台南市保安里文賢一段628號2樓\",\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":25,\"reconciliation_day\":30,\"payment_method\":\"月結60天\",\"tax_id\":\"89303631\",\"invoice_attachment_path\":\"uploads\\/invoice_stamps\\/3ae85deb59aabd07d23b456567eaf252.png\",\"notes\":\"對帳日  -帳單寄出前\",\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.180.83', '2026-03-27 09:36:05'),
(364, 11, 'Updated customer data', 'customers', 51, '{\"customer_number\":\"CU-A0021\",\"name\":\"傑聯工業有限公司\",\"product_category\":null,\"website\":null,\"fax\":\"07-6971725\",\"invoice_title\":null,\"company_registered_address\":\"高雄市路竹區中山路136號\",\"invoice_address\":\"高雄市路竹區中山路136號\",\"shipping_address\":\"高雄市路竹區中山路136號\",\"contact_person\":\"生管黃\'S\",\"phone\":\"07-6971723\",\"email\":null,\"address\":\"台北市內湖區新溯三路132號6樓\",\"sales_contact_person\":null,\"sales_contact_extension\":null,\"sales_contact_mobile\":null,\"sales_contact_email\":null,\"finance_contact_person\":null,\"finance_contact_extension\":null,\"finance_contact_mobile\":null,\"finance_contact_email\":null,\"billing_day\":30,\"reconciliation_day\":5,\"payment_method\":\"票期60天\",\"tax_id\":\"84845117\",\"invoice_attachment_path\":null,\"notes\":null,\"is_active\":1,\"minimum_order_amount\":0,\"weight_tolerance_percentage\":3}', '36.238.180.83', '2026-03-27 09:38:08'),
(365, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.149.55\"}', '36.238.149.55', '2026-04-02 11:34:10'),
(366, 10, '客戶啟用', 'Customers', 50, '{\"customer_number\":\"CU-A0020\",\"name\":\"橙品工業股份有限公司\",\"is_active\":1}', '36.238.149.55', '2026-04-02 11:35:18'),
(367, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.135.148\"}', '36.238.135.148', '2026-04-10 07:42:34'),
(368, 10, '登入系統', 'employees', 10, '{\"account\":\"YVONNE\",\"ip\":\"36.238.149.177\"}', '36.238.149.177', '2026-04-17 10:14:08'),
(369, 10, '新增訂單', 'Orders', 9, '{\"customer_id\":41,\"order_date\":\"2026-04-17\",\"expected_delivery_date\":\"2026-05-15\",\"customer_po_number\":\"I07-1150411-1 (SU041101-8D)\",\"status\":\"confirmed\",\"total_amount\":0,\"notes\":\"宗連入\",\"order_number\":\"ORDER-20260417-0001\"}', '36.238.149.177', '2026-04-17 10:57:43'),
(370, 10, '刪除訂單', 'Orders', 9, NULL, '36.238.149.177', '2026-04-17 10:58:58'),
(371, 10, '新增訂單', 'Orders', 10, '{\"customer_id\":41,\"order_date\":\"2026-04-17\",\"expected_delivery_date\":\"2026-05-15\",\"customer_po_number\":\"I07-1-1150411-1(TU041101-6D)\",\"status\":\"confirmed\",\"total_amount\":0,\"notes\":\"建中入\",\"order_number\":\"ORDER-20260417-0001\"}', '36.238.149.177', '2026-04-17 10:59:32'),
(372, 10, '刪除訂單', 'Orders', 10, NULL, '36.238.149.177', '2026-04-17 11:00:30'),
(373, 10, '新增訂單', 'Orders', 11, '{\"customer_id\":46,\"order_date\":\"2026-04-17\",\"expected_delivery_date\":\"2026-05-15\",\"customer_po_number\":\"I07-1-1150411-1 (TU041101-6D)\",\"status\":\"pending\",\"total_amount\":0,\"notes\":\"建中入\",\"order_number\":\"ORDER-20260417-0001\"}', '36.238.149.177', '2026-04-17 11:01:09'),
(374, 10, '新增訂單品項', 'OrderItems', 15, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":2317,\"total_units\":374919.0939,\"total_price\":6748.54}', '36.238.149.177', '2026-04-17 11:02:31'),
(375, 10, '更新客戶批號', 'OrderItems', 15, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":2317,\"total_units\":374919.0939,\"total_price\":6748.54}', '36.238.149.177', '2026-04-17 11:03:53'),
(376, 10, '更新客戶批號', 'OrderItems', 15, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":2317,\"total_units\":316666.6667,\"total_price\":5700}', '36.238.149.177', '2026-04-17 11:07:28'),
(377, 10, '更新客戶批號', 'OrderItems', 15, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":2317,\"total_units\":316666.6667,\"total_price\":5700}', '36.238.149.177', '2026-04-17 11:07:44'),
(378, 10, 'Added new work order', 'WorkOrders', 11, '{\"work_order_number\":\"WO-20260417-0001\",\"screening_defects_count\":0,\"production_records_count\":6}', '36.238.149.177', '2026-04-17 11:08:43'),
(379, 10, '新增訂單品項', 'OrderItems', 16, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":3000,\"total_units\":417475.7282,\"total_price\":7514.56}', '36.238.149.177', '2026-04-17 11:09:23'),
(380, 10, '更新客戶批號', 'OrderItems', 16, '{\"order_id\":11,\"screening_item_id\":18,\"total_weight_kg\":3000,\"total_units\":417475.7282,\"total_price\":7514.56}', '36.238.149.177', '2026-04-17 11:09:42'),
(381, 10, '登入系統', 'employees', 10, '{\"account\":\"YVONNE\",\"ip\":\"36.238.149.177\"}', '36.238.149.177', '2026-04-17 12:41:06'),
(382, 1, '登入系統', 'employees', 1, '{\"account\":\"admin\",\"ip\":\"1.175.226.227\"}', '1.175.226.227', '2026-04-27 14:14:11'),
(383, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.143.35\"}', '36.238.143.35', '2026-04-28 11:10:15'),
(384, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.143.35\"}', '36.238.143.35', '2026-04-29 02:47:23'),
(385, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.154.49\"}', '36.238.154.49', '2026-04-30 05:37:49'),
(386, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"61.227.58.135\"}', '61.227.58.135', '2026-05-04 14:31:07'),
(387, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-05 05:47:27'),
(388, 10, 'Soft deleted customer', 'Customers', 18, '{\"customer_number\":\"CUST-018\",\"name\":\"海洋船舶重工\"}', '36.238.160.7', '2026-05-05 05:50:29'),
(389, 10, 'Soft deleted customer', 'Customers', 19, '{\"customer_number\":\"CUST-019\",\"name\":\"綠野農機設備\"}', '36.238.160.7', '2026-05-05 05:50:35'),
(390, 10, 'Soft deleted customer', 'Customers', 20, '{\"customer_number\":\"CUST-020\",\"name\":\"智造機器人\"}', '36.238.160.7', '2026-05-05 05:50:41'),
(391, 10, 'Soft deleted customer', 'Customers', 21, '{\"customer_number\":\"CUST-021\",\"name\":\"金鑽螺絲五金\"}', '36.238.160.7', '2026-05-05 05:50:45'),
(392, 10, 'Soft deleted customer', 'Customers', 22, '{\"customer_number\":\"CUST-022\",\"name\":\"聯合國際開發\"}', '36.238.160.7', '2026-05-05 05:50:51'),
(393, 10, 'Soft deleted customer', 'Customers', 23, '{\"customer_number\":\"CUST-023\",\"name\":\"幸福家居生活\"}', '36.238.160.7', '2026-05-05 05:50:56'),
(394, 10, 'Soft deleted customer', 'Customers', 24, '{\"customer_number\":\"CUST-024\",\"name\":\"奔騰運動用品\"}', '36.238.160.7', '2026-05-05 05:51:00'),
(395, 10, 'Soft deleted customer', 'Customers', 25, '{\"customer_number\":\"CUST-025\",\"name\":\"星辰精密光學\"}', '36.238.160.7', '2026-05-05 05:51:04'),
(396, 10, 'Soft deleted customer', 'Customers', 8, '{\"customer_number\":\"CUST-008\",\"name\":\"新世代電子\"}', '36.238.160.7', '2026-05-05 05:51:11'),
(397, 10, 'Soft deleted customer', 'Customers', 27, '{\"customer_number\":\"CUST-027\",\"name\":\"世紀船舶配件公司\"}', '36.238.160.7', '2026-05-05 05:51:18'),
(398, 10, 'Soft deleted customer', 'Customers', 26, '{\"customer_number\":\"CUST-026\",\"name\":\"卓越模具科技\"}', '36.238.160.7', '2026-05-05 05:51:25'),
(399, 10, 'Soft deleted customer', 'Customers', 17, '{\"customer_number\":\"CUST-017\",\"name\":\"天翔航空工業\"}', '36.238.160.7', '2026-05-05 05:51:30'),
(400, 10, 'Added new customer', 'Customers', 52, '{\"customer_number\":\"CU-A0023\",\"name\":\"三能螺栓工業股份有限公司\"}', '36.238.160.7', '2026-05-05 05:54:06'),
(401, 10, '新增訂單', 'Orders', 12, '{\"customer_id\":52,\"order_date\":\"2026-04-29\",\"expected_delivery_date\":\"2026-05-11\",\"customer_po_number\":\"B226037\",\"status\":\"confirmed\",\"total_amount\":0,\"notes\":null,\"order_number\":\"ORDER-20260429-0001\"}', '36.238.160.7', '2026-05-05 05:55:12'),
(402, 10, '新增訂單品項', 'OrderItems', 17, '{\"order_id\":12,\"screening_item_id\":19,\"total_weight_kg\":343,\"total_units\":411594.2029,\"total_price\":6585.51}', '36.238.160.7', '2026-05-05 06:02:21'),
(403, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-05 07:19:44'),
(404, 10, 'Added new work order', 'WorkOrders', 12, '{\"work_order_number\":\"WO-20260505-0001\",\"screening_defects_count\":0,\"production_records_count\":1}', '36.238.160.7', '2026-05-05 07:23:03'),
(405, 10, '新增訂單', 'Orders', 13, '{\"customer_id\":38,\"order_date\":\"2026-05-05\",\"expected_delivery_date\":null,\"customer_po_number\":\"260-11412058_4\",\"status\":\"pending\",\"total_amount\":0,\"notes\":\"12圓4\",\"order_number\":\"ORDER-20260505-0001\"}', '36.238.160.7', '2026-05-05 07:36:56'),
(406, 10, '新增訂單品項', 'OrderItems', 18, '{\"order_id\":13,\"screening_item_id\":20,\"total_weight_kg\":2016,\"total_units\":123076.9231,\"total_price\":5292.31}', '36.238.160.7', '2026-05-05 08:07:25'),
(407, 10, '更新客戶批號', 'OrderItems', 18, '{\"order_id\":13,\"screening_item_id\":20,\"total_weight_kg\":2016,\"total_units\":114529.9145,\"total_price\":4924.79}', '36.238.160.7', '2026-05-05 08:10:05'),
(408, 10, '更新客戶批號', 'OrderItems', 18, '{\"order_id\":13,\"screening_item_id\":20,\"total_weight_kg\":2016,\"total_units\":114529.9145,\"total_price\":4924.79}', '36.238.160.7', '2026-05-05 08:13:16'),
(409, 10, '更新客戶批號', 'OrderItems', 18, '{\"order_id\":13,\"screening_item_id\":20,\"total_weight_kg\":2016,\"total_units\":114529.9145,\"total_price\":4924.79}', '36.238.160.7', '2026-05-05 08:13:26'),
(410, 10, 'Added new work order', 'WorkOrders', 13, '{\"work_order_number\":\"WO-20260505-0002\",\"screening_defects_count\":0,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:13:50'),
(411, 10, 'Updated work order', 'work_orders', 13, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":25,\"screening_defects_count\":0,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:14:54'),
(412, 10, 'Updated work order', 'work_orders', 12, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-05-01 15:30:00\",\"actual_end_date\":\"2026-05-04 21:39:00\",\"quantity_to_produce\":13200,\"screening_speed\":\"250\",\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":1}', '36.238.160.7', '2026-05-05 08:15:35'),
(413, 10, 'Updated work order', 'work_orders', 13, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":0,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:15:48'),
(414, 10, 'Updated work order', 'work_orders', 13, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":null,\"actual_end_date\":null,\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:16:15'),
(415, 10, 'Updated work order', 'work_orders', 13, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-05-01 15:30:00\",\"actual_end_date\":\"2026-05-04 21:39:00\",\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:17:43'),
(416, 10, 'Updated work order', 'work_orders', 13, '{\"machine_id\":null,\"assigned_employee_id\":null,\"calibration_employee_id\":null,\"scheduled_start_date\":null,\"scheduled_end_date\":null,\"actual_start_date\":\"2026-05-01 15:30:00\",\"actual_end_date\":\"2026-05-04 21:39:00\",\"quantity_to_produce\":null,\"screening_speed\":null,\"status_lookup_id\":28,\"screening_defects_count\":2,\"production_records_count\":14}', '36.238.160.7', '2026-05-05 08:17:53'),
(417, 10, '新增訂單品項', 'OrderItems', 19, '{\"order_id\":13,\"screening_item_id\":20,\"total_weight_kg\":2800,\"total_units\":162393.1624,\"total_price\":6982.91}', '36.238.160.7', '2026-05-05 08:25:00'),
(418, 10, '登出系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-05 08:47:12'),
(419, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-05 08:48:19'),
(420, 10, '新增庫存品項', 'inventory_items', 16, '{\"work_order_id\":\"13\"}', '36.238.160.7', '2026-05-05 09:17:51'),
(421, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-06 07:47:14'),
(422, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-06 07:49:41'),
(423, 10, '登入系統', 'employees', 10, '{\"account\":\"yvonne\",\"ip\":\"36.238.160.7\"}', '36.238.160.7', '2026-05-06 10:05:40'),
(424, 10, 'Soft deleted supplier', 'Suppliers', 3, '{\"supplier_number\":\"SUPP-003\",\"name\":\"通達物流運輸\"}', '36.238.160.7', '2026-05-06 10:14:12'),
(425, 10, 'Soft deleted supplier', 'Suppliers', 1, '{\"supplier_number\":\"SUPP-001\",\"name\":\"精銳材料科技\"}', '36.238.160.7', '2026-05-06 10:14:15'),
(426, 10, 'Soft deleted supplier', 'Suppliers', 4, '{\"supplier_number\":\"SUPP-004\",\"name\":\"永續包材公司\"}', '36.238.160.7', '2026-05-06 10:14:17'),
(427, 10, 'Soft deleted supplier', 'Suppliers', 6, '{\"supplier_number\":\"SUPP-006\",\"name\":\"一品電鍍工業\"}', '36.238.160.7', '2026-05-06 10:14:19'),
(428, 10, 'Soft deleted supplier', 'Suppliers', 5, '{\"supplier_number\":\"SUPP-005\",\"name\":\"全方位檢測\"}', '36.238.160.7', '2026-05-06 10:14:22'),
(429, 10, 'Soft deleted supplier', 'Suppliers', 2, '{\"supplier_number\":\"SUPP-002\",\"name\":\"宏利熱處理\"}', '36.238.160.7', '2026-05-06 10:14:24'),
(430, 10, 'Soft deleted supplier', 'Suppliers', 7, '{\"supplier_number\":\"SUPP-007\",\"name\":\"德商儀器校正\"}', '36.238.160.7', '2026-05-06 10:14:29'),
(431, 10, 'Soft deleted supplier', 'Suppliers', 8, '{\"supplier_number\":\"SUPP-008\",\"name\":\"日月光潤滑油\"}', '36.238.160.7', '2026-05-06 10:14:31'),
(432, 10, 'Soft deleted supplier', 'Suppliers', 9, '{\"supplier_number\":\"SUPP-009\",\"name\":\"松柏資訊系統\"}', '36.238.160.7', '2026-05-06 10:14:36'),
(433, 10, 'Soft deleted supplier', 'Suppliers', 11, '{\"supplier_number\":\"SUPP-011\",\"name\":\"泰坦工具機\"}', '36.238.160.7', '2026-05-06 10:14:38'),
(434, 10, 'Soft deleted supplier', 'Suppliers', 12, '{\"supplier_number\":\"SUPP-012\",\"name\":\"福爾摩沙模具\"}', '36.238.160.7', '2026-05-06 10:14:41'),
(435, 10, 'Soft deleted supplier', 'Suppliers', 10, '{\"supplier_number\":\"SUPP-010\",\"name\":\"綠能環保工程\"}', '36.238.160.7', '2026-05-06 10:14:44'),
(436, 10, 'Soft deleted supplier', 'Suppliers', 13, '{\"supplier_number\":\"SUPP-013\",\"name\":\"安全守衛保全\"}', '36.238.160.7', '2026-05-06 10:14:46'),
(437, 10, 'Soft deleted supplier', 'Suppliers', 14, '{\"supplier_number\":\"SUPP-014\",\"name\":\"亞力山大氣體\"}', '36.238.160.7', '2026-05-06 10:14:48'),
(438, 10, 'Soft deleted supplier', 'Suppliers', 16, '{\"supplier_number\":\"SUPP-016\",\"name\":\"華佗勞工健檢\"}', '36.238.160.7', '2026-05-06 10:14:51'),
(439, 10, 'Soft deleted supplier', 'Suppliers', 17, '{\"supplier_number\":\"SUPP-017\",\"name\":\"牛頓力學顧問\"}', '36.238.160.7', '2026-05-06 10:14:53'),
(440, 10, 'Soft deleted supplier', 'Suppliers', 15, '{\"supplier_number\":\"SUPP-015\",\"name\":\"達文西設計\"}', '36.238.160.7', '2026-05-06 10:14:55'),
(441, 10, 'Soft deleted supplier', 'Suppliers', 19, '{\"supplier_number\":\"SUPP-019\",\"name\":\"居禮夫人化工\"}', '36.238.160.7', '2026-05-06 10:14:57'),
(442, 10, 'Soft deleted supplier', 'Suppliers', 20, '{\"supplier_number\":\"SUPP-020\",\"name\":\"愛迪生電力\"}', '36.238.160.7', '2026-05-06 10:15:00'),
(443, 10, 'Soft deleted supplier', 'Suppliers', 22, '{\"supplier_number\":\"SUPP-022\",\"name\":\"盤古開天軟體\"}', '36.238.160.7', '2026-05-06 10:15:02'),
(444, 10, 'Soft deleted supplier', 'Suppliers', 21, '{\"supplier_number\":\"SUPP-021\",\"name\":\"達爾文生物科技\"}', '36.238.160.7', '2026-05-06 10:15:04'),
(445, 10, 'Soft deleted supplier', 'Suppliers', 23, '{\"supplier_number\":\"SUPP-023\",\"name\":\"后羿太陽能板\"}', '36.238.160.7', '2026-05-06 10:15:06'),
(446, 10, 'Soft deleted supplier', 'Suppliers', 24, '{\"supplier_number\":\"SUPP-024\",\"name\":\"夸父追日照明\"}', '36.238.160.7', '2026-05-06 10:15:08'),
(447, 10, 'Soft deleted supplier', 'Suppliers', 26, '{\"supplier_number\":\"SUPP-026\",\"name\":\"神農氏有機食材\"}', '36.238.160.7', '2026-05-06 10:15:10'),
(448, 10, 'Soft deleted supplier', 'Suppliers', 25, '{\"supplier_number\":\"SUPP-025\",\"name\":\"女媧補天防水\"}', '36.238.160.7', '2026-05-06 10:15:13'),
(449, 10, 'Soft deleted supplier', 'Suppliers', 18, '{\"supplier_number\":\"SUPP-018\",\"name\":\"哥倫布海運\"}', '36.238.160.7', '2026-05-06 10:15:16'),
(450, 10, 'Soft deleted supplier', 'Suppliers', 27, '{\"supplier_number\":\"SUPP-027\",\"name\":\"倉頡文具印刷\"}', '36.238.160.7', '2026-05-06 10:15:21'),
(451, 10, 'Soft deleted supplier', 'Suppliers', 28, '{\"supplier_number\":\"SUPP-028\",\"name\":\"奧林帕斯機油\"}', '36.238.160.7', '2026-05-06 10:15:23'),
(452, 10, 'Soft deleted supplier', 'Suppliers', 29, '{\"supplier_number\":\"SUPP-029\",\"name\":\"瓦爾哈拉鍛造\"}', '36.238.160.7', '2026-05-06 10:15:25');

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
(3, 'CUST-003', '創新科技材料', '路竹區100號', '小小螺絲工廠', NULL, '路竹區100號', NULL, NULL, NULL, '邱太太', '04-2496-1234', 'aaabb@gmail.com', '路竹區100號', '邱太太', NULL, '04-2496-1234', 'aaabb@gmail.com', '邱太太', NULL, '04-2496-1234', 'aaabb@gmail.com', 10, 25, '現金', '11223344', '中小型客戶', 0.00, 3.00, NULL, 1, '2025-08-18 05:21:39', '2025-12-04 13:27:33', NULL, 0),
(4, 'CUST-004', '鑽前螺絲', '大馬路100號', NULL, '大馬路100號', '大馬路100號', NULL, NULL, NULL, '柯先生', '1234253453', '45345@gtfreg.com', '大馬路100號', '柯先生', NULL, NULL, NULL, '柯先生', NULL, NULL, NULL, 15, NULL, '月結90天', NULL, NULL, 0.00, 3.00, 'uploads/invoice_stamps/bb2da502614ef71d45faa1eda08a36d8.jpg', 1, '2025-09-28 12:52:43', '2026-03-10 03:53:11', '2026-03-10 03:53:11', 4),
(5, 'CUST-005', '永固機械製造', '高雄市左營大道100號', '托福實業股份有限公司', '高雄市左營大道100號', '高雄市左營大道100號', NULL, NULL, NULL, '蔡先生', '07-4435745', 'email@email.com', '高雄市左營大道100號', '蔡先生', '07-4453567', NULL, 'email01@email.com', '江小姐', '07-557-6366', NULL, NULL, 20, 25, '月結60天', '81209958', '07-695-2608 (二倉電話)\r\n左營總公司傳真07-557-2177', 0.00, 3.00, NULL, 1, '2025-10-05 12:31:02', '2026-03-10 03:27:48', '2026-03-10 03:27:48', 5),
(6, 'CUST-006', '東方車料配件', '彰化縣鹿港鎮工業東三路6號', '東方車料配件股份有限公司', '彰化縣鹿港鎮工業東三路6號', '彰化縣鹿港鎮工業東三路6號', 'https://www.eastmoto.com', '04-781-1235', '汽車配件', '施副總', '04-781-1234', 'purchase@eastmoto.com', '彰化縣鹿港鎮工業東三路6號', '洪先生', '101', '0911-222-333', 'sales.hung@eastmoto.com', '廖小姐', '102', '0911-222-334', 'finance.liao@eastmoto.com', 31, 15, '月結75天', '45678901', '品質要求高', 0.00, 3.00, 'uploads/invoices/cust006.png', 1, '2025-12-04 13:01:24', '2026-03-04 10:24:47', '2026-03-04 10:24:47', 6),
(7, 'CUST-007', '巨力螺絲廠', '岡山區本工一路18號', '巨力螺絲廠', '岡山區本工一路18號', '岡山區本工一路18號', 'https://www.giant-screw.com.tw', '07-621-5567', '建築螺絲', '莊先生', '07-621-5566', 'gs@giant-screw.com.tw', '岡山區本工一路18號', '王小姐', '11', '0922-333-444', 'sales.wang@giant-screw.com.tw', '林先生', '12', '0922-333-445', 'finance.lin@giant-screw.com.tw', 20, 5, '票期60天', '56789012', '需求量大', 0.00, 3.00, 'uploads/invoices/cust007.pdf', 1, '2025-12-04 13:01:24', '2025-12-04 13:01:24', NULL, 0),
(8, 'CUST-008', '新世代電子', '新竹市東區科學園區創新一路1號', '新世代電子股份有限公司', '新竹市東區科學園區創新一路1號', '新竹市東區科學園區創新一路1號', 'https://www.newgen-e.com', '03-578-9012', '消費性電子', '彭採購', '03-578-9011', 'purchasing@newgen-e.com', '新竹市東區科學園區創新一路1號', '葉先生', '808', '0988-999-000', 'sales.yeh@newgen-e.com', '傅小姐', '809', '0988-999-001', 'finance.fu@newgen-e.com', 25, 10, '月結90天', '67890123', '急單多', 0.00, 3.00, 'uploads/invoices/cust008.jpg', 1, '2025-12-04 13:01:24', '2026-05-05 05:51:11', '2026-05-05 05:51:11', 8),
(9, 'CUST-009', '飛馬自行車', '台中市大甲區順帆路10號', '飛馬自行車工業', '台中市大甲區順帆路10號', '台中市大甲區順帆路10號', 'https://www.pegasus-bike.com', '04-2681-5679', '自行車零件', '蕭廠長', '04-2681-5678', 'factory@pegasus-bike.com', '台中市大甲區順帆路10號', '侯先生', '222', '0937-123-456', 'sales.hou@pegasus-bike.com', '馬小姐', '223', '0937-123-457', 'finance.ma@pegasus-bike.com', 30, 15, '月結45天', '78901234', '合作開發', 0.00, 3.00, 'uploads/invoices/cust009.png', 1, '2025-12-04 13:01:24', '2026-03-10 03:50:37', '2026-03-10 03:50:37', 9),
(10, 'CUST-010', '穩固建築五金', '桃園市八德區和平路100號', '穩固建築五金行', '桃園市八德區和平路100號', '桃園市八德區和平路100號', 'https://www.solid-hardware.com', '03-368-8890', '建築五金', '呂老闆', '03-368-8889', 'solid@hardware.com', '桃園市八德區和平路100號', '宋先生', '02', '0910-987-654', 'sales.sung@solid-hardware.com', '趙小姐', '03', '0910-987-655', 'finance.chao@solid-hardware.com', 15, 1, '現金', '89012345', '零售客戶', 0.00, 3.00, 'uploads/invoices/cust010.pdf', 1, '2025-12-04 13:01:24', '2025-12-04 13:01:24', NULL, 0),
(11, 'CUST-011', '太陽能源科技', '台南市善化區南科三路3號', '太陽能源科技股份有限公司', '台南市善化區南科三路3號', '台南市善化區南科三路3號', 'https://www.solar-energy.com', '06-505-1002', '綠能產業', '田經理', '06-505-1001', 'contact@solar-energy.com', '台南市善化區南科三路3號', '溫先生', '168', '0919-888-777', 'sales.wen@solar-energy.com', '錢小姐', '169', '0919-888-778', 'finance.chien@solar-energy.com', 25, 10, '票期120天', '90123456', '新興產業', 0.00, 3.00, 'uploads/invoices/cust011.jpg', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:32', '2026-03-10 03:27:32', 11),
(12, 'CUST-012', '精準醫療器材', '嘉義縣太保市祥和一路東段1號', '精準醫療器材有限公司', '嘉義縣太保市祥和一路東段1號', '嘉義縣太保市祥和一路東段1號', 'https://www.precision-medical.com.tw', '05-362-8801', '醫療器材', '羅研發', '05-362-8800', 'rd@precision-medical.com.tw', '嘉義縣太保市祥和一路東段1號', '翁先生', '301', '0972-555-666', 'sales.weng@precision-medical.com.tw', '馮小姐', '302', '0972-555-667', 'finance.feng@precision-medical.com.tw', 20, 5, '月結60天', '11223344', '認證嚴格', 0.00, 3.00, 'uploads/invoices/cust012.png', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:35', '2026-03-10 03:27:35', 12),
(13, 'CUST-013', '宏觀國際物流', '桃園市大園區航站南路9號', '宏觀國際物流股份有限公司', '桃園市大園區航站南路9號', '桃園市大園區航站南路9號', 'https://www.macro-logistics.com', '03-398-3334', '物流服務', '潘主任', '03-398-3333', 'service@macro-logistics.com', '桃園市大園區航站南路9號', '姜先生', '500', '0939-222-111', 'sales.chiang@macro-logistics.com', '龍小姐', '501', '0939-222-112', 'finance.lung@macro-logistics.com', 31, 15, '月結30天', '22334455', '轉口貿易', 0.00, 3.00, 'uploads/invoices/cust013.pdf', 1, '2025-12-04 13:01:24', '2026-03-10 03:27:38', '2026-03-10 03:27:38', 13),
(14, 'CUST-014', '奇巧精密模具', '新北市樹林區三俊街100號', '奇巧精密模具有限公司', '新北市樹林區三俊街100號', '新北市樹林區三俊街100號', 'https://www.q-mold.com', '02-8684-1123', '模具製造', '丁廠長', '02-8684-1122', 'factory@q-mold.com', '新北市樹林區三俊街100號', '藍先生', '20', '0918-333-444', 'sales.lan@q-mold.com', '萬小姐', '21', '0918-333-445', 'finance.wan@q-mold.com', 10, 25, '票期60天', '33445566', '開模合作', 0.00, 3.00, 'uploads/invoices/cust014.jpg', 1, '2025-12-04 13:01:24', '2025-12-04 13:01:24', NULL, 0),
(15, 'CUST-015', '百變家具設計', '桃園市龍潭區工五路20號', '百變家具設計有限公司', '桃園市龍潭區工五路20號', '桃園市龍潭區工五路20號', 'https://www.magic-furniture.com.tw', '03-479-5567', '家具製造', '范設計師', '03-479-5566', 'design@magic-furniture.com.tw', '桃園市龍潭區工五路20號', '鍾先生', '15', '0975-888-999', 'sales.chung@magic-furniture.com.tw', '彭小姐', '16', '0975-888-990', 'finance.peng@magic-furniture.com.tw', 25, 10, '月結45天', '44556677', '小批量多樣式', 0.00, 3.00, 'uploads/invoices/cust015.png', 1, '2025-12-04 13:01:24', '2025-12-04 13:01:24', NULL, 0),
(16, 'CUST-016', '音速音響科技', '台北市中正区八德路一段1號', '音速音響科技有限公司', '台北市中正区八德路一段1號', '新北市汐止区新台五路一段79號', 'https://www.sonic-audio.com', '02-2341-5679', '音響設備', '杜經理', '02-2341-5678', 'contact@sonic-audio.com', '台北市中正区八德路一段1號', '姚先生', '110', '0917-123-456', 'sales.yao@sonic-audio.com', '袁小姐', '111', '0917-123-457', 'finance.yuan@sonic-audio.com', 20, 5, '月結60天', '55667788', '聲音品質要求高', 0.00, 3.00, 'uploads/invoices/cust016.pdf', 1, '2025-12-04 13:01:24', '2025-12-04 13:01:24', NULL, 0),
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
(52, 'CU-A0023', '三能螺栓工業股份有限公司', NULL, '三能螺栓工業股份有限公司', '高雄市岡山區本洲路381巷123號', NULL, NULL, '07-621-7668', NULL, '黃鼎盛\'r #307', '07-621-3795', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 30, 5, '月結30天', '22098891', '電匯內扣手續費10元', 0.00, 3.00, NULL, 1, '2026-05-05 05:54:06', '2026-05-05 05:54:06', NULL, 0);

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

--
-- 傾印資料表的資料 `dashboard_calendar_events`
--

INSERT INTO `dashboard_calendar_events` (`id`, `event_type`, `reference_id`, `title`, `description`, `start_datetime`, `end_datetime`, `is_all_day`, `status`, `priority`, `color`, `created_by_employee_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'reminder', NULL, '追貨-晴岡M3.5-0.6X7.5(亞太)', '亞太M3.5-0.6X7.5MM    1,526.042pcs 3/10交貨,趕3/17交貨', '2026-03-09 10:10:00', NULL, 1, 'completed', NULL, '#000000', NULL, '2026-03-03 08:10:37', '2026-03-09 09:00:50', NULL),
(2, 'reminder', NULL, '追貨-晴岡M3X21 (鍍膜)', '3/11鍍膜入M3.0-1.0X21.0MM 753+290kg 3/20交貨', '2026-03-10 09:00:00', NULL, 1, 'pending', 'low', '#000000', NULL, '2026-03-09 09:00:23', '2026-03-09 09:01:03', NULL);

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
(1, 'EMP001', 'admin', '管理員', 1, '系統管理員', 'admin@example.com', '$2y$12$0wMAc0U4ZpqQfjrxNK7Uve8M5cz8oXpl0dj6lKAwEFviEROuXRvWa', 'active', 12, '2026-04-27 22:14:11', 'a1dc1f6ed76fd21067bab0503a2f5ffc8a412ac2770f28879e9c0f33f9f7117a', '2025-08-11 14:32:07', '2026-04-27 14:14:11', NULL, 0),
(3, 'EMP002', 'yang', '楊小姐', 2, '會計', 'aaa@gmail.com', '$2a$10$OLHJkUvds0n0VG.Afb4gX.1znA.8MBvSGwbtrGXgGY3xBVUZg2o/O', 'active', 12, '2025-08-21 05:36:18', NULL, '2025-08-12 11:13:09', '2026-03-03 04:59:59', '2026-03-03 04:59:59', 3),
(4, 'EMP003', 'lin', '林天才', 3, '現場人員', 'aaaacc@gmail.com', '$2a$10$.B6Vf4cXnRaUClcTy1PmS.7rJHRAXi.woKM2dRerhUlRMDYAybT0G', 'active', 12, '2025-08-21 05:31:39', NULL, '2025-08-18 05:23:26', '2026-03-03 04:59:56', '2026-03-03 04:59:56', 4),
(5, 'EMP004', 'wang', '王老大', 5, '訂便當', 'abcd@sort.com', '$2y$10$FLYyRj/M5lJ8yO391B1nm.NFymfxWG8pENZb0YEF3n6ud8MrGkBQa', 'active', 12, NULL, NULL, '2025-09-28 09:15:28', '2026-02-10 13:11:48', '2026-02-10 12:40:56', 5),
(9, 'YC001', 'wang', '王振羽', 1, NULL, 'yc001@sort.com.tw', '$2y$10$Yzx3jTALd.jY7Kb9TJutH.Xk4WtxGgarB.QCMn5LTrpHDacgeLepS', 'active', 12, '2026-03-09 15:35:06', 'e74669187d1fb243d795069a121ec25196e7b49d0036db1b110b002d635aeedb', '2026-02-12 12:58:53', '2026-03-09 07:35:06', NULL, 0),
(10, 'YC1060301002', 'yvonne', '江乙芳', NULL, NULL, 'yc004@sort.com.tw', '$2y$10$4HNnuA3kYw2mjhHz2ZjXmeStcbH4kJGqUoP9tGE40ljiTyaS4gZ/m', 'active', 12, '2026-05-06 18:05:40', 'd04741784fbc04912a27bb38a8348f868a17228a4294de7421956cfffd71ced1', '2026-03-03 02:49:35', '2026-05-06 10:05:40', NULL, 0),
(11, 'YC1100913001', 'KUO', '郭芸彤', NULL, NULL, 'yc006@sort.com.tw', '$2y$10$WO5d1f.ROFDSD6RvKsxM8.2ylXk3raaC69NRTmshDX9xiC5WMvJke', 'active', 12, '2026-03-27 17:02:50', 'f7bbd0d42a60cb7f9d5ff7ef47eeb7b1771b45bbb87736e82bd981086a2e3cc0', '2026-03-03 02:51:55', '2026-03-27 09:02:50', NULL, 0);

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
(1, 1, 'INV-20260212-0001', 1, 1, 2, 1, NULL, NULL, 0.00, 3.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-02-12 20:09:09', '2026-02-12 12:09:09', '2026-05-04 14:31:30', 1, '2026-05-04 14:31:30', 1),
(2, 12, 'INV-20260304-0001', 3, 3, 3, 33, '099-11412024', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-04 19:45:27', '2026-03-04 11:45:27', '2026-03-05 05:58:44', 10, '2026-03-05 05:58:44', 2),
(3, 1, 'INV-20260304-0002', 2, 2, 2, 1, NULL, NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-04 22:31:51', '2026-03-04 14:31:51', '2026-05-04 14:31:28', 1, '2026-05-04 14:31:28', 3),
(4, 12, 'INV-20260305-0001', 3, 3, 3, 33, '099-11412024', NULL, 162451.00, 34.00, 162451.00, 0.00, 0.00, 0.00, 1233.00, 1385.00, 152.00, 7.590, '38KG船 4個', 4, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-05 13:59:00', '2026-03-05 06:20:01', '2026-03-05 07:22:09', 10, '2026-03-05 07:22:09', 4),
(5, 12, 'INV-20260305-0002', 3, 3, 3, 33, '099-11412024', NULL, 162451.00, 38.00, 162451.00, 0.00, 0.00, 0.00, 1233.00, 1385.00, 152.00, 7.590, '38KG船 4個', 4, 'qualified', '2026-03-05 16:24:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-05 15:23:00', '2026-03-05 07:23:45', '2026-05-04 14:31:26', 10, '2026-05-04 14:31:26', 5),
(6, 13, 'INV-20260305-0003', 4, 4, 4, 39, 'PO:251105002', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-05 18:17:44', '2026-03-05 10:17:44', '2026-03-05 10:21:19', 10, '2026-03-05 10:21:19', 6),
(7, 13, 'INV-20260305-0004', 4, 4, 4, 39, 'PO:251105002', NULL, 69811.00, 0.00, 69811.00, 0.00, 0.00, 0.00, 1621.00, 1945.00, 324.00, 23.220, '54KG船 6個', 6, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-05 18:21:00', '2026-03-05 10:21:53', '2026-03-05 10:28:43', 10, '2026-03-05 10:28:43', 7),
(8, 13, 'INV-20260305-0005', 4, 4, 4, 39, 'PO:251105002', NULL, 145866.00, 75.00, 145866.00, 0.00, 0.00, 0.00, 3387.00, 3711.00, 324.00, 23.220, '54KG船 4個   52KG*2', 6, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-05 18:29:00', '2026-03-05 10:30:18', '2026-03-09 10:09:32', 10, '2026-03-09 10:09:32', 8),
(9, 15, 'INV-20260309-0001', 8, 10, 6, 40, 'GJA20002DO-4Z0S', NULL, 0.00, 105.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-09 17:57:17', '2026-03-09 09:57:17', '2026-03-09 10:00:09', 10, '2026-03-09 10:00:09', 9),
(10, 15, 'INV-20260309-0002', 8, 10, 6, 40, 'GJA20002DO-4Z0S', NULL, 38710.00, 105.00, 38710.00, 0.00, 0.00, 0.00, 108.00, 118.00, 10.00, 2.790, '10KG圓 1個', 1, 'qualified', '2026-03-10 19:04:00', NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-09 18:00:00', '2026-03-09 10:00:57', '2026-03-09 10:06:08', 10, '2026-03-09 10:06:08', 10),
(11, 15, 'INV-20260309-0003', 8, 10, 6, 40, 'GJA20002DO-4Z0S', NULL, 38710.00, 105.00, 38710.00, 0.00, 0.00, 0.00, 108.00, 118.00, 10.00, 2.790, '10KG圓 1個', 1, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-09 18:06:00', '2026-03-09 10:06:38', '2026-05-04 14:31:24', 10, '2026-05-04 14:31:24', 11),
(12, 13, 'INV-20260309-0004', 4, 4, 4, 39, 'PO:251105002', NULL, 145866.00, 0.00, 145866.00, 0.00, 0.00, 0.00, 3387.00, 3711.00, 324.00, 23.220, '54KG船 6個', 6, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-09 18:13:00', '2026-03-09 10:14:01', '2026-05-04 14:31:21', 10, '2026-05-04 14:31:21', 12),
(13, 17, 'INV-20260317-0001', 10, 13, 8, 36, '2511002', NULL, 120541.00, 270.00, 120541.00, 0.00, 0.00, 0.00, 669.00, 745.00, 76.00, 5.550, '38KG船 2個', 2, 'qualified', '2026-03-17 18:55:00', 10, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-03-17 18:54:00', '2026-03-17 10:55:16', '2026-05-04 14:31:20', 10, '2026-05-04 14:31:20', 13),
(14, 19, 'INV-20260505-0001', 12, 17, 12, 52, '145518 H13R11', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-05 16:15:35', '2026-05-05 08:15:35', '2026-05-06 10:30:33', 10, '2026-05-06 10:30:33', 14),
(15, 20, 'INV-20260505-0002', 13, 18, 13, 38, '260-11412058_4', NULL, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.000, NULL, 0, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-05 16:15:48', '2026-05-05 08:15:48', '2026-05-05 08:49:14', 10, '2026-05-05 08:49:14', 15),
(16, 20, 'INV-20260505-0003', 13, 18, 13, 38, '260-11412058_4', NULL, 125397.00, 549.00, 125397.00, 0.00, 0.00, 0.00, 2054.00, 2194.00, 140.00, 16.380, '10KG圓 14個', 14, 'qualified', NULL, NULL, NULL, NULL, NULL, NULL, 'in_stock', NULL, '2026-05-05 17:20:00', '2026-05-05 09:17:51', '2026-05-06 10:30:36', 10, '2026-05-06 10:30:36', 16);

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
(1, 1, 2, 1, 1, 'work_order', 1, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 3', '2026-02-12 12:09:09', 1),
(2, 2, 3, 3, 3, 'work_order', 3, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-03-04 11:45:27', 10),
(3, 3, 2, 2, 2, 'work_order', 2, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-03-04 14:31:51', 1),
(4, 4, NULL, NULL, NULL, 'work_order', 3, 'inbound', NULL, 162451.00, 162451.00, '生產工單入庫', '2026-03-05 06:20:01', 10),
(5, 5, NULL, NULL, NULL, 'work_order', 3, 'inbound', NULL, 162451.00, 162451.00, '生產工單入庫', '2026-03-05 07:23:45', 10),
(6, 6, 4, 4, 4, 'work_order', 4, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-03-05 10:17:44', 10),
(7, 7, NULL, NULL, NULL, 'work_order', 4, 'inbound', NULL, 69811.00, 69811.00, '生產工單入庫', '2026-03-05 10:21:53', 10),
(8, 8, NULL, NULL, NULL, 'work_order', 4, 'inbound', NULL, 145866.00, 145866.00, '生產工單入庫', '2026-03-05 10:30:18', 10),
(9, 9, 6, 10, 8, 'work_order', 8, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 105', '2026-03-09 09:57:17', 10),
(10, 10, NULL, NULL, NULL, 'work_order', 8, 'inbound', NULL, 38710.00, 38710.00, '生產工單入庫', '2026-03-09 10:00:57', 10),
(11, 11, NULL, NULL, NULL, 'work_order', 8, 'inbound', NULL, 38710.00, 38710.00, '生產工單入庫', '2026-03-09 10:06:38', 10),
(12, 12, NULL, NULL, NULL, 'work_order', 4, 'inbound', NULL, 145866.00, 145866.00, '生產工單入庫', '2026-03-09 10:14:01', 10),
(13, 13, NULL, NULL, NULL, 'work_order', 10, 'inbound', NULL, 120541.00, 120541.00, '生產工單入庫', '2026-03-17 10:55:16', 10),
(14, 14, 12, 17, 12, 'work_order', 12, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-05-05 08:15:35', 10),
(15, 15, 13, 18, 13, 'work_order', 13, 'inbound', NULL, 0.00, 0.00, '工單完工自動入庫，良品 0，不良品 0', '2026-05-05 08:15:48', 10),
(16, 16, NULL, NULL, NULL, 'work_order', 13, 'inbound', NULL, 125397.00, 125397.00, '生產工單入庫', '2026-05-05 09:17:51', 10);

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
(47, '1.175.227.96', 'admin', 1, '2026-03-03 22:07:45'),
(48, '1.175.227.96', 'admin', 1, '2026-03-03 22:43:05'),
(49, '36.238.166.134', 'yvonne', 1, '2026-03-04 10:15:43'),
(50, '1.175.243.246', 'admin', 1, '2026-03-04 15:01:17'),
(51, '36.238.166.134', 'yvonne', 1, '2026-03-04 17:13:31'),
(52, '36.238.166.134', 'yvonne', 1, '2026-03-04 19:18:24'),
(53, '39.10.57.9', 'yvonne', 1, '2026-03-04 19:52:56'),
(54, '39.10.57.9', 'Yvonne', 1, '2026-03-04 19:53:28'),
(55, '36.238.166.134', 'yvonne', 1, '2026-03-04 19:55:34'),
(56, '1.175.243.246', 'admin', 1, '2026-03-04 21:20:17'),
(57, '1.175.243.246', 'admin', 1, '2026-03-04 22:31:17'),
(58, '1.175.243.246', 'admin', 1, '2026-03-05 09:57:02'),
(59, '36.238.166.134', 'yvonne', 1, '2026-03-05 12:34:49'),
(60, '36.238.166.134', 'yvonne', 1, '2026-03-05 14:37:02'),
(64, '36.238.166.134', 'KUO', 1, '2026-03-05 15:37:32'),
(65, '36.238.166.134', 'yvonne', 1, '2026-03-05 17:42:46'),
(67, '36.238.166.134', 'yvonne', 1, '2026-03-05 18:20:07'),
(68, '36.238.166.134', 'KUO', 1, '2026-03-05 18:56:01'),
(69, '36.238.166.134', 'yvonne', 1, '2026-03-05 19:04:29'),
(70, '36.238.166.134', 'yvonne', 1, '2026-03-05 19:12:34'),
(71, '36.238.159.8', 'yvonne', 1, '2026-03-06 11:26:41'),
(72, '36.238.159.8', 'yvonne', 1, '2026-03-06 13:38:36'),
(73, '36.238.159.8', 'KUO', 1, '2026-03-06 13:46:02'),
(74, '36.238.159.8', 'yvonne', 1, '2026-03-06 14:18:07'),
(75, '36.238.159.8', 'yvonne', 1, '2026-03-06 14:20:35'),
(76, '114.47.71.75', 'yvonne', 1, '2026-03-07 15:16:07'),
(77, '36.238.159.8', 'yvonne', 1, '2026-03-09 12:44:58'),
(78, '36.238.159.8', 'KUO', 1, '2026-03-09 12:45:47'),
(79, '36.238.159.8', 'KUO', 1, '2026-03-09 12:54:19'),
(82, '36.238.159.8', 'wang', 1, '2026-03-09 15:35:06'),
(83, '36.238.159.8', 'yvonne', 1, '2026-03-09 16:58:22'),
(84, '36.238.172.173', 'yvonne', 1, '2026-03-10 08:16:17'),
(85, '36.238.172.173', 'yvonne', 1, '2026-03-10 10:47:54'),
(86, '36.238.172.173', 'yvonne', 1, '2026-03-11 08:29:25'),
(87, '36.238.172.173', 'yvonne', 1, '2026-03-13 10:34:59'),
(88, '36.238.172.173', 'yvonne', 1, '2026-03-13 17:09:20'),
(89, '218.166.4.144', 'yvonne', 1, '2026-03-16 14:39:52'),
(90, '218.166.4.144', 'yvonne', 1, '2026-03-17 10:06:36'),
(91, '218.166.4.144', 'yvonne', 1, '2026-03-17 17:52:48'),
(92, '218.166.4.144', 'KUO', 1, '2026-03-17 17:57:28'),
(93, '36.238.150.195', 'KUO', 1, '2026-03-18 13:44:07'),
(94, '36.238.150.195', 'yvonne', 1, '2026-03-19 14:16:29'),
(95, '36.238.150.195', 'yvonne', 1, '2026-03-20 09:55:09'),
(96, '36.238.132.227', 'yvonne', 1, '2026-03-21 09:07:58'),
(100, '61.227.49.223', 'yvonne', 1, '2026-03-22 14:06:32'),
(101, '36.238.162.19', 'yvonne', 1, '2026-03-23 09:15:24'),
(102, '36.238.162.19', 'yvonne', 1, '2026-03-24 11:36:39'),
(103, '36.238.162.19', 'yvonne', 1, '2026-03-24 19:03:44'),
(104, '36.238.180.83', 'KUO', 1, '2026-03-27 16:58:59'),
(105, '36.238.180.83', 'KUO', 1, '2026-03-27 17:02:50'),
(106, '36.238.149.55', 'yvonne', 1, '2026-04-02 19:34:10'),
(107, '36.238.135.148', 'yvonne', 1, '2026-04-10 15:42:34'),
(109, '36.238.149.177', 'YVONNE', 1, '2026-04-17 18:14:08'),
(110, '36.238.149.177', 'YVONNE', 1, '2026-04-17 20:41:06'),
(111, '1.175.226.227', 'admin', 1, '2026-04-27 22:14:11'),
(115, '36.238.143.35', 'yvonne', 1, '2026-04-28 19:10:15'),
(117, '36.238.143.35', 'yvonne', 1, '2026-04-29 10:47:23'),
(119, '36.238.154.49', 'yvonne', 1, '2026-04-30 13:37:49'),
(120, '61.227.58.135', 'yvonne', 1, '2026-05-04 22:31:07'),
(121, '36.238.160.7', 'yvonne', 1, '2026-05-05 13:47:27'),
(123, '36.238.160.7', 'yvonne', 1, '2026-05-05 15:19:44'),
(125, '36.238.160.7', 'yvonne', 1, '2026-05-05 16:48:19'),
(126, '36.238.160.7', 'yvonne', 1, '2026-05-06 15:47:14'),
(127, '36.238.160.7', 'yvonne', 1, '2026-05-06 15:49:41'),
(128, '36.238.160.7', 'yvonne', 1, '2026-05-06 18:05:40');

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

--
-- 傾印資料表的資料 `message_attachments`
--

INSERT INTO `message_attachments` (`id`, `message_id`, `file_name`, `file_path`, `file_size`, `mime_type`, `created_at`) VALUES
(1, 1, 'L044682.jpg', '1/L044682_698d78c621ba9.jpg', 30349, 'image/jpeg', '2026-02-12 06:52:54'),
(2, 2, 'L044682.jpg', '2/L044682_698d7a23627f9.jpg', 30349, 'image/jpeg', '2026-02-12 06:58:43'),
(3, 3, 'L044682.jpg', '3/L044682_698d8f8f56a43.jpg', 30349, 'image/jpeg', '2026-02-12 08:30:07'),
(4, 4, 'L044682.jpg', '4/L044682_698d925ea203c.jpg', 30349, 'image/jpeg', '2026-02-12 08:42:06'),
(5, 6, '尚未登入或登入已過期.png', '6/_______________________________69a66c8d3b787.png', 102424, 'image/png', '2026-03-03 05:07:25'),
(6, 7, '輸入機台名稱無法儲存.jpg', '7/_______________________________69a803f79ca5d.jpg', 145086, 'image/jpeg', '2026-03-04 10:05:43');

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

--
-- 傾印資料表的資料 `message_recipients`
--

INSERT INTO `message_recipients` (`id`, `message_id`, `recipient_id`, `read_at`, `deleted_at`, `created_at`) VALUES
(1, 1, 4, NULL, NULL, '2026-02-12 14:52:54'),
(2, 2, 4, NULL, NULL, '2026-02-12 14:58:43'),
(3, 2, 3, NULL, NULL, '2026-02-12 14:58:43'),
(4, 2, 1, '2026-02-12 15:01:11', NULL, '2026-02-12 14:58:43'),
(5, 5, 4, NULL, NULL, '2026-02-12 17:12:14'),
(6, 5, 3, NULL, NULL, '2026-02-12 17:12:14'),
(7, 5, 1, '2026-02-12 18:25:28', NULL, '2026-02-12 17:12:14'),
(8, 6, 10, '2026-03-03 13:33:36', NULL, '2026-03-03 13:07:25'),
(9, 6, 9, '2026-03-03 13:30:43', NULL, '2026-03-03 13:07:25'),
(10, 6, 1, '2026-03-03 22:22:19', NULL, '2026-03-03 13:07:25'),
(11, 6, 11, NULL, NULL, '2026-03-03 13:07:25'),
(12, 7, 10, '2026-03-05 13:06:48', NULL, '2026-03-04 18:05:43'),
(13, 7, 9, '2026-03-09 15:54:31', NULL, '2026-03-04 18:05:43'),
(14, 7, 1, '2026-03-04 21:20:31', NULL, '2026-03-04 18:05:43'),
(15, 7, 11, NULL, NULL, '2026-03-04 18:05:43');

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

--
-- 傾印資料表的資料 `notification_reads`
--

INSERT INTO `notification_reads` (`id`, `notification_id`, `user_id`, `read_at`) VALUES
(2, 4, 1, '2026-02-12 18:23:26'),
(3, 5, 1, '2026-03-03 22:22:43'),
(4, 5, 10, '2026-03-04 10:16:21'),
(5, 2, 10, '2026-05-06 18:06:10'),
(6, 1, 10, '2026-05-06 18:06:13');

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
(1, 'ORDER-20260210-0001', 30, '2026-02-10', '2026-02-28', 'SS-2034-34', 'pending', NULL, 0.00, NULL, '2026-02-10 10:04:48', '2026-02-10 13:11:49', '2026-02-10 10:34:07', 1),
(2, 'ORDER-20260212-0001', 1, '2026-02-12', '2026-02-28', NULL, 'pending', NULL, 9162.76, NULL, '2026-02-12 10:58:40', '2026-02-12 11:30:01', NULL, 0),
(3, 'ORDER-20260303-0001', 33, '2026-03-03', '2026-03-05', '099-11412024', 'pending', NULL, 3254.28, '3/5(四)中午前必入', '2026-03-04 11:27:16', '2026-03-04 11:43:00', NULL, 0),
(4, 'ORDER-20260305-0001', 39, '2026-03-05', '2026-03-09', 'null', 'pending', NULL, 30353.14, 'null', '2026-03-05 09:52:09', '2026-03-11 00:38:17', NULL, 0),
(5, 'ORDER-20260223-0001', 32, '2026-02-23', '2026-03-02', 'C5091960024A', 'confirmed', NULL, 37585.08, '1.完工抽夾子\n2. 與S001774鍍層不同，勿混批，請先清潔料斗.\n3.二次良品超過10公斤，請用船型桶，\n  使用前須清潔船桶，不可有油汙。清潔人員需於工單簽名。\n   If second-time goods OVER 10 KG，pls use drum.\n   Must clean drum before use and must not be dirty.', '2026-03-06 05:19:11', '2026-03-06 06:12:44', NULL, 0),
(6, 'ORDER-20260309-0001', 40, '2026-03-09', '2026-03-12', NULL, 'pending', NULL, 586.02, NULL, '2026-03-09 09:09:39', '2026-03-09 09:17:40', NULL, 0),
(7, 'ORDER-20260223-0002', 36, '2026-02-23', '2026-03-18', '100880', 'pending', NULL, 31275.00, '2/23+3/9', '2026-03-10 02:49:25', '2026-03-10 03:22:14', NULL, 0),
(8, 'ORDER-20260205-0001', 36, '2026-02-05', NULL, '33049-2', 'pending', NULL, 18752.44, '2/5+2/6+3/2+3/9', '2026-03-10 03:15:54', '2026-03-17 10:21:04', NULL, 0),
(9, 'ORDER-20260417-0001', 41, '2026-04-17', '2026-05-15', 'I07-1150411-1 (SU041101-8D)', 'confirmed', NULL, 0.00, '宗連入', '2026-04-17 10:57:43', '2026-04-17 10:58:58', '2026-04-17 10:58:58', 9),
(10, 'ORDER-20260417-0001', 41, '2026-04-17', '2026-05-15', 'I07-1-1150411-1(TU041101-6D)', 'confirmed', NULL, 0.00, '建中入', '2026-04-17 10:59:32', '2026-04-17 11:00:30', '2026-04-17 11:00:30', 10),
(11, 'ORDER-20260417-0001', 46, '2026-04-17', '2026-05-15', 'I07-1-1150411-1 (TU041101-6D)', 'pending', NULL, 13214.56, '建中入', '2026-04-17 11:01:09', '2026-04-17 11:09:23', NULL, 0),
(12, 'ORDER-20260429-0001', 52, '2026-04-29', '2026-05-11', 'B226037', 'confirmed', NULL, 6585.51, NULL, '2026-05-05 05:55:12', '2026-05-05 06:02:21', NULL, 0),
(13, 'ORDER-20260505-0001', 38, '2026-05-05', NULL, '260-11412058_4', 'pending', NULL, 11907.70, '12圓4', '2026-05-05 07:36:56', '2026-05-05 08:25:00', NULL, 0);

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
(1, 2, 1, 15.00, 999.00, 327241.38, 4908.62, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(2, 2, 1, 13.00, 999.00, 327241.38, 4254.14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(3, 3, 12, 20.00, 1387.00, 162714.10, 3254.28, 'pending', '8M0110369', NULL, NULL, '099-11412024', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-04 11:36:49', '2026-03-04 11:43:00'),
(4, 4, 13, 25.00, 3763.00, 148191.21, 3704.78, 'pending', '2609547-D.1', NULL, NULL, 'PO:251105002', 'no', NULL, '功協包裝 07-632-0322，林\'R\r\n阿蓮區民族路305巷46號', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-05 09:58:48', '2026-03-11 00:38:17'),
(5, 4, 13, 25.00, 11677.00, 461197.24, 11529.93, 'pending', NULL, NULL, NULL, 'PO:251002006-9', 'no', NULL, '功協包裝 07-632-0322，林\'R\r\n阿蓮區民族路305巷46號', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-05 10:06:10', '2026-03-05 10:07:35'),
(6, 4, 13, 25.00, 11677.00, 461197.24, 11529.93, 'pending', '2609547-D.1', NULL, NULL, 'PO:2510020006-9', 'no', NULL, '功協包裝 07-632-0322，林\'R\r\n阿蓮區民族路305巷46號', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-05 10:11:51', '2026-03-09 10:12:44'),
(7, 5, 14, 12.00, 1610.00, 1044029.85, 12528.36, 'pending', 'S001370', NULL, 'S001370', 'S-202511164-04', 'no', NULL, '1. 進出蓋帆布  \r\n2. 不良品另轉交李\'S\r\n3. 指送其他廠商務必換單，且不可出示羽全出貨單', 1384.00, 1382.00, 1383.00, 0.00, 'not_shipped', '2026-03-06 05:21:29', '2026-03-06 06:10:46'),
(8, 5, 14, 12.00, 1610.00, 1044029.85, 12528.36, 'pending', NULL, NULL, 'S001370', 'S-202511164-04', 'no', NULL, '1. 進出蓋帆布  \r\n2. 不良品另轉交李\'S\r\n3. 指送其他廠商務必換單，且不可出示羽全出貨單', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-06 06:12:17', '2026-03-06 06:12:17'),
(9, 5, 14, 12.00, 1610.00, 1044029.85, 12528.36, 'pending', NULL, NULL, 'S001370', 'S-202511164-04', 'no', NULL, '1. 進出蓋帆布  \r\n2. 不良品另轉交李\'S\r\n3. 指送其他廠商務必換單，且不可出示羽全出貨單', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(10, 6, 15, 15.00, 119.00, 39068.10, 586.02, 'pending', 'GJA20002DQ-4Z0S', 'GJA20002DO-4Z0S', 'GJA20002DO-4Z0S', 'GJA20002DO-4Z0S', 'no', NULL, NULL, 109.00, 109.00, NULL, 0.00, 'not_shipped', '2026-03-09 09:13:07', '2026-03-09 09:21:51'),
(11, 4, 13, 25.00, 3657.00, 143540.05, 3588.50, 'pending', NULL, NULL, NULL, 'PO:251105002', 'no', NULL, '功協包裝 07-632-0322，林\'R\r\n阿蓮區民族路305巷46號', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-09 10:11:24', '2026-03-09 10:11:24'),
(12, 7, 16, 30.00, 1858.00, 1042500.00, 31275.00, 'pending', 'WD01019', NULL, '100880', '2512008', 'no', NULL, '2/23+3/9', 1664.00, 1668.00, NULL, 0.00, 'not_shipped', '2026-03-10 02:53:06', '2026-03-10 03:06:40'),
(13, 8, 17, 18.00, 775.00, 125945.95, 2267.03, 'in_progress', 'WD03151', NULL, '33049-2', '2511002', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-10 03:20:08', '2026-03-17 10:21:04'),
(14, 8, 17, 18.00, 5577.00, 915855.86, 16485.41, 'in_progress', NULL, NULL, '33049-2', '2512020', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(15, 11, 18, 18.00, 2317.00, 316666.67, 5700.00, 'pending', 'CTS-S-4079', NULL, NULL, 'I07-1-1150411-1(TU041101-6D)', 'no', NULL, NULL, 1950.00, 1957.00, NULL, 0.00, 'not_shipped', '2026-04-17 11:02:31', '2026-04-17 11:07:28'),
(16, 11, 18, 18.00, 3000.00, 417475.73, 7514.56, 'pending', NULL, NULL, NULL, 'I07-1-1150411-1(TU041101-6D)', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-04-17 11:09:23', '2026-04-17 11:09:23'),
(17, 12, 19, 16.00, 343.00, 411594.20, 6585.51, 'in_progress', NULL, NULL, 'B226037', '145518 H13R11', 'no', NULL, NULL, NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(18, 13, 20, 43.00, 2016.00, 114529.91, 4924.79, 'in_progress', 'A02890501 REV B', NULL, NULL, '260-11412058_4', 'yes', NULL, '完工換船桶', 1879.00, 1876.00, NULL, 0.00, 'not_shipped', '2026-05-05 08:07:25', '2026-05-05 08:13:26'),
(19, 13, 20, 43.00, 2800.00, 162393.16, 6982.91, 'in_progress', NULL, NULL, NULL, '260-11412058_4', 'yes', NULL, '完工換船桶', NULL, NULL, NULL, 0.00, 'not_shipped', '2026-05-05 08:25:00', '2026-05-05 08:25:00');

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

--
-- 傾印資料表的資料 `order_item_attachments`
--

INSERT INTO `order_item_attachments` (`id`, `order_item_id`, `file_name`, `file_path`, `file_size`, `mime_type`, `uploaded_at`, `created_at`, `updated_at`) VALUES
(1, 10, '安拓-安克螺栓NG.jpg', 'uploads/order_items/attachments/attachment_69ae912fde9719.94940312.jpg', 1866357, 'image/jpeg', '2026-03-09 09:21:51', '2026-03-09 09:21:51', '2026-03-09 09:21:51');

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
(1, 3, '8M0110369', '8M0110369.pdf', 'uploads/order_item_drawings/drawing_69a8195174fa23.80118741.pdf', 374753, 'application/pdf', '2026-03-04 11:36:49', '2026-03-04 11:36:49', '2026-03-04 11:36:49'),
(2, 4, '2609547-D.1', 'S__36872195.jpg', 'uploads/order_item_drawings/drawing_69a953d864c976.31039240.jpg', 420875, 'image/jpeg', '2026-03-05 09:58:48', '2026-03-05 09:58:48', '2026-03-05 09:58:48'),
(3, 6, '2609547-D.1', 'S__36872195.jpg', 'uploads/order_item_drawings/drawing_69a956e78cbc81.69714107.jpg', 420875, 'image/jpeg', '2026-03-05 10:11:51', '2026-03-05 10:11:51', '2026-03-05 10:11:51'),
(5, 7, 'S001370', '鑫穩M4-1.8X16-S001370.pdf', 'uploads/order_item_drawings/drawing_69aa69ee89f139.45402017.pdf', 1091500, 'application/pdf', '2026-03-06 05:45:18', '2026-03-06 05:45:18', '2026-03-06 05:45:18'),
(6, 10, 'GJA20002DQ-4Z0S', 'S__37068805.jpg', 'uploads/order_item_drawings/drawing_69ae912fde1da4.13602013.jpg', 336397, 'image/jpeg', '2026-03-09 09:21:51', '2026-03-09 09:21:51', '2026-03-09 09:21:51'),
(7, 10, 'GJA20002DQ-4Z0S', '華峰(#10-32UNFX13)-GJ3C6006DI-ZZ0S.pdf', 'uploads/order_item_drawings/drawing_69ae912fde5644.01251311.pdf', 518384, 'application/pdf', '2026-03-09 09:21:51', '2026-03-09 09:21:51', '2026-03-09 09:21:51'),
(8, 12, 'WD01019', '富詮100880(01-M6).pdf', 'uploads/order_item_drawings/drawing_69af8792ea63e5.53359225.pdf', 1737851, 'application/pdf', '2026-03-10 02:53:06', '2026-03-10 02:53:06', '2026-03-10 02:53:06'),
(9, 13, 'WD03151', '富詮33049-2 (03-M6).pdf', 'uploads/order_item_drawings/drawing_69af8de81531f1.91948522.pdf', 773036, 'application/pdf', '2026-03-10 03:20:08', '2026-03-10 03:20:08', '2026-03-10 03:20:08'),
(10, 14, 'WD03151', '富詮33049-2 (03-M6).pdf', 'uploads/order_item_drawings/drawing_69af8e4834d9f1.83841818.pdf', 773036, 'application/pdf', '2026-03-10 03:21:44', '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(11, 13, '123', '1757384851295.jpg', 'uploads/order_item_drawings/drawing_69b932167de4a0.75856216.jpg', 443781, 'image/jpeg', '2026-03-17 10:51:02', '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(12, 15, 'CTS-S-4079', '展博-冠旺-M6X45 (CTS-8-4079).pdf', 'uploads/order_item_drawings/drawing_69e21399b869b4.80694557.pdf', 543056, 'application/pdf', '2026-04-17 11:03:53', '2026-04-17 11:03:53', '2026-04-17 11:03:53'),
(13, 18, 'A02890501 REV B', '益展(4分之1-20X1.640)--大扁頭.pdf', 'uploads/order_item_drawings/drawing_69f9a5ddeefd74.57185901.pdf', 920256, 'application/pdf', '2026-05-05 08:10:05', '2026-05-05 08:10:05', '2026-05-05 08:10:05');

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
(1, 1, 11, '上視裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(2, 1, 12, '側視裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(3, 1, 8, '有無牙', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(4, 1, 9, '混料雜質', NULL, 5.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(5, 1, 7, '牙外徑', NULL, 15.00, 6.1200, NULL, 6.3200, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(6, 1, 2, '總長度', NULL, 10.00, 41.6600, NULL, 44.7000, NULL, 50, NULL, '檢測螺絲總長度', '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(7, 1, 13, '頭下裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(8, 1, 1, '頭高', NULL, 15.00, 4.5200, NULL, 5.0300, NULL, 50, NULL, '檢測螺絲頭部高度', '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(9, 2, 11, '上視裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(10, 2, 12, '側視裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(11, 2, 8, '有無牙', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(12, 2, 9, '混料雜質', NULL, 5.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(13, 2, 7, '牙外徑', NULL, 15.00, 6.1200, NULL, 6.3200, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(14, 2, 2, '總長度', NULL, 10.00, 41.6600, NULL, 44.7000, NULL, 50, NULL, '檢測螺絲總長度', '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(15, 2, 13, '頭下裂', NULL, 10.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(16, 2, 1, '頭高', NULL, 15.00, 4.5200, NULL, 5.0300, NULL, 50, NULL, '檢測螺絲頭部高度', '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(66, 3, 1, '頭高', NULL, 20.00, NULL, NULL, 7.0000, NULL, 50, '7.00最大', '檢測螺絲頭部高度', '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(67, 3, 14, '頭寬', NULL, 0.00, 12.5000, NULL, 13.0000, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(68, 3, 15, '頭下長度', NULL, 0.00, 22.3500, NULL, 23.6500, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(69, 3, 7, '牙外徑', NULL, 0.00, 5.7900, NULL, 5.9700, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(70, 3, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(71, 3, 29, '節距', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(72, 3, 30, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(73, 3, 31, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(74, 3, 16, '真圓度', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(124, 5, 23, '上段桿徑', NULL, 25.00, 8.8500, 0.1001, 8.8500, 0.1000, 255, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(125, 5, 24, '上桿長', NULL, 0.00, 13.5000, 0.7000, 13.5000, NULL, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(126, 5, 22, '華司徑', NULL, 0.00, 17.0000, 0.4000, 17.0000, 0.4000, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(127, 5, 21, '華司厚', NULL, 0.00, 4.3000, 0.1500, 4.3000, NULL, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(128, 5, 23, '下段桿徑', NULL, 0.00, 8.8500, 0.1000, 8.8500, 0.1000, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(129, 5, 24, '下桿長', NULL, 0.00, 26.5000, 0.2500, 26.5000, 0.2500, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(130, 5, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(131, 5, 26, '有無狗尾', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(351, 9, 1, '頭高', NULL, 9.00, 2.5000, NULL, 2.7000, NULL, 25, NULL, '檢測螺絲頭部高度', '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(352, 9, 14, '頭寬', NULL, 0.00, 7.7000, NULL, 7.9000, NULL, 25, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(353, 9, 15, '頭下長度', NULL, 0.00, 15.5000, NULL, 16.6000, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(354, 9, 7, '牙外徑', NULL, 0.00, 4.0000, NULL, 4.1500, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(355, 9, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(356, 9, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(357, 9, 16, '真圓度', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(358, 9, 17, '頭裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(359, 9, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(360, 9, 41, '頭部無電鍍', NULL, 0.00, NULL, NULL, NULL, NULL, 50, '上視', NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(361, 9, 21, '華司厚', NULL, 0.00, 0.7000, NULL, 0.9000, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(362, 9, 32, '節距', NULL, 0.00, 1.7500, NULL, 1.8500, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(363, 9, 32, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(364, 9, 32, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(365, 9, 17, '頭裂', NULL, 3.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(366, 7, 1, '頭高', NULL, 9.00, 2.5000, NULL, 2.7000, NULL, 25, NULL, '檢測螺絲頭部高度', '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(367, 7, 14, '頭寬', NULL, 0.00, 7.7000, NULL, 7.9000, NULL, 25, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(368, 7, 15, '頭下長度', NULL, 0.00, 15.5000, NULL, 16.6000, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(369, 7, 7, '牙外徑', NULL, 0.00, 4.0000, NULL, 4.1500, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(370, 7, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(371, 7, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(372, 7, 16, '真圓度', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(373, 7, 17, '頭裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(374, 7, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(375, 7, 41, '頭部無電鍍', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(376, 7, 21, '華司厚', NULL, 0.00, 0.7000, NULL, 0.9000, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(377, 7, 32, '跳牙-節距', NULL, 0.00, 1.7500, NULL, 1.8500, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(378, 7, 32, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(379, 7, 32, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(380, 7, 17, '頭裂', NULL, 3.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(381, 7, 38, '合BIT-T20', NULL, 5.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(382, 8, 1, '頭高', NULL, 9.00, 2.5000, NULL, 2.7000, NULL, 25, NULL, '檢測螺絲頭部高度', '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(383, 8, 14, '頭寬', NULL, 0.00, 7.7000, NULL, 7.9000, NULL, 25, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(384, 8, 15, '頭下長度', NULL, 0.00, 15.5000, NULL, 16.6000, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(385, 8, 7, '牙外徑', NULL, 0.00, 4.0000, NULL, 4.1500, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(386, 8, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(387, 8, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(388, 8, 16, '真圓度', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(389, 8, 17, '頭裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(390, 8, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(391, 8, 41, '頭部無電鍍', NULL, 0.00, NULL, NULL, NULL, NULL, 50, '上視', NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(392, 8, 21, '華司厚', NULL, 0.00, 0.7000, NULL, 0.9000, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(393, 8, 17, '頭裂', NULL, 3.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(394, 8, 32, '跳牙-節距、斜牙、牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(520, 10, 1, '頭高', NULL, 15.00, 2.8000, NULL, 3.2000, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(521, 10, 14, '頭寬', NULL, 0.00, 11.0000, NULL, 11.4000, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(522, 10, 15, '頭下長度', NULL, 0.00, 11.7000, NULL, 12.3000, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(523, 10, 7, '牙外徑', NULL, 0.00, 4.6500, NULL, 4.8000, NULL, 50, '因已塗膠，牙外徑上限現場依實際情形放寬，唯須確保有牙', NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(524, 10, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(525, 10, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(526, 10, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(527, 10, 16, '真圓度', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(528, 10, 32, '跳牙-節距、斜牙、牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(545, 11, 23, '上段桿徑', NULL, 25.00, 6.9900, NULL, 7.0900, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(546, 11, 24, '上桿長', NULL, 0.00, 13.5000, NULL, 14.2000, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(547, 11, 22, '華司徑', NULL, 0.00, 16.6000, NULL, 17.4000, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(548, 11, 21, '華司厚', NULL, 0.00, 4.3000, NULL, 4.4500, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(549, 11, 23, '下段桿徑', NULL, 0.00, 8.7500, NULL, 8.9500, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(550, 11, 24, '下桿長', NULL, 0.00, 26.2500, NULL, 26.7500, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(551, 11, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(552, 11, 26, '有無狗尾', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(553, 6, 23, '上段桿徑', NULL, 25.00, 6.9900, NULL, 7.0900, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(554, 6, 24, '上桿長', NULL, 0.00, 13.5000, NULL, 14.2000, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(555, 6, 22, '華司徑', NULL, 0.00, 16.6000, NULL, 17.4000, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(556, 6, 21, '華司厚', NULL, 0.00, 4.3000, NULL, 4.4500, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(557, 6, 23, '下段桿徑', NULL, 0.00, 8.7500, NULL, 8.9500, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(558, 6, 24, '下桿長', NULL, 0.00, 26.2500, NULL, 26.7500, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(559, 6, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(560, 6, 26, '有無狗尾', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(574, 12, 51, '總厚度', NULL, 30.00, 4.8200, NULL, 4.9800, NULL, 25, NULL, NULL, '2026-03-10 03:06:40', '2026-03-10 03:06:40'),
(575, 12, 52, '內孔徑', NULL, 0.00, 5.0300, NULL, 5.0900, NULL, 25, NULL, NULL, '2026-03-10 03:06:40', '2026-03-10 03:06:40'),
(576, 12, 53, '孔內有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 25, NULL, NULL, '2026-03-10 03:06:40', '2026-03-10 03:06:40'),
(577, 12, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-10 03:06:40', '2026-03-10 03:06:40'),
(586, 14, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(587, 14, 58, '輪裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(588, 14, 55, '孔內異物、毛邊', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(589, 14, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(616, 4, 23, '上段桿徑', NULL, 25.00, 6.9900, NULL, 7.0900, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(617, 4, 24, '上桿長', NULL, 0.00, 13.5000, NULL, 14.2000, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(618, 4, 22, '華司徑', NULL, 0.00, 16.6000, NULL, 17.4000, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(619, 4, 21, '華司厚', NULL, 0.00, 4.3000, NULL, 4.4500, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(620, 4, 23, '下段桿徑', NULL, 0.00, 8.7500, NULL, 8.9500, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(621, 4, 24, '下桿長', NULL, 0.00, 26.2500, NULL, 26.7500, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(622, 4, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(623, 4, 26, '有無狗尾', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(624, 4, 58, '輪裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(641, 13, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(642, 13, 58, '輪裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(643, 13, 55, '孔內異物、毛邊', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(644, 13, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(740, 15, 1, '頭高', NULL, 15.00, 3.6000, NULL, 4.0000, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(741, 15, 14, '頭寬', NULL, 0.00, 11.3000, NULL, 12.0000, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(742, 15, 15, '頭下長度', NULL, 0.00, 44.2000, NULL, 45.0000, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(743, 15, 7, '牙外徑', NULL, 0.00, 6.0000, NULL, 6.2200, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(744, 15, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(745, 15, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(746, 15, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(754, 16, 1, '頭高', NULL, 15.00, 3.6000, NULL, 4.0000, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(755, 16, 14, '頭寬', NULL, 0.00, 11.3000, NULL, 12.0000, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(756, 16, 15, '頭下長度', NULL, 0.00, 44.2000, NULL, 45.0000, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(757, 16, 7, '牙外徑', NULL, 0.00, 6.0000, NULL, 6.2200, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(758, 16, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(759, 16, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(760, 16, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(761, 17, 1, '頭高', NULL, 16.00, 2.1800, NULL, 2.4200, NULL, 0, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(762, 17, 14, '頭寬', NULL, 0.00, 5.9200, NULL, 6.5000, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(763, 17, 15, '頭下長度', NULL, 0.00, 9.5500, NULL, 10.4500, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(764, 17, 7, '牙外徑', NULL, 0.00, 3.0000, NULL, 3.1000, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(765, 17, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(766, 17, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(767, 17, 42, '有無針孔', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(768, 17, 28, '頭下第一牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(824, 18, 1, '頭高', NULL, 43.00, 4.5200, NULL, 5.0300, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(825, 18, 2, '總長度', NULL, 0.00, 41.6600, NULL, 44.7000, NULL, 50, NULL, '檢測螺絲總長度', '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(826, 18, 7, '牙外徑', NULL, 0.00, 6.1200, NULL, 6.3200, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(827, 18, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(828, 18, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(829, 18, 11, '上、下、側視裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(830, 18, 29, '節距', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(831, 18, 30, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(832, 18, 31, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(833, 19, 1, '頭高', NULL, 43.00, 4.5200, NULL, 5.0300, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(834, 19, 2, '總長度', NULL, 0.00, 41.6600, NULL, 44.7000, NULL, 50, NULL, '檢測螺絲總長度', '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(835, 19, 7, '牙外徑', NULL, 0.00, 6.1200, NULL, 6.3200, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(836, 19, 8, '有無牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(837, 19, 9, '混料雜質', NULL, 0.00, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(838, 19, 11, '上、下、側視裂', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(839, 19, 29, '節距', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(840, 19, 30, '斜牙', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00'),
(841, 19, 31, '牙品質', NULL, 0.00, NULL, NULL, NULL, NULL, 50, NULL, NULL, '2026-05-05 08:25:00', '2026-05-05 08:25:00');

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
(1, 1, 1, NULL, 1.00, 50.00, '2026-02-12 11:09:32', '2026-02-12 11:09:32'),
(2, 2, 1, NULL, 1.00, 50.00, '2026-02-12 11:30:01', '2026-02-12 11:30:01'),
(6, 3, 2, '船', 4.00, 152.00, '2026-03-04 11:43:17', '2026-03-04 11:43:17'),
(10, 5, 9, '船', 16.00, 864.00, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(11, 5, 10, '船', 2.00, 104.00, '2026-03-05 10:07:35', '2026-03-05 10:07:35'),
(22, 9, 6, '大船', 3.00, 171.00, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(23, 9, 5, '中船', 1.00, 40.00, '2026-03-06 06:12:44', '2026-03-06 06:12:44'),
(24, 7, 6, '大船', 3.00, 171.00, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(25, 7, 5, '中船', 1.00, 40.00, '2026-03-06 06:24:17', '2026-03-06 06:24:17'),
(26, 8, 6, '大船', 3.00, 171.00, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(27, 8, 5, '中船', 1.00, 40.00, '2026-03-06 06:26:10', '2026-03-06 06:26:10'),
(31, 10, 4, '圓', 1.00, 10.00, '2026-03-09 09:28:36', '2026-03-09 09:28:36'),
(34, 11, 9, '船', 6.00, 324.00, '2026-03-09 10:12:33', '2026-03-09 10:12:33'),
(35, 6, 9, '船', 16.00, 864.00, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(36, 6, 10, '船', 2.00, 104.00, '2026-03-09 10:12:44', '2026-03-09 10:12:44'),
(41, 12, 2, '船', 5.00, 190.00, '2026-03-10 03:06:40', '2026-03-10 03:06:40'),
(44, 14, 2, '船', 13.00, 494.00, '2026-03-10 03:21:44', '2026-03-10 03:21:44'),
(51, 4, 9, '船', 5.00, 270.00, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(52, 4, 10, '船', 1.00, 52.00, '2026-03-11 00:58:15', '2026-03-11 00:58:15'),
(58, 13, 2, '船', 2.00, 76.00, '2026-03-17 10:51:02', '2026-03-17 10:51:02'),
(60, 15, 13, '船', 6.00, 360.00, '2026-04-17 11:07:44', '2026-04-17 11:07:44'),
(62, 16, 13, '船', 7.00, 420.00, '2026-04-17 11:09:42', '2026-04-17 11:09:42'),
(63, 17, 14, NULL, 1.00, 59.00, '2026-05-05 06:02:21', '2026-05-05 06:02:21'),
(66, 18, 4, '圓', 14.00, 140.00, '2026-05-05 08:13:26', '2026-05-05 08:13:26'),
(67, 19, 4, '圓', 14.00, 140.00, '2026-05-05 08:25:00', '2026-05-05 08:25:00');

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
(5, 1, '327241.38', 998.00, NULL, NULL, NULL, '', 1, '', '2026-02-12 12:09:09', '2026-02-12 12:09:09'),
(28, 2, '327241.38', NULL, NULL, NULL, NULL, '', 1, '', '2026-03-04 14:31:51', '2026-03-04 14:31:51'),
(45, 3, '40679', 308.00, '2026-03-04', '20:55:00', NULL, '', 10, '', '2026-03-05 06:39:47', '2026-03-05 06:39:47'),
(46, 3, '81358', 348.00, '2026-03-04', '11:08:00', NULL, '', 10, '', '2026-03-05 06:39:47', '2026-03-05 06:39:47'),
(47, 3, '122037', 372.00, '2026-03-03', '21:47:00', NULL, '', 10, '', '2026-03-05 06:39:47', '2026-03-05 06:39:47'),
(48, 3, '162714.1', 357.00, '2026-03-03', '18:46:00', NULL, '', 10, '', '2026-03-05 06:39:47', '2026-03-05 06:39:47'),
(133, 6, '261008', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-06 06:17:08', '2026-03-06 06:17:08'),
(134, 6, '522016', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-06 06:17:08', '2026-03-06 06:17:08'),
(135, 6, '783024', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-06 06:17:08', '2026-03-06 06:17:08'),
(136, 6, '1044029.85', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-06 06:17:08', '2026-03-06 06:17:08'),
(149, 7, '261008', NULL, NULL, NULL, NULL, '', 11, '', '2026-03-09 04:54:54', '2026-03-09 04:54:54'),
(150, 7, '522016', NULL, NULL, NULL, NULL, '', 11, '', '2026-03-09 04:54:54', '2026-03-09 04:54:54'),
(151, 7, '783024', NULL, NULL, NULL, NULL, '', 11, '', '2026-03-09 04:54:54', '2026-03-09 04:54:54'),
(152, 7, '1044029.85', NULL, NULL, NULL, NULL, '', 11, '', '2026-03-09 04:54:54', '2026-03-09 04:54:54'),
(159, 8, '39068.1', 118.00, '2026-03-03', '14:50:00', NULL, '', 10, '', '2026-03-09 10:00:23', '2026-03-09 10:00:23'),
(172, 9, '208500', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-10 03:09:36', '2026-03-10 03:09:36'),
(173, 9, '417000', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-10 03:09:36', '2026-03-10 03:09:36'),
(174, 9, '625500', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-10 03:09:36', '2026-03-10 03:09:36'),
(175, 9, '834000', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-10 03:09:36', '2026-03-10 03:09:36'),
(176, 9, '1042500', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-10 03:09:36', '2026-03-10 03:09:36'),
(195, 5, '25623', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(196, 5, '51246', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(197, 5, '76869', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(198, 5, '102492', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(199, 5, '128115', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(200, 5, '153738', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(201, 5, '179361', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(202, 5, '204984', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(203, 5, '230607', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(204, 5, '256230', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(205, 5, '281853', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(206, 5, '307476', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(207, 5, '333099', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(208, 5, '358722', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(209, 5, '384345', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(210, 5, '409968', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(211, 5, '435591', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(212, 5, '461197.24', NULL, NULL, NULL, NULL, '', 10, '', '2026-03-11 00:33:09', '2026-03-11 00:33:09'),
(243, 4, '24699', 573.00, '2026-03-05', '22:30:00', NULL, '', 10, '54kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(244, 4, '49398', 559.00, '2026-03-05', '08:50:00', NULL, '', 10, '54kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(245, 4, '74097', 634.00, '2026-03-05', '01:47:00', NULL, '', 10, '54kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(246, 4, '98796', 635.00, '2026-03-04', '18:46:00', NULL, '', 10, '54Kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(247, 4, '123495', 643.00, '2026-03-04', '14:50:00', NULL, '', 10, '52kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(248, 4, '148191.21', 667.00, '2026-03-04', '14:33:00', NULL, '', 10, '54kg', '2026-03-11 00:44:05', '2026-03-11 00:44:05'),
(253, 10, '62973', 363.00, '2026-03-10', '16:50:00', NULL, '', 10, '', '2026-03-17 10:23:48', '2026-03-17 10:23:48'),
(254, 10, '125945.95', 382.00, '2026-03-10', '14:53:00', NULL, '', 10, '', '2026-03-17 10:23:48', '2026-03-17 10:23:48'),
(255, 11, '52778', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(256, 11, '105556', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(257, 11, '158334', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(258, 11, '211112', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(259, 11, '263890', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(260, 11, '316666.67', NULL, NULL, NULL, NULL, '', 10, '', '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(290, 12, '411594.2', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:15:35', '2026-05-05 08:15:35'),
(333, 13, '8181', 382.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(334, 13, '16362', 381.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(335, 13, '24543', 382.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(336, 13, '32724', 382.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(337, 13, '40905', 382.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(338, 13, '49086', 285.00, '2026-05-04', NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(339, 13, '57267', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(340, 13, '65448', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(341, 13, '73629', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(342, 13, '81810', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(343, 13, '89991', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(344, 13, '98172', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(345, 13, '106353', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53'),
(346, 13, '114529.91', NULL, NULL, NULL, NULL, '', 10, '', '2026-05-05 08:17:53', '2026-05-05 08:17:53');

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
(1, 'SI-001', 'M3-1.5x13.5', '鋼', '公制', 2.90, 15.00, 'pcs', 'V4.2測試用M3螺絲', '2025-08-13 21:00:00', '2025-12-06 14:01:49'),
(2, 'SI-002', 'M4-2.0x16.0', '不銹鋼', '公制', 0.68, 20.00, 'pcs', 'V4.2測試用M4螺絲', '2025-08-13 21:00:00', '2025-08-13 21:00:00'),
(3, 'SI-003', 'M3-2.5x13.5', '', '', 1.00, 18.50, 'pcs', '', '2025-08-17 14:25:04', '2025-08-18 05:25:15'),
(4, 'PROD-68a2ba14f23ba', 'M4-1.5x13.5', NULL, NULL, 1.40, 22.00, 'pcs', NULL, '2025-08-18 05:28:52', '2025-08-18 05:28:52'),
(6, 'PROD-68a432b32fad2', 'M3-1.5x13.6', NULL, NULL, 1.00, 16.00, 'pcs', NULL, '2025-08-19 08:15:47', '2025-08-19 08:15:47'),
(7, 'PROD-68a43f90e1e3f', 'M3-1.5x13.7', NULL, NULL, 4.00, 17.00, 'pcs', NULL, '2025-08-19 09:10:40', '2025-08-19 09:10:40'),
(10, 'SI-004', 'm.3', '鋼', '公制', 1.40, 14.50, 'pcs', NULL, '2025-10-05 13:21:25', '2025-10-05 13:21:25'),
(11, 'SI-005', 'M.3', NULL, NULL, 1.50, 15.00, 'pcs', NULL, '2025-10-05 13:34:34', '2025-10-05 13:34:34'),
(12, '8M01110369', 'M6-1.0X23.65/22.35', NULL, NULL, 7.59, 20.00, 'pcs', '全檢20', '2026-03-04 11:31:10', '2026-03-04 11:31:10'),
(13, '269547-D.1', '8.85X26.5', NULL, NULL, 23.22, 25.00, 'pcs', '出功協', '2026-03-05 09:58:43', '2026-03-05 09:58:43'),
(14, 'S001370', 'M4-1.8X16', NULL, NULL, 1.34, 12.00, 'pcs', NULL, '2026-03-06 05:21:24', '2026-03-06 05:21:24'),
(15, 'GJA20002DO-4Z0S', '#8-32X12', NULL, NULL, 2.79, 15.00, 'pcs', NULL, '2026-03-09 09:12:57', '2026-03-09 09:12:57'),
(16, '100880', '01-M6', NULL, NULL, 1.60, 30.00, 'pcs', '總厚度可放寬至4.82-5.00\n內孔徑可放寬至5.00-5.09', '2026-03-10 02:51:35', '2026-03-10 02:51:35'),
(17, '33049-2', '03-M6', NULL, NULL, 5.55, 18.00, 'pcs', '與32989材質不同，不可混料', '2026-03-10 03:18:47', '2026-03-10 03:18:47'),
(18, 'CTS-S-4079', 'M6X45', NULL, NULL, 6.18, 18.00, 'pcs', '全檢15+單趟運費3=18元/M', '2026-04-17 11:01:51', '2026-04-17 11:01:51'),
(19, 'B226037', 'M3-1.12X10', NULL, NULL, 0.69, 16.00, 'pcs', '頭下第一牙\n單重4位數 0.6942', '2026-05-05 05:56:09', '2026-05-05 05:57:01'),
(20, 'A02890501 REV B1/4-20X1.640/1.760', '1/4-20X1.640/1.760', NULL, NULL, 16.38, 43.00, 'pcs', '圓桶換船桶', '2026-05-05 07:38:10', '2026-05-05 07:38:10');

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
(1, 'SV-S-001', '頭高', 'Head Height', '一般全檢', NULL, 15.00, NULL, NULL, NULL, NULL, 50, 1, '2025-08-13 21:00:00', '2026-03-06 06:28:11'),
(2, 'SRV-002', '總長度', 'Length', '一般全檢', '檢測螺絲總長度', 10.00, 41.6600, NULL, 44.7000, NULL, 50, 1, '2025-08-13 21:00:00', '2026-05-05 06:04:38'),
(7, 'SV-S-004', '牙外徑', 'Thread of Diameter', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2025-08-19 05:23:57', '2026-05-05 06:04:51'),
(8, 'SV-S-005', '有無牙', 'Within Thread', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2025-08-19 09:17:31', '2026-05-05 06:05:03'),
(9, 'SV-S-006', '混料雜質', 'Mixed Impurities', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 0, 1, '2025-08-19 11:09:56', '2026-03-04 10:30:17'),
(11, 'SV-S-032', '上視裂', 'Head Crack', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2025-12-06 09:04:28', '2026-05-05 08:23:16'),
(12, 'SV-S-033', '側裂', 'Head Crack', '特殊加選', NULL, 10.00, NULL, NULL, NULL, NULL, 50, 1, '2025-12-06 09:05:09', '2026-05-05 08:23:43'),
(13, 'SV-S-034', '頭下裂', 'Crack Under Head', '特殊加選', NULL, 10.00, NULL, NULL, NULL, NULL, 50, 1, '2025-12-06 09:05:39', '2026-05-05 06:04:00'),
(14, 'SV-S-002', '頭寬', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:28:39', '2026-03-04 10:28:39'),
(15, 'SV-S-003', '頭下長度', 'Length under Head', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:29:13', '2026-05-05 06:04:15'),
(16, 'SV-S-007', '真圓度', NULL, '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:31:06', '2026-03-04 10:31:19'),
(17, 'SV-S-008', '頭裂', 'Head Crack', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:31:50', '2026-05-05 06:04:28'),
(19, 'SV-S-009', '頭高(含焊點)', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:34:52', '2026-03-04 10:34:52'),
(20, 'SV-S-010', '焊點下長度', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:35:20', '2026-03-04 10:35:20'),
(21, 'SV-S-011', '華司厚', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:36:43', '2026-03-04 10:36:43'),
(22, 'SV-S-013', '華司徑', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:37:12', '2026-03-04 10:37:12'),
(23, 'SV-S-014', '桿徑', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:37:54', '2026-03-04 10:37:54'),
(24, 'SV-S-015', '桿長', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:38:20', '2026-03-04 10:39:06'),
(25, 'SV-S-016', '狗尾徑', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:38:57', '2026-03-04 10:39:12'),
(26, 'SV-S-017', '有無狗尾', 'With Dog Point', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:39:53', '2026-05-05 08:24:25'),
(27, 'SV-S-020', '有無焊點', NULL, '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:41:43', '2026-03-04 10:41:43'),
(28, 'SV-S-021', '頭下第一牙', NULL, '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:42:20', '2026-03-04 10:42:50'),
(29, 'SV-S-022', '節距', 'Pitch', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:43:36', '2026-05-05 08:24:03'),
(30, 'SV-S-023', '斜牙', 'Cross Thread', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:44:09', '2026-05-05 08:24:11'),
(31, 'SV-S-024', '牙品質', 'Thread Quality', '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-04 10:44:59', '2026-05-05 06:03:27'),
(32, 'SV-S-025', '跳牙-節距、斜牙、牙品質', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:47:14', '2026-03-06 06:25:21'),
(33, 'SV-S-026', '滑牙', NULL, '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 5, 1, '2026-03-04 10:47:38', '2026-03-04 10:47:38'),
(34, 'SV-S-027', '牙底徑', NULL, '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:48:24', '2026-03-04 10:48:24'),
(36, 'SV-S-028', '偏心', NULL, NULL, NULL, 5.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:49:08', '2026-03-04 10:49:08'),
(38, 'SV-S-029', '合BIT', NULL, '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:51:58', '2026-03-04 10:51:58'),
(39, 'SV-S-030', '斷針', NULL, '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:52:32', '2026-03-04 10:52:32'),
(41, 'SV-S-031', '電鍍不良', NULL, '特殊加選', NULL, 5.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-04 10:53:44', '2026-03-04 10:53:44'),
(42, 'SV-S-018', '有無針孔', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-06 05:57:20', '2026-03-10 02:53:24'),
(48, 'SV-S-035', '跳牙', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-06 06:06:55', '2026-03-06 06:06:55'),
(49, 'SV-N-001', '輪緣外徑', NULL, '一般全檢', NULL, 15.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:54:05', '2026-03-10 02:54:05'),
(50, 'SV-N-002', '輪緣厚度', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:54:34', '2026-03-10 02:54:34'),
(51, 'SV-N-003', '總厚度', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:54:52', '2026-03-10 02:54:52'),
(52, 'SV-N-004', '內孔徑', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:55:06', '2026-03-10 02:55:06'),
(53, 'SV-N-005', '孔內有無牙', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 0, 1, '2026-03-10 02:55:38', '2026-03-10 02:55:38'),
(54, 'SV-N-006', '有無通孔', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:56:00', '2026-03-10 02:56:00'),
(55, 'SV-N-007', '孔內異物、毛邊', NULL, NULL, NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:56:27', '2026-03-10 02:56:27'),
(56, 'SV-N-008', '六角對邊', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:56:49', '2026-03-10 02:56:49'),
(57, 'SV-N-009', '六角對角', NULL, '一般全檢', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:57:03', '2026-03-10 02:57:03'),
(58, 'SV-N-010', '輪裂', 'Flange Crack', '特殊加選', NULL, 0.00, NULL, NULL, NULL, NULL, 50, 1, '2026-03-10 02:57:23', '2026-05-05 06:03:05');

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

--
-- 傾印資料表的資料 `suppliers`
--

INSERT INTO `suppliers` (`id`, `supplier_number`, `name`, `service_type`, `contact_person`, `phone`, `email`, `address`, `supplier_type`, `tax_id`, `owner`, `contact_mobile`, `fax`, `factory_address`, `product_category`, `bank_account_name`, `bank_name`, `bank_code`, `bank_branch_name`, `bank_branch_code`, `bank_account_number`, `payment_method`, `attachment_path`, `notes`, `created_at`, `updated_at`, `deleted_at`, `delete_token`) VALUES
(1, 'SUPP-001', '精銳材料科技', '原物料', '吳經理', '03-452-1122', 'sales@jingray.com.tw', '桃園市中壢區中正路50號', '原料供應商', '12312312', '吳董事長', '0933-123-456', '03-452-1123', '桃園市觀音區工業三路10號', '特殊鋼材', '精銳材料科技股份有限公司', '玉山銀行', '808', '中壢分行', '0069', '0069-1234567890', '月結60天', 'uploads/suppliers/Pb7CWNY.jpg', '品質穩定', '2025-12-04 13:08:21', '2026-05-06 10:14:15', '2026-05-06 10:14:15', 1),
(2, 'SUPP-002', '宏利熱處理', '熱處理', '陳廠長', '04-2561-8899', 'service@hongli-heat.com', '台中市大雅區中清路四段300號', '加工服務商', '32132132', '陳老闆', '0928-654-321', '04-2561-8898', '台中市大雅區中清路四段300號', '金屬熱處理', '宏利熱處理工業社', '合作金庫', '006', '大雅分行', '0233', '0233-9876543210', '月結45天', '/uploads/suppliers/supp002.jpg', '交貨準時', '2025-12-04 13:08:21', '2026-05-06 10:14:24', '2026-05-06 10:14:24', 2),
(3, 'SUPP-003', '通達物流運輸', '物流', '林調度', '07-821-5566', 'dispatch@tongda-log.com', '高雄市前鎮區漁港路88號', '物流夥伴', '45645645', '林總', '0910-555-888', '07-821-5567', '高雄市前鎮區漁港路88號', '國內運輸', '通達物流股份有限公司', '第一銀行', '007', '前鎮分行', '0344', '0344-1122334455', '月結30天', '/uploads/suppliers/supp003.png', '24小時服務', '2025-12-04 13:08:21', '2026-05-06 10:14:12', '2026-05-06 10:14:12', 3),
(4, 'SUPP-004', '永續包材公司', '包裝材料', '蔡小姐', '02-2680-1234', 'sales@yongxu-pack.com', '新北市樹林區佳園路三段50號', '包材供應商', '65465465', '蔡董', '0937-888-999', '02-2680-1235', '新北市樹林區佳園路三段50號', '紙箱、緩衝材', '永續包材企業有限公司', '華南銀行', '008', '樹林分行', '0567', '0567-6677889900', '月結45天', '/uploads/suppliers/supp004.pdf', '環保材質', '2025-12-04 13:08:21', '2026-05-06 10:14:17', '2026-05-06 10:14:17', 4),
(5, 'SUPP-005', '全方位檢測', '檢測服務', '張博士', '06-505-8888', 'lab@all-testing.com.tw', '台南市新市區南科一路1號', '檢測實驗室', '78978978', '張主任', '0966-111-222', '06-505-8889', '台南市新市區南科一路1號', '材料分析', '全方位檢測股份有限公司', '台灣銀行', '004', '南科分行', '0123', '0123-2233445566', '專案結算', '/uploads/suppliers/supp005.jpg', '報告詳細', '2025-12-04 13:08:21', '2026-05-06 10:14:22', '2026-05-06 10:14:22', 5),
(6, 'SUPP-006', '一品電鍍工業', '電鍍', '黃老闆', '07-699-1111', 'boss@yipin-plating.com', '高雄市路竹區路科五路20號', '表面處理商', '98798798', '黃大發', '0912-999-000', '07-699-1112', '高雄市路竹區路科五路20號', '鍍鋅、鍍鎳', '一品電鍍工業有限公司', '土地銀行', '005', '路竹分行', '0456', '0456-3344556677', '月結60天', '/uploads/suppliers/supp006.png', '品質優良', '2025-12-04 13:08:21', '2026-05-06 10:14:19', '2026-05-06 10:14:19', 6),
(7, 'SUPP-007', '德商儀器校正', '設備校正', 'Mr. Schmidt', '03-577-1234', 'service.tw@german-cal.com', '新竹市東區科學園區力行一路1號', '技術服務', '24682468', 'Mr. Schmidt', '0988-246-810', '03-577-1235', '新竹市東區科學園區力行一路1號', '精密儀器校正', '德商儀器校正有限公司台灣分公司', '德意志銀行', '013', '新竹分行', '0888', '0888-1357924680', '票期90天', '/uploads/suppliers/supp007.pdf', '國際認證', '2025-12-04 13:08:21', '2026-05-06 10:14:29', '2026-05-06 10:14:29', 7),
(8, 'SUPP-008', '日月光潤滑油', '潤滑油品', '葉先生', '04-2630-5566', 'sales@sunoil.com.tw', '台中市龍井區工業路20號', '耗材供應商', '13571357', '葉董', '0921-357-913', '04-2630-5567', '台中市龍井區工業路20號', '工業用潤滑油', '日月光潤滑油品有限公司', '彰化銀行', '009', '龍井分行', '0789', '0789-1212121212', '月結30天', '/uploads/suppliers/supp008.jpg', '種類齊全', '2025-12-04 13:08:21', '2026-05-06 10:14:31', '2026-05-06 10:14:31', 8),
(9, 'SUPP-009', '松柏資訊系統', '資訊委外', '簡工程師', '02-7709-9988', 'support@songbai-it.com', '台北市內湖區瑞光路513巷30號', 'IT服務', '80248024', '簡總', '0972-802-480', '02-7709-9989', '台北市內湖區瑞光路513巷30號', '系統維護', '松柏資訊系統股份有限公司', '中國信託', '822', '內湖分行', '0678', '0678-8024802480', '年度合約', '/uploads/suppliers/supp009.png', '服務快速', '2025-12-04 13:08:21', '2026-05-06 10:14:36', '2026-05-06 10:14:36', 9),
(10, 'SUPP-010', '綠能環保工程', '環保顧問', '梁顧問', '08-778-9900', 'service@green-eco.com', '屏東縣內埔鄉學府路1號', '顧問服務', '57915791', '梁博士', '0931-579-157', '08-778-9901', '屏東縣內埔鄉學府路1號', '環評、廢棄物處理', '綠能環保工程顧問有限公司', '屏東一信', '158', '內埔分社', '0147', '0147-5791579157', '專案結算', '/uploads/suppliers/supp010.pdf', '專業可靠', '2025-12-04 13:08:21', '2026-05-06 10:14:44', '2026-05-06 10:14:44', 10),
(11, 'SUPP-011', '泰坦工具機', '機械設備', '彭經理', '06-253-8888', 'sales@titan-machinery.com', '台南市永康區中正北路500號', '設備製造商', '24681357', '彭董', '0918-246-813', '06-253-8889', '台南市永康區中正北路500號', 'CNC工具機', '泰坦工具機股份有限公司', '兆豐銀行', '017', '永康分行', '0987', '0987-2468135791', '票期120天', '/uploads/suppliers/supp011.jpg', '技術領先', '2025-12-04 13:08:21', '2026-05-06 10:14:38', '2026-05-06 10:14:38', 11),
(12, 'SUPP-012', '福爾摩沙模具', '模具開發', '詹廠長', '04-882-3333', 'factory@formosa-mold.com', '彰化縣溪湖鎮員鹿路三段100號', '模具製造商', '97539753', '詹老闆', '0925-975-397', '04-882-3334', '彰化縣溪湖鎮員鹿路三段100號', '塑膠射出模具', '福爾摩沙模具有限公司', '台新銀行', '812', '員林分行', '0444', '0444-9753975397', '專案結算', '/uploads/suppliers/supp012.png', '開模精準', '2025-12-04 13:08:21', '2026-05-06 10:14:41', '2026-05-06 10:14:41', 12),
(13, 'SUPP-013', '安全守衛保全', '保全服務', '史隊長', '02-2768-1110', 'guard@safe-security.com.tw', '台北市松山區南京東路五段88號', '安全服務', '86428642', '史總', '0936-864-286', '02-2768-1119', '台北市松山區南京東路五段88號', '廠房保全', '安全守衛保全股份有限公司', '國泰世華', '013', '南京東路分行', '0103', '0103-8642864286', '月結30天', '/uploads/suppliers/supp013.pdf', '24H駐點', '2025-12-04 13:08:21', '2026-05-06 10:14:46', '2026-05-06 10:14:46', 13),
(14, 'SUPP-014', '亞力山大氣體', '工業氣體', '孟先生', '07-351-9988', 'sales@alex-gas.com', '高雄市大社區旗楠路200號', '原料供應商', '75317531', '孟董', '0955-753-175', '07-351-9989', '高雄市大社區旗楠路200號', '氮氣、氧氣', '亞力山大氣體工業有限公司', '上海商銀', '011', '楠梓分行', '0411', '0411-7531753175', '月結45天', '/uploads/suppliers/supp014.jpg', '供氣穩定', '2025-12-04 13:08:21', '2026-05-06 10:14:48', '2026-05-06 10:14:48', 14),
(15, 'SUPP-015', '達文西設計', '工業設計', 'DaVinci', '04-2220-8888', 'design@davinci-id.com', '台中市西區五權西四街55號', '設計服務', '19281928', 'DaVinci', '0977-192-819', '04-2220-8889', '台中市西區五權西四街55號', '產品外觀設計', '達文西設計工作室', '聯邦銀行', '803', '台中分行', '0366', '0366-1928192819', '專案結算', '/uploads/suppliers/supp015.png', '設計創新', '2025-12-04 13:08:21', '2026-05-06 10:14:55', '2026-05-06 10:14:55', 15),
(16, 'SUPP-016', '華佗勞工健檢', '醫療服務', '邱護理師', '03-328-1200', 'service@huatuo-health.com.tw', '桃園市龜山區復興街5號', '健康服務', '37463746', '邱院長', '0917-374-637', '03-328-1201', '桃園市龜山區復興街5號', '勞工體檢', '華佗綜合醫院', '長庚醫院', '999', '林口分院', '9999', '9999-3746374637', '批次結算', '/uploads/suppliers/supp016.pdf', '報告快速', '2025-12-04 13:08:21', '2026-05-06 10:14:51', '2026-05-06 10:14:51', 16),
(17, 'SUPP-017', '牛頓力學顧問', '工程顧問', '鈕顧問', '02-2361-9988', 'newton@mechanics-consult.com', '台北市中正區羅斯福路四段1號', '顧問服務', '58675867', '鈕博士', '0929-586-758', '02-2361-9989', '台北市中正區羅斯福路四段1號', '結構分析', '牛頓力學工程顧問有限公司', '元大銀行', '806', '公館分行', '0222', '0222-5867586758', '專案結算', '/uploads/suppliers/supp017.jpg', '分析精確', '2025-12-04 13:08:21', '2026-05-06 10:14:53', '2026-05-06 10:14:53', 17),
(18, 'SUPP-018', '哥倫布海運', '國際貨運', '柯經理', '02-2567-1492', 'sales.tw@columbus-ship.com', '台北市中山区松江路200號', '物流夥伴', '14921492', '柯總', '0938-149-214', '02-2567-1493', '台北市中山区松江路200號', '海運承攬', '哥倫布環球海運股份有限公司', '美國銀行', '033', '台北分行', '0101', '0101-1492149214', '航次結算', '/uploads/suppliers/supp018.png', '全球航線', '2025-12-04 13:08:21', '2026-05-06 10:15:16', '2026-05-06 10:15:16', 18),
(19, 'SUPP-019', '居禮夫人化工', '化學藥品', '瑪麗', '07-695-1898', 'marie@curie-chem.com', '高雄市大寮區華中路10號', '原料供應商', '18981898', '居禮夫人', '0956-189-818', '07-695-1899', '高雄市大寮區華中路10號', '清洗劑、防鏽劑', '居禮夫人化工廠', '台灣企銀', '050', '大寮分行', '0555', '0555-1898189818', '月結60天', '/uploads/suppliers/supp019.pdf', '品質純正', '2025-12-04 13:08:21', '2026-05-06 10:14:57', '2026-05-06 10:14:57', 19),
(20, 'SUPP-020', '愛迪生電力', '電力工程', '湯姆', '03-422-7151', 'tom@edison-power.com', '桃園市中壢區中大路300號', '工程服務', '18791879', '湯姆愛迪生', '0965-187-918', '03-422-7152', '桃園市中壢區中大路300號', '高壓電工程', '愛迪生電力工程有限公司', '新光銀行', '103', '中壢分行', '0333', '0333-1879187918', '專案結算', '/uploads/suppliers/supp020.jpg', '安全第一', '2025-12-04 13:08:21', '2026-05-06 10:15:00', '2026-05-06 10:15:00', 20),
(21, 'SUPP-021', '達爾文生物科技', '廢水處理', '查爾斯', '06-275-7575', 'charles@darwin-bio.com', '台南市東區大學路1號', '環保服務', '18591859', '查爾斯達爾文', '0973-185-918', '06-275-7576', '台南市東區大學路1號', '生物廢水處理', '達爾文生物科技有限公司', '京城銀行', '054', '府城分行', '0111', '0111-1859185918', '月結45天', '/uploads/suppliers/supp021.png', '處理效能高', '2025-12-04 13:08:21', '2026-05-06 10:15:04', '2026-05-06 10:15:04', 21),
(22, 'SUPP-022', '盤古開天軟體', 'ERP系統', '盤古', '02-8751-8888', 'pangu@pangu-soft.com', '台北市內湖區堤頂大道二段188號', 'IT服務', '20242024', '盤古大神', '0987-202-420', '02-8751-8889', '台北市內湖區堤頂大道二段188號', 'ERP客製化', '盤古開天軟體股份有限公司', '富邦銀行', '012', '內湖分行', '0688', '0688-2024202420', '年度合約', '/uploads/suppliers/supp022.pdf', '系統穩定', '2025-12-04 13:08:21', '2026-05-06 10:15:02', '2026-05-06 10:15:02', 22),
(23, 'SUPP-023', '后羿太陽能板', '太陽能板', '后羿', '08-889-2025', 'houyi@houyi-solar.com', '屏東縣恆春鎮墾丁路596號', '設備供應商', '20252025', '后羿', '0989-202-520', '08-889-2026', '屏東縣恆春鎮墾丁路596號', '太陽能模組', '后羿太陽能板製造有限公司', '高雄銀行', '016', '恆春分行', '0440', '0440-2025202520', '批次結算', '/uploads/suppliers/supp023.jpg', '發電效率高', '2025-12-04 13:08:21', '2026-05-06 10:15:06', '2026-05-06 10:15:06', 23),
(24, 'SUPP-024', '夸父追日照明', 'LED照明', '夸父', '05-272-2026', 'kuafu@kuafu-led.com', '嘉義縣民雄鄉大學路168號', '耗材供應商', '20262026', '夸父', '0976-202-620', '05-272-2027', '嘉義縣民雄鄉大學路168號', 'LED燈具', '夸父追日照明有限公司', '凱基銀行', '809', '嘉義分行', '0501', '0501-2026202620', '月結30天', '/uploads/suppliers/supp024.png', '節能省電', '2025-12-04 13:08:21', '2026-05-06 10:15:08', '2026-05-06 10:15:08', 24),
(25, 'SUPP-025', '女媧補天防水', '防水工程', '女媧', '02-2918-2027', 'nuwa@nuwa-proof.com', '新北市新店區北新路三段200號', '工程服務', '20272027', '女媧', '0961-202-720', '02-2918-2028', '新北市新店區北新路三段200號', '廠房防水工程', '女媧補天工程行', '安泰銀行', '816', '新店分行', '0215', '0215-2027202720', '專案結算', '/uploads/suppliers/supp025.pdf', '滴水不漏', '2025-12-04 13:08:21', '2026-05-06 10:15:13', '2026-05-06 10:15:13', 25),
(26, 'SUPP-026', '神農氏有機食材', '團膳', '神農', '049-291-2028', 'shennong@organic.com', '南投縣埔里鎮大學路1號', '餐飲服務', '20282028', '神農', '0979-202-820', '049-291-2029', '南投縣埔里鎮大學路1號', '有機團膳', '神農氏有機農場', '暨南大學', '998', '校內郵局', '9988', '9988-2028202820', '月結30天', '/uploads/suppliers/supp026.jpg', '健康美味', '2025-12-04 13:08:21', '2026-05-06 10:15:10', '2026-05-06 10:15:10', 26),
(27, 'SUPP-027', '倉頡文具印刷', '辦公用品', '倉頡', '06-253-2029', 'cangjie@cangjie-print.com', '台南市永康區南台街1號', '耗材供應商', '20292029', '倉頡', '0954-202-920', '06-253-2030', '台南市永康區南台街1號', '文具、印刷品', '倉頡文具印刷行', '永豐銀行', '807', '永康分行', '0314', '0314-2029202920', '月結45天', '/uploads/suppliers/supp027.png', '送貨迅速', '2025-12-04 13:08:21', '2026-05-06 10:15:21', '2026-05-06 10:15:21', 27),
(28, 'SUPP-028', '奧林帕斯機油', '特殊潤滑油', '宙斯', '07-381-2030', 'zeus@olympus-oil.com', '高雄市三民區建工路415號', '耗材供應商', '20302030', '宙斯', '0983-203-020', '07-381-2031', '高雄市三民區建工路415號', '高溫潤滑油脂', '奧林帕斯機油股份有限公司', '陽信銀行', '108', '建工分行', '0258', '0258-2030203020', '月結60天', '/uploads/suppliers/supp028.pdf', '耐高溫', '2025-12-04 13:08:21', '2026-05-06 10:15:23', '2026-05-06 10:15:23', 28),
(29, 'SUPP-029', '瓦爾哈拉鍛造', '鍛造加工', '奧丁', '04-778-2031', 'odin@valhalla-forge.com', '彰化縣鹿港鎮彰濱工業區工西七路1號', '加工服務商', '20312031', '奧丁', '0985-203-120', '04-778-2032', '彰化縣鹿港鎮彰濱工業區工西七路1號', '金屬鍛造', '瓦爾哈拉鍛造廠', '三信商銀', '147', '鹿港分行', '0058', '0058-2031203120', '專案結算', '/uploads/suppliers/supp029.jpg', '強度高', '2025-12-04 13:08:21', '2026-05-06 10:15:25', '2026-05-06 10:15:25', 29),
(30, 'SUPP-030', '阿斯嘉特防鏽', '防鏽處理', '索爾', '03-490-2032', 'thor@asgard-rust.com', '桃園市新屋區永安里10鄰2號', '表面處理商', '20322032', '索爾', '0986-203-220', '03-490-2033', '桃園市新屋區永安里10鄰2號', '戶外防鏽漆', '阿斯嘉特防鏽工業', '桃園農改場', '777', '信用部', '7777', '7777-2032203220', '月結30天', '/uploads/suppliers/supp030.png', '耐候性佳', '2025-12-04 13:08:21', '2026-03-06 04:42:17', '2026-03-06 04:42:17', 30),
(31, 'SUP-C-001', '精湛光學科技股份有限公司', '篩選機', '蔡侑霖', '07-693-7937', NULL, '82945高雄市湖內區忠孝街110巷58號', '製造', '89855649', '吳俊男', '0932-558-061', '07-693-7071', '82945高雄市湖內區忠孝街110巷58號', NULL, '精湛光學科技股份有限公司', '土地銀行', '005', '路竹分行', '0706', NULL, '月結60天', 'uploads/suppliers/精湛_頁面_2.jpg', NULL, '2026-03-06 04:42:55', '2026-03-06 04:48:12', NULL, 0),
(32, 'SUP-C-002', '昱權工業有限公司', '篩選機', '劉劉巧瑩\'S', '02-8521-7951', NULL, '新北市新莊區化成路349巷13號1樓', NULL, '36318419', '劉英宗', NULL, '02-8521-7950', '24252新北市新莊區化成路349巷13號', NULL, NULL, '台灣企銀', NULL, '化成分行', NULL, '02712016968', '月結60天', 'uploads/suppliers/精湛_頁面_2.jpg', '02-2991-6963 電工黃\'R', '2026-03-06 04:54:15', '2026-03-06 04:54:15', NULL, 0),
(33, 'SUP-D-001', '陳木全', '汽車倒車顯影', '陳木全', NULL, NULL, NULL, NULL, NULL, NULL, '0936507380', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-13 02:35:54', '2026-03-13 02:35:54', NULL, 0),
(34, 'SUP-D-002', '第一銀行', NULL, '周庭仲 #314', '07-696-3211', NULL, NULL, NULL, NULL, NULL, '0921-572-965', '07-697-2775', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-13 09:12:01', '2026-03-13 09:12:01', NULL, 0),
(35, 'SUP-D-003', '平實會計事務所', NULL, '林\'S #312   蔡\'S #311', '07-697-3131', NULL, '高雄市路竹區中山路901號', NULL, NULL, NULL, NULL, '07-697-3132', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0933-366-789 蔡明仁', '2026-03-13 09:14:15', '2026-03-13 09:14:15', NULL, 0),
(36, 'SUP-D-004', '回收大姐-琴仔', '資源回收', '回收大姐-琴仔', NULL, NULL, NULL, NULL, NULL, NULL, '0921-263-122', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-20 02:07:18', '2026-03-20 02:07:50', NULL, 0),
(37, 'SUP-D-005', '柏泉企業社', '桶裝水', '張俊國\'r', '07-607-5158', NULL, NULL, NULL, NULL, NULL, '0983-023-816', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '月結30天', NULL, NULL, '2026-03-20 02:09:55', '2026-03-20 02:10:13', NULL, 0);

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
  `target_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '目標ID清單（部門/角色/使用者）' CHECK (json_valid(`target_ids`)),
  `related_module` varchar(50) DEFAULT NULL COMMENT '關聯模組',
  `related_id` bigint(20) DEFAULT NULL COMMENT '關聯資料ID',
  `created_by` bigint(20) DEFAULT NULL COMMENT '建立者（系統自動為NULL）',
  `expires_at` datetime DEFAULT NULL COMMENT '過期時間',
  `is_active` tinyint(1) DEFAULT 1 COMMENT '是否啟用',
  `status` enum('draft','published') NOT NULL DEFAULT 'published' COMMENT '???嚗?raft=??阮, published=撌脩?撣',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系統通知表';

--
-- 傾印資料表的資料 `system_notifications`
--

INSERT INTO `system_notifications` (`id`, `title`, `content`, `notification_type`, `priority`, `target_type`, `target_ids`, `related_module`, `related_id`, `created_by`, `expires_at`, `is_active`, `status`, `created_at`, `updated_at`) VALUES
(1, 'test', 'test', 'announcement', 'urgent', 'all', NULL, NULL, NULL, 1, '2026-02-12 14:49:00', 1, 'published', '2026-02-12 14:49:29', '2026-02-12 14:49:29'),
(2, 'test', 'test', 'announcement', 'urgent', 'all', NULL, NULL, NULL, 1, '2026-02-12 14:50:00', 1, 'published', '2026-02-12 14:50:49', '2026-02-12 14:50:49'),
(4, 'terst', 'terst', 'announcement', 'urgent', 'user', '[4,3,1]', NULL, NULL, 1, '2026-02-13 18:22:00', 1, 'draft', '2026-02-12 18:22:49', '2026-02-12 18:22:49'),
(5, 'test', 'tttttt', 'announcement', 'low', 'all', NULL, NULL, NULL, 1, '2026-03-17 23:10:00', 1, 'published', '2026-03-02 23:10:26', '2026-03-02 23:10:26');

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
(5, 'security.auto_refresh.enabled', '1', '版本更新偵測', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(6, 'security.auto_refresh.interval_minutes', '60', '版本檢查間隔（分鐘）', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(7, 'security.auto_logout.enabled', '1', '閒置自動登出', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(8, 'security.auto_logout.idle_minutes', '480', '閒置逾時（分鐘）', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(9, 'security.auto_logout.warning_seconds', '100', '登出前警告秒數', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(10, 'security.lockout.enabled', '0', '登入失敗鎖定', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(11, 'security.lockout.max_attempts', '5', '最大失敗次數', '2026-03-03 14:41:57', '2026-03-27 08:59:06'),
(12, 'security.lockout.window_minutes', '15', '鎖定時間窗口（分鐘）', '2026-03-03 14:41:57', '2026-03-27 08:59:06');

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
(1, 'DD-002', '50KG船', '船', 'available', 19, NULL, 50.00, NULL, '2026-02-12 11:04:39', '2026-03-04 11:06:06', NULL, 0),
(2, 'DD-003', '38KG船', '船', 'available', 19, NULL, 38.00, NULL, '2026-02-12 12:10:49', '2026-03-04 11:06:03', NULL, 0),
(3, 'DD-004', '53KG船', '船', 'available', 19, NULL, 53.00, NULL, '2026-03-04 11:05:44', '2026-03-04 11:05:56', NULL, 0),
(4, 'DD-001', '10KG圓', '圓', 'available', NULL, NULL, 10.00, NULL, '2026-03-04 11:06:22', '2026-03-04 11:06:22', NULL, 0),
(5, 'DD-005', '40KG船', '中船', 'available', NULL, NULL, 40.00, NULL, '2026-03-04 11:07:23', '2026-03-04 11:07:23', NULL, 0),
(6, 'DD-006', '57KG船', '大船', 'available', NULL, NULL, 57.00, NULL, '2026-03-04 11:07:49', '2026-03-04 11:07:49', NULL, 0),
(9, 'DD-007', '54KG船', '船', 'available', NULL, NULL, 54.00, NULL, '2026-03-05 09:59:34', '2026-03-05 09:59:34', NULL, 0),
(10, 'DD-008', '52KG船', '船', 'available', NULL, NULL, 52.00, NULL, '2026-03-05 10:06:42', '2026-03-05 10:06:42', NULL, 0),
(11, 'DD-009', '55KG-侑城桶', NULL, 'available', NULL, NULL, 55.00, NULL, '2026-03-10 03:13:33', '2026-03-10 03:13:33', NULL, 0),
(13, 'DD-010', '60KG', '船', 'available', NULL, NULL, 60.00, NULL, '2026-04-17 11:04:38', '2026-04-17 11:04:38', NULL, 0),
(14, 'DD-011', '59KG船', NULL, 'available', NULL, NULL, 59.00, NULL, '2026-05-05 05:59:31', '2026-05-05 05:59:31', NULL, 0);

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

--
-- 傾印資料表的資料 `user_messages`
--

INSERT INTO `user_messages` (`id`, `sender_id`, `subject`, `content`, `reply_to_id`, `send_to_all`, `status`, `created_at`, `updated_at`, `sender_deleted_at`) VALUES
(1, 1, 'terst', '<h3>aaaa</h3>', NULL, 0, 'sent', '2026-02-12 14:52:54', '2026-02-12 14:52:54', NULL),
(2, 1, '333', '<p><b>rrrrrr</b></p>', NULL, 1, 'sent', '2026-02-12 14:58:43', '2026-02-12 14:58:43', NULL),
(3, 1, 'test', 'test', NULL, 0, 'draft', '2026-02-12 16:30:07', '2026-02-12 16:30:07', NULL),
(4, 1, 'test', '<b>test</b>', NULL, 1, 'draft', '2026-02-12 16:42:06', '2026-02-12 16:42:06', NULL),
(5, 1, 'ddddd', '<b>dddd</b>', NULL, 1, 'sent', '2026-02-12 17:12:14', '2026-02-12 17:12:14', NULL),
(6, 9, '修改-離線時間', '<b>登打資料過程中，出現&nbsp; 【尚未登入或登入已過期</b><p>導致資料無法儲存，需再重新輸入</p><p><br></p><p>請問<b>能不設定自動離開時間嗎?</b></p><p><br></p>', NULL, 1, 'sent', '2026-03-03 13:07:25', '2026-03-03 13:30:39', '2026-03-03 13:30:39'),
(7, 10, '修改-無法輸入機台名稱', '輸入 機台名稱 時會出現錯誤，無法儲存，<p>請協助修改。謝謝<br><p><br></p></p>', NULL, 1, 'sent', '2026-03-04 18:05:43', '2026-03-04 18:05:43', NULL);

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
(1, 'WO-20260212-0001', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 1, '2026-02-12 11:17:54', '2026-02-12 12:09:09', NULL, 0),
(2, 'WO-20260228-0001', 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 0, '2026-02-28 08:02:52', '2026-03-04 14:31:51', NULL, 0),
(3, 'WO-20260304-0001', 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '470', NULL, NULL, NULL, NULL, 28, 1, '2026-03-04 11:39:27', '2026-03-05 05:59:04', NULL, 0),
(4, 'WO-20260305-0001', 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 1, '2026-03-05 10:08:04', '2026-03-11 00:44:05', NULL, 0),
(5, 'WO-20260305-0002', 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 1, '2026-03-05 10:12:40', '2026-03-11 00:33:09', NULL, 0),
(6, 'WO-20260306-0001', 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1. 單桶光篩\n2.二次良品以放寬外輪裂為主', '船桶不可有夾子', NULL, 25, 1, '2026-03-06 06:17:08', '2026-03-06 06:17:11', NULL, 0),
(7, 'WO-20260306-0002', 8, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-03-06 06:26:30', '2026-03-06 06:26:45', NULL, 0),
(8, 'WO-20260309-0001', 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 1, '2026-03-09 09:24:52', '2026-03-09 09:57:17', NULL, 0),
(9, 'WO-20260310-0001', 12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 25, 1, '2026-03-10 03:00:40', '2026-03-10 03:05:09', NULL, 0),
(10, 'WO-20260317-0001', 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '300', NULL, NULL, NULL, NULL, 28, 1, '2026-03-17 10:22:48', '2026-03-17 10:23:50', NULL, 0),
(11, 'WO-20260417-0001', 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-17 11:08:43', '2026-04-17 11:08:47', NULL, 0),
(12, 'WO-20260505-0001', 17, NULL, NULL, NULL, NULL, '2026-05-01 15:30:00', '2026-05-04 21:39:00', 13200.00, NULL, NULL, NULL, NULL, '250', NULL, NULL, NULL, NULL, 28, 1, '2026-05-05 07:23:03', '2026-05-05 08:15:35', NULL, 0),
(13, 'WO-20260505-0002', 18, NULL, NULL, NULL, NULL, '2026-05-01 15:30:00', '2026-05-04 21:39:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 28, 1, '2026-05-05 08:13:50', '2026-05-05 08:18:19', NULL, 0);

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
(1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-12 11:17:54', '2026-02-12 11:17:54'),
(2, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-02-28 08:02:52', '2026-02-28 08:02:52'),
(3, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-04 11:39:27', '2026-03-04 11:39:27'),
(4, 4, 13.6000, 7.0500, 26.6100, NULL, 16.6700, 8.8000, NULL, NULL, NULL, NULL, NULL, '2026-03-05 10:08:04', '2026-03-11 00:44:05'),
(5, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-05 10:12:40', '2026-03-05 10:12:40'),
(6, 6, 256.0000, 7.8000, 16.1200, 4.0800, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:17:08', '2026-03-06 06:17:08'),
(7, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-06 06:26:30', '2026-03-06 06:26:30'),
(8, 8, 2.7500, 11.4000, 12.3500, 4.7000, NULL, NULL, NULL, NULL, '2026-03-03 19:44:00', 10, NULL, '2026-03-09 09:24:52', '2026-03-09 09:42:57'),
(9, 9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-10 03:00:40', '2026-03-10 03:00:40'),
(10, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-17 10:22:48', '2026-03-17 10:22:48'),
(11, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-17 11:08:43', '2026-04-17 11:08:43'),
(12, 12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-05 07:23:03', '2026-05-05 07:23:03'),
(13, 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-05 08:13:50', '2026-05-05 08:13:50');

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

--
-- 傾印資料表的資料 `work_order_images`
--

INSERT INTO `work_order_images` (`id`, `work_order_id`, `image_type`, `file_name`, `file_path`, `file_size`, `mime_type`, `sort_order`, `description`, `uploaded_at`, `deleted_at`, `uploaded_by_employee_id`) VALUES
(1, 1, 'general', 'Pb7CWNY.jpg', 'uploads/work_orders/1/wo_img_698dc115dd50d.jpg', 184793, 'image/jpeg', 0, '', '2026-02-12 12:01:25', NULL, NULL),
(2, 8, 'general', '安拓-安克螺栓NG.jpg', 'uploads/work_orders/8/wo_img_69ae920dce73d.jpg', 1866357, 'image/jpeg', 0, '', '2026-03-09 09:25:33', NULL, NULL),
(3, 4, 'general', 'MX-3640FN_20260311_072519_001.jpg', 'uploads/work_orders/4/wo_img_69b0ba29aa153.jpg', 500729, 'image/jpeg', 0, '', '2026-03-11 00:41:13', NULL, NULL);

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
(10, 1, 12, '側視裂', 1, '2026-02-12 04:09:09', 1, NULL),
(11, 1, 9, '混料雜質', 1, '2026-02-12 04:09:09', 1, NULL),
(12, 1, 2, '總長度', 1, '2026-02-12 04:09:09', 1, NULL),
(25, 3, 14, '頭寬', 2, '2026-03-04 22:39:47', 10, NULL),
(26, 3, 7, '牙外徑', 4, '2026-03-04 22:39:47', 10, NULL),
(27, 3, 16, '真圓度', 32, '2026-03-04 22:39:47', 10, NULL),
(47, 8, 14, '頭寬', 41, '2026-03-09 02:00:23', 10, NULL),
(48, 8, 15, '頭下長度', 4, '2026-03-09 02:00:23', 10, NULL),
(49, 8, 7, '牙外徑', 10, '2026-03-09 02:00:23', 10, NULL),
(50, 8, 42, '有無針孔', 44, '2026-03-09 02:00:23', 10, NULL),
(51, 8, 32, '跳牙-節距、斜牙、牙品質', 6, '2026-03-09 02:00:23', 10, NULL),
(78, 4, 23, '桿徑', 1, '2026-03-10 16:44:05', 10, NULL),
(79, 4, 24, '桿長', 1, '2026-03-10 16:44:05', 10, NULL),
(80, 4, 22, '華司徑', 3, '2026-03-10 16:44:05', 10, NULL),
(81, 4, 21, '華司厚', 41, '2026-03-10 16:44:05', 10, NULL),
(82, 4, 23, '桿徑', 1, '2026-03-10 16:44:05', 10, NULL),
(83, 4, 24, '桿長', 1, '2026-03-10 16:44:05', 10, NULL),
(84, 4, 58, '輪裂', 27, '2026-03-10 16:44:05', 10, NULL),
(85, 10, 8, '有無牙', 54, '2026-03-17 02:23:48', 10, NULL),
(86, 10, 58, '輪裂', 153, '2026-03-17 02:23:48', 10, NULL),
(87, 10, 55, '孔內異物、毛邊', 63, '2026-03-17 02:23:48', 10, NULL),
(92, 13, 1, '頭高', 19, '2026-05-05 00:17:53', 10, NULL),
(93, 13, 11, '上視裂', 530, '2026-05-05 00:17:53', 10, NULL);

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=453;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `employees`
--
ALTER TABLE `employees`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=129;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `machines`
--
ALTER TABLE `machines`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `message_attachments`
--
ALTER TABLE `message_attachments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '??辣ID', AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `message_recipients`
--
ALTER TABLE `message_recipients`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `notification_reads`
--
ALTER TABLE `notification_reads`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '訂單品項ID', AUTO_INCREMENT=20;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_attachments`
--
ALTER TABLE `order_item_attachments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '檔案附件ID', AUTO_INCREMENT=2;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_drawings`
--
ALTER TABLE `order_item_drawings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '圖面附件ID', AUTO_INCREMENT=14;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_screening_details`
--
ALTER TABLE `order_item_screening_details`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '明細ID', AUTO_INCREMENT=842;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `order_item_tools`
--
ALTER TABLE `order_item_tools`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `production_records`
--
ALTER TABLE `production_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=347;

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
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '產品ID', AUTO_INCREMENT=21;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `screening_services`
--
ALTER TABLE `screening_services`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '服務ID', AUTO_INCREMENT=59;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `system_notifications`
--
ALTER TABLE `system_notifications`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `tools`
--
ALTER TABLE `tools`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `user_messages`
--
ALTER TABLE `user_messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_orders`
--
ALTER TABLE `work_orders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_first_piece_dimensions`
--
ALTER TABLE `work_order_first_piece_dimensions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_images`
--
ALTER TABLE `work_order_images`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `work_order_screening_defects`
--
ALTER TABLE `work_order_screening_defects`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
