#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 识界 本地开发启动"
echo ""

# 后端
echo "[1/2] 启动后端 http://localhost:3000/api"
cd "$ROOT/shijie-backend"
npm install --silent 2>/dev/null || npm install
npm run start:dev &
BACKEND_PID=$!

sleep 4

# 前端
echo "[2/2] 启动前端 H5 http://localhost:10086"
cd "$ROOT/shijie-frontend"
npm install --silent 2>/dev/null || npm install
npm run dev:h5 &
FRONTEND_PID=$!

echo ""
echo "✅ 已启动"
echo "   后端 API:  http://localhost:3000/api/health"
echo "   前端 H5:   http://localhost:10086"
echo "   登录验证码: 看后端终端输出（未配 Resend 时）"
echo ""
echo "按 Ctrl+C 停止"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
