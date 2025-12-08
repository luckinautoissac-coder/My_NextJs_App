import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/vps-database'

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection()
  
  try {
    const { messages } = await request.json()
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: '无效的消息数据'
      }, { status: 400 })
    }

    await connection.beginTransaction()

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    // 批量插入，每次处理100条
    const batchSize = 100
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      
      for (const message of batch) {
        try {
          // 尝试插入完整字段
          await connection.execute(
            `INSERT INTO messages (id, user_id, topic_id, role, content, message_type, status, timestamp, model_responses, selected_model_id, thinking_info)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               content = VALUES(content), 
               status = VALUES(status),
               model_responses = VALUES(model_responses),
               selected_model_id = VALUES(selected_model_id),
               thinking_info = VALUES(thinking_info)`,
            [
              message.id,
              message.userId,
              message.topicId || null,
              message.role,
              message.content,
              message.messageType || 'normal',
              message.status || 'sent',
              message.timestamp,
              message.modelResponses ? JSON.stringify(message.modelResponses) : null,
              message.selectedModelId || null,
              message.thinkingInfo ? JSON.stringify(message.thinkingInfo) : null
            ]
          )
          successCount++
        } catch (error: any) {
          // 如果字段不存在，回退到基本字段
          if (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054) {
            try {
              await connection.execute(
                `INSERT INTO messages (id, user_id, topic_id, role, content, message_type, status, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
                  message.timestamp
                ]
              )
              successCount++
            } catch (fallbackError) {
              failedCount++
              errors.push(`消息 ${message.id}: ${fallbackError instanceof Error ? fallbackError.message : '未知错误'}`)
            }
          } else {
            failedCount++
            errors.push(`消息 ${message.id}: ${error.message}`)
          }
        }
      }
    }

    await connection.commit()

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      errors: errors.slice(0, 20), // 返回前20个错误
      totalErrors: errors.length
    })

  } catch (error: any) {
    await connection.rollback()
    console.error('Bulk import error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  } finally {
    connection.release()
  }
}

