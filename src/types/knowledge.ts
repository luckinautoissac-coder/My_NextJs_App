// 知识库相关类型定义

export type DocumentType = 'file' | 'note' | 'directory' | 'url' | 'website'

export type DocumentStatus = 'pending' | 'embedding' | 'completed' | 'failed'

export interface Document {
  id: string
  name: string
  type: DocumentType
  status: DocumentStatus
  size?: number // 文件大小(bytes)
  uploadedAt: Date
  content?: string // 文档内容
  embedding?: number[] // 嵌入向量
}

export interface KnowledgeBase {
  id: string
  name: string
  embeddingModel: string // 嵌入模型ID
  documents: Document[]
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeBaseStore {
  // 状态
  knowledgeBases: KnowledgeBase[]
  selectedKnowledgeBaseIds: string[] // 当前对话选中的知识库IDs
  
  // 知识库操作
  addKnowledgeBase: (name: string, embeddingModel: string) => string
  deleteKnowledgeBase: (id: string) => void
  renameKnowledgeBase: (id: string, newName: string) => void
  updateKnowledgeBase: (id: string, updates: Partial<KnowledgeBase>) => void
  getKnowledgeBase: (id: string) => KnowledgeBase | undefined
  
  // 文档操作
  addDocument: (knowledgeBaseId: string, document: Omit<Document, 'id' | 'uploadedAt'>) => void
  deleteDocument: (knowledgeBaseId: string, documentId: string) => void
  updateDocument: (knowledgeBaseId: string, documentId: string, updates: Partial<Document>) => void
  reuploadDocument: (knowledgeBaseId: string, documentId: string, newContent: string) => void
  
  // 选择操作
  selectKnowledgeBase: (id: string) => void
  deselectKnowledgeBase: (id: string) => void
  clearSelectedKnowledgeBases: () => void
  
  // 重置
  resetStore: () => void
}
