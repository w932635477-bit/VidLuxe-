#!/bin/bash
# VidLuxe 健康检查脚本
# 每 5 分钟自动检查服务状态，发现问题自动重启

set -e

LOG_FILE="/var/log/vidluxe-health.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

ERRORS=0

log "开始健康检查..."

# 1. 检查 PM2 服务状态
log "检查 PM2 服务..."
if ! pm2 status 2>/dev/null | grep -q "online"; then
    log "❌ PM2 服务异常，正在重启..."
    pm2 restart vidluxe
    sleep 5
    ERRORS=$((ERRORS + 1))
else
    log "✅ PM2 服务正常"
fi

# 2. 检查 PM2 进程数量
PM2_ONLINE=$(pm2 jlist 2>/dev/null | grep -o '"status":"online"' | wc -l)
if [ "$PM2_ONLINE" -eq 0 ]; then
    log "❌ 没有运行中的 PM2 进程，正在重启..."
    pm2 restart vidluxe
    sleep 5
    ERRORS=$((ERRORS + 1))
fi

# 3. 检查 Nginx
log "检查 Nginx..."
if ! systemctl is-active --quiet nginx; then
    log "❌ Nginx 服务异常，正在重启..."
    systemctl restart nginx
    ERRORS=$((ERRORS + 1))
else
    log "✅ Nginx 服务正常"
fi

# 4. 检查 API 健康状态
log "检查 API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
    log "❌ API 健康检查失败: HTTP $HTTP_CODE，正在重启 PM2..."
    pm2 restart vidluxe
    sleep 5
    ERRORS=$((ERRORS + 1))
else
    log "✅ API 健康检查通过"
fi

# 5. 检查磁盘空间
log "检查磁盘空间..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    log "⚠️ 警告: 磁盘使用率超过 85% ($DISK_USAGE%)"
    # 触发紧急清理
    /opt/vidluxe/scripts/cleanup-uploads.sh
    ERRORS=$((ERRORS + 1))
elif [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️ 警告: 磁盘使用率超过 80% ($DISK_USAGE%)"
fi

# 6. 检查内存使用
log "检查内存使用..."
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ "$MEM_USAGE" -gt 90 ]; then
    log "⚠️ 警告: 内存使用率超过 90% ($MEM_USAGE%)"
    # 可选：重启服务释放内存
    # pm2 restart vidluxe
    ERRORS=$((ERRORS + 1))
fi

# 7. 检查 PM2 进程是否在运行
log "检查 PM2 进程..."
PM2_APP=$(pm2 jlist 2>/dev/null | grep -o '"name":"vidluxe"' | wc -l)
if [ "$PM2_APP" -eq 0 ]; then
    log "❌ PM2 应用不存在，正在启动..."
    cd /opt/vidluxe/apps/web/.next/standalone/apps/web
    pm2 start server-with-polyfill.js --name vidluxe
    sleep 10
    ERRORS=$((ERRORS + 1))
fi

# 8. 检查端口响应（如果 PM2 刚重启，需要等待）
if [ $ERRORS -eq 0 ]; then
    log "检查端口 3000..."
    if ! nc -z 127.0.0.1 3000 2>/dev/null; then
        # 再等 5 秒后重试
        sleep 5
        if ! nc -z 127.0.0.1 3000 2>/dev/null; then
            log "❌ 端口 3000 未响应..."
            ERRORS=$((ERRORS + 1))
        else
            log "✅ 端口 3000 正常"
        fi
    else
        log "✅ 端口 3000 正常"
    fi
fi

# 总结
log "========== 健康检查完成 =========="
if [ "$ERRORS" -gt 0 ]; then
    log "⚠️ 发现 $ERRORS 个问题，已尝试自动修复"
else
    log "✅ 所有检查通过"
fi

echo ""
echo "========== 健康检查完成 =========="
if [ "$ERRORS" -gt 0 ]; then
    echo "⚠️ 发现 $ERRORS 个问题"
    exit 1
else
    echo "✅ 所有检查通过"
fi
