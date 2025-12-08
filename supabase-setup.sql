-- Supabase数据库表结构
-- 创建messages表

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'sent',
  timestamp TIMESTAMPTZ NOT NULL,
  model_responses JSONB,
  selected_model_id TEXT,
  thinking_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- 启用行级安全策略（RLS）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（简化版，生产环境需要更严格的策略）
CREATE POLICY "Allow all operations" ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

