import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatState, Message } from '@/types/chat'

// 辅助函数：获取用户ID
function getUserId(): string {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('__user_id__')
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('__user_id__', userId)
    }
    return userId
  }
  return 'server'
}

// API调用函数
async function apiCall(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
      ...options?.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`API请求失败: ${response.statusText}`)
  }
  
  return response.json()
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      loadingTopics: {},
      
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random()}`,
          timestamp: new Date(),
        }
        
        // 立即更新本地状态
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
        
        // 异步保存到VPS
        apiCall('/api/messages', {
          method: 'POST',
          body: JSON.stringify(newMessage)
        }).catch(error => {
          console.error('保存消息到VPS失败:', error)
        })
        
        return newMessage.id
      },
      
      updateMessage: (id, updates) => {
        // 立即更新本地状态
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }))
        
        // 异步更新VPS
        apiCall('/api/messages', {
          method: 'PATCH',
          body: JSON.stringify({ id, ...updates })
        }).catch(error => {
          console.error('更新消息到VPS失败:', error)
        })
      },
      
      setLoading: (loading, topicId) => {
        if (topicId) {
          // 为特定话题设置加载状态
          set((state) => ({
            loadingTopics: {
              ...state.loadingTopics,
              [topicId]: loading
            }
          }))
        } else {
          // 向后兼容：如果没有指定话题，使用全局加载状态
          set({ isLoading: loading })
        }
      },
      
      isTopicLoading: (topicId) => {
        const state = get()
        return topicId ? (state.loadingTopics[topicId] || false) : state.isLoading
      },
      
      clearChat: () => set({ messages: [] }),
      
      getMessagesByTopic: (topicId) => {
        const state = get()
        return state.messages.filter((msg) => msg.topicId === topicId)
      },
      
      clearTopicMessages: (topicId) => {
        set((state) => ({
          messages: state.messages.filter((msg) => msg.topicId !== topicId),
        }))
      },

      importMessages: (messages) => {
        const importedMessages = messages.map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
        }))
        set({ messages: importedMessages })
      },

      deleteMessage: (id) => {
        // 立即更新本地状态
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }))
        
        // 异步删除VPS数据
        apiCall(`/api/messages?id=${id}`, {
          method: 'DELETE'
        }).catch(error => {
          console.error('删除VPS消息失败:', error)
        })
      },

      addModelResponse: (messageId, modelResponse) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  modelResponses: [
                    ...(msg.modelResponses || []),
                    { ...modelResponse, timestamp: new Date() }
                  ],
                  selectedModelId: msg.selectedModelId || modelResponse.modelId
                }
              : msg
          ),
        }))
      },

      updateModelResponse: (messageId, modelId, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  modelResponses: msg.modelResponses?.map((response) =>
                    response.modelId === modelId
                      ? { ...response, ...updates }
                      : response
                  ) || []
                }
              : msg
          ),
        }))
      },

      setSelectedModel: (messageId, modelId) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, selectedModelId: modelId }
              : msg
          ),
        }))
      },
    }),
    {
      name: 'chat-cache', // 改名以区分
      partialize: (state) => ({ 
        // 只缓存最近20条消息作为快速访问缓存
        messages: state.messages.slice(-20)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.messages = state.messages.map(message => {
            const restoredMessage = {
              ...message,
              timestamp: new Date(message.timestamp),
              ...(message.thinkingInfo && {
                thinkingInfo: {
                  ...message.thinkingInfo,
                  startTime: new Date(message.thinkingInfo.startTime)
                }
              }),
              ...(message.modelResponses && {
                modelResponses: message.modelResponses.map(response => ({
                  ...response,
                  timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
                }))
              })
            }

            // 清理异常的思考消息
            if (restoredMessage.messageType === 'thinking' && restoredMessage.thinkingInfo?.startTime) {
              const elapsed = (new Date().getTime() - restoredMessage.thinkingInfo.startTime.getTime()) / 1000
              if (elapsed > 300) {
                console.warn('清理异常的思考消息:', message.id)
                return {
                  ...restoredMessage,
                  content: '❌ 消息加载失败（数据异常）',
                  status: 'error' as const,
                  messageType: 'normal' as const,
                  thinkingInfo: undefined
                }
              }
            }

            return restoredMessage
          })
          
          // 【临时禁用VPS加载】完全使用localStorage数据
          const localMessageCount = state.messages.length
          console.log('✅ localStorage中有', localMessageCount, '条消息（使用本地数据，暂不从VPS加载）')
          
          // 注释掉VPS加载逻辑，等问题解决后再启用
          /*
          apiCall('/api/messages')
            .then(data => {
              // API直接返回消息数组
              const messagesArray = Array.isArray(data) ? data : data.messages || []
              console.log('VPS中有', messagesArray.length, '条消息')
              
              // 🔥 关键修复：优先使用数据更多的来源
              if (messagesArray.length === 0 && localMessageCount > 0) {
                console.log('✅ VPS为空，保留localStorage的', localMessageCount, '条消息')
                return // 不覆盖本地数据
              }
              
              if (messagesArray.length > 0) {
                const messages = messagesArray.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                  // 恢复Date对象
                  ...(msg.thinkingInfo && {
                    thinkingInfo: {
                      ...msg.thinkingInfo,
                      startTime: new Date(msg.thinkingInfo.startTime)
                    }
                  }),
                  // 解析JSON字段
                  ...(typeof msg.model_responses === 'string' && {
                    modelResponses: JSON.parse(msg.model_responses)
                  }),
                  ...(msg.model_responses && typeof msg.model_responses === 'object' && {
                    modelResponses: msg.model_responses
                  }),
                  ...(typeof msg.thinking_info === 'string' && {
                    thinkingInfo: JSON.parse(msg.thinking_info)
                  }),
                  ...(msg.thinking_info && typeof msg.thinking_info === 'object' && {
                    thinkingInfo: msg.thinking_info
                  }),
                  // 字段名映射：数据库snake_case转为前端camelCase
                  selectedModelId: msg.selected_model_id || msg.selectedModelId
                }))
                console.log('✅ 使用VPS的', messages.length, '条消息（比本地多）')
                // 替换为VPS数据
                useChatStore.setState({ messages })
              }
            })
            .catch(error => {
              console.error('从VPS加载消息失败:', error, '- 保留localStorage数据')
            })
          */
        }
      }
    }
  )
)