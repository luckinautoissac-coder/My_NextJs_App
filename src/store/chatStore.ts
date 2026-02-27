import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatState, Message } from '@/types/chat'
import { 
  saveMessageToSupabase, 
  getMessagesFromSupabase, 
  updateMessageInSupabase, 
  deleteMessageFromSupabase,
  getUserId
} from '@/lib/supabase'

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
          userId: getUserId()
        }
        
        // 立即更新本地状态
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
        
        // 异步保存到Supabase
        saveMessageToSupabase(newMessage).catch(error => {
          console.error('保存消息到Supabase失败:', error)
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
        
        // 异步更新Supabase
        updateMessageInSupabase(id, updates).catch(error => {
          console.error('更新消息到Supabase失败:', error)
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
        
        // 异步删除Supabase数据
        deleteMessageFromSupabase(id).catch(error => {
          console.error('删除Supabase消息失败:', error)
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
      name: 'chat-storage',
      // 完整持久化所有消息到 localStorage
      partialize: (state) => ({ 
        messages: state.messages  // 保存所有消息
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
          
          // 从Supabase加载完整消息列表（仅在配置后）
          const localMessageCount = state.messages.length
          console.log('📦 [localStorage] 本地有', localMessageCount, '条消息')
          
          // 检查Supabase是否已配置
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
          
          if (!supabaseConfigured) {
            console.log('💾 [本地模式] Supabase 未配置，使用 localStorage 完整持久化')
            return
          }
          
          console.log('☁️ [云端模式] Supabase 已配置，尝试同步云端数据...')
          
          getMessagesFromSupabase()
            .then(data => {
              console.log('☁️ [Supabase] 云端返回', data.length, '条消息')
              
              if (data.length === 0 && localMessageCount > 0) {
                console.log('⚠️ [Supabase] 云端为空，保留 localStorage 数据')
                return
              }
              
              if (data.length > 0) {
                const messages = data.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                  userId: msg.user_id,
                  topicId: msg.topic_id,
                  messageType: msg.message_type,
                  selectedModelId: msg.selected_model_id,
                  modelResponses: msg.model_responses,
                  thinkingInfo: msg.thinking_info ? {
                    ...msg.thinking_info,
                    startTime: new Date(msg.thinking_info.startTime)
                  } : undefined
                }))
                
                console.log('✅ [Supabase] 使用云端的', messages.length, '条消息，同时备份到 localStorage')
                useChatStore.setState({ messages })
              }
            })
            .catch(error => {
              console.error('❌ [Supabase] 加载消息失败:', error)
              console.log('⚠️ [Supabase] 保留 localStorage 数据')
            })
        }
      }
    }
  )
)