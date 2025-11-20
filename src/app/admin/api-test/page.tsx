'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function APITestPage() {
  const [apiKey, setApiKey] = useState('')
  const [testMessage, setTestMessage] = useState('你好，请做一个自我介绍')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('请输入 API Key')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // 测试 API 连接
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          agentId: 'general-assistant',
          apiKey: apiKey,
          model: 'gpt-4o-mini',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'API 测试成功！',
          details: {
            status: response.status,
            response: data.response?.substring(0, 200) + (data.response?.length > 200 ? '...' : ''),
          }
        })
        toast.success('API 连接正常')
      } else {
        setTestResult({
          success: false,
          message: 'API 测试失败',
          details: {
            status: response.status,
            error: data.error || '未知错误',
          }
        })
        toast.error(data.error || 'API 测试失败')
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '网络连接失败',
        details: {
          error: error instanceof Error ? error.message : '未知错误',
        }
      })
      toast.error('网络连接失败，请检查网络')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>API 连接测试</CardTitle>
          <CardDescription>
            测试您的 API Key 是否可以正常工作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              placeholder="请输入您的 AIHUBMIX API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              您可以从 <a href="https://aihubmix.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">AIHUBMIX</a> 获取 API Key
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">测试消息</label>
            <Textarea
              placeholder="输入测试消息"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleTest} 
            disabled={testing || !apiKey.trim()}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                测试中...
              </>
            ) : (
              '开始测试'
            )}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="flex-1">
                  <AlertTitle>{testResult.message}</AlertTitle>
                  {testResult.details && (
                    <AlertDescription>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>常见问题</AlertTitle>
            <AlertDescription className="space-y-2 text-sm">
              <p>1. <strong>API Key 无效：</strong>请检查您的 API Key 是否正确</p>
              <p>2. <strong>网络连接失败：</strong>请检查网络连接或防火墙设置</p>
              <p>3. <strong>请求过于频繁：</strong>请稍后重试</p>
              <p>4. <strong>余额不足：</strong>请检查 AIHUBMIX 账户余额</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

