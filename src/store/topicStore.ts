import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TopicState, Topic } from '@/types/agent'

export const useTopicStore = create<TopicState>()(
  persist(
    (set, get) => ({
      topics: [],
      currentTopicId: null,
      
      addTopic: (topic) => {
        const newTopic: Topic = {
          ...topic,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `topic_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set((state) => ({
          topics: [...state.topics, newTopic],
        }))
        return newTopic.id
      },
      
      updateTopic: (id, updates) => {
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === id 
              ? { ...topic, ...updates, updatedAt: new Date() }
              : topic
          ),
        }))
      },
      
      deleteTopic: (id) => {
        set((state) => ({
          topics: state.topics.filter((topic) => topic.id !== id),
          currentTopicId: state.currentTopicId === id ? null : state.currentTopicId,
        }))
      },
      
      setCurrentTopic: (id) => set({ currentTopicId: id || null }),
      
      getTopicsByAgent: (agentId) => {
        const state = get()
        return state.topics.filter((topic) => topic.agentId === agentId)
      },

      importTopics: (topics) => {
        const importedTopics = topics.map((topic: any) => ({
          ...topic,
          createdAt: typeof topic.createdAt === 'string' ? new Date(topic.createdAt) : topic.createdAt,
          updatedAt: typeof topic.updatedAt === 'string' ? new Date(topic.updatedAt) : topic.updatedAt,
        }))
        set({ topics: importedTopics })
      },

      reorderTopics: (agentId, oldIndex, newIndex) => {
        set((state) => {
          // 获取当前智能体的所有话题
          const agentTopics = state.topics.filter(topic => topic.agentId === agentId)
          const otherTopics = state.topics.filter(topic => topic.agentId !== agentId)
          
          // 对当前智能体的话题进行重排序
          const reorderedAgentTopics = [...agentTopics]
          const [movedTopic] = reorderedAgentTopics.splice(oldIndex, 1)
          if (movedTopic) {
            reorderedAgentTopics.splice(newIndex, 0, movedTopic)
          }
          
          // 找到第一个当前智能体话题在原数组中的位置
          const firstAgentTopicIndex = state.topics.findIndex(topic => topic.agentId === agentId)
          
          // 重建完整的话题数组，保持其他智能体话题的位置
          const newTopics = [...state.topics]
          
          // 移除所有当前智能体的话题
          for (let i = newTopics.length - 1; i >= 0; i--) {
            const topic = newTopics[i]
            if (topic && topic.agentId === agentId) {
              newTopics.splice(i, 1)
            }
          }
          
          // 在原位置插入重排序后的话题
          newTopics.splice(firstAgentTopicIndex >= 0 ? firstAgentTopicIndex : newTopics.length, 0, ...reorderedAgentTopics)
          
          return { topics: newTopics }
        })
      },
    }),
    {
      name: 'topic-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.topics = state.topics.map(topic => ({
            ...topic,
            createdAt: new Date(topic.createdAt),
            updatedAt: new Date(topic.updatedAt),
          }))
        }
      }
    }
  )
)