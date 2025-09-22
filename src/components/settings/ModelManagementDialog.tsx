'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Minus, ChevronDown, ChevronRight } from 'lucide-react'
import { ALL_MODELS, MODEL_CATEGORIES, MODEL_PROVIDERS } from '@/data/models'
import { useAPISettingsStore, useModelManagementStore } from '@/store/apiSettingsStore'
import { cn } from '@/lib/utils'
import type { ModelCategory, ModelProvider } from '@/types/models'

interface ModelManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModelManagementDialog({ open, onOpenChange }: ModelManagementDialogProps) {
  const { addedModels, toggleModel } = useAPISettingsStore()
  const { searchQuery, selectedCategory, setSearchQuery, setSelectedCategory } = useModelManagementStore()
  const [expandedProviders, setExpandedProviders] = useState<Set<ModelProvider>>(new Set(['openai']))

  // 筛选模型
  const filteredModels = useMemo(() => {
    return ALL_MODELS.filter(model => {
      // 搜索筛选
      const matchesSearch = searchQuery === '' || 
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase())

      // 分类筛选
      const matchesCategory = selectedCategory === 'all' || 
        model.category.includes(selectedCategory as ModelCategory)

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // 按提供商分组模型
  const modelsByProvider = useMemo(() => {
    const grouped: Record<ModelProvider, typeof filteredModels> = {} as any
    
    filteredModels.forEach(model => {
      if (!grouped[model.provider]) {
        grouped[model.provider] = []
      }
      grouped[model.provider].push(model)
    })
    
    return grouped
  }, [filteredModels])

  const toggleProvider = (provider: ModelProvider) => {
    const newExpanded = new Set(expandedProviders)
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider)
    } else {
      newExpanded.add(provider)
    }
    setExpandedProviders(newExpanded)
  }

  const handleModelToggle = (modelId: string) => {
    toggleModel(modelId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">AiHubMix 模型</DialogTitle>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜索模型ID或名称"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 模型分类 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(MODEL_CATEGORIES).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
              className="h-8"
            >
              {label}
            </Button>
          ))}
        </div>

        {/* 模型列表 */}
        <div className="flex-1 border rounded-md overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
            {Object.entries(modelsByProvider).map(([provider, models]) => (
              <div key={provider} className="mb-4">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                  onClick={() => toggleProvider(provider as ModelProvider)}
                >
                  {expandedProviders.has(provider as ModelProvider) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <h3 className="font-semibold text-lg">
                    {MODEL_PROVIDERS[provider as ModelProvider]}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {models.length}
                  </Badge>
                </div>

                {expandedProviders.has(provider as ModelProvider) && (
                  <div className="ml-6 mt-2 space-y-2">
                    {models.map((model) => {
                      const isAdded = addedModels.includes(model.id)
                      return (
                        <div
                          key={model.id}
                          className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {model.name}
                              </h4>
                              <div className="flex gap-1">
                                {model.category.map(cat => (
                                  <Badge
                                    key={cat}
                                    variant="outline"
                                    className="text-xs h-5"
                                  >
                                    {MODEL_CATEGORIES[cat]}
                                  </Badge>
                                ))}
                                {model.isFree && (
                                  <Badge variant="secondary" className="text-xs h-5">
                                    免费
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                              {model.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="truncate">ID: {model.id}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <span>上下文: {model.contextLength.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant={isAdded ? "destructive" : "default"}
                            onClick={() => handleModelToggle(model.id)}
                            className="ml-3 shrink-0 h-8 px-3"
                          >
                            {isAdded ? (
                              <>
                                <Minus className="h-4 w-4 mr-1" />
                                移除
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-1" />
                                添加
                              </>
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {Object.keys(modelsByProvider).indexOf(provider) < Object.keys(modelsByProvider).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}

            {filteredModels.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>未找到匹配的模型</p>
                <p className="text-sm">请尝试调整搜索条件或分类筛选</p>
              </div>
            )}
            </div>
          </ScrollArea>
        </div>

        {/* 底部统计 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            已添加 {addedModels.length} 个模型，共 {ALL_MODELS.length} 个可用模型
          </div>
          <Button onClick={() => onOpenChange(false)}>
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}