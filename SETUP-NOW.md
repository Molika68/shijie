# 识界 · 上线分步操作（跟着做即可）

> 本地已可运行；按下面步骤把项目部署到公网，**全程 0 元**。

---

## 阶段 0：确认本地能跑（5 分钟）

```bash
cd "9 - 全栈"
chmod +x scripts/dev.sh
./scripts/dev.sh
```

1. 浏览器打开 http://localhost:10086
2. 输入任意邮箱 → 点「获取验证码」
3. **看运行后端的终端**，会打印类似：`[开发模式] xxx@qq.com 验证码: 123456`
4. 输入验证码登录 → 试拍照识物

本地 OK 再往下走。

---

## 阶段 1：Neon 免费数据库（5 分钟）

1. 打开 https://neon.tech → **Sign Up**（可用 GitHub 登录）
2. **New Project** → 名字填 `shijie` → Region 选离用户近的
3. Dashboard → **Connection string** → 复制 **Pooled connection**
4. 格式类似：
   ```
   postgresql://neondb_owner:xxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. 保存好，后面填到 Render 环境变量

---

## 阶段 2：阿里云 DashScope AI（5 分钟）

按原文档使用 **通义千问 VL**（识物）+ **通义万相**（生图）：

1. 打开 https://dashscope.console.aliyun.com/
2. 登录阿里云账号 → **API-KEY 管理** → 创建 Key
3. 复制 Key（形如 `sk-xxx`）
4. 新用户通常有免费试用额度

本地可先写入 `shijie-backend/.env` 验证：

```env
AI_PROVIDER=dashscope
DASHSCOPE_API_KEY=sk-xxx
```

重启后端后重新识物，应返回真实识别结果。

---

## 阶段 3：Render 部署后端（15 分钟）

### 3.1 代码推到 GitHub

```bash
cd "9 - 全栈"
git init
git add .
git commit -m "识界零成本版本"
# 在 GitHub 新建仓库 shijie，然后：
git remote add origin https://github.com/你的用户名/shijie.git
git push -u origin main
```

### 3.2 创建 Render 服务

1. 打开 https://render.com → 注册（可用 GitHub）
2. **New +** → **Web Service**
3. 连接你的 GitHub 仓库
4. 配置：

| 字段 | 值 |
|------|-----|
| Name | `shijie-api` |
| Root Directory | `shijie-backend` |
| Runtime | Node |
| Build Command | `npm install && npx prisma generate && npm run build && npx prisma migrate deploy` |
| Start Command | `npm run start:prod` |
| Instance Type | **Free** |

### 3.3 环境变量（Environment → Add Environment Variable）

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon 连接串（阶段 1 复制的） |
| `JWT_SECRET` | 随机字符串（可运行 `openssl rand -hex 32` 生成） |
| `APP_PUBLIC_URL` | 先留空，部署完成后填 `https://shijie-api.onrender.com` |
| `FRONTEND_URL` | 先留空，H5 部署后填 Cloudflare Pages 地址 |
| `AI_PROVIDER` | `dashscope` |
| `DASHSCOPE_API_KEY` | 阶段 2 的 Key |
| `AI_DAILY_LIMIT` | `100` |

5. 点 **Deploy**，等待约 5～10 分钟
6. 部署成功后访问：`https://shijie-api.onrender.com/api/health`  
   应返回 `{"code":200,...}`

7. 回到 Environment，把 `APP_PUBLIC_URL` 改成你的 Render 地址

---

## 阶段 4：Resend 免费邮件（可选，5 分钟）

不配 Resend 时，验证码只在 Render 日志里（不适合真实用户）。

1. 打开 https://resend.com → 注册
2. **API Keys** → Create → 复制 `re_xxx`
3. Render 环境变量添加：
   - `RESEND_API_KEY` = 你的 Key
   - `EMAIL_FROM` = `识界 <onboarding@resend.dev>`（Resend 测试域名，仅发到你注册的邮箱）

---

## 阶段 5：Cloudflare Pages 部署 H5（10 分钟）

### 方式 A：直接上传（最快）

```bash
cd shijie-frontend
npm install
TARO_APP_API=https://shijie-api.onrender.com/api npm run build:h5
```

1. 打开 https://dash.cloudflare.com → **Workers & Pages** → **Create**
2. **Pages** → **Upload assets**
3. 上传 `shijie-frontend/dist` 文件夹里的全部内容
4. 得到地址如 `https://shijie-xxx.pages.dev`

### 方式 B：连接 GitHub（自动部署）

Build command:
```
cd shijie-frontend && npm install && TARO_APP_API=$TARO_APP_API npm run build:h5
```
Build output directory: `shijie-frontend/dist`  
Environment variable: `TARO_APP_API` = `https://shijie-api.onrender.com/api`

### 5.1 更新 CORS

回到 Render → Environment → 修改：
```
FRONTEND_URL=https://shijie-xxx.pages.dev
```
保存后会自动重新部署。

---

## 阶段 6：微信小程序（15 分钟）

```bash
cd shijie-frontend
node scripts/generate-tab-icons.mjs
TARO_APP_API=https://shijie-api.onrender.com/api npm run build:weapp
```

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册小程序（个人账号免费）→ 拿到 AppID
3. 导入项目：目录选 `shijie-frontend/dist`，填入 AppID
4. **开发管理 → 开发设置 → 服务器域名**：

| 类型 | 域名 |
|------|------|
| request | `https://shijie-api.onrender.com` |
| uploadFile | `https://shijie-api.onrender.com` |
| downloadFile | `https://shijie-api.onrender.com` |

5. 预览 → 真机测试 → 提交审核

---

## 阶段 7：Cloudflare R2 图片存储（推荐，10 分钟）

Render 免费实例重启后，本地磁盘图片会丢失。上线建议配 R2：

1. Cloudflare Dashboard → **R2** → Create bucket `shijie`
2. **Settings** → Public access → 允许 → 复制 Public URL
3. **Manage R2 API Tokens** → Create token → 拿到 Account ID、Access Key、Secret
4. Render 添加环境变量：

```
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=shijie
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## 检查清单

- [ ] `https://xxx.onrender.com/api/health` 返回 200
- [ ] H5 能打开登录页
- [ ] 邮箱验证码能收到（或 Render 日志可见）
- [ ] 识物、生图、历史记录正常
- [ ] 小程序 request 域名已配置
- [ ] （推荐）R2 已配置，图片 URL 为 https

---

## 你现在在哪一步？

| 已完成 | 下一步 |
|--------|--------|
| 本地能跑 | 阶段 1 Neon |
| Neon 有了 | 阶段 3 Render |
| Render 部署成功 | 阶段 5 Cloudflare H5 |
| H5 能访问 | 阶段 6 小程序 |
| 都要稳定运行 | 阶段 7 R2 |

有问题把报错截图发我，我帮你看。
