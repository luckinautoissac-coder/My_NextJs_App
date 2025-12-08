# Hostinger 一站式部署方案

## 📋 方案概述

使用 Hostinger 的 MySQL 数据库 + Next.js 部署，一个平台搞定所有需求。

## ✨ 优势

- ✅ **一站式**：部署、数据库、域名全在 Hostinger
- ✅ **简单**：无需配置多个服务
- ✅ **便宜**：约 ¥29/月搞定（比Supabase Pro便宜）
- ✅ **稳定**：Hostinger 在全球有良好口碑
- ✅ **无限存储**：Premium套餐提供无限MySQL
- ✅ **你已经在用**：无需学习新平台

## 🚀 实施步骤

### 步骤1: 创建MySQL数据库（5分钟）

1. 登录 Hostinger 控制面板
2. 找到 **数据库 (Databases)** 
3. 点击 **创建新数据库**
4. 记录下：
   - 数据库名: `u123456789_chatapp`
   - 用户名: `u123456789_user`
   - 密码: `your_password`
   - 主机: `localhost` 或 `mysql.hostinger.com`

### 步骤2: 创建数据表（5分钟）

在 Hostinger 的 **phpMyAdmin** 中执行：

```sql
-- 创建消息表
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  topic_id VARCHAR(36),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'sent',
  model_id VARCHAR(50),
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建话题表
CREATE TABLE topics (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户设置表
CREATE TABLE user_settings (
  user_id VARCHAR(100) PRIMARY KEY,
  api_key TEXT,
  selected_model VARCHAR(50),
  base_url VARCHAR(255),
  settings JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建自动清理旧数据的存储过程（可选）
DELIMITER //
CREATE PROCEDURE clean_old_messages(IN days_to_keep INT)
BEGIN
  DELETE FROM messages 
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
END //
DELIMITER ;
```

### 步骤3: 安装依赖（2分钟）

```bash
npm install mysql2
```

### 步骤4: 创建数据库连接（5分钟）

```typescript
// src/lib/database.ts
import mysql from 'mysql2/promise'

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

// 测试连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功')
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    return false
  }
}

// 获取用户ID（简化版）
export function getUserId(): string {
  // 从cookie或生成设备ID
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('__user_id__')
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('__user_id__', userId)
    }
    return userId
  }
  return 'server'
}

/**
 * 保存消息
 */
export async function saveMessage(message: {
  id: string
  userId: string
  topicId?: string
  role: string
  content: string
  messageType?: string
  status?: string
  modelId?: string
  timestamp: Date
}) {
  const connection = await pool.getConnection()
  
  try {
    await connection.execute(
      `INSERT INTO messages (id, user_id, topic_id, role, content, message_type, status, model_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       content = VALUES(content), 
       status = VALUES(status)`,
      [
        message.id,
        message.userId,
        message.topicId || null,
        message.role,
        message.content,
        message.messageType || 'normal',
        message.status || 'sent',
        message.modelId || null,
        message.timestamp
      ]
    )
  } finally {
    connection.release()
  }
}

/**
 * 获取消息列表
 */
export async function getMessages(userId: string, topicId?: string) {
  const connection = await pool.getConnection()
  
  try {
    let query = 'SELECT * FROM messages WHERE user_id = ?'
    const params: any[] = [userId]
    
    if (topicId) {
      query += ' AND topic_id = ?'
      params.push(topicId)
    }
    
    query += ' ORDER BY timestamp ASC'
    
    const [rows] = await connection.execute(query, params)
    return rows
  } finally {
    connection.release()
  }
}

/**
 * 更新消息
 */
export async function updateMessage(
  id: string,
  userId: string,
  updates: {
    content?: string
    status?: string
    messageType?: string
  }
) {
  const connection = await pool.getConnection()
  
  try {
    const fields: string[] = []
    const values: any[] = []
    
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.messageType !== undefined) {
      fields.push('message_type = ?')
      values.push(updates.messageType)
    }
    
    if (fields.length === 0) return
    
    values.push(id, userId)
    
    await connection.execute(
      `UPDATE messages SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    )
  } finally {
    connection.release()
  }
}

