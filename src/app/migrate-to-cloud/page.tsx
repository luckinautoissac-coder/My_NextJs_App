'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Cloud, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react'
import { getUserId } from '@/lib/supabase'

export default function MigrateToCloudPage() {
  const [status, setStatus] = useState<'idle' | 'migrating' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState<{ messages: number; topics: number } | null>(null)

  const handleMigrate = async () => {
    try {
      setStatus('migrating')
      setMessage('正在读取本地数据...')
      
      // 读取localStorage数据
      const chatStore = localStorage.getItem('chat-store')
      const topicStore = localStorage.getItem('topic-store')
      
      if (!chatStore && !topicStore) {
        setStatus('error')
        setMessage('❌ 没有找到本地数据')
        return
      }
      
      const chatData = chatStore ? JSON.parse(chatStore) : null
      const topicData = topicStore ? JSON.parse(topicStore) : null
      
      const messages = chatData?.state?.messages || []
      const topics = topicData?.state?.topics || []
      
      setMessage(`找到 ${messages.length} 条消息和 ${topics.length} 个话题，正在上传到云端...`)
      
      // 调用迁移API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId()
        },
        body: JSON.stringify({ messages, topics })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStats(result.migrated)
        setStatus('success')
        setMessage(`✅ 迁移成功！已上传 ${result.migrated.messages} 条消息和 ${result.migrated.topics} 个话题到云端`)
        
        // 提示刷新
        setTimeout(() => {
          if (confirm('数据已迁移到云端！是否刷新页面加载新数据？')) {
            window.location.href = '/'
          }
        }, 2000)
      } else {
        setStatus('error')
        setMessage(`❌ 迁移失败：${result.error}`)
      }
    } catch (error) {
      console.error('迁移错误:', error)
      setStatus('error')
      setMessage(`❌ 迁移失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Cloud className="h-8 w-8" />
          迁移到云端存储
        </h1>
        <p className="text-muted-foreground">
          将您的数据从浏览器缓存迁移到Supabase云端，彻底解决存储空间不足问题
        </p>
      </div>

      {/* 状态提示 */}
      {status !== 'idle' && (
        <Alert variant={status === 'error' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {status === 'migrating' && <Loader2 className="h-4 w-4 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'error' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* 迁移结果 */}
      {stats && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700">迁移成功！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>消息数量：</span>
              <span className="font-bold text-green-700">{stats.messages} 条</span>
            </div>
            <div className="flex justify-between">
              <span>话题数量：</span>
              <span className="font-bold text-green-700">{stats.topics} 个</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 迁移说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            迁移说明
          </CardTitle>
          <CardDescription>
            一键将所有数据迁移到Supabase云端数据库
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p className="font-medium">迁移后的好处：</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>✅ 无存储容量限制（Supabase免费版提供500MB）</li>
              <li>✅ 数据永久保存，不会因清除缓存而丢失</li>
              <li>✅ 多设备同步，随时随地访问数据</li>
              <li>✅ 自动备份，数据更安全</li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-medium text-amber-600">注意事项：</p>
            <ul className="list-disc list-inside space-y-1 text-amber-600">
              <li>迁移过程中请勿关闭页面</li>
              <li>迁移完成后建议刷新页面</li>
              <li>原localStorage数据不会被删除，作为备份保留</li>
            </ul>
          </div>

          <Button 
            onClick={handleMigrate}
            disabled={status === 'migrating'}
            className="w-full"
            size="lg"
          >
            {status === 'migrating' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                正在迁移中...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                开始迁移到云端
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 云端优势 */}
      <Card className="border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-700">为什么选择Supabase？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>完全免费，无需信用卡</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>PostgreSQL数据库，性能强大</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>实时同步，多设备无缝切换</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>自动备份，数据安全有保障</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

