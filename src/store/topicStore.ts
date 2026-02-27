import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TopicState, Topic, Folder } from '@/types/agent'
import { 
  getUserId, 
  isSupabaseConfigured,
  saveFolderToSupabase,
  getFoldersFromSupabase,
  updateFolderInSupabase,
  deleteFolderFromSupabase
} from '@/lib/supabase'

// ====== 安全的 localStorage 包装器 ======
// 防止 QuotaExceededError 导致整个应用崩溃
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch {
      console.warn('⚠️ localStorage 空间不足，topic 数据通过云端存储')
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch {}
  }
}

// 辅助函数：调用话题API
async function saveTopicToAPI(topic: Topic) {
  // 如果 Supabase 未配置，直接跳过（不显示错误）
  if (!isSupabaseConfigured()) {
    return
  }
  
  try {
    // 字段映射：驼峰命名 → 数据库下划线命名
    const mappedTopic = {
      id: topic.id,
      user_id: getUserId(),
      title: topic.name,  // name → title
      agent_id: topic.agentId,  // agentId → agent_id
      folder_id: topic.folderId || null,  // folderId → folder_id
      created_at: topic.createdAt,  // createdAt → created_at
      updated_at: topic.updatedAt   // updatedAt → updated_at
    }
    
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId()
      },
      body: JSON.stringify(mappedTopic)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [Topics API] 保存话题失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        topic: mappedTopic
      })
    }
  } catch (error) {
    console.error('❌ [Topics API] 网络错误:', error)
  }
}

async function updateTopicInAPI(id: string, updates: Partial<Topic>) {
  // 如果 Supabase 未配置，直接跳过（不显示错误）
  if (!isSupabaseConfigured()) {
    return
  }
  
  try {
    // 字段映射：驼峰命名 → 数据库下划线命名
    const mappedUpdates: any = { id, updated_at: new Date() }
    
    if (updates.name !== undefined) {
      mappedUpdates.title = updates.name  // name → title
    }
    if (updates.agentId !== undefined) {
      mappedUpdates.agent_id = updates.agentId  // agentId → agent_id
    }
    if (updates.folderId !== undefined) {
      mappedUpdates.folder_id = updates.folderId || null  // folderId → folder_id
    }
    
    const response = await fetch('/api/topics', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId()
      },
      body: JSON.stringify(mappedUpdates)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [Topics API] 更新话题失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
    }
  } catch (error) {
    console.error('❌ [Topics API] 网络错误:', error)
  }
}

