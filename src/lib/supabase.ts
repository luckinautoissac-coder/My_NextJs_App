import { createClient } from '@supabase/supabase-js'

// Supabase客户端（客户端使用）
// 在构建时如果环境变量不存在，使用占位符
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

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

// 检查Supabase是否配置
export function isSupabaseConfigured(): boolean {
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key'
}

// 保存消息到Supabase
export async function saveMessageToSupabase(message: any) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase未配置，跳过保存')
    return null
  }

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

// 从Supabase获取消息（支持大量数据）
export async function getMessagesFromSupabase(userId?: string, topicId?: string) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase未配置，返回空数组')
    return []
  }

  // 分页获取所有消息（避免1000条限制）
  let allMessages: any[] = []
  let page = 0
  const pageSize = 1000
  
  while (true) {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId || getUserId())
      .order('timestamp', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (topicId) {
      query = query.eq('topic_id', topicId)
    }

    const { data, error } = await query

    if (error) {
      console.error('从Supabase获取消息失败:', error)
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    allMessages = allMessages.concat(data)
    
    // 如果返回的数据少于pageSize，说明已经是最后一页
    if (data.length < pageSize) {
      break
    }
    
    page++
  }
  
  console.log(`📊 [Supabase] 共获取 ${allMessages.length} 条消息（分${page + 1}页）`)

  return allMessages
}

// 更新消息
export async function updateMessageInSupabase(id: string, updates: any) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase未配置，跳过更新')
    return
  }

  // 转换字段名：驼峰 → 下划线
  const mappedUpdates: any = {}
  
  for (const key in updates) {
    switch (key) {
      case 'messageType':
        mappedUpdates.message_type = updates[key]
        break
      case 'selectedModelId':
        mappedUpdates.selected_model_id = updates[key]
        break
      case 'modelResponses':
        mappedUpdates.model_responses = updates[key]
        break
      case 'thinkingInfo':
        mappedUpdates.thinking_info = updates[key]
        break
      case 'userId':
        mappedUpdates.user_id = updates[key]
        break
      case 'topicId':
        mappedUpdates.topic_id = updates[key]
        break
      default:
        // 其他字段保持不变（如 role, content, status, timestamp 等）
        mappedUpdates[key] = updates[key]
    }
  }

  const { error } = await supabase
    .from('messages')
    .update(mappedUpdates)
    .eq('id', id)
    .eq('user_id', getUserId())

  if (error) {
    console.error('更新消息失败:', error)
    throw error
  }
}

// 删除消息
export async function deleteMessageFromSupabase(id: string) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase未配置，跳过删除')
    return
  }

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

