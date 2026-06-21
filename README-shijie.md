# 识界（Shijie）

多模态 AI 智能助手 —— 拍照识物、文字生图、语音朗读、历史记录。

## 项目结构

```
9 - 全栈/
├── shijie-backend/       # Nest.js 后端 API
├── shijie-frontend/      # Taro 跨端前端（H5 + 微信小程序）
├── DEPLOY-ZERO-COST.md   # 零成本上线指南 ⭐
├── render.yaml           # Render 部署配置
└── docker-compose.yml    # 本地 PostgreSQL（可选）
```

## 快速开始（本地开发）

> 详细上线步骤见 **[SETUP-NOW.md](./SETUP-NOW.md)**（分阶段跟着做即可）

### 1. 数据库

**方式 A（推荐，0 成本）**：注册 [Neon](https://neon.tech) 免费 PostgreSQL，复制连接串到 `.env`

**方式 B（本地 Docker）**：

```bash
docker compose up -d
# DATABASE_URL=postgresql://postgres:shijie@localhost:5432/shijie
```

### 2. 后端

```bash
cd shijie-backend
cp .env.example .env
# 编辑 .env：DATABASE_URL、DASHSCOPE_API_KEY（通义千问 VL + 万相）
npm install
npx prisma migrate deploy
npm run start:dev
```

API：`http://localhost:3000/api`

未配置 `DASHSCOPE_API_KEY` 时，识物/生图走 Mock 演示模式。

未配置 `RESEND_API_KEY` 时，登录验证码打印在后端控制台。

### 3. 前端（H5）

```bash
cd shijie-frontend
npm install
npm run dev:h5
```

浏览器：`http://localhost:10086`

### 4. 微信小程序

```bash
cd shijie-frontend
node scripts/generate-tab-icons.mjs   # 生成 PNG 图标
npm run dev:weapp
```

用微信开发者工具打开 `shijie-frontend` 目录。

## 零成本上线

详见 **[DEPLOY-ZERO-COST.md](./DEPLOY-ZERO-COST.md)**

| 组件 | 免费方案 |
|------|----------|
| 后端 | Render |
| 数据库 | Neon PostgreSQL |
| H5 | Cloudflare Pages |
| 存储 | Cloudflare R2 |
| 邮件 | Resend |
| AI 识物 | 阿里云通义千问 VL（DashScope） |
| AI 生图 | 阿里云通义万相（DashScope） |

## 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 邮箱验证码登录 | ✅ | Resend 发邮件；开发模式控制台输出 |
| JWT 鉴权 | ✅ | 7 天 access token |
| 拍照识物 | ✅ | 通义千问 VL / Mock |
| 文字生图 | ✅ | 通义万相 / Mock |
| 历史记录 | ✅ | 分页、筛选、删除 |
| 语音朗读 | ✅ | H5 Web Speech / 后端 TTS |
| 退出登录 | ✅ | |
| H5 + 小程序 | ✅ | Taro 跨端 |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/send-code | 发送邮箱验证码 |
| POST | /api/auth/login | 邮箱 + 验证码登录 |
| POST | /api/auth/refresh | 刷新 token |
| POST | /api/auth/logout | 退出登录 |
| POST | /api/vision/recognize | 拍照识物 |
| POST | /api/generation/text-to-image | 文字生图 |
| GET | /api/history | 历史记录列表 |
| GET | /api/history/:id | 历史详情 |
| DELETE | /api/history/:id | 删除记录 |
| POST | /api/tts/speak | 语音合成 |
| GET | /api/health | 健康检查 |

## 技术栈

- **前端**：Taro 4 + React 18 + TypeScript
- **后端**：Nest.js 11 + Prisma + PostgreSQL
- **AI**：阿里云 DashScope（通义千问 VL 识物 + 通义万相生图）

## 配置 DashScope（原文档方案）

1. 注册 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 创建 API Key
3. 编辑 `shijie-backend/.env`：

```env
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxx
```

4. 重启后端，重新识物即可得到真实结果
