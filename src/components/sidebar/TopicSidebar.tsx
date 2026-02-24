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
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  FolderPlus, 
  Folder, 
  FolderOpen,
  ChevronRight,
  ChevronDown,
  X,
  FolderInput,
  FolderOutput,
  CheckSquare,
  Square,
  Settings2,
  Trash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Topic, Folder as FolderType } from '@/types/agent'

// 格式化时间
function formatDate(date: Date | string) {
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    
    return `${year}/${month}/${day} ${hours}:${minutes}`
  } catch (error) {
    return ''
  }
}

// 可拖拽的话题项组件（新设计）
function SortableTopicItem({ 
  topic, 
  isActive, 
  isEditing, 
  editName, 
  isSelected,
  isManageMode,
  onSelect, 
  onStartEdit, 
  onSaveEdit, 
  onCancelEdit, 
  onDelete, 
  onEditChange,
  onMoveToFolder,
  onToggleSelect,
  folders,
  inFolder = false,
}: { 
  topic: Topic
  isActive: boolean
  isEditing: boolean
  editName: string
  isSelected: boolean
  isManageMode: boolean
  onSelect: () => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onEditChange: (value: string) => void
  onMoveToFolder: (folderId: string | null) => void
  onToggleSelect: () => void
  folders: FolderType[]
  inFolder?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: topic.id,
    data: { type: 'topic', topic }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50',
        inFolder && 'ml-4'
      )}
      {...attributes}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            {...listeners}
            onClick={!isManageMode ? onSelect : undefined}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-3 text-sm cursor-pointer transition-all',
              'hover:bg-gray-100',
              isActive 
                ? 'bg-blue-100 text-blue-900 border border-blue-200' 
                : isSelected
                ? 'bg-blue-50 border border-blue-300'
                : 'border border-transparent'
            )}
          >
            {/* 管理模式复选框 */}
            {isManageMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect()
                }}
                className="shrink-0 mt-0.5"
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
            
            {/* 话题内容 */}
            <div className="flex-1 min-w-0">
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
                    e.stopPropagation()
                  }}
                  className="h-7 text-sm px-2"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="font-medium text-gray-900 truncate mb-1">
                    {topic.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(topic.createdAt)}
                  </div>
                </>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onStartEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            重命名
          </ContextMenuItem>
          
          {/* 移动到文件夹子菜单 */}
          {folders.length > 0 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FolderInput className="h-4 w-4 mr-2" />
                移动到文件夹
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {topic.folderId && (
                  <>
                    <ContextMenuItem onClick={() => onMoveToFolder(null)}>
                      <FolderOutput className="h-4 w-4 mr-2" />
                      移出文件夹
                    </ContextMenuItem>
                    <div className="h-px bg-gray-200 my-1" />
                  </>
                )}
                {folders.map(folder => (
                  <ContextMenuItem 
                    key={folder.id}
                    onClick={() => onMoveToFolder(folder.id)}
                    disabled={topic.folderId === folder.id}
                  >
                    <Folder className="h-4 w-4 mr-2 text-amber-500" />
                    {folder.name}
                    {topic.folderId === folder.id && (
                      <span className="ml-2 text-xs text-gray-400">当前</span>
                    )}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
          
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

// 可放置的文件夹组件
function SortableFolderItem({
  folder,
  topics,
  currentTopicId,
  editingId,
  editName,
  folders,
  selectedTopics,
  isOver,
  isManageMode,
  onToggle,
  onStartEditFolder,
  onSaveEditFolder,
  onCancelEdit,
  onDeleteFolder,
  onEditChange,
  onSelectTopic,
  onStartEditTopic,
  onSaveEditTopic,
  onDeleteTopic,
  onMoveTopicToFolder,
  onToggleSelectTopic,
}: {
  folder: FolderType
  topics: Topic[]
  currentTopicId: string | null
  editingId: string | null
  editName: string
  folders: FolderType[]
  selectedTopics: Set<string>
  isOver: boolean
  isManageMode: boolean
  onToggle: () => void
  onStartEditFolder: () => void
  onSaveEditFolder: () => void
  onCancelEdit: () => void
  onDeleteFolder: () => void
  onEditChange: (value: string) => void
  onSelectTopic: (id: string) => void
  onStartEditTopic: (id: string, name: string) => void
  onSaveEditTopic: () => void
  onDeleteTopic: (id: string) => void
  onMoveTopicToFolder: (topicId: string, folderId: string | null) => void
  onToggleSelectTopic: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: folder.id,
    data: { type: 'folder', folder }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isEditingFolder = editingId === folder.id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
      {...attributes}
    >
      {/* 文件夹头部 */}
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            {...listeners}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all cursor-pointer',
              isOver 
                ? 'bg-blue-100 border-2 border-blue-400 border-dashed scale-105' 
                : 'hover:bg-gray-100 border-2 border-transparent'
            )}
          >
            {/* 展开/收起按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              className="shrink-0"
            >
              {folder.isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {/* 文件夹图标 */}
            {folder.isExpanded ? (
              <FolderOpen className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isOver ? "text-blue-600" : "text-amber-500"
              )} />
            ) : (
              <Folder className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isOver ? "text-blue-600" : "text-amber-500"
              )} />
            )}
            
            {/* 文件夹名称 */}
            {isEditingFolder ? (
              <Input
                value={editName}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onSaveEditFolder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEditFolder()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                  e.stopPropagation()
                }}
                className="h-6 text-sm px-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={cn(
                "flex-1 font-medium truncate transition-colors",
                isOver ? "text-blue-700" : "text-gray-700"
              )}>
                {folder.name}
              </span>
            )}
            
            {/* 话题数量 */}
            <span className={cn(
              "text-xs transition-colors",
              isOver ? "text-blue-600 font-semibold" : "text-gray-400"
            )}>
              {topics.length}
            </span>
            
            {/* 拖拽提示 */}
            {isOver && (
              <span className="text-xs text-blue-600 font-medium animate-pulse">
                松开移入
              </span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onStartEditFolder}>
            <Edit2 className="h-4 w-4 mr-2" />
            重命名
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={onDeleteFolder}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            删除文件夹
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 文件夹内的话题列表 */}
      {folder.isExpanded && (
        <div className="mt-1 space-y-1">
          {topics.map((topic) => (
            <SortableTopicItem
              key={topic.id}
              topic={topic}
              isActive={currentTopicId === topic.id}
              isEditing={editingId === topic.id}
              editName={editName}
              isSelected={selectedTopics.has(topic.id)}
              isManageMode={isManageMode}
              folders={folders}
              onSelect={() => onSelectTopic(topic.id)}
              onStartEdit={() => onStartEditTopic(topic.id, topic.name)}
              onSaveEdit={onSaveEditTopic}
              onCancelEdit={onCancelEdit}
              onDelete={() => onDeleteTopic(topic.id)}
              onEditChange={onEditChange}
              onMoveToFolder={(folderId) => onMoveTopicToFolder(topic.id, folderId)}
              onToggleSelect={() => onToggleSelectTopic(topic.id)}
              inFolder={true}
            />
          ))}
        </div>
      )}
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
    reorderTopics,
    reorderTopicsInLocation,
    folders,
    addFolder,
    updateFolder,
    deleteFolder,
    toggleFolder,
    getFoldersByAgent,
    moveTopicToFolder,
    reorderFolders,
  } = useTopicStore()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set())
  const [isManageMode, setIsManageMode] = useState(false)
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const currentTopics = currentAgentId ? getTopicsByAgent(currentAgentId) : []
  const currentFolders = currentAgentId ? getFoldersByAgent(currentAgentId) : []

  // 过滤搜索结果
  const filteredTopics = searchQuery 
    ? currentTopics.filter(topic => 
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentTopics

  // 获取未归档的话题
  const unfiledTopics = filteredTopics.filter(topic => !topic.folderId)

  // 获取文件夹内的话题
  const getTopicsInFolder = (folderId: string) => {
    return filteredTopics.filter(topic => topic.folderId === folderId)
  }

  // 处理拖拽开始
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  // 处理拖拽悬停
  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    setOverId(over?.id as string | null)
  }

  // 处理拖拽结束
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over || !currentAgentId) return

    const activeData = active.data.current
    const overData = over.data.current

    // 话题拖到文件夹上（移入文件夹）
    if (activeData?.type === 'topic' && overData?.type === 'folder') {
      const topic = activeData.topic as Topic
      const folder = overData.folder as FolderType
      
      // 如果有选中的话题，批量移动
      if (selectedTopics.size > 0 && selectedTopics.has(topic.id)) {
        const count = selectedTopics.size
        selectedTopics.forEach(topicId => {
          moveTopicToFolder(topicId, folder.id)
        })
        setSelectedTopics(new Set())
        toast.success(`已将 ${count} 个话题移入"${folder.name}"`)
      } else {
        moveTopicToFolder(topic.id, folder.id)
        toast.success(`已将话题移入"${folder.name}"`)
      }
      return
    }

    // 话题拖到话题上（同位置排序）
    if (activeData?.type === 'topic' && overData?.type === 'topic') {
      const activeTopic = activeData.topic as Topic
      const overTopic = overData.topic as Topic
      
      // 只有在同一位置（同一文件夹或都在根目录）才能排序
      if (activeTopic.folderId === overTopic.folderId) {
        const folderId = activeTopic.folderId || null
        const locationTopics = folderId 
          ? getTopicsInFolder(folderId)
          : unfiledTopics
        
        const oldIndex = locationTopics.findIndex(t => t.id === active.id)
        const newIndex = locationTopics.findIndex(t => t.id === over.id)
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          reorderTopicsInLocation(currentAgentId, folderId, oldIndex, newIndex)
        }
      }
      return
    }

    // 文件夹重排序
    if (activeData?.type === 'folder' && overData?.type === 'folder') {
      const oldIndex = currentFolders.findIndex(f => f.id === active.id)
      const newIndex = currentFolders.findIndex(f => f.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        reorderFolders(currentAgentId, oldIndex, newIndex)
      }
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

  const handleAddFolder = () => {
    if (!currentAgentId) {
      toast.error('请先选择一个智能体')
      return
    }
    
    const name = `新文件夹 ${currentFolders.length + 1}`
    const id = addFolder({
      name,
      agentId: currentAgentId,
      isExpanded: true,
      order: currentFolders.length,
    })
    
    // 立即进入编辑模式
    setEditingId(id)
    setEditName(name)
    toast.success('已创建新文件夹')
  }

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }

  const handleEditSave = () => {
    if (!editingId || !editName.trim()) {
      handleEditCancel()
      return
    }

    const folder = currentFolders.find(f => f.id === editingId)
    if (folder) {
      updateFolder(editingId, { name: editName.trim() })
      toast.success('文件夹名称已更新')
    } else {
      updateTopic(editingId, { name: editName.trim() })
      toast.success('话题名称已更新')
    }
    
    setEditingId(null)
    setEditName('')
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleDeleteTopic = (id: string) => {
    deleteTopic(id)
    selectedTopics.delete(id)
    setSelectedTopics(new Set(selectedTopics))
    toast.success('已删除话题')
  }

  const handleDeleteFolder = (id: string) => {
    const folder = currentFolders.find(f => f.id === id)
    const topicsInFolder = getTopicsInFolder(id)
    
    if (topicsInFolder.length > 0) {
      toast.info(`已删除文件夹"${folder?.name}"，其中的 ${topicsInFolder.length} 个话题已移出`)
    } else {
      toast.success('已删除文件夹')
    }
    
    deleteFolder(id)
  }

  const handleMoveToFolder = (topicId: string, folderId: string | null) => {
    moveTopicToFolder(topicId, folderId)
    
    if (folderId) {
      const folder = currentFolders.find(f => f.id === folderId)
      toast.success(`已移入"${folder?.name}"`)
    } else {
      toast.success('已移出文件夹')
    }
  }

  const handleToggleSelect = (topicId: string) => {
    const newSelected = new Set(selectedTopics)
    if (newSelected.has(topicId)) {
      newSelected.delete(topicId)
    } else {
      newSelected.add(topicId)
    }
    setSelectedTopics(newSelected)
  }

  const handleBatchMoveToFolder = (folderId: string | null) => {
    if (selectedTopics.size === 0) return
    
    const count = selectedTopics.size
    selectedTopics.forEach(topicId => {
      moveTopicToFolder(topicId, folderId)
    })
    
    if (folderId) {
      const folder = currentFolders.find(f => f.id === folderId)
      toast.success(`已将 ${count} 个话题移入"${folder?.name}"`)
    } else {
      toast.success(`已将 ${count} 个话题移出文件夹`)
    }
    
    setSelectedTopics(new Set())
    setIsManageMode(false)
  }

  const handleBatchDelete = () => {
    if (selectedTopics.size === 0) return
    
    const count = selectedTopics.size
    selectedTopics.forEach(topicId => {
      deleteTopic(topicId)
    })
    
    toast.success(`已删除 ${count} 个话题`)
    setSelectedTopics(new Set())
    setIsManageMode(false)
  }

  const handleToggleManageMode = () => {
    setIsManageMode(!isManageMode)
    if (isManageMode) {
      setSelectedTopics(new Set())
    }
  }

  // 获取所有可拖拽项的ID
  const allDraggableIds = [
    ...currentFolders.map(f => f.id),
    ...currentTopics.map(t => t.id),
  ]

  return (
    <div className="flex h-full w-64 min-w-64 flex-col border-l bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">话题</h2>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={isManageMode ? "default" : "ghost"}
              onClick={handleToggleManageMode}
              className="h-8 w-8 p-0"
              title="管理话题"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddFolder}
              disabled={!currentAgentId}
              className="h-8 w-8 p-0"
              title="新建文件夹"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleAddTopic}
              disabled={!currentAgentId}
              className="h-8 w-8 p-0"
              title="新建话题"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索话题..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* 批量操作工具栏 */}
      {isManageMode && selectedTopics.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              已选中 {selectedTopics.size} 个话题
            </span>
          </div>
          <div className="flex gap-2">
            {currentFolders.length > 0 && (
              <div className="flex-1">
                <select
                  className="w-full h-8 text-sm border rounded px-2 bg-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchMoveToFolder(e.target.value === 'null' ? null : e.target.value)
                    }
                  }}
                  value=""
                >
                  <option value="">批量移动到...</option>
                  {currentFolders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      📂 {folder.name}
                    </option>
                  ))}
                  <option value="null">📤 移出文件夹</option>
                </select>
              </div>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBatchDelete}
              className="h-8"
            >
              <Trash className="h-4 w-4 mr-1" />
              删除
            </Button>
          </div>
        </div>
      )}

      {/* New Topic Button */}
      <div className="p-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-10"
          onClick={handleAddTopic}
          disabled={!currentAgentId}
        >
          <Plus className="h-4 w-4" />
          新建话题
        </Button>
      </div>

      {/* Topic and Folder List */}
      <div className="flex-1 overflow-y-auto p-2">
        {!currentAgentId ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-sm">请先选择智能体</p>
          </div>
        ) : searchQuery && filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <Search className="h-8 w-8 mb-2" />
            <p className="text-sm">未找到匹配的话题</p>
          </div>
        ) : currentTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="text-sm">暂无话题</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={allDraggableIds} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {/* 文件夹列表 */}
                {currentFolders.map((folder) => (
                  <SortableFolderItem
                    key={folder.id}
                    folder={folder}
                    topics={getTopicsInFolder(folder.id)}
                    currentTopicId={currentTopicId}
                    editingId={editingId}
                    editName={editName}
                    folders={currentFolders}
                    selectedTopics={selectedTopics}
                    isOver={overId === folder.id}
                    isManageMode={isManageMode}
                    onToggle={() => toggleFolder(folder.id)}
                    onStartEditFolder={() => handleEditStart(folder.id, folder.name)}
                    onSaveEditFolder={handleEditSave}
                    onCancelEdit={handleEditCancel}
                    onDeleteFolder={() => handleDeleteFolder(folder.id)}
                    onEditChange={setEditName}
                    onSelectTopic={setCurrentTopic}
                    onStartEditTopic={(id, name) => handleEditStart(id, name)}
                    onSaveEditTopic={handleEditSave}
                    onDeleteTopic={handleDeleteTopic}
                    onMoveTopicToFolder={handleMoveToFolder}
                    onToggleSelectTopic={handleToggleSelect}
                  />
                ))}

                {/* 未归档的话题 */}
                {unfiledTopics.map((topic) => (
                  <SortableTopicItem
                    key={topic.id}
                    topic={topic}
                    isActive={currentTopicId === topic.id}
                    isEditing={editingId === topic.id}
                    editName={editName}
                    isSelected={selectedTopics.has(topic.id)}
                    isManageMode={isManageMode}
                    folders={currentFolders}
                    onSelect={() => setCurrentTopic(topic.id)}
                    onStartEdit={() => handleEditStart(topic.id, topic.name)}
                    onSaveEdit={handleEditSave}
                    onCancelEdit={handleEditCancel}
                    onDelete={() => handleDeleteTopic(topic.id)}
                    onEditChange={setEditName}
                    onMoveToFolder={(folderId) => handleMoveToFolder(topic.id, folderId)}
                    onToggleSelect={() => handleToggleSelect(topic.id)}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId ? (
                <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-sm border-2 border-blue-400">
                  {selectedTopics.size > 1 && selectedTopics.has(activeId) ? (
                    <span className="font-medium text-blue-700">
                      {selectedTopics.size} 个话题
                    </span>
                  ) : (
                    currentFolders.find(f => f.id === activeId)?.name || 
                    currentTopics.find(t => t.id === activeId)?.name
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}
