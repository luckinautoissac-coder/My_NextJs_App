'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Trash2 } from 'lucide-react'

export default function DataCleanupPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const cleanupAgentData = (agentIds: string[]) => {
    try {
      // 清理 topic-store
      const topicStoreData = localStorage.getItem('topic-store')
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        if (topicStore.state && topicStore.state.topics) {
          const originalTopicCount = topicStore.state.topics.length
          topicStore.state.topics = topicStore.state.topics.filter(
            (topic: any) => !agentIds.includes(topic.agentId)
          )
          const removedTopics = originalTopicCount - topicStore.state.topics.length
          localStorage.setItem('topic-store', JSON.stringify(topicStore))
          
          // 清理 chat-store 中相关的消息
          const chatStoreData = localStorage.getItem('chat-store')
          if (chatStoreData) {
            const chatStore = JSON.parse(chatStoreData)
            if (chatStore.state && chatStore.state.messages) {
              const originalMessageCount = chatStore.state.messages.length
              const topicIds = topicStore.state.topics.map((t: any) => t.id)
              chatStore.state.messages = chatStore.state.messages.filter(
                (msg: any) => topicIds.includes(msg.topicId)
              )
              const removedMessages = originalMessageCount - chatStore.state.messages.length
              localStorage.setItem('chat-store', JSON.stringify(chatStore))
              
              setStatus('success')
              setMessage(`成功清理数据！删除了 ${removedTopics} 个话题和 ${removedMessages} 条消息。`)
            }
          }
        }
      }
    } catch (error) {
      console.error('清理数据时出错:', error)
      setStatus('error')
      setMessage(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const cleanupProblemAgents = () => {
    // FUJICL-报价优化助理 和 MU-Annie的业务助理 的ID
    const problemAgentIds = [
      'fujicl-quotation-optimization-assistant',
      'mu-annie-business-assistant'
    ]
    cleanupAgentData(problemAgentIds)
  }

  const cleanupAllData = () => {
    if (confirm('确定要清除所有对话数据吗？此操作不可恢复！')) {
      try {
        localStorage.removeItem('chat-store')
        localStorage.removeItem('topic-store')
        setStatus('success')
        setMessage('已清除所有对话数据，请刷新页面。')
      } catch (error) {
        setStatus('error')
        setMessage(`清理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据清理工具</h1>
        <p className="text-muted-foreground">
          清理有问题的智能体数据，解决应用加载错误
        </p>
      </div>

      {status !== 'idle' && (
        <Alert className="mb-6" variant={status === 'success' ? 'default' : 'destructive'}>
          {status === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>清理问题智能体数据</CardTitle>
            <CardDescription>
              清除 FUJICL-报价优化助理 和 MU-Annie的业务助理 的历史对话数据。
              这将删除这两个智能体的所有话题和消息，但保留其他智能体的数据。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={cleanupProblemAgents} variant="default">
              <Trash2 className="w-4 h-4 mr-2" />
              清理问题智能体数据
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">清除所有数据</CardTitle>
            <CardDescription>
              删除所有智能体的对话历史。此操作不可恢复，请谨慎使用。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={cleanupAllData} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              清除所有对话数据
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. 点击"清理问题智能体数据"按钮</p>
            <p>2. 等待清理完成的提示</p>
            <p>3. 刷新浏览器页面（F5 或 Ctrl+R）</p>
            <p>4. 尝试打开之前有问题的智能体</p>
            <p className="text-orange-600 dark:text-orange-400 mt-4">
              ⚠️ 注意：清理后，这两个智能体的历史对话将被删除，无法恢复。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

