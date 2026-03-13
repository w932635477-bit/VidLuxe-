#!/bin/bash

# VidLuxe 生产环境部署脚本
# 用于构建和部署 Next.js 应用到生产环境

set -e  # 遇到错误立即退出

echo "=== VidLuxe 生产环境部署 ==="
echo ""

# 1. 构建应用
echo "1. 构建应用..."
cd /opt/vidluxe/apps/web
pnpm build

# 2. 复制静态文件到 standalone 目录
echo ""
echo "2. 复制静态文件..."
cp -r .next/static .next/standalone/apps/web/.next/
cp -r public .next/standalone/apps/web/

# 3. 验证文件
echo ""
echo "3. 验证文件..."
if [ -d ".next/standalone/apps/web/.next/static" ]; then
  echo "   ✅ 静态文件已复制"
else
  echo "   ❌ 静态文件复制失败"
  exit 1
fi

if [ -d ".next/standalone/apps/web/public" ]; then
  echo "   ✅ public 目录已复制"
else
  echo "   ❌ public 目录复制失败"
  exit 1
fi

# 4. 重启服务
echo ""
echo "4. 重启服务..."
pm2 restart vidluxe

# 5. 等待服务启动
echo ""
echo "5. 等待服务启动..."
sleep 3

# 6. 检查服务状态
echo ""
echo "6. 检查服务状态..."
pm2 status vidluxe

echo ""
echo "=== 部署完成 ==="
echo ""
echo "访问: https://vidluxe.com.cn"
