'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, CheckCircle2, AlertCircle, Database } from 'lucide-react'

export default function StorageCleanupPage() {
  const [status, setStatus] = useState<'idle' | 'calculating' | 'cleaned' | 'error'>('idle')
  const [beforeSize, setBeforeSize] = useState<number>(0)
  const [afterSize, setAfterSize] = useState<number>(0)

  // 计算localStorage使用量
  const calculateStorageSize = () => {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total / 1024 // 转换为KB
  }

  // 清理localStorage（保留必要配置）
  const handleCleanup = () => {
    try {
      setStatus('calculating')
      const before = calculateStorageSize()
      setBeforeSize(before)

      // 保留必要的配置
      const apiStore = localStorage.getItem('api-store')
      const agentStore = localStorage.getItem('agent-store')
      const topicStore = localStorage.getItem('topic-store')

      // 清空localStorage
      localStorage.clear()

      // 恢复配置
      if (apiStore) localStorage.setItem('api-store', apiStore)
      if (agentStore) localStorage.setItem('agent-store', agentStore)
      if (topicStore) localStorage.setItem('topic-store', topicStore)

      // 重置chat-store为空（数据已在云端）
      localStorage.setItem('chat-store', JSON.stringify({
        state: { messages: [] },
        version: 0
      }))

      const after = calculateStorageSize()
      setAfterSize(after)
      setStatus('cleaned')

    } catch (error) {
      console.error('Cleanup error:', error)
      setStatus('error')
    }
  }

  const currentSize = calculateStorageSize()

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">浏览器存储清理</h1>
        <p className="text-muted-foreground">
          数据已在VPS云端，可以安全清理浏览器localStorage释放空间
        </p>
      </div>

      {/* 状态提示 */}
      {status === 'cleaned' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div>✅ 清理完成！</div>
              <div className="text-sm">
                清理前：{beforeSize.toFixed(2)} KB
                → 清理后：{afterSize.toFixed(2)} KB
                → 释放：{(beforeSize - afterSize).toFixed(2)} KB
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ❌ 清理失败，请刷新页面重试
          </AlertDescription>
        </Alert>
      )}

      {/* 当前使用量 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            当前localStorage使用情况
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-blue-600">
              {currentSize.toFixed(2)} KB
            </div>
            <div className="text-sm text-muted-foreground">
              {currentSize < 1024 ? '空间充足' : currentSize < 5120 ? '空间紧张' : '⚠️ 接近限制'}
            </div>
            <div className="text-xs text-muted-foreground">
              浏览器localStorage限制：约5-10MB
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 清理说明 */}
      <Card>
        <CardHeader>
          <CardTitle>清理后会保留什么？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>API Key配置（不会丢失）</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>智能体配置（不会丢失）</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>话题列表（不会丢失）</span>
          </div>
          <div className="flex items-start gap-2">
            <span>🗑️</span>
            <span>聊天消息缓存（已在VPS云端，可安全删除）</span>
          </div>
        </CardContent>
      </Card>

      {/* 清理按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            开始清理
          </CardTitle>
          <CardDescription>
            清理浏览器缓存，释放localStorage空间
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCleanup}
            disabled={status === 'calculating'}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清理localStorage（保留配置）
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ⚠️ 清理后会刷新页面，聊天记录将从VPS云端重新加载
          </p>
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>重要提示：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>清理前请确保已完成数据迁移</li>
            <li>清理后会自动刷新页面</li>
            <li>历史消息会从VPS云端重新加载</li>
            <li>配置信息（API Key、智能体等）不会丢失</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* 清理后的操作 */}
      {status === 'cleaned' && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600">清理成功！下一步操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full"
              size="lg"
            >
              返回首页并刷新
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              点击后将跳转到首页，并从云端重新加载所有数据
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

