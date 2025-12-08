export interface ModelResponse {
  modelId: string
  modelName: string
  content: string
  status: 'sending' | 'sent' | 'error'
  timestamp: Date
}

export interface Message {
  id: string
  userId?: string // 用户ID，用于云端存储
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  status?: 'sending' | 'sent' | 'error'
  topicId?: string
  // 对于AI消息，支持多模型回复
  modelResponses?: ModelResponse[]
  selectedModelId?: string // 当前显示的模型回复
  // 消息类型，用于区分普通消息和系统分隔线
  messageType?: 'normal' | 'context-separator' | 'thinking'
  // 思考相关信息
  thinkingInfo?: {
    startTime: Date
    duration: number
    phase: string
    modelName: string
  }
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  loadingTopics: Record<string, boolean> // 每个话题的加载状态
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean, topicId?: string) => void // 添加可选的 topicId 参数
  isTopicLoading: (topicId?: string) => boolean // 新增：检查特定话题是否正在加载
  clearChat: () => void
  getMessagesByTopic: (topicId: string) => Message[]
  clearTopicMessages: (topicId: string) => void
  importMessages: (messages: any[]) => void
  deleteMessage: (id: string) => void
  addModelResponse: (messageId: string, modelResponse: Omit<ModelResponse, 'timestamp'>) => void
  updateModelResponse: (messageId: string, modelId: string, updates: Partial<ModelResponse>) => void
  setSelectedModel: (messageId: string, modelId: string) => void
}

export interface ChatResponse {
  response: string
  error?: string
}