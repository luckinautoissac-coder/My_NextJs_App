// 前端智能体接口（不包含系统提示）
export interface Agent {
  id: string
  name: string
  description: string
  avatar?: string
}

export interface Topic {
  id: string
  name: string
  agentId: string
  messages: string[] // message IDs
  createdAt: Date
  updatedAt: Date
}

export interface AgentState {
  agents: Agent[]
  currentAgentId: string | null
  isLoading: boolean
  loadAgents: () => Promise<void>
  setCurrentAgent: (id: string) => void
  reorderAgents: (oldIndex: number, newIndex: number) => void
}

export interface TopicState {
  topics: Topic[]
  currentTopicId: string | null
  addTopic: (topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTopic: (id: string, updates: Partial<Topic>) => void
  deleteTopic: (id: string) => void
  setCurrentTopic: (id: string) => void
  getTopicsByAgent: (agentId: string) => Topic[]
  importTopics: (topics: any[]) => void
  reorderTopics: (agentId: string, oldIndex: number, newIndex: number) => void
}