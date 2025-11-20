import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatState, Message } from '@/types/chat'

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      loadingTopics: {}, // 新增：每个话题的加载状态
      
      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `msg_${Date.now()}_${Math.random()}`,
          timestamp: new Date(),
        }
        set((state) => ({
          messages: [...state.messages, newMessage],
        }))
        return newMessage.id
      },
      
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }))
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
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== id),
        }))
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
      name: 'chat-store',
      partialize: (state) => ({ 
        messages: state.messages
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.messages = state.messages.map(message => ({
            ...message,
            timestamp: new Date(message.timestamp),
            // 恢复 thinkingInfo 中的 startTime
            ...(message.thinkingInfo && {
              thinkingInfo: {
                ...message.thinkingInfo,
                startTime: new Date(message.thinkingInfo.startTime)
              }
            }),
            // 恢复 modelResponses 中的 timestamp
            ...(message.modelResponses && {
              modelResponses: message.modelResponses.map(response => ({
                ...response,
                timestamp: response.timestamp ? new Date(response.timestamp) : new Date()
              }))
            })
          }))
        }
      }
    }
  )
)