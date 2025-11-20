'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { useChatStore } from '@/store/chatStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'

export default function DebugUIPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  
  const agentStore = useAgentStore()
  const topicStore = useTopicStore()
  const chatStore = useChatStore()
  const apiStore = useAPISettingsStore()

  const runDiagnostics = () => {
    const results = {
      stores: {
        agents: {
          count: agentStore.agents.length,
          currentAgentId: agentStore.currentAgentId,
          status: agentStore.agents.length > 0 ? 'ok' : 'warning'
        },
        topics: {
          count: topicStore.topics.length,
          currentTopicId: topicStore.currentTopicId,
          status: 'ok'
        },
        messages: {
          count: chatStore.messages.length,
          isLoading: chatStore.isLoading,
          loadingTopics: chatStore.loadingTopics,
          status: 'ok'
        },
        api: {
          hasApiKey: !!apiStore.apiKey,
          selectedModel: apiStore.selectedModel,
          baseUrl: apiStore.baseUrl,
          status: apiStore.apiKey ? 'ok' : 'error'
        }
      },
      components: {
        ChatInput: {
          exists: true,
          visible: typeof document !== 'undefined' ? !!document.querySelector('[class*="border-t"]') : 'unknown',
          status: 'checking'
        }
      },
      browser: {
        localStorage: typeof window !== 'undefined' ? Object.keys(localStorage).length : 0,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      }
    }
    
    setDiagnostics(results)
  }

  const clearAllData = () => {
    if (confirm('确定要清除所有本地数据吗？这将删除所有消息、话题和设置。')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>UI 诊断工具</CardTitle>
          <CardDescription>
            检查应用状态和组件可见性
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDiagnostics}>
              运行诊断
            </Button>
            <Button variant="destructive" onClick={clearAllData}>
              清除所有数据并重启
            </Button>
          </div>

          {diagnostics && (
            <div className="space-y-4 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>诊断结果</AlertTitle>
                <AlertDescription>
                  <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
                    {JSON.stringify(diagnostics, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>

              {/* 状态检查 */}
              <div className="space-y-2">
                <h3 className="font-medium">状态检查</h3>
                
                <div className="flex items-center gap-2">
                  {diagnostics.stores.api.hasApiKey ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>API Key: {diagnostics.stores.api.hasApiKey ? '已配置' : '未配置'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {diagnostics.stores.agents.count > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>智能体: {diagnostics.stores.agents.count} 个</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>话题: {diagnostics.stores.topics.count} 个</span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>消息: {diagnostics.stores.messages.count} 条</span>
                </div>
              </div>
            </div>
          )}

          <Alert variant="default">
            <AlertTitle>常见问题解决方案</AlertTitle>
            <AlertDescription className="space-y-2 text-sm mt-2">
              <p><strong>1. 输入框不见了？</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>尝试刷新页面（Ctrl+R 或 Cmd+R）</li>
                <li>清除浏览器缓存（Ctrl+Shift+Delete）</li>
                <li>尝试强制刷新（Ctrl+Shift+R 或 Cmd+Shift+R）</li>
                <li>如果仍然不行，点击上方"清除所有数据并重启"</li>
              </ul>
              
              <p className="mt-3"><strong>2. 检查浏览器控制台</strong></p>
              <ul className="list-disc pl-5 space-y-1">
                <li>按 F12 打开开发者工具</li>
                <li>查看 Console 标签是否有错误信息</li>
                <li>将错误信息截图反馈给开发者</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

