# 识界 · 零成本上线指南

> **AI 方案说明**：项目默认按原文档使用 **阿里云 DashScope**（通义千问 VL + 通义万相）。下文基础设施（Render / Neon / Cloudflare）仍可零成本部署；DashScope 新用户有免费额度，超出后按量计费。

> 目标：**0 元/月** 跑通 H5 + 微信小程序（基础设施），AI 使用 DashScope 免费试用额度。

## 架构一览

```
用户
 ├─ H5 网页 ──→ Cloudflare Pages（免费）
 └─ 微信小程序 ──→ 微信开发者工具上传（账号免费）

         ↓ HTTPS
后端 API ──→ Render 免费实例
         ├─ Neon PostgreSQL（免费 512MB）
         ├─ Cloudflare R2（免费 10GB，可选）
         ├─ Resend 邮件（免费 100 封/天）
         └─ 阿里云 DashScope（通义千问 VL / 通义万相）
```

---

## 第一步：注册免费服务（全部 0 元）

| 服务 | 用途 | 注册地址 |
|------|------|----------|
| **Neon** | PostgreSQL 数据库 | https://neon.tech |
| **Render** | 后端托管 | https://render.com |
| **Cloudflare** | H5 托管 + R2 存储 | https://dash.cloudflare.com |
| **Resend** | 发送登录验证码邮件 | https://resend.com |
| **DashScope** | 识物 + 生图 | https://dashscope.console.aliyun.com |
| **微信开放平台** | 小程序 | https://mp.weixin.qq.com |

---

## 第二步：配置 Neon 数据库

1. 创建 Project → 复制 **Connection string**
2. 格式类似：
   ```
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

本地开发（可选，需 Docker）：

```bash
docker compose up -d
# DATABASE_URL=postgresql://postgres:shijie@localhost:5432/shijie
```

---

## 第三步：部署后端到 Render

1. 将 `shijie-backend` 推送到 GitHub
2. Render → **New Web Service** → 连接仓库
3. 配置：

| 项 | 值 |
|----|-----|
| Root Directory | `shijie-backend` |
| Build Command | `npm install && npx prisma generate && npm run build && npx prisma migrate deploy` |
| Start Command | `npm run start:prod` |
| Plan | **Free** |

4. 环境变量（Environment）：

```env
DATABASE_URL=postgresql://...（Neon 连接串）
JWT_SECRET=随机长字符串（至少 32 位）
APP_PUBLIC_URL=https://你的服务.onrender.com
FRONTEND_URL=https://你的.pages.dev
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=你的 DashScope Key
AI_DAILY_LIMIT=100
RESEND_API_KEY=re_xxx
EMAIL_FROM=识界 <onboarding@resend.dev>
```

5. 部署完成后访问：`https://xxx.onrender.com/api/health`

> Render 免费实例 **15 分钟无访问会休眠**，首次请求需等待约 30～60 秒唤醒。

### 可选：Cloudflare R2 图片存储

1. Cloudflare → R2 → 创建 Bucket
2. 开启 Public Access，得到公开 URL
3. 在 Render 添加：

```env
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=shijie
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

未配置 R2 时，图片存在 Render 本地磁盘（免费实例重启会丢失，建议配置 R2）。

---

## 第四步：部署 H5 到 Cloudflare Pages

1. 构建前端：

```bash
cd shijie-frontend
TARO_APP_API=https://你的服务.onrender.com/api npm run build:h5
```

2. Cloudflare Pages → **Create project** → 上传 `dist` 目录  
   或连接 GitHub，构建命令：

```
cd shijie-frontend && npm install && TARO_APP_API=$TARO_APP_API npm run build:h5
```

发布目录：`shijie-frontend/dist`

3. 环境变量：`TARO_APP_API=https://xxx.onrender.com/api`

4. 得到地址：`https://shijie-xxx.pages.dev`

5. 回到 Render，更新 `FRONTEND_URL` 为该地址

---

## 第五步：发布微信小程序

1. 生成 tab 图标 PNG（小程序不支持 SVG）：

```bash
cd shijie-frontend
node scripts/generate-tab-icons.mjs
```

2. 构建小程序：

```bash
TARO_APP_API=https://你的服务.onrender.com/api npm run build:weapp
```

3. 微信开发者工具 → 导入 `shijie-frontend/dist` 目录

4. **开发管理 → 开发设置 → 服务器域名**：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://你的服务.onrender.com` |
| uploadFile 合法域名 | 同上 |
| downloadFile 合法域名 | R2 公开域名（如有） |

5. 提交审核 → 发布

> 个人小程序账号免费；部分 AI 类目可能需要企业资质，请以微信审核为准。

---

## 第六步：本地开发

### 后端

```bash
cd shijie-backend
cp .env.example .env
# 编辑 .env，填入 Neon DATABASE_URL 和 DASHSCOPE_API_KEY
npm install
npx prisma migrate deploy
npm run start:dev
```

未配置 `RESEND_API_KEY` 时，验证码会打印在后端控制台。

### 前端

```bash
cd shijie-frontend
npm install
npm run dev:h5
# 浏览器 http://localhost:10086
```

---

## 免费额度与限制

| 服务 | 免费额度 | 注意 |
|------|----------|------|
| Neon | 512 MB 存储 | 足够个人项目 |
| Render | 750 小时/月 | 单实例，会休眠 |
| Cloudflare Pages | 无限静态请求 | - |
| Cloudflare R2 | 10 GB | 足够图片存储 |
| Resend | 100 封/天 | 足够小规模用户 |
| DashScope | 新用户免费额度 | 识物 qwen-vl-plus，生图 wanx-v1 |

---

## 成本总结

| 项目 | 费用 |
|------|------|
| 服务器 | **0 元** |
| 数据库 | **0 元** |
| 存储 | **0 元** |
| 邮件 | **0 元** |
| AI 识物 | **试用免费**（DashScope 通义千问 VL） |
| AI 生图 | **试用免费**（DashScope 通义万相） |
| 域名 | **0 元**（使用 `.pages.dev` 子域名） |
| 微信小程序 | **0 元**（个人账号） |

**合计：0 元/月**（在用户量较小、免费额度内）

---

## 常见问题

**Q: Render 唤醒太慢？**  
A: 免费档限制，可接受或后期升级 $7/月。

**Q: 验证码收不到？**  
A: 检查 Resend 是否验证发件域名；开发阶段看后端控制台输出的 devCode。

**Q: 识物不准？**  
A: 配置 `DASHSCOPE_API_KEY` 并设置 `AI_PROVIDER=dashscope`，确保不是 Mock 模式。

**Q: 生图失败？**  
A: 检查 DashScope 万相服务是否开通，账户是否有剩余额度。
