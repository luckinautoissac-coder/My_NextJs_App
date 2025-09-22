# AI 聊天助手 - Chat UI MVP

基于 Next.js 和 AIHUBMIX 大模型服务的智能聊天应用。

## 🚀 快速开始

### 1. 启动应用
```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 2. 设置 API Key
1. 点击右上角的 "API 设置" 按钮
2. 输入您的 AIHUBMIX API Key
3. 点击保存设置

### 3. 开始聊天
- 在底部输入框输入消息
- 按 Enter 发送，Shift+Enter 换行
- AI 将自动回复您的消息

## 🔧 功能特性

### ✅ 已实现功能
- **现代化聊天界面**: 类似 Cherry Studio 的用户体验
- **消息管理**: 用户消息和 AI 回复的差异化显示
- **实时对话**: 支持发送消息和接收 AI 回复
- **状态管理**: 使用 Zustand 管理聊天历史和 UI 状态
- **本地存储**: 聊天记录和 API Key 自动保存到浏览器
- **错误处理**: 完善的错误提示和重试机制
- **加载状态**: 打字指示器和发送状态显示
- **响应式设计**: 适配桌面和移动端
- **消息操作**: 支持复制 AI 回复、清除对话
- **API Key 管理**: 安全的本地存储，支持设置和修改

### 🎨 UI 组件
- **MessageList**: 消息列表显示
- **MessageItem**: 单条消息渲染
- **ChatInput**: 多行文本输入框
- **TypingIndicator**: AI 思考动画
- **ApiKeyDialog**: API Key 设置弹窗

### 🔐 安全特性
- API Key 仅存储在浏览器本地
- 不会上传任何敏感信息到服务器
- 支持 API Key 的安全输入和管理

## 📱 使用说明

### 获取 AIHUBMIX API Key
1. 访问 [AIHUBMIX 官网](https://aihubmix.com)
2. 注册账号并登录
3. 进入 API 管理页面
4. 创建新的 API Key
5. 复制密钥到应用中

### 聊天操作
- **发送消息**: 输入内容后按 Enter
- **换行**: 按 Shift + Enter
- **复制回复**: 点击 AI 消息旁的复制按钮
- **清除对话**: 点击右上角的清除按钮
- **修改设置**: 点击右上角的 API 设置按钮

### 错误处理
- **网络错误**: 自动显示重试提示
- **API 限流**: 提示用户稍后重试
- **无效密钥**: 提示检查 API Key
- **输入为空**: 阻止发送并提示

## 🛠 技术栈

### 前端技术
- **Next.js 15**: App Router 模式
- **React 19**: 最新版本
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式框架
- **shadcn/ui**: 组件库
- **Zustand**: 状态管理
- **Sonner**: 通知系统
- **Lucide React**: 图标库

### 后端集成
- **AIHUBMIX API**: 大模型服务
- **OpenAI 兼容格式**: 标准 API 调用

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx          # 应用布局
│   └── page.tsx            # 主聊天页面
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   └── chat/               # 聊天相关组件
│       ├── ChatContainer.tsx   # 聊天容器
│       ├── MessageList.tsx     # 消息列表
│       ├── MessageItem.tsx     # 单条消息
│       ├── ChatInput.tsx       # 输入框
│       ├── TypingIndicator.tsx # 打字指示器
│       └── ApiKeyDialog.tsx    # API 设置弹窗
├── store/
│   └── chatStore.ts        # Zustand 聊天状态
├── types/
│   └── chat.ts             # TypeScript 类型
└── lib/
    └── api.ts              # API 调用封装
```

## 🎯 MVP 核心功能清单

- ✅ 基础聊天界面（发送/接收消息）
- ✅ AIHUBMIX API 集成
- ✅ 基础错误处理和加载状态
- ✅ 响应式 UI 适配
- ✅ 本地数据持久化

## 🚧 后续迭代方向

- [ ] 对话历史持久化（数据库存储）
- [ ] 多轮对话上下文管理
- [ ] 用户认证和多用户支持
- [ ] 消息导出功能
- [ ] 自定义 AI 角色和 Prompt 模板
- [ ] 流式响应支持
- [ ] 语音输入/输出
- [ ] 文件上传和图片识别

## 🔧 开发说明

这是一个演示项目，采用最简化的实现方式：
- 无需数据库，所有数据存储在浏览器本地
- 无需后端服务器，直接调用 AIHUBMIX API
- 无需复杂配置，开箱即用

## 📞 支持

如有问题，请检查：
1. API Key 是否正确设置
2. 网络连接是否正常
3. AIHUBMIX 服务是否可用

---

**开始您的 AI 聊天体验吧！** 🤖✨