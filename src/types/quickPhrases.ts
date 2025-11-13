export interface QuickPhrase {
  id: string
  name: string
  content: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

export interface QuickPhrasesState {
  phrases: QuickPhrase[]
  addPhrase: (phrase: Omit<QuickPhrase, 'id' | 'createdAt' | 'updatedAt'>) => string
  updatePhrase: (id: string, updates: Partial<QuickPhrase>) => void
  deletePhrase: (id: string) => void
  getPhrasesByCategory: (category?: string) => QuickPhrase[]
  reorderPhrases: (oldIndex: number, newIndex: number) => void
}