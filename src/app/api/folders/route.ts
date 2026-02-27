import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 获取文件夹列表
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('agent_id')
      .order('order')

    if (error) {
      console.error('❌ [Folders API] 获取文件夹失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('❌ [Folders API] 异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// POST - 创建或更新文件夹
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const body = await request.json()
    const { id, name, agent_id, is_expanded, order, created_at, updated_at } = body

    // 数据验证
    if (!id || !name || !agent_id) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    const folderData = {
      id,
      user_id: userId,
      name,
      agent_id,
      is_expanded: is_expanded ?? true,
      order: order ?? 0,
      created_at: created_at || new Date().toISOString(),
      updated_at: updated_at || new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('folders')
      .upsert(folderData)
      .select()

    if (error) {
      console.error('❌ [Folders API] 保存文件夹失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [Folders API] 文件夹已保存:', id)
    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('❌ [Folders API] 异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// PATCH - 更新文件夹
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: '缺少文件夹ID' }, { status: 400 })
    }

    // 更新时间戳
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('❌ [Folders API] 更新文件夹失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [Folders API] 文件夹已更新:', id)
    return NextResponse.json(data?.[0] || {})
  } catch (error) {
    console.error('❌ [Folders API] 异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// DELETE - 删除文件夹
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少文件夹ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('❌ [Folders API] 删除文件夹失败:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [Folders API] 文件夹已删除:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ [Folders API] 异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

