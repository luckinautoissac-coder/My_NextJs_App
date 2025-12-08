'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Server } from 'lucide-react'

export default function VPSDiagnosePage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<any[]>([])

  const runDiagnosis = async () => {
    setStatus('checking')
    setResults([])

    const checks: any[] = []

    // 检查1：数据库连接
    checks.push({ name: '数据库连接测试', status: 'checking', message: '正在测试...' })
    setResults([...checks])

    try {
      const dbResponse = await fetch('/api/db-test', { method: 'POST' })
      const dbData = await dbResponse.json()

      if (dbData.success) {
        checks[0] = { name: '数据库连接测试', status: 'success', message: '✅ 连接成功' }
      } else {
        checks[0] = { name: '数据库连接测试', status: 'error', message: '❌ 连接失败: ' + dbData.error }
      }
      setResults([...checks])
    } catch (error) {
      checks[0] = { name: '数据库连接测试', status: 'error', message: '❌ 网络错误: ' + (error instanceof Error ? error.message : '未知错误') }
      setResults([...checks])
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // 检查2：数据库表结构
    checks.push({ name: '数据库表结构检查', status: 'checking', message: '正在检查...' })
    setResults([...checks])

    try {
      const setupResponse = await fetch('/api/db-setup', { method: 'POST' })
      const setupData = await setupResponse.json()

      if (setupData.success) {
        if (setupData.alreadyUpToDate) {
          checks[1] = { name: '数据库表结构检查', status: 'success', message: '✅ 表结构正常' }
        } else {
          checks[1] = { name: '数据库表结构检查', status: 'success', message: '✅ 表结构已更新: ' + setupData.updates.join(', ') }
        }
      } else {
        checks[1] = { name: '数据库表结构检查', status: 'error', message: '❌ 检查失败: ' + setupData.error }
      }
      setResults([...checks])
    } catch (error) {
      checks[1] = { name: '数据库表结构检查', status: 'error', message: '❌ 网络错误' }
      setResults([...checks])
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // 检查3：读取消息
    checks.push({ name: '读取VPS消息数据', status: 'checking', message: '正在读取...' })
    setResults([...checks])

    try {
      const messagesResponse = await fetch('/api/messages')
      const messagesData = await messagesResponse.json()

      if (Array.isArray(messagesData) && messagesData.length > 0) {
        checks[2] = { name: '读取VPS消息数据', status: 'success', message: `✅ 成功读取 ${messagesData.length} 条消息` }
      } else if (Array.isArray(messagesData)) {
        checks[2] = { name: '读取VPS消息数据', status: 'warning', message: '⚠️ VPS中没有消息数据' }
      } else {
        checks[2] = { name: '读取VPS消息数据', status: 'error', message: '❌ 读取失败' }
      }
      setResults([...checks])
    } catch (error) {
      checks[2] = { name: '读取VPS消息数据', status: 'error', message: '❌ 网络错误' }
      setResults([...checks])
    }

    // 最终结果
    const hasError = checks.some(c => c.status === 'error')
    setStatus(hasError ? 'error' : 'success')
  }

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🔧 VPS连接诊断</h1>
        <p className="text-muted-foreground">
          自动诊断VPS数据库连接问题并提供解决方案
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>开始诊断</CardTitle>
          <CardDescription>
            点击下方按钮开始自动诊断VPS连接状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runDiagnosis}
            disabled={status === 'checking'}
            className="w-full"
            size="lg"
          >
            {status === 'checking' ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                正在诊断中...
              </>
            ) : (
              <>
                <Server className="h-5 w-5 mr-2" />
                开始诊断
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-medium">诊断结果：</h3>
              {results.map((result, index) => (
                <Alert
                  key={index}
                  variant={result.status === 'error' ? 'destructive' : 'default'}
                  className={
                    result.status === 'success' ? 'border-green-500 bg-green-50' :
                    result.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    result.status === 'checking' ? 'border-blue-500 bg-blue-50' : ''
                  }
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {result.status === 'error' && <AlertCircle className="h-4 w-4" />}
                    {result.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    {result.status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    <div>
                      <strong>{result.name}</strong>
                      <p className="text-sm mt-1">{result.message}</p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {status === 'error' && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="block mb-2">❌ VPS连接失败！</strong>
                <p className="text-sm mb-2">可能的原因：</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>VPS MySQL服务停止了</li>
                  <li>防火墙端口3306被关闭了</li>
                  <li>网络连接问题</li>
                  <li>Vercel到VPS的连接超时</li>
                </ul>
                <p className="text-sm mt-3 font-medium">📋 修复步骤：</p>
                <ol className="list-decimal list-inside text-sm space-y-1 mt-1">
                  <li>SSH连接到VPS</li>
                  <li>执行：sudo systemctl status mysql（检查MySQL状态）</li>
                  <li>如果stopped，执行：sudo systemctl start mysql</li>
                  <li>执行：sudo systemctl restart mysql（重启MySQL）</li>
                  <li>执行：sudo ufw status（检查防火墙）</li>
                  <li>如果3306端口未开放，执行：sudo ufw allow 3306/tcp</li>
                  <li>返回此页面重新诊断</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert className="border-green-500 bg-green-50 mt-6">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                <strong className="block mb-2">✅ VPS连接正常！</strong>
                <p className="text-sm">所有检查都通过了，现在可以使用快速导入工具了！</p>
                <Button
                  onClick={() => window.location.href = '/admin/quick-import'}
                  className="mt-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  前往快速导入
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>提示：</strong>
          <p className="text-sm mt-1">
            如果诊断显示连接失败，可能需要在VPS上重启MySQL服务。
            这是因为MySQL服务有时会自动停止或达到连接数上限。
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

