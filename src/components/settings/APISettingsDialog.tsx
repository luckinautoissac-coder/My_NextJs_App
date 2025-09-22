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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Settings, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { ModelManagementDialog } from './ModelManagementDialog'
import { ALL_MODELS, MODEL_PROVIDERS } from '@/data/models'
import { toast } from 'sonner'

interface APISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function APISettingsDialog({ open, onOpenChange }: APISettingsDialogProps) {
  const { 
    apiKey, 
    baseUrl, 
    selectedModel, 
    addedModels, 
    updateSettings,
    removeModel
  } = useAPISettingsStore()
  
  const [tempSettings, setTempSettings] = useState({
    apiKey,
    baseUrl,
    selectedModel
  })
  const [modelManagementOpen, setModelManagementOpen] = useState(false)

  const handleSave = () => {
    if (!tempSettings.apiKey.trim()) {
      toast.error('请输入 API Key')
      return
    }

    if (!tempSettings.baseUrl.trim()) {
      toast.error('请输入 API 地址')
      return
    }

    if (!tempSettings.selectedModel) {
      toast.error('请选择一个模型')
      return
    }

    updateSettings(tempSettings)
    toast.success('API 设置已保存')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempSettings({
      apiKey,
      baseUrl,
      selectedModel
    })
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempSettings({
        apiKey,
        baseUrl,
        selectedModel
      })
    }
    onOpenChange(newOpen)
  }

  // 获取已添加的模型信息
  const addedModelInfo = (addedModels || [])
    .map(id => ALL_MODELS.find(model => model.id === id))
    .filter(Boolean)

  const handleRemoveModel = (modelId: string) => {
    if (addedModels.length <= 1) {
      toast.error('至少需要保留一个模型')
      return
    }
    removeModel(modelId)
    toast.success('模型已移除')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              AIHUBMIX API 设置
            </DialogTitle>
            <DialogDescription>
              配置您的 AIHUBMIX API 连接和模型选择
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-3">
            {/* 1. API Key */}
            <div className="grid gap-2">
              <Label htmlFor="apikey">1. API Key</Label>
              <Input
                id="apikey"
                type="password"
                placeholder="请输入您的 AIHUBMIX API Key"
                value={tempSettings.apiKey}
                onChange={(e) => setTempSettings(prev => ({ 
                  ...prev, 
                  apiKey: e.target.value 
                }))}
              />
            </div>
            
            {/* 2. API 地址 */}
            <div className="grid gap-2">
              <Label htmlFor="baseurl">2. API 地址</Label>
              <Input
                id="baseurl"
                placeholder="https://aihubmix.com/v1"
                value={tempSettings.baseUrl}
                onChange={(e) => setTempSettings(prev => ({ 
                  ...prev, 
                  baseUrl: e.target.value 
                }))}
              />
            </div>

            {/* 3. 模型选择 */}
            <div className="grid gap-2">
              <Label>3. 模型选择</Label>
              <Select
                value={tempSettings.selectedModel}
                onValueChange={(value) => setTempSettings(prev => ({ 
                  ...prev, 
                  selectedModel: value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {addedModelInfo.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{MODEL_PROVIDERS[model.provider]} - {model.name}</span>
                        {model.isFree && (
                          <Badge variant="secondary" className="text-xs">免费</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 已添加模型列表 */}
              <div className="mt-2">
                <div className="text-sm text-gray-600 mb-1">
                  已添加的模型 ({addedModels.length})：
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {addedModelInfo.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-1.5 bg-white rounded-md text-sm border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {MODEL_PROVIDERS[model.provider]} - {model.name}
                        </span>
                        {model.isFree && (
                          <Badge variant="secondary" className="text-xs">免费</Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveModel(model.id)}
                        disabled={addedModels.length <= 1}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. 管理模型 */}
            <div className="grid gap-2">
              <Label>4. 管理模型</Label>
              <Button
                variant="outline"
                onClick={() => setModelManagementOpen(true)}
                className="justify-start gap-2"
              >
                <Plus className="h-4 w-4" />
                添加更多模型
              </Button>
            </div>

            {/* API Key 获取说明 */}
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
              <div className="font-medium mb-1">获取 API Key：</div>
              <p className="text-xs mb-2">访问 AIHUBMIX 官网 → 注册登录 → API管理 → 创建密钥</p>
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600 text-xs"
                onClick={() => window.open('https://aihubmix.com', '_blank')}
              >
                访问官网 <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 模型管理对话框 */}
      <ModelManagementDialog
        open={modelManagementOpen}
        onOpenChange={setModelManagementOpen}
      />
    </>
  )
}