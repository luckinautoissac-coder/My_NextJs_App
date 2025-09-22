import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 思维链长度级别
export type ThinkingChainLevel = 'fleeting' | 'deliberate' | 'contemplative' | 'default'

// 思维链配置
export interface ThinkingChainConfig {
  level: ThinkingChainLevel
  label: string
  description: string
  icon: string
  thinkingTime: number // 思考时间（秒）
  responseLength: number // 响应长度倍数
}

// 思维链配置映射
export const THINKING_CHAIN_CONFIGS: Record<ThinkingChainLevel, ThinkingChainConfig> = {
  fleeting: {
    level: 'fleeting',
    label: '浮想',
    description: '快速思考，简洁回答，轻量上下文记忆（50%）',
    icon: '💭',
    thinkingTime: 5,
    responseLength: 0.7
  },
  deliberate: {
    level: 'deliberate', 
    label: '斟酌',
    description: '仔细思考，平衡回答，适中上下文记忆（80%）',
    icon: '🤔',
    thinkingTime: 15,
    responseLength: 1.0
  },
  contemplative: {
    level: 'contemplative',
    label: '沉思',
    description: '深度思考，详细回答，最强上下文记忆（120%）',
    icon: '🧠',
    thinkingTime: 30,
    responseLength: 1.5
  },
  default: {
    level: 'default',
    label: '默认',
    description: '标准思考模式，标准上下文记忆',
    icon: '⚡',
    thinkingTime: 10,
    responseLength: 1.0
  }
}

// 深度思考模型列表（支持思维链的模型）
export const DEEP_THINKING_MODELS = [
  'o1', 'o1-mini', 'o3', 'o3-mini',
  'deepseek-r1', 'deepseek-v3',
  'claude-4-opus', 'claude-3-opus',
  'gpt-4.1', 'gpt-4o',
  'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.5-flash'
]

// 状态接口
export interface ThinkingChainState {
  currentLevel: ThinkingChainLevel
  isEnabled: boolean
  setLevel: (level: ThinkingChainLevel) => void
  setEnabled: (enabled: boolean) => void
  getCurrentConfig: () => ThinkingChainConfig
  isDeepThinkingModel: (modelId: string) => boolean
}

export const useThinkingChainStore = create<ThinkingChainState>()(
  persist(
    (set, get) => ({
      currentLevel: 'default',
      isEnabled: false,

      setLevel: (level) => set({ currentLevel: level }),
      
      setEnabled: (enabled) => set({ isEnabled: enabled }),

      getCurrentConfig: () => {
        const { currentLevel } = get()
        return THINKING_CHAIN_CONFIGS[currentLevel]
      },

      isDeepThinkingModel: (modelId: string) => {
        return DEEP_THINKING_MODELS.some(model => 
          modelId.toLowerCase().includes(model.toLowerCase())
        )
      }
    }),
    {
      name: 'thinking-chain-store'
    }
  )
)