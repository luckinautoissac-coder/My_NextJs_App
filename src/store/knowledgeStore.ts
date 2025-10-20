import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KnowledgeBaseStore, KnowledgeBase, Document } from '@/types/knowledge'

export const useKnowledgeStore = create<KnowledgeBaseStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      knowledgeBases: [],
      selectedKnowledgeBaseIds: [],

      // 知识库操作
      addKnowledgeBase: (name: string, embeddingModel: string) => {
        const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newKnowledgeBase: KnowledgeBase = {
          id,
          name,
          embeddingModel,
          documents: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        set((state) => ({
          knowledgeBases: [...state.knowledgeBases, newKnowledgeBase]
        }))
        
        return id
      },

      deleteKnowledgeBase: (id: string) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
          selectedKnowledgeBaseIds: state.selectedKnowledgeBaseIds.filter(kbId => kbId !== id)
        }))
      },

      renameKnowledgeBase: (id: string, newName: string) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === id
              ? { ...kb, name: newName, updatedAt: new Date() }
              : kb
          )
        }))
      },

      updateKnowledgeBase: (id: string, updates: Partial<KnowledgeBase>) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === id
              ? { ...kb, ...updates, updatedAt: new Date() }
              : kb
          )
        }))
      },

      getKnowledgeBase: (id: string) => {
        return get().knowledgeBases.find(kb => kb.id === id)
      },

      // 文档操作
      addDocument: (knowledgeBaseId: string, document: Omit<Document, 'id' | 'uploadedAt'>) => {
        const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const newDocument: Document = {
          ...document,
          id: docId,
          uploadedAt: new Date()
        }

        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === knowledgeBaseId
              ? {
                  ...kb,
                  documents: [...kb.documents, newDocument],
                  updatedAt: new Date()
                }
              : kb
          )
        }))
      },

      deleteDocument: (knowledgeBaseId: string, documentId: string) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === knowledgeBaseId
              ? {
                  ...kb,
                  documents: kb.documents.filter(doc => doc.id !== documentId),
                  updatedAt: new Date()
                }
              : kb
          )
        }))
      },

      updateDocument: (knowledgeBaseId: string, documentId: string, updates: Partial<Document>) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === knowledgeBaseId
              ? {
                  ...kb,
                  documents: kb.documents.map(doc =>
                    doc.id === documentId ? { ...doc, ...updates } : doc
                  ),
                  updatedAt: new Date()
                }
              : kb
          )
        }))
      },

      reuploadDocument: (knowledgeBaseId: string, documentId: string, newContent: string) => {
        set((state) => ({
          knowledgeBases: state.knowledgeBases.map(kb =>
            kb.id === knowledgeBaseId
              ? {
                  ...kb,
                  documents: kb.documents.map(doc =>
                    doc.id === documentId
                      ? {
                          ...doc,
                          content: newContent,
                          status: 'pending' as const,
                          uploadedAt: new Date()
                        }
                      : doc
                  ),
                  updatedAt: new Date()
                }
              : kb
          )
        }))
      },

      // 选择操作
      selectKnowledgeBase: (id: string) => {
        set((state) => {
          if (!state.selectedKnowledgeBaseIds.includes(id)) {
            return {
              selectedKnowledgeBaseIds: [...state.selectedKnowledgeBaseIds, id]
            }
          }
          return state
        })
      },

      deselectKnowledgeBase: (id: string) => {
        set((state) => ({
          selectedKnowledgeBaseIds: state.selectedKnowledgeBaseIds.filter(kbId => kbId !== id)
        }))
      },

      clearSelectedKnowledgeBases: () => {
        set({ selectedKnowledgeBaseIds: [] })
      },

      // 重置
      resetStore: () => {
        set({
          knowledgeBases: [],
          selectedKnowledgeBaseIds: []
        })
      }
    }),
    {
      name: 'knowledge-store',
      version: 1
    }
  )
)
