'use client'

import { useState } from 'react'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Plus, MessageSquare, Edit2, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 可拖拽的话题项组件
function SortableTopicItem({ 
  topic, 
  isActive, 
  isEditing, 
  editName, 
  onSelect, 
  onStartEdit, 
  onSaveEdit, 
  onCancelEdit, 
  onDelete, 
  onEditChange 
}: { 
  topic: any
  isActive: boolean
  isEditing: boolean
  editName: string
  onSelect: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onEditChange: (value: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'opacity-50'
      )}
      {...attributes}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
            isActive 
              ? 'bg-blue-100 text-blue-900 border border-blue-200' 
              : 'hover:bg-gray-100'
          )}>
            {/* 拖拽手柄 */}
            <div 
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
            
            <MessageSquare className="h-4 w-4 text-gray-500 shrink-0" />
            
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
                className="h-6 text-sm px-1"
                autoFocus
              />
            ) : (
              <span 
                className="flex-1 truncate"
                onClick={onSelect}
              >
                {topic.name}
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onStartEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            重命名
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={onDelete}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export function TopicSidebar() {
  const { currentAgentId } = useAgentStore()
  const { 
    topics, 
    currentTopicId, 
    setCurrentTopic, 
    addTopic, 
    updateTopic, 
    deleteTopic, 
    getTopicsByAgent,
    reorderTopics 
  } = useTopicStore()
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const currentTopics = currentAgentId ? getTopicsByAgent(currentAgentId) : []

  // 处理拖拽结束
  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over?.id && currentAgentId) {
      const oldIndex = currentTopics.findIndex((topic) => topic.id === active.id)
      const newIndex = currentTopics.findIndex((topic) => topic.id === over.id)
      
      reorderTopics(currentAgentId, oldIndex, newIndex)
    }
  }

  const handleAddTopic = () => {
    if (!currentAgentId) {
      toast.error('请先选择一个智能体')
      return
    }
    
    const name = `新话题 ${currentTopics.length + 1}`
    const id = addTopic({
      name,
      agentId: currentAgentId,
      messages: []
    })
    setCurrentTopic(id)
    toast.success('已创建新话题')
  }

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleEditSave = () => {
    if (editingId && editName.trim()) {
      updateTopic(editingId, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
      toast.success('话题名称已更新')
    }
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleDelete = (id: string) => {
    deleteTopic(id)
    toast.success('已删除话题')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      const now = new Date()
      const diff = now.getTime() - dateObj.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return '今天'
      } else if (days === 1) {
        return '昨天'
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      }
    } catch (error) {
      console.error('Date formatting error:', error)
      return '未知时间'
    }
  }

  return (
    <div className="flex h-full w-64 min-w-64 flex-col border-l bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">话题</h2>
          <Button
            size="sm"
            onClick={handleAddTopic}
            disabled={!currentAgentId}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New Topic Button */}
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-12"
          onClick={handleAddTopic}
          disabled={!currentAgentId}
        >
          <Plus className="h-4 w-4" />
          新建话题
        </Button>
      </div>

      {/* Topic List */}
      <div className="flex-1 overflow-y-auto p-2">
        {currentTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageSquare className="h-8 w-8 mb-2" />
            <p className="text-sm">暂无话题</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={currentTopics.map(topic => topic.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {currentTopics.map((topic) => (
                  <SortableTopicItem
                    key={topic.id}
                    topic={topic}
                    isActive={currentTopicId === topic.id}
                    isEditing={editingId === topic.id}
                    editName={editName}
                    onSelect={() => setCurrentTopic(topic.id)}
                    onStartEdit={() => handleEditStart(topic.id, topic.name)}
                    onSaveEdit={handleEditSave}
                    onCancelEdit={handleEditCancel}
                    onDelete={() => handleDelete(topic.id)}
                    onEditChange={setEditName}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}