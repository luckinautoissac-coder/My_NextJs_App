# Vercel + VPS MySQL 部署完整代码

## 🎯 你已完成的步骤

✅ SSH连接到VPS
✅ 安装配置MySQL

## 📦 接下来需要做的

### 步骤1: 安装数据库依赖

在项目根目录执行：

```bash
npm install mysql2
```

### 步骤2: 修改数据库连接文件

将现有的 `src/lib/database.ts` 替换为：

```typescript
// src/lib/database.ts
import mysql from 'mysql2/promise'

// 创建连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: false // VPS内网连接不需要SSL
})

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
 * 测试连接
 */
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

### 步骤3: 配置环境变量

创建 `.env.local` 文件（本地测试用）：

```bash
# .env.local
DB_HOST=217.15.171.72
DB_USER=vercel_user
DB_PASSWORD=你的密码
DB_NAME=chatapp
DB_PORT=3306
```

⚠️ **重要**: 将 `.env.local` 添加到 `.gitignore`，不要上传到GitHub！

```bash
# .gitignore
.env.local
.env*.local
```

### 步骤4: 测试本地连接（可选）

```bash
npm run dev
```

打开浏览器测试发送消息，看是否能保存到VPS数据库。

### 步骤5: 上传代码到GitHub

**方式A: 使用GitHub Desktop（推荐）**

1. 打开GitHub Desktop
2. 看到修改的文件列表
3. 左下角填写提交信息：`Add VPS MySQL support`
4. 点击 **Commit to main**
5. 点击右上角 **Push origin**

**方式B: 使用命令行**

```bash
git add .
git commit -m "Add VPS MySQL support"
git push origin main
```

### 步骤6: 部署到Vercel

#### 6.1 注册/登录Vercel

1. 访问 https://vercel.com
2. 点击 **Continue with GitHub**
3. 授权登录

#### 6.2 导入项目

1. 点击 **Add New...** → **Project**
2. 找到你的仓库（如 `chatapp`）
3. 点击 **Import**

#### 6.3 配置环境变量（关键步骤！）

在部署配置页面，找到 **Environment Variables** 部分：

```
添加以下5个环境变量：

Name: DB_HOST
Value: 217.15.171.72

Name: DB_USER  
Value: vercel_user (或你的用户名)

Name: DB_PASSWORD
Value: [你的MySQL密码]

Name: DB_NAME
Value: chatapp

Name: DB_PORT
Value: 3306
```

#### 6.4 部署

1. 检查配置无误
2. 点击底部 **Deploy** 按钮
3. 等待2-3分钟（会显示构建进度）
4. 看到 🎉 Success！

### 步骤7: 测试部署结果

1. 点击 **Visit** 按钮访问你的应用
2. 发送一条测试消息
3. 刷新页面，消息还在 ✅
4. 完成！

## 🔍 验证数据已保存到VPS

在VPS上执行：

```bash
mysql -u vercel_user -p chatapp

# 输入密码后
SELECT COUNT(*) FROM messages;
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 5;
```

应该能看到刚才发送的消息！

## 🎯 完成检查清单

- [ ] 安装了 `mysql2` 依赖
- [ ] 修改了 `src/lib/database.ts`
- [ ] 创建了 `.env.local`（本地测试）
- [ ] 添加了 `.env.local` 到 `.gitignore`
- [ ] 提交代码到GitHub
- [ ] 在Vercel导入项目
- [ ] 配置了5个环境变量
- [ ] 部署成功
- [ ] 测试消息可以保存
- [ ] 在VPS验证数据

## 🆘 常见问题

### 问题1: Vercel部署失败

**查看错误：**
1. 点击失败的部署
2. 查看 **Building** 日志
3. 截图错误信息

**常见原因：**
- 环境变量未设置
- 代码有语法错误
- 依赖未安装

### 问题2: 连接数据库失败

**检查：**
```bash
# 在VPS上检查MySQL是否运行
systemctl status mysql

# 检查防火墙
ufw status
# 应该看到: 3306 ALLOW

# 检查MySQL用户
mysql -u root -p
SELECT User, Host FROM mysql.user WHERE User='vercel_user';
# 应该看到: vercel_user | %
```

### 问题3: 消息无法保存

**检查Vercel日志：**
1. Vercel项目页面
2. 点击 **Logs** 标签
3. 查看错误信息

## 💰 最终成本

```
Vercel: $0/月 ✅
VPS: ¥43/月 (已有) ✅
数据库: 包含在VPS中 ✅
存储: 100GB ✅
───────────────────
总计: ¥0/月额外费用 ✅
```

## 🎉 恭喜！

完成后你就拥有了：
- ✅ 自动部署（Git推送就更新）
- ✅ 100GB存储（够用很久）
- ✅ 全球CDN（访问快速）
- ✅ ¥0额外成本
- ✅ 数据完全掌控（在你的VPS上）

---

**准备好了吗？我们开始修改代码！** 🚀

需要我提供完整的代码文件吗？

