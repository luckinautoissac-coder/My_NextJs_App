import { NextRequest, NextResponse } from 'next/server'
import { supabase, getUserId } from '@/lib/supabase'

// 获取用户ID（从header或localStorage生成的ID）
function getUserIdFromRequest(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'anonymous'
}

// GET - 获取话题列表
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) throw error
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('获取话题失败:', error)
    return NextResponse.json(
      { error: '获取话题失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST - 创建新话题
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const topic = await request.json()
    
    const { data, error } = await supabase
      .from('topics')
      .insert({
        id: topic.id,
        user_id: topic.user_id || userId,
        title: topic.title,
        agent_id: topic.agent_id,
        folder_id: topic.folder_id || null,
        created_at: topic.created_at,
        updated_at: topic.updated_at
      })
      .select()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('创建话题失败:', error)
    return NextResponse.json(
      { success: false, error: '创建话题失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PATCH - 更新话题
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少话题ID' },
        { status: 400 }
      )
    }
    
    const updateData: any = {}
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.agent_id !== undefined) updateData.agent_id = updates.agent_id
    if (updates.folder_id !== undefined) updateData.folder_id = updates.folder_id
    if (updates.updated_at !== undefined) updateData.updated_at = updates.updated_at
    
    const { error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新话题失败:', error)
    return NextResponse.json(
      { success: false, error: '更新话题失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// DELETE - 删除话题
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const id = request.nextUrl.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少话题ID' },
        { status: 400 }
      )
    }
    
    // 先删除该话题下的所有消息
    await supabase
      .from('messages')
      .delete()
      .eq('topic_id', id)
      .eq('user_id', userId)
    
    // 再删除话题
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除话题失败:', error)
    return NextResponse.json(
      { success: false, error: '删除话题失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

