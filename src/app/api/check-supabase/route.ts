import { NextRequest, NextResponse } from 'next/server'
import { supabase, getUserId } from '@/lib/supabase'

// GET - 检查Supabase中的数据总量
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || getUserId()
    
    // 查询消息总数
    const { count: messageCount, error: messageError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (messageError) {
      throw messageError
    }
    
    // 查询话题总数
    const { count: topicCount, error: topicError } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (topicError) {
      throw topicError
    }
    
    // 查询每个话题的消息数
    const { data: topicData } = await supabase
      .from('topics')
      .select('id, title, agent_id')
      .eq('user_id', userId)
    
    const topicStats = []
    if (topicData) {
      for (const topic of topicData) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('topic_id', topic.id)
        
        topicStats.push({
          id: topic.id,
          title: topic.title,
          agentId: topic.agent_id,
          messageCount: count || 0
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      total: {
        messages: messageCount || 0,
        topics: topicCount || 0
      },
      topicStats
    })
  } catch (error) {
    console.error('检查Supabase数据失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '检查失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

