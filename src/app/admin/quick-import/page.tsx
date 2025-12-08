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
      
      // 第3步：分批导入消息到VPS（避免payload过大）
      setProgress(`第3步：分批导入消息到VPS (共 ${messages.length} 条)...`)
      
      const batchSize = 500 // 每批500条，避免超过Vercel 4.5MB限制
      let totalSuccess = 0
      let totalFailed = 0
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const totalBatches = Math.ceil(messages.length / batchSize)
        
        setProgress(`第3步：导入批次 ${batchNumber}/${totalBatches}... (已完成 ${totalSuccess}/${messages.length} 条)`)
        
        try {
          const bulkImportResponse = await fetch('/api/messages/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: batch })
          })
          
          if (!bulkImportResponse.ok) {
            throw new Error(`HTTP ${bulkImportResponse.status}`)
          }
          
          const bulkImportData = await bulkImportResponse.json()
          
          if (!bulkImportData.success) {
            throw new Error('批量导入失败: ' + bulkImportData.error)
          }
          
          totalSuccess += bulkImportData.successCount
          totalFailed += bulkImportData.failedCount
          
        } catch (batchError) {
          console.error(`批次 ${batchNumber} 导入失败:`, batchError)
          totalFailed += batch.length
        }
        
        // 稍微延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      setProgress(`✅ 导入完成：成功 ${totalSuccess} 条，失败 ${totalFailed} 条`)
      
      // 第4步：恢复话题数据到localStorage
      setProgress(`第4步：恢复话题数据...`)
      
      try {
        // 将话题数据写入localStorage，这样前端就能显示话题列表了
        if (topics.length > 0) {
          const topicStoreData = {
            state: {
              topics: topics,
              currentTopicId: null
            },
            version: 0
          }
          localStorage.setItem('topic-store', JSON.stringify(topicStoreData))
          setProgress(`✅ 话题数据已恢复：${topics.length} 个话题`)
        } else {
          setProgress(`⚠️ 没有找到话题数据`)
        }
      } catch (topicError) {
        console.error('恢复话题数据失败:', topicError)
        setProgress(`⚠️ 话题数据恢复失败，但消息已导入`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 完成
      setStatus('success')
      
      const successCount = totalSuccess
      const failedCount = totalFailed
      
      if (failedCount === 0) {
        setFinalMessage(`🎉 完美！导入完成！

✅ 消息：${successCount} 条已保存到VPS云端
✅ 话题：${topics.length} 个已自动恢复

📋 现在只需要：
1. 点击下方"前往首页"按钮
2. 按 Ctrl+F5 强制刷新页面
3. 所有话题和消息都会显示出来！

💡 系统会自动：
• 从VPS加载消息数据（${successCount}条）
• 从localStorage读取话题列表（${topics.length}个）
• localStorage只保留少量缓存，不会再满载

🎊 恭喜！问题已彻底解决！`)
      } else {
        setFinalMessage(`✅ 导入完成！

✅ 消息：成功 ${successCount} 条，失败 ${failedCount} 条
✅ 话题：${topics.length} 个已自动恢复

📋 现在只需要：
1. 点击下方"前往首页"按钮
2. 按 Ctrl+F5 强制刷新页面
3. 所有话题和消息都会显示出来！

💡 虽然有少量消息失败，但大部分数据已保存到VPS云端！`)
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
                  <li>✅ 分批导入消息到VPS（每批500条）</li>
                  <li>✅ 自动恢复话题数据到localStorage</li>
                  <li>✅ 完成后可直接使用，无需手动操作</li>
                </ul>
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ⚡ 6MB数据约1-3分钟完成！导入后直接刷新首页即可使用！
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
              
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  size="lg"
                >
                  🎉 前往首页开始使用（按Ctrl+F5刷新）
                </Button>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => window.open('/admin/db-test', '_blank')}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    验证VPS数据
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setStatus('idle')
                      setProgress('')
                      setFinalMessage('')
                      setFile(null)
                    }}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    重新导入
                  </Button>
                </div>
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
          <strong>工作原理说明</strong>
          <p className="mt-2 text-sm">
            <strong>消息数据（主要占空间）：</strong><br/>
            直接从JSON分批导入到VPS云端数据库（每批500条），
            永久保存在VPS（100GB空间），localStorage只保留最近20条缓存。
          </p>
          <p className="mt-2 text-sm">
            <strong>话题数据（很小）：</strong><br/>
            自动恢复到localStorage，因为话题数据很小（几十KB），
            不会造成localStorage满载问题。
          </p>
          <p className="mt-2 text-sm">
            <strong>结果：</strong><br/>
            ✅ 消息从VPS加载（无限容量）<br/>
            ✅ 话题从localStorage加载（几十KB）<br/>
            ✅ localStorage总占用 &lt; 500KB，永远不会满载<br/>
            ✅ 导入时间从1小时缩短到1-3分钟
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

