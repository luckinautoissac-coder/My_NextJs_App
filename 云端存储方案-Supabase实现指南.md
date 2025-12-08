# 云端存储方案 - Supabase 实现指南

## 📋 方案概述

将聊天数据存储在Supabase云端数据库，彻底解决浏览器存储限制问题。

## ✨ 优势

- ✅ **无存储限制**：免费500MB，付费无限
- ✅ **多设备同步**：手机、电脑自动同步
- ✅ **自动备份**：数据永不丢失
- ✅ **用户隔离**：每个用户只能访问自己的数据
- ✅ **无需写后端**：Supabase自动生成API
- ✅ **完全免费**：适合demo和小型项目

## 🚀 实施步骤

### 步骤1: 创建Supabase项目（5分钟）

1. 访问 https://supabase.com
2. 注册账号（支持GitHub登录）
3. 创建新项目
4. 等待数据库初始化（约2分钟）

### 步骤2: 创建数据表（5分钟）

在Supabase SQL编辑器中执行：

```sql
-- 用户表（可选，如果不需要注册登录可以跳过）
-- Supabase已内置auth.users，可直接使用

-- 聊天消息表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  topic_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'sent',
  model_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 话题表
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API设置表（每个用户的配置）
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  api_key TEXT,
  selected_model TEXT,
  base_url TEXT,
  settings JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX messages_user_id_idx ON messages(user_id);
CREATE INDEX messages_timestamp_idx ON messages(timestamp DESC);
CREATE INDEX topics_user_id_idx ON topics(user_id);

-- 启用Row Level Security（RLS）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own messages"
  ON messages FOR ALL
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can only access their own topics"
  ON topics FOR ALL
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can only access their own settings"
  ON user_settings FOR ALL
  USING (user_id = current_setting('app.user_id', true));
```

### 步骤3: 安装依赖（1分钟）

```bash
npm install @supabase/supabase-js
```

### 步骤4: 创建Supabase客户端（5分钟）

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 生成或获取用户ID（简化版，不需要注册登录）
export function getUserId(): string {
  // 方案1: 使用设备指纹（简单但不安全）
  let userId = localStorage.getItem('__user_id__')
  
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('__user_id__', userId)
  }
  
  return userId
}

// 设置当前用户ID到数据库会话
export async function setCurrentUser(userId: string) {
  await supabase.rpc('set_config', {
    name: 'app.user_id',
    value: userId
  })
}
```

### 步骤5: 创建数据库操作封装（10分钟）

```typescript
// src/lib/database.ts
import { supabase, getUserId, setCurrentUser } from './supabase'
import type { Message } from '@/types/chat'

// 初始化用户会话
async function initUser() {
  const userId = getUserId()
  await setCurrentUser(userId)
  return userId
}

/**
 * 保存消息
 */
export async function saveMessage(message: Message): Promise<void> {
  const userId = await initUser()
  
  const { error } = await supabase
    .from('messages')
    .insert({
      id: message.id,
      user_id: userId,
      topic_id: message.topicId,
      role: message.role,
      content: message.content,
      message_type: message.messageType || 'normal',
      status: message.status || 'sent',
      timestamp: message.timestamp.toISOString()
    })
  
  if (error) {
    console.error('保存消息失败:', error)
    throw error
  }
}

/**
 * 批量保存消息
 */
export async function saveMessages(messages: Message[]): Promise<void> {
  const userId = await initUser()
  
  const data = messages.map(m => ({
    id: m.id,
    user_id: userId,
    topic_id: m.topicId,
    role: m.role,
    content: m.content,
    message_type: m.messageType || 'normal',
    status: m.status || 'sent',
    timestamp: m.timestamp.toISOString()
  }))
  
  const { error } = await supabase
    .from('messages')
    .upsert(data)
  
  if (error) {
    console.error('批量保存失败:', error)
    throw error
  }
}

/**
 * 获取某个话题的消息
 */
export async function getMessages(topicId?: string): Promise<Message[]> {
  const userId = await initUser()
  
  let query = supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })
  
  if (topicId) {
    query = query.eq('topic_id', topicId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('获取消息失败:', error)
    return []
  }
  
  return data.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
    status: m.status,
    topicId: m.topic_id,
    messageType: m.message_type
  }))
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const userId = await initUser()
  
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('user_id', userId)
  
  if (error) {
    console.error('删除消息失败:', error)
    throw error
  }
}

/**
 * 更新消息
 */
export async function updateMessage(
  messageId: string, 
  updates: Partial<Message>
): Promise<void> {
  const userId = await initUser()
  
  const { error } = await supabase
    .from('messages')
    .update({
      content: updates.content,
      status: updates.status,
      message_type: updates.messageType
    })
    .eq('id', messageId)
    .eq('user_id', userId)
  
  if (error) {
    console.error('更新消息失败:', error)
    throw error
  }
}

/**
 * 清理旧消息（自动清理）
 */
export async function cleanOldMessages(days: number = 30): Promise<number> {
  const userId = await initUser()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('messages')
    .delete()
    .eq('user_id', userId)
    .lt('timestamp', cutoffDate.toISOString())
    .select('id')
  
  if (error) {
    console.error('清理旧消息失败:', error)
    return 0
  }
  
  return data.length
}

/**
 * 获取存储统计
 */
