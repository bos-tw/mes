SET @alter_rescreen_source_return_nullable = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'source_return_order_id'
          AND IS_NULLABLE = 'NO'
    ),
    'ALTER TABLE `rescreen_batches` MODIFY `source_return_order_id` BIGINT DEFAULT NULL COMMENT ''來源退貨單ID；非退貨來源二次篩選可為空''',
    'DO 0'
);
PREPARE stmt FROM @alter_rescreen_source_return_nullable;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @alter_rescreen_item_return_nullable = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batch_items'
          AND COLUMN_NAME = 'return_order_item_id'
          AND IS_NULLABLE = 'NO'
    ),
    'ALTER TABLE `rescreen_batch_items` MODIFY `return_order_item_id` BIGINT DEFAULT NULL COMMENT ''來源退貨明細ID；非退貨來源二次篩選可為空''',
    'DO 0'
);
PREPARE stmt FROM @alter_rescreen_item_return_nullable;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_second_screening_reason = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'second_screening_reason'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD COLUMN `second_screening_reason` VARCHAR(50) DEFAULT NULL COMMENT ''二次篩選原因：relaxed_after_high_defect/customer_required_second_pass'' AFTER `request_reason_code`'
);
PREPARE stmt FROM @add_second_screening_reason;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_customer_approval_reference = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'customer_approval_reference'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD COLUMN `customer_approval_reference` TEXT DEFAULT NULL COMMENT ''客戶放寬標準或要求二篩的通知/佐證'' AFTER `second_screening_reason`'
);
PREPARE stmt FROM @add_customer_approval_reference;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_source_requirement_id = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'source_requirement_id'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD COLUMN `source_requirement_id` BIGINT DEFAULT NULL COMMENT ''來源二篩要求設定ID；保留給客戶標準嚴格設定追溯'' AFTER `customer_approval_reference`'
);
PREPARE stmt FROM @add_source_requirement_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_source_defect_history_record_id = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND COLUMN_NAME = 'source_defect_history_record_id'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD COLUMN `source_defect_history_record_id` BIGINT DEFAULT NULL COMMENT ''觸發放寬重篩的不良歷史紀錄ID'' AFTER `source_requirement_id`'
);
PREPARE stmt FROM @add_source_defect_history_record_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `rescreen_batches`
SET
    `second_screening_reason` = CASE
        WHEN `second_screening_reason` IS NOT NULL AND `second_screening_reason` <> '' THEN `second_screening_reason`
        WHEN `request_reason_code` = 'high_defect_relax' THEN 'relaxed_after_high_defect'
        WHEN `request_reason_code` = 'customer_strict_request' THEN 'customer_required_second_pass'
        WHEN `rescreen_type` = 'relaxed_rescreen' THEN 'relaxed_after_high_defect'
        ELSE 'customer_required_second_pass'
    END,
    `request_reason_code` = CASE
        WHEN `request_reason_code` IS NOT NULL AND `request_reason_code` <> '' THEN `request_reason_code`
        WHEN `rescreen_type` = 'relaxed_rescreen' THEN 'high_defect_relax'
        ELSE 'customer_strict_request'
    END
WHERE `deleted_at` IS NULL;

SET @add_idx_second_screening_reason = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND INDEX_NAME = 'idx_rescreen_batches_second_reason'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD KEY `idx_rescreen_batches_second_reason` (`second_screening_reason`)'
);
PREPARE stmt FROM @add_idx_second_screening_reason;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_idx_rescreen_source_defect_history = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'rescreen_batches'
          AND INDEX_NAME = 'idx_rescreen_batches_source_defect_history'
    ),
    'DO 0',
    'ALTER TABLE `rescreen_batches` ADD KEY `idx_rescreen_batches_source_defect_history` (`source_defect_history_record_id`)'
);
PREPARE stmt FROM @add_idx_rescreen_source_defect_history;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
