# 识界项目部署指南

## 📋 部署前准备

### 必需的账号和服务

| 服务 | 用途 | 是否必需 | 获取方式 |
|------|------|----------|----------|
| 阿里云 DashScope | AI 识别、生图、语音合成 | ✅ 必需 | https://dashscope.console.aliyun.com/ |
| 云数据库（Neon/PostgreSQL） | 生产环境数据存储 | ✅ 必需 | https://neon.tech/ |
| Cloudflare R2（可选） | 图片存储 | ⚠️ 可选 | https://dash.cloudflare.com/ |
| Resend（可选） | 邮件验证码 | ⚠️ 可选 | https://resend.com/ |

---

## 🚀 部署方式

### 方式一：Docker Compose 本地部署（推荐用于测试）

#### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 复制示例文件
cp shijie-backend/.env.example .env
```

编辑 `.env` 文件，填写以下必需配置：

```bash
# 数据库连接（使用 Docker Compose 时使用此配置）
DATABASE_URL=postgresql://postgres:shijie@db:5432/shijie

# 阿里云 DashScope API Key（必填）
DASHSCOPE_API_KEY=你的API_KEY

# 前端 API 地址
TARO_APP_API=http://localhost:3000/api

# 应用公开 URL
APP_PUBLIC_URL=http://localhost:3000
FRONTEND_URL=http://localhost:80
```

#### 2. 启动服务

```bash
# 在项目根目录执行
docker-compose up -d
```

#### 3. 查看服务状态

```bash
docker-compose ps
```

#### 4. 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

#### 5. 停止服务

```bash
docker-compose down
```

---

### 方式二：部署到 Render（推荐用于生产）

#### 1. 准备 Neon 数据库

1. 访问 https://neon.tech/
2. 创建免费项目
3. 创建数据库，获取连接字符串，格式如：
   ```
   postgresql://用户名:密码@主机名/数据库名?sslmode=require
   ```

#### 2. 部署后端到 Render

1. 访问 https://render.com/
2. 点击 "New +" → "Web Service"
3. 连接 GitHub 仓库：`Molika68/shijie.git`
4. 配置构建和运行：

| 配置项 | 值 |
|--------|-----|
| Name | `shijie-backend` |
| Environment | `Node` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npm run start:prod` |
| Instance Type | `Free` |

5. 配置环境变量（Environment Variables）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | Neon 连接字符串 | 必填 |
| `DASHSCOPE_API_KEY` | 你的 API Key | 必填 |
| `JWT_SECRET` | 随机字符串 | 必填（可用 `openssl rand -hex 32` 生成） |
| `PORT` | `3000` | 必填 |
| `AI_PROVIDER` | `dashscope` | 必填 |
| `APP_PUBLIC_URL` | 后端 URL | 必填（如 `https://shijie-backend.onrender.com`） |
| `FRONTEND_URL` | 前端 URL | 必填（如 `https://shijie-frontend.vercel.app`） |

6. 点击 "Create Web Service"
7. 等待部署完成（约 2-3 分钟）
8. 复制后端 URL，格式如：`https://shijie-backend.onrender.com`

#### 3. 部署前端 H5 到 Cloudflare Pages

1. 访问 https://dash.cloudflare.com/
2. 点击 "Workers & Pages" → "Create" → "Pages"
3. 选择 "Connect to Git"，连接你的 GitHub 仓库：`Molika68/shijie.git`
4. 配置项目：

| 配置项 | 值 |
|--------|-----|
| Project name | `shijie-frontend` |
| Build command | `cd shijie-frontend && npm install && TARO_APP_API=$TARO_APP_API npm run build:h5` |
| Build output directory | `shijie-frontend/dist` |

5. 配置环境变量（Environment variables）：

| 变量名 | 值 |
|--------|-----|
| `TARO_APP_API` | 后端 URL + `/api`（如 `https://shijie-api.onrender.com/api`） |

6. 点击 "Save and Deploy"
7. 等待部署完成，复制前端 URL（格式如 `https://shijie-xxx.pages.dev`）

