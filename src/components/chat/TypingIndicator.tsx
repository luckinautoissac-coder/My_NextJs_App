'use client'

import { Bot } from 'lucide-react'

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 px-4 py-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
         style={{ backgroundColor: 'var(--primary-light)', opacity: 0.2 }}>
      <Bot className="h-4 w-4" style={{ color: 'var(--primary-color)' }} />
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
          </div>
        </div>
        <span className="text-xs text-gray-500">AI 正在思考...</span>
      </div>
    </div>
  )
}