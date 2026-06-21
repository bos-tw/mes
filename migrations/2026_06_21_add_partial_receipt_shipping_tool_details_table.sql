SET @alter_wopr_shipping_tool_details_to_text = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`COLUMNS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_order_partial_receipts'
          AND `COLUMN_NAME` = 'shipping_tool_details'
          AND `DATA_TYPE` <> 'text'
    ) > 0,
    'ALTER TABLE `work_order_partial_receipts` MODIFY COLUMN `shipping_tool_details` TEXT NULL COMMENT ''本次出貨載具摘要''',
    'DO 0'
);
PREPARE stmt FROM @alter_wopr_shipping_tool_details_to_text;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `work_order_partial_receipt_tools` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `partial_receipt_id` BIGINT NOT NULL COMMENT '對應部分入庫主檔',
    `order_item_tool_id` BIGINT NULL COMMENT '來源訂單品項載具設定',
    `tool_id` BIGINT NULL COMMENT '來源載具主檔',
    `tool_name` VARCHAR(100) NOT NULL COMMENT '載具名稱快照',
    `tool_type` VARCHAR(100) NULL COMMENT '載具類型快照',
    `unit_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0.000 COMMENT '本次參考單重(kg)',
    `quantity` INT NOT NULL DEFAULT 1 COMMENT '本次使用數量',
    `total_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0.000 COMMENT '本次參考總重(kg)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_woprt_partial_receipt_id` (`partial_receipt_id`),
    KEY `idx_woprt_order_item_tool_id` (`order_item_tool_id`),
    KEY `idx_woprt_tool_id` (`tool_id`),
    CONSTRAINT `fk_woprt_partial_receipt`
        FOREIGN KEY (`partial_receipt_id`) REFERENCES `work_order_partial_receipts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_woprt_order_item_tool`
        FOREIGN KEY (`order_item_tool_id`) REFERENCES `order_item_tools` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_woprt_tool`
        FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='工單部分入庫載具明細';
