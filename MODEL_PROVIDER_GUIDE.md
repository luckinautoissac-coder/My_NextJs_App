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
- **默认地址**: `https://your-xinghuo-api-endpoint.com/v1`（需要修改）
- **特点**: 讯飞星火大模型API服务
- **配置**: 
  - ⚠️ **重要**: 您需要将默认地址修改为您实际的星火API端点
  - 如果您使用的是第三方OpenAI兼容代理（如 openai-style-api），请填写代理服务的地址
  - 确保您的端点支持OpenAI API标准格式

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
- **星火API**: 
  - ⚠️ 必须修改为您实际的API端点地址
  - 如果您不确定地址，请联系您的API服务提供商
- **自定义**: 输入您的自定义API地址

### 步骤 5: 选择模型
1. 点击"管理模型"按钮
2. 选择您要使用的AI模型
3. 在"模型选择"下拉菜单中选择默认模型

### 步骤 6: 保存设置
点击"保存"按钮完成配置

## 星火API特别说明

### 获取OpenAI兼容的星火API

星火API原生接口与OpenAI格式不同，要使用本应用，您需要：

#### 选项1: 使用第三方兼容服务
一些服务提供OpenAI格式的星火API代理，例如：
- AIHubMix 等聚合平台
- 自建的API转换服务

#### 选项2: 使用开源转换工具
使用 `openai-style-api` 等开源工具将星火API转换为OpenAI格式：
```bash
# 参考: https://github.com/tian-minghui/openai-style-api
```

#### 选项3: 自建转换层
如果您有技术能力，可以自己搭建一个转换层，将星火API的请求/响应格式转换为OpenAI标准格式。

### 星火API端点示例

根据您使用的服务不同，端点地址可能如下：

```
# 第三方兼容服务
https://api.example.com/v1

# 自建转换服务
https://your-domain.com/api/v1

# 本地服务
http://localhost:8000/v1
```

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

### Q: 星火API的默认地址是占位符吗？
A: 是的。星火API原生不支持OpenAI格式，默认地址只是示例。您需要填写实际的OpenAI兼容端点地址。

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
const XINGHUO_BASE_URL = 'https://your-xinghuo-api-endpoint.com/v1'
```

### 前端配置 (`src/components/settings/ModelServiceDialog.tsx`)
```typescript
const API_PROVIDERS = {
  aihubmix: {
    name: 'AIHUBMIX API',
    baseUrl: 'https://aihubmix.com/v1',
    type: 'OpenAI'
  },
  xinghuo: {
    name: '星火API',
    baseUrl: 'https://your-xinghuo-api-endpoint.com/v1',
    type: 'OpenAI'
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    type: 'OpenAI'
  }
}
```

## 更新日志

### v1.1.0 (2025-01-06)
- ✅ 添加星火API供应商选项
- ✅ 添加供应商快速切换功能
- ✅ 优化API地址配置体验
- ✅ 添加供应商描述和帮助文本
- ✅ 支持AIHUBMIX、星火API和自定义供应商

---

如有问题，请查看代码注释或联系开发者。

