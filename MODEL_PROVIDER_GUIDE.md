# 模型供应商配置指南

## 概述

本应用支持多个OpenAI兼容的模型供应商，您可以快速切换不同的API服务。

## 支持的供应商

### 1. AIHUBMIX API
- **供应商类型**: OpenAI 兼容
- **默认地址**: `https://aihubmix.com/v1`
- **特点**: 支持多种主流模型的统一API服务
- **配置**: 开箱即用，无需修改地址

### 2. 星火API
- **供应商类型**: OpenAI 兼容
- **默认地址**: `https://api.xhuoai.com/v1`
- **官方网站**: https://api.xhuoai.com
- **特点**: OpenAI兼容的星火大模型API服务
- **配置**: 开箱即用，默认地址已配置好

### 3. 自定义供应商
- **供应商类型**: OpenAI 兼容
- **特点**: 支持任何OpenAI兼容的API服务
- **配置**: 完全自定义API地址

## 如何配置

### 步骤 1: 打开模型服务设置
1. 点击应用右上角的设置图标
2. 选择"模型服务设置"

### 步骤 2: 选择供应商
1. 在"模型供应商"下拉菜单中选择您要使用的供应商
2. 系统会自动填充该供应商的默认API地址

### 步骤 3: 配置API Key
1. 输入您从供应商获取的API Key
2. AIHUBMIX: 前往 https://aihubmix.com 获取
3. 星火API: 前往 https://xinghuo.xfyun.cn/sparkapi 获取

### 步骤 4: 调整API地址（如需要）
- **AIHUBMIX**: 默认地址已锁定，无需修改
- **星火API**: 默认地址已配置为 `https://api.xhuoai.com/v1`，无需修改
- **自定义**: 完全自定义您的API地址

### 步骤 5: 选择模型
1. 点击"管理模型"按钮
2. 选择您要使用的AI模型
3. 在"模型选择"下拉菜单中选择默认模型

### 步骤 6: 保存设置
点击"保存"按钮完成配置

## 星火API特别说明

### OpenAI兼容的星火API

本应用已集成 [https://api.xhuoai.com](https://api.xhuoai.com) 提供的OpenAI兼容星火API服务。

#### 特点
- ✅ 完全兼容 OpenAI API 格式
- ✅ 开箱即用，无需额外配置
- ✅ 支持讯飞星火大模型

#### 获取API Key
1. 访问 [https://api.xhuoai.com](https://api.xhuoai.com)
2. 注册账号并登录
3. 在控制台获取您的 API Key
4. 在应用的"模型服务设置"中输入 API Key 即可使用

#### 默认配置
- **API 端点**: `https://api.xhuoai.com/v1`
- **兼容格式**: OpenAI ChatCompletion API
- **支持模型**: 讯飞星火系列模型

## API格式要求

所有供应商必须支持以下OpenAI标准端点：

```
POST /chat/completions
```

请求格式：
```json
{
  "model": "model-name",
  "messages": [
    {"role": "system", "content": "系统提示"},
    {"role": "user", "content": "用户消息"}
  ],
  "max_tokens": 4000,
  "temperature": 0.7,
  "stream": false
}
```

响应格式：
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "AI回复内容"
      }
    }
  ]
}
```

## 常见问题

### Q: 星火API是否支持OpenAI格式？
A: 是的。我们集成的 api.xhuoai.com 提供完全兼容OpenAI格式的星火API服务，开箱即用。

### Q: 我可以添加更多供应商吗？
A: 可以使用"自定义"选项添加任何OpenAI兼容的API服务。

### Q: 如何切换供应商？
A: 在模型服务设置中选择不同的供应商，修改API Key和地址，然后保存即可。

### Q: API Key会保存在哪里？
A: API Key使用 Zustand 持久化保存在浏览器的 localStorage 中，不会发送到服务器。

### Q: 支持哪些模型？
A: 支持所有供应商提供的OpenAI兼容模型，包括：
- OpenAI: GPT-4, GPT-4o, o1, o3 等
- Anthropic: Claude 系列
- Google: Gemini 系列
- DeepSeek: DeepSeek V3, R1 等
- Meta: Llama 系列
- 以及更多...

## 技术实现

### 后端配置 (`src/app/api/chat/route.ts`)
```typescript
const AIHUBMIX_BASE_URL = 'https://aihubmix.com/v1'
const XINGHUO_BASE_URL = 'https://api.xhuoai.com/v1'
```

### 前端配置 (`src/components/settings/ModelServiceDialog.tsx`)
```typescript
const API_PROVIDERS = {
  aihubmix: {
    name: 'AIHUBMIX API',
    baseUrl: 'https://aihubmix.com/v1',
    type: 'OpenAI',
    description: '支持多种主流模型的统一API服务'
  },
  xinghuo: {
    name: '星火API',
    baseUrl: 'https://api.xhuoai.com/v1',
    type: 'OpenAI',
    description: 'OpenAI兼容的星火模型API服务'
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    type: 'OpenAI',
    description: '自定义OpenAI兼容的API端点'
  }
}
```

## 更新日志

### v1.1.0 (2025-01-06)
- ✅ 添加星火API供应商选项（集成 api.xhuoai.com）
- ✅ 添加供应商快速切换功能
- ✅ 优化API地址配置体验
- ✅ 添加供应商描述和帮助文本
- ✅ 支持AIHUBMIX、星火API和自定义供应商
- ✅ 星火API使用 OpenAI 兼容格式，开箱即用

---

如有问题，请查看代码注释或联系开发者。

