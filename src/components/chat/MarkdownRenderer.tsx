'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
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
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      toast.success('代码已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-4 py-2 text-sm rounded-t-lg" 
           style={{ backgroundColor: 'var(--primary-dark)', color: 'var(--text-primary)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{language || '代码'}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: 'var(--text-secondary)' }}
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className={cn(
        "p-4 rounded-b-lg overflow-x-auto text-sm",
        "scrollbar-thin"
      )}
      style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-card)' }}>
        <code className={className} {...props}>
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
      className="px-1.5 py-0.5 rounded text-sm" 
      style={{ 
        fontFamily: 'var(--font-mono)',
        backgroundColor: 'var(--background-secondary)',
        color: 'var(--primary-color)'
      }}
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
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 标题
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 pb-2" 
                style={{ color: 'var(--text-accent)', borderBottom: '2px solid var(--border-color)' }}
                {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-sm font-semibold mb-2 mt-3 first:mt-0" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-sm font-medium mb-2 mt-2 first:mt-0" 
                style={{ color: 'var(--text-secondary)' }}
                {...props}>
              {children}
            </h6>
          ),
          
          // 段落
          p: ({ children, ...props }) => (
            <p className="mb-4 last:mb-0 leading-relaxed" 
               style={{ color: 'var(--text-primary)' }}
               {...props}>
              {children}
            </p>
          ),
          
          // 强调
          strong: ({ children, ...props }) => (
            <strong className="font-bold" 
                    style={{ color: 'var(--text-accent)' }}
                    {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic" 
                style={{ color: 'var(--text-secondary)' }}
                {...props}>
              {children}
            </em>
          ),
          
          // 列表
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" 
                style={{ color: 'var(--text-primary)' }}
                {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          
          // 引用
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 pl-4 py-2 mb-4 italic" 
                        style={{ 
                          borderColor: 'var(--accent-warm)', 
                          backgroundColor: 'var(--background-secondary)',
                          color: 'var(--text-secondary)'
                        }}
                        {...props}>
              {children}
            </blockquote>
          ),
          
          // 链接
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="underline transition-colors"
              style={{ 
                color: 'var(--accent-cool)',
                textDecorationColor: 'var(--accent-cool)'
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
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
            <hr className="my-6" 
                style={{ borderColor: 'var(--border-color)' }}
                {...props} />
          ),
          
          // 表格
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full rounded-lg overflow-hidden" 
                     style={{ border: '1px solid var(--border-color)' }}
                     {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead style={{ backgroundColor: 'var(--background-secondary)' }} {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody style={{ backgroundColor: 'var(--background-card)' }} {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr style={{ borderBottom: '1px solid var(--border-color)' }} {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left font-semibold last:border-r-0" 
                style={{ 
                  color: 'var(--text-primary)', 
                  borderRight: '1px solid var(--border-color)' 
                }}
                {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-3 last:border-r-0" 
                style={{ 
                  color: 'var(--text-primary)', 
                  borderRight: '1px solid var(--border-color)' 
                }}
                {...props}>
              {children}
            </td>
          ),
          
          // 删除线
          del: ({ children, ...props }) => (
            <del className="line-through" 
                 style={{ color: 'var(--text-muted)' }}
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