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
          
          // 从VPS加载完整消息列表
          apiCall('/api/messages')
            .then(data => {
              if (data.success && data.messages) {
                const messages = data.messages.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
                // 合并VPS数据和本地缓存
                useChatStore.setState({ messages })
              }
            })
            .catch(error => {
              console.error('从VPS加载消息失败:', error)
            })
        }
      }
    }
  )
)