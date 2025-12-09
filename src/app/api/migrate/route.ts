import { NextRequest, NextResponse } from 'next/server'
import { saveMessageToSupabase, getUserId } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

// POST - 迁移localStorage数据到Supabase
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || getUserId()
    const { messages, topics } = await request.json()
    
    let messageCount = 0
    let topicCount = 0
    const errors: string[] = []
    
    // 迁移话题
    if (topics && Array.isArray(topics)) {
      for (const topic of topics) {
        try {
          const { error } = await supabase
            .from('topics')
            .upsert({
              id: topic.id,
              user_id: userId,
              title: topic.title,
              agent_id: topic.agentId,
              created_at: topic.createdAt,
              updated_at: topic.updatedAt
            })
          
          if (error) {
            console.error('迁移话题失败:', topic.id, error)
            errors.push(`话题 ${topic.title}: ${error.message}`)
          } else {
            topicCount++
          }
        } catch (err) {
          console.error('迁移话题异常:', topic.id, err)
          errors.push(`话题 ${topic.title}: ${err instanceof Error ? err.message : '未知错误'}`)
        }
      }
    }
    
    // 迁移消息
    if (messages && Array.isArray(messages)) {
      for (const message of messages) {
        try {
          await saveMessageToSupabase({
            ...message,
            userId,
            timestamp: new Date(message.timestamp)
          })
          messageCount++
        } catch (err) {
          console.error('迁移消息失败:', message.id, err)
          errors.push(`消息 ${message.id.substring(0, 8)}: ${err instanceof Error ? err.message : '未知错误'}`)
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

