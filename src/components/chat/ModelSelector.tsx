'use client'

import { useState } from 'react'
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
import { AtSign, Check } from 'lucide-react'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { ALL_MODELS } from '@/data/models'

interface ModelSelectorProps {
  onModelSelect: (modelId: string, modelName: string) => void
  selectedModels?: string[]
}

export function ModelSelector({ onModelSelect, selectedModels = [] }: ModelSelectorProps) {
  const { addedModels } = useAPISettingsStore()
  
  // 获取可用的模型选项
  const availableModels = ALL_MODELS.filter(model => addedModels.includes(model.id))

  const handleModelSelect = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId)
    if (model) {
      onModelSelect(modelId, model.name)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-gray-200"
          title="切换模型回答"
        >
          <AtSign className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <AtSign className="h-4 w-4" />
          选择AI模型进行回答
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableModels.length === 0 ? (
          <DropdownMenuItem disabled>
            请先在设置中添加模型
          </DropdownMenuItem>
        ) : (
          availableModels.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="flex items-center gap-3 p-3 cursor-pointer"
            >
              <div className="flex items-center gap-2 flex-1">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {selectedModels.includes(model.id) && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {model.isFree && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        免费
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {model.description}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}