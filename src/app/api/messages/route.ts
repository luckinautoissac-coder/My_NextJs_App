import { NextRequest, NextResponse } from 'next/server'
import { 
  saveMessageToSupabase, 
  getMessagesFromSupabase, 
  updateMessageInSupabase, 
  deleteMessageFromSupabase 
} from '@/lib/supabase'

// 获取用户ID（从header或生成）
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'anonymous'
}

// GET - 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const topicId = request.nextUrl.searchParams.get('topicId')
    
    const messages = await getMessagesFromSupabase(userId, topicId || undefined)
    
    // 直接返回消息数组（兼容测试页面）
    return NextResponse.json(messages)
  } catch (error) {
    console.error('获取消息失败:', error)
    return NextResponse.json(
      { error: '获取消息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST - 保存新消息
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const message = await request.json()
    
    await saveMessageToSupabase({
      ...message,
      userId,
      timestamp: new Date(message.timestamp)
    })
    
    return NextResponse.json({ 
      success: true 
    })
  } catch (error) {
    console.error('保存消息失败:', error)
    return NextResponse.json(
      { success: false, error: '保存消息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PATCH - 更新消息
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少消息ID' },
        { status: 400 }
      )
    }
    
    await updateMessageInSupabase(id, updates)
    
    return NextResponse.json({ 
      success: true 
    })
  } catch (error) {
    console.error('更新消息失败:', error)
    return NextResponse.json(
      { success: false, error: '更新消息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// DELETE - 删除消息
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const id = request.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少消息ID' },
        { status: 400 }
      )
    }
    
    await deleteMessageFromSupabase(id)
    
    return NextResponse.json({ 
      success: true 
    })
  } catch (error) {
    console.error('删除消息失败:', error)
    return NextResponse.json(
      { success: false, error: '删除消息失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

