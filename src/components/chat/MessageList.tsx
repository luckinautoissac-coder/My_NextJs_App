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
  const isAtBottomRef = useRef(true)
  const lastMessageCountRef = useRef(0)
  
  const messages = currentTopicId ? getMessagesByTopic(currentTopicId) : []
  const isLoading = isTopicLoading(currentTopicId ?? undefined)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 保存滚动位置并检测是否在底部
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50
    isAtBottomRef.current = isAtBottom
  }

  // 滚动到底部（仅在需要时）
  const scrollToBottom = () => {
    const container = containerRef.current
    if (!container) return
    
    // 使用requestAnimationFrame确保DOM已更新
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }

  // 只在消息数量增加时才滚动
  useEffect(() => {
    const messagesLength = messages.length
    
    // 如果消息数量增加（有新消息）
    if (messagesLength > lastMessageCountRef.current) {
      // 只有当用户之前在底部时才自动滚动
      if (isAtBottomRef.current) {
        scrollToBottom()
      }
      // 如果不在底部，保持原位置不动
    }
    
    lastMessageCountRef.current = messagesLength
  }, [messages.length])
  
  // 监听话题切换，重置状态
  useEffect(() => {
    lastMessageCountRef.current = messages.length
    isAtBottomRef.current = true
    // 话题切换时滚动到底部
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [currentTopicId])

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
        onScroll={handleScroll}
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