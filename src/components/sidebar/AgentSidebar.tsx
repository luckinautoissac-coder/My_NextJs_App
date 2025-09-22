'use client'

import { useEffect, useState } from 'react'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { Bot, RefreshCw, Settings, Wrench, Database, Zap, GripVertical } from 'lucide-react'
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ModelServiceDialog } from '@/components/settings/ModelServiceDialog'
import { DataSettingsDialog } from '@/components/settings/DataSettingsDialog'
import { QuickPhrasesDialog } from '@/components/settings/QuickPhrasesDialog'

// 可拖拽的智能体项组件
function SortableAgentItem({ agent, isActive, onClick }: { agent: any, isActive: boolean, onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: agent.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100',
        isDragging && 'opacity-50'
      )}
      {...attributes}
    >
      {/* 拖拽手柄 */}
      <div 
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      {/* 智能体图标和信息 */}
      <div className="flex items-center gap-3 flex-1" onClick={onClick}>
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          isActive ? 'bg-blue-100' : 'bg-gray-100'
        )}>
          <Bot className={cn('h-4 w-4', isActive ? 'text-blue-600' : 'text-gray-600')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agent.name}</p>
          <p className="text-xs text-gray-500 truncate">{agent.description}</p>
        </div>
      </div>
    </div>
  )
}

export function AgentSidebar() {
  const { agents, currentAgentId, setCurrentAgent, loadAgents, isLoading, reorderAgents } = useAgentStore()
  const { getTopicsByAgent, setCurrentTopic, currentTopicId } = useTopicStore()
  
  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // 对话框状态
  const [modelServiceOpen, setModelServiceOpen] = useState(false)
  const [dataSettingsOpen, setDataSettingsOpen] = useState(false)
  const [quickPhrasesOpen, setQuickPhrasesOpen] = useState(false)

  // 处理拖拽结束
  function handleDragEnd(event: any) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = agents.findIndex((agent) => agent.id === active.id)
      const newIndex = agents.findIndex((agent) => agent.id === over.id)
      
      reorderAgents(oldIndex, newIndex)
    }
  }

  // 组件加载时获取智能体列表
  useEffect(() => {
    if (agents.length === 0) {
      loadAgents()
    }
  }, [])

  // 确保智能体和话题的一致性
  useEffect(() => {
    if (currentAgentId && !currentTopicId) {
      // 如果选择了智能体但没有选择话题，自动选择该智能体的最新话题
      const agentTopics = getTopicsByAgent(currentAgentId)
      if (agentTopics.length > 0) {
        const latestTopic = agentTopics.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]
        if (latestTopic) {
          setCurrentTopic(latestTopic.id)
        }
      }
    } else if (currentTopicId && currentAgentId) {
      // 检查当前话题是否属于当前智能体
      const currentTopic = getTopicsByAgent(currentAgentId).find(t => t.id === currentTopicId)
      if (!currentTopic) {
        // 如果当前话题不属于当前智能体，切换到该智能体的最新话题
        const agentTopics = getTopicsByAgent(currentAgentId)
        if (agentTopics.length > 0) {
          const latestTopic = agentTopics.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0]
          if (latestTopic) {
            setCurrentTopic(latestTopic.id)
          }
        } else {
          setCurrentTopic('')
        }
      }
    }
  }, [currentAgentId, currentTopicId, getTopicsByAgent, setCurrentTopic])

  const handleRefresh = () => {
    loadAgents()
  }

  // 设置菜单处理函数
  const handleModelService = () => {
    setModelServiceOpen(true)
  }

  const handleDataSettings = () => {
    setDataSettingsOpen(true)
  }

  const handleQuickPhrasesSettings = () => {
    setQuickPhrasesOpen(true)
  }

  // 处理智能体切换
  const handleAgentSelect = (agentId: string) => {
    setCurrentAgent(agentId)
    
    // 自动切换到该智能体的第一个话题（如果存在）
    const agentTopics = getTopicsByAgent(agentId)
    if (agentTopics.length > 0) {
      // 按更新时间排序，选择最近的话题
      const latestTopic = agentTopics.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0]
      if (latestTopic) {
        setCurrentTopic(latestTopic.id)
      }
    } else {
      // 如果该智能体没有话题，清除当前话题选择
      setCurrentTopic('')
    }
  }

  return (
    <>
      <div className="flex h-full w-64 min-w-64 flex-col border-r bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">智能体</h2>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors",
                isLoading && "animate-spin"
              )}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">加载智能体中...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Bot className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">暂无可用智能体</p>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={agents.map(agent => agent.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {agents.map((agent) => (
                  <SortableAgentItem
                    key={agent.id}
                    agent={agent}
                    isActive={currentAgentId === agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        </div>

        {/* 底部设置按钮 */}
        <div className="border-t bg-white p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-48">
              <DropdownMenuItem onClick={handleModelService}>
                <Wrench className="h-4 w-4 mr-2" />
                模型服务
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDataSettings}>
                <Database className="h-4 w-4 mr-2" />
                数据设置
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleQuickPhrasesSettings}>
                <Zap className="h-4 w-4 mr-2" />
                快捷短语
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 设置对话框 */}
      <ModelServiceDialog
        open={modelServiceOpen}
        onOpenChange={setModelServiceOpen}
      />
      
      <DataSettingsDialog
        open={dataSettingsOpen}
        onOpenChange={setDataSettingsOpen}
      />
      
      <QuickPhrasesDialog
        open={quickPhrasesOpen}
        onOpenChange={setQuickPhrasesOpen}
      />
    </>
  )
}