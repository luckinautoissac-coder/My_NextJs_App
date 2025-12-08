-- 数据库表结构更新脚本
-- 添加新字段以支持完整的消息数据

USE chatapp;

-- 添加 model_responses 字段（JSON格式存储多模型回复）
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS model_responses JSON NULL COMMENT '多模型回复数据';

-- 添加 selected_model_id 字段（存储选中的模型ID）
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS selected_model_id VARCHAR(255) NULL COMMENT '选中的模型ID';

-- 添加 thinking_info 字段（JSON格式存储思考链信息）
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS thinking_info JSON NULL COMMENT '思考链信息';

-- 查看更新后的表结构
DESCRIBE messages;

-- 显示成功消息
SELECT '✅ 数据库表结构更新完成！' AS status;

