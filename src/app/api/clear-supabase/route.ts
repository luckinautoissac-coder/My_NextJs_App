import { NextRequest, NextResponse } from 'next/server'
import { supabase, getUserId } from '@/lib/supabase'

// POST - 清空当前用户的Supabase数据
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || getUserId()
    
    // 删除所有消息
    const { error: messagesError, count: messagesCount } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: false })
    
    if (messagesError) {
      console.error('删除消息失败:', messagesError)
    }
    
    // 删除所有话题
    const { error: topicsError, count: topicsCount } = await supabase
      .from('topics')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: false })
    
    if (topicsError) {
      console.error('删除话题失败:', topicsError)
    }
    
    return NextResponse.json({
      success: true,
      deleted: {
        messages: messagesCount || 0,
        topics: topicsCount || 0
      }
    })
  } catch (error) {
    console.error('清空数据失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '清空数据失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

