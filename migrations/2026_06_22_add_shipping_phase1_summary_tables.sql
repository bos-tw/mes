SET @add_shipping_orders_shipment_purpose = IF(
    EXISTS(
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'shipping_orders'
          AND column_name = 'shipment_purpose'
    ),
    'SELECT 1',
    'ALTER TABLE `shipping_orders` ADD COLUMN `shipment_purpose` VARCHAR(30) NOT NULL DEFAULT ''normal'' COMMENT ''出貨性質：normal / defect_return / tool_return / mixed'' AFTER `carrier`'
);
PREPARE stmt FROM @add_shipping_orders_shipment_purpose;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `shipping_orders`
SET `shipment_purpose` = 'normal'
WHERE TRIM(COALESCE(`shipment_purpose`, '')) = '';

CREATE TABLE IF NOT EXISTS `shipping_order_defect_summaries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `shipping_order_id` BIGINT NOT NULL,
    `source_shipping_order_id` BIGINT NULL COMMENT '原始出貨單 ID（不良回送來源）',
    `source_work_order_id` BIGINT NULL COMMENT '原始工單 ID',
    `source_inventory_item_id` BIGINT NULL COMMENT '原始庫存項目 ID',
    `defect_quantity` DECIMAL(14,2) NOT NULL DEFAULT 0 COMMENT '不良品總數量',
    `weight_per_unit_g` DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT '不良品單重(g)',
    `total_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT '不良品總重量(kg)',
    `notes` TEXT NULL COMMENT '不良品摘要備註',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_sods_shipping_order_id` (`shipping_order_id`),
    KEY `idx_sods_source_shipping_order_id` (`source_shipping_order_id`),
    KEY `idx_sods_source_work_order_id` (`source_work_order_id`),
    KEY `idx_sods_source_inventory_item_id` (`source_inventory_item_id`),
    CONSTRAINT `fk_sods_shipping_order`
        FOREIGN KEY (`shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sods_source_shipping_order`
        FOREIGN KEY (`source_shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sods_source_work_order`
        FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_sods_source_inventory_item`
        FOREIGN KEY (`source_inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出貨單第一階段不良品摘要';

CREATE TABLE IF NOT EXISTS `shipping_order_tool_summaries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `shipping_order_id` BIGINT NOT NULL,
    `tool_id` BIGINT NULL COMMENT '來源載具主檔 ID',
    `tool_name` VARCHAR(100) NOT NULL COMMENT '載具名稱快照',
    `tool_type` VARCHAR(100) NULL COMMENT '載具類型快照',
    `unit_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT '載具單重(kg)',
    `quantity` INT NOT NULL DEFAULT 0 COMMENT '載具數量',
    `total_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0 COMMENT '載具總重(kg)',
    `notes` TEXT NULL COMMENT '載具摘要備註',
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_sots_shipping_order_id` (`shipping_order_id`),
    KEY `idx_sots_tool_id` (`tool_id`),
    CONSTRAINT `fk_sots_shipping_order`
        FOREIGN KEY (`shipping_order_id`) REFERENCES `shipping_orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sots_tool`
        FOREIGN KEY (`tool_id`) REFERENCES `tools` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='出貨單第一階段客戶載具摘要';
