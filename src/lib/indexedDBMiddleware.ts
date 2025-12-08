/**
 * IndexedDB 持久化中间件 for Zustand
 * 替代 localStorage，解决存储空间限制问题
 */

import { StateCreator, StoreMutatorIdentifier } from 'zustand'
import * as indexedDB from '@/lib/indexedDB'

type IndexedDBPersist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>,
  options: {
    name: string
    autoClean?: {
      enabled: boolean
      keepDays: number
      intervalHours: number
    }
  }
) => StateCreator<T, Mps, Mcs>

export const indexedDBPersist: IndexedDBPersist = (config, options) => (set, get, api) => {
  const { name, autoClean } = options

  // 从 IndexedDB 加载初始状态
  const loadState = async () => {
    try {
      const savedState = await indexedDB.getItem(name)
      if (savedState) {
        set(savedState as any, true)
        console.log(`✅ 从 IndexedDB 加载 ${name}`)
      }
    } catch (error) {
      console.error(`❌ 从 IndexedDB 加载 ${name} 失败:`, error)
    }
  }

  // 保存状态到 IndexedDB
  const saveState = async (state: any) => {
    try {
      await indexedDB.setItem(name, state)
    } catch (error) {
      console.error(`❌ 保存 ${name} 到 IndexedDB 失败:`, error)
      
      // 如果存储失败，尝试自动清理
      if (autoClean?.enabled) {
        console.log('尝试自动清理旧数据...')
        await indexedDB.autoCleanOldData(autoClean.keepDays)
        
        // 再次尝试保存
        try {
          await indexedDB.setItem(name, state)
          console.log('✅ 清理后保存成功')
        } catch (retryError) {
          console.error('❌ 清理后仍然保存失败:', retryError)
          throw new Error('存储空间不足，请手动清理数据')
        }
      }
    }
  }

  // 设置自动清理定时器
  if (autoClean?.enabled && typeof window !== 'undefined') {
    const intervalMs = autoClean.intervalHours * 60 * 60 * 1000
    
    // 启动时清理一次
    indexedDB.autoCleanOldData(autoClean.keepDays)
    
    // 定期清理
    const cleanupInterval = setInterval(() => {
      indexedDB.autoCleanOldData(autoClean.keepDays)
    }, intervalMs)

    // 页面卸载时清理定时器
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval)
    })
  }

  // 初始化加载
  loadState()

  // 包装 set 函数以自动保存
  const wrappedSet: typeof set = (partial, replace) => {
    set(partial, replace)
    
    // 异步保存，不阻塞UI
    const currentState = get()
    saveState(currentState)
  }

  return config(wrappedSet, get, api)
}

/**
 * 检查存储空间并显示警告
 */
export async function checkStorageSpace(): Promise<void> {
  const info = await indexedDB.getStorageInfo()
  
  console.log(`📊 存储空间使用情况:`)
  console.log(`   已使用: ${info.usage} MB`)
  console.log(`   总容量: ${info.quota} MB`)
  console.log(`   使用率: ${info.percentage}%`)
  
  if (info.percentage > 80) {
    console.warn('⚠️ 存储空间使用超过80%，建议清理旧数据')
  }
  
  if (info.percentage > 95) {
    console.error('🚨 存储空间即将用尽！')
  }
}

// 在开发模式下显示存储信息
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  checkStorageSpace()
}

