#!/bin/bash
# VidLuxe 可靠部署脚本
# 使用方法: ./scripts/deploy.sh

set -e  # 遇到错误立即停止

SERVER="root@146.56.193.40"
SSH_KEY="$HOME/.ssh/id_vidluxe"
REMOTE_DIR="/opt/vidluxe/apps/web"
LOCAL_DIR="$(pwd)/apps/web"

echo "=========================================="
echo "VidLuxe 可靠部署脚本"
echo "=========================================="

# 1. 本地构建
echo ""
echo "[1/6] 本地构建..."
pnpm build

# 2. 停止远程服务
echo ""
echo "[2/6] 停止远程服务..."
ssh -i $SSH_KEY $SERVER "pm2 stop vidluxe || true"

# 3. 清理远程旧文件（关键！）
echo ""
echo "[3/6] 清理远程旧文件..."
ssh -i $SSH_KEY $SERVER "
  rm -rf $REMOTE_DIR/.next/standalone/* && \
  rm -rf $REMOTE_DIR/.next/static/* && \
  rm -rf $REMOTE_DIR/.next/server/* && \
  rm -rf $REMOTE_DIR/.next/cache && \
  echo '清理完成'
"

# 4. 同步 standalone（完整覆盖）
echo ""
echo "[4/6] 同步 standalone..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  "$LOCAL_DIR/.next/standalone/" \
  "$SERVER:$REMOTE_DIR/.next/standalone/"

# 5. 同步 static（完整覆盖）
echo ""
echo "[5/6] 同步 static..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  "$LOCAL_DIR/.next/static/" \
  "$SERVER:$REMOTE_DIR/.next/standalone/apps/web/.next/static/"

# 6. 同步 public（完整覆盖）
echo ""
echo "[6/6] 同步 public..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  "$LOCAL_DIR/public/" \
  "$SERVER:$REMOTE_DIR/.next/standalone/apps/web/public/"

# 7. 复制环境变量
echo ""
echo "[7/6] 复制环境变量..."
ssh -i $SSH_KEY $SERVER "
  cp $REMOTE_DIR/.env.local $REMOTE_DIR/.next/standalone/apps/web/ 2>/dev/null || echo 'env 文件已存在'
"

# 8. 启动服务（使用 Node.js 20）
echo ""
echo "[8/6] 启动服务..."
ssh -i $SSH_KEY $SERVER "
  cd $REMOTE_DIR/.next/standalone/apps/web && \
  pm2 start server.js --name vidluxe --interpreter=/usr/local/bin/node && \
  pm2 save && \
  sleep 3 && \
  pm2 status
"

# 9. 验证部署
echo ""
echo "[9/6] 验证部署..."
BUILD_ID=$(cat "$LOCAL_DIR/.next/BUILD_ID")
REMOTE_BUILD_ID=$(ssh -i $SSH_KEY $SERVER "cat $REMOTE_DIR/.next/standalone/apps/web/.next/BUILD_ID")

echo "本地 BUILD_ID: $BUILD_ID"
echo "远程 BUILD_ID: $REMOTE_BUILD_ID"

if [ "$BUILD_ID" = "$REMOTE_BUILD_ID" ]; then
  echo "✅ BUILD_ID 一致"
else
  echo "❌ BUILD_ID 不一致！部署可能失败"
  exit 1
fi

# 10. 健康检查
echo ""
echo "[10/6] 健康检查..."
HEALTH=$(ssh -i $SSH_KEY $SERVER "curl -s http://localhost:3000/api/health")
echo "健康状态: $HEALTH"

if echo "$HEALTH" | grep -q '"status":"healthy"'; then
  echo ""
  echo "=========================================="
  echo "✅ 部署成功！"
  echo "=========================================="
else
  echo ""
  echo "❌ 健康检查失败"
  exit 1
fi
