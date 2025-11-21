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
  const prevMessageCountRef = useRef(0)
  const prevTopicIdRef = useRef<string | null>(null)
  
  const messages = currentTopicId ? getMessagesByTopic(currentTopicId) : []
  const isLoading = isTopicLoading(currentTopicId ?? undefined)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 只在真正需要时才自动滚动
  useEffect(() => {
    // 话题切换了
    if (currentTopicId !== prevTopicIdRef.current) {
      prevTopicIdRef.current = currentTopicId
      prevMessageCountRef.current = messages.length
      // 话题切换时滚动到底部
      setTimeout(() => scrollToBottom(), 100)
      return
    }

    // 消息数量增加了（有新消息）
    if (messages.length > prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      
      // 检查用户是否在底部
      const container = containerRef.current
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100
        
        // 只有当用户在底部附近时才自动滚动
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(), 100)
        }
      }
    } else {
      // 消息数量没变，更新计数但不滚动
      prevMessageCountRef.current = messages.length
    }
  }, [messages.length, currentTopicId])

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