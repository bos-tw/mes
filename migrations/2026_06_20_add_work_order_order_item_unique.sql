-- 防止同一個有效訂單細項在併發請求下建立多張工單。
-- delete_token 在有效資料固定為 0，軟刪除時會改為工單 ID，因此仍允許刪除後重建。

SET @add_work_order_order_item_unique = IF(
    (
        SELECT COUNT(*)
        FROM `information_schema`.`STATISTICS`
        WHERE `TABLE_SCHEMA` = DATABASE()
          AND `TABLE_NAME` = 'work_orders'
          AND `INDEX_NAME` = 'uk_work_orders_order_item_active'
    ) = 0,
    'ALTER TABLE `work_orders` ADD UNIQUE KEY `uk_work_orders_order_item_active` (`order_item_id`, `delete_token`)',
    'DO 0'
);

PREPARE stmt FROM @add_work_order_order_item_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
