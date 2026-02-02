#!/bin/bash

# GitDaily 启动脚本
# 同时启动 API 服务器和前端开发服务器

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 启动 GitDaily...${NC}"
echo ""

# 检查并安装依赖（首次运行）
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
    echo ""
fi

# 检查数据库是否存在
if [ ! -d "data" ] || [ ! -f "data/gitdaily.db" ]; then
    echo -e "${YELLOW}🗄️  初始化数据库...${NC}"
    npx tsx src/db/cli.ts --info
    echo ""
fi

# 启动 API 服务器
echo -e "${GREEN}🔧 启动 API 服务器 (端口 3001)...${NC}"
npx tsx src/server.ts &
API_PID=$!

# 等待 API 服务器启动
sleep 2

# 检查 API 是否正常运行
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API 服务器已启动${NC}"
else
    echo -e "${RED}❌ API 服务器启动失败${NC}"
    kill $API_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo ""
echo -e "${GREEN}🌐 启动前端开发服务器...${NC}"
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 3

# 检查前端是否正常运行
if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端已启动${NC}"
else
    echo -e "${YELLOW}⚠️  前端启动中...${NC}"
fi

echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}  GitDaily 已启动！${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo "API 服务器: http://localhost:3001"
echo "前端页面:   http://localhost:3000"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 等待用户中断
wait $API_PID $FRONTEND_PID
