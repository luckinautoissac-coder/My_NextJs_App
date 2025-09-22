import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { APISettingsState } from '@/types/models'
import { ALL_MODELS } from '@/data/models'

export const useAPISettingsStore = create<APISettingsState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      baseUrl: 'https://aihubmix.com/v1',
      selectedModel: 'gpt-4o-mini',
      addedModels: ['gpt-4o-mini'], // 默认添加GPT-4o Mini
      isLoading: false,
      
      updateSettings: (settings) => {
        set((state) => ({
          ...state,
          ...settings
        }))
      },
      
      addModel: (modelId) => {
        set((state) => ({
          addedModels: [...state.addedModels, modelId]
        }))
      },
      
      removeModel: (modelId) => {
        set((state) => ({
          addedModels: state.addedModels.filter(id => id !== modelId),
          // 如果删除的是当前选中的模型，切换到第一个可用模型
          selectedModel: state.selectedModel === modelId 
            ? state.addedModels.find(id => id !== modelId) || 'gpt-4o-mini'
            : state.selectedModel
        }))
      },
      
      toggleModel: (modelId) => {
        const state = get()
        if (state.addedModels.includes(modelId)) {
          state.removeModel(modelId)
        } else {
          state.addModel(modelId)
        }
      },
      
      loadSettings: () => {
        // 从持久化存储中加载设置
        // Zustand persist 会自动处理
      },

      importSettings: (settings) => {
        set((state) => ({
          ...state,
          baseUrl: settings.baseUrl || state.baseUrl,
          selectedModel: settings.selectedModel || state.selectedModel,
          addedModels: settings.addedModels || state.addedModels,
          // 注意：不导入 apiKey，保护用户隐私
        }))
      }
    }),
    {
      name: 'api-settings-store',
      partialize: (state) => ({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        selectedModel: state.selectedModel,
        addedModels: state.addedModels
      })
    }
  )
)

// 模型管理对话框状态
export const useModelManagementStore = create<{
  isOpen: boolean
  searchQuery: string
  selectedCategory: string
  setIsOpen: (isOpen: boolean) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: string) => void
}>((set) => ({
  isOpen: false,
  searchQuery: '',
  selectedCategory: 'all',
  
  setIsOpen: (isOpen) => set({ isOpen }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category })
}))