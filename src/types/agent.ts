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
  folderId?: string // 所属文件夹ID
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  name: string
  agentId: string
  isExpanded: boolean // 是否展开
  order: number // 排序序号
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
  folders: Folder[]
  addTopic: (topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTopic: (id: string, updates: Partial<Topic>) => void
  deleteTopic: (id: string) => void
  setCurrentTopic: (id: string) => void
  getTopicsByAgent: (agentId: string) => Topic[]
  importTopics: (topics: any[]) => void
  reorderTopics: (agentId: string, oldIndex: number, newIndex: number) => void
  reorderTopicsInLocation: (agentId: string, folderId: string | null, oldIndex: number, newIndex: number) => void
  // 文件夹相关方法
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateFolder: (id: string, updates: Partial<Folder>) => void
  deleteFolder: (id: string) => void
  toggleFolder: (id: string) => void
  getFoldersByAgent: (agentId: string) => Folder[]
  moveTopicToFolder: (topicId: string, folderId: string | null) => void
  reorderFolders: (agentId: string, oldIndex: number, newIndex: number) => void
}