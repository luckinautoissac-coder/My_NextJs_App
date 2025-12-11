'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react'
import { getUserId, saveMessageToSupabase, getMessagesFromSupabase } from '@/lib/supabase'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState('')

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const runTest = async () => {
    setStatus('testing')
    setResults([])
    setError('')

    try {
      const userId = getUserId()
      addResult(`✅ 获取用户ID成功: ${userId}`)

      // 测试1：检查环境变量
      addResult('📝 测试1：检查 Supabase 配置...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
        throw new Error('❌ Supabase URL 未配置或使用了占位符')
      }
      if (!supabaseKey || supabaseKey === 'placeholder-key') {
        throw new Error('❌ Supabase Key 未配置或使用了占位符')
      }
      
      addResult(`✅ Supabase URL: ${supabaseUrl.substring(0, 30)}...`)
      addResult(`✅ Supabase Key: ${supabaseKey.substring(0, 30)}...`)

      // 测试2：尝试读取数据
      addResult('📝 测试2：尝试读取云端数据...')
      const messages = await getMessagesFromSupabase()
      addResult(`✅ 读取成功！云端有 ${messages.length} 条消息`)

      // 测试3：尝试写入数据
      addResult('📝 测试3：尝试写入测试消息到云端...')
      const testMessage = {
        id: `test_${Date.now()}`,
        userId: userId,
        topicId: null,
        role: 'user' as const,
        content: '这是一条测试消息，用于验证 Supabase 写入功能',
        messageType: 'normal' as const,
        status: 'sent' as const,
        timestamp: new Date(),
        modelResponses: [],
        selectedModelId: null,
        thinkingInfo: null
      }

      await saveMessageToSupabase(testMessage)
      addResult(`✅ 写入成功！测试消息ID: ${testMessage.id}`)

      // 测试4：验证写入
      addResult('📝 测试4：验证消息是否成功保存...')
      const newMessages = await getMessagesFromSupabase()
      const found = newMessages.find((m: any) => m.id === testMessage.id)
      
      if (found) {
        addResult(`✅ 验证成功！消息已保存到云端`)
        addResult(`✅ 云端现在有 ${newMessages.length} 条消息`)
      } else {
        throw new Error('❌ 写入后未找到测试消息')
      }

      setStatus('success')
      addResult('')
      addResult('🎉 所有测试通过！Supabase 配置正常，可以正常读写数据')
      
    } catch (err) {
      console.error('测试失败:', err)
      setStatus('error')
      const errorMsg = err instanceof Error ? err.message : '未知错误'
      setError(errorMsg)
      addResult('')
      addResult(`❌ 测试失败: ${errorMsg}`)
      
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        addResult('')
        addResult('💡 可能的原因：')
        addResult('1. 网络连接问题')
        addResult('2. Supabase 服务不可用')
        addResult('3. 防火墙或代理阻止了请求')
      } else if (errorMsg.includes('JWT') || errorMsg.includes('authentication')) {
        addResult('')
        addResult('💡 可能的原因：')
        addResult('1. Supabase Key 配置错误')
        addResult('2. Supabase Key 已过期')
        addResult('3. 需要在 Vercel 重新部署')
      } else if (errorMsg.includes('RLS') || errorMsg.includes('policy') || errorMsg.includes('permission')) {
        addResult('')
        addResult('💡 可能的原因：')
        addResult('1. Supabase 行级安全（RLS）策略配置错误')
        addResult('2. 需要在 Supabase SQL Editor 中执行以下命令：')
        addResult('')
        addResult('ALTER TABLE messages ENABLE ROW LEVEL SECURITY;')
        addResult('CREATE POLICY "允许所有操作" ON messages FOR ALL USING (true);')
        addResult('')
        addResult('ALTER TABLE topics ENABLE ROW LEVEL SECURITY;')
        addResult('CREATE POLICY "允许所有操作" ON topics FOR ALL USING (true);')
      }
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Supabase 连接测试
        </h1>
        <p className="text-muted-foreground">
          诊断 Supabase 配置问题，测试读写功能是否正常
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>运行诊断测试</CardTitle>
          <CardDescription>
            点击按钮开始测试 Supabase 配置和读写功能
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runTest}
            disabled={status === 'testing'}
            className="w-full"
            size="lg"
          >
            {status === 'testing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                正在测试中...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                开始测试
              </>
            )}
          </Button>

          {results.length > 0 && (
            <Card className={status === 'success' ? 'border-green-500 bg-green-50' : status === 'error' ? 'border-red-500 bg-red-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {status === 'testing' && <Loader2 className="h-5 w-5 animate-spin" />}
                  {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  测试结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm space-y-1 bg-white p-4 rounded border">
                  {results.map((result, index) => (
                    <div key={index} className="whitespace-pre-wrap">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {status === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-bold">❌ Supabase 测试失败</p>
              <p className="text-sm">请按照上面的提示检查配置，或联系技术支持</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === 'success' && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-bold">✅ Supabase 配置正常</p>
              <p className="text-sm">现在可以正常使用了，所有新消息会自动保存到云端</p>
              <p className="text-sm mt-2">
                <a href="/" className="underline text-blue-600">返回首页开始使用</a>
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>常见问题解决</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-bold">问题1：测试失败，提示 RLS policy 错误</p>
            <p className="text-muted-foreground mt-1">
              解决：访问 Supabase → SQL Editor，执行以下命令：
            </p>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
{`ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有操作" ON messages FOR ALL USING (true);

ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "允许所有操作" ON topics FOR ALL USING (true);`}
            </pre>
          </div>

          <div>
            <p className="font-bold">问题2：测试失败，提示配置错误</p>
            <p className="text-muted-foreground mt-1">
              解决：检查 Vercel 环境变量是否正确配置：
            </p>
            <ul className="list-disc list-inside mt-2 text-muted-foreground space-y-1">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              配置后需要在 Vercel 重新部署项目
            </p>
          </div>

          <div>
            <p className="font-bold">问题3：浏览器显示旧版本</p>
            <p className="text-muted-foreground mt-1">
              解决：按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac) 强制刷新浏览器
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

