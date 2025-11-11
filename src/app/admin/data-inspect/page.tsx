'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DataInspectPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [problemTopics, setProblemTopics] = useState<any[]>([])

  const problemAgentIds = [
    'mu-annie-business-assistant',
    'fujicl-quotation-optimization-assistant'
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      // 读取话题数据
      const topicStoreData = localStorage.getItem('topic-store')
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        const allTopics = topicStore.state?.topics || []
        setTopics(allTopics)

        // 找出问题智能体的话题
        const problematicTopics = allTopics.filter((topic: any) => 
          problemAgentIds.includes(topic.agentId)
        )
        setProblemTopics(problematicTopics)
      }

      // 读取消息数据
      const chatStoreData = localStorage.getItem('chat-store')
      if (chatStoreData) {
        const chatStore = JSON.parse(chatStoreData)
        setMessages(chatStore.state?.messages || [])
      }
    } catch (error) {
      console.error('读取数据失败:', error)
      toast.error('读取数据失败，请查看控制台')
    }
  }

  const getMessagesForTopic = (topicId: string) => {
    return messages.filter(m => m.topicId === topicId)
  }

  const deleteProblemTopics = () => {
    if (!confirm('确定要删除这些话题吗？此操作不可恢复！')) {
      return
    }

    try {
      // 删除问题话题
      const topicStoreData = localStorage.getItem('topic-store')
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        topicStore.state.topics = topicStore.state.topics.filter(
          (topic: any) => !problemAgentIds.includes(topic.agentId)
        )
        localStorage.setItem('topic-store', JSON.stringify(topicStore))
      }

      // 删除相关消息
      const chatStoreData = localStorage.getItem('chat-store')
      if (chatStoreData) {
        const chatStore = JSON.parse(chatStoreData)
        const problemTopicIds = new Set(problemTopics.map(t => t.id))
        chatStore.state.messages = chatStore.state.messages.filter(
          (message: any) => !problemTopicIds.has(message.topicId)
        )
        localStorage.setItem('chat-store', JSON.stringify(chatStore))
      }

      toast.success('已删除问题话题和消息')
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const exportProblemData = () => {
    try {
      const problemTopicIds = problemTopics.map(t => t.id)
      const problemMessages = messages.filter(m => problemTopicIds.includes(m.topicId))

      const data = {
        exportTime: new Date().toISOString(),
        topics: problemTopics,
        messages: problemMessages
      }

      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `problem-data-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('问题数据已导出')
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败')
    }
  }

  const getAgentName = (agentId: string) => {
    const names: any = {
      'mu-annie-business-assistant': 'MU-Annie的业务助理',
      'fujicl-quotation-optimization-assistant': 'FUJICL-报价优化助理'
    }
    return names[agentId] || agentId
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据检查工具</h1>
        <p className="text-muted-foreground">
          检查问题智能体的历史数据
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              数据概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{topics.length}</div>
                <div className="text-sm text-muted-foreground">总话题数</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-destructive">{problemTopics.length}</div>
                <div className="text-sm text-muted-foreground">问题智能体话题</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{messages.length}</div>
                <div className="text-sm text-muted-foreground">总消息数</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {problemTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>问题智能体的话题列表</CardTitle>
              <CardDescription>
                以下话题可能导致智能体无法打开
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {problemTopics.map((topic) => {
                  const topicMessages = getMessagesForTopic(topic.id)
                  return (
                    <Alert key={topic.id} variant="destructive">
                      <div className="space-y-2">
                        <div>
                          <strong>智能体：</strong> {getAgentName(topic.agentId)}
                        </div>
                        <div>
                          <strong>话题名称：</strong> {topic.title || topic.name || '未命名'}
                        </div>
                        <div>
                          <strong>消息数量：</strong> {topicMessages.length}
                        </div>
                        <div>
                          <strong>创建时间：</strong> {new Date(topic.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <strong>话题ID：</strong> <code className="text-xs">{topic.id}</code>
                        </div>
                      </div>
                    </Alert>
                  )
                })}

                <div className="flex gap-3 mt-6">
                  <Button onClick={exportProblemData} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    导出问题数据
                  </Button>
                  <Button onClick={deleteProblemTopics} variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    删除所有问题话题
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {problemTopics.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <p>未发现问题智能体的历史数据</p>
                <p className="text-sm mt-2">如果智能体仍然无法打开，请查看浏览器控制台的错误信息</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>诊断建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>如果发现问题话题：</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                  <li>先导出问题数据（备份）</li>
                  <li>然后删除这些话题</li>
                  <li>刷新页面，尝试重新打开智能体</li>
                </ul>
              </div>
              
              <div>
                <strong>如果没有问题话题，但智能体仍打不开：</strong>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-muted-foreground">
                  <li>按F12打开浏览器控制台</li>
                  <li>尝试打开智能体</li>
                  <li>查看控制台中的红色错误信息</li>
                  <li>将错误信息发送给开发者</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

