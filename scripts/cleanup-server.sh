#!/bin/bash
#
# VidLuxe 服务器自动清理脚本
#
# 功能:
# 1. 清理旧的上传文件（保留最近 N 天）
# 2. 清理构建缓存
# 3. 清理日志文件
# 4. 清理 Docker 未使用资源
#
# 用法:
#   ./scripts/cleanup-server.sh          # 默认清理
#   ./scripts/cleanup-server.sh --dry-run # 预览模式
#   ./scripts/cleanup-server.sh --days 7 # 保留 7 天
#

set -e

# ============================================
# 配置
# ============================================

SERVER_IP="146.56.193.40"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_vidluxe"
DEPLOY_PATH="/opt/vidluxe"

# 默认保留天数
KEEP_DAYS=${KEEP_DAYS:-3}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }

# ============================================
# 清理函数
# ============================================

cleanup_uploads() {
    log_info "清理旧的上传文件 (保留 ${KEEP_DAYS} 天)..."

    # 计算
    BEFORE=$(ssh_cmd "du -sm $DEPLOY_PATH/apps/web/public/uploads 2>/dev/null | cut -f1" || echo "0")
    log_info "当前 uploads 大小: ${BEFORE}MB"

    # 清理
    DELETED=$(ssh_cmd "
        find $DEPLOY_PATH/apps/web/public/uploads -type f -mtime +$KEEP_DAYS -delete -print 2>/dev/null | wc -l
    " || echo "0")

    # 计算
    AFTER=$(ssh_cmd "du -sm $DEPLOY_PATH/apps/web/public/uploads 2>/dev/null | cut -f1" || echo "0")

    SAVED=$((BEFORE - AFTER))
    log_success "已删除 ${DELETED} 个文件, 释放 ${SAVED}MB"
}

cleanup_standalone_uploads() {
    log_info "清理 standalone 中的重复 uploads..."

    # 检查是否存在
    EXISTS=$(ssh_cmd "test -d $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads && echo 'yes' || echo 'no'")

    if [ "$EXISTS" = "yes" ]; then
        # 检查是否是软链接
        IS_LINK=$(ssh_cmd "test -L $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads && echo 'link' || echo 'dir'")

        if [ "$IS_LINK" = "dir" ]; then
            # 是目录，需要删除并用软链接替换
            SIZE=$(ssh_cmd "du -sm $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads | cut -f1")
            ssh_cmd "rm -rf $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads"
            ssh_cmd "ln -sf $DEPLOY_PATH/apps/web/public/uploads $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads"
            log_success "已删除重复 uploads (${SIZE}MB)，并创建软链接"
        else
            log_info "uploads 已是软链接，无需清理"
        fi
    fi
}

cleanup_cache() {
    log_info "清理构建缓存..."

    # 清理开发缓存
    ssh_cmd "
        rm -rf $DEPLOY_PATH/apps/web/.next/cache/webpack/client-development 2>/dev/null || true
        rm -rf $DEPLOY_PATH/apps/web/.next/cache/webpack/server-development 2>/dev/null || true
        rm -rf $DEPLOY_PATH/apps/web/.next/cache/webpack/edge-server-development 2>/dev/null || true
    "

    log_success "开发缓存已清理"
}

cleanup_logs() {
    log_info "清理日志文件..."

    # PM2 日志
    ssh_cmd "pm2 flush 2>/dev/null || true"

    # 系统日志（保留最近 7 天）
    ssh_cmd "find /var/log -name '*.log' -mtime +7 -delete 2>/dev/null || true"

    log_success "日志已清理"
}

cleanup_docker() {
    log_info "清理 Docker 未使用资源..."

    ssh_cmd "docker system prune -af --volumes 2>/dev/null || true"

    log_success "Docker 清理完成"
}

show_disk_status() {
    log_info "当前磁盘状态:"
    ssh_cmd "df -h /"
}

# ============================================
# 主函数
# ============================================

main() {
    DRY_RUN=false

    for arg in "$@"; do
        case $arg in
            --dry-run) DRY_RUN=true ;;
            --days) shift; KEEP_DAYS=$1 ;;
            --help|-h)
                echo "用法: $0 [options]"
                echo "  --dry-run    预览模式"
                echo "  --days N     保留最近 N 天的文件 (默认: 3)"
                exit 0
                ;;
        esac
    done

    echo "============================================"
    echo "  VidLuxe 服务器清理脚本"
    echo "============================================"
    echo ""

    [ "$DRY_RUN" = true ] && { log_info "预览模式"; exit 0; }

    show_disk_status
    echo ""

    cleanup_standalone_uploads
    cleanup_uploads
    cleanup_cache
    cleanup_logs
    cleanup_docker

    echo ""
    show_disk_status

    echo ""
    log_success "🎉 清理完成!"
}

main "$@"
