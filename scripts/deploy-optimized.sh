#!/bin/bash
#
# VidLuxe 优化部署脚本 v2.0
#
# 基于全网最佳实践整合：
# 1. rsync 排除规则 - 避免同步 uploads 等大文件
# 2. 软链接策略 - 保持 uploads 持久化
# 3. 增量同步 - 只同步变更的文件
# 4. 安全检查 - 防止误删
#
# 用法: ./scripts/deploy-optimized.sh [options]
#
# 选项:
#   --skip-build    跳过本地构建
#   --skip-sync     跳过同步（只重启）
#   --dry-run       预览模式
#   --fast          快速模式（只同步必要文件）

set -e

# ============================================
# 配置
# ============================================

SERVER_IP="146.56.193.40"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_vidluxe"
DEPLOY_PATH="/opt/vidluxe"

LOCAL_PROJECT_ROOT="/Users/weilei/VidLuxe"
LOCAL_WEB_APP="$LOCAL_PROJECT_ROOT/apps/web"
LOCAL_NEXT_DIR="$LOCAL_WEB_APP/.next"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# 辅助函数
# ============================================

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

ssh_cmd() { ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "$1"; }
rsync_cmd() { rsync -avz -e "ssh -i $SSH_KEY" "$@"; }

# ============================================
# 排除规则 - 关键优化点
# ============================================

# 这些目录/文件 不会同步到服务器
EXCLUDE_PATTERNS=(
    "--exclude='standalone/apps/web/public/uploads/'"  # 用户上传文件
    "--exclude='cache/webpack/client-development/'"   # 开发缓存
    "--exclude='cache/webpack/server-development/'"   # 开发缓存
    "--exclude='cache/webpack/edge-server-development/'" # 开发缓存
    "--exclude='*.log'"                                # 日志文件
    "--exclude='.DS_Store'"                             # macOS 文件
    "--exclude='node_modules/.cache/'"                   # 缓存
)

# ============================================
# 预检查
# ============================================

preflight_check() {
    log_info "执行预检查..."

    # 检查 SSH 密钥
    [ -f "$SSH_KEY" ] || { log_error "SSH 密钥不存在"; exit 1; }
    log_success "SSH 密钥存在"

    # 测试 SSH 连接
    ssh_cmd "echo 'SSH OK'" > /dev/null 2>&1 || { log_error "SSH 连接失败"; exit 1; }
    log_success "SSH 连接正常"

    # 检查磁盘空间
    DISK_USAGE=$(ssh_cmd "df / | tail -1 | awk '{print \$5}' | tr -d '%'")
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "服务器磁盘使用率过高: ${DISK_USAGE}%"
        log_info "请先运行: ./scripts/cleanup-server.sh"
        exit 1
    fi
    log_success "磁盘使用率: ${DISK_USAGE}%"

    log_success "预检查通过"
}

# ============================================
# 本地构建
# ============================================

build() {
    log_info "开始本地构建..."

    cd "$LOCAL_PROJECT_ROOT"

    # 检查依赖
    [ ! -d "node_modules" ] && { log_info "安装依赖..."; pnpm install; }

    # 构建
    log_info "构建 Next.js (standalone 模式)..."
    pnpm --filter=@vidluxe/web build

    [ -d "$LOCAL_NEXT_DIR" ] || { log_error "构建失败"; exit 1; }

    # 显示构建大小
    BUILD_SIZE=$(du -sh "$LOCAL_NEXT_DIR" | cut -f1)
    log_success "构建完成 (大小: $BUILD_SIZE)"
}

# ============================================
# 优化的同步逻辑
# ============================================

sync() {
    log_info "开始优化的同步..."

    # 构建排除参数
    EXCLUDE_ARGS=""
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        EXCLUDE_ARGS="$EXCLUDE_ARGS $pattern"
    done

    # 同步 .next 目录（排除大文件）
    log_info "同步构建文件到服务器..."
    rsync_cmd --delete $EXCLUDE_ARGS \
        "$LOCAL_NEXT_DIR/" \
        "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apps/web/.next/"

    # 在服务器上设置软链接（如果不存在）
    log_info "配置 uploads 软链接..."
    ssh_cmd "
        # 确保 uploads 目录存在
        mkdir -p $DEPLOY_PATH/apps/web/public/uploads

        # 如果 standalone 中没有 uploads，创建软链接
        if [ ! -e $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads ]; then
            ln -sf $DEPLOY_PATH/apps/web/public/uploads $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/uploads
            echo '软链接已创建'
        else
            echo 'uploads 已存在'
        fi
    "

    # 复制 static 文件
    log_info "复制静态文件..."
    ssh_cmd "
        mkdir -p $DEPLOY_PATH/apps/web/.next/standalone/apps/web/.next/static
        cp -r $DEPLOY_PATH/apps/web/.next/static/* $DEPLOY_PATH/apps/web/.next/standalone/apps/web/.next/static/
    "

    log_success "同步完成"
}

# ============================================
# 快速同步（只同步必要文件）
# ============================================

fast_sync() {
    log_info "快速同步模式（只同步必要文件）..."

    # 只同步 standalone 和 static
    rsync_cmd --delete \
        --exclude='standalone/apps/web/public/uploads/' \
        --exclude='cache/' \
        "$LOCAL_NEXT_DIR/standalone/" \
        "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apps/web/.next/standalone/"

    rsync_cmd --delete \
        "$LOCAL_NEXT_DIR/static/" \
        "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apps/web/.next/static/"

    log_success "快速同步完成"
}

# ============================================
# 重启服务
# ============================================

restart() {
    log_info "重启服务..."
    ssh_cmd "pm2 restart vidluxe && sleep 3 && pm2 status vidluxe"
    log_success "服务已重启"
}

# ============================================
# 验证
# ============================================

verify() {
    log_info "执行部署后验证..."

    # 健康检查
    HTTP_CODE=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000" | tr -d '\n\r')

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        log_success "服务健康检查通过 (HTTP $HTTP_CODE)"
    else
        log_warning "HTTP 状态码: $HTTP_CODE"
    fi

    # 磁盘状态
    DISK_INFO=$(ssh_cmd "df -h / | tail -1")
    log_info "磁盘状态: $DISK_INFO"

    log_success "验证完成"
}

# ============================================
# 主函数
# ============================================

main() {
    SKIP_BUILD=false
    SKIP_SYNC=false
    DRY_RUN=false
    FAST_MODE=false

    for arg in "$@"; do
        case $arg in
            --skip-build) SKIP_BUILD=true ;;
            --skip-sync) SKIP_SYNC=true ;;
            --dry-run) DRY_RUN=true ;;
            --fast) FAST_MODE=true ;;
            --help|-h)
                echo "用法: $0 [options]"
                echo "  --skip-build  跳过本地构建"
                echo "  --skip-sync   跳过同步"
                echo "  --dry-run     预览模式"
                echo "  --fast        快速模式（只同步必要文件）"
                exit 0
                ;;
            *) log_error "未知参数: $arg"; exit 1 ;;
        esac
    done

    echo "============================================"
    echo "  VidLuxe 优化部署脚本 v2.0"
    echo "============================================"
    echo ""

    [ "$DRY_RUN" = true ] && { log_info "预览模式"; exit 0; }

    preflight_check

    [ "$SKIP_BUILD" = false ] && build
    [ "$SKIP_SYNC" = false ] && { [ "$FAST_MODE" = true ] && fast_sync || sync; }

    restart
    verify

    echo ""
    log_success "🎉 部署完成!"
    echo ""
    echo "访问: https://vidluxe.com.cn"
}

main "$@"
