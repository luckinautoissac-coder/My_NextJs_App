'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types/chat'
import { 
  Bot, Copy, User, Clock, AlertCircle, RefreshCw, Edit, Trash2, 
  AtSign, MoreHorizontal, Menu, CheckSquare, GitBranch, Brain
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useChatStore } from '@/store/chatStore'
import { useTopicStore } from '@/store/topicStore'
import { useAgentStore } from '@/store/agentStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { useThinkingChainStore } from '@/store/thinkingChainStore'
import { sendMessage } from '@/lib/api'
import { ModelSelector } from './ModelSelector'
import { ALL_MODELS } from '@/data/models'
import { MarkdownRenderer } from './MarkdownRenderer'

// 思考消息组件
function ThinkingMessage({ message }: { message: Message }) {
  const [duration, setDuration] = useState(0)

  // 更新思考时长
  useEffect(() => {
    if (!message.thinkingInfo?.startTime) return

    const updateDuration = () => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - message.thinkingInfo!.startTime.getTime()) / 1000)
      setDuration(elapsed)
    }

    // 立即更新一次
    updateDuration()

    // 每秒更新
    const interval = setInterval(updateDuration, 1000)

    return () => clearInterval(interval)
  }, [message.thinkingInfo?.startTime])

  // 根据时长获取思考阶段
  const getThinkingPhase = (seconds: number) => {
    if (seconds < 5) return '正在理解问题...'
    if (seconds < 10) return '正在分析内容...'
    if (seconds < 20) return '正在深度思考...'
    if (seconds < 30) return '正在组织语言...'
    return '正在精心打磨回答...'
  }

  // 格式化时间显示
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}秒`
    } else {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}分${remainingSeconds}秒`
    }
  }

  return (
    <div className="flex items-start gap-3 p-4">
      {/* AI 头像 */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
          <Bot className="h-4 w-4" />
        </div>
      </div>

      {/* 思考内容 */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg p-4 border">
          {/* 头部信息 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <Brain className="h-4 w-4 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {message.thinkingInfo?.modelName} 正在深度思考
            </span>
            <span className="text-xs text-gray-500">
              ({formatDuration(duration)})
            </span>
          </div>

          {/* 思考阶段 */}
          <div className="text-sm text-gray-600 mb-3">
            {getThinkingPhase(duration)}
          </div>

          {/* 思考动画 */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">思维活跃中</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  // 如果是上下文分隔线消息，显示特殊样式
  if (message.messageType === 'context-separator') {
    return (
      <div className="flex justify-center my-6">
        <div className="flex items-center text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-300 mr-3"></div>
          <span className="px-3 bg-gray-50 rounded-full border border-gray-200">
            {message.content}
          </span>
          <div className="flex-1 h-px bg-gray-300 ml-3"></div>
        </div>
      </div>
    )
  }

  // 如果是思考消息，显示思考过程
  if (message.messageType === 'thinking') {
    return <ThinkingMessage message={message} />
  }

  const isUser = message.role === 'user'
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isRegenerating, setIsRegenerating] = useState(false)
  
  const { updateMessage, addMessage, getMessagesByTopic, deleteMessage, addModelResponse, updateModelResponse, setSelectedModel } = useChatStore()
  const { currentTopicId, addTopic, setCurrentTopic } = useTopicStore()
  const { agents, currentAgentId } = useAgentStore()
  const { apiKey, selectedModel, baseUrl } = useAPISettingsStore()
  const { getCurrentConfig, isEnabled, isDeepThinkingModel } = useThinkingChainStore()
  
  const currentAgent = agents.find(agent => agent.id === currentAgentId)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('消息已复制到剪贴板')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleRegenerate = async () => {
    if (!currentAgent || !currentTopicId || !apiKey || isRegenerating) return
    
    setIsRegenerating(true)
    
    // 获取模型名称
    const modelInfo = ALL_MODELS.find(m => m.id === selectedModel)
    const modelName = modelInfo ? `${modelInfo.name}` : selectedModel

    // 更新消息为思考状态
    updateMessage(message.id, {
      content: '',
      status: 'sending',
      messageType: 'thinking',
      thinkingInfo: {
        startTime: new Date(),
        duration: 0,
        phase: '正在理解问题...',
        modelName: modelName
      }
    })
    
    try {
      // 获取当前消息之前的所有消息作为上下文
      const allMessages = getMessagesByTopic(currentTopicId)
      const messageIndex = allMessages.findIndex(msg => msg.id === message.id)
      const contextMessages = allMessages.slice(0, messageIndex)
      
      // 找到触发这条AI回复的用户消息
      const userMessage = contextMessages[contextMessages.length - 1]
      if (!userMessage || userMessage.role !== 'user') {
        toast.error('无法找到对应的用户消息')
        return
      }
      
      // 准备思维链参数（与ChatInput保持一致）
      const thinkingChainConfig = (isEnabled && selectedModel && isDeepThinkingModel(selectedModel)) 
        ? getCurrentConfig() 
        : null

      console.log('重新生成消息:', {
        userMessage: userMessage.content,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        selectedModel,
        thinkingChain: thinkingChainConfig?.level || 'none',
        contextCount: contextMessages.slice(0, -1).length
      })

      const response = await sendMessage(userMessage.content, apiKey, currentAgent.id, selectedModel, baseUrl, thinkingChainConfig, contextMessages.slice(0, -1))
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      // 更新消息为正式回复
      updateMessage(message.id, {
        content: response.response,
        status: 'sent',
        messageType: 'normal',
        thinkingInfo: undefined,
        modelResponses: [{
          modelId: selectedModel,
          modelName: ALL_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
          content: response.response,
          status: 'sent',
          timestamp: new Date()
        }],
        selectedModelId: selectedModel
      })
      toast.success('消息已重新生成')
      
    } catch (error) {
      console.error('重新生成失败:', error)
      toast.error('重新生成失败，请重试')
      
      // 更新消息为错误状态
      updateMessage(message.id, {
        content: '重新生成失败，请重试。',
        status: 'error',
        messageType: 'normal',
        thinkingInfo: undefined
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      updateMessage(message.id, { content: editContent.trim() })
      toast.success('消息已更新')
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm('确定要删除这条消息吗？')) {
      deleteMessage(message.id)
      toast.success('消息已删除')
    }
  }

  const handleSwitchModel = async (modelId: string, modelName: string) => {
    if (!currentAgent || !currentTopicId || !apiKey) return

    // 检查是否已经有这个模型的回复
    const existingResponse = message.modelResponses?.find(r => r.modelId === modelId)
    if (existingResponse) {
      // 如果已有回复，直接切换显示
      setSelectedModel(message.id, modelId)
      toast.success(`已切换到${modelName}的回复`)
      return
    }

    // 如果没有回复，需要生成新的回复
    const allMessages = getMessagesByTopic(currentTopicId)
    const messageIndex = allMessages.findIndex(msg => msg.id === message.id)
    const contextMessages = allMessages.slice(0, messageIndex)
    
    // 找到触发这条AI回复的用户消息
    const userMessage = contextMessages[contextMessages.length - 1]
    if (!userMessage || userMessage.role !== 'user') {
      toast.error('无法找到对应的用户消息')
      return
    }

    // 添加加载状态的模型回复
    addModelResponse(message.id, {
      modelId,
      modelName,
      content: '',
      status: 'sending'
    })

    // 切换到新模型显示
    setSelectedModel(message.id, modelId)

    try {
      // 准备思维链参数
      const thinkingChainConfig = (isEnabled && modelId && isDeepThinkingModel(modelId)) 
        ? getCurrentConfig() 
        : null

      console.log('切换模型回答:', {
        userMessage: userMessage.content,
        agentId: currentAgent.id,
        agentName: currentAgent.name,
        newModelId: modelId,
        newModelName: modelName,
        thinkingChain: thinkingChainConfig?.level || 'none',
        contextCount: contextMessages.slice(0, -1).length
      })

      const response = await sendMessage(userMessage.content, apiKey, currentAgent.id, modelId, baseUrl, thinkingChainConfig, contextMessages.slice(0, -1))
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      // 更新模型回复内容
      updateModelResponse(message.id, modelId, {
        content: response.response,
        status: 'sent'
      })
      
      toast.success(`${modelName}已回复完成`)
      
    } catch (error) {
      console.error('模型回答失败:', error)
      updateModelResponse(message.id, modelId, {
        content: '抱歉，我现在无法回复。请检查网络连接或稍后重试。',
        status: 'error'
      })
      toast.error(`${modelName}回答失败，请重试`)
    }
  }

  const handleBranch = () => {
    if (!currentTopicId || !currentAgent) return
    
    // 创建分支：复制当前对话到新话题
    const allMessages = getMessagesByTopic(currentTopicId)
    const messageIndex = allMessages.findIndex(msg => msg.id === message.id)
    const branchMessages = allMessages.slice(0, messageIndex + 1)
    
    // 创建新话题
    const branchTopicName = `分支话题 - ${new Date().toLocaleString()}`
    const newTopicId = addTopic({
      name: branchTopicName,
      agentId: currentAgent.id,
      messages: []
    })
    
    // 复制消息到新话题
    branchMessages.forEach(msg => {
      addMessage({
        content: msg.content,
        role: msg.role,
        status: 'sent',
        topicId: newTopicId,
        // 如果有多模型回复，也要复制
        modelResponses: msg.modelResponses,
        selectedModelId: msg.selectedModelId
      })
    })
    
    // 切换到新话题
    setCurrentTopic(newTopicId)
    
    toast.success(`已创建包含${branchMessages.length}条消息的分支话题，并切换到新话题`)
  }

  const handleMultiSelect = () => {
    toast.info('多选功能开发中，需要实现选择状态管理')
  }

  const formatTime = (timestamp: Date) => {
    // 避免水合错误，使用简单的时间格式化
    const hours = timestamp.getHours().toString().padStart(2, '0')
    const minutes = timestamp.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div 
      className={cn(
        'group flex w-full gap-3 hover:bg-gray-50/50 transition-colors',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}
      
      <div className={cn(
        'flex flex-col gap-2 min-w-0',
        isUser ? 'items-end max-w-[85%]' : 'items-start max-w-[90%]'
      )}>
        <div className={cn(
          'relative rounded-lg px-4 py-3 text-sm max-w-full',
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        )}>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border rounded resize-y text-gray-900 bg-white min-h-[120px]"
                rows={Math.max(5, editContent.split('\n').length)}
                autoFocus
                style={{ minHeight: '120px', maxHeight: '400px' }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="h-6 px-2 text-xs">
                  保存
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 px-2 text-xs">
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* 根据消息类型选择渲染方式 */}
              {isUser ? (
                /* 用户消息保持纯文本显示 */
                <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                  {message.content}
                </div>
              ) : message.modelResponses && message.modelResponses.length > 0 ? (
                <div>
                  {/* 显示当前选中模型的回复内容 */}
                  {(() => {
                    const selectedResponse = message.modelResponses.find(r => r.modelId === message.selectedModelId) 
                      || message.modelResponses[0]
                    
                    if (!selectedResponse) {
                      return <div>暂无回复</div>
                    }
                    
                    if (selectedResponse.status === 'sending') {
                      return (
                        <div className="flex items-center gap-2 text-gray-500">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>{selectedResponse.modelName} 正在思考中...</span>
                        </div>
                      )
                    }
                    
                    return (
                      <MarkdownRenderer 
                        content={selectedResponse.content}
                        className="leading-relaxed"
                      />
                    )
                  })()}
                </div>
              ) : (
                /* 传统单一回复显示 */
                <MarkdownRenderer 
                  content={message.content}
                  className="leading-relaxed"
                />
              )}
            </div>
          )}
        </div>

        {/* 操作按钮 - 用户消息 */}
        {isUser && !isEditing && (
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-white/20"
              onClick={handleRegenerate}
              title="重新生成"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-white/20"
              onClick={handleEdit}
              title="编辑"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-white/20"
              onClick={handleCopy}
              title="复制"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-white/20"
              onClick={handleDelete}
              title="删除"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* 操作按钮 - AI消息 */}
        {!isUser && !isEditing && (
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-200"
              onClick={handleCopy}
              title="复制"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-200"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="重新生成"
            >
              <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
            </Button>
            <ModelSelector
              onModelSelect={handleSwitchModel}
              selectedModels={message.modelResponses?.map(r => r.modelId) || []}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-200"
              onClick={handleDelete}
              title="删除"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            
            {/* 更多选项下拉菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-gray-200"
                  title="更多选项"
                >
                  <Menu className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBranch}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  分支
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMultiSelect}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  多选
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* 模型标签 - 仅AI消息显示 */}
        {!isUser && message.modelResponses && message.modelResponses.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {message.modelResponses.map((response) => {
              const model = ALL_MODELS.find(m => m.id === response.modelId)
              const isSelected = response.modelId === message.selectedModelId
              const isLoading = response.status === 'sending'
              
              return (
                <Button
                  key={response.modelId}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-6 px-2 text-xs",
                    isSelected ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50",
                    isLoading && "animate-pulse"
                  )}
                  onClick={() => setSelectedModel(message.id, response.modelId)}
                  disabled={isLoading}
                  title={`切换到${response.modelName}的回复`}
                >
                  {isLoading && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                  {model?.name || response.modelName}
                  {response.status === 'error' && (
                    <AlertCircle className="h-3 w-3 ml-1 text-red-500" />
                  )}
                </Button>
              )
            })}
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatTime(message.timestamp)}</span>
          
          {message.status === 'sending' && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
              <span>发送中...</span>
            </div>
          )}
          
          {message.status === 'error' && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3 w-3" />
              <span>发送失败</span>
            </div>
          )}
        </div>
      </div>
      
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
          <User className="h-4 w-4 text-green-600" />
        </div>
      )}
    </div>
  )
}