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
  const [isClient, setIsClient] = useState(false)
  
  const messages = currentTopicId ? getMessagesByTopic(currentTopicId) : []
  const isLoading = isTopicLoading(currentTopicId) // 获取当前话题的加载状态

  useEffect(() => {
    setIsClient(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

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
      <div className="flex-1 overflow-y-auto px-2 min-w-0">
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