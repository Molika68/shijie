# 多阶段构建：前端 Dockerfile

# 阶段 1：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 设置环境变量（构建时使用）
ARG NODE_ENV=production
ARG TARO_APP_API=http://localhost:3000/api

ENV NODE_ENV=${NODE_ENV}
ENV TARO_APP_API=${TARO_APP_API}

# 构建 H5 版本
RUN npm run build:h5

# 阶段 2：运行阶段（Nginx）
FROM nginx:alpine AS runner

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]