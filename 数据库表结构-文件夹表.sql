-- ============================================
-- 文件夹功能 - 数据库表结构
-- ============================================
-- 本脚本用于创建 folders 表，支持话题文件夹分类功能
--
-- 使用说明：
-- 1. 如果使用 Supabase，请在 SQL Editor 中执行以下语句
-- 2. 如果使用其他数据库，根据实际情况调整语法
-- ============================================

-- 1. 创建 folders 表
CREATE TABLE IF NOT EXISTS folders (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_id VARCHAR(255) NOT NULL,
  is_expanded BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_agent_id ON folders(agent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_agent ON folders(user_id, agent_id);

-- 3. 添加注释说明（仅适用于支持 COMMENT 的数据库）
COMMENT ON TABLE folders IS '话题文件夹表';
COMMENT ON COLUMN folders.id IS '文件夹唯一ID';
COMMENT ON COLUMN folders.user_id IS '用户ID';
COMMENT ON COLUMN folders.name IS '文件夹名称';
COMMENT ON COLUMN folders.agent_id IS '所属智能体ID';
COMMENT ON COLUMN folders.is_expanded IS '是否展开';
COMMENT ON COLUMN folders."order" IS '排序序号';
COMMENT ON COLUMN folders.created_at IS '创建时间';
COMMENT ON COLUMN folders.updated_at IS '更新时间';

-- 4. 为 topics 表添加 folder_id 字段（如果还没有）
ALTER TABLE topics 
ADD COLUMN IF NOT EXISTS folder_id VARCHAR(255);

-- 5. 为 folder_id 创建索引
CREATE INDEX IF NOT EXISTS idx_topics_folder_id ON topics(folder_id);

-- 6. 添加注释说明
COMMENT ON COLUMN topics.folder_id IS '话题所属文件夹ID，为空表示未归档';

-- ============================================
-- 验证创建结果
-- ============================================

-- 查看 folders 表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'folders'
ORDER BY ordinal_position;

-- 查看 topics 表的 folder_id 字段
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'topics' AND column_name = 'folder_id';

-- 查看索引
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename IN ('folders', 'topics')
ORDER BY tablename, indexname;

-- ============================================
-- 测试查询（可选）
-- ============================================

-- 查看当前用户的所有文件夹
-- SELECT * FROM folders WHERE user_id = 'your_user_id' ORDER BY agent_id, "order";

-- 查看某个文件夹内的所有话题
-- SELECT * FROM topics WHERE folder_id = 'your_folder_id';

-- 查看未归档的话题（不在任何文件夹内）
-- SELECT * FROM topics WHERE folder_id IS NULL;

