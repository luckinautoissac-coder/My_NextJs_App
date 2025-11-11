'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function AgentTestPage() {
  const [testResults, setTestResults] = useState<{
    [key: string]: {
      status: 'success' | 'error'
      error?: string
      promptLength?: number
    }
  }>({})

  const agentsToTest = [
    'mu-annie-business-assistant',
    'fujicl-quotation-optimization-assistant',
    'fujicl-ivy-business-assistant',
    'general-assistant'
  ]

  const testAgent = async (agentId: string) => {
    try {
      // 测试1: 尝试获取智能体配置
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          agentId: agentId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        setTestResults(prev => ({
          ...prev,
          [agentId]: {
            status: 'error',
            error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
          }
        }))
        return
      }

      // 测试通过
      setTestResults(prev => ({
        ...prev,
        [agentId]: {
          status: 'success',
        }
      }))
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [agentId]: {
          status: 'error',
          error: error.message || String(error)
        }
      }))
    }
  }

  const testAllAgents = async () => {
    setTestResults({})
    for (const agentId of agentsToTest) {
      await testAgent(agentId)
      // 延迟一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  // 客户端配置测试
  const testClientConfig = () => {
    const results: any = {}
    
    // 模拟智能体配置（简化版，只测试字符串模板）
    const testConfigs = {
      'mu-annie-business-assistant': {
        test: 'MU-Annie的业务助理'
      },
      'fujicl-quotation-optimization-assistant': {
        test: 'FUJICL-报价优化助理'
      },
      'fujicl-ivy-business-assistant': {
        test: 'FUJICL-Ivy业务助理'
      }
    }

    Object.entries(testConfigs).forEach(([key, config]) => {
      try {
        // 测试配置是否可以正常访问
        const testStr = JSON.stringify(config)
        results[key] = {
          status: 'success',
          configSize: testStr.length
        }
      } catch (error: any) {
        results[key] = {
          status: 'error',
          error: error.message
        }
      }
    })

    return results
  }

  const getAgentName = (agentId: string) => {
    const names: any = {
      'mu-annie-business-assistant': 'MU-Annie的业务助理',
      'fujicl-quotation-optimization-assistant': 'FUJICL-报价优化助理',
      'fujicl-ivy-business-assistant': 'FUJICL-Ivy业务助理',
      'general-assistant': '通用智能体'
    }
    return names[agentId] || agentId
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">智能体配置测试工具</h1>
        <p className="text-muted-foreground">
          诊断智能体配置是否存在问题
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>测试智能体配置</CardTitle>
            <CardDescription>
              点击按钮测试所有智能体的配置是否正常
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testAllAgents} className="w-full">
              开始测试
            </Button>
          </CardContent>
        </Card>

        {Object.keys(testResults).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agentsToTest.map(agentId => {
                  const result = testResults[agentId]
                  if (!result) return null

                  return (
                    <Alert
                      key={agentId}
                      variant={result.status === 'error' ? 'destructive' : 'default'}
                      className={result.status === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : ''}
                    >
                      <div className="flex items-start gap-3">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold mb-1">
                            {getAgentName(agentId)}
                          </div>
                          {result.status === 'success' ? (
                            <AlertDescription className="text-green-800 dark:text-green-200">
                              ✅ 配置正常，可以正常使用
                            </AlertDescription>
                          ) : (
                            <AlertDescription>
                              <div className="space-y-1">
                                <div>❌ 配置错误</div>
                                <div className="text-sm font-mono bg-destructive/10 p-2 rounded mt-2 overflow-x-auto">
                                  {result.error}
                                </div>
                              </div>
                            </AlertDescription>
                          )}
                        </div>
                      </div>
                    </Alert>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>常见问题排查</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">如果测试失败，可能的原因：</h3>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li>systemPrompt 中包含未转义的特殊字符（如反引号、美元符号等）</li>
                  <li>systemPrompt 过长导致请求超时</li>
                  <li>API 配置错误（API Key、模型名称等）</li>
                  <li>服务端代码语法错误</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">解决方案：</h3>
                <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>检查 src/app/api/chat/route.ts 文件中的智能体配置</li>
                  <li>确保 systemPrompt 中没有反引号 (`) 或使用 ${'{'}变量{'}'} 的语法</li>
                  <li>检查是否有未闭合的引号或括号</li>
                  <li>查看浏览器控制台的详细错误信息</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

