'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Brain, Clock, MessageSquare, Database } from 'lucide-react'
import { useThinkingChainStore, THINKING_CHAIN_CONFIGS, type ThinkingChainLevel } from '@/store/thinkingChainStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { toast } from 'sonner'

export function ThinkingChainControl() {
  const [isClient, setIsClient] = useState(false)
  const {
    currentLevel,
    setLevel,
    getCurrentConfig
  } = useThinkingChainStore()
  const { selectedModel } = useAPISettingsStore()

  // 防止SSR不匹配
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 在客户端渲染之前显示默认状态
  const currentConfig = isClient ? getCurrentConfig() : THINKING_CHAIN_CONFIGS.default

  // 计算上下文记忆数量
  const getContextMemoryCount = (level: ThinkingChainLevel) => {
    let baseCount = 20 // 默认值
    
    if (selectedModel?.includes('gemini-2.5-pro')) {
      baseCount = 100 // Gemini 2.5 Pro 最强上下文能力
    } else if (selectedModel?.includes('gemini')) {
      baseCount = 60
    } else if (selectedModel?.includes('gpt-4') || selectedModel?.includes('claude')) {
      baseCount = 40
    } else if (selectedModel?.includes('o1') || selectedModel?.includes('o3') || selectedModel?.includes('deepseek')) {
      baseCount = 50
    }
    
    switch (level) {
      case 'fleeting':
        return Math.floor(baseCount * 0.5)
      case 'deliberate':
        return Math.floor(baseCount * 0.8)
      case 'contemplative':
        return Math.floor(baseCount * 1.2)
      case 'default':
      default:
        return baseCount
    }
  }

  const handleLevelChange = (level: ThinkingChainLevel) => {
    setLevel(level)
    const config = THINKING_CHAIN_CONFIGS[level]
    const memoryCount = getContextMemoryCount(level)
    
    toast.success(`思维链已设置为：${config.label}`, {
      description: `${config.description} | 上下文记忆：${memoryCount}条消息`
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1"
          title={`思维链控制 - 当前：${currentConfig.label}`}
        >
          <Brain className="h-4 w-4" />
          <span className="text-lg">{currentConfig.icon}</span>
          <Badge variant="secondary" className="text-xs ml-1">
            {currentConfig.label}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="center" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          思维链长度控制
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {Object.values(THINKING_CHAIN_CONFIGS).map((config) => (
          <DropdownMenuItem
            key={config.level}
            onClick={() => handleLevelChange(config.level)}
            className={`flex items-center gap-3 p-3 cursor-pointer ${
              isClient && currentLevel === config.level 
                ? 'bg-blue-50 text-blue-700' 
                : ''
            }`}
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{config.icon}</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.label}</span>
                  {isClient && currentLevel === config.level && (
                    <Badge variant="default" className="text-xs">
                      当前
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {config.description}
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{config.thinkingTime}s
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {config.responseLength}x
                  </div>
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {getContextMemoryCount(config.level)}条
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="p-2 text-xs text-gray-500 text-center">
          思维链功能仅在深度思考模型中有效
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}