'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'
import { useChatStore } from '@/store/chatStore'
import { useTopicStore } from '@/store/topicStore'
import { MessageCircle } from 'lucide-react'

export function MessageList() {
  const { getMessagesByTopic, isTopicLoading } = useChatStore()
  const { currentTopicId } = useTopicStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const lastMessageIdRef = useRef<string | null>(null)
  const prevTopicIdRef = useRef<string | null>(null)
  
  const messages = currentTopicId ? getMessagesByTopic(currentTopicId) : []
  const isLoading = isTopicLoading(currentTopicId ?? undefined)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 只在话题切换时自动滚动
  useEffect(() => {
    if (currentTopicId !== prevTopicIdRef.current) {
      prevTopicIdRef.current = currentTopicId
      // 重置最后消息ID
      const lastMessage = messages[messages.length - 1]
      if (lastMessage) {
        lastMessageIdRef.current = lastMessage.id
      }
      // 话题切换时滚动到底部
      setTimeout(() => scrollToBottom(), 100)
      return
    }

    // 检查是否有真正的新消息（通过ID判断）
    const lastMessage = messages[messages.length - 1]
    if (lastMessage) {
      // 如果最后一条消息的ID变了，说明有新消息
      if (lastMessage.id !== lastMessageIdRef.current) {
        const wasAtBottom = checkIfAtBottom()
        lastMessageIdRef.current = lastMessage.id
        
        // 只有当用户本来就在底部时才自动滚动
        if (wasAtBottom) {
          setTimeout(() => scrollToBottom(), 100)
        }
      }
    }
  }, [messages, currentTopicId])

  // 检查用户是否在底部
  const checkIfAtBottom = (): boolean => {
    const container = containerRef.current
    if (!container) return true
    
    const { scrollTop, scrollHeight, clientHeight } = container
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 150
  }

  if (!isClient || !currentTopicId || (messages.length === 0 && !isLoading)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
        <MessageCircle className="h-12 w-12" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">
            {!currentTopicId ? '请选择或创建话题' : '开始对话'}
          </h3>
          <p className="text-sm">
            {!currentTopicId ? '在右侧选择一个话题开始聊天' : '向 AI 助手发送消息开始聊天'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col min-w-0">
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 min-w-0"
      >
        <div className="space-y-4 py-4 min-w-0">
          {messages.map((message) => (
            <div key={message.id} className="group min-w-0">
              <MessageItem message={message} />
            </div>
          ))}
          
          {isLoading && <TypingIndicator />}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
