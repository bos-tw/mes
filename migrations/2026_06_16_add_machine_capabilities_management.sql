CREATE TABLE IF NOT EXISTS `machine_capabilities` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `capability_code` VARCHAR(50) NOT NULL,
    `capability_name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_machine_capabilities_code` (`capability_code`),
    UNIQUE KEY `uk_machine_capabilities_name` (`capability_name`),
    KEY `idx_machine_capabilities_active_sort` (`is_active`, `sort_order`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `machine_capability_assignments` (
    `machine_id` BIGINT NOT NULL,
    `capability_id` INT NOT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`machine_id`, `capability_id`),
    KEY `idx_mca_capability_id` (`capability_id`),
    CONSTRAINT `fk_mca_machine` FOREIGN KEY (`machine_id`) REFERENCES `machines` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mca_capability` FOREIGN KEY (`capability_id`) REFERENCES `machine_capabilities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `machine_capabilities` (`capability_code`, `capability_name`, `description`, `sort_order`, `is_active`)
SELECT 'CONTINUOUS', '連續', '適用連續式篩分能力', 10, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `machine_capabilities` WHERE `capability_code` = 'CONTINUOUS'
);

INSERT INTO `machine_capabilities` (`capability_code`, `capability_name`, `description`, `sort_order`, `is_active`)
SELECT 'GLASS', '玻璃', '適用玻璃類篩分能力', 20, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `machine_capabilities` WHERE `capability_code` = 'GLASS'
);

INSERT INTO `machine_capabilities` (`capability_code`, `capability_name`, `description`, `sort_order`, `is_active`)
SELECT 'SPLIT', '分割', '適用分割式篩分能力', 30, 1
WHERE NOT EXISTS (
    SELECT 1 FROM `machine_capabilities` WHERE `capability_code` = 'SPLIT'
);
