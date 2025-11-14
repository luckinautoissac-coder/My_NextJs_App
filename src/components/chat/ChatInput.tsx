'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Send, Loader2, Plus, Upload, Search, BookOpen, 
  AtSign, MessageSquare, Eraser, Languages, Zap, Cog, X, FileText, Image
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useChatStore } from '@/store/chatStore'
import { useAgentStore } from '@/store/agentStore'
import { useTopicStore } from '@/store/topicStore'
import { useAPISettingsStore } from '@/store/apiSettingsStore'
import { useThinkingChainStore } from '@/store/thinkingChainStore'
import { useQuickPhrasesStore } from '@/store/quickPhrasesStore'
import { useKnowledgeStore } from '@/store/knowledgeStore'
import { sendMessage } from '@/lib/api'
import { toast } from 'sonner'
import { ALL_MODELS } from '@/data/models'

// 动态导入 PDF.js 以避免 SSR 问题
let pdfjsLib: any = null
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    pdfjsLib = pdfjs
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  })
}

export function ChatInput() {
  const [input, setInput] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const { addMessage, setLoading, isLoading, clearTopicMessages, getMessagesByTopic, updateMessage } = useChatStore()
  const { agents, currentAgentId } = useAgentStore()
  const { currentTopicId, addTopic, setCurrentTopic } = useTopicStore()
  const { apiKey, selectedModel, baseUrl, updateSettings } = useAPISettingsStore()
  const { getCurrentConfig, isEnabled, isDeepThinkingModel } = useThinkingChainStore()
  const { phrases } = useQuickPhrasesStore()
  const { 
    knowledgeBases, 
    selectedKnowledgeBaseIds, 
    selectKnowledgeBase, 
    deselectKnowledgeBase 
  } = useKnowledgeStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const currentAgent = agents.find(agent => agent.id === currentAgentId)
  
  // 获取选中的知识库信息
  const selectedKnowledgeBases = selectedKnowledgeBaseIds
    .map(id => knowledgeBases.find(kb => kb.id === id))
    .filter((kb): kb is NonNullable<typeof kb> => kb !== undefined)

  // 自动调整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      // 增加最大高度到200px，约8-10行文本
      const maxHeight = 200
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
    }
  }

  // 快捷键功能处理函数
  const handleNewTopic = () => {
    if (!currentAgent) {
      toast.error('请先选择一个智能体')
      return
    }
    
    const topicId = addTopic({
      name: '新话题',
      agentId: currentAgent.id,
      messages: []
    })
    setCurrentTopic(topicId)
    toast.success('已创建新话题')
  }

  const handleUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // 检查文件类型和大小
    const validFiles = files.filter(file => {
      const fileName = file.name.toLowerCase()
      const fileExt = fileName.substring(fileName.lastIndexOf('.'))
      
      // 支持的文件扩展名（更可靠的检测方式）
      const supportedExtensions = [
        '.pdf', '.txt', '.md',
        '.doc', '.docx',
        '.xls', '.xlsx',
        '.ppt', '.pptx',
        '.csv', '.json', '.xml'
      ]
      
      const isImage = file.type.startsWith('image/')
      const isSupportedDoc = supportedExtensions.includes(fileExt)
      const isValidType = isImage || isSupportedDoc
      
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB限制
      
      if (!isValidType) {
        toast.error(`不支持的文件类型: ${file.name}\n支持: 图片、PDF、TXT、Word、Excel、PPT、CSV、JSON、XML`)
        return false
      }
      
      if (!isValidSize) {
        toast.error(`文件过大: ${file.name} (最大10MB)`)
        return false
      }
      
      return true
    })
    
    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      toast.success(`已添加 ${validFiles.length} 个文件`)
    }
    
    // 清空文件输入
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 处理粘贴事件（支持粘贴图片）
  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    
    // 遍历剪贴板项目
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      // 检查 item 是否存在且是图片
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          // 检查文件大小
          if (file.size <= 10 * 1024 * 1024) { // 10MB限制
            imageFiles.push(file)
          } else {
            toast.error(`图片过大 (最大10MB)`)
          }
        }
      }
    }
    
    // 如果有图片文件，添加到上传列表
    if (imageFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...imageFiles])
      toast.success(`已粘贴 ${imageFiles.length} 张图片`)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleWebSearch = () => {
    if (!input.trim()) {
      toast.error('请输入搜索关键词')
      return
    }
    setInput(`请帮我搜索并总结关于"${input.trim()}"的最新信息`)
  }

  // 知识库选择不需要额外处理，下拉菜单会自动处理
  const handleSelectKnowledgeBase = (kbId: string) => {
    selectKnowledgeBase(kbId)
    toast.success('已添加知识库')
  }

  const handleRemoveKnowledgeBase = (kbId: string) => {
    deselectKnowledgeBase(kbId)
    toast.success('已移除知识库')
  }

  const handleMCP = () => {
    toast.info('MCP功能开发中...')
  }

  const handleSelectModel = (modelId: string) => {
    updateSettings({ selectedModel: modelId })
    const modelInfo = ALL_MODELS.find(m => m.id === modelId)
    toast.success(`已切换到 ${modelInfo?.name || modelId}`)
  }

  const handleSelectQuickPhrase = (phrase: string) => {
    // 如果输入框有内容，在末尾添加快捷短语
    if (input.trim()) {
      setInput(prev => prev + '\n\n' + phrase)
    } else {
      // 如果输入框为空，直接设置快捷短语
      setInput(phrase)
    }
    
    // 自动调整文本框高度
    setTimeout(() => {
      adjustTextareaHeight()
    }, 0)
    
    // 聚焦到文本框
    textareaRef.current?.focus()
  }

  const handleClearContext = () => {
    if (!currentTopicId) {
      toast.error('请先选择一个话题')
      return
    }
    
    // 添加上下文分隔线消息
    addMessage({
      content: '---------清除上下文--------',
      role: 'system',
      status: 'sent',
      topicId: currentTopicId,
      messageType: 'context-separator'
    })
    
    toast.success('上下文已清除')
  }

  const handleTranslate = (targetLanguage: string) => {
    if (!input.trim()) {
      toast.error('请输入需要翻译的内容')
      return
    }
    const languageMap: { [key: string]: string } = {
      'english': '英文',
      'chinese': '中文',
      'japanese': '日文',
      'korean': '韩文',
      'french': '法文',
      'german': '德文',
      'spanish': '西班牙文',
      'russian': '俄文'
    }
    const languageName = languageMap[targetLanguage] || targetLanguage
    setInput(`请将以下内容翻译成${languageName}：\n\n${input}`)
  }


  // 解析PDF文件
  const parsePDF = async (file: File): Promise<string> => {
    try {
      // 确保 PDF.js 已加载
      if (!pdfjsLib) {
        toast.info('正在加载 PDF 解析器...')
        pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      }
      
      toast.info('正在解析 PDF 文件...')
      const arrayBuffer = await file.arrayBuffer()
      
      // 添加更详细的错误处理
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // 减少控制台日志
      })
      
      const pdf = await loadingTask.promise
      const numPages = pdf.numPages
      let fullText = `📄 [PDF文档: ${file.name}]\n📊 页数: ${numPages}\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n`
      
      // 读取所有页面的文本（限制最多读取前50页，避免超大文件）
      const maxPages = Math.min(numPages, 50)
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str)
            .filter((str: string) => str.trim().length > 0)
            .join(' ')
          
          if (pageText.trim()) {
            fullText += `\n--- 📖 第 ${pageNum} 页 ---\n${pageText}\n`
          }
        } catch (pageError) {
          console.error(`读取第 ${pageNum} 页失败:`, pageError)
          fullText += `\n--- 📖 第 ${pageNum} 页 ---\n[该页面无法读取]\n`
        }
      }
      
      if (numPages > 50) {
        fullText += `\n\n⚠️ 注意: PDF 文件共 ${numPages} 页，已读取前 50 页内容。`
      }
      
      fullText += `\n\n${'='.repeat(50)}\n[PDF 解析完成]`
      
      toast.success('PDF 解析成功！')
      return fullText
    } catch (error) {
      console.error('PDF解析失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error(`PDF 解析失败: ${errorMessage}`)
      
      // 返回基本文件信息，即使解析失败
      return `📄 [PDF文档: ${file.name}]\n❌ 解析失败: ${errorMessage}\n💾 大小: ${formatFileSize(file.size)}\n\n请尝试使用其他 PDF 文件或将文件转换为文本格式后重试。`
    }
  }

  // 读取文件内容
  const readFileContent = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()
    
    // 如果是PDF文件，使用专门的PDF解析函数
    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file)
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          // 文本类文件（TXT、MD、CSV、JSON、XML、代码文件等）
          const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h']
          const isTextFile = file.type.startsWith('text/') || 
                            textExtensions.some(ext => fileName.endsWith(ext))
          
          if (isTextFile) {
            let header = `📄 [文件: ${file.name}]\n💾 大小: ${formatFileSize(file.size)}`
            
            // 为不同类型的文本文件添加格式化
            if (fileName.endsWith('.json')) {
              try {
                const jsonData = JSON.parse(result)
                header += `\n📋 类型: JSON 数据\n${'='.repeat(50)}\n\n`
                return resolve(header + JSON.stringify(jsonData, null, 2))
              } catch {
                header += `\n📋 类型: JSON 文件（解析失败，显示原始内容）\n${'='.repeat(50)}\n\n`
                return resolve(header + result)
              }
            } else if (fileName.endsWith('.csv')) {
              header += `\n📊 类型: CSV 表格数据\n${'='.repeat(50)}\n\n`
              return resolve(header + result)
            } else if (fileName.endsWith('.xml')) {
              header += `\n📋 类型: XML 数据\n${'='.repeat(50)}\n\n`
              return resolve(header + result)
            } else if (fileName.endsWith('.md')) {
              header += `\n📝 类型: Markdown 文档\n${'='.repeat(50)}\n\n`
              return resolve(header + result)
            } else {
              header += `\n📝 类型: 文本文件\n${'='.repeat(50)}\n\n`
              return resolve(header + result)
            }
          } 
          // 图片文件
          else if (file.type.startsWith('image/')) {
            resolve(`🖼️ [图片: ${file.name}]\n📋 格式: ${file.type}\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n${result}`)
          }
          // Office 文档（Word、Excel、PPT）
          else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
            resolve(`📝 [Word 文档: ${file.name}]\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n⚠️ Word 文档需要转换为 PDF 或 TXT 格式才能读取内容。\n建议：请将文档另存为 PDF 格式后重新上传。`)
          }
          else if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
            resolve(`📊 [Excel 表格: ${file.name}]\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n⚠️ Excel 表格需要转换为 CSV 格式才能读取内容。\n建议：请将表格另存为 CSV 格式后重新上传。`)
          }
          else if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
            resolve(`📊 [PowerPoint 演示文稿: ${file.name}]\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n⚠️ PowerPoint 文档需要转换为 PDF 格式才能读取内容。\n建议：请将演示文稿另存为 PDF 格式后重新上传。`)
          }
          // 其他未知文件类型
          else {
            resolve(`📄 [文件: ${file.name}]\n📋 类型: ${file.type || '未知'}\n💾 大小: ${formatFileSize(file.size)}\n${'='.repeat(50)}\n\n⚠️ 该文件类型暂不支持直接读取。\n支持的格式：\n• 文本：TXT、MD、CSV、JSON、XML\n• 图片：JPG、PNG、GIF、WebP 等\n• 文档：PDF（推荐）`)
          }
        } else {
          reject(new Error('读取文件失败'))
        }
      }
      
      reader.onerror = () => {
        const errorMsg = `读取文件失败: ${file.name}`
        toast.error(errorMsg)
        reject(new Error(errorMsg))
      }
      
      // 根据文件类型选择读取方式
      const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts']
      const isTextFile = file.type.startsWith('text/') || 
                        textExtensions.some(ext => fileName.endsWith(ext))
      
      if (isTextFile) {
        reader.readAsText(file, 'UTF-8')
      } else if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else {
        // 其他文件尝试读取为文本
        reader.readAsText(file, 'UTF-8')
      }
    })
  }

  const handleSubmit = async () => {
    // 允许只上传文件不输入文字，或只输入文字不上传文件
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return
    
    if (!apiKey.trim()) {
      toast.error('请先设置 API Key')
      return
    }

    if (!currentTopicId) {
      toast.error('请先选择或创建一个话题')
      return
    }

    if (!currentAgent) {
      toast.error('请先选择一个智能体')
      return
    }

    let userMessage = input.trim() || '请帮我分析以下文件内容：'
    
    // 如果有上传的文件，读取并添加文件内容到消息中
    if (uploadedFiles.length > 0) {
      toast.info('正在读取文件内容...')
      try {
        const fileContents = await Promise.all(
          uploadedFiles.map(async (file) => {
            try {
              const content = await readFileContent(file)
              return `\n\n--- 文件: ${file.name} ---\n${content}\n--- 文件结束 ---`
            } catch (error) {
              console.error('读取文件失败:', error)
              return `\n\n--- 文件: ${file.name} ---\n[读取失败: ${error instanceof Error ? error.message : '未知错误'}]\n--- 文件结束 ---`
            }
          })
        )
        
        userMessage = `${userMessage}\n\n=== 附件内容 ===${fileContents.join('')}\n=== 附件结束 ===\n\n请分析以上附件内容并回答我的问题。`
      } catch (error) {
        console.error('处理文件时出错:', error)
        toast.error('处理文件时出错')
        return
      }
    }
    
    setInput('')
    setUploadedFiles([])
    
    // 添加用户消息
    const messageId = addMessage({
      content: userMessage,
      role: 'user',
      status: 'sent',
      topicId: currentTopicId
    })

    setLoading(true)

    // 获取模型名称
    const modelInfo = ALL_MODELS.find(m => m.id === selectedModel)
    const modelName = modelInfo ? `${modelInfo.name}` : selectedModel

    // 添加思考消息
    const thinkingMessageId = addMessage({
      content: '',
      role: 'assistant',
      status: 'sending',
      topicId: currentTopicId,
      messageType: 'thinking',
      thinkingInfo: {
        startTime: new Date(),
        duration: 0,
        phase: '正在理解问题...',
        modelName: modelName
      }
    })

    try {
      // 准备思维链参数
      const thinkingChainConfig = (isEnabled && selectedModel && isDeepThinkingModel(selectedModel)) 
        ? getCurrentConfig() 
        : null

      // 获取当前话题的消息历史
      const conversationHistory = getMessagesByTopic(currentTopicId)

      // 调用后端API，提示词在服务端保护
      const response = await sendMessage(userMessage, apiKey, currentAgent.id, selectedModel, baseUrl, thinkingChainConfig, conversationHistory)
      
      if (response.error) {
        throw new Error(response.error)
      }

      // 更新思考消息为正式回复
      updateMessage(thinkingMessageId, {
        content: response.response,
        status: 'sent',
        messageType: 'normal',
        thinkingInfo: undefined,
        modelResponses: [{
          modelId: selectedModel,
          modelName: ALL_MODELS.find(m => m.id === selectedModel)?.name || selectedModel,
          content: response.response,
          status: 'sent',
          timestamp: new Date()
        }],
        selectedModelId: selectedModel
      })

    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error(error instanceof Error ? error.message : '发送消息失败，请重试')
      
      // 更新思考消息为错误状态
      updateMessage(thinkingMessageId, {
        content: '抱歉，我现在无法回复。请检查网络连接或稍后重试。',
        status: 'error',
        messageType: 'normal',
        thinkingInfo: undefined
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t bg-white">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.json,.xml"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* 快捷键图标栏 */}
      <div className="border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewTopic}
            className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="新建话题"
          >
            <Plus className="h-4 w-4 mr-1" />
            新建话题
          </Button>
          
          <Separator orientation="vertical" className="h-4" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpload}
            className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="上传图片或文档"
          >
            <Upload className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWebSearch}
            className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="网络搜索"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="知识库"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-64">
              <DropdownMenuLabel>选择知识库</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {knowledgeBases.length === 0 ? (
                <DropdownMenuItem disabled className="text-center py-4">
                  <div className="flex flex-col items-center gap-2 w-full">
                    <BookOpen className="h-8 w-8 text-gray-300" />
                    <span className="text-gray-500">暂无知识库</span>
                    <span className="text-xs text-gray-400">请先在设置中创建知识库</span>
                  </div>
                </DropdownMenuItem>
              ) : (
                <>
                  {knowledgeBases.map((kb) => (
                    <DropdownMenuItem
                      key={kb.id}
                      onClick={() => handleSelectKnowledgeBase(kb.id)}
                      disabled={selectedKnowledgeBaseIds.includes(kb.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{kb.name}</span>
                        <span className="text-xs text-gray-500">
                          {kb.documents.length} 个文档
                        </span>
                      </div>
                      {selectedKnowledgeBaseIds.includes(kb.id) && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          已选
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      // 导航到设置
                      document.querySelector<HTMLElement>('[data-knowledge-base-settings]')?.click()
                    }}
                    className="text-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加知识库...
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMCP}
            className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="MCP"
          >
            <Cog className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="选择模型"
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-64">
              <DropdownMenuLabel>选择模型</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_MODELS.filter(model => 
                useAPISettingsStore.getState().addedModels?.includes(model.id)
              ).map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={selectedModel === model.id ? "text-white" : ""}
                  style={selectedModel === model.id ? { backgroundColor: 'var(--primary-light)' } : undefined}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    {selectedModel === model.id && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--background-card)' }} />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="快捷短语"
              >
                <Zap className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-72 max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                快捷短语
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {phrases.length === 0 ? (
                <DropdownMenuItem disabled className="text-center py-4">
                  <div className="flex flex-col items-center gap-2 w-full">
                    <Zap className="h-8 w-8 text-gray-300" />
                    <span className="text-gray-500">暂无快捷短语</span>
                    <span className="text-xs text-gray-400">在设置中创建您的第一个快捷短语</span>
                  </div>
                </DropdownMenuItem>
              ) : (
                phrases.slice(0, 10).map((phrase) => (
                  <DropdownMenuItem
                    key={phrase.id}
                    onClick={() => handleSelectQuickPhrase(phrase.content)}
                    className="flex flex-col items-start gap-1 h-auto py-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium text-sm truncate flex-1">
                        {phrase.name}
                      </div>
                      {phrase.category && (
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2 shrink-0">
                          {phrase.category}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 line-clamp-2 w-full leading-relaxed">
                      {phrase.content}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {phrases.length > 10 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled className="text-center text-xs text-gray-400">
                    显示前 10 个短语，查看全部请前往设置
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Separator orientation="vertical" className="h-4" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearContext}
            className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            title="清除上下文"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                title="翻译"
              >
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuLabel>翻译为</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTranslate('english')}>
                英文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('chinese')}>
                中文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('japanese')}>
                日文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('korean')}>
                韩文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('french')}>
                法文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('german')}>
                德文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('spanish')}>
                西班牙文
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTranslate('russian')}>
                俄文
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="p-4">
        {/* 选中的知识库显示区域 */}
        {selectedKnowledgeBases.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedKnowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-medium">{kb.name}</span>
                <span className="text-xs opacity-70">({kb.documents.length})</span>
                <button
                  onClick={() => handleRemoveKnowledgeBase(kb.id)}
                  className="ml-1 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* 文件预览区域 */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-700 mb-2">
              已选择 {uploadedFiles.length} 个文件：
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {getFileIcon(file)}
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="输入消息... (按 Enter 发送，Shift+Enter 换行)"
            className="min-h-[44px] max-h-[200px] resize-none overflow-y-auto"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading || !apiKey.trim() || !currentTopicId}
            size="sm"
            className="shrink-0 h-[44px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {!apiKey.trim() && (
          <p className="mt-2 text-xs text-red-500">
            请先设置 AIHUBMIX API Key
          </p>
        )}
        
        {!currentTopicId && apiKey.trim() && (
          <p className="mt-2 text-xs text-red-500">
            请先选择或创建一个话题
          </p>
        )}
      </div>

    </div>
  )
}