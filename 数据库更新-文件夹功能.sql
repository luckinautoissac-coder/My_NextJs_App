-- 话题文件夹功能 - 数据库更新脚本
-- 本脚本用于为话题表添加 folder_id 字段

-- 如果使用 Supabase，请在 SQL Editor 中执行以下语句：

-- 1. 为 topics 表添加 folder_id 字段
ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS folder_id VARCHAR(255);

-- 2. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_topics_folder_id ON topics(folder_id);

-- 3. 添加注释说明字段用途
COMMENT ON COLUMN topics.folder_id IS '话题所属文件夹ID，为空表示未归档';

-- 验证更新
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'topics' AND column_name = 'folder_id';


