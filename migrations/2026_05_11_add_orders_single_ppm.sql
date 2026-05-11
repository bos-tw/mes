-- 新增訂單主表單一 PPM 欄位
ALTER TABLE `orders`
ADD COLUMN `single_ppm` INT NULL COMMENT '單一PPM' AFTER `final_quote_per_m`;