/**
 * 删除消息
 */
export async function deleteMessage(id: string, userId: string) {
  const connection = await pool.getConnection()
  
  try {
    await connection.execute(
      'DELETE FROM messages WHERE id = ? AND user_id = ?',
      [id, userId]
    )
  } finally {
    connection.release()
  }
}

/**
 * 清理旧消息
 */
export async function cleanOldMessages(userId: string, days: number = 30) {
  const connection = await pool.getConnection()
  
  try {
    const [result] = await connection.execute(
      'DELETE FROM messages WHERE user_id = ? AND timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [userId, days]
    ) as any
    
    return result.affectedRows
  } finally {
    connection.release()
  }
}

/**
 * 获取统计信息
 */
export async function getStorageStats(userId: string) {
  const connection = await pool.getConnection()
  
  try {
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM messages WHERE user_id = ?',
      [userId]
    ) as any
    
    const [dateResult] = await connection.execute(
      'SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM messages WHERE user_id = ?',
      [userId]
    ) as any
    
    return {
      messageCount: countResult[0]?.count || 0,
      oldestMessage: dateResult[0]?.oldest || null,
      newestMessage: dateResult[0]?.newest || null
    }
  } finally {
    connection.release()
  }
}

export default pool
```

### 步骤5: 创建API接口（10分钟）

```typescript
// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/database'

// 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const topicId = request.nextUrl.searchParams.get('topicId')
    
    const messages = await db.getMessages(userId, topicId || undefined)
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('获取消息失败:', error)
    return NextResponse.json(
      { error: '获取消息失败' },
      { status: 500 }
    )
  }
}

// 保存消息
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const message = await request.json()
    
    await db.saveMessage({
      ...message,
      userId,
      timestamp: new Date(message.timestamp)
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('保存消息失败:', error)
    return NextResponse.json(
      { error: '保存消息失败' },
      { status: 500 }
    )
  }
}

// 更新消息
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const { id, ...updates } = await request.json()
    
    await db.updateMessage(id, userId, updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新消息失败:', error)
    return NextResponse.json(
      { error: '更新消息失败' },
      { status: 500 }
    )
  }
}

// 删除消息
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const id = request.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: '缺少消息ID' },
        { status: 400 }
      )
    }
    
    await db.deleteMessage(id, userId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除消息失败:', error)
    return NextResponse.json(
      { error: '删除消息失败' },
      { status: 500 }
    )
  }
}
```

### 步骤6: 配置环境变量

```bash
# .env.local (本地开发)
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

# Hostinger 环境变量（在Hostinger控制面板设置）
DB_HOST=localhost
DB_USER=u123456789_user
DB_PASSWORD=your_password
DB_NAME=u123456789_chatapp
```

### 步骤7: 修改 Store 使用 API

```typescript
// src/store/chatStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getUserId() {
  let userId = localStorage.getItem('__user_id__')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('__user_id__', userId)
  }
  return userId
}

interface ChatState {
  messages: Message[]
  isLoading: boolean
  
