# IndexedDB 迁移部署指南

## 📋 目标

彻底解决 localStorage 存储空间不足的问题，从 5-10MB 扩展到 50MB-几GB。

## 🎯 方案优势

### localStorage vs IndexedDB

| 特性 | localStorage | IndexedDB |
|-----|-------------|-----------|
| 容量 | 5-10 MB | 50MB - 几GB |
| 性能 | 同步，阻塞UI | 异步，不阻塞UI |
| 数据类型 | 字符串 | 任意类型 |
| 查询能力 | 无 | 支持索引查询 |
| 自动清理 | 无 | ✅ 支持 |

## 📦 已创建的文件

```
src/lib/
├── indexedDB.ts              # IndexedDB 封装
├── indexedDBMiddleware.ts    # Zustand 中间件
└── migration.ts              # 迁移工具
```

## 🚀 部署步骤

### 步骤1: 更新 chatStore（示例）

```typescript
// src/store/chatStore.ts
import { create } from 'zustand'
import { indexedDBPersist } from '@/lib/indexedDBMiddleware'

export const useChatStore = create(
  indexedDBPersist(
    (set) => ({
      messages: [],
      // ... 其他状态
    }),
    {
      name: 'chat-store',
      autoClean: {
        enabled: true,    // 启用自动清理
        keepDays: 30,     // 保留30天内的数据
        intervalHours: 24 // 每24小时清理一次
      }
    }
  )
)
```

### 步骤2: 在 App 启动时初始化

```typescript
// src/app/layout.tsx 或 src/app/page.tsx
'use client'

import { useEffect } from 'react'
import { autoMigrate } from '@/lib/migration'
import { checkStorageSpace } from '@/lib/indexedDBMiddleware'

export default function RootLayout({ children }) {
  useEffect(() => {
    // 自动迁移（只在首次运行）
    autoMigrate()
    
    // 检查存储空间
    checkStorageSpace()
  }, [])

  return <>{children}</>
}
```

### 步骤3: 更新所有 Store

需要更新的 Store 列表：
- ✅ `chatStore.ts` - 聊天消息
- ✅ `topicStore.ts` - 话题分类
- ✅ `apiSettingsStore.ts` - API 设置
- ✅ `agentStore.ts` - 智能体配置
- ✅ `thinkingChainStore.ts` - 思维链配置

## 🔧 迁移方式

### 方式1: 自动迁移（推荐）

应用启动时自动检测并迁移，用户无感知。

### 方式2: 手动迁移

在浏览器 Console 中执行：

```javascript
// 1. 执行迁移
await migrateToIndexedDB()

// 2. 验证成功后清理 localStorage
clearLocalStorage()

// 3. 刷新页面
location.reload()
```

### 方式3: 渐进式迁移

只迁移新数据到 IndexedDB，旧数据保留在 localStorage，逐步过渡。

## 📊 监控和维护

### 查看存储使用情况

```javascript
// 在 Console 中执行
await checkStorageInfo()
```

输出示例：
```
📊 存储空间使用情况:
   已使用: 15 MB
   总容量: 1024 MB
   使用率: 1.5%
```

### 手动清理旧数据

```javascript
// 清理 30 天前的数据
await autoCleanOldData(30)

// 清理 7 天前的数据
await autoCleanOldData(7)
```

## 🎨 UI 集成（可选）

### 添加存储管理页面

创建一个管理页面显示：
- 存储使用情况
- 数据统计
- 清理按钮

