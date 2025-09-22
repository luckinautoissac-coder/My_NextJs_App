export interface ModelResponse {
  modelId: string
  modelName: string
  content: string
  status: 'sending' | 'sent' | 'error'
  timestamp: Date
}

export interface Message {
  id: string
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
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
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