async function deleteTopicFromAPI(id: string) {
  // 如果 Supabase 未配置，直接跳过（不显示错误）
  if (!isSupabaseConfigured()) {
    return
  }
  
  try {
    const response = await fetch(`/api/topics?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': getUserId()
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [Topics API] 删除话题失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
    }
  } catch (error) {
    console.error('❌ [Topics API] 网络错误:', error)
  }
}

export const useTopicStore = create<TopicState>()(
  persist(
    (set, get) => ({
      topics: [],
      currentTopicId: null,
      folders: [],
      
      addTopic: (topic) => {
        const newTopic: Topic = {
          ...topic,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `topic_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        // 立即更新本地状态
        set((state) => ({
          topics: [...state.topics, newTopic],
        }))
        
        // 异步保存到API
        saveTopicToAPI(newTopic).catch(console.error)
        
        return newTopic.id
      },
      
      updateTopic: (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        
        // 立即更新本地状态
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === id 
              ? { ...topic, ...updatedData }
              : topic
          ),
        }))
        
        // 异步更新API
        updateTopicInAPI(id, updatedData).catch(console.error)
      },
      
      deleteTopic: (id) => {
        // 立即更新本地状态
        set((state) => ({
          topics: state.topics.filter((topic) => topic.id !== id),
          currentTopicId: state.currentTopicId === id ? null : state.currentTopicId,
        }))
        
        // 异步删除API数据
        deleteTopicFromAPI(id).catch(console.error)
      },
      
      setCurrentTopic: (id) => set({ currentTopicId: id || null }),
      
      getTopicsByAgent: (agentId) => {
        const state = get()
        return state.topics.filter((topic) => topic.agentId === agentId)
      },

      importTopics: (topics) => {
        const importedTopics = topics.map((topic: any) => ({
          ...topic,
          createdAt: typeof topic.createdAt === 'string' ? new Date(topic.createdAt) : topic.createdAt,
          updatedAt: typeof topic.updatedAt === 'string' ? new Date(topic.updatedAt) : topic.updatedAt,
        }))
        set({ topics: importedTopics })
      },

      reorderTopics: (agentId, oldIndex, newIndex) => {
        set((state) => {
          // 获取当前智能体的所有话题
          const agentTopics = state.topics.filter(topic => topic.agentId === agentId)
          const otherTopics = state.topics.filter(topic => topic.agentId !== agentId)
          
          // 对当前智能体的话题进行重排序
          const reorderedAgentTopics = [...agentTopics]
          const [movedTopic] = reorderedAgentTopics.splice(oldIndex, 1)
          if (movedTopic) {
            reorderedAgentTopics.splice(newIndex, 0, movedTopic)
          }
          
          // 找到第一个当前智能体话题在原数组中的位置
          const firstAgentTopicIndex = state.topics.findIndex(topic => topic.agentId === agentId)
          
          // 重建完整的话题数组，保持其他智能体话题的位置
          const newTopics = [...state.topics]
          
          // 移除所有当前智能体的话题
          for (let i = newTopics.length - 1; i >= 0; i--) {
            const topic = newTopics[i]
            if (topic && topic.agentId === agentId) {
              newTopics.splice(i, 1)
            }
          }
          
          // 在原位置插入重排序后的话题
          newTopics.splice(firstAgentTopicIndex >= 0 ? firstAgentTopicIndex : newTopics.length, 0, ...reorderedAgentTopics)
          
          return { topics: newTopics }
        })
      },

      // 在特定位置（文件夹内或文件夹外）重新排序话题
      reorderTopicsInLocation: (agentId: string, folderId: string | null, oldIndex: number, newIndex: number) => {
        set((state) => {
          // 获取当前位置的话题（同一文件夹或都在根目录）
          const locationTopics = state.topics.filter(
            topic => topic.agentId === agentId && topic.folderId === folderId
          )
          
          // 其他话题保持不变
          const otherTopics = state.topics.filter(
            topic => !(topic.agentId === agentId && topic.folderId === folderId)
          )
          
          // 重排序当前位置的话题
          const reorderedLocationTopics = [...locationTopics]
          const [movedTopic] = reorderedLocationTopics.splice(oldIndex, 1)
          if (movedTopic) {
            reorderedLocationTopics.splice(newIndex, 0, movedTopic)
          }
          
          // 重建完整数组：保持原有顺序，但更新当前位置的话题顺序
          const newTopics = [...state.topics]
          
          // 找到当前位置第一个话题的索引
          const firstLocationTopicIndex = newTopics.findIndex(
            topic => topic.agentId === agentId && topic.folderId === folderId
          )
          
          // 移除当前位置的所有话题
          for (let i = newTopics.length - 1; i >= 0; i--) {
            const topic = newTopics[i]
            if (topic && topic.agentId === agentId && topic.folderId === folderId) {
              newTopics.splice(i, 1)
            }
          }
          
          // 在原位置插入重排序后的话题
          const insertIndex = firstLocationTopicIndex >= 0 ? firstLocationTopicIndex : newTopics.length
          newTopics.splice(insertIndex, 0, ...reorderedLocationTopics)
          
          return { topics: newTopics }
        })
      },

      // 文件夹相关方法
      addFolder: (folder) => {
        const newFolder: Folder = {
          ...folder,
          id: typeof window !== 'undefined' ? crypto.randomUUID() : `folder_${Date.now()}_${Math.random()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        // 立即更新本地状态
        set((state) => ({
          folders: [...state.folders, newFolder],
        }))
        
        // 异步保存到Supabase
        saveFolderToSupabase(newFolder).catch(error => {
          console.error('保存文件夹到Supabase失败:', error)
        })
        
        return newFolder.id
      },

      updateFolder: (id, updates) => {
        const updatedData = { ...updates, updatedAt: new Date() }
        
        // 立即更新本地状态
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id 
              ? { ...folder, ...updatedData }
              : folder
          ),
        }))
        
        // 异步更新Supabase
        updateFolderInSupabase(id, updatedData).catch(error => {
          console.error('更新文件夹到Supabase失败:', error)
        })
      },

      deleteFolder: (id) => {
        // 立即更新本地状态
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          // 将文件夹内的话题移出
          topics: state.topics.map((topic) =>
            topic.folderId === id 
              ? { ...topic, folderId: undefined }
              : topic
          ),
        }))
        
        // 异步删除Supabase数据
        deleteFolderFromSupabase(id).catch(error => {
          console.error('删除文件夹从Supabase失败:', error)
        })
      },

      toggleFolder: (id) => {
        // 立即更新本地状态
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id 
              ? { ...folder, isExpanded: !folder.isExpanded }
              : folder
          ),
        }))
        
        // 异步更新Supabase（仅更新展开状态）
        const state = get()
        const folder = state.folders.find(f => f.id === id)
        if (folder) {
          updateFolderInSupabase(id, { isExpanded: !folder.isExpanded }).catch(error => {
            console.error('更新文件夹展开状态失败:', error)
          })
        }
      },

      getFoldersByAgent: (agentId) => {
        const state = get()
        return state.folders
          .filter((folder) => folder.agentId === agentId)
          .sort((a, b) => a.order - b.order)
      },

      moveTopicToFolder: (topicId, folderId) => {
        const updatedData = { folderId: folderId || undefined, updatedAt: new Date() }
        
        set((state) => ({
          topics: state.topics.map((topic) =>
            topic.id === topicId 
              ? { ...topic, ...updatedData }
              : topic
          ),
        }))
        
        // 异步更新API
        updateTopicInAPI(topicId, updatedData).catch(console.error)
      },

      reorderFolders: (agentId, oldIndex, newIndex) => {
        set((state) => {
          const agentFolders = state.folders
            .filter(folder => folder.agentId === agentId)
            .sort((a, b) => a.order - b.order)
          
          const [movedFolder] = agentFolders.splice(oldIndex, 1)
          if (movedFolder) {
            agentFolders.splice(newIndex, 0, movedFolder)
          }
          
          // 重新分配顺序
          const reorderedFolders = agentFolders.map((folder, index) => ({
            ...folder,
            order: index,
          }))
          
          const otherFolders = state.folders.filter(folder => folder.agentId !== agentId)
          
          // 异步更新每个文件夹的顺序到Supabase
          reorderedFolders.forEach(folder => {
            updateFolderInSupabase(folder.id, { order: folder.order }).catch(error => {
              console.error('更新文件夹顺序失败:', error)
            })
          })
          
          return { 
            folders: [...otherFolders, ...reorderedFolders]
          }
        })
      },
    }),
    {
      name: 'topic-storage',
      // 使用安全的 localStorage 包装器，防止 QuotaExceededError
      storage: createJSONStorage(() => safeLocalStorage),
      // 完整持久化所有话题和文件夹到 localStorage
      partialize: (state) => ({ 
        topics: state.topics,  // 保存所有话题
        currentTopicId: state.currentTopicId,
        folders: state.folders,  // 保存所有文件夹
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.topics = state.topics.map(topic => ({
            ...topic,
            createdAt: new Date(topic.createdAt),
            updatedAt: new Date(topic.updatedAt),
          }))
          
          state.folders = state.folders.map(folder => ({
            ...folder,
            createdAt: new Date(folder.createdAt),
            updatedAt: new Date(folder.updatedAt),
          }))
          
          // 从API加载完整话题和文件夹列表（仅在Supabase配置后）
          if (!isSupabaseConfigured()) {
            console.log('💾 [本地模式] Supabase 未配置，使用 localStorage 完整持久化')
            console.log('  - 话题:', state.topics.length, '个')
            console.log('  - 文件夹:', state.folders.length, '个')
            return
          }
          
          const localTopicCount = state.topics.length
          const localFolderCount = state.folders.length
          console.log('☁️ [云端模式] 正在从 Supabase 同步数据...')
          
          // 同时加载话题和文件夹
          Promise.all([
            fetch('/api/topics', {
              headers: { 'x-user-id': getUserId() }
            }).then(res => res.json()),
            getFoldersFromSupabase()
          ])
            .then(([topicsData, foldersData]) => {
              console.log('☁️ [Supabase] 云端返回', topicsData.length, '个话题，', foldersData.length, '个文件夹')
              
              // 处理话题数据
              if (topicsData.length === 0 && localTopicCount > 0) {
                console.log('⚠️ [Topics] 云端为空，保留 localStorage 数据')
              } else if (topicsData.length > 0) {
                const topics = topicsData.map((topic: any) => ({
                  id: topic.id,
                  name: topic.title,
                  agentId: topic.agent_id,
                  folderId: topic.folder_id,
                  messages: [],
                  createdAt: new Date(topic.created_at),
                  updatedAt: new Date(topic.updated_at)
                }))
                console.log('✅ [Topics] 使用云端的', topics.length, '个话题')
                useTopicStore.setState({ topics })
              }
              
              // 处理文件夹数据
              if (foldersData.length === 0 && localFolderCount > 0) {
                console.log('⚠️ [Folders] 云端为空，保留 localStorage 数据')
              } else if (foldersData.length > 0) {
                const folders = foldersData.map((folder: any) => ({
                  id: folder.id,
                  name: folder.name,
                  agentId: folder.agent_id,
                  isExpanded: folder.is_expanded,
                  order: folder.order,
                  createdAt: new Date(folder.created_at),
                  updatedAt: new Date(folder.updated_at)
                }))
                console.log('✅ [Folders] 使用云端的', folders.length, '个文件夹')
                useTopicStore.setState({ folders })
              }
            })
            .catch(error => {
              console.error('❌ [Supabase] 加载数据失败:', error)
              console.log('⚠️ [Supabase] 保留 localStorage 数据')
            })
        }
      }
    }
  )
)