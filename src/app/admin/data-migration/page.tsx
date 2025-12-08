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
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [dbReady, setDbReady] = useState<boolean | null>(null)
  const [dbCheckMessage, setDbCheckMessage] = useState('')

  // 检查并准备数据库
  const handleDbSetup = async () => {
    try {
      setStatus('importing')
      setDbCheckMessage('正在检查数据库表结构...')
      
      const response = await fetch('/api/db-setup', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDbReady(true)
        setStatus('success')
        if (data.alreadyUpToDate) {
          setDbCheckMessage('✅ 数据库表结构已是最新，可以开始导入！')
        } else {
          setDbCheckMessage(`✅ 数据库表结构更新成功！${data.updates.join('、')}`)
        }
      } else {
        setDbReady(false)
        setStatus('error')
        setDbCheckMessage(`❌ 数据库检查失败：${data.error}`)
      }
    } catch (error) {
      setDbReady(false)
      setStatus('error')
      setDbCheckMessage(`❌ 数据库连接失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

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

  // 【新增】恢复到localStorage（紧急修复）
  const handleRestore = async (file: File) => {
    try {
      setStatus('importing')
      setMessage('正在恢复到localStorage...')
      
      const text = await file.text()
      const data = JSON.parse(text)
      
      // 恢复所有store数据到localStorage
      if (data['chat-store']) {
        localStorage.setItem('chat-store', JSON.stringify(data['chat-store']))
      }
      if (data['topic-store']) {
        localStorage.setItem('topic-store', JSON.stringify(data['topic-store']))
      }
      if (data['agent-store']) {
        localStorage.setItem('agent-store', JSON.stringify(data['agent-store']))
      }
      if (data['api-store']) {
        localStorage.setItem('api-store', JSON.stringify(data['api-store']))
      }
      
      const messageCount = data['chat-store']?.state?.messages?.length || 0
      const topicCount = data['topic-store']?.state?.topics?.length || 0
      
      setStatus('success')
      setMessage(`✅ 恢复成功！${messageCount} 条消息、${topicCount} 个话题已恢复到localStorage`)
      
      setTimeout(() => {
        if (confirm('数据已恢复到浏览器！是否刷新页面？')) {
          window.location.href = '/'
        }
      }, 1500)
      
    } catch (error) {
      console.error('Restore error:', error)
      setStatus('error')
      setMessage('❌ 恢复失败：' + (error instanceof Error ? error.message : '未知错误'))
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
        let successCount = 0
        let failedCount = 0
        const failedMessages: string[] = []
        
        for (let i = 0; i < messages.length; i++) {
          const message = messages[i]
          setMessage(`正在导入消息 ${i + 1}/${messages.length}... (成功: ${successCount}, 失败: ${failedCount})`)
          
          try {
            const response = await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(message)
            })
            
            if (!response.ok) {
              const errorData = await response.json()
              console.error(`消息 ${i + 1} 导入失败:`, errorData)
              failedCount++
              failedMessages.push(`消息 ${i + 1} (ID: ${message.id.substring(0, 8)}...)`)
              // 继续导入下一条，不中断
              continue
            }
            successCount++
          } catch (fetchError) {
            console.error(`消息 ${i + 1} 请求错误:`, fetchError)
            failedCount++
            failedMessages.push(`消息 ${i + 1} (网络错误)`)
            // 继续导入下一条，不中断
            continue
          }
          
          // 避免请求过快
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        // 显示最终结果
        if (failedCount === 0) {
          setStatus('success')
          setMessage(`✅ 成功导入全部 ${successCount} 条消息到VPS数据库！`)
        } else {
          setStatus('success')
          setMessage(`⚠️ 导入完成：成功 ${successCount} 条，失败 ${failedCount} 条。\n失败的消息: ${failedMessages.slice(0, 5).join(', ')}${failedCount > 5 ? '...' : ''}`)
        }
      } else {
        setStatus('success')
        setMessage('✅ 没有消息需要导入')
      }
      
      // 提示刷新页面
      setTimeout(() => {
        if (confirm('数据已导入到云端！是否刷新页面加载新数据？')) {
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

      {/* 🚨 超级警告 */}
      <Alert variant="destructive" className="border-red-600 bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-700">
          <strong className="text-lg block mb-2">🚨 千万不要提前清空localStorage！</strong>
          <p className="mb-2">必须严格按照以下顺序操作：</p>
          <ol className="list-decimal list-inside space-y-1 font-medium">
            <li>恢复数据到localStorage（使用下方的橙色紧急恢复区域）</li>
            <li>数据库准备检查（点击蓝色卡片的按钮，等待✅）</li>
            <li>导入到VPS（上传JSON文件，等待成功）</li>
            <li>验证VPS数据（访问 <a href="/admin/db-test" className="underline" target="_blank">/admin/db-test</a>，确认能看到消息）</li>
            <li>【最后一步】清空localStorage（只在确认VPS有数据后！）</li>
          </ol>
          <p className="mt-2 text-sm">⚠️ 如果在VPS导入成功前清空localStorage，所有数据都会丢失！</p>
        </AlertDescription>
      </Alert>

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

      {/* 🚨 紧急恢复 */}
      <Card className="border-orange-500 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            🚨 紧急恢复（如果误清空了localStorage）
          </CardTitle>
          <CardDescription className="text-orange-600">
            如果你已经清空了localStorage导致话题列表消失，可以用这个工具恢复备份的JSON文件
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
                  setRestoreFile(file)
                  setStatus('idle')
                  setMessage('')
                }
              }}
              disabled={status === 'exporting' || status === 'importing'}
              className="w-full p-2 border rounded"
              id="restore-file-input"
            />
            {restoreFile && (
              <p className="text-sm text-green-600 mt-2">
                ✅ 已选择文件: {restoreFile.name}
              </p>
            )}
          </div>
          
          <Button
            onClick={() => {
              if (restoreFile) {
                handleRestore(restoreFile)
              }
            }}
            disabled={!restoreFile || status === 'exporting' || status === 'importing'}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            {status === 'importing' ? '正在恢复...' : '立即恢复到浏览器'}
          </Button>
          
          <p className="text-xs text-orange-600">
            ⚠️ 这会将备份的数据恢复到localStorage，然后你就能看到所有话题和消息了！
          </p>
        </CardContent>
      </Card>

      {/* 数据库准备检查 */}
      <Card className="border-blue-500 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="h-5 w-5" />
            ⚙️ 数据库准备检查（导入前必做！）
          </CardTitle>
          <CardDescription className="text-blue-600">
            在导入数据到VPS之前，需要先检查并更新数据库表结构
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDbSetup}
            disabled={status === 'exporting' || status === 'importing'}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Database className="h-4 w-4 mr-2" />
            {status === 'importing' && !dbCheckMessage ? '正在检查...' : '检查并准备数据库'}
          </Button>
          
          {dbCheckMessage && (
            <Alert variant={dbReady ? 'default' : 'destructive'}>
              <div className="flex items-center gap-2">
                {dbReady && <CheckCircle2 className="h-4 w-4" />}
                {dbReady === false && <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{dbCheckMessage}</AlertDescription>
              </div>
            </Alert>
          )}
          
          <p className="text-xs text-blue-600">
            ⚠️ 如果不执行这一步，导入数据时可能会失败！
          </p>
        </CardContent>
      </Card>

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
      <Card className={dbReady === false ? 'opacity-50' : ''}>
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
          {dbReady === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ 请先完成上方的"数据库准备检查"！
              </AlertDescription>
            </Alert>
          )}
          
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
              disabled={dbReady === false || status === 'exporting' || status === 'importing'}
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
            disabled={dbReady !== true || !selectedFile || status === 'exporting' || status === 'importing'}
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

      {/* 步骤3：验证 */}
      <Card className="border-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            步骤3：验证VPS数据（导入后必做！）
          </CardTitle>
          <CardDescription className="text-green-600">
            在清空localStorage之前，必须先验证VPS中有完整数据！
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => {
              window.open('/admin/db-test', '_blank')
            }}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Database className="h-4 w-4 mr-2" />
            打开数据验证页面
          </Button>
          
          <div className="text-sm space-y-2">
            <p className="font-medium">验证步骤：</p>
            <ol className="list-decimal list-inside space-y-1 text-green-700">
              <li>点击上方按钮打开验证页面</li>
              <li>点击"读取消息"按钮</li>
              <li>确认能看到"✅ 成功读取 XXX 条消息"</li>
              <li>检查消息列表，确认数据完整</li>
              <li>只有验证成功后，才能清空localStorage！</li>
            </ol>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              ⚠️ 如果验证失败或消息数为0，绝对不要清空localStorage！请联系技术支持。
            </AlertDescription>
          </Alert>
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>🚨 极其重要的警告：</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li><strong className="text-red-600">【步骤1】先恢复localStorage数据（紧急恢复区域）</strong></li>
            <li><strong className="text-red-600">【步骤2】点击"数据库准备检查"，等待成功✅</strong></li>
            <li><strong className="text-red-600">【步骤3】导入数据到VPS，等待成功✅</strong></li>
            <li><strong className="text-red-600">【步骤4】访问 /admin/db-test 验证VPS有数据</strong></li>
            <li><strong className="text-red-600">【步骤5】确认VPS有数据后，才能清空localStorage！</strong></li>
            <li>导出的JSON文件请妥善保存，作为数据备份</li>
            <li>如有大量数据，导入可能需要几分钟时间</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}

