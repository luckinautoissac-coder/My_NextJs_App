import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TopicState, Topic, Folder } from '@/types/agent'
import { getUserId, isSupabaseConfigured } from '@/lib/supabase'

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
        
        set((state) => ({
          folders: [...state.folders, newFolder],
        }))
        
        return newFolder.id
      },

      updateFolder: (id, updates) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id 
              ? { ...folder, ...updates, updatedAt: new Date() }
              : folder
          ),
        }))
      },

      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          // 将文件夹内的话题移出
          topics: state.topics.map((topic) =>
            topic.folderId === id 
              ? { ...topic, folderId: undefined }
              : topic
          ),
        }))
      },

      toggleFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id 
              ? { ...folder, isExpanded: !folder.isExpanded }
              : folder
          ),
        }))
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
          
          return { 
            folders: [...otherFolders, ...reorderedFolders]
          }
        })
      },
    }),
    {
      name: 'topic-cache', // 改名以区分
      partialize: (state) => ({ 
        // 只缓存最近10个话题作为快速访问缓存
        topics: state.topics.slice(-10),
        currentTopicId: state.currentTopicId,
        folders: state.folders,
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
          
          // 从API加载完整话题列表（仅在Supabase配置后）
          if (!isSupabaseConfigured()) {
            console.log('📦 [本地模式] 使用 localStorage 存储，共', state.topics.length, '个话题')
            return
          }
          
          const localTopicCount = state.topics.length
          console.log('☁️ [云端模式] 正在从 Supabase 加载话题...')
          
          fetch('/api/topics', {
            headers: {
              'x-user-id': getUserId()
            }
          })
            .then(res => res.json())
            .then(data => {
              console.log('☁️ [Topics API] 云端返回', data.length, '个话题')
              
              if (data.length === 0 && localTopicCount > 0) {
                console.log('⚠️ [Topics API] 云端为空，保留localStorage数据')
                return
              }
              
              if (data.length > 0) {
                const topics = data.map((topic: any) => ({
                  id: topic.id,
                  name: topic.title, // API返回title，映射到name字段
                  agentId: topic.agent_id,
                  folderId: topic.folder_id,
                  messages: [], // 话题不存储消息ID列表
                  createdAt: new Date(topic.created_at),
                  updatedAt: new Date(topic.updated_at)
                }))
                
                console.log('✅ [Topics API] 使用云端的', topics.length, '个话题')
                useTopicStore.setState({ topics })
              }
            })
            .catch(error => {
              console.error('❌ [Topics API] 加载话题失败:', error)
              console.log('⚠️ [Topics API] 保留localStorage数据')
            })
        }
      }
    }
  )
)