# 🚀 Supabase 配置指南（5分钟搞定）

## 📌 为什么要配置Supabase？

客户的浏览器缓存已经满了，必须将数据存储到云端！

**Supabase 是完全免费的云数据库**，无需信用卡，5分钟即可配置完成。

---

## 🎯 第一步：注册Supabase账号（2分钟）

### 1. 访问Supabase官网

```
https://supabase.com
```

### 2. 点击右上角 "Start your project"

### 3. 使用GitHub账号登录（最快）

- 点击 "Continue with GitHub"
- 授权Supabase访问

✅ 注册完成！

---

## 🗄️ 第二步：创建数据库（1分钟）

### 1. 点击 "New Project"

### 2. 填写项目信息：

- **Name**: `chatapp` （随便起名）
- **Database Password**: 设置一个密码（**记住这个密码！**）
- **Region**: 选择 `Northeast Asia (Tokyo)` （最近的服务器）
- **Pricing Plan**: 选择 `Free` （免费版）

### 3. 点击 "Create new project"

⏳ 等待1-2分钟，数据库创建中...

✅ 数据库创建完成！

---

## 📊 第三步：创建数据表（1分钟）

### 1. 在左侧菜单点击 "SQL Editor"

### 2. 点击 "New query"

### 3. 复制粘贴以下SQL代码：

```sql
-- 创建消息表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'sent',
  timestamp TIMESTAMPTZ NOT NULL,
  model_responses JSONB,
  selected_model_id TEXT,
  thinking_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建话题表
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- 创建索引（提高查询速度）
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_topic_id ON messages(topic_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_topics_agent_id ON topics(agent_id);

-- 启用行级安全（RLS）但允许所有操作（演示项目）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "允许所有操作" ON messages FOR ALL USING (true);
CREATE POLICY "允许所有操作" ON topics FOR ALL USING (true);
```

### 4. 点击右下角 "Run" 按钮

✅ 看到 "Success. No rows returned" 就成功了！

---

## 🔑 第四步：获取API密钥（1分钟）

### 1. 在左侧菜单点击 "Project Settings"（齿轮图标）

### 2. 点击 "API"

### 3. 找到以下两个值：

#### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
复制这个URL

#### **anon public key**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
复制这个Key（很长的一串）

---

## ⚙️ 第五步：配置Vercel环境变量（1分钟）

### 1. 访问Vercel项目

```
https://vercel.com
```

登录后，找到你的项目

### 2. 进入项目设置

- 点击项目名称
- 点击顶部 "Settings"
- 点击左侧 "Environment Variables"

### 3. 添加两个环境变量：

#### 变量1：
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: 粘贴刚才复制的 Project URL
- 点击 "Add"

#### 变量2：
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: 粘贴刚才复制的 anon public key
- 点击 "Add"

✅ 环境变量配置完成！

---

## 🚀 第六步：重新部署（1分钟）

### 方法1：自动部署（推荐）

1. 在本地修改任意文件（比如在README.md加个空格）
2. 提交到Git：
```bash
git add .
git commit -m "配置Supabase"
git push
```
3. Vercel会自动重新部署

### 方法2：手动部署

1. 在Vercel项目页面
2. 点击顶部 "Deployments"
3. 点击最新部署右侧的 "..." 菜单
4. 点击 "Redeploy"
5. 点击 "Redeploy" 确认

⏳ 等待1-2分钟部署完成...

✅ 部署完成！

---

## 🎉 第七步：迁移数据（2分钟）

### 1. 访问迁移页面

```
https://你的域名/migrate-to-cloud
```

例如：`https://your-app.vercel.app/migrate-to-cloud`

### 2. 点击 "开始迁移到云端" 按钮

### 3. 等待迁移完成

会显示：
```
✅ 迁移成功！已上传 XXX 条消息和 XXX 个话题到云端
```

### 4. 点击 "确定" 刷新页面

✅ 迁移完成！所有数据已在云端！

---

## ✅ 验证是否成功

### 1. 访问首页，检查是否能看到所有历史消息和话题

### 2. 发送一条新消息，刷新页面，检查消息是否还在

### 3. 打开浏览器控制台（F12），查看是否有错误

如果看到：
```
✅ [Supabase] 使用云端的 XXX 条消息
✅ [Topics API] 使用云端的 XXX 个话题
```

**恭喜！配置成功！** 🎉

---

## 🎯 配置后的好处

| 项目 | 配置前 | 配置后 |
|------|--------|--------|
| **存储位置** | 浏览器localStorage | Supabase云端 |
| **存储容量** | 5-10MB | 500MB（免费版） |
| **数据持久性** | 清除缓存会丢失 | 永久保存 |
| **多设备同步** | ❌ 不支持 | ✅ 支持 |
| **存储限制** | 容易超限 | 几乎无限制 |

---

## 🆘 常见问题

### Q1: 迁移后看不到数据？

**A:** 
1. 检查Vercel环境变量是否配置正确
2. 检查Vercel是否重新部署成功
3. 刷新页面（Ctrl+F5 强制刷新）
4. 打开F12控制台查看错误信息

### Q2: 显示 "Supabase未配置"？

**A:** 
1. 确认Vercel环境变量已添加
2. 确认已重新部署
3. 变量名必须完全一致（区分大小写）

### Q3: 迁移失败怎么办？

**A:** 
1. 不用担心，原localStorage数据不会丢失
2. 检查Supabase数据表是否创建成功
3. 检查SQL是否完整执行
4. 重新执行迁移即可

### Q4: 可以删除localStorage数据吗？

**A:** 
**建议保留！** localStorage现在只缓存最近20条消息，不会占用太多空间。保留它可以：
- 作为本地备份
- 加快首次加载速度
- 离线时也能查看最近消息

### Q5: Supabase免费版够用吗？

**A:** 
完全够用！免费版提供：
- 500MB 数据库存储
- 每月 50,000 次数据库请求
- 无限API请求
- 对于个人使用，绰绰有余

---

## 📞 需要帮助？

如果配置过程中遇到问题：

1. **检查Vercel部署日志**
   - Vercel项目 → Deployments → 点击最新部署 → 查看 "Build Logs"

2. **检查浏览器控制台**
   - 按F12 → Console标签 → 查看红色错误信息

3. **联系技术支持**
   - 提供错误截图
   - 提供Vercel部署日志

---

## 🎊 完成！

配置完成后，客户将永远不会再遇到"缓存满"的问题！

所有数据安全地存储在Supabase云端，可以放心使用。

---

**最后更新**: 2025年12月9日




