'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// 代码块组件
function CodeBlock({ children, className, ...props }: any) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  
  const handleCopy = async (e: React.MouseEvent) => {
    // 阻止事件冒泡和默认行为，防止触发焦点变化
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // 确保 children 是字符串类型
      const textContent = typeof children === 'string' 
        ? children 
        : Array.isArray(children)
          ? children.join('')
          : String(children)
      
      await navigator.clipboard.writeText(textContent)
      setCopied(true)
      
      // 延迟显示 toast，避免立即触发重新渲染
      setTimeout(() => {
        toast.success('代码已复制到剪贴板')
      }, 50)
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 text-sm rounded-t-lg border border-b-0 border-gray-300 bg-gray-50">
        <span className="text-gray-600 font-mono text-xs">{language || '文本'}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className={cn(
        "p-4 rounded-b-lg overflow-x-auto text-sm border border-gray-300 bg-white",
        "scrollbar-thin font-mono leading-relaxed"
      )}>
        <code className="text-gray-900" {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}

// 内联代码组件
function InlineCode({ children, ...props }: any) {
  return (
    <code 
      className="px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-900 border border-gray-300"
      {...props}
    >
      {children}
    </code>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content text-gray-900", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 标题 - 纯黑白样式
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 pb-2 border-b-2 border-gray-300 text-gray-900"
                {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-gray-900"
                {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-gray-900"
                {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-900"
                {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-sm font-semibold mb-2 mt-3 first:mt-0 text-gray-900"
                {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-sm font-medium mb-2 mt-2 first:mt-0 text-gray-700"
                {...props}>
              {children}
            </h6>
          ),
          
          // 段落
          p: ({ children, ...props }) => (
            <p className="mb-4 last:mb-0 leading-relaxed text-gray-900"
               {...props}>
              {children}
            </p>
          ),
          
          // 强调 - 只用粗体和斜体，不用颜色
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-gray-900"
                    {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-gray-900"
                {...props}>
              {children}
            </em>
          ),
          
          // 列表
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-900"
                {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-900"
                {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed text-gray-900" {...props}>
              {children}
            </li>
          ),
          
          // 引用 - 纯黑白样式
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-400 pl-4 py-2 mb-4 italic bg-gray-50 text-gray-900"
                        {...props}>
              {children}
            </blockquote>
          ),
          
          // 链接 - 纯黑色，下划线
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="underline text-gray-900 hover:text-gray-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // 预格式化文本（代码块的外层）
          pre: ({ children, ...props }: any) => {
            // 直接返回子元素，避免双重包裹
            return <>{children}</>
          },
          
          // 代码
          code: ({ inline, children, className, ...props }: any) => {
            return inline ? (
              <InlineCode className={className} {...props}>
                {children}
              </InlineCode>
            ) : (
              <CodeBlock className={className} {...props}>
                {children}
              </CodeBlock>
            )
          },
          
          // 分割线
          hr: ({ ...props }) => (
            <hr className="my-6 border-gray-300"
                {...props} />
          ),
          
          // 表格 - 纯黑白样式
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full rounded-lg overflow-hidden border border-gray-300"
                     {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-100" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="bg-white" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-200" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-200 last:border-r-0"
                {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-3 text-gray-900 border-r border-gray-200 last:border-r-0"
                {...props}>
              {children}
            </td>
          ),
          
          // 删除线
          del: ({ children, ...props }) => (
            <del className="line-through text-gray-500"
                 {...props}>
              {children}
            </del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
