// 模型分类
export type ModelCategory = 'all' | 'reasoning' | 'vision' | 'online' | 'free' | 'embedding' | 'rerank' | 'tools'

// 模型公司
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'alibaba' | 'deepseek' | 'xai' | 'minimax' | 'perplexity' | 'cohere' | 'zhipu'

// 单个模型接口
export interface AIModel {
  id: string
  name: string
  provider: ModelProvider
  category: ModelCategory[]
  description: string
  contextLength: number
  maxTokens?: number // 最大输出Token数
  isFree: boolean
  isAdded: boolean
}

// API设置状态
export interface APISettings {
  apiKey: string
  baseUrl: string
  selectedModel: string
  addedModels: string[]
}

// API设置状态管理
export interface APISettingsState extends APISettings {
  isLoading: boolean
  updateSettings: (settings: Partial<APISettings>) => void
  addModel: (modelId: string) => void
  removeModel: (modelId: string) => void
  toggleModel: (modelId: string) => void
  loadSettings: () => void
  importSettings: (settings: any) => void
}

// 模型管理对话框状态
export interface ModelManagementState {
  isOpen: boolean
  searchQuery: string
  selectedCategory: ModelCategory
  filteredModels: AIModel[]
  setIsOpen: (isOpen: boolean) => void
  setSearchQuery: (query: string) => void
  setSelectedCategory: (category: ModelCategory) => void
  filterModels: (models: AIModel[]) => void
}