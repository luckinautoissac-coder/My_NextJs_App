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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const prevMessagesLengthRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const messages = currentTopicId ? getMessagesByTopic(currentTopicId) : []
  const isLoading = isTopicLoading(currentTopicId ?? undefined) // 获取当前话题的加载状态

  useEffect(() => {
    setIsClient(true)
  }, [])

  const scrollToBottom = () => {
    // 只有在没有用户交互的情况下才滚动
    if (!isUserScrollingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 检测用户是否手动滚动
  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    
    // 标记用户正在滚动
    isUserScrollingRef.current = true
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    // 1秒后重置用户滚动标记
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 1000)
    
    const { scrollTop, scrollHeight, clientHeight } = container
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50
    
    // 如果用户滚动到底部，启用自动滚动；否则禁用
    setShouldAutoScroll(isAtBottom)
  }

  // 只在消息数量真正增加时才自动滚动
  useEffect(() => {
    const messagesLength = messages.length
    
    // 只有在消息数量增加时才滚动（新消息到来）
    if (shouldAutoScroll && messagesLength > prevMessagesLengthRef.current) {
      // 短暂延迟确保DOM已更新
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
    
    prevMessagesLengthRef.current = messagesLength
  }, [messages.length, shouldAutoScroll])
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

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