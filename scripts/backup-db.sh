#!/bin/bash
# VidLuxe 数据库备份脚本
# 每天备份 Supabase 数据到本地

set -e

DATE=$(date +%Y%m%d)
BACKUP_DIR="/opt/vidluxe/backups"
LOG_FILE="/var/log/vidluxe-backup.log"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始备份数据库..."

# Supabase 配置
SUPABASE_URL="https://lklgluxnloqmyelxtpfi.supabase.co"

# 从环境变量或配置文件读取 Service Key
SERVICE_KEY_FILE="/opt/vidluxe/.supabase_service_key"
if [ -f "$SERVICE_KEY_FILE" ]; then
    SERVICE_KEY=$(cat "$SERVICE_KEY_FILE")
elif [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
else
    log "错误: 未找到 Service Key，请创建 $SERVICE_KEY_FILE 文件"
    exit 1
fi

# 备份用户额度数据
log "备份用户额度数据..."
curl -s -X GET "$SUPABASE_URL/rest/v1/user_credits?select=*" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  > "$BACKUP_DIR/user_credits_$DATE.json"

# 备份交易记录
log "备份交易记录..."
curl -s -X GET "$SUPABASE_URL/rest/v1/credit_transactions?select=*" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  > "$BACKUP_DIR/credit_transactions_$DATE.json"

# 备份邀请码数据
log "备份邀请码数据..."
curl -s -X GET "$SUPABASE_URL/rest/v1/invite_codes?select=*" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  > "$BACKUP_DIR/invite_codes_$DATE.json"

# 压缩备份文件
log "压缩备份文件..."
cd "$BACKUP_DIR"
tar -czf "vidluxe_backup_$DATE.tar.gz" \
    "user_credits_$DATE.json" \
    "credit_transactions_$DATE.json" \
    "invite_codes_$DATE.json" \
    --remove-files

# 保留最近 30 天的备份
log "清理旧备份..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete 2>/dev/null || true

# 显示备份结果
BACKUP_SIZE=$(du -h "$BACKUP_DIR/vidluxe_backup_$DATE.tar.gz" | cut -f1)
log "备份完成！文件大小: $BACKUP_SIZE"

# 显示备份列表
log "当前备份列表:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5

echo ""
echo "✅ 数据库备份完成！"
