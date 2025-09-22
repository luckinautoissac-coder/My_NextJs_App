'use client'

import { AgentSidebar } from '@/components/sidebar/AgentSidebar'
import { TopicSidebar } from '@/components/sidebar/TopicSidebar'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { ThinkingChainControl } from '@/components/chat/ThinkingChainControl'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { useChatStore } from '@/store/chatStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { useThinkingChainStore } from '@/store/thinkingChainStore'
import { ALL_MODELS, MODEL_PROVIDERS } from '@/data/models'

export function MainLayout() {
  const { selectedModel, addedModels, updateSettings } = useAPISettingsStore()
  const { isDeepThinkingModel, setEnabled } = useThinkingChainStore()
  
  // 获取已启用的模型信息
  const enabledModelOptions = (addedModels || []).map(modelId => {
    const model = ALL_MODELS.find(m => m.id === modelId)
    if (!model) return null
    return {
      id: model.id,
      label: `${MODEL_PROVIDERS[model.provider]} - ${model.name}`,
      model
    }
  }).filter((option): option is NonNullable<typeof option> => option !== null)

  // 检查当前模型是否支持深度思考
  const isCurrentModelDeepThinking = selectedModel ? isDeepThinkingModel(selectedModel) : false
  
  // 处理模型选择变化
  const handleModelChange = (modelId: string) => {
    updateSettings({ selectedModel: modelId })
    // 自动启用或禁用思维链功能
    const isDeepModel = isDeepThinkingModel(modelId)
    setEnabled(isDeepModel)
  }

  return (
    <div className="flex h-screen bg-gray-50 layout-container">
      {/* Left Sidebar - Agents */}
      <div className="sidebar-fixed">
        <AgentSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col chat-area">
        {/* Fixed Header - 模型选择与思维链控制 */}
        <div className="flex items-center justify-center border-b bg-white px-6 py-3 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* 模型选择下拉框 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">当前模型:</span>
              <Select 
                value={selectedModel} 
                onValueChange={handleModelChange}
                disabled={enabledModelOptions.length === 0}
              >
                <SelectTrigger className="w-72 flex-shrink-0">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {enabledModelOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        {option.model.isFree && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            免费
                          </span>
                        )}
                               {isDeepThinkingModel(option.id) && (
                                 <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                   思维链
                                 </span>
                               )}
                               {option.id.includes('gemini-2.5-pro') && (
                                 <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                   超强记忆
                                 </span>
                               )}
                      </div>
                    </SelectItem>
                  ))}
                  {enabledModelOptions.length === 0 && (
                    <SelectItem value="" disabled>
                      请先在模型设置中添加模型
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 思维链控制 - 仅在深度思考模型时显示 */}
            {isCurrentModelDeepThinking && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <ThinkingChainControl />
              </>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <MessageList />
          <ChatInput />
        </div>
      </div>

      {/* Right Sidebar - Topics */}
      <div className="sidebar-fixed">
        <TopicSidebar />
      </div>

    </div>
  )
}