import { NextRequest, NextResponse } from 'next/server'
import { saveMessageToSupabase, getUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// POST - 迁移数据到Supabase（支持分批上传）
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || getUserId()
    
    // 处理大文件的请求体
    let messages = []
    let topics = []
    
    try {
      const body = await request.json()
      messages = body.messages || []
      topics = body.topics || []
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'JSON解析失败',
          details: parseError instanceof Error ? parseError.message : '数据格式错误'
        },
        { status: 400 }
      )
    }
    
    let messageCount = 0
    let topicCount = 0
    const errors: string[] = []
    
    // 迁移话题（批量操作）
    if (topics && Array.isArray(topics) && topics.length > 0) {
      console.log(`开始迁移 ${topics.length} 个话题`)
      
      // 批量插入话题（每次50个）
      const batchSize = 50
      for (let i = 0; i < topics.length; i += batchSize) {
        const batch = topics.slice(i, i + batchSize)
        try {
          const topicsToInsert = batch.map(topic => ({
            id: topic.id,
            user_id: userId,
            title: topic.title || topic.name || '未命名话题',
            agent_id: topic.agentId,
            created_at: topic.createdAt,
            updated_at: topic.updatedAt
          }))
          
          const { error } = await supabase
            .from('topics')
            .upsert(topicsToInsert)
          
          if (error) {
            console.error('批量迁移话题失败:', error)
            errors.push(`话题批次 ${i}-${i+batch.length}: ${error.message}`)
          } else {
            topicCount += batch.length
          }
        } catch (err) {
          console.error('批量迁移话题异常:', err)
          errors.push(`话题批次 ${i}-${i+batch.length}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }
    }
    
    // 迁移消息（批量操作）
    if (messages && Array.isArray(messages) && messages.length > 0) {
      console.log(`开始迁移 ${messages.length} 条消息`)
      
      // 批量插入消息（每次100条）
      const batchSize = 100
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        try {
          const messagesToInsert = batch.map(msg => ({
            id: msg.id,
            user_id: userId,
            topic_id: msg.topicId || null,
            role: msg.role,
            content: msg.content || '',
            message_type: msg.messageType || 'normal',
            status: msg.status || 'sent',
            timestamp: new Date(msg.timestamp),
            model_responses: msg.modelResponses || null,
            selected_model_id: msg.selectedModelId || null,
            thinking_info: msg.thinkingInfo || null
          }))
          
          const { error } = await supabase
            .from('messages')
            .upsert(messagesToInsert)
          
          if (error) {
            console.error('批量迁移消息失败:', error)
            errors.push(`消息批次 ${i}-${i+batch.length}: ${error.message}`)
          } else {
            messageCount += batch.length
          }
        } catch (err) {
          console.error('批量迁移消息异常:', err)
          errors.push(`消息批次 ${i}-${i+batch.length}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      migrated: {
        messages: messageCount,
        topics: topicCount
      },
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('迁移失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '迁移失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

