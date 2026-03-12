#!/bin/bash
# VidLuxe 上传文件清理脚本
# 自动清理过期的用户上传文件

set -e

LOG_FILE="/var/log/vidluxe-cleanup.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

UPLOAD_DIR="/opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads"

log "开始清理上传文件..."

# 统计清理前的文件数量
VIDEO_COUNT_BEFORE=$(find "$UPLOAD_DIR/videos" -name "*.mp4" 2>/dev/null | wc -l)
IMAGE_COUNT_BEFORE=$(find "$UPLOAD_DIR/images" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
KEYFRAME_COUNT_BEFORE=$(find "$UPLOAD_DIR/keyframes" -name "*.jpg" 2>/dev/null | wc -l)

log "清理前统计: 视频=$VIDEO_COUNT_BEFORE, 图片=$IMAGE_COUNT_BEFORE, 关键帧=$KEYFRAME_COUNT_BEFORE"

# 清理 7 天前的视频文件
log "清理 7 天前的视频文件..."
find "$UPLOAD_DIR/videos" -name "*.mp4" -mtime +7 -delete 2>/dev/null || true
find "$UPLOAD_DIR/videos" -name "*.mov" -mtime +7 -delete 2>/dev/null || true
find "$UPLOAD_DIR/videos" -name "*.webm" -mtime +7 -delete 2>/dev/null || true

# 清理 7 天前的增强图片
log "清理 7 天前的增强图片..."
find "$UPLOAD_DIR/images" -name "*.jpg" -mtime +7 -delete 2>/dev/null || true
find "$UPLOAD_DIR/images" -name "*.png" -mtime +7 -delete 2>/dev/null || true

# 清理 3 天前的关键帧（用户可能需要重新选择）
log "清理 3 天前的关键帧..."
find "$UPLOAD_DIR/keyframes" -type d -mtime +3 -exec rm -rf {} + 2>/dev/null || true

# 清理空的目录
log "清理空目录..."
find "$UPLOAD_DIR" -type d -empty -delete 2>/dev/null || true

# 统计清理后的文件数量
VIDEO_COUNT_AFTER=$(find "$UPLOAD_DIR/videos" -name "*.mp4" 2>/dev/null | wc -l)
IMAGE_COUNT_AFTER=$(find "$UPLOAD_DIR/images" -name "*.jpg" -o -name "*.png" 2>/dev/null | wc -l)
KEYFRAME_COUNT_AFTER=$(find "$UPLOAD_DIR/keyframes" -name "*.jpg" 2>/dev/null | wc -l)

# 计算释放的空间
SPACE_FREED=$(df -h "$UPLOAD_DIR" | awk 'NR==2 {print $4}')

log "清理后统计: 视频=$VIDEO_COUNT_AFTER, 图片=$IMAGE_COUNT_AFTER, 关键帧=$KEYFRAME_COUNT_AFTER"
log "当前剩余空间: $SPACE_FREED"

# 磁盘使用率检查
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "⚠️ 警告: 磁盘使用率超过 80% ($DISK_USAGE%)"
fi

log "清理完成！"

echo ""
echo "✅ 文件清理完成！"
