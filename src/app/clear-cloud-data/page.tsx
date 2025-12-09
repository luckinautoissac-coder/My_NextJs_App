'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { getUserId } from '@/lib/supabase'

export default function ClearCloudDataPage() {
  const [status, setStatus] = useState<'idle' | 'clearing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState<{ messages: number; topics: number } | null>(null)

  const handleClear = async () => {
    if (!confirm('⚠️ 确定要清空云端数据吗？\n\n这将删除Supabase中的所有消息和话题。\n\n（localStorage中的数据不会被删除）')) {
      return
    }

    try {
      setStatus('clearing')
      setMessage('正在清空云端数据...')

      const response = await fetch('/api/clear-supabase', {
        method: 'POST',
        headers: {
          'x-user-id': getUserId()
        }
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.deleted)
        setStatus('success')
        setMessage(`✅ 清空成功！已删除 ${result.deleted.messages} 条消息和 ${result.deleted.topics} 个话题`)
      } else {
        setStatus('error')
        setMessage(`❌ 清空失败：${result.error}`)
      }
    } catch (error) {
      console.error('清空错误:', error)
      setStatus('error')
      setMessage(`❌ 清空失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trash2 className="h-8 w-8" />
          清空云端数据
        </h1>
        <p className="text-muted-foreground">
          清空Supabase云端数据库中的所有消息和话题
        </p>
      </div>

      {/* 警告 */}
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>⚠️ 重要提醒：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>这将清空Supabase中的所有数据</li>
            <li>localStorage中的数据不会被删除</li>
            <li>清空后需要重新迁移数据</li>
            <li>此操作不可撤销</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* 状态提示 */}
      {status !== 'idle' && (
        <Alert variant={status === 'error' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {status === 'clearing' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'error' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* 统计信息 */}
      {stats && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">清空成功</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>删除消息：</span>
              <span className="font-bold text-green-700">{stats.messages} 条</span>
            </div>
            <div className="flex justify-between">
              <span>删除话题：</span>
              <span className="font-bold text-green-700">{stats.topics} 个</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用场景</CardTitle>
          <CardDescription>
            什么时候需要清空云端数据？
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="font-medium">适用情况：</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>迁移了错误或不完整的数据</li>
              <li>需要重新迁移完整的备份文件</li>
              <li>测试迁移功能</li>
              <li>清理测试数据</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-amber-600">操作流程：</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-600">
              <li>确保localStorage有完整的数据（通过"数据设置"导入备份）</li>
              <li>点击下方"清空云端数据"按钮</li>
              <li>等待清空完成</li>
              <li>访问 /migrate-to-cloud 重新迁移</li>
            </ol>
          </div>

          <Button 
            onClick={handleClear}
            disabled={status === 'clearing'}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {status === 'clearing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                正在清空...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                清空云端数据
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 下一步 */}
      {status === 'success' && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">下一步操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-700">
              云端数据已清空，现在可以：
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>确保localStorage有完整数据（在"数据设置"中查看统计）</li>
              <li>访问 <a href="/migrate-to-cloud" className="underline font-bold">/migrate-to-cloud</a> 重新迁移</li>
              <li>验证迁移后的数据完整性</li>
            </ol>
            <Button 
              onClick={() => window.location.href = '/migrate-to-cloud'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              前往迁移页面
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

