-- Repair metadata that was created with an incorrect lookup description and
-- non-UTF8 message attachment comments. The statements are repeatable.

UPDATE lookup_domains
SET description = '用於定義服務分類'
WHERE id = 0
  AND domain_key = 'service_category'
  AND (description IS NULL OR description <> '用於定義服務分類');

ALTER TABLE message_attachments
    MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT COMMENT '附件 ID',
    MODIFY COLUMN message_id BIGINT NOT NULL COMMENT '訊息 ID',
    MODIFY COLUMN file_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '檔案名稱',
    MODIFY COLUMN file_path VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '檔案路徑',
    MODIFY COLUMN file_size INT UNSIGNED NULL COMMENT '檔案大小（bytes）',
    MODIFY COLUMN mime_type VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'MIME 類型',
    MODIFY COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間';

ALTER TABLE message_attachments
    COMMENT = '訊息附件';
