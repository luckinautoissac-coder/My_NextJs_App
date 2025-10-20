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
        return <Check className="h-4 w-4 text-green-500" />
      case 'failed':
        return <X className="h-4 w-4 text-red-500" />
      case 'embedding':
        return <RotateCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>知识库管理</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-4 h-full overflow-hidden">
            {/* 左侧：知识库列表 */}
            <div className="w-64 border-r pr-4 flex flex-col gap-2 overflow-y-auto">
              {knowledgeBases.map((kb) => (
                <ContextMenu key={kb.id}>
                  <ContextMenuTrigger>
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedKBId === kb.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedKBId(kb.id)}
                    >
                      <div className="font-medium truncate">{kb.name}</div>
                      <div className="text-xs opacity-70 mt-1">
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
                className="w-full justify-start"
                onClick={() => setShowNewKBDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加新知识库
              </Button>
            </div>

            {/* 右侧：文档管理 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {selectedKB ? (
                <>
                  {/* 第一行：嵌入模型 */}
                  <div className="mb-4 p-3 bg-accent rounded-lg">
                    <span className="text-sm font-medium">嵌入模型：</span>
                    <span className="text-sm ml-2">
                      {embeddingModels.find(m => m.id === selectedKB.embeddingModel)?.name || '未知模型'}
                    </span>
                  </div>

                  {/* 第二行：分类标签 */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      size="sm"
                      variant={activeTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setActiveTab('all')}
                    >
                      全部
                    </Button>
                    {(['file', 'note', 'directory', 'url', 'website'] as DocumentType[]).map((type) => {
                      const Icon = typeIcons[type]
                      return (
                        <Button
                          key={type}
                          size="sm"
                          variant={activeTab === type ? 'default' : 'outline'}
                          onClick={() => setActiveTab(type)}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {type === 'file' ? '文件' : type === 'note' ? '笔记' : type === 'directory' ? '目录' : type === 'url' ? '网址' : '网站'}
                        </Button>
                      )
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
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
                    className="border-2 border-dashed rounded-lg p-8 mb-4 text-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-medium mb-2">拖拽文件到这里</div>
                    <div className="text-sm text-muted-foreground">
                      支持 TXT, MD, HTML, PDF, DOCX, PPTX, XLSX, EPUB...格式
                    </div>
                  </div>

                  {/* 第四行：文档列表 */}
                  <div className="flex-1 overflow-y-auto space-y-2">
                    {filteredDocs.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        暂无文档
                      </div>
                    ) : (
                      filteredDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {(() => {
                              const Icon = typeIcons[doc.type]
                              return <Icon className="h-4 w-4 flex-shrink-0" />
                            })()}
                            <span className="truncate">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                            {getStatusIcon(doc.status)}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteDocument(selectedKB.id, doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  请选择或创建一个知识库
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建知识库对话框 */}
      <Dialog open={showNewKBDialog} onOpenChange={setShowNewKBDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kb-name">名称</Label>
              <Input
                id="kb-name"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="输入知识库名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-model">嵌入模型</Label>
              <Select value={newKBModel} onValueChange={setNewKBModel}>
                <SelectTrigger id="kb-model">
                  <SelectValue placeholder="选择嵌入模型" />
                </SelectTrigger>
                <SelectContent>
                  {embeddingModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewKBDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateKB}>创建</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑知识库对话框 */}
      <Dialog open={showEditKBDialog} onOpenChange={setShowEditKBDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>知识库设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-kb-name">名称</Label>
              <Input
                id="edit-kb-name"
                value={newKBName}
                onChange={(e) => setNewKBName(e.target.value)}
                placeholder="输入知识库名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-kb-model">嵌入模型</Label>
              <Select value={newKBModel} onValueChange={setNewKBModel}>
                <SelectTrigger id="edit-kb-model">
                  <SelectValue placeholder="选择嵌入模型" />
                </SelectTrigger>
                <SelectContent>
                  {embeddingModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditKBDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateKB}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
