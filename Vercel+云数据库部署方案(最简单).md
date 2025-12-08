# Vercel + 云端数据库部署方案（最简单）

## 📋 方案概述

使用 Vercel 部署 Next.js 应用 + PlanetScale（MySQL兼容）云数据库。

**特点：完全免费 + 零维护 + 3步搞定**

## ✨ 为什么选择这个方案

### 对比其他方案

| 特性 | Vercel + PlanetScale | Hostinger VPS | Supabase |
|------|---------------------|---------------|----------|
| **部署难度** | ⭐ 最简单 | ⭐⭐⭐ 需要SSH | ⭐⭐ 简单 |
| **费用** | ¥0 | ¥43/月 | ¥0-175/月 |
| **维护成本** | 零 | 需要维护 | 零 |
| **自动部署** | ✅ Git推送自动部署 | ❌ 需要手动 | ✅ |
| **全球CDN** | ✅ | ❌ | ✅ |
| **扩展性** | ✅ 自动扩展 | ❌ 固定配置 | ✅ |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🚀 完整部署步骤（20分钟）

### 步骤1: 创建PlanetScale数据库（5分钟）

1. 访问 https://planetscale.com
2. 使用GitHub账号登录
3. 点击 **New database**
4. 填写信息：
   - Name: `chatapp`
   - Region: `AWS us-east-1`（或选择离你近的）
5. 点击 **Create database**

#### 创建数据表

在PlanetScale控制台的 **Console** 标签中执行：

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
  KEY idx_user_id (user_id),
  KEY idx_timestamp (timestamp),
  KEY idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建话题表
