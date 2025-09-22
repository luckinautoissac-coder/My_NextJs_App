'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ClearStorageButton() {
  const handleClearStorage = () => {
    try {
      // 清除所有相关的本地存储
      localStorage.removeItem('agent-store')
      localStorage.removeItem('topic-store')
      localStorage.removeItem('chat-store')
      
      toast.success('本地存储已清除，请刷新页面')
      
      // 2秒后自动刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      toast.error('清除存储失败')
      console.error('Clear storage error:', error)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearStorage}
      className="text-red-600 hover:text-red-700 hover:border-red-300"
    >
      <Trash2 className="h-4 w-4 mr-2" />
      清除存储
    </Button>
  )
}