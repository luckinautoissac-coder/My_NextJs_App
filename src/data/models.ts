import type { AIModel, ModelProvider } from '@/types/models'

// 完整的AIHUBMIX模型数据库
export const ALL_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    category: ['reasoning', 'tools'],
    description: '最新的GPT模型，具有强大的推理和工具使用能力',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    category: ['vision', 'tools'],
    description: '多模态GPT模型，支持图像理解和工具调用',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    category: ['free', 'tools'],
    description: '轻量级GPT模型，性价比高',
    contextLength: 128000,
    isFree: true,
    isAdded: true // 默认添加
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    category: ['reasoning', 'tools'],
    description: 'GPT-4的改进版本，具有更强的推理能力和工具使用能力',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'openai',
    category: ['reasoning'],
    description: '专门的推理模型，擅长复杂问题解决',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'o1-mini',
    name: 'o1 Mini',
    provider: 'openai',
    category: ['reasoning', 'free'],
    description: '轻量级推理模型',
    contextLength: 128000,
    isFree: true,
    isAdded: false
  },
  {
    id: 'o3',
    name: 'o3',
    provider: 'openai',
    category: ['reasoning'],
    description: '最新的推理模型，具有更强的逻辑思维能力',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'o3-mini',
    name: 'o3 Mini',
    provider: 'openai',
    category: ['reasoning', 'free'],
    description: '轻量级o3模型',
    contextLength: 128000,
    isFree: true,
    isAdded: false
  },

  // Anthropic Models
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    category: ['reasoning', 'tools'],
    description: '最强大的Claude模型，适合复杂任务',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    category: ['tools', 'vision'],
    description: '平衡性能和速度的Claude模型',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    category: ['free'],
    description: '快速响应的轻量级Claude模型',
    contextLength: 200000,
    isFree: true,
    isAdded: false
  },
  {
    id: 'claude-4-opus',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    category: ['reasoning'],
    description: '下一代Claude模型，推理能力大幅提升',
    contextLength: 1000000,
    isFree: false,
    isAdded: false
  },

  // Google Models
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    category: ['vision', 'tools'],
    description: '最新的Gemini模型，支持多模态和工具调用',
    contextLength: 1000000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    category: ['reasoning', 'vision'],
    description: '专业级Gemini模型，具有强大的多模态能力，无上下文限制',
    contextLength: -1, // 无限制
    maxTokens: 32000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    category: ['free', 'vision'],
    description: '快速的多模态模型',
    contextLength: 1000000,
    isFree: true,
    isAdded: false
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    provider: 'google',
    category: ['reasoning', 'vision', 'tools'],
    description: '下一代Gemini Pro模型预览版，具有更强的推理和多模态能力',
    contextLength: 2000000,
    isFree: false,
    isAdded: false
  },

  // Meta Models
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'meta',
    category: ['free', 'reasoning'],
    description: 'Meta最新的开源大语言模型',
    contextLength: 128000,
    isFree: true,
    isAdded: false
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'meta',
    category: ['reasoning'],
    description: '下一代Llama模型预览版',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // DeepSeek Models
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'deepseek',
    category: ['reasoning', 'free'],
    description: '强大的推理模型，性价比极高',
    contextLength: 64000,
    isFree: true,
    isAdded: false
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    category: ['reasoning'],
    description: '专门的推理模型，具有思维链能力',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'deepseek-v3.2-speciale',
    name: 'DeepSeek V3.2 Speciale',
    provider: 'deepseek',
    category: ['reasoning', 'tools'],
    description: 'DeepSeek V3.2 特别版，优化的推理和工具使用能力',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'deepseek-v3.2-think',
    name: 'DeepSeek V3.2 Think',
    provider: 'deepseek',
    category: ['reasoning'],
    description: 'DeepSeek V3.2 思考模型，具有增强的思维链推理能力',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // xAI Models
  {
    id: 'grok-3-beta',
    name: 'Grok 3 Beta',
    provider: 'xai',
    category: ['online', 'reasoning'],
    description: 'xAI的最新模型，具有实时信息获取能力',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'grok-4',
    name: 'Grok 4',
    provider: 'xai',
    category: ['online', 'reasoning'],
    description: '最新的Grok模型，集成实时搜索',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // Alibaba Models
  {
    id: 'qwen-3-235b',
    name: 'Qwen 3 235B',
    provider: 'alibaba',
    category: ['reasoning'],
    description: '阿里巴巴最大的语言模型',
    contextLength: 1000000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'qwen-max',
    name: 'Qwen Max',
    provider: 'alibaba',
    category: ['reasoning', 'tools'],
    description: '通义千问最强模型',
    contextLength: 8000000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'qwen-plus',
    name: 'Qwen Plus',
    provider: 'alibaba',
    category: ['free'],
    description: '通义千问增强版，免费使用',
    contextLength: 128000,
    isFree: true,
    isAdded: false
  },

  // MiniMax Models
  {
    id: 'text-01',
    name: 'Text-01',
    provider: 'minimax',
    category: ['reasoning'],
    description: 'MiniMax的文本生成模型',
    contextLength: 200000,
    isFree: false,
    isAdded: false
  },

  // Perplexity Models
  {
    id: 'sonar',
    name: 'Sonar',
    provider: 'perplexity',
    category: ['online', 'tools'],
    description: 'Perplexity的在线搜索模型',
    contextLength: 127000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    provider: 'perplexity',
    category: ['online', 'reasoning'],
    description: 'Perplexity专业版搜索模型',
    contextLength: 127000,
    isFree: false,
    isAdded: false
  },

  // Mistral Models
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    category: ['reasoning', 'tools'],
    description: 'Mistral最大的语言模型',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },
  {
    id: 'codestral-2501',
    name: 'Codestral 2501',
    provider: 'mistral',
    category: ['tools'],
    description: '专门的代码生成模型',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // Cohere Models
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'cohere',
    category: ['tools', 'reasoning'],
    description: 'Cohere的多语言模型',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // 智谱AI Models
  {
    id: 'glm-4.5',
    name: 'GLM-4.5',
    provider: 'zhipu',
    category: ['reasoning', 'vision'],
    description: '智谱AI的多模态模型',
    contextLength: 128000,
    isFree: false,
    isAdded: false
  },

  // Embedding Models - OpenAI
  {
    id: 'text-embedding-ada-002',
    name: 'Text Embedding Ada 002',
    provider: 'openai',
    category: ['embedding'],
    description: 'OpenAI的嵌入模型，适用于语义搜索和文档检索',
    contextLength: 8191,
    isFree: false,
    isAdded: false
  },

  // Embedding Models - Google
  {
    id: 'gemini-embedding-exp-03-07',
    name: 'Gemini Embedding Exp 03-07',
    provider: 'google',
    category: ['embedding'],
    description: 'Google实验性嵌入模型，支持高维向量表示',
    contextLength: 2048,
    isFree: false,
    isAdded: false
  }
]

// 模型分类标签
export const MODEL_CATEGORIES = {
  all: '全部',
  reasoning: '推理',
  vision: '视觉',
  online: '联网',
  free: '免费',
  embedding: '嵌入',
  rerank: '重排',
  tools: '工具'
} as const

// 模型提供商标签
export const MODEL_PROVIDERS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  mistral: 'Mistral AI',
  alibaba: 'Alibaba Cloud',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  minimax: 'MiniMax',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
  zhipu: '智谱AI'
} as const