CREATE TABLE topics (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_id (user_id)
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
```

#### 获取连接信息

1. 点击 **Connect**
2. 选择 **Node.js**
3. 复制连接字符串，类似：
```
mysql://username:password@aws.connect.psdb.cloud/chatapp?ssl={"rejectUnauthorized":true}
```

### 步骤2: 配置项目（5分钟）

#### 安装依赖

```bash
npm install @planetscale/database
```

#### 创建数据库连接文件

```typescript
// src/lib/database.ts
import { connect } from '@planetscale/database'

// 创建连接
const config = {
  url: process.env.DATABASE_URL || ''
}

const conn = connect(config)

// 获取用户ID
export function getUserId(): string {
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
  const sql = `
    INSERT INTO messages (id, user_id, topic_id, role, content, message_type, status, model_id, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    content = VALUES(content), 
    status = VALUES(status)
  `
  
  await conn.execute(sql, [
    message.id,
    message.userId,
    message.topicId || null,
    message.role,
    message.content,
    message.messageType || 'normal',
    message.status || 'sent',
    message.modelId || null,
    message.timestamp.toISOString()
  ])
}

/**
 * 获取消息列表
 */
export async function getMessages(userId: string, topicId?: string) {
  let sql = 'SELECT * FROM messages WHERE user_id = ?'
  const params: any[] = [userId]
  
  if (topicId) {
    sql += ' AND topic_id = ?'
    params.push(topicId)
  }
  
  sql += ' ORDER BY timestamp ASC'
  
  const results = await conn.execute(sql, params)
  return results.rows
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
  
  const sql = `UPDATE messages SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  await conn.execute(sql, values)
}

/**
 * 删除消息
 */
export async function deleteMessage(id: string, userId: string) {
  await conn.execute(
    'DELETE FROM messages WHERE id = ? AND user_id = ?',
    [id, userId]
  )
}

/**
 * 清理旧消息
 */
export async function cleanOldMessages(userId: string, days: number = 30) {
  const result = await conn.execute(
    'DELETE FROM messages WHERE user_id = ? AND timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)',
    [userId, days]
  )
  
  return result.rowsAffected || 0
}

/**
 * 获取统计信息
 */
export async function getStorageStats(userId: string) {
  const countResult = await conn.execute(
    'SELECT COUNT(*) as count FROM messages WHERE user_id = ?',
    [userId]
  )
  
  const dateResult = await conn.execute(
    'SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM messages WHERE user_id = ?',
    [userId]
  )
  
  return {
    messageCount: countResult.rows[0]?.count || 0,
    oldestMessage: dateResult.rows[0]?.oldest || null,
    newestMessage: dateResult.rows[0]?.newest || null
  }
}
```

#### 创建API路由（与之前相同）

```typescript
// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as db from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const topicId = request.nextUrl.searchParams.get('topicId')
    
    const messages = await db.getMessages(userId, topicId || undefined)
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('获取消息失败:', error)
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 })
  }
}

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
    return NextResponse.json({ error: '保存消息失败' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const { id, ...updates } = await request.json()
    
    await db.updateMessage(id, userId, updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新消息失败:', error)
    return NextResponse.json({ error: '更新消息失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous'
    const id = request.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: '缺少消息ID' }, { status: 400 })
    }
    
    await db.deleteMessage(id, userId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除消息失败:', error)
    return NextResponse.json({ error: '删除消息失败' }, { status: 500 })
  }
}
```

### 步骤3: 部署到Vercel（5分钟）

#### 方式1: 通过GitHub（推荐）

1. 将代码推送到GitHub
2. 访问 https://vercel.com
3. 点击 **Import Project**
4. 选择你的GitHub仓库
5. 配置环境变量：
   - `DATABASE_URL`: 粘贴PlanetScale的连接字符串
6. 点击 **Deploy**

完成！Vercel会自动：
- 构建你的应用
- 部署到全球CDN
- 生成一个域名（如 `your-app.vercel.app`）

#### 方式2: 通过CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 设置环境变量
vercel env add DATABASE_URL
# 粘贴PlanetScale连接字符串

# 重新部署
vercel --prod
```

### 步骤4: 设置自定义域名（可选，5分钟）

1. 在Vercel项目设置中点击 **Domains**
2. 添加你的域名（如 `chat.yourdomain.com`）
3. 按照提示配置DNS（在Hostinger DNS管理中添加记录）
4. 等待SSL证书自动配置（约5分钟）

## 🎯 自动部署配置

配置完成后，每次你：
```
git push origin main
```

Vercel会自动：
1. 拉取最新代码
2. 运行测试
3. 构建应用
4. 部署到生产环境
5. 发送部署通知

**完全自动化，无需任何手动操作！**

## 💰 成本分析

### PlanetScale 免费额度

- ✅ 5GB 存储
- ✅ 10亿行读取/月
- ✅ 1000万行写入/月
- ✅ 1个数据库

**预估：支持 1000-5000 个活跃用户**

### Vercel 免费额度

- ✅ 100GB 带宽/月
- ✅ 无限部署
- ✅ 自动HTTPS
- ✅ 全球CDN

**预估：足够中小型应用使用**

### 总成本

```
PlanetScale: ¥0
Vercel: ¥0
域名: ¥0（使用vercel.app子域名）
------
总计: ¥0/月
```

## 📊 方案对比总结

| 方案 | 月费用 | 复杂度 | 维护 | 性能 | 推荐度 |
|------|--------|--------|------|------|--------|
| **Vercel + PlanetScale** | **¥0** | ⭐ | 无 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vercel + Railway | ¥0-40 | ⭐ | 无 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Hostinger VPS | ¥43 | ⭐⭐⭐ | 需要 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Supabase | ¥0-175 | ⭐ | 无 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## ✨ Vercel方案的独特优势

### 1. 零配置部署
- 不需要配置Nginx
- 不需要配置SSL
- 不需要配置防火墙
- 不需要管理服务器

### 2. 自动优化
- 自动代码分割
- 自动图片优化
- 自动CDN缓存
- 自动边缘计算

### 3. 开发体验
- 每个分支自动预览
- 实时错误监控
- 性能分析工具
- 一键回滚

### 4. 扩展性
- 自动扩展（流量大时自动增加资源）
- 全球边缘节点（访问速度快）
- 零停机部署

## 🔍 监控和调试

### Vercel监控

登录Vercel控制台可以看到：
- 📊 访问量统计
- 🐛 错误日志
- ⚡ 性能指标
- 🌍 地理分布

### PlanetScale监控

登录PlanetScale控制台可以看到：
- 💾 存储使用量
- 📈 查询统计
- 🔍 慢查询分析
- 📊 连接数监控

## 🚨 限制和注意事项

### Vercel限制

- ⏱️ 函数执行时间：10秒（Hobby）/ 60秒（Pro）
- 📦 函数大小：50MB
- 🔄 并发连接：受限（但对你的应用足够）

**解决方案：** 如果超出限制，可以升级到Pro（$20/月）

### PlanetScale限制

- 💾 免费版：5GB存储
- 🔄 免费版：1个数据库

**解决方案：** 超出后可升级到Scaler（$29/月）

## 🎯 为什么不推荐连接本地数据库

```
Vercel (无服务器)
    ↓
    ✗ 无法连接本地数据库
    
原因：
1. Vercel是无服务器架构
2. 函数运行在全球边缘节点
3. 没有固定IP
4. 无法访问你本地网络
```

## 📋 最终决策建议

### 如果你是...

**Demo/个人项目：**
```
推荐：Vercel + PlanetScale
理由：完全免费，零维护
```

**小型商业项目（<1000用户）：**
```
推荐：Vercel + PlanetScale
理由：成本低，自动扩展
```

**中型项目（1000-5000用户）：**
```
推荐：Vercel + PlanetScale
理由：免费额度够用，可升级
```

**大型项目（>5000用户）：**
```
推荐：Vercel Pro + PlanetScale Scaler
或：Hostinger VPS（如果预算有限）
```

## ✅ 总结

**强烈推荐：Vercel + PlanetScale**

优势：
1. ✅ 完全免费
2. ✅ 3步搞定（20分钟）
3. ✅ 零维护
4. ✅ 自动部署
5. ✅ 全球CDN
6. ✅ 自动扩展
7. ✅ 符合"不想太复杂"的需求

## 🚀 行动计划

### 今天（5分钟）
- [ ] 用临时脚本解决客户问题

### 明天（20分钟）
- [ ] 注册PlanetScale账号
- [ ] 创建数据库
- [ ] 注册Vercel账号
- [ ] 连接GitHub
- [ ] 部署应用

### 完成
- [ ] ✅ 零成本运行
- [ ] ✅ 零维护负担
- [ ] ✅ 自动部署上线

---

**这是最简单、最便宜的方案！** 🎯

