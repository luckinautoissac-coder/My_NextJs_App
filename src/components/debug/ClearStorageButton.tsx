'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function ClearStorageButton() {
  const handleClearStorage = () => {
    if (!confirm('确定要清除所有本地存储吗？这将删除所有对话历史、设置和缓存数据。')) {
      return
    }

    try {
      // 清除所有 localStorage 数据
      const keysToRemove = [
        'agent-store',
        'topic-store', 
        'chat-store',
        'api-settings-store',
        'thinking-chain-store',
        'quick-phrases-store',
        'knowledge-store'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // 清除所有 sessionStorage
      sessionStorage.clear()
      
      // 清除所有 cookies（如果有）
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      
      // 清除浏览器缓存（通过强制刷新）
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => {
            caches.delete(name)
          })
        })
      }
      
      toast.success('所有本地数据和缓存已清除，即将刷新页面...')
      
      // 1秒后强制刷新页面（绕过缓存）
      setTimeout(() => {
        window.location.href = window.location.href + '?nocache=' + Date.now()
      }, 1000)
    } catch (error) {
      toast.error('清除存储失败，请手动清除浏览器缓存')
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
      清除所有缓存
    </Button>
  )
}