// VPS MySQL 数据库连接
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
  queueLimit: 0
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

// 保存消息
export async function saveMessage(message: {
  id: string
  userId: string
  topicId?: string
  role: string
  content: string
  messageType?: string
  status?: string
  timestamp: Date
}) {
  const [result] = await pool.execute(
    `INSERT INTO messages (id, user_id, topic_id, role, content, message_type, status, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content), status = VALUES(status)`,
    [
      message.id,
      message.userId,
      message.topicId || null,
      message.role,
      message.content,
      message.messageType || 'normal',
      message.status || 'sent',
      message.timestamp
    ]
  )
  return result
}

// 获取消息
export async function getMessages(userId: string, topicId?: string) {
  let query = 'SELECT * FROM messages WHERE user_id = ?'
  const params: any[] = [userId]
  
  if (topicId) {
    query += ' AND topic_id = ?'
    params.push(topicId)
  }
  
  query += ' ORDER BY timestamp ASC'
  const [rows] = await pool.execute(query, params)
  return rows
}

// 更新消息
export async function updateMessage(id: string, userId: string, updates: any) {
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.content) {
    fields.push('content = ?')
    values.push(updates.content)
  }
  if (updates.status) {
    fields.push('status = ?')
    values.push(updates.status)
  }
  
  if (fields.length === 0) return
  
  values.push(id, userId)
  await pool.execute(
    `UPDATE messages SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  )
}

// 删除消息
export async function deleteMessage(id: string, userId: string) {
  await pool.execute('DELETE FROM messages WHERE id = ? AND user_id = ?', [id, userId])
}

export default pool

