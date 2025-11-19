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
import { Plus, File, FileText, Folder, Link, Globe, Upload, Check, X, RotateCw, Trash2, BookOpen, Settings, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { DocumentType } from '@/types/knowledge'
import { cn } from '@/lib/utils'

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
  const readFileContent = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    
    // 对于文本文件，直接读取
    if (['txt', 'md', 'html'].includes(ext || '')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsText(file)
      })
    }
    
    // 对于其他文件类型（PDF、DOCX等），返回文件的基本信息
    // 实际的内容提取应该在后端处理
    return `[文件: ${file.name}]\n类型: ${file.type || '未知'}\n大小: ${(file.size / 1024).toFixed(2)} KB\n\n此文件需要后端处理来提取内容。`
  }

  // 处理拖拽
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files && selectedKBId) {
      await handleFileUpload(files)
    }
  }

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


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1600px] h-[88vh] max-h-[900px] p-0">
          <div className="flex h-full">
            {/* 左侧边栏 */}
            <div className="w-[28%] border-r bg-white flex flex-col">
              {/* 标题 */}
              <div className="px-6 py-5 border-b">
                <h2 className="text-xl font-semibold text-gray-900">知识库</h2>
              </div>
              
              {/* 知识库列表 */}
              <div className="flex-1 overflow-y-auto py-2">
              {knowledgeBases.map((kb) => (
                <ContextMenu key={kb.id}>
                  <ContextMenuTrigger>
                    <div
                      className={cn(
                        "relative px-6 py-3 cursor-pointer transition-all flex items-center gap-3",
                        "hover:bg-gray-50",
                        selectedKBId === kb.id && "bg-gray-100"
                      )}
                      onClick={() => setSelectedKBId(kb.id)}
                    >
                      {/* 选中指示器 */}
                      {selectedKBId === kb.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      
                      {/* 图标 */}
                      <div className="flex-shrink-0">
                        <Folder className={cn(
                          "h-5 w-5",
                          selectedKBId === kb.id ? "text-blue-600" : "text-gray-500"
                        )} />
                      </div>
                      
                      {/* 文本 */}
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "font-medium truncate text-sm",
                          selectedKBId === kb.id ? "text-gray-900" : "text-gray-700"
                        )}>
                          {kb.name}
                        </div>
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
              
              {/* 添加按钮 */}
              <div className="px-6 py-4 border-t">
                <button
                  onClick={() => setShowNewKBDialog(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </button>
              </div>
            </div>

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {selectedKB ? (
                <>
                  {/* 顶部工具栏 */}
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    {/* 左侧 - 嵌入模型 */}
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">嵌入模型</span>
                      <div className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full">
                        <span className="text-sm text-gray-700">
                          {embeddingModels.find(m => m.id === selectedKB.embeddingModel)?.name || '未知模型'}
                        </span>
                      </div>
                    </div>
                    
                    {/* 右侧 - 搜索 */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Search className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  {/* 标签导航栏 */}
                  <div className="flex items-center justify-between px-6 border-b">
                    <div className="flex items-center gap-6 -mb-px">
                      {/* 全部标签 */}
                      <button
                        onClick={() => setActiveTab('all')}
                        className={cn(
                          "flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors relative",
                          activeTab === 'all'
                            ? "text-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <span>全部</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-xs",
                          activeTab === 'all'
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {selectedKB.documents.length}
                        </span>
                        {activeTab === 'all' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                      
                      {/* 其他标签 */}
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
                          <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={cn(
                              "flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors relative",
                              activeTab === type
                                ? "text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{labels[type]}</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-xs",
                              activeTab === type
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            )}>
                              {count}
                            </span>
                            {activeTab === type && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* 添加文件按钮 */}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-9 px-4 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
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

                  {/* 内容区域 */}
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    {/* 拖拽上传区 */}
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="text-lg font-medium text-gray-700 mb-2">拖拽文件到这里</div>
                      <div className="text-sm text-gray-500">
                        支持 TXT, MD, HTML, PDF, DOCX, PPTX, XLSX, EPUB... 格式
                      </div>
                    </div>

                    {/* 文档列表 */}
                    <div className="space-y-2">
                      {filteredDocs.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <div className="text-base font-medium text-gray-500 mb-1">暂无文档</div>
                          <div className="text-sm text-gray-400">点击"添加文件"或拖拽文件到上方区域</div>
                        </div>
                      ) : (
                        filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white"
                          >
                            {/* 左侧 - 文件图标 */}
                            <div className="flex-shrink-0">
                              {(() => {
                                const Icon = typeIcons[doc.type]
                                return <Icon className="h-8 w-8 text-red-500" />
                              })()}
                            </div>
                            
                            {/* 中部 - 文件信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate mb-1">
                                {doc.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {doc.size && ` · ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                              </div>
                            </div>
                            
                            {/* 右侧 - 操作按钮 */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                                title="重新上传"
                              >
                                <RotateCw className="h-4 w-4 text-gray-600" />
                              </button>
                              
                              <div className="p-1.5">
                                {doc.status === 'completed' && (
                                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                                {doc.status === 'failed' && (
                                  <X className="h-5 w-5 text-red-500" />
                                )}
                                {doc.status === 'embedding' && (
                                  <RotateCw className="h-5 w-5 text-blue-500 animate-spin" />
                                )}
                                {doc.status === 'pending' && (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                              </div>
                              
                              <button
                                onClick={() => deleteDocument(selectedKB.id, doc.id)}
                                className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <Folder className="h-16 w-16 text-gray-300 mb-4" />
                  <div className="text-lg font-medium text-gray-600 mb-2">请选择或创建一个知识库</div>
                  <div className="text-sm text-gray-400">从左侧列表中选择一个知识库开始管理文档</div>
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
