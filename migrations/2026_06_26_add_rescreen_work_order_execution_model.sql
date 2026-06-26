START TRANSACTION;

SET @add_rescreen_execution_columns = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'scheduled_start_date'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batches`
        ADD COLUMN `scheduled_start_date` DATETIME DEFAULT NULL COMMENT '二次篩選預定開始日期' AFTER `created_by_employee_id`,
        ADD COLUMN `scheduled_end_date` DATETIME DEFAULT NULL COMMENT '二次篩選預定完成日期' AFTER `scheduled_start_date`,
        ADD COLUMN `actual_start_date` DATETIME DEFAULT NULL COMMENT '二次篩選實際開始日期' AFTER `scheduled_end_date`,
        ADD COLUMN `actual_end_date` DATETIME DEFAULT NULL COMMENT '二次篩選實際完成日期' AFTER `actual_start_date`,
        ADD COLUMN `assigned_employee_id` BIGINT DEFAULT NULL COMMENT '二次篩選指派員工' AFTER `actual_end_date`,
        ADD COLUMN `calibration_employee_id` BIGINT DEFAULT NULL COMMENT '二次篩選校機人員' AFTER `assigned_employee_id`,
        ADD COLUMN `machine_id` BIGINT DEFAULT NULL COMMENT '二次篩選機台' AFTER `calibration_employee_id`,
        ADD COLUMN `quantity_to_produce` DECIMAL(14,2) DEFAULT NULL COMMENT '二次篩選預計處理數量' AFTER `machine_id`,
        ADD COLUMN `screening_speed` VARCHAR(50) DEFAULT NULL COMMENT '二次篩選速度' AFTER `quantity_to_produce`,
        ADD COLUMN `first_piece_measured_at` DATETIME DEFAULT NULL COMMENT '二次篩選首件量測時間' AFTER `screening_speed`,
        ADD COLUMN `first_piece_measured_by_employee_id` BIGINT DEFAULT NULL COMMENT '二次篩選首件量測人員' AFTER `first_piece_measured_at`,
        ADD COLUMN `first_piece_head_height` DECIMAL(10,3) DEFAULT NULL COMMENT '頭高(mm)' AFTER `first_piece_measured_by_employee_id`,
        ADD COLUMN `first_piece_head_width` DECIMAL(10,3) DEFAULT NULL COMMENT '頭寬(mm)' AFTER `first_piece_head_height`,
        ADD COLUMN `first_piece_length` DECIMAL(10,3) DEFAULT NULL COMMENT '長度(mm)' AFTER `first_piece_head_width`,
        ADD COLUMN `first_piece_thread_outer_diameter` DECIMAL(10,3) DEFAULT NULL COMMENT '牙外徑(mm)' AFTER `first_piece_length`,
        ADD COLUMN `first_piece_washer_diameter` DECIMAL(10,3) DEFAULT NULL COMMENT '華司徑(mm)' AFTER `first_piece_thread_outer_diameter`,
        ADD COLUMN `first_piece_outer_diameter` DECIMAL(10,3) DEFAULT NULL COMMENT '外徑(mm)' AFTER `first_piece_washer_diameter`,
        ADD COLUMN `first_piece_hole_diameter` DECIMAL(10,3) DEFAULT NULL COMMENT '孔徑(mm)' AFTER `first_piece_outer_diameter`,
        ADD COLUMN `first_piece_thickness` DECIMAL(10,3) DEFAULT NULL COMMENT '厚度(mm)' AFTER `first_piece_hole_diameter`,
        ADD COLUMN `first_piece_notes` TEXT DEFAULT NULL COMMENT '二次篩選首件備註' AFTER `first_piece_thickness`"
);
PREPARE stmt FROM @add_rescreen_execution_columns;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_execution_indexes = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND INDEX_NAME = 'idx_rescreen_batches_schedule'
    ),
    'DO 0',
    "ALTER TABLE `rescreen_batches`
        ADD KEY `idx_rescreen_batches_schedule` (`scheduled_start_date`, `scheduled_end_date`),
        ADD KEY `idx_rescreen_batches_assigned_employee` (`assigned_employee_id`),
        ADD KEY `idx_rescreen_batches_calibration_employee` (`calibration_employee_id`),
        ADD KEY `idx_rescreen_batches_machine` (`machine_id`),
        ADD KEY `idx_rescreen_batches_first_piece_employee` (`first_piece_measured_by_employee_id`)"
);
PREPARE stmt FROM @add_rescreen_execution_indexes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_assigned_fk = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND CONSTRAINT_NAME = 'fk_rescreen_batches_assigned_employee'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches`
        ADD CONSTRAINT `fk_rescreen_batches_assigned_employee`
        FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @add_rescreen_assigned_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_calibration_fk = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND CONSTRAINT_NAME = 'fk_rescreen_batches_calibration_employee'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches`
        ADD CONSTRAINT `fk_rescreen_batches_calibration_employee`
        FOREIGN KEY (`calibration_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @add_rescreen_calibration_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_machine_fk = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND CONSTRAINT_NAME = 'fk_rescreen_batches_machine'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches`
        ADD CONSTRAINT `fk_rescreen_batches_machine`
        FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @add_rescreen_machine_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_rescreen_first_piece_employee_fk = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND CONSTRAINT_NAME = 'fk_rescreen_batches_first_piece_employee'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches`
        ADD CONSTRAINT `fk_rescreen_batches_first_piece_employee`
        FOREIGN KEY (`first_piece_measured_by_employee_id`) REFERENCES `employees` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE'
);
PREPARE stmt FROM @add_rescreen_first_piece_employee_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
