/**
 * 一键迁移工具：从 localStorage 迁移到 IndexedDB
 * 
 * 使用方法：
 * 1. 在浏览器 Console 中执行此脚本
 * 2. 或在应用启动时自动执行
 */

import * as indexedDB from '@/lib/indexedDB'

interface MigrationResult {
  success: boolean
  migratedKeys: string[]
  failedKeys: string[]
  freedSpace: number
  error?: string
}

/**
 * 执行迁移
 */
export async function migrateToIndexedDB(): Promise<MigrationResult> {
  console.log('=== 开始迁移 localStorage 到 IndexedDB ===\n')

  const result: MigrationResult = {
    success: false,
    migratedKeys: [],
    failedKeys: [],
    freedSpace: 0
  }

  try {
    // 1. 获取存储使用情况
    const beforeInfo = await indexedDB.getStorageInfo()
    console.log('📊 迁移前存储状况:')
    console.log(`   localStorage: ~${(JSON.stringify(localStorage).length / 1024).toFixed(2)} KB`)
    console.log(`   IndexedDB: ${beforeInfo.usage} MB / ${beforeInfo.quota} MB\n`)

    // 2. 获取所有 localStorage 的键
    const keys = Object.keys(localStorage)
    console.log(`📦 发现 ${keys.length} 个存储项\n`)

    // 3. 逐个迁移
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          // 尝试解析 JSON
          let parsedValue
          try {
            parsedValue = JSON.parse(value)
          } catch {
            parsedValue = value // 如果不是 JSON，保存原始字符串
          }

          // 保存到 IndexedDB
          await indexedDB.setItem(key, parsedValue)
          result.migratedKeys.push(key)
          console.log(`✅ 迁移成功: ${key}`)
        }
      } catch (error) {
        console.error(`❌ 迁移失败: ${key}`, error)
        result.failedKeys.push(key)
      }
    }

    // 4. 验证迁移
    console.log('\n🔍 验证迁移结果...')
    for (const key of result.migratedKeys) {
      const value = await indexedDB.getItem(key)
      if (!value) {
        console.warn(`⚠️ 验证失败: ${key} 未在 IndexedDB 中找到`)
        result.failedKeys.push(key)
        result.migratedKeys = result.migratedKeys.filter(k => k !== key)
      }
    }

    // 5. 清理 localStorage（可选，需要用户确认）
    console.log('\n💡 迁移完成！是否清理 localStorage？')
    console.log('   如果确认迁移成功，可以执行: clearLocalStorage()')

    // 6. 显示结果
    const afterInfo = await indexedDB.getStorageInfo()
    result.freedSpace = (JSON.stringify(localStorage).length / 1024)

    console.log('\n📊 迁移统计:')
    console.log(`   成功: ${result.migratedKeys.length}`)
    console.log(`   失败: ${result.failedKeys.length}`)
    console.log(`   可释放空间: ~${result.freedSpace.toFixed(2)} KB`)
    console.log(`   IndexedDB 使用: ${afterInfo.usage} MB / ${afterInfo.quota} MB`)

    result.success = result.failedKeys.length === 0

    return result

  } catch (error) {
    console.error('\n❌ 迁移过程出错:', error)
    result.error = error instanceof Error ? error.message : String(error)
    return result
  }
}

/**
 * 清理 localStorage（在确认迁移成功后）
 */
export function clearLocalStorage(keepKeys: string[] = []): void {
  console.log('=== 清理 localStorage ===\n')

  const allKeys = Object.keys(localStorage)
  const toRemove = allKeys.filter(key => !keepKeys.includes(key))

  console.log(`准备删除 ${toRemove.length} 个项目`)
  
  if (keepKeys.length > 0) {
    console.log(`保留以下项目: ${keepKeys.join(', ')}`)
  }

  toRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log(`✅ 已删除: ${key}`)
  })

  const remaining = (JSON.stringify(localStorage).length / 1024).toFixed(2)
  console.log(`\n✅ 清理完成，剩余: ${remaining} KB`)
}

/**
 * 回滚迁移（如果出现问题）
 */
export async function rollbackMigration(): Promise<void> {
  console.log('=== 回滚迁移 ===\n')

  try {
    const keys = await indexedDB.getAllKeys()
    
    for (const key of keys) {
      const value = await indexedDB.getItem(key)
      if (value) {
        try {
          localStorage.setItem(key, JSON.stringify(value))
          console.log(`✅ 恢复到 localStorage: ${key}`)
        } catch (error) {
          console.error(`❌ 恢复失败: ${key}`, error)
        }
      }
    }

    console.log('\n✅ 回滚完成')
  } catch (error) {
    console.error('❌ 回滚失败:', error)
  }
}

/**
 * 自动迁移（应用启动时）
 */
export async function autoMigrate(): Promise<void> {
  // 检查是否已经迁移过
  const migrationFlag = localStorage.getItem('__migration_to_indexeddb_done__')
  
  if (migrationFlag) {
    console.log('✅ 已完成迁移，跳过')
    return
  }

  console.log('🚀 检测到首次使用 IndexedDB，开始自动迁移...\n')

  const result = await migrateToIndexedDB()

  if (result.success) {
    // 标记迁移完成
    localStorage.setItem('__migration_to_indexeddb_done__', 'true')
    
    // 询问用户是否清理
    if (typeof window !== 'undefined') {
      const shouldClean = confirm(
        '迁移成功！是否清理 localStorage 以释放空间？\n\n' +
        `可释放约 ${result.freedSpace.toFixed(2)} KB\n\n` +
        '（数据已安全迁移到 IndexedDB）'
      )

      if (shouldClean) {
        clearLocalStorage(['__migration_to_indexeddb_done__'])
        alert('清理完成！页面将刷新以应用更改。')
        location.reload()
      }
    }
  } else {
    console.error('❌ 自动迁移失败，继续使用 localStorage')
  }
}

// 导出给 window 对象，方便在 Console 中使用
if (typeof window !== 'undefined') {
  (window as any).migrateToIndexedDB = migrateToIndexedDB
  (window as any).clearLocalStorage = clearLocalStorage
  (window as any).rollbackMigration = rollbackMigration
  (window as any).checkStorageInfo = indexedDB.getStorageInfo
}

