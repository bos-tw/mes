-- 新增訂單主表最終報價欄位（元/M）
ALTER TABLE `orders`
ADD COLUMN `final_quote_per_m` DECIMAL(14,2) NULL COMMENT '最終報價(元/M)' AFTER `total_amount`;
