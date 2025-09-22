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
          const agentTopics = state.topics.filter(topic => topic.agentId === agentId)
          const otherTopics = state.topics.filter(topic => topic.agentId !== agentId)
          
          const newAgentTopics = [...agentTopics]
          const [removed] = newAgentTopics.splice(oldIndex, 1)
          if (removed) {
            newAgentTopics.splice(newIndex, 0, removed)
          }
          
          return { topics: [...otherTopics, ...newAgentTopics] }
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