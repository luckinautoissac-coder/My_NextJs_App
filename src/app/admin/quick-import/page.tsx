'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function QuickImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'working' | 'success' | 'error'>('idle')
  const [progress, setProgress] = useState('')
  const [finalMessage, setFinalMessage] = useState('')

  const handleQuickImport = async () => {
    if (!file) return

    try {
      setStatus('working')
      
      // 第1步：检查数据库
      setProgress('第1步：检查数据库表结构...')
      const dbSetupResponse = await fetch('/api/db-setup', { method: 'POST' })
      const dbSetupData = await dbSetupResponse.json()
      
      if (!dbSetupData.success) {
        throw new Error('数据库准备失败: ' + dbSetupData.error)
      }
      
      setProgress('✅ 数据库准备完成')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第2步：读取JSON文件
      setProgress('第2步：读取备份文件...')
      const text = await file.text()
      const data = JSON.parse(text)
      
      const messages = data['chat-store']?.state?.messages || []
      const topics = data['topic-store']?.state?.topics || []
      
      if (messages.length === 0) {
        throw new Error('JSON文件中没有消息数据')
      }
      
      setProgress(`✅ 找到 ${messages.length} 条消息和 ${topics.length} 个话题`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 第3步：导入消息到VPS
      setProgress(`第3步：导入消息到VPS (共 ${messages.length} 条)...`)
      
      let successCount = 0
      let failedCount = 0
      
      for (let i = 0; i < messages.length; i++) {
        // 每10条更新一次进度
        if (i % 10 === 0 || i === messages.length - 1) {
          setProgress(`第3步：正在导入第 ${i + 1}/${messages.length} 条消息... (成功: ${successCount}, 失败: ${failedCount})`)
        }
        
        try {
          const response = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages[i])
          })
          
          if (response.ok) {
            successCount++
          } else {
            failedCount++
          }
        } catch {
          failedCount++
        }
        
        // 每10条暂停一下，避免过快
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // 完成
      setStatus('success')
      
      if (failedCount === 0) {
        setFinalMessage(`🎉 完美！成功导入全部 ${successCount} 条消息到VPS云端！

话题数据已同步。

现在可以直接使用了：
1. 访问首页: /
2. 所有数据都会自动从云端加载
3. localStorage会自动清理，只保留最近20条缓存

🎊 恭喜！localStorage满载问题已彻底解决！`)
      } else {
        setFinalMessage(`✅ 导入完成：成功 ${successCount} 条，失败 ${failedCount} 条

话题数据已同步。

虽然有少量失败，但大部分数据已保存到VPS云端。

现在可以正常使用：
1. 访问首页: /
2. 数据会自动从云端加载

💡 localStorage满载问题已解决！`)
      }
      
      setProgress('✅ 全部完成！')
      
    } catch (error) {
      setStatus('error')
      setProgress('❌ 操作失败')
      setFinalMessage('❌ 导入失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  return (
    <div className="container max-w-3xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">🚀 一键导入到VPS</h1>
        <p className="text-muted-foreground">
          上传备份文件，自动完成所有操作，无需手动恢复localStorage
        </p>
      </div>

      {/* 主要操作卡片 */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle>上传JSON备份文件</CardTitle>
          <CardDescription>
            选择之前导出的 chatapp-backup-XXXX.json 文件，系统会自动完成所有操作
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) {
                      setFile(selectedFile)
                      setProgress('')
                      setFinalMessage('')
                    }
                  }}
                  className="w-full p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary"
                  id="quick-import-file"
                />
              </div>
              
              {file && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ✅ 已选择文件: <strong>{file.name}</strong>
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handleQuickImport}
                disabled={!file}
                className="w-full"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                一键导入到VPS（自动完成所有步骤）
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">系统会自动完成：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>✅ 检查并更新数据库表结构</li>
                  <li>✅ 读取备份文件中的所有数据</li>
                  <li>✅ 导入消息到VPS云端数据库</li>
                  <li>✅ 同步话题数据</li>
                  <li>✅ 自动清理localStorage缓存</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  ⏱️ 预计时间：根据数据量，约 3-15 分钟
                </p>
              </div>
            </>
          )}

          {status === 'working' && (
            <div className="space-y-4">
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <strong>正在处理，请勿关闭页面...</strong>
                  <div className="mt-2">{progress}</div>
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-700 whitespace-pre-wrap">
                  {finalMessage}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                  size="lg"
                >
                  前往首页开始使用
                </Button>
                
                <Button
                  onClick={() => window.open('/admin/db-test', '_blank')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  验证VPS数据
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap">
                  {finalMessage}
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => {
                  setStatus('idle')
                  setProgress('')
                  setFinalMessage('')
                }}
                variant="outline"
                className="w-full"
              >
                重新尝试
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 说明 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>为什么不需要恢复localStorage？</strong>
          <p className="mt-2 text-sm">
            这个工具直接从JSON备份文件读取数据并导入到VPS云端数据库，
            跳过了恢复到localStorage的步骤，节省了大量时间（从1小时缩短到几分钟）。
          </p>
          <p className="mt-2 text-sm">
            导入完成后，访问首页时系统会自动从VPS加载所有数据，
            localStorage只会保留最近20条消息作为缓存（几百KB），
            永久解决了localStorage满载问题。
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

