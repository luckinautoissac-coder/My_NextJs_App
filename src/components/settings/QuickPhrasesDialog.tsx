'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Zap, Plus, Edit, Trash2, Save, X, Search, 
  MessageSquare, Code, Languages, FileText, GripVertical 
} from 'lucide-react'
import { toast } from 'sonner'
import { useQuickPhrasesStore } from '@/store/quickPhrasesStore'
import type { QuickPhrase } from '@/types/quickPhrases'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface QuickPhrasesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface EditingPhrase {
  id?: string
  name: string
  content: string
  category: string
}

// 可拖拽的短语卡片组件
function SortablePhraseCard({ 
  phrase, 
  onEdit, 
  onDelete,
  isDragEnabled 
}: { 
  phrase: QuickPhrase
  onEdit: (phrase: QuickPhrase) => void
  onDelete: (id: string) => void
  isDragEnabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phrase.id, disabled: !isDragEnabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn('group', isDragging && 'opacity-50')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {isDragEnabled && (
                <div 
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <CardTitle className="text-base flex items-center gap-2">
                {phrase.name}
                {phrase.category && (
                  <Badge variant="secondary" className="text-xs">
                    {phrase.category}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(phrase)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(phrase.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {phrase.content}
          </p>
          <div className="text-xs text-gray-400 mt-2">
            创建于 {phrase.createdAt.toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function QuickPhrasesDialog({ open, onOpenChange }: QuickPhrasesDialogProps) {
  const { phrases, addPhrase, updatePhrase, deletePhrase, reorderPhrases } = useQuickPhrasesStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [editingPhrase, setEditingPhrase] = useState<EditingPhrase | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 获取所有分类
  const categories = Array.from(new Set(phrases.map(p => p.category).filter(Boolean)))
  const categoryOptions = [
    { value: 'all', label: '全部', icon: MessageSquare },
    { value: '翻译', label: '翻译', icon: Languages },
    { value: '编程', label: '编程', icon: Code },
    { value: '总结', label: '总结', icon: FileText },
    ...categories.filter(cat => !['翻译', '编程', '总结'].includes(cat!))
      .map(cat => ({ value: cat!, label: cat!, icon: MessageSquare }))
  ]

  // 过滤短语
  const filteredPhrases = phrases.filter(phrase => {
    const matchesSearch = !searchQuery || 
      phrase.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || phrase.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // 判断是否启用拖拽（只有在未筛选时才能拖拽排序）
  const isDragEnabled = !searchQuery && selectedCategory === 'all'

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = phrases.findIndex((phrase) => phrase.id === active.id)
      const newIndex = phrases.findIndex((phrase) => phrase.id === over.id)
      
      reorderPhrases(oldIndex, newIndex)
    }
  }

  const handleCreatePhrase = () => {
    setEditingPhrase({
      name: '',
      content: '',
      category: selectedCategory === 'all' ? '' : selectedCategory
    })
    setIsCreating(true)
  }

  const handleEditPhrase = (phrase: QuickPhrase) => {
    setEditingPhrase({
      id: phrase.id,
      name: phrase.name,
      content: phrase.content,
      category: phrase.category || ''
    })
    setIsCreating(false)
  }

  const handleSavePhrase = () => {
    if (!editingPhrase) return

    if (!editingPhrase.name.trim()) {
      toast.error('请输入短语名称')
      return
    }

    if (!editingPhrase.content.trim()) {
      toast.error('请输入短语内容')
      return
    }

    if (isCreating) {
      addPhrase({
        name: editingPhrase.name.trim(),
        content: editingPhrase.content.trim(),
        category: editingPhrase.category.trim() || undefined
      })
      toast.success('快捷短语已创建')
    } else if (editingPhrase.id) {
      updatePhrase(editingPhrase.id, {
        name: editingPhrase.name.trim(),
        content: editingPhrase.content.trim(),
        category: editingPhrase.category.trim() || undefined
      })
      toast.success('快捷短语已更新')
    }

    setEditingPhrase(null)
    setIsCreating(false)
  }

  const handleDeletePhrase = (id: string) => {
    deletePhrase(id)
    toast.success('快捷短语已删除')
  }

  const handleCancelEdit = () => {
    setEditingPhrase(null)
    setIsCreating(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            快捷短语管理
          </DialogTitle>
          <DialogDescription>
            创建和管理您的常用短语，提高聊天效率
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 搜索和筛选 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索短语名称或内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreatePhrase}>
              <Plus className="h-4 w-4 mr-2" />
              新建短语
            </Button>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 flex-wrap">
            {categoryOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={selectedCategory === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(value)}
                className="h-8"
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>

          {/* 短语列表 */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4">
                {filteredPhrases.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无快捷短语</p>
                    <p className="text-sm">点击"新建短语"创建您的第一个快捷短语</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={filteredPhrases.map(phrase => phrase.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredPhrases.map((phrase) => (
                        <SortablePhraseCard
                          key={phrase.id}
                          phrase={phrase}
                          onEdit={handleEditPhrase}
                          onDelete={handleDeletePhrase}
                          isDragEnabled={isDragEnabled}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* 编辑短语对话框 */}
      {editingPhrase && (
        <Dialog open={true} onOpenChange={() => handleCancelEdit()}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? '新建快捷短语' : '编辑快捷短语'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="phrase-name">短语名称</Label>
                <Input
                  id="phrase-name"
                  placeholder="为您的快捷短语起个名字"
                  value={editingPhrase.name}
                  onChange={(e) => setEditingPhrase({
                    ...editingPhrase,
                    name: e.target.value
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phrase-category">分类（可选）</Label>
                <Input
                  id="phrase-category"
                  placeholder="例如：翻译、编程、总结"
                  value={editingPhrase.category}
                  onChange={(e) => setEditingPhrase({
                    ...editingPhrase,
                    category: e.target.value
                  })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phrase-content">短语内容</Label>
                <Textarea
                  id="phrase-content"
                  placeholder="输入您的快捷短语内容..."
                  rows={4}
                  value={editingPhrase.content}
                  onChange={(e) => setEditingPhrase({
                    ...editingPhrase,
                    content: e.target.value
                  })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                取消
              </Button>
              <Button onClick={handleSavePhrase}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  )
}