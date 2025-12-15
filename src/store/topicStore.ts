import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TopicState, Topic } from '@/types/agent'
import { getUserId } from '@/lib/supabase'

// 辅助函数：调用话题API
async function saveTopicToAPI(topic: Topic) {
  try {
    // 字段映射：驼峰命名 → 数据库下划线命名
    const mappedTopic = {
      id: topic.id,
      user_id: getUserId(),
      title: topic.name,  // name → title
      agent_id: topic.agentId,  // agentId → agent_id
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
      const error = await response.json()
      console.error('保存话题失败:', error)
    }
  } catch (error) {
    console.error('保存话题到API失败:', error)
  }
}

async function updateTopicInAPI(id: string, updates: Partial<Topic>) {
  try {
    // 字段映射：驼峰命名 → 数据库下划线命名
    const mappedUpdates: any = { id, updated_at: new Date() }
    
    if (updates.name !== undefined) {
      mappedUpdates.title = updates.name  // name → title
    }
    if (updates.agentId !== undefined) {
      mappedUpdates.agent_id = updates.agentId  // agentId → agent_id
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
      const error = await response.json()
      console.error('更新话题失败:', error)
    }
  } catch (error) {
    console.error('更新话题到API失败:', error)
  }
}

async function deleteTopicFromAPI(id: string) {
  try {
    const response = await fetch(`/api/topics?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': getUserId()
      }
    })
    if (!response.ok) {
      const error = await response.json()
      console.error('删除话题失败:', error)
    }
  } catch (error) {
    console.error('删除话题从API失败:', error)
  }
}

export const useTopicStore = create<TopicState>()(
  persist(
    (set, get) => ({
      topics: [],
      currentTopicId: null,
      
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
    }),
    {
      name: 'topic-cache', // 改名以区分
      partialize: (state) => ({ 
        // 只缓存最近10个话题作为快速访问缓存
        topics: state.topics.slice(-10),
        currentTopicId: state.currentTopicId
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复 Date 对象
          state.topics = state.topics.map(topic => ({
            ...topic,
            createdAt: new Date(topic.createdAt),
            updatedAt: new Date(topic.updatedAt),
          }))
          
          // 从API加载完整话题列表（仅在Supabase配置后）
          const localTopicCount = state.topics.length
          console.log('📦 [localStorage] 本地有', localTopicCount, '个话题')
          
          // 检查Supabase是否已配置
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
          
          if (!supabaseConfigured) {
            console.log('⚠️ [Supabase] 未配置，使用localStorage数据')
            return
          }
          
          console.log('✅ [Supabase] 已配置，尝试加载云端话题')
          
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
                  messages: [], // 话题不存储消息ID列表
                  createdAt: new Date(topic.created_at),
                  updatedAt: new Date(topic.updated_at)
                }))
                
                console.log('✅ [Topics API] 使用云端的', topics.length, '个话题')
                console.log('📋 [Topics API] 话题示例:', topics.slice(0, 3))
                useTopicStore.setState({ topics })
                
                // 验证状态是否更新
                const currentState = useTopicStore.getState()
                console.log('📊 [Topics Store] 当前状态中的话题数:', currentState.topics.length)
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