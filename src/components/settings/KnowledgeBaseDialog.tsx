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
import { Plus, File, FileText, Folder, Link, Globe, Upload, Check, X, RotateCw, Trash2, BookOpen } from 'lucide-react'
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
        <DialogContent className="max-w-[95vw] w-[1600px] h-[90vh] max-h-[900px]">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-semibold">知识库管理</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6 flex-1 overflow-hidden pt-4">
            {/* 左侧：知识库列表 */}
            <div className="w-80 border-r pr-6 flex flex-col gap-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
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
              </div>
              
              <div className="pt-3 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-center h-12 text-base font-medium"
                  onClick={() => setShowNewKBDialog(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  添加新知识库
                </Button>
              </div>
            </div>

            {/* 右侧：文档管理 */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {selectedKB ? (
                <>
                  {/* 顶部工具栏 */}
                  <div className="flex-shrink-0 space-y-4 mb-4">
                    {/* 嵌入模型显示 */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-base font-medium text-gray-700">嵌入模型：</span>
                      <span className="text-base font-semibold text-blue-700">
                        {embeddingModels.find(m => m.id === selectedKB.embeddingModel)?.name || '未知模型'}
                      </span>
                    </div>

                    {/* 分类标签和操作按钮 */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="default"
                        variant={activeTab === 'all' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('all')}
                        className="h-11 px-5 text-base font-medium"
                      >
                        全部 ({selectedKB.documents.length})
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
                            className="h-11 px-5 text-base font-medium"
                          >
                            <Icon className="h-5 w-5 mr-2" />
                            {labels[type]} ({count})
                          </Button>
                        )
                      })}
                      <div className="ml-auto">
                        <Button
                          size="default"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-11 px-6 text-base font-medium bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          添加文件
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".txt,.md,.html,.pdf,.docx,.pptx,.xlsx,.epub"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* 拖拽上传区 */}
                  <div
                    className="flex-shrink-0 border-2 border-dashed rounded-lg p-8 mb-4 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <div className="text-lg font-medium mb-2 text-gray-700">拖拽文件到这里或点击上传</div>
                    <div className="text-sm text-gray-500">
                      支持 TXT, MD, HTML, PDF, DOCX, PPTX, XLSX, EPUB 等格式
                    </div>
                  </div>

                  {/* 文档列表 */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-2 pr-2">
                      {filteredDocs.length === 0 ? (
                        <div className="text-center py-16">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <div className="text-lg font-medium text-gray-500 mb-2">暂无文档</div>
                          <div className="text-sm text-gray-400">点击"添加文件"或拖拽文件到上方区域</div>
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-sm hover:border-blue-300 transition-all bg-white"
                          >
                            {/* 文件图标和信息 */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {(() => {
                                const Icon = typeIcons[doc.type]
                                return (
                                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50">
                                    <Icon className="h-5 w-5 text-blue-600" />
                                  </div>
                                )
                              })()}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="truncate text-base font-medium text-gray-900">{doc.name}</span>
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
                            
                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="default"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-10 w-10 p-0"
                                title="重新上传"
                              >
                                <RotateCw className="h-5 w-5" />
                              </Button>
                              <div className="w-10 h-10 flex items-center justify-center border rounded-lg bg-gray-50">
                                {getStatusIcon(doc.status)}
                              </div>
                              <Button
                                size="default"
                                variant="outline"
                                onClick={() => deleteDocument(selectedKB.id, doc.id)}
                                className="h-10 w-10 p-0 hover:bg-red-50 hover:border-red-300"
                                title="删除"
                              >
                                <Trash2 className="h-5 w-5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <BookOpen className="h-20 w-20 text-gray-300 mb-4" />
                  <div className="text-xl font-medium text-gray-600 mb-2">请选择或创建一个知识库</div>
                  <div className="text-base text-gray-400">从左侧列表中选择一个知识库开始管理文档</div>
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