```typescript
// src/app/admin/storage/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { getStorageInfo, autoCleanOldData } from '@/lib/indexedDB'

export default function StorageManagement() {
  const [info, setInfo] = useState({ usage: 0, quota: 0, percentage: 0 })

  useEffect(() => {
    loadInfo()
  }, [])

  const loadInfo = async () => {
    const storageInfo = await getStorageInfo()
    setInfo(storageInfo)
  }

  const handleClean = async (days: number) => {
    await autoCleanOldData(days)
    await loadInfo()
    alert(`已清理 ${days} 天前的数据`)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">存储管理</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">存储使用情况</h2>
        <p>已使用: {info.usage} MB / {info.quota} MB</p>
        <p>使用率: {info.percentage}%</p>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
          <div 
            className="bg-blue-500 h-4 rounded-full"
            style={{ width: `${info.percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button 
          onClick={() => handleClean(30)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          清理30天前的数据
        </button>
        <button 
          onClick={() => handleClean(7)}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          清理7天前的数据
        </button>
      </div>
    </div>
  )
}
```

## 🚨 兼容性处理

### 浏览器兼容性

IndexedDB 支持：
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+
- ✅ Opera 15+
- ✅ 移动端浏览器

### 降级方案

如果浏览器不支持 IndexedDB，自动降级到 localStorage：

```typescript
// 已在 indexedDB.ts 中实现
export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    // 尝试使用 IndexedDB
    await indexedDBSave(key, value)
  } catch (error) {
    // 降级到 localStorage
    localStorage.setItem(key, JSON.stringify(value))
  }
}
```

## 📝 客户通知模板

### 给客户的通知

```
【系统升级通知】

亲爱的用户：

为了给您提供更好的使用体验，我们进行了存储系统升级：

✅ 存储容量提升 100 倍（从 5MB 提升到 500MB+）
✅ 自动清理旧数据，无需手动维护
✅ 性能优化，响应更快速
✅ 数据自动迁移，无需任何操作

升级说明：
- 首次打开应用时会自动迁移数据（约需10-30秒）
- 系统会自动保留最近30天的对话记录
- 如需保留更长时间的记录，请联系技术支持

如有任何问题，请联系我们。

技术支持团队
```

## 🔍 常见问题

### Q: 迁移会丢失数据吗？
A: 不会。迁移过程会：
1. 先复制到 IndexedDB
2. 验证数据完整性
3. 确认无误后才清理 localStorage

### Q: 迁移失败怎么办？
A: 
1. 不会删除 localStorage 的数据
2. 可以使用 `rollbackMigration()` 回滚
3. 应用会继续使用 localStorage

### Q: 如何回退到 localStorage？
A: 执行 `rollbackMigration()` 即可

### Q: 自动清理会删除重要数据吗？
A: 只删除超过指定天数（默认30天）的消息，不影响：
- API 设置
- 智能体配置
- 话题分类

## 📈 性能对比

### 写入性能

| 操作 | localStorage | IndexedDB |
|------|-------------|-----------|
| 写入1KB | ~0.1ms | ~0.5ms |
| 写入10KB | ~1ms | ~2ms |
| 写入100KB | ~10ms | ~5ms |
| 写入1MB | ~100ms | ~20ms |

### 存储容量对比

| 浏览器 | localStorage | IndexedDB |
|--------|-------------|-----------|
| Chrome | 10 MB | 可用磁盘空间的 60% |
| Firefox | 10 MB | 可用磁盘空间的 50% |
| Safari | 5 MB | 1 GB |

## ✅ 部署检查清单

- [ ] 创建 IndexedDB 相关文件
- [ ] 更新所有 Store 使用新中间件
- [ ] 在 App 启动时添加自动迁移
- [ ] 测试迁移流程
- [ ] 测试降级方案
- [ ] 添加存储监控（可选）
- [ ] 准备客户通知
- [ ] 部署到生产环境
- [ ] 监控迁移情况

## 🎯 预期效果

部署后：
- ✅ 存储容量从 5-10MB 提升到 50MB-几GB
- ✅ 不再出现 "exceeded the quota" 错误
- ✅ 自动清理旧数据，无需手动维护
- ✅ 用户无感知迁移
- ✅ 性能更优（异步操作）

## 📞 技术支持

如在部署过程中遇到问题：
1. 查看浏览器 Console 日志
2. 执行 `await checkStorageInfo()` 检查存储状态
3. 使用 `rollbackMigration()` 回退
4. 联系技术支持团队

