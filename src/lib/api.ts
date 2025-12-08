import type { ChatResponse } from '@/types/chat'

// 调用后端API，提示词在服务端保护
export async function sendMessage(
  message: string, 
  apiKey: string,
  agentId: string,
  model?: string,
  baseUrl?: string,
  thinkingChain?: any,
  conversationHistory?: any[]
): Promise<ChatResponse> {
  if (!apiKey.trim()) {
    throw new Error('API Key 不能为空')
  }

  if (!message.trim()) {
    throw new Error('消息内容不能为空')
  }

  if (!agentId.trim()) {
    throw new Error('智能体ID不能为空')
  }

  try {
    // 创建一个带超时的AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5分钟超时

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          agentId,
          apiKey,
          model,
          baseUrl,
          thinkingChain,
          conversationHistory
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '请求失败')
      }

      return {
        response: data.response
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时(5分钟),AI思考时间过长,请稍后重试')
      }
      throw error
    }
    
    // 网络错误处理
    throw new Error('网络连接异常，请检查网络后重试')
  }
}

// 获取可用的智能体列表（不包含提示词）
export async function getAvailableAgents() {
  try {
    const response = await fetch('/api/chat', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('获取智能体列表失败')
    }

    const data = await response.json()
    return data.agents

  } catch (error) {
    console.error('获取智能体列表失败:', error)
    return []
  }
}