  addMessage: (message: Message) => Promise<void>
  updateMessage: (id: string, updates: Partial<Message>) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  loadMessages: (topicId?: string) => Promise<void>
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      
      // 添加消息
      addMessage: async (message) => {
        // 立即更新本地
        set(state => ({ messages: [...state.messages, message] }))
        
        // 保存到数据库
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': getUserId()
            },
            body: JSON.stringify(message)
          })
        } catch (error) {
          console.error('保存消息失败:', error)
        }
      },
      
      // 加载消息
      loadMessages: async (topicId) => {
        set({ isLoading: true })
        
        try {
          const url = topicId 
            ? `/api/messages?topicId=${topicId}`
            : '/api/messages'
          
          const response = await fetch(url, {
            headers: {
              'x-user-id': getUserId()
            }
          })
          
          const { messages } = await response.json()
          set({ messages, isLoading: false })
        } catch (error) {
          console.error('加载消息失败:', error)
          set({ isLoading: false })
        }
      },
      
      // 更新消息
      updateMessage: async (id, updates) => {
        // 立即更新本地
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, ...updates } : m
          )
        }))
        
        // 更新数据库
        try {
          await fetch('/api/messages', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': getUserId()
            },
            body: JSON.stringify({ id, ...updates })
          })
        } catch (error) {
          console.error('更新消息失败:', error)
        }
      },
      
      // 删除消息
      deleteMessage: async (id) => {
        // 立即更新本地
        set(state => ({
          messages: state.messages.filter(m => m.id !== id)
        }))
        
        // 删除数据库
        try {
          await fetch(`/api/messages?id=${id}`, {
            method: 'DELETE',
            headers: {
              'x-user-id': getUserId()
            }
          })
        } catch (error) {
          console.error('删除消息失败:', error)
        }
      }
    }),
    {
      name: 'chat-cache',
      partialize: (state) => ({
        // 只缓存最近20条
        messages: state.messages.slice(-20)
      })
    }
  )
)
```

### 步骤8: 部署到 Hostinger（10分钟）

#### 方式1: Git 部署（推荐）

1. 将代码推送到 GitHub
2. 在 Hostinger 控制面板找到 **Git 部署**
3. 连接你的 GitHub 仓库
4. 设置环境变量（数据库信息）
5. 点击部署

#### 方式2: 文件上传

1. 构建项目：`npm run build`
2. 使用 Hostinger 文件管理器上传 `.next` 文件夹
3. 设置 Node.js 版本（18+）
4. 启动应用

## 💰 成本对比

| 方案 | 月费用 | 说明 |
|------|--------|------|
| **Hostinger Premium** | ~¥29 | 推荐，性价比最高 |
| Supabase Free | ¥0 | 但有限制 |
| Supabase Pro | ~¥175 | 功能多但贵 |

**Hostinger 优势：更便宜 + 一站式**

## 🎯 为什么不推荐 Notion

### Notion API 的问题

❌ **速度慢**
- API响应时间：500-2000ms
- 用户体验差

❌ **请求限制**
- 每分钟只能3-5次请求
- 不适合高频操作

❌ **不适合作为数据库**
- 设计用于笔记，不是数据库
- 查询功能弱

❌ **成本高**
- 需要付费版才能用API
- 不划算

### Notion 适合的场景

✅ 作为CMS（内容管理）
- 存储静态内容
- 低频更新的数据

❌ 不适合作为应用数据库
- 聊天消息（高频读写）
- 实时数据

## 📊 最终方案对比

| 特性 | Hostinger MySQL | Supabase | Notion |
|------|----------------|----------|--------|
| 速度 | ⚡⚡⚡ 快 | ⚡⚡ 较快 | ⚡ 慢 |
| 价格 | ¥29/月 | ¥0-175/月 | ¥60/月 |
| 部署 | ⭐⭐⭐ 简单 | ⭐⭐⭐ 简单 | ⭐⭐ 较复杂 |
| 存储 | 无限 | 500MB-8GB | 有限 |
| 请求限制 | 无 | 较宽松 | 严格 |
| 一站式 | ✅ | ❌ | ❌ |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |

## ✅ 总结

**强烈推荐：Hostinger MySQL 方案**

理由：
1. ✅ 你已经在用 Hostinger
2. ✅ 一个平台搞定所有（部署+数据库+域名）
3. ✅ 价格便宜（¥29/月）
4. ✅ 性能优秀
5. ✅ 无存储限制
6. ✅ 简单易用

**不推荐 Notion**
- 太慢
- 限制太多
- 不适合这个场景

## 🚀 行动计划

1. **今天**：用临时脚本解决客户问题
2. **本周**：部署 Hostinger MySQL 方案
3. **完成**：彻底解决存储问题

需要我帮你修改具体代码吗？

