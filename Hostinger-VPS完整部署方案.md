# Hostinger VPS 完整部署方案

## 📋 方案概述

直接在你已有的Hostinger VPS上部署Next.js应用和MySQL数据库，一台VPS搞定所有。

## ✨ 你的VPS配置

- **系统**: Ubuntu 25.04
- **CPU**: 2核
- **内存**: 8GB
- **磁盘**: 100GB
- **位置**: 美国波士顿

**评估**: ⭐⭐⭐⭐⭐ 配置优秀，完全够用！

## 🚀 完整部署步骤

### 步骤1: SSH连接到VPS（1分钟）

```bash
# 使用Hostinger提供的SSH信息
ssh root@217.15.171.72
# 输入密码
```

### 步骤2: 安装必要软件（5分钟）

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Node.js 20 (Next.js推荐)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
node -v  # 应该显示 v20.x.x
npm -v

# 安装MySQL
apt install -y mysql-server

# 安装PM2 (进程管理器)
npm install -g pm2

# 安装Git
apt install -y git
```

### 步骤3: 配置MySQL（10分钟）

```bash
# 启动MySQL
systemctl start mysql
systemctl enable mysql

# 安全配置MySQL
mysql_secure_installation
# 按提示操作：
# - 设置root密码（记住这个密码）
# - 删除匿名用户: Y
# - 禁止root远程登录: Y
# - 删除测试数据库: Y
# - 重新加载权限表: Y

# 登录MySQL
mysql -u root -p
# 输入刚才设置的密码
```

在MySQL中执行：

```sql
-- 创建数据库
CREATE DATABASE chatapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'chatapp_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授权
GRANT ALL PRIVILEGES ON chatapp.* TO 'chatapp_user'@'localhost';
FLUSH PRIVILEGES;

-- 使用数据库
USE chatapp;

