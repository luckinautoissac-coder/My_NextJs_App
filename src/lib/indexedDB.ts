/**
 * IndexedDB 存储封装
 * 用于替代 localStorage，解决存储空间限制问题
 * 
 * 优势：
 * - 容量：50MB - 几GB（远超localStorage的5-10MB）
 * - 异步操作：不阻塞主线程
 * - 结构化存储：支持复杂数据类型
 */

const DB_NAME = 'ChatAssistantDB'
const DB_VERSION = 1
const STORE_NAME = 'chatData'

// 数据库实例缓存
let dbInstance: IDBDatabase | null = null

/**
 * 初始化/打开数据库
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // 如果已经有实例，直接返回
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    // 首次创建或版本升级时触发
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建对象存储（类似表）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        
        console.log('✅ IndexedDB 数据库已创建')
      }
    }

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result
      console.log('✅ IndexedDB 数据库已打开')
      resolve(dbInstance)
    }

    request.onerror = () => {
      console.error('❌ IndexedDB 打开失败:', request.error)
      reject(request.error)
    }
  })
}

/**
 * 保存数据
 */
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const data = {
      key,
      value,
      timestamp: Date.now()
    }

    const request = store.put(data)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ IndexedDB 保存失败:', error)
    // 降级到 localStorage
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('❌ localStorage 也保存失败:', e)
      throw new Error('存储空间已满，请清理旧数据')
    }
  }
}

/**
 * 读取数据
 */
export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : null)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ IndexedDB 读取失败，尝试从 localStorage 读取:', error)
    // 降级到 localStorage
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (e) {
      console.error('❌ localStorage 也读取失败:', e)
      return null
    }
  }
}

/**
 * 删除数据
 */
export async function removeItem(key: string): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ IndexedDB 删除失败:', error)
    localStorage.removeItem(key)
  }
}

/**
 * 清空所有数据
 */
export async function clear(): Promise<void> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ IndexedDB 清空失败:', error)
    localStorage.clear()
  }
}

/**
 * 获取所有键
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const db = await openDatabase()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('❌ IndexedDB 获取键失败:', error)
    return Object.keys(localStorage)
  }
}

/**
 * 获取存储使用情况
 */
export async function getStorageInfo(): Promise<{
  usage: number
  quota: number
  percentage: number
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      const usage = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? Math.round((usage / quota) * 100) : 0

      return {
        usage: Math.round(usage / 1024 / 1024), // MB
        quota: Math.round(quota / 1024 / 1024), // MB
        percentage
      }
    } catch (error) {
      console.error('❌ 获取存储信息失败:', error)
    }
  }

  return { usage: 0, quota: 0, percentage: 0 }
}

/**
 * 从 localStorage 迁移数据到 IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  console.log('开始从 localStorage 迁移数据到 IndexedDB...')
  
  const keys = Object.keys(localStorage)
  let migratedCount = 0

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        await setItem(key, JSON.parse(value))
        migratedCount++
      }
    } catch (error) {
      console.error(`迁移 ${key} 失败:`, error)
    }
  }

  console.log(`✅ 迁移完成，共迁移 ${migratedCount} 条数据`)
}

/**
 * 自动清理旧数据（保留最近N天）
 */
export async function autoCleanOldData(keepDays: number = 30): Promise<void> {
  console.log(`开始清理 ${keepDays} 天前的数据...`)

  try {
    const chatData = await getItem<any>('chat-store')
    
    if (!chatData || !chatData.state || !chatData.state.messages) {
      console.log('没有需要清理的数据')
      return
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepDays)
    
    const originalCount = chatData.state.messages.length
    
    // 过滤消息
    chatData.state.messages = chatData.state.messages.filter((message: any) => {
      const messageDate = new Date(message.timestamp)
      return messageDate >= cutoffDate
    })

    const deletedCount = originalCount - chatData.state.messages.length

    if (deletedCount > 0) {
      await setItem('chat-store', chatData)
      console.log(`✅ 清理完成，删除了 ${deletedCount} 条旧消息`)
    } else {
      console.log('没有需要清理的消息')
    }
  } catch (error) {
    console.error('❌ 自动清理失败:', error)
  }
}

// 初始化时自动打开数据库
if (typeof window !== 'undefined') {
  openDatabase().catch(console.error)
}

