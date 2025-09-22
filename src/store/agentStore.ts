import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AgentState, Agent } from '@/types/agent'
import { getAvailableAgents } from '@/lib/api'

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [],
      currentAgentId: null,
      isLoading: false,
      
      loadAgents: async () => {
        set({ isLoading: true })
        try {
          const agents = await getAvailableAgents()
          set({ 
            agents,
            currentAgentId: agents.length > 0 ? agents[0].id : null,
            isLoading: false 
          })
        } catch (error) {
          console.error('加载智能体失败:', error)
          set({ isLoading: false })
        }
      },
      
      setCurrentAgent: (id) => set({ currentAgentId: id }),
      
      reorderAgents: (oldIndex, newIndex) => {
        set((state) => {
          const newAgents = [...state.agents]
          const [removed] = newAgents.splice(oldIndex, 1)
          if (removed) {
            newAgents.splice(newIndex, 0, removed)
          }
          return { agents: newAgents }
        })
      },
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({ 
        currentAgentId: state.currentAgentId 
        // 不持久化 agents，每次从服务端获取
      }),
    }
  )
)