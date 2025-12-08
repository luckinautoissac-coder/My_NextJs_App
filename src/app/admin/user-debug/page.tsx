'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, RefreshCw } from 'lucide-react'

export default function UserDebugPage() {
  const [localUserId, setLocalUserId] = useState('')
  const [vpsUserIds, setVpsUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 获取localStorage中的userId
    const userId = localStorage.getItem('__user_id__') || '未设置'
    setLocalUserId(userId)
  }, [])

  const fetchVpsUserIds = async () => {
    setLoading(true)
    try {
      // 查询VPS中所有的userId
      const response = await fetch('/api/debug/users')
      const data = await response.json()
      setVpsUserIds(data.userIds || [])
    } catch (error) {
      console.error('查询失败:', error)
    }
    setLoading(false)
  }

  const setUserIdFromVps = (userId: string) => {
    localStorage.setItem('__user_id__', userId)
    setLocalUserId(userId)
    alert(`✅ userId已设置为: ${userId}\n\n请刷新首页查看数据！`)
  }

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🔍 用户ID调试工具</h1>
        <p className="text-muted-foreground">
          检查localStorage和VPS数据库中的userId
        </p>
      </div>

      {/* 当前localStorage的userId */}
      <Card>
        <CardHeader>
          <CardTitle>当前浏览器的 userId</CardTitle>
          <CardDescription>
            这是localStorage中保存的userId，用于查询VPS数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>当前userId：</strong>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded">
                {localUserId}
              </code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* VPS中的userId列表 */}
      <Card>
        <CardHeader>
          <CardTitle>VPS数据库中的 userId</CardTitle>
          <CardDescription>
            这些是VPS数据库中存在的所有userId
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={fetchVpsUserIds}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                正在查询...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                查询VPS中的userId
              </>
            )}
          </Button>

          {vpsUserIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">找到 {vpsUserIds.length} 个userId：</p>
              {vpsUserIds.map((userId, index) => (
                <Alert key={index} className={userId === localUserId ? 'border-green-500 bg-green-50' : ''}>
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <code className="text-sm">{userId}</code>
                      {userId === localUserId && (
                        <span className="ml-2 text-xs text-green-600 font-medium">
                          ✅ 当前使用
                        </span>
                      )}
                    </div>
                    {userId !== localUserId && (
                      <Button
                        onClick={() => setUserIdFromVps(userId)}
                        variant="outline"
                        size="sm"
                      >
                        使用此ID
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 说明 */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>如何使用：</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>点击"查询VPS中的userId"按钮</li>
            <li>查看VPS中有哪些userId</li>
            <li>如果当前userId和VPS中的不匹配，点击"使用此ID"</li>
            <li>刷新首页，就能看到数据了</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}

