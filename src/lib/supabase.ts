import { createClient } from '@supabase/supabase-js'

// Supabase客户端（客户端使用）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

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
  return 'anonymous'
}

// 保存消息到Supabase
export async function saveMessageToSupabase(message: any) {
  const { data, error } = await supabase
    .from('messages')
    .upsert({
      id: message.id,
      user_id: message.userId || getUserId(),
      topic_id: message.topicId || null,
      role: message.role,
      content: message.content,
      message_type: message.messageType || 'normal',
      status: message.status || 'sent',
      timestamp: message.timestamp,
      model_responses: message.modelResponses || null,
      selected_model_id: message.selectedModelId || null,
      thinking_info: message.thinkingInfo || null
    })
    .select()

  if (error) {
    console.error('保存消息到Supabase失败:', error)
    throw error
  }

  return data
}

// 从Supabase获取消息
export async function getMessagesFromSupabase(userId?: string, topicId?: string) {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId || getUserId())
    .order('timestamp', { ascending: true })

  if (topicId) {
    query = query.eq('topic_id', topicId)
  }

  const { data, error } = await query

  if (error) {
    console.error('从Supabase获取消息失败:', error)
    throw error
  }

  return data || []
}

// 更新消息
export async function updateMessageInSupabase(id: string, updates: any) {
  const { error } = await supabase
    .from('messages')
    .update(updates)
    .eq('id', id)
    .eq('user_id', getUserId())

  if (error) {
    console.error('更新消息失败:', error)
    throw error
  }
}

// 删除消息
export async function deleteMessageFromSupabase(id: string) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id)
    .eq('user_id', getUserId())

  if (error) {
    console.error('删除消息失败:', error)
    throw error
  }
}

