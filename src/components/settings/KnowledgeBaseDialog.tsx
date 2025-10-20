'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useKnowledgeStore } from '@/store/knowledgeStore'
import { ALL_MODELS } from '@/data/models'
import { Plus, File, FileText, Folder, Link, Globe, Upload, Check, X, RotateCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentType } from '@/types/knowledge'

interface KnowledgeBaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KnowledgeBaseDialog({ open, onOpenChange }: KnowledgeBaseDialogProps) {
  const [selectedKBId, setSelectedKBId] = useState<string | null>(null)
  const [showNewKBDialog, setShowNewKBDialog] = useState(false)
  const [showEditKBDialog, setShowEditKBDialog] = useState(false)
  const [newKBName, setNewKBName] = useState('')
  const [newKBModel, setNewKBModel] = useState('')
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    knowledgeBases,
    addKnowledgeBase,
    deleteKnowledgeBase,
    renameKnowledgeBase,
    updateKnowledgeBase,
    getKnowledgeBase,
    addDocument,
    deleteDocument,
    reuploadDocument
  } = useKnowledgeStore()

  // 获取嵌入模型
  const embeddingModels = ALL_MODELS.filter(m => m.category.includes('embedding'))

  const selectedKB = selectedKBId ? getKnowledgeBase(selectedKBId) : null

  // 创建新知识库
  const handleCreateKB = () => {
    if (!newKBName.trim()) {
      toast.error('请输入知识库名称')
      return
    }
    if (!newKBModel) {
      toast.error('请选择嵌入模型')
      return
    }

    const id = addKnowledgeBase(newKBName, newKBModel)
    setSelectedKBId(id)
    setNewKBName('')
    setNewKBModel('')
    setShowNewKBDialog(false)
    toast.success('知识库创建成功')
  }

  // 更新知识库
  const handleUpdateKB = () => {
    if (!selectedKBId || !newKBName.trim() || !newKBModel) return

    renameKnowledgeBase(selectedKBId, newKBName)
    updateKnowledgeBase(selectedKBId, { embeddingModel: newKBModel })
    setShowEditKBDialog(false)
    toast.success('知识库更新成功')
  }

  // 删除知识库
  const handleDeleteKB = (id: string) => {
    if (window.confirm('确定要删除这个知识库吗？')) {
      deleteKnowledgeBase(id)
      if (selectedKBId === id) {
        setSelectedKBId(null)
      }
      toast.success('知识库已删除')
    }
  }

  // 打开编辑对话框
  const handleOpenEditDialog = (id: string) => {
    const kb = getKnowledgeBase(id)
    if (kb) {
      setNewKBName(kb.name)
      setNewKBModel(kb.embeddingModel)
      setShowEditKBDialog(true)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedKBId) return

    for (const file of Array.from(files)) {
      // 检测文件类型
      const type = detectFileType(file)
      
      try {
        const content = await readFileContent(file)
        addDocument(selectedKBId, {
          name: file.name,
          type,
          status: 'pending',
          size: file.size,
          content
        })
        toast.success(`文件 ${file.name} 上传成功`)
      } catch (error) {
        toast.error(`文件 ${file.name} 上传失败`)
      }
    }
  }

  // 检测文件类型
  const detectFileType = (file: File): DocumentType => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    if (['txt', 'md', 'html', 'pdf', 'docx', 'pptx', 'xlsx', 'epub'].includes(ext || '')) {
      return 'file'
    }
    return 'file' // 默认为文件类型
  }

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  // 处理拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [selectedKBId])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // 过滤文档
  const filteredDocs = selectedKB?.documents.filter(doc => 
    activeTab === 'all' || doc.type === activeTab
  ) || []

  // 图标映射
  const typeIcons: Record<DocumentType, any> = {
    file: FileText,
    note: File,
    directory: Folder,
    url: Link,
    website: Globe
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-6 w-6 text-green-500" />
      case 'failed':
        return <X className="h-6 w-6 text-red-500" />
      case 'embedding':
        return <RotateCw className="h-6 w-6 text-blue-500 animate-spin" />
      default:
        return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] w-[1400px] h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">知识库</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6 h-full overflow-hidden">
            {/* 左侧：知识库列表 */}
            <div className="w-72 border-r pr-6 flex flex-col gap-3 overflow-y-auto">
              {knowledgeBases.map((kb) => (
                <ContextMenu key={kb.id}>
                  <ContextMenuTrigger>
                    <div
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedKBId === kb.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedKBId(kb.id)}
                    >
                      <div className="font-medium truncate text-base">{kb.name}</div>
                      <div className="text-sm opacity-70 mt-1.5">
                        {kb.documents.length} 个文档
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleOpenEditDialog(kb.id)}>
                      重命名
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleOpenEditDialog(kb.id)}>
                      设置
                    </ContextMenuItem>
                    <ContextMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteKB(kb.id)}
                    >
                      删除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              
              <Button
                variant="outline"
                className="w-full justify-start h-11 text-base"
                onClick={() => setShowNewKBDialog(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                添加
              </Button>
            </div>

            {/* 右侧：文档管理 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedKB ? (
                <>
                  {/* 第一行：嵌入模型 */}
                  <div className="mb-5 p-4 bg-accent rounded-lg flex items-center gap-2">
                    <span className="text-base font-medium text-gray-600">嵌入模型</span>
                    <span className="text-base font-semibold">
                      {embeddingModels.find(m => m.id === selectedKB.embeddingModel)?.name || '未知模型'}
                    </span>
                  </div>

                  {/* 第二行：分类标签 */}
                  <div className="flex gap-3 mb-5">
                    <Button
                      size="default"
                      variant={activeTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('all')}
                      className="h-10 px-4 text-base"
                    >
                      全部
                    </Button>
                    {(['file', 'note', 'directory', 'url', 'website'] as DocumentType[]).map((type) => {
                      const Icon = typeIcons[type]
                      const labels = {
                        file: '文件',
                        note: '笔记',
                        directory: '目录',
                        url: '网址',
                        website: '网站'
                      }
                      const count = selectedKB.documents.filter(d => d.type === type).length
                      return (
                        <Button
                          key={type}
                          size="default"
                          variant={activeTab === type ? 'default' : 'outline'}
                          onClick={() => setActiveTab(type)}
                          className="h-10 px-4 text-base"
                        >
                          <Icon className="h-5 w-5 mr-2" />
                          {labels[type]}
                          <span className="ml-2 text-sm opacity-70">{count}</span>
                        </Button>
                      )
                    })}
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-4 text-base bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      添加文件
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".txt,.md,.html,.pdf,.docx,.pptx,.xlsx,.epub"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </div>

                  {/* 第三行：拖拽区 */}
                  <div
                    className="border-2 border-dashed rounded-lg p-12 mb-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-xl font-medium mb-3 text-gray-700">拖拽文件到这里</div>
                    <div className="text-base text-gray-500">
                      支持 TXT, MD, HTML, PDF, DOCX, PPTX, XLSX, EPUB...格式
                    </div>
                  </div>

                  {/* 第四行：文档列表 */}
                  <div className="flex-1 overflow-y-auto space-y-3">
                    {filteredDocs.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-base">
                        暂无文档
                      </div>
                    ) : (
                      filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {(() => {
                              const Icon = typeIcons[doc.type]
                              return <Icon className="h-5 w-5 flex-shrink-0 text-gray-600" />
                            })()}
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-base font-medium">{doc.name}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {doc.size && ` · ${(doc.size / 1024 / 1024).toFixed(2)} MB`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <Button
                              size="default"
                              variant="ghost"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-9 px-3"
                              title="重新上传"
                            >
                              <RotateCw className="h-5 w-5" />
                            </Button>
                            <div className="w-9 h-9 flex items-center justify-center">
                              {getStatusIcon(doc.status)}
                            </div>
                            <Button
                              size="default"
                              variant="ghost"
                              onClick={() => deleteDocument(selectedKB.id, doc.id)}
                              className="h-9 px-3 hover:bg-red-50"
                              title="删除"
                            >
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-lg">
                  请选择或创建一个知识库
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建知识库对话框 */}
      <Dialog open={showNewKBDialog} onOpenChange={setShowNewKBDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">添加新知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label htmlFor="kb-name" className="text-base">名称</Label>
              <Input
                id="kb-name"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="输入知识库名称"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="kb-model" className="text-base">嵌入模型</Label>
              <Select value={newKBModel} onValueChange={setNewKBModel}>
                <SelectTrigger id="kb-model" className="h-11 text-base">
                  <SelectValue placeholder="选择嵌入模型" />
                </SelectTrigger>
                <SelectContent>
                  {embeddingModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-base py-3">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNewKBDialog(false)} className="h-10 px-6 text-base">
              取消
            </Button>
            <Button onClick={handleCreateKB} className="h-10 px-6 text-base">创建</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑知识库对话框 */}
      <Dialog open={showEditKBDialog} onOpenChange={setShowEditKBDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">知识库设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-3">
              <Label htmlFor="edit-kb-name" className="text-base">名称</Label>
              <Input
                id="edit-kb-name"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="输入知识库名称"
                className="h-11 text-base"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="edit-kb-model" className="text-base">嵌入模型</Label>
              <Select value={newKBModel} onValueChange={setNewKBModel}>
                <SelectTrigger id="edit-kb-model" className="h-11 text-base">
                  <SelectValue placeholder="选择嵌入模型" />
                </SelectTrigger>
                <SelectContent>
                  {embeddingModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-base py-3">
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditKBDialog(false)} className="h-10 px-6 text-base">
              取消
            </Button>
            <Button onClick={handleUpdateKB} className="h-10 px-6 text-base">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