-- 创建消息表
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  topic_id VARCHAR(36),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'sent',
  model_id VARCHAR(50),
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建话题表
CREATE TABLE topics (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建用户设置表
CREATE TABLE user_settings (
  user_id VARCHAR(100) PRIMARY KEY,
  api_key TEXT,
  selected_model VARCHAR(50),
  base_url VARCHAR(255),
  settings JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 退出
EXIT;
```

### 步骤4: 部署Next.js应用（10分钟）

```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆你的项目（假设你的代码在GitHub）
git clone https://github.com/your-username/your-repo.git chatapp
cd chatapp

# 或者：如果没有Git仓库，使用SFTP上传代码到 /var/www/chatapp

# 安装依赖
npm install

# 创建环境变量文件
nano .env.production
```

在 `.env.production` 中添加：

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=chatapp_user
DB_PASSWORD=your_strong_password
DB_NAME=chatapp

# 其他配置（如果有）
NODE_ENV=production
```

保存并退出（Ctrl+X, Y, Enter）

```bash
# 构建应用
npm run build

# 使用PM2启动应用
pm2 start npm --name "chatapp" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 status

# 查看日志
pm2 logs chatapp
```

### 步骤5: 配置Nginx反向代理（10分钟）

```bash
# 安装Nginx
apt install -y nginx

# 创建Nginx配置
nano /etc/nginx/sites-available/chatapp
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name srv838934.hstgr.cloud;  # 使用你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

保存并退出

```bash
# 启用配置
ln -s /etc/nginx/sites-available/chatapp /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 设置开机自启
systemctl enable nginx
```

### 步骤6: 配置SSL证书（5分钟，可选但推荐）

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 获取SSL证书（需要先绑定域名）
certbot --nginx -d your-domain.com

# 按提示操作：
# - 输入邮箱
# - 同意服务条款
# - 选择是否重定向HTTP到HTTPS（推荐选Y）

# Certbot会自动配置Nginx并设置自动续期
```

### 步骤7: 配置防火墙（3分钟）

```bash
# 安装ufw（如果没有）
apt install -y ufw

# 允许SSH（重要！）
ufw allow 22/tcp

# 允许HTTP和HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

## 📊 部署完成检查

访问你的应用：

```
HTTP:  http://217.15.171.72
或
HTTPS: https://your-domain.com（如果配置了SSL）
```

检查项：
- [ ] 网站可以正常访问
- [ ] 聊天功能正常
- [ ] 消息可以保存
- [ ] 数据库连接正常

## 🔧 常用管理命令

### PM2管理

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs chatapp

# 重启应用
pm2 restart chatapp

# 停止应用
pm2 stop chatapp

# 更新代码后重新部署
cd /var/www/chatapp
git pull
npm install
npm run build
pm2 restart chatapp
```

### MySQL管理

```bash
# 登录MySQL
mysql -u chatapp_user -p chatapp

# 查看数据
SELECT COUNT(*) FROM messages;
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10;

# 清理旧数据（30天前）
DELETE FROM messages WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

# 查看数据库大小
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'chatapp';
```

### Nginx管理

```bash
# 测试配置
nginx -t

# 重启Nginx
systemctl restart nginx

# 查看错误日志
tail -f /var/log/nginx/error.log

# 查看访问日志
tail -f /var/log/nginx/access.log
```

## 📦 自动备份配置（推荐）

创建备份脚本：

```bash
# 创建备份目录
mkdir -p /backup/mysql

# 创建备份脚本
nano /root/backup.sh
```

添加内容：

```bash
#!/bin/bash
# MySQL数据库备份脚本

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/mysql"
DB_USER="chatapp_user"
DB_PASS="your_strong_password"
DB_NAME="chatapp"

# 创建备份
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/chatapp_$DATE.sql

# 只保留最近7天的备份
find $BACKUP_DIR -name "chatapp_*.sql" -mtime +7 -delete

echo "Backup completed: chatapp_$DATE.sql"
```

保存并设置权限：

```bash
chmod +x /root/backup.sh

# 设置每天凌晨3点自动备份
crontab -e
# 添加以下行：
0 3 * * * /root/backup.sh >> /var/log/backup.log 2>&1
```

## 🎯 性能优化（可选）

### 1. 启用Gzip压缩

编辑Nginx配置：

```bash
nano /etc/nginx/nginx.conf
```

确保以下行未注释：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### 2. 配置MySQL性能

```bash
nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

添加或修改：

```ini
[mysqld]
innodb_buffer_pool_size = 2G  # 设置为内存的25%
max_connections = 200
query_cache_size = 64M
```

重启MySQL：

```bash
systemctl restart mysql
```

### 3. 配置Node.js内存限制

修改PM2启动命令：

```bash
pm2 delete chatapp
pm2 start npm --name "chatapp" --max-memory-restart 1G -- start
pm2 save
```

## 🔍 监控和调试

### 实时监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看PM2监控
pm2 monit
```

### 查看日志

```bash
# Next.js应用日志
pm2 logs chatapp

# Nginx访问日志
tail -f /var/log/nginx/access.log

# Nginx错误日志
tail -f /var/log/nginx/error.log

# MySQL错误日志
tail -f /var/log/mysql/error.log

# 系统日志
journalctl -f
```

## 💰 成本对比

| 方案 | 月费用 | 配置 |
|------|--------|------|
| **你的VPS** | ¥43 | 2核8GB+100GB |
| Premium+MySQL | ¥29 | 共享+有限 |
| Supabase Pro | ¥175 | 托管服务 |

**结论：你的VPS性价比最高！**

## ✅ 总结

**使用你已有的VPS：**
- ✅ 无需额外费用
- ✅ 性能更好（独享资源）
- ✅ 完全控制
- ✅ 更灵活
- ✅ 可以运行多个项目

**不需要：**
- ❌ 额外购买Hostinger MySQL
- ❌ 购买Premium主机
- ❌ 使用其他服务

## 🚀 下一步行动

1. **今天**：用临时脚本解决客户问题
2. **本周**：按照本文档在VPS上部署
3. **完成**：彻底解决所有问题

## 📞 需要帮助？

如果在部署过程中遇到问题：
1. 查看PM2日志：`pm2 logs chatapp`
2. 查看Nginx日志：`tail -f /var/log/nginx/error.log`
3. 检查MySQL：`systemctl status mysql`
4. 联系我获取帮助

---

**你的VPS配置很好，直接用它就行！** 🎯

