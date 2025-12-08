'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, Database, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function DataMigrationPage() {
  const [status, setStatus] = useState<'idle' | 'exporting' | 'importing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [stats, setStats] = useState<{ messages: number; agents: number; topics: number } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // 导出localStorage数据
  const handleExport = () => {
    try {
      setStatus('exporting')
      
      // 获取所有相关的localStorage数据
      const data: Record<string, any> = {}
      
      // 获取聊天消息
      const chatStore = localStorage.getItem('chat-store')
      if (chatStore) {
        data['chat-store'] = JSON.parse(chatStore)
      }
      
      // 获取智能体配置
      const agentStore = localStorage.getItem('agent-store')
      if (agentStore) {
        data['agent-store'] = JSON.parse(agentStore)
      }
      
      // 获取话题数据
      const topicStore = localStorage.getItem('topic-store')
      if (topicStore) {
        data['topic-store'] = JSON.parse(topicStore)
      }
      
      // 获取API配置
      const apiStore = localStorage.getItem('api-store')
      if (apiStore) {
        data['api-store'] = JSON.parse(apiStore)
      }
      
      // 计算统计
      const messageCount = data['chat-store']?.state?.messages?.length || 0
      const agentCount = data['agent-store']?.state?.agents?.length || 0
      const topicCount = data['topic-store']?.state?.topics?.length || 0
      
      setStats({ messages: messageCount, agents: agentCount, topics: topicCount })
      
      // 创建下载
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chatapp-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setStatus('success')
      setMessage(`✅ 成功导出！包含 ${messageCount} 条消息、${agentCount} 个智能体、${topicCount} 个话题`)
    } catch (error) {
      console.error('Export error:', error)
      setStatus('error')
      setMessage('❌ 导出失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 导入数据到VPS MySQL
  const handleImport = async (file: File) => {
    try {
      setStatus('importing')
      setMessage('正在读取文件...')
      
      const text = await file.text()
      const data = JSON.parse(text)
      
      setMessage('正在上传到VPS数据库...')
      
      // 上传消息数据
      if (data['chat-store']?.state?.messages) {
        const messages = data['chat-store'].state.messages
        
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i]
          setMessage(`正在导入消息 ${i + 1}/${messages.length}...`)
          
          try {
            const response = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(message)
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              console.error('导入失败:', errorData)
              throw new Error(`导入消息 ${message.id} 失败: ${errorData.error || '未知错误'}`)
            }
          } catch (fetchError) {
            console.error('请求错误:', fetchError)
            throw new Error(`导入消息 ${i + 1} 时网络错误: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`)
          }
          
          // 避免请求过快
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      setStatus('success')
      setMessage(`✅ 成功导入 ${data['chat-store']?.state?.messages?.length || 0} 条消息到VPS数据库！`)
      
      // 提示刷新页面
      setTimeout(() => {
        if (confirm('数据已成功导入到云端！是否刷新页面加载新数据？')) {
          window.location.reload()
        }
      }, 2000)
      
    } catch (error) {
      console.error('Import error:', error)
      setStatus('error')
      setMessage('❌ 导入失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">数据迁移工具</h1>
        <p className="text-muted-foreground">
          将浏览器localStorage中的数据迁移到VPS云端数据库
        </p>
      </div>

      {/* 状态提示 */}
      {status !== 'idle' && (
        <Alert variant={status === 'error' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'error' && <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* 统计信息 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>本地数据统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>消息数量：</span>
              <span className="font-bold">{stats.messages} 条</span>
            </div>
            <div className="flex justify-between">
              <span>智能体数量：</span>
              <span className="font-bold">{stats.agents} 个</span>
            </div>
            <div className="flex justify-between">
              <span>话题数量：</span>
              <span className="font-bold">{stats.topics} 个</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤1：导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            步骤1：导出本地数据
          </CardTitle>
          <CardDescription>
            从浏览器localStorage导出所有聊天记录、智能体配置等数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleExport}
            disabled={status === 'exporting' || status === 'importing'}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据到本地文件
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            💾 将会下载一个JSON文件，请妥善保存作为备份
          </p>
        </CardContent>
      </Card>

      {/* 步骤2：导入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            步骤2：导入到VPS数据库
          </CardTitle>
          <CardDescription>
            上传刚才导出的JSON文件，数据将保存到云端VPS数据库
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  setStatus('idle')
                  setMessage('')
                }
              }}
              disabled={status === 'exporting' || status === 'importing'}
              className="w-full p-2 border rounded"
              id="file-input"
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2">
                ✅ 已选择文件: {selectedFile.name}
              </p>
            )}
          </div>
          
          <Button
            onClick={() => {
              if (selectedFile) {
                handleImport(selectedFile)
              }
            }}
            disabled={!selectedFile || status === 'exporting' || status === 'importing'}
            className="w-full"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            {status === 'importing' ? '正在上传中...' : '开始上传到云端'}
          </Button>
          
          <p className="text-xs text-muted-foreground">
            ☁️ 数据将上传到VPS MySQL数据库（100GB容量）
          </p>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            迁移后的好处
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>数据保存在云端VPS，不受浏览器localStorage 5-10MB限制</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>支持100GB存储空间，可保存数百万条消息</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>数据持久化保存，清除浏览器缓存也不会丢失</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>多设备同步，换电脑也能看到历史数据</span>
          </div>
          <div className="flex items-start gap-2">
            <span>✅</span>
            <span>自动备份，数据更安全</span>
          </div>
        </CardContent>
      </Card>

      {/* 注意事项 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>重要提示：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>迁移前请确保已在Vercel配置好VPS数据库环境变量</li>
            <li>导出的JSON文件请妥善保存，作为数据备份</li>
            <li>导入完成后可以清理localStorage释放浏览器空间</li>
            <li>如有大量数据，导入可能需要几分钟时间</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

