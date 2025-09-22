'use client'

import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { ApiKeyDialog } from './ApiKeyDialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { toast } from 'sonner'

export function ChatContainer() {
  const { clearChat, messages } = useChatStore()

  const handleClearChat = () => {
    if (messages.length === 0) {
      toast.error('没有消息可清除')
      return
    }
    
    clearChat()
    toast.success('聊天记录已清除')
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">AI 聊天助手</h1>
          <p className="text-sm text-gray-500">基于 AIHUBMIX 大模型服务</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清除对话
          </Button>
          <ApiKeyDialog />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList />
        <ChatInput />
      </div>
    </div>
  )
}