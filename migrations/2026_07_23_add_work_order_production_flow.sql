-- 生產工單製程閉環：階段、機台結果、卡號載具、轉流、圖片要求、
-- 良品／不良品庫存包裝與出貨包裝追溯。
--
-- 相容原則：
-- 1. 既有工單補建一般「生產與篩分」階段。
-- 2. 既有一般工單沒有機台明細時，從工單主表補建一筆機台執行。
-- 3. 不重算既有完成工單的良品／不良品及庫存。
-- 4. 多機台但無法判斷歸屬的歷史首件資料不強制回填 machine_run_id。

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `customers` ADD COLUMN `production_image_requirement` VARCHAR(20) NOT NULL DEFAULT ''optional'' COMMENT ''工單機台圖片預設要求(optional/required)'' AFTER `weight_tolerance_percentage`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'production_image_requirement'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `customers` ADD COLUMN `production_image_min_count` INT NOT NULL DEFAULT 0 COMMENT ''工單機台圖片預設最低張數'' AFTER `production_image_requirement`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'production_image_min_count'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `order_items` ADD COLUMN `production_image_requirement` VARCHAR(20) NULL COMMENT ''本批機台圖片要求覆寫(optional/required)'' AFTER `expected_delivery_period`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'production_image_requirement'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `order_items` ADD COLUMN `production_image_min_count` INT NULL COMMENT ''本批機台圖片最低張數覆寫'' AFTER `production_image_requirement`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'production_image_min_count'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `work_order_stages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL COMMENT '工單ID',
    `stage_sequence` SMALLINT NOT NULL DEFAULT 1 COMMENT '內部階段順序；一般流程固定1',
    `stage_instance_no` SMALLINT NOT NULL DEFAULT 1 COMMENT '同順序下的執行實例編號',
    `stage_type` VARCHAR(30) NOT NULL DEFAULT 'primary' COMMENT 'primary/secondary',
    `secondary_mode` VARCHAR(30) NULL COMMENT 'second_process/relaxed_standard',
    `source_quality` VARCHAR(20) NULL COMMENT '二次篩分來源品質good/defect',
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending' COMMENT 'pending/in_progress/completed/cancelled',
    `spec_mode` VARCHAR(30) NOT NULL DEFAULT 'original' COMMENT 'original/second_process/relaxed',
    `source_stage_id` BIGINT NULL COMMENT '來源階段ID',
    `image_requirement` VARCHAR(20) NOT NULL DEFAULT 'optional' COMMENT '圖片要求快照optional/required',
    `image_min_count` INT NOT NULL DEFAULT 0 COMMENT '每台機台最低圖片張數快照',
    `started_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `completed_by_employee_id` BIGINT NULL,
    `cancelled_at` DATETIME NULL,
    `cancelled_by_employee_id` BIGINT NULL,
    `notes` TEXT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_work_order_stage_instance` (`work_order_id`, `stage_sequence`, `stage_instance_no`),
    KEY `idx_work_order_stages_status` (`status`),
    KEY `idx_work_order_stages_source` (`source_stage_id`),
    KEY `idx_work_order_stages_secondary_mode` (`secondary_mode`),
    KEY `fk_wos_completed_by` (`completed_by_employee_id`),
    KEY `fk_wos_cancelled_by` (`cancelled_by_employee_id`),
    KEY `fk_wos_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_wos_work_order`
        FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_wos_source_stage`
        FOREIGN KEY (`source_stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_wos_completed_by`
        FOREIGN KEY (`completed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_wos_cancelled_by`
        FOREIGN KEY (`cancelled_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_wos_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單一般與二次篩分階段';

CREATE TABLE IF NOT EXISTS `work_order_stage_services` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `stage_id` BIGINT NOT NULL,
    `screening_service_id` BIGINT NULL,
    `source_service_detail_id` BIGINT NULL COMMENT '來源訂單細項篩分服務明細ID',
    `source_stage_service_id` BIGINT NULL COMMENT '放寬前來源階段服務快照ID',
    `service_name` VARCHAR(255) NOT NULL,
    `service_name_en` VARCHAR(255) NULL,
    `tolerance_plus_value` DECIMAL(10,4) NULL,
    `tolerance_plus_over` DECIMAL(10,4) NULL,
    `tolerance_minus_value` DECIMAL(10,4) NULL,
    `tolerance_minus_over` DECIMAL(10,4) NULL,
    `ppm_standard` INT NULL,
    `relaxation_reason` TEXT NULL,
    `customer_approval_reference` TEXT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_work_order_stage_service` (`stage_id`, `screening_service_id`),
    KEY `idx_woss_source_detail` (`source_service_detail_id`),
    KEY `idx_woss_source_stage_service` (`source_stage_service_id`),
    KEY `fk_woss_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_woss_stage`
        FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_woss_service`
        FOREIGN KEY (`screening_service_id`) REFERENCES `screening_services` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_woss_source_detail`
        FOREIGN KEY (`source_service_detail_id`) REFERENCES `order_item_screening_details` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_woss_source_stage_service`
        FOREIGN KEY (`source_stage_service_id`) REFERENCES `work_order_stage_services` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_woss_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單階段篩分服務與規格快照';

CREATE TABLE IF NOT EXISTS `work_order_image_requirements` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `stage_id` BIGINT NOT NULL,
    `image_type` VARCHAR(30) NOT NULL DEFAULT 'machine_screen',
    `requirement_level` VARCHAR(20) NOT NULL DEFAULT 'optional',
    `minimum_count` INT NOT NULL DEFAULT 0,
    `source_type` VARCHAR(30) NOT NULL DEFAULT 'default' COMMENT 'default/customer/order_item/stage_override',
    `source_id` BIGINT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_work_order_image_requirement` (`stage_id`, `image_type`),
    KEY `idx_woir_work_order` (`work_order_id`),
    KEY `fk_woir_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_woir_work_order`
        FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_woir_stage`
        FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_woir_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單階段圖片要求快照';

-- 先補建每張工單的一般流程階段，避免後續關聯出現空值。
INSERT INTO `work_order_stages` (
    `work_order_id`,
    `stage_sequence`,
    `stage_instance_no`,
    `stage_type`,
    `secondary_mode`,
    `source_quality`,
    `status`,
    `spec_mode`,
    `image_requirement`,
    `image_min_count`,
    `started_at`,
    `completed_at`,
    `created_at`,
    `updated_at`
)
SELECT
    wo.`id`,
    1,
    1,
    'primary',
    NULL,
    NULL,
    CASE
        WHEN wo.`completed_at` IS NOT NULL THEN 'completed'
        WHEN wo.`actual_start_date` IS NOT NULL THEN 'in_progress'
        ELSE 'pending'
    END,
    'original',
    COALESCE(NULLIF(oi.`production_image_requirement`, ''), NULLIF(c.`production_image_requirement`, ''), 'optional'),
    CASE
        WHEN COALESCE(NULLIF(oi.`production_image_requirement`, ''), NULLIF(c.`production_image_requirement`, ''), 'optional') = 'required'
            THEN GREATEST(COALESCE(oi.`production_image_min_count`, c.`production_image_min_count`, 1), 1)
        ELSE GREATEST(COALESCE(oi.`production_image_min_count`, c.`production_image_min_count`, 0), 0)
    END,
    wo.`actual_start_date`,
    wo.`completed_at`,
    COALESCE(wo.`created_at`, CURRENT_TIMESTAMP),
    COALESCE(wo.`updated_at`, CURRENT_TIMESTAMP)
FROM `work_orders` wo
JOIN `order_items` oi ON oi.`id` = wo.`order_item_id`
JOIN `orders` o ON o.`id` = oi.`order_id`
JOIN `customers` c ON c.`id` = o.`customer_id`
WHERE NOT EXISTS (
    SELECT 1
    FROM `work_order_stages` existing_stage
    WHERE existing_stage.`work_order_id` = wo.`id`
      AND existing_stage.`stage_sequence` = 1
      AND existing_stage.`stage_instance_no` = 1
);

INSERT INTO `work_order_image_requirements` (
    `work_order_id`,
    `stage_id`,
    `image_type`,
    `requirement_level`,
    `minimum_count`,
    `source_type`,
    `source_id`
)
SELECT
    stage.`work_order_id`,
    stage.`id`,
    'machine_screen',
    stage.`image_requirement`,
    stage.`image_min_count`,
    CASE
        WHEN oi.`production_image_requirement` IS NOT NULL AND oi.`production_image_requirement` <> '' THEN 'order_item'
        WHEN c.`production_image_requirement` IS NOT NULL AND c.`production_image_requirement` <> '' THEN 'customer'
        ELSE 'default'
    END,
    CASE
        WHEN oi.`production_image_requirement` IS NOT NULL AND oi.`production_image_requirement` <> '' THEN oi.`id`
        WHEN c.`production_image_requirement` IS NOT NULL AND c.`production_image_requirement` <> '' THEN c.`id`
        ELSE NULL
    END
FROM `work_order_stages` stage
JOIN `work_orders` wo ON wo.`id` = stage.`work_order_id`
JOIN `order_items` oi ON oi.`id` = wo.`order_item_id`
JOIN `orders` o ON o.`id` = oi.`order_id`
JOIN `customers` c ON c.`id` = o.`customer_id`
WHERE stage.`stage_sequence` = 1
  AND stage.`stage_instance_no` = 1
  AND NOT EXISTS (
      SELECT 1
      FROM `work_order_image_requirements` existing_requirement
      WHERE existing_requirement.`stage_id` = stage.`id`
        AND existing_requirement.`image_type` = 'machine_screen'
  );

INSERT INTO `work_order_stage_services` (
    `stage_id`,
    `screening_service_id`,
    `source_service_detail_id`,
    `service_name`,
    `service_name_en`,
    `tolerance_plus_value`,
    `tolerance_plus_over`,
    `tolerance_minus_value`,
    `tolerance_minus_over`,
    `ppm_standard`,
    `sort_order`,
    `created_at`,
    `updated_at`
)
SELECT
    stage.`id`,
    detail.`screening_service_id`,
    detail.`id`,
    COALESCE(NULLIF(detail.`service_name`, ''), service.`name`, '未命名篩分服務'),
    detail.`service_name_en`,
    detail.`tolerance_plus_value`,
    detail.`tolerance_plus_over`,
    detail.`tolerance_minus_value`,
    detail.`tolerance_minus_over`,
    detail.`ppm_standard`,
    detail.`id`,
    COALESCE(detail.`created_at`, CURRENT_TIMESTAMP),
    COALESCE(detail.`updated_at`, CURRENT_TIMESTAMP)
FROM `work_order_stages` stage
JOIN `work_orders` wo ON wo.`id` = stage.`work_order_id`
JOIN `order_item_screening_details` detail ON detail.`order_item_id` = wo.`order_item_id`
LEFT JOIN `screening_services` service ON service.`id` = detail.`screening_service_id`
WHERE stage.`stage_sequence` = 1
  AND stage.`stage_instance_no` = 1
  AND detail.`id` = (
      SELECT MIN(deduplicated_detail.`id`)
      FROM `order_item_screening_details` deduplicated_detail
      WHERE deduplicated_detail.`order_item_id` = detail.`order_item_id`
        AND deduplicated_detail.`screening_service_id` = detail.`screening_service_id`
  )
  AND NOT EXISTS (
      SELECT 1
      FROM `work_order_stage_services` existing_service
      WHERE existing_service.`stage_id` = stage.`id`
        AND existing_service.`screening_service_id` = detail.`screening_service_id`
  );

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_runs` ADD COLUMN `stage_id` BIGINT NULL COMMENT ''工單篩分階段ID'' AFTER `work_order_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_runs' AND COLUMN_NAME = 'stage_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_runs` ADD KEY `idx_womr_stage` (`stage_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_runs' AND INDEX_NAME = 'idx_womr_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_runs` ADD CONSTRAINT `fk_womr_stage` FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_runs' AND CONSTRAINT_NAME = 'fk_womr_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `work_order_machine_runs` run
JOIN `work_order_stages` stage
  ON stage.`work_order_id` = run.`work_order_id`
 AND stage.`stage_sequence` = 1
 AND stage.`stage_instance_no` = 1
SET run.`stage_id` = stage.`id`
WHERE run.`stage_id` IS NULL;

-- 既有一般工單若只有主表機台資料，補建一筆可追溯的機台執行。
INSERT INTO `work_order_machine_runs` (
    `work_order_id`,
    `stage_id`,
    `run_label`,
    `machine_id`,
    `machine_sequence`,
    `assigned_employee_id`,
    `calibration_employee_id`,
    `scheduled_start_date`,
    `scheduled_end_date`,
    `actual_start_date`,
    `actual_end_date`,
    `quantity_to_produce`,
    `screening_speed`,
    `planned_net_weight_kg`,
    `completed_net_weight_kg`,
    `weight_per_unit_g`,
    `planned_units`,
    `completed_units`,
    `status`,
    `notes`,
    `created_at`,
    `updated_at`
)
SELECT
    wo.`id`,
    stage.`id`,
    COALESCE(NULLIF(CONCAT('機台', wo.`machine_sequence`), '機台'), '機台1'),
    wo.`machine_id`,
    COALESCE(wo.`machine_sequence`, 1),
    wo.`assigned_employee_id`,
    wo.`calibration_employee_id`,
    wo.`scheduled_start_date`,
    wo.`scheduled_end_date`,
    wo.`actual_start_date`,
    wo.`actual_end_date`,
    wo.`quantity_to_produce`,
    wo.`screening_speed`,
    GREATEST(COALESCE(wo.`total_weight_kg`, 0), 0),
    CASE WHEN wo.`completed_at` IS NOT NULL THEN GREATEST(COALESCE(wo.`total_weight_kg`, 0), 0) ELSE 0 END,
    GREATEST(COALESCE(wo.`weight_per_unit_g`, 0), 0),
    GREATEST(COALESCE(wo.`total_units`, wo.`quantity_to_produce`, 0), 0),
    CASE WHEN wo.`completed_at` IS NOT NULL THEN GREATEST(COALESCE(wo.`total_units`, wo.`quantity_to_produce`, 0), 0) ELSE 0 END,
    CASE
        WHEN wo.`completed_at` IS NOT NULL THEN 'completed'
        WHEN wo.`actual_start_date` IS NOT NULL THEN 'in_progress'
        WHEN wo.`scheduled_start_date` IS NOT NULL THEN 'scheduled'
        ELSE 'pending'
    END,
    '由既有工單主表回填',
    COALESCE(wo.`created_at`, CURRENT_TIMESTAMP),
    COALESCE(wo.`updated_at`, CURRENT_TIMESTAMP)
FROM `work_orders` wo
JOIN `work_order_stages` stage
  ON stage.`work_order_id` = wo.`id`
 AND stage.`stage_sequence` = 1
 AND stage.`stage_instance_no` = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM `work_order_machine_runs` existing_run
    WHERE existing_run.`work_order_id` = wo.`id`
);

CREATE TABLE IF NOT EXISTS `work_order_machine_results` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `stage_id` BIGINT NOT NULL,
    `machine_run_id` BIGINT NOT NULL,
    `result_revision` INT NOT NULL DEFAULT 1,
    `input_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `input_net_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `machine_processed_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `machine_good_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `machine_defect_units` DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '機台畫面原始不良支數',
    `defect_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0 COMMENT '不良品實秤淨重',
    `weight_per_unit_g` DECIMAL(10,4) NOT NULL DEFAULT 0 COMMENT '完成當下單支重快照',
    `settled_defect_units` DECIMAL(14,0) NOT NULL DEFAULT 0 COMMENT '秤重換算不良支數',
    `defect_difference_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `rounding_rule` VARCHAR(30) NOT NULL DEFAULT 'round_half_up',
    `result_status` VARCHAR(30) NOT NULL DEFAULT 'draft' COMMENT 'draft/confirmed/reversed/superseded',
    `completed_at` DATETIME NULL,
    `completed_by_employee_id` BIGINT NULL,
    `confirmed_at` DATETIME NULL,
    `confirmed_by_employee_id` BIGINT NULL,
    `reversed_at` DATETIME NULL,
    `reversed_by_employee_id` BIGINT NULL,
    `reverse_reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_womr_result_revision` (`machine_run_id`, `result_revision`),
    KEY `idx_womres_work_order` (`work_order_id`),
    KEY `idx_womres_stage` (`stage_id`),
    KEY `idx_womres_status` (`result_status`),
    KEY `fk_womres_completed_by` (`completed_by_employee_id`),
    KEY `fk_womres_confirmed_by` (`confirmed_by_employee_id`),
    KEY `fk_womres_reversed_by` (`reversed_by_employee_id`),
    CONSTRAINT `fk_womres_work_order`
        FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womres_stage`
        FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womres_machine_run`
        FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womres_completed_by`
        FOREIGN KEY (`completed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womres_confirmed_by`
        FOREIGN KEY (`confirmed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womres_reversed_by`
        FOREIGN KEY (`reversed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單機台完成結果與100/99雙數量';

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_defects` ADD COLUMN `machine_result_id` BIGINT NULL COMMENT ''對應機台完成結果ID'' AFTER `machine_run_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_defects' AND COLUMN_NAME = 'machine_result_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_defects` ADD KEY `idx_womd_machine_result` (`machine_result_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_defects' AND INDEX_NAME = 'idx_womd_machine_result'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_machine_defects` ADD CONSTRAINT `fk_womd_machine_result` FOREIGN KEY (`machine_result_id`) REFERENCES `work_order_machine_results` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_machine_defects' AND CONSTRAINT_NAME = 'fk_womd_machine_result'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD COLUMN `stage_id` BIGINT NULL COMMENT ''工單篩分階段ID'' AFTER `work_order_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND COLUMN_NAME = 'stage_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD COLUMN `machine_run_id` BIGINT NULL COMMENT ''機台執行ID'' AFTER `stage_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND COLUMN_NAME = 'machine_run_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD COLUMN `inspection_round` INT NOT NULL DEFAULT 1 COMMENT ''檢驗輪次'' AFTER `machine_run_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND COLUMN_NAME = 'inspection_round'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD COLUMN `inspection_result` VARCHAR(20) NOT NULL DEFAULT ''pending'' COMMENT ''pending/passed/failed'' AFTER `inspection_round`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND COLUMN_NAME = 'inspection_result'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD KEY `idx_wofpd_stage` (`stage_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND INDEX_NAME = 'idx_wofpd_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD KEY `idx_wofpd_machine_round` (`machine_run_id`, `inspection_round`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND INDEX_NAME = 'idx_wofpd_machine_round'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD CONSTRAINT `fk_wofpd_stage` FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND CONSTRAINT_NAME = 'fk_wofpd_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `work_order_first_piece_dimensions` ADD CONSTRAINT `fk_wofpd_machine_run` FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'work_order_first_piece_dimensions' AND CONSTRAINT_NAME = 'fk_wofpd_machine_run'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 只有能明確判定唯一機台的舊首件資料才回填歸屬。
UPDATE `work_order_first_piece_dimensions` dimension_row
JOIN (
    SELECT `work_order_id`, MIN(`id`) AS `machine_run_id`, COUNT(*) AS `run_count`
    FROM `work_order_machine_runs`
    WHERE `deleted_at` IS NULL
    GROUP BY `work_order_id`
) run_summary
  ON run_summary.`work_order_id` = dimension_row.`work_order_id`
 AND run_summary.`run_count` = 1
JOIN `work_order_machine_runs` run ON run.`id` = run_summary.`machine_run_id`
SET
    dimension_row.`stage_id` = run.`stage_id`,
    dimension_row.`machine_run_id` = run.`id`,
    dimension_row.`inspection_result` = CASE
        WHEN dimension_row.`measured_at` IS NOT NULL THEN 'passed'
        ELSE dimension_row.`inspection_result`
    END
WHERE dimension_row.`machine_run_id` IS NULL;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `stage_id` BIGINT NULL COMMENT ''工單篩分階段ID'' AFTER `machine_run_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'stage_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `card_sequence` INT NULL COMMENT ''機台內卡號列順序'' AFTER `production_source_mode`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'card_sequence'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `card_reference_units` DECIMAL(14,2) NULL COMMENT ''機台累計支數裝載參考點'' AFTER `card_number`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'card_reference_units'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `planned_units` DECIMAL(14,2) NULL COMMENT ''此卡預計裝載支數'' AFTER `card_reference_units`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'planned_units'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `actual_gross_weight_kg` DECIMAL(12,3) NULL COMMENT ''現場磅秤實際毛重'' AFTER `weight_kg`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'actual_gross_weight_kg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `actual_net_weight_kg` DECIMAL(12,3) NULL COMMENT ''扣除載具皮重後內容物淨重'' AFTER `actual_gross_weight_kg`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'actual_net_weight_kg'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `weighed_at` DATETIME NULL COMMENT ''實際秤重時間'' AFTER `actual_net_weight_kg`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'weighed_at'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `weighed_by_employee_id` BIGINT NULL COMMENT ''實際秤重人員'' AFTER `weighed_at`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'weighed_by_employee_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `card_locked_at` DATETIME NULL COMMENT ''卡號參考值鎖定時間'' AFTER `weighed_by_employee_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'card_locked_at'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD COLUMN `card_locked_by_employee_id` BIGINT NULL COMMENT ''卡號鎖定人員'' AFTER `card_locked_at`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND COLUMN_NAME = 'card_locked_by_employee_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD KEY `idx_production_records_stage` (`stage_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND INDEX_NAME = 'idx_production_records_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD KEY `idx_production_records_card_sequence` (`machine_run_id`, `card_sequence`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND INDEX_NAME = 'idx_production_records_card_sequence'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD KEY `idx_production_records_weighed_by` (`weighed_by_employee_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND INDEX_NAME = 'idx_production_records_weighed_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD KEY `idx_production_records_locked_by` (`card_locked_by_employee_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND INDEX_NAME = 'idx_production_records_locked_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD CONSTRAINT `fk_production_records_stage` FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND CONSTRAINT_NAME = 'fk_production_records_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD CONSTRAINT `fk_production_records_weighed_by` FOREIGN KEY (`weighed_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND CONSTRAINT_NAME = 'fk_production_records_weighed_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `production_records` ADD CONSTRAINT `fk_production_records_locked_by` FOREIGN KEY (`card_locked_by_employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'production_records' AND CONSTRAINT_NAME = 'fk_production_records_locked_by'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `production_records` record_row
JOIN `work_order_machine_runs` run ON run.`id` = record_row.`machine_run_id`
SET record_row.`stage_id` = run.`stage_id`
WHERE record_row.`stage_id` IS NULL;

UPDATE `production_records`
SET
    `card_reference_units` = CASE
        WHEN `card_reference_units` IS NULL AND `card_number` REGEXP '^[0-9]+([.][0-9]+)?$'
            THEN CAST(`card_number` AS DECIMAL(14,2))
        ELSE `card_reference_units`
    END,
    `actual_gross_weight_kg` = COALESCE(`actual_gross_weight_kg`, `weight_kg`),
    `actual_net_weight_kg` = COALESCE(
        `actual_net_weight_kg`,
        CASE
            WHEN `weight_kg` IS NULL THEN NULL
            ELSE GREATEST(`weight_kg` - COALESCE(`tool_weight_kg`, 0), 0)
        END
    ),
    `weighed_at` = COALESCE(
        `weighed_at`,
        CASE WHEN `weight_kg` IS NOT NULL THEN TIMESTAMP(`production_date`, COALESCE(`production_time`, '00:00:00')) ELSE NULL END
    ),
    `card_locked_at` = COALESCE(
        `card_locked_at`,
        CASE WHEN `weight_kg` IS NOT NULL THEN COALESCE(`updated_at`, `created_at`, CURRENT_TIMESTAMP) ELSE NULL END
    )
WHERE `weight_kg` IS NOT NULL
   OR (`card_reference_units` IS NULL AND `card_number` REGEXP '^[0-9]+([.][0-9]+)?$');

CREATE TABLE IF NOT EXISTS `work_order_machine_input_tools` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `work_order_id` BIGINT NOT NULL,
    `stage_id` BIGINT NOT NULL,
    `machine_run_id` BIGINT NOT NULL,
    `production_record_id` BIGINT NULL,
    `order_item_tool_id` BIGINT NULL,
    `tool_id` BIGINT NULL,
    `tool_number` VARCHAR(100) NULL,
    `tool_name` VARCHAR(255) NOT NULL,
    `tool_type` VARCHAR(100) NULL,
    `unit_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `quantity` INT NOT NULL DEFAULT 1,
    `total_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `allocated_net_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `allocation_status` VARCHAR(30) NOT NULL DEFAULT 'allocated',
    `disposition` VARCHAR(30) NULL COMMENT 'reused_for_good/return_empty/stored_on_site/damaged/other',
    `disposition_notes` TEXT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_womit_production_record` (`production_record_id`),
    KEY `idx_womit_work_order_stage` (`work_order_id`, `stage_id`),
    KEY `idx_womit_machine_run` (`machine_run_id`),
    KEY `idx_womit_order_item_tool` (`order_item_tool_id`),
    KEY `idx_womit_tool` (`tool_id`),
    KEY `fk_womit_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_womit_work_order`
        FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_stage`
        FOREIGN KEY (`stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_machine_run`
        FOREIGN KEY (`machine_run_id`) REFERENCES `work_order_machine_runs` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_production_record`
        FOREIGN KEY (`production_record_id`) REFERENCES `production_records` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_order_item_tool`
        FOREIGN KEY (`order_item_tool_id`) REFERENCES `order_item_tools` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_tool`
        FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womit_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='機台進料載具分配與卡號關聯';

INSERT INTO `work_order_machine_input_tools` (
    `work_order_id`,
    `stage_id`,
    `machine_run_id`,
    `production_record_id`,
    `tool_name`,
    `unit_weight_kg`,
    `quantity`,
    `total_weight_kg`,
    `allocated_net_weight_kg`,
    `allocation_status`,
    `created_by_employee_id`,
    `created_at`,
    `updated_at`
)
SELECT
    record_row.`work_order_id`,
    record_row.`stage_id`,
    record_row.`machine_run_id`,
    record_row.`id`,
    COALESCE(NULLIF(record_row.`tool_name`, ''), '歷史載具'),
    GREATEST(COALESCE(record_row.`tool_weight_kg`, 0), 0),
    1,
    GREATEST(COALESCE(record_row.`tool_weight_kg`, 0), 0),
    GREATEST(COALESCE(record_row.`actual_net_weight_kg`, 0), 0),
    CASE WHEN record_row.`actual_gross_weight_kg` IS NULL THEN 'allocated' ELSE 'loaded' END,
    record_row.`employee_id`,
    COALESCE(record_row.`created_at`, CURRENT_TIMESTAMP),
    COALESCE(record_row.`updated_at`, CURRENT_TIMESTAMP)
FROM `production_records` record_row
WHERE record_row.`machine_run_id` IS NOT NULL
  AND record_row.`stage_id` IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM `work_order_machine_input_tools` existing_tool
      WHERE existing_tool.`production_record_id` = record_row.`id`
  );

CREATE TABLE IF NOT EXISTS `work_order_machine_result_images` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `machine_result_id` BIGINT NOT NULL,
    `image_type` VARCHAR(30) NOT NULL DEFAULT 'machine_screen',
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NULL,
    `mime_type` VARCHAR(100) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `uploaded_by_employee_id` BIGINT NULL,
    `uploaded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_womri_result_type` (`machine_result_id`, `image_type`),
    KEY `idx_womri_deleted_at` (`deleted_at`),
    KEY `fk_womri_uploaded_by` (`uploaded_by_employee_id`),
    CONSTRAINT `fk_womri_result`
        FOREIGN KEY (`machine_result_id`) REFERENCES `work_order_machine_results` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womri_uploaded_by`
        FOREIGN KEY (`uploaded_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='機台完成結果圖片';

CREATE TABLE IF NOT EXISTS `work_order_machine_result_packages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `machine_result_id` BIGINT NOT NULL,
    `package_number` VARCHAR(100) NOT NULL,
    `package_type` VARCHAR(50) NOT NULL DEFAULT 'plastic_bag',
    `package_unit` VARCHAR(20) NOT NULL DEFAULT 'bag',
    `package_quantity` INT NOT NULL DEFAULT 1,
    `contained_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `content_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `package_status` VARCHAR(30) NOT NULL DEFAULT 'available',
    `notes` TEXT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_womrp_result_number` (`machine_result_id`, `package_number`),
    KEY `idx_womrp_status` (`package_status`),
    KEY `fk_womrp_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_womrp_result`
        FOREIGN KEY (`machine_result_id`) REFERENCES `work_order_machine_results` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womrp_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='機台結果不良品包裝；塑膠袋不計袋重';

CREATE TABLE IF NOT EXISTS `work_order_stage_transfers` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `source_stage_id` BIGINT NOT NULL,
    `source_machine_result_id` BIGINT NOT NULL,
    `source_quality` VARCHAR(20) NOT NULL COMMENT 'good/defect',
    `route` VARCHAR(30) NOT NULL COMMENT 'terminal_good/terminal_defect/secondary_screening',
    `secondary_mode` VARCHAR(30) NULL COMMENT 'second_process/relaxed_standard',
    `source_defect_history_record_id` BIGINT NULL,
    `transferred_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `transferred_net_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `target_stage_id` BIGINT NULL,
    `inventory_item_id` BIGINT NULL,
    `transfer_status` VARCHAR(30) NOT NULL DEFAULT 'pending' COMMENT 'pending/completed/reversed',
    `idempotency_key` VARCHAR(100) NOT NULL,
    `completed_at` DATETIME NULL,
    `completed_by_employee_id` BIGINT NULL,
    `reversed_at` DATETIME NULL,
    `reversed_by_employee_id` BIGINT NULL,
    `reverse_reason` TEXT NULL,
    `notes` TEXT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_wost_idempotency` (`idempotency_key`),
    KEY `idx_wost_source_stage` (`source_stage_id`),
    KEY `idx_wost_source_result_quality` (`source_machine_result_id`, `source_quality`),
    KEY `idx_wost_target_stage` (`target_stage_id`),
    KEY `idx_wost_inventory` (`inventory_item_id`),
    KEY `idx_wost_status` (`transfer_status`),
    KEY `fk_wost_completed_by` (`completed_by_employee_id`),
    KEY `fk_wost_reversed_by` (`reversed_by_employee_id`),
    KEY `fk_wost_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_wost_source_stage`
        FOREIGN KEY (`source_stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_source_result`
        FOREIGN KEY (`source_machine_result_id`) REFERENCES `work_order_machine_results` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_target_stage`
        FOREIGN KEY (`target_stage_id`) REFERENCES `work_order_stages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_inventory`
        FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_completed_by`
        FOREIGN KEY (`completed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_reversed_by`
        FOREIGN KEY (`reversed_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_wost_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='階段良品／不良品終點入庫與二次篩分轉流';

CREATE TABLE IF NOT EXISTS `work_order_machine_output_tools` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `machine_result_id` BIGINT NOT NULL,
    `inventory_item_id` BIGINT NULL,
    `source_input_tool_id` BIGINT NULL,
    `use_mode` VARCHAR(30) NOT NULL COMMENT 'reused/replacement',
    `tool_id` BIGINT NULL,
    `tool_number` VARCHAR(100) NULL,
    `tool_name` VARCHAR(255) NOT NULL,
    `tool_type` VARCHAR(100) NULL,
    `unit_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `quantity` INT NOT NULL DEFAULT 0,
    `total_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `output_status` VARCHAR(30) NOT NULL DEFAULT 'planned',
    `notes` TEXT NULL,
    `created_by_employee_id` BIGINT NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_womot_result` (`machine_result_id`),
    KEY `idx_womot_inventory` (`inventory_item_id`),
    KEY `idx_womot_source_input` (`source_input_tool_id`),
    KEY `idx_womot_tool` (`tool_id`),
    KEY `fk_womot_created_by` (`created_by_employee_id`),
    CONSTRAINT `fk_womot_result`
        FOREIGN KEY (`machine_result_id`) REFERENCES `work_order_machine_results` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womot_inventory`
        FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womot_source_input`
        FOREIGN KEY (`source_input_tool_id`) REFERENCES `work_order_machine_input_tools` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_womot_tool`
        FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_womot_created_by`
        FOREIGN KEY (`created_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='良品實際出料載具';

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_items` ADD COLUMN `stock_category` VARCHAR(20) NOT NULL DEFAULT ''good'' COMMENT ''庫存類別good/defect'' AFTER `receipt_type`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' AND COLUMN_NAME = 'stock_category'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_items` ADD KEY `idx_inventory_stock_category` (`stock_category`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_items' AND INDEX_NAME = 'idx_inventory_stock_category'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `inventory_packages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `inventory_item_id` BIGINT NOT NULL,
    `source_machine_package_id` BIGINT NOT NULL,
    `package_number` VARCHAR(100) NOT NULL,
    `package_unit` VARCHAR(20) NOT NULL DEFAULT 'bag',
    `package_quantity` INT NOT NULL DEFAULT 1,
    `contained_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `content_weight_kg` DECIMAL(12,3) NOT NULL DEFAULT 0,
    `package_status` VARCHAR(30) NOT NULL DEFAULT 'available' COMMENT 'available/reserved/shipped/repacked/voided',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_inventory_package_source` (`source_machine_package_id`),
    UNIQUE KEY `uk_inventory_package_number` (`inventory_item_id`, `package_number`),
    KEY `idx_inventory_packages_status` (`package_status`),
    CONSTRAINT `fk_inventory_packages_inventory`
        FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_inventory_packages_source`
        FOREIGN KEY (`source_machine_package_id`) REFERENCES `work_order_machine_result_packages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='不良品庫存包／袋';

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `shipping_order_items` ADD COLUMN `stock_category_snapshot` VARCHAR(20) NULL COMMENT ''出貨時庫存類別快照good/defect'' AFTER `inventory_item_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shipping_order_items' AND COLUMN_NAME = 'stock_category_snapshot'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `shipping_order_item_packages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `shipping_order_item_id` BIGINT NOT NULL,
    `inventory_package_id` BIGINT NOT NULL,
    `shipped_units` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `shipped_package_quantity` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_shipping_item_package` (`shipping_order_item_id`, `inventory_package_id`),
    KEY `idx_soip_inventory_package` (`inventory_package_id`),
    CONSTRAINT `fk_soip_shipping_item`
        FOREIGN KEY (`shipping_order_item_id`) REFERENCES `shipping_order_items` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_soip_inventory_package`
        FOREIGN KEY (`inventory_package_id`) REFERENCES `inventory_packages` (`id`)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='出貨明細實際不良品包裝扣帳';

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD COLUMN `source_stage_id` BIGINT NULL COMMENT ''來源工單階段ID'' AFTER `source_work_order_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND COLUMN_NAME = 'source_stage_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD COLUMN `source_machine_result_id` BIGINT NULL COMMENT ''來源機台完成結果ID'' AFTER `source_stage_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND COLUMN_NAME = 'source_machine_result_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD COLUMN `source_stage_transfer_id` BIGINT NULL COMMENT ''來源階段轉流ID'' AFTER `source_machine_result_id`',
        'DO 0')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND COLUMN_NAME = 'source_stage_transfer_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD KEY `idx_iis_source_stage` (`source_stage_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND INDEX_NAME = 'idx_iis_source_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD KEY `idx_iis_source_machine_result` (`source_machine_result_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND INDEX_NAME = 'idx_iis_source_machine_result'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD KEY `idx_iis_source_stage_transfer` (`source_stage_transfer_id`)',
        'DO 0')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND INDEX_NAME = 'idx_iis_source_stage_transfer'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD CONSTRAINT `fk_iis_source_stage` FOREIGN KEY (`source_stage_id`) REFERENCES `work_order_stages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND CONSTRAINT_NAME = 'fk_iis_source_stage'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD CONSTRAINT `fk_iis_source_machine_result` FOREIGN KEY (`source_machine_result_id`) REFERENCES `work_order_machine_results` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND CONSTRAINT_NAME = 'fk_iis_source_machine_result'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl = (
    SELECT IF(COUNT(*) = 0,
        'ALTER TABLE `inventory_item_sources` ADD CONSTRAINT `fk_iis_source_stage_transfer` FOREIGN KEY (`source_stage_transfer_id`) REFERENCES `work_order_stage_transfers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE',
        'DO 0')
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inventory_item_sources' AND CONSTRAINT_NAME = 'fk_iis_source_stage_transfer'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