export async function getStorageStats(): Promise<{
  messageCount: number
  oldestMessage: Date | null
  newestMessage: Date | null
}> {
  const userId = await initUser()
  
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  const { data: oldest } = await supabase
    .from('messages')
    .select('timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true })
    .limit(1)
    .single()
  
  const { data: newest } = await supabase
    .from('messages')
    .select('timestamp')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()
  
  return {
    messageCount: count || 0,
    oldestMessage: oldest ? new Date(oldest.timestamp) : null,
    newestMessage: newest ? new Date(newest.timestamp) : null
  }
}
```

### 步骤6: 修改Zustand Store（10分钟）

```typescript
// src/store/chatStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as db from '@/lib/database'

interface ChatState {
  messages: Message[]
  isLoading: boolean
  
  // 操作
  addMessage: (message: Message) => Promise<void>
  updateMessage: (id: string, updates: Partial<Message>) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  loadMessages: (topicId?: string) => Promise<void>
  clearOldMessages: (days: number) => Promise<void>
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      
      // 添加消息
      addMessage: async (message) => {
        // 立即更新本地状态
        set(state => ({ messages: [...state.messages, message] }))
        
        // 异步保存到云端
        try {
          await db.saveMessage(message)
        } catch (error) {
          console.error('保存到云端失败:', error)
          // 可以添加重试逻辑或提示用户
        }
      },
      
      // 更新消息
      updateMessage: async (id, updates) => {
        // 立即更新本地状态
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, ...updates } : m
          )
        }))
        
        // 异步保存到云端
        try {
          await db.updateMessage(id, updates)
        } catch (error) {
          console.error('更新云端失败:', error)
        }
      },
      
      // 删除消息
      deleteMessage: async (id) => {
        // 立即更新本地状态
        set(state => ({
          messages: state.messages.filter(m => m.id !== id)
        }))
        
        // 异步删除云端
        try {
          await db.deleteMessage(id)
        } catch (error) {
          console.error('删除云端失败:', error)
        }
      },
      
      // 加载消息
      loadMessages: async (topicId) => {
        set({ isLoading: true })
        
        try {
          const messages = await db.getMessages(topicId)
          set({ messages, isLoading: false })
        } catch (error) {
          console.error('加载消息失败:', error)
          set({ isLoading: false })
        }
      },
      
      // 清理旧消息
      clearOldMessages: async (days) => {
        const count = await db.cleanOldMessages(days)
        console.log(`清理了 ${count} 条旧消息`)
        
        // 重新加载
        await get().loadMessages()
      }
    }),
    {
      name: 'chat-cache', // 只缓存少量数据
      partialize: (state) => ({
        // 只缓存最近20条消息作为缓存
        messages: state.messages.slice(-20)
      })
    }
  )
)
```

### 步骤7: 配置环境变量

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 步骤8: 初始化加载（应用启动时）

```typescript
// src/app/layout.tsx
'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'

export default function RootLayout({ children }) {
  const loadMessages = useChatStore(state => state.loadMessages)
  
  useEffect(() => {
    // 应用启动时从云端加载数据
    loadMessages()
  }, [])
  
  return <>{children}</>
}
```

## 📊 数据流示意图

```
用户操作 → 立即更新本地State → 渲染UI
          ↓
          异步保存到Supabase
          
应用启动 → 从Supabase加载 → 更新本地State → 渲染UI
```

## 🎯 优化建议

### 1. 离线支持（可选）

```typescript
// 检测网络状态
if (!navigator.onLine) {
  // 保存到待同步队列
  localStorage.setItem('pending_sync', JSON.stringify([...queue, message]))
}

// 网络恢复时同步
window.addEventListener('online', async () => {
  const pending = JSON.parse(localStorage.getItem('pending_sync') || '[]')
  await db.saveMessages(pending)
  localStorage.removeItem('pending_sync')
})
```

### 2. 自动清理（定时任务）

```typescript
// 每天清理一次30天前的数据
useEffect(() => {
  const interval = setInterval(() => {
    db.cleanOldMessages(30)
  }, 24 * 60 * 60 * 1000) // 24小时
  
  return () => clearInterval(interval)
}, [])
```

### 3. 实时同步（多设备）

```typescript
// 订阅实时更新
const channel = supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      // 其他设备添加的消息会实时同步到本地
      useChatStore.getState().addMessage(payload.new)
    }
  )
  .subscribe()
```

## 💰 成本估算

### Supabase 免费额度

- ✅ 500 MB 数据库存储
- ✅ 1 GB 文件存储
- ✅ 2 GB 数据传输/月
- ✅ 50,000 月活用户
- ✅ 无限API请求

**预估：** 支持 **100-500 个活跃用户**（取决于使用频率）

### 付费计划（如需扩展）

- Pro: $25/月 - 8GB数据库 + 100GB传输
- Team: $599/月 - 无限

## ⚖️ 方案选择建议

### 选择 IndexedDB（当前方案）适用于：

- ✅ 纯演示项目
- ✅ 不需要多设备同步
- ✅ 用户隐私要求高（数据不上传）
- ✅ 希望零成本运行
- ✅ 离线使用场景

### 选择 Supabase（云端存储）适用于：

- ✅ 实际产品
- ✅ 需要多设备同步
- ✅ 需要数据备份
- ✅ 可能添加协作功能
- ✅ 用户数据重要，不能丢失

## 🚀 迁移路径

如果从IndexedDB迁移到Supabase：

```typescript
// 一次性迁移脚本
async function migrateToSupabase() {
  // 1. 读取本地数据
  const localMessages = await indexedDB.getItem('chat-store')
  
  // 2. 批量上传到Supabase
  await db.saveMessages(localMessages.messages)
  
  // 3. 清理本地
  await indexedDB.clear()
  
  console.log('迁移完成！')
}
```

## 📞 总结

**时间投入：** 30-60分钟
**技术难度：** 中等
**维护成本：** 低（Supabase自动维护）
**扩展性：** 优秀

**推荐：** 
- Demo项目 → IndexedDB
- 实际产品 → Supabase

