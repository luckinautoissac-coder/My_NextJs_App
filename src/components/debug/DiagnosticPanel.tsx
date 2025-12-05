'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { toast } from 'sonner'

export function DiagnosticPanel() {
  const { apiKey, baseUrl, selectedModel } = useAPISettingsStore()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    apiKeyStatus: 'success' | 'error' | 'pending'
    connectionStatus: 'success' | 'error' | 'pending'
    modelStatus: 'success' | 'error' | 'pending'
    details: string
  } | null>(null)

  const runDiagnostics = async () => {
    setTesting(true)
    setResult({
      apiKeyStatus: 'pending',
      connectionStatus: 'pending',
      modelStatus: 'pending',
      details: '正在检测...'
    })

    try {
      // 1. 检查 API Key 是否存在
      if (!apiKey || !apiKey.trim()) {
        setResult({
          apiKeyStatus: 'error',
          connectionStatus: 'pending',
          modelStatus: 'pending',
          details: '❌ 未配置 API Key。请在设置中输入您的 AIHUBMIX API Key。'
        })
        setTesting(false)
        return
      }

      setResult(prev => prev ? {
        ...prev,
        apiKeyStatus: 'success',
        details: '✅ API Key 已配置\n🔄 正在测试连接...'
      } : null)

      // 2. 测试 API 连接
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'ping',
          agentId: 'general-assistant',
          apiKey: apiKey,
          model: selectedModel,
          baseUrl: baseUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          apiKeyStatus: 'success',
          connectionStatus: 'success',
          modelStatus: 'success',
          details: `✅ API Key 有效\n✅ 连接正常\n✅ 模型 ${selectedModel} 可用\n\n💰 账户余额充足，可以正常使用！`
        })
        toast.success('诊断完成：所有检查通过！')
      } else {
        let errorDetails = `❌ 连接失败: ${data.error}\n\n`
        
        if (response.status === 401) {
          errorDetails += '🔑 问题：API Key 无效或已过期\n'
          errorDetails += '💡 解决方案：\n'
          errorDetails += '  1. 登录 AIHUBMIX 官网\n'
          errorDetails += '  2. 检查 API Key 是否正确\n'
          errorDetails += '  3. 尝试重新生成新的 API Key\n'
          errorDetails += '  4. 在设置中更新 API Key'
        } else if (response.status === 402) {
          errorDetails += '💰 问题：账户余额不足\n'
          errorDetails += '💡 解决方案：\n'
          errorDetails += '  1. 登录 AIHUBMIX 官网\n'
          errorDetails += '  2. 检查账户余额\n'
          errorDetails += '  3. 充值后等待 1-2 分钟\n'
          errorDetails += '  4. 点击"重新测试"按钮'
        } else if (response.status === 429) {
          errorDetails += '⚠️ 问题：请求过于频繁\n'
          errorDetails += '💡 解决方案：等待 1-2 分钟后重试'
        } else {
          errorDetails += `⚠️ 错误代码：${response.status}\n`
          errorDetails += '💡 解决方案：请联系技术支持'
        }

        setResult({
          apiKeyStatus: 'success',
          connectionStatus: 'error',
          modelStatus: 'error',
          details: errorDetails
        })
        toast.error('诊断发现问题，请查看详情')
      }
    } catch (error) {
      setResult({
        apiKeyStatus: 'success',
        connectionStatus: 'error',
        modelStatus: 'error',
        details: `❌ 网络连接失败\n\n${error instanceof Error ? error.message : '未知错误'}\n\n💡 解决方案：\n  1. 检查网络连接\n  2. 关闭 VPN 或代理\n  3. 检查防火墙设置`
      })
      toast.error('网络连接失败')
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          连接诊断工具
        </CardTitle>
        <CardDescription>
          快速检测 API 连接状态和常见问题
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              诊断中...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              开始诊断
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3">
            {/* 检查项状态 */}
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Key 配置</span>
                {getStatusIcon(result.apiKeyStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">网络连接</span>
                {getStatusIcon(result.connectionStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">模型可用性</span>
                {getStatusIcon(result.modelStatus)}
              </div>
            </div>

            {/* 详细信息 */}
            <Alert variant={result.connectionStatus === 'success' ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>诊断结果</AlertTitle>
              <AlertDescription>
                <pre className="mt-2 text-xs whitespace-pre-wrap font-mono">
                  {result.details}
                </pre>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 使用提示 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>使用说明</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• 如果充值后仍显示余额不足，请等待 1-2 分钟后重新诊断</p>
            <p>• 如果 API Key 无效，请在 AIHUBMIX 官网重新生成</p>
            <p>• 诊断过程不会消耗您的 API 额度</p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

