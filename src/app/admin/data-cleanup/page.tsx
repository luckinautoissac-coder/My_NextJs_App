'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DataCleanupPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<{
    topicsDeleted: number
    messagesDeleted: number
  } | null>(null)

  const problemAgentIds = [
    'mu-annie-business-assistant',
    'fujicl-quotation-optimization-assistant'
  ]

  const cleanupAgentData = () => {
    setIsProcessing(true)
    try {
      // 读取现有数据
      const topicStoreData = localStorage.getItem('topic-store')
      const chatStoreData = localStorage.getItem('chat-store')

      let topicsDeleted = 0
      let messagesDeleted = 0

      // 清理话题数据
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        if (topicStore.state?.topics) {
          const originalTopicsCount = topicStore.state.topics.length
          
          // 过滤掉问题智能体的话题
          topicStore.state.topics = topicStore.state.topics.filter(
            (topic: any) => !problemAgentIds.includes(topic.agentId)
          )
          
          topicsDeleted = originalTopicsCount - topicStore.state.topics.length
          
          // 如果当前选中的话题是被删除的，清空选择
          if (topicStore.state.currentTopicId) {
            const topicExists = topicStore.state.topics.some(
              (t: any) => t.id === topicStore.state.currentTopicId
            )
            if (!topicExists) {
              topicStore.state.currentTopicId = null
            }
          }
          
          localStorage.setItem('topic-store', JSON.stringify(topicStore))
        }
      }

      // 清理消息数据
      if (chatStoreData) {
        const chatStore = JSON.parse(chatStoreData)
        if (chatStore.state?.messages) {
          const originalMessagesCount = chatStore.state.messages.length
          
          // 获取所有问题智能体的话题ID
          const problemTopicIds = new Set<string>()
          if (topicStoreData) {
            const topicStore = JSON.parse(topicStoreData)
            if (topicStore.state?.topics) {
              topicStore.state.topics.forEach((topic: any) => {
                if (problemAgentIds.includes(topic.agentId)) {
                  problemTopicIds.add(topic.id)
                }
              })
            }
          }
          
          // 过滤掉这些话题的消息
          chatStore.state.messages = chatStore.state.messages.filter(
            (message: any) => !problemTopicIds.has(message.topicId)
          )
          
          messagesDeleted = originalMessagesCount - chatStore.state.messages.length
          
          localStorage.setItem('chat-store', JSON.stringify(chatStore))
        }
      }

      setCleanupResult({ topicsDeleted, messagesDeleted })
      
      if (topicsDeleted > 0 || messagesDeleted > 0) {
        toast.success('数据清理完成', {
          description: `已删除 ${topicsDeleted} 个话题和 ${messagesDeleted} 条消息`
        })
      } else {
        toast.info('未发现需要清理的数据')
      }
    } catch (error) {
      console.error('数据清理失败:', error)
      toast.error('数据清理失败，请查看控制台了解详情')
    } finally {
      setIsProcessing(false)
    }
  }

  const clearAllData = () => {
    if (confirm('确定要清除所有智能体的历史数据吗？此操作不可恢复！')) {
      try {
        localStorage.removeItem('topic-store')
        localStorage.removeItem('chat-store')
        setCleanupResult(null)
        toast.success('所有历史数据已清除')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } catch (error) {
        console.error('清除数据失败:', error)
        toast.error('清除数据失败')
      }
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据清理工具</h1>
        <p className="text-muted-foreground">
          清理可能导致智能体无法加载的历史数据
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              问题诊断
            </CardTitle>
            <CardDescription>
              如果 FUJICL-报价优化助理 或 MU-Annie的业务助理 无法打开，可能是因为历史数据不兼容
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>问题原因：</strong>恢复的历史数据可能包含旧版本格式，与更新后的智能体配置不兼容。
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  <strong>解决方案：</strong>
                </p>
                <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1 list-disc list-inside">
                  <li>清理这两个智能体的历史对话数据（推荐）</li>
                  <li>或清除所有历史数据重新开始</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>清理选项</CardTitle>
            <CardDescription>
              选择一个清理方案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">清理问题智能体数据（推荐）</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    仅删除以下智能体的历史对话：
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• FUJICL-报价优化助理</li>
                    <li>• MU-Annie的业务助理</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    其他智能体的数据将保留
                  </p>
                </div>
                <Button
                  onClick={cleanupAgentData}
                  disabled={isProcessing}
                  className="ml-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isProcessing ? '处理中...' : '清理'}
                </Button>
              </div>

              <div className="flex items-start justify-between p-4 border border-destructive/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-destructive">清除所有数据</h3>
                  <p className="text-sm text-muted-foreground">
                    删除所有智能体的历史对话。此操作不可恢复！
                  </p>
                </div>
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  className="ml-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  全部清除
                </Button>
              </div>
            </div>

            {cleanupResult && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      清理完成
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      已删除 <strong>{cleanupResult.topicsDeleted}</strong> 个话题和{' '}
                      <strong>{cleanupResult.messagesDeleted}</strong> 条消息
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                      现在可以尝试重新打开这两个智能体了
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>操作说明</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>点击"清理"按钮清除问题智能体的历史数据</li>
              <li>清理完成后，返回首页</li>
              <li>尝试打开 FUJICL-报价优化助理 或 MU-Annie的业务助理</li>
              <li>如果仍有问题，可以选择"全部清除"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

