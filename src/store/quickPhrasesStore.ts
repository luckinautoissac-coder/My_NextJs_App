import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuickPhrasesState, QuickPhrase } from '@/types/quickPhrases'

export const useQuickPhrasesStore = create<QuickPhrasesState>()(
  persist(
    (set, get) => ({
      phrases: [
        // 默认快捷短语
        {
          id: 'default-1',
          name: '翻译成英文',
          content: '请将以下内容翻译成英文：',
          category: '翻译',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'default-2',
          name: '代码解释',
          content: '请解释这段代码的功能和工作原理：',
          category: '编程',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'default-3',
          name: '总结要点',
          content: '请帮我总结以下内容的主要要点：',
          category: '总结',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],

      addPhrase: (phrase) => {
        const newPhrase: QuickPhrase = {
          ...phrase,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `phrase_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        set((state) => ({
          phrases: [...state.phrases, newPhrase]
        }))
        
        return newPhrase.id
      },

      updatePhrase: (id, updates) => {
        set((state) => ({
          phrases: state.phrases.map((phrase) =>
            phrase.id === id
              ? { ...phrase, ...updates, updatedAt: new Date() }
              : phrase
          )
        }))
      },

      deletePhrase: (id) => {
        set((state) => ({
          phrases: state.phrases.filter((phrase) => phrase.id !== id)
        }))
      },

      getPhrasesByCategory: (category) => {
        const state = get()
        if (!category) return state.phrases
        return state.phrases.filter((phrase) => phrase.category === category)
      },

      reorderPhrases: (oldIndex, newIndex) => {
        set((state) => {
          const newPhrases = [...state.phrases]
          const [removed] = newPhrases.splice(oldIndex, 1)
          if (removed) {
            newPhrases.splice(newIndex, 0, removed)
          }
          return { phrases: newPhrases }
        })
      }
    }),
    {
      name: 'quick-phrases-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.phrases = state.phrases.map(phrase => ({
            ...phrase,
            createdAt: new Date(phrase.createdAt),
            updatedAt: new Date(phrase.updatedAt),
          }))
        }
      }
    }
  )
)  )
)
