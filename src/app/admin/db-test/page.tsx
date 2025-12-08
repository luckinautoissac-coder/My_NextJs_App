'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function DatabaseTestPage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const testConnection = async () => {
    setStatus('testing')
    setError('')
    setResult(null)

    try {
      // 测试读取消息
      const response = await fetch('/api/messages')
      
      if (!response.ok) {
        throw new Error(`API返回错误: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      setResult({
        success: true,
        messageCount: data.length,
        messages: data.slice(0, 5), // 只显示前5条
        apiStatus: 'OK'
      })
      setStatus('success')

    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setStatus('error')
    }
  }

  const testWrite = async () => {
    setStatus('testing')
    setError('')

    try {
      const testMessage = {
        id: 'test_' + Date.now(),
        content: '测试消息',
        role: 'user',
        timestamp: new Date().toISOString(),
        status: 'sent',
        messageType: 'normal'
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      })

      if (!response.ok) {
        throw new Error(`写入失败: ${response.status}`)
      }

      setResult({ success: true, message: '✅ 写入测试成功！' })
      setStatus('success')

    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
      setStatus('error')
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">VPS数据库连接测试</h1>
        <p className="text-muted-foreground">
          诊断VPS MySQL数据库连接和数据读写状态
        </p>
      </div>

      {/* 状态提示 */}
      {status === 'success' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            ✅ 测试成功！数据库连接正常
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>❌ 测试失败</div>
              <div className="text-sm font-mono bg-black/10 p-2 rounded">
                {error}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 测试按钮 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            数据库测试
          </CardTitle>
          <CardDescription>
            点击按钮测试VPS数据库连接和数据读取
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={testConnection}
            disabled={status === 'testing'}
            className="w-full"
            size="lg"
          >
            {status === 'testing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                测试读取消息
              </>
            )}
          </Button>

          <Button
            onClick={testWrite}
            disabled={status === 'testing'}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {status === 'testing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                测试写入消息
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.messageCount !== undefined && (
                <>
                  <div className="flex justify-between items-center">
                    <span>API状态：</span>
                    <span className="text-green-600 font-bold">{result.apiStatus}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>VPS中的消息数量：</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {result.messageCount} 条
                    </span>
                  </div>
                  
                  {result.messageCount > 0 && (
                    <div className="space-y-2">
                      <div className="font-semibold">前5条消息预览：</div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.messages.map((msg: any, index: number) => (
                          <div key={index} className="p-3 bg-muted rounded text-sm">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{msg.role}</span>
                              <span>{new Date(msg.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="line-clamp-2">{msg.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.messageCount === 0 && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>⚠️ VPS数据库中没有消息！</div>
                          <div className="text-sm">
                            可能的原因：
                            <ul className="list-disc list-inside mt-2">
                              <li>数据还没有导入到VPS</li>
                              <li>导入时出现了错误</li>
                              <li>数据库连接配置错误</li>
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {result.message && (
                <div className="text-green-600 font-semibold">
                  {result.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span>🔍</span>
            <span>这个测试会检查VPS数据库中是否有消息数据</span>
          </div>
          <div className="flex items-start gap-2">
            <span>📊</span>
            <span>如果显示0条消息，说明数据还没有导入到VPS</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>如果显示有消息，说明VPS数据库正常，问题可能在前端加载</span>
          </div>
          <div className="flex items-start gap-2">
            <span>❌</span>
            <span>如果显示连接错误，说明VPS数据库配置有问题</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

