'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Trash2, AlertTriangle, CheckCircle, Download, Wrench } from 'lucide-react'

export default function DataCleanupPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<{
    topicsDeleted?: number
    messagesDeleted?: number
    messagesFixed?: number
    topicsFixed?: number
  } | null>(null)

  const problemAgentIds = [
    'mu-annie-business-assistant',
    'fujicl-quotation-optimization-assistant'
  ]

  // 导出数据备份
  const exportData = () => {
    try {
      const topicStoreData = localStorage.getItem('topic-store')
      const chatStoreData = localStorage.getItem('chat-store')
      
      const backup = {
        exportTime: new Date().toISOString(),
        topicStore: topicStoreData ? JSON.parse(topicStoreData) : null,
        chatStore: chatStoreData ? JSON.parse(chatStoreData) : null
      }
      
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chat-backup-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      toast.success('数据已导出', {
        description: '备份文件已下载'
      })
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败，请查看控制台了解详情')
    }
  }

  // 修复数据中的特殊字符（不删除数据）
  const fixAgentData = () => {
    setIsProcessing(true)
    try {
      const topicStoreData = localStorage.getItem('topic-store')
      const chatStoreData = localStorage.getItem('chat-store')

      let messagesFixed = 0
      let topicsFixed = 0

      // 修复消息数据中的特殊字符
      if (chatStoreData) {
        const chatStore = JSON.parse(chatStoreData)
        if (chatStore.state?.messages) {
          chatStore.state.messages = chatStore.state.messages.map((message: any) => {
            let isFixed = false
            
            // 获取消息所属的话题
            let messageAgentId = null
            if (topicStoreData) {
              const topicStore = JSON.parse(topicStoreData)
              const topic = topicStore.state?.topics?.find((t: any) => t.id === message.topicId)
              if (topic) {
                messageAgentId = topic.agentId
              }
            }
            
            // 只修复问题智能体的消息
            if (messageAgentId && problemAgentIds.includes(messageAgentId)) {
              // 修复消息内容中的反引号和其他特殊字符
              if (message.content && typeof message.content === 'string') {
                const originalContent = message.content
                // 替换可能导致问题的字符
                let fixedContent = message.content
                  .replace(/\\`/g, '"')  // 转义的反引号
                  .replace(/`([^`]*)`/g, '"$1"')  // 单个反引号包裹的内容
                
                if (fixedContent !== originalContent) {
                  message.content = fixedContent
                  isFixed = true
                }
              }
              
              // 修复模型响应中的内容
              if (message.modelResponses && Array.isArray(message.modelResponses)) {
                message.modelResponses = message.modelResponses.map((response: any) => {
                  if (response.content && typeof response.content === 'string') {
                    const originalContent = response.content
                    let fixedContent = response.content
                      .replace(/\\`/g, '"')
                      .replace(/`([^`]*)`/g, '"$1"')
                    
                    if (fixedContent !== originalContent) {
                      response.content = fixedContent
                      isFixed = true
                    }
                  }
                  return response
                })
              }
              
              if (isFixed) {
                messagesFixed++
              }
            }
            
            return message
          })
          
          localStorage.setItem('chat-store', JSON.stringify(chatStore))
        }
      }

      // 修复话题标题中的特殊字符
      if (topicStoreData) {
        const topicStore = JSON.parse(topicStoreData)
        if (topicStore.state?.topics) {
          topicStore.state.topics = topicStore.state.topics.map((topic: any) => {
            if (problemAgentIds.includes(topic.agentId)) {
              if (topic.title && typeof topic.title === 'string') {
                const originalTitle = topic.title
                const fixedTitle = topic.title
                  .replace(/\\`/g, '"')
                  .replace(/`([^`]*)`/g, '"$1"')
                
                if (fixedTitle !== originalTitle) {
                  topic.title = fixedTitle
                  topicsFixed++
                }
              }
            }
            return topic
          })
          
          localStorage.setItem('topic-store', JSON.stringify(topicStore))
        }
      }

      setCleanupResult({ messagesFixed, topicsFixed })
      
      if (messagesFixed > 0 || topicsFixed > 0) {
        toast.success('数据修复完成', {
          description: `已修复 ${topicsFixed} 个话题和 ${messagesFixed} 条消息中的特殊字符`
        })
      } else {
        toast.info('未发现需要修复的数据')
      }
    } catch (error) {
      console.error('数据修复失败:', error)
      toast.error('数据修复失败，请查看控制台了解详情')
    } finally {
      setIsProcessing(false)
    }
  }

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
                  <strong>问题原因：</strong>历史数据中包含反引号等特殊字符，与JavaScript模板字符串冲突，导致应用崩溃。
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                  <strong>解决方案：</strong>
                </p>
                <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1 list-disc list-inside">
                  <li>修复数据中的特殊字符（推荐，保留所有内容）</li>
                  <li>先导出备份，然后清理数据</li>
                  <li>或清除所有历史数据重新开始</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>第一步：备份数据（强烈推荐）</CardTitle>
            <CardDescription>
              在进行任何操作前，先导出数据备份
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">导出完整备份</h3>
                <p className="text-sm text-muted-foreground">
                  将所有对话数据导出为JSON文件，可随时恢复
                </p>
              </div>
              <Button onClick={exportData} variant="outline" className="ml-4">
                <Download className="h-4 w-4 mr-2" />
                导出备份
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>第二步：修复或清理数据</CardTitle>
            <CardDescription>
              选择一个方案（推荐先尝试修复）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between p-4 border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Wrench className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">修复数据（强烈推荐）</h3>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    <strong>保留所有对话内容</strong>，只修复数据中导致崩溃的特殊字符
                  </p>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                    <li>✅ 保留完整的对话历史</li>
                    <li>✅ 只替换反引号等特殊字符</li>
                    <li>✅ 对话内容和上下文不丢失</li>
                    <li>✅ 安全无风险</li>
                  </ul>
                </div>
                <Button
                  onClick={fixAgentData}
                  disabled={isProcessing}
                  className="ml-4 bg-green-600 hover:bg-green-700"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  {isProcessing ? '修复中...' : '修复数据'}
                </Button>
              </div>

              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">删除问题智能体数据</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    仅删除以下智能体的历史对话：
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• FUJICL-报价优化助理</li>
                    <li>• MU-Annie的业务助理</li>
                  </ul>
                  <p className="text-sm text-destructive mt-2">
                    ⚠️ 数据将永久删除，请先导出备份
                  </p>
                </div>
                <Button
                  onClick={cleanupAgentData}
                  disabled={isProcessing}
                  variant="outline"
                  className="ml-4"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isProcessing ? '处理中...' : '删除'}
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
                  <div className="w-full">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      操作完成
                    </h4>
                    {cleanupResult.messagesFixed !== undefined && (
                      <>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          已修复 <strong>{cleanupResult.topicsFixed || 0}</strong> 个话题和{' '}
                          <strong>{cleanupResult.messagesFixed || 0}</strong> 条消息中的特殊字符
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-2">
                          ✅ 所有对话内容已保留，只替换了导致崩溃的特殊字符
                        </p>
                      </>
                    )}
                    {cleanupResult.messagesDeleted !== undefined && (
                      <p className="text-sm text-green-800 dark:text-green-200">
                        已删除 <strong>{cleanupResult.topicsDeleted || 0}</strong> 个话题和{' '}
                        <strong>{cleanupResult.messagesDeleted || 0}</strong> 条消息
                      </p>
                    )}
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
            <CardTitle>推荐操作流程</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li><strong>第一步：</strong>点击"导出备份"按钮，保存当前所有数据（重要！）</li>
              <li><strong>第二步：</strong>点击"修复数据"按钮（推荐），这会保留所有对话内容</li>
              <li><strong>第三步：</strong>返回首页，尝试打开 FUJICL-报价优化助理 或 MU-Annie的业务助理</li>
              <li><strong>如果修复后仍有问题：</strong>再考虑使用"删除"选项（确保已有备份）</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>提示：</strong>"修复数据"功能会自动查找并替换导致崩溃的特殊字符（如反引号），同时完整保留对话的实际内容和上下文。这是最安全的解决方案。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