#### 4. 更新后端环境变量

回到 Render 后端服务，更新 `FRONTEND_URL` 为实际的前端 URL（如 `https://shijie-xxx.pages.dev`）。

---

### 方式三：部署微信小程序

#### 1. 构建小程序代码

```bash
cd shijie-frontend
npm install
npm run build:weapp
```

#### 2. 配置小程序

1. 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 打开微信开发者工具
3. 导入项目，选择 `shijie-frontend/dist` 目录
4. 填写 AppID（测试用可使用测试号）
5. 配置服务器域名：
   - 登录微信公众平台：https://mp.weixin.qq.com/
   - 进入「开发」→「开发管理」→「开发设置」
   - 在「服务器域名」中添加：
     - request 合法域名：你的后端 URL（如 `https://shijie-backend.onrender.com`）
     - uploadFile 合法域名：同上
     - downloadFile 合法域名：同上

#### 3. 上传小程序

1. 在微信开发者工具中点击「上传」
2. 填写版本号和备注
3. 登录微信公众平台，进入「版本管理」
4. 提交审核，审核通过后发布

---

## 🔧 配置说明

### 阿里云 DashScope API Key 获取

1. 访问 https://dashscope.console.aliyun.com/
2. 登录阿里云账号
3. 进入「API-KEY 管理」
4. 创建新的 API-KEY
5. 复制 API Key

### Cloudflare R2 配置（可选）

如果需要使用 R2 存储图片，配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `R2_ACCOUNT_ID` | R2 账户 ID |
| `R2_ACCESS_KEY_ID` | R2 访问密钥 ID |
| `R2_SECRET_ACCESS_KEY` | R2 访问密钥 |
| `R2_BUCKET_NAME` | 存储桶名称 |
| `R2_PUBLIC_URL` | R2 公开访问 URL |

### Resend 邮件配置（可选）

如果需要使用邮件验证码，配置以下环境变量：

| 变量名 | 说明 |
|--------|------|
| `RESEND_API_KEY` | Resend API Key |
| `EMAIL_FROM` | 发件人邮箱 |

---

## 📊 监控和日志

### Render 后端日志

1. 登录 Render 控制台
2. 进入后端服务
3. 点击 "Logs" 查看实时日志

### Vercel 前端日志

1. 登录 Vercel 控制台
2. 进入前端项目
3. 点击 "Logs" 查看部署和访问日志

### Docker Compose 日志

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🐛 常见问题

### 1. 后端启动失败

**原因**：数据库连接失败

**解决**：
- 检查 `DATABASE_URL` 是否正确
- 确保数据库服务正在运行
- 检查防火墙设置

### 2. 前端无法连接后端

**原因**：CORS 错误或 API 地址配置错误

**解决**：
- 检查 `TARO_APP_API` 是否正确
- 确保后端的 `FRONTEND_URL` 包含前端地址
- 检查浏览器控制台的网络请求

### 3. AI 功能无法使用

**原因**：`DASHSCOPE_API_KEY` 未配置或无效

**解决**：
- 检查环境变量中是否正确配置了 API Key
- 确认 API Key 未过期
- 检查阿里云账户余额

### 4. 图片上传失败

**原因**：未配置 R2 或 R2 配置错误

**解决**：
- 配置 R2 相关环境变量
- 或暂时使用本地存储（默认行为）

---

## 🔄 更新部署

### Docker Compose 更新

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 查看更新状态
docker-compose ps
```

### Render 更新

1. 推送代码到 GitHub
2. Render 会自动检测到更新并重新部署
3. 在 Render 控制台查看部署状态

### Vercel 更新

1. 推送代码到 GitHub
2. Vercel 会自动检测到更新并重新部署
3. 在 Vercel 控制台查看部署状态

### 微信小程序更新

1. 构建新版本小程序代码
2. 在微信开发者工具中上传新版本
3. 在微信公众平台提交审核

---

## 📞 技术支持

如有问题，请联系：
- 邮箱：support@shijie.ai
- GitHub Issues：https://github.com/Molika68/shijie/issues