'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Download, Upload, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChatStore } from '@/store/chatStore'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { useKnowledgeStore } from '@/store/knowledgeStore'
import { useQuickPhrasesStore } from '@/store/quickPhrasesStore'

interface DataSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DataSettingsDialog({ open, onOpenChange }: DataSettingsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  const { messages, importMessages } = useChatStore()
  const { agents } = useAgentStore()
  const { topics, importTopics } = useTopicStore()
  const { apiKey, baseUrl, selectedModel, addedModels, importSettings } = useAPISettingsStore()
  const knowledgeStore = useKnowledgeStore()
  const quickPhrasesStore = useQuickPhrasesStore()

  // 导出数据
  const handleExportData = () => {
    try {
      const exportData = {
        version: '1.1',
        timestamp: new Date().toISOString(),
        data: {
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          })),
          agents,
          topics: topics.map(topic => ({
            ...topic,
            createdAt: topic.createdAt.toISOString(),
            updatedAt: topic.updatedAt.toISOString()
          })),
          settings: {
            // 不导出敏感信息如 API Key
            baseUrl,
            selectedModel,
            addedModels
          },
          knowledgeBases: knowledgeStore.knowledgeBases.map(kb => ({
            ...kb,
            createdAt: kb.createdAt.toISOString(),
            updatedAt: kb.updatedAt.toISOString(),
            documents: kb.documents.map(doc => ({
              ...doc,
              uploadedAt: doc.uploadedAt.toISOString()
            }))
          })),
          selectedKnowledgeBaseIds: knowledgeStore.selectedKnowledgeBaseIds,
          quickPhrases: quickPhrasesStore.phrases.map(phrase => ({
            ...phrase,
            createdAt: phrase.createdAt.toISOString(),
            updatedAt: phrase.updatedAt.toISOString()
          }))
        }
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `chat-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      toast.success('数据导出成功')
    } catch (error) {
      console.error('导出数据失败:', error)
      toast.error('数据导出失败，请重试')
    }
  }

  // 导入数据
  const handleImportData = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast.error('请选择 JSON 格式的备份文件')
      return
    }

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        const importData = JSON.parse(content)
        
        // 验证数据格式
        if (!importData.data || !importData.version) {
          throw new Error('无效的备份文件格式')
        }

        const { data } = importData
        
        // 数据统计
        const importStats = {
          messages: data.messages?.length || 0,
          topics: data.topics?.length || 0,
          knowledgeBases: data.knowledgeBases?.length || 0,
          quickPhrases: data.quickPhrases?.length || 0,
          hasSettings: !!data.settings
        }

        // 显示确认信息
        const confirmMessage = `即将导入以下数据：
• ${importStats.messages} 条消息
• ${importStats.topics} 个话题
• ${importStats.knowledgeBases} 个知识库
• ${importStats.quickPhrases} 条快捷短语
${importStats.hasSettings ? '• 应用设置（不包括API Key）' : ''}

⚠️ 这将覆盖当前的所有数据，是否确认导入？`

        if (confirm(confirmMessage)) {
          // 实现数据恢复逻辑
          
          // 恢复消息数据
          if (data.messages && Array.isArray(data.messages)) {
            importMessages(data.messages)
          }
          
          // 恢复话题数据
          if (data.topics && Array.isArray(data.topics)) {
            importTopics(data.topics)
          }
          
          // 恢复设置数据（不包括API Key）
          if (data.settings) {
            importSettings(data.settings)
          }
          
          // 恢复知识库数据
          if (data.knowledgeBases && Array.isArray(data.knowledgeBases)) {
            // 先重置知识库
            knowledgeStore.resetStore()
            // 导入知识库
            const restoredKBs = data.knowledgeBases.map((kb: any) => ({
              ...kb,
              createdAt: new Date(kb.createdAt),
              updatedAt: new Date(kb.updatedAt),
              documents: kb.documents.map((doc: any) => ({
                ...doc,
                uploadedAt: new Date(doc.uploadedAt)
              }))
            }))
            useKnowledgeStore.setState({ 
              knowledgeBases: restoredKBs,
              selectedKnowledgeBaseIds: data.selectedKnowledgeBaseIds || []
            })
          }
          
          // 恢复快捷短语数据
          if (data.quickPhrases && Array.isArray(data.quickPhrases)) {
            const restoredPhrases = data.quickPhrases.map((phrase: any) => ({
              ...phrase,
              createdAt: new Date(phrase.createdAt),
              updatedAt: new Date(phrase.updatedAt)
            }))
            useQuickPhrasesStore.setState({ phrases: restoredPhrases })
          }
          
          toast.success(
            `数据恢复成功！\n已恢复：\n` +
            `• ${importStats.messages} 条消息\n` +
            `• ${importStats.topics} 个话题\n` +
            `• ${importStats.knowledgeBases} 个知识库\n` +
            `• ${importStats.quickPhrases} 条快捷短语`,
            { duration: 5000 }
          )
          
          // 关闭对话框
          onOpenChange(false)
        }
        
        console.log('导入的数据:', importData)
        
      } catch (error) {
        console.error('导入数据失败:', error)
        toast.error('数据导入失败，请检查文件格式')
      } finally {
        setIsImporting(false)
      }
    }

    reader.readAsText(file)
    // 清空文件输入，允许重复选择同一文件
    event.target.value = ''
  }

  // 计算数据统计
  const dataStats = {
    messagesCount: messages.length,
    agentsCount: agents.length,
    topicsCount: topics.length,
    modelsCount: addedModels.length,
    knowledgeBasesCount: knowledgeStore.knowledgeBases.length,
    quickPhrasesCount: quickPhrasesStore.phrases.length
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据设置
            </DialogTitle>
            <DialogDescription>
              备份和恢复您的聊天数据、智能体、话题等信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* 数据统计 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">数据概览</CardTitle>
                <CardDescription>当前存储的数据统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{dataStats.messagesCount}</div>
                    <div className="text-sm text-gray-600">消息条数</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{dataStats.agentsCount}</div>
                    <div className="text-sm text-gray-600">智能体</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{dataStats.topicsCount}</div>
                    <div className="text-sm text-gray-600">话题数量</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{dataStats.modelsCount}</div>
                    <div className="text-sm text-gray-600">已添加模型</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="text-2xl font-bold text-pink-600">{dataStats.knowledgeBasesCount}</div>
                    <div className="text-sm text-gray-600">知识库</div>
                  </div>
                  <div className="text-center p-3 bg-cyan-50 rounded-lg">
                    <div className="text-2xl font-bold text-cyan-600">{dataStats.quickPhrasesCount}</div>
                    <div className="text-sm text-gray-600">快捷短语</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 数据备份 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  数据备份
                </CardTitle>
                <CardDescription>将您的所有数据导出为 JSON 文件</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p>备份内容包括：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>所有聊天消息和对话历史</li>
                        <li>智能体配置（不包含系统提示）</li>
                        <li>话题分组和设置</li>
                        <li>模型配置（不包含 API Key）</li>
                        <li>所有知识库和文档内容</li>
                        <li>所有自定义快捷短语</li>
                      </ul>
                    </div>
                  </div>
                  <Button onClick={handleExportData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    导出备份文件
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 数据恢复 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  数据恢复
                </CardTitle>
                <CardDescription>从备份文件中恢复数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">注意事项：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>恢复操作将覆盖当前数据</li>
                        <li>建议在恢复前先进行备份</li>
                        <li>仅支持本应用导出的 JSON 格式文件</li>
                      </ul>
                    </div>
                  </div>
                  <Button 
                    onClick={handleImportData} 
                    variant="outline" 
                    className="w-full"
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        正在导入...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        选择备份文件恢复
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  )
}