#!/bin/bash
#
# VidLuxe 生产环境部署脚本
#
# 用法: ./scripts/deploy.sh [options]
#
# 选项:
#   --skip-build    跳过本地构建（只同步和重启）
#   --skip-sync     跳过同步（只重启）
#   --dry-run       只显示将要执行的命令，不实际执行
#

set -e  # 遇到错误立即退出

# ============================================
# 配置 - 所有路径集中管理
# ============================================

# 服务器配置
SERVER_IP="146.56.193.40"
SERVER_USER="root"
SSH_KEY="$HOME/.ssh/id_vidluxe"

# ✅ 正确的部署路径
# 根据实际 server.js 位置: /opt/vidluxe/apps/web/.next/standalone/apps/web/server.js
DEPLOY_PATH="/opt/vidluxe"

# ⚠️ 禁止使用的路径（用于安全检查）
FORBIDDEN_PATHS=(
    "/www/vidluxe"
    "/www/wwwroot/vidluxe"
    "/var/www/vidluxe"
)

# 本地项目路径
LOCAL_PROJECT_ROOT="/Users/weilei/VidLuxe"
LOCAL_WEB_APP="$LOCAL_PROJECT_ROOT/apps/web"
LOCAL_NEXT_DIR="$LOCAL_WEB_APP/.next"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# 辅助函数
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# SSH 命令封装
ssh_cmd() {
    ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" "$1"
}

# Rsync 命令封装
rsync_cmd() {
    rsync -avz -e "ssh -i $SSH_KEY" "$@"
}

# ============================================
# 预检查
# ============================================

preflight_check() {
    log_info "执行预检查..."

    # 1. 检查 SSH 密钥
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH 密钥不存在: $SSH_KEY"
        exit 1
    fi
    log_success "SSH 密钥存在"

    # 2. 检查本地项目目录
    if [ ! -d "$LOCAL_PROJECT_ROOT" ]; then
        log_error "本地项目目录不存在: $LOCAL_PROJECT_ROOT"
        exit 1
    fi
    log_success "本地项目目录存在"

    # 3. 测试 SSH 连接
    log_info "测试 SSH 连接..."
    if ! ssh_cmd "echo 'SSH 连接成功'" > /dev/null 2>&1; then
        log_error "SSH 连接失败"
        exit 1
    fi
    log_success "SSH 连接正常"

    # 4. ⚠️ 关键：验证服务器上的正确路径
    log_info "验证服务器部署路径..."

    # 从 PM2 获取实际路径 (使用 grep -o 只匹配路径)
    PM2_SCRIPT_PATH=$(ssh_cmd "pm2 show vidluxe 2>/dev/null | grep -oE '/[^ ]+server\.js'" || echo "")

    if [ -z "$PM2_SCRIPT_PATH" ]; then
        log_warning "无法从 PM2 获取路径，尝试自动检测..."

        # 尝试检测实际路径
        DETECTED_PATH=$(ssh_cmd "find /opt/vidluxe -name 'server.js' -path '*/standalone/*' 2>/dev/null | head -1")
        if [ -n "$DETECTED_PATH" ]; then
            log_info "检测到 server.js: $DETECTED_PATH"
            # 提取部署根路径 (例如: /opt/vidluxe/apps/web/.next/standalone/apps/web/server.js -> /opt/vidluxe)
            EXTRACTED_PATH=$(echo "$DETECTED_PATH" | sed 's|/apps/web/.*||')
            if [ -n "$EXTRACTED_PATH" ]; then
                log_info "使用检测到的路径: $EXTRACTED_PATH"
                DEPLOY_PATH="$EXTRACTED_PATH"
            fi
        fi
    else
        # 从脚本路径提取部署根路径
        EXTRACTED_PATH=$(echo "$PM2_SCRIPT_PATH" | sed 's|/apps/web/.*||')
        if [ -n "$EXTRACTED_PATH" ] && [ "$EXTRACTED_PATH" != "$DEPLOY_PATH" ]; then
            log_warning "PM2 路径与配置不一致!"
            log_info "  配置路径: $DEPLOY_PATH"
            log_info "  PM2 路径: $EXTRACTED_PATH"
            log_info "  将使用 PM2 实际路径"
            DEPLOY_PATH="$EXTRACTED_PATH"
        elif [ -n "$EXTRACTED_PATH" ]; then
            log_success "路径验证通过: $DEPLOY_PATH"
        fi
    fi

    # 5. 检查服务器磁盘空间
    log_info "检查服务器磁盘空间..."
    DISK_USAGE=$(ssh_cmd "df -h / | tail -1 | awk '{print \$5}' | tr -d '%'")
    if [ "$DISK_USAGE" -gt 90 ]; then
        log_error "服务器磁盘使用率过高: ${DISK_USAGE}%"
        log_info "请先清理磁盘空间"
        exit 1
    fi
    log_success "磁盘使用率: ${DISK_USAGE}%"

    # 6. 检查是否存在错误路径
    log_info "检查是否存在错误路径..."
    WRONG_PATHS=("/www/vidluxe" "/www/wwwroot/vidluxe")
    for path in "${WRONG_PATHS[@]}"; do
        if ssh_cmd "[ -d '$path' ]" 2>/dev/null; then
            log_warning "发现错误路径: $path"
            read -p "是否删除? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                ssh_cmd "rm -rf '$path'"
                log_success "已删除: $path"
            fi
        fi
    done

    # 7. 最终路径确认
    echo ""
    echo "============================================"
    echo "  📍 部署路径确认"
    echo "============================================"
    echo "  项目根目录: $DEPLOY_PATH"
    echo "  server.js:  $DEPLOY_PATH/apps/web/.next/standalone/apps/web/server.js"
    echo "  静态文件:   $DEPLOY_PATH/apps/web/.next/static/"
    echo "============================================"
    echo ""

    # 验证 server.js 路径格式正确（不应该包含重复的 vidluxe）
    if [[ "$DEPLOY_PATH" == *"/vidluxe/"*"/vidluxe/"* ]]; then
        log_error "检测到路径异常！路径包含重复的 'vidluxe'"
        log_error "请检查 PM2 配置"
        exit 1
    fi

    log_success "预检查完成"
    echo ""
}

# ============================================
# 构建
# ============================================

build() {
    log_info "开始构建..."

    cd "$LOCAL_PROJECT_ROOT"

    # 检查是否需要安装依赖
    if [ ! -d "node_modules" ]; then
        log_info "安装依赖..."
        pnpm install
    fi

    # 构建
    log_info "构建 Web 应用..."
    pnpm --filter=@vidluxe/web build

    if [ ! -d "$LOCAL_NEXT_DIR" ]; then
        log_error "构建失败: .next 目录不存在"
        exit 1
    fi

    log_success "构建完成"
    echo ""
}

# ============================================
# 同步
# ============================================

sync() {
    log_info "开始同步..."

    # 同步 .next 目录（排除用户上传文件和开发缓存）
    log_info "同步 .next 目录到 $DEPLOY_PATH/apps/web/.next/"
    rsync_cmd --delete \
        --exclude 'standalone/apps/web/public/uploads/' \
        --exclude 'cache/webpack/client-development/' \
        --exclude 'cache/webpack/server-development/' \
        --exclude 'cache/webpack/edge-server-development/' \
        "$LOCAL_NEXT_DIR/" \
        "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apps/web/.next/"

    # ⚠️ 关键：Next.js standalone 需要 static 文件在 standalone 目录中
    # https://nextjs.org/docs/pages/api-reference/next-config-js/output
    log_info "复制 static 文件到 standalone 目录..."
    ssh_cmd "mkdir -p $DEPLOY_PATH/apps/web/.next/standalone/apps/web/.next/static && cp -r $DEPLOY_PATH/apps/web/.next/static/* $DEPLOY_PATH/apps/web/.next/standalone/apps/web/.next/static/"

    # 复制 public 文件到 standalone 目录（排除 uploads）
    log_info "复制 public 文件到 standalone 目录..."
    ssh_cmd "mkdir -p $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public && rsync -a --exclude 'uploads' $DEPLOY_PATH/apps/web/public/* $DEPLOY_PATH/apps/web/.next/standalone/apps/web/public/ 2>/dev/null || true"

    log_success "同步完成"
    echo ""
}

# ============================================
# 重启服务
# ============================================

restart() {
    log_info "重启服务..."

    ssh_cmd "pm2 restart vidluxe && sleep 2 && pm2 status vidluxe"

    log_success "服务已重启"
    echo ""
}

# ============================================
# 部署后验证
# ============================================

verify() {
    log_info "执行部署后验证..."

    # 1. 检查服务状态
    log_info "检查服务状态..."
    SERVICE_STATUS=$(ssh_cmd "pm2 jlist" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$SERVICE_STATUS" != "online" ]; then
        log_error "服务状态异常: $SERVICE_STATUS"
        ssh_cmd "pm2 logs vidluxe --lines 20 --nostream"
        exit 1
    fi
    log_success "服务状态: online"

    # 2. 检查 HTTP 响应
    log_info "检查 HTTP 响应..."
    HTTP_CODE=$(ssh_cmd "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo '000'" | tr -d '\n\r')
    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "304" ]; then
        log_warning "HTTP 响应码: $HTTP_CODE (可能服务还在启动中)"
    else
        log_success "HTTP 响应正常: $HTTP_CODE"
    fi

    # 3. 显示最新日志
    log_info "最新日志:"
    ssh_cmd "pm2 logs vidluxe --lines 5 --nostream"

    log_success "验证完成"
    echo ""
}

# ============================================
# 显示帮助
# ============================================

show_help() {
    echo "VidLuxe 部署脚本"
    echo ""
    echo "用法: $0 [options]"
    echo ""
    echo "选项:"
    echo "  --skip-build    跳过本地构建（只同步和重启）"
    echo "  --skip-sync     跳过同步（只重启）"
    echo "  --dry-run       只显示将要执行的命令，不实际执行"
    echo "  --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                  # 完整部署（构建 + 同步 + 重启）"
    echo "  $0 --skip-build     # 跳过构建，只同步和重启"
    echo "  $0 --dry-run        # 预览将要执行的操作"
    echo ""
    echo "部署路径: $DEPLOY_PATH"
    echo ""
}

# ============================================
# 主函数
# ============================================

main() {
    SKIP_BUILD=false
    SKIP_SYNC=false
    DRY_RUN=false

    # 解析参数
    for arg in "$@"; do
        case $arg in
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-sync)
                SKIP_SYNC=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $arg"
                show_help
                exit 1
                ;;
        esac
    done

    echo "============================================"
    echo "  VidLuxe 部署脚本"
    echo "============================================"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] 以下是将要执行的操作:"
        echo "  1. 预检查 (SSH 连接、路径验证、磁盘空间)"
        if [ "$SKIP_BUILD" = false ]; then
            echo "  2. 构建 (pnpm --filter=@vidluxe/web build)"
        fi
        if [ "$SKIP_SYNC" = false ]; then
            echo "  3. 同步 (rsync .next/ -> $DEPLOY_PATH)"
        fi
        echo "  4. 重启 (pm2 restart vidluxe)"
        echo "  5. 验证 (服务状态、HTTP 响应)"
        exit 0
    fi

    # 执行部署流程
    preflight_check

    if [ "$SKIP_BUILD" = false ]; then
        build
    else
        log_info "跳过构建"
    fi

    if [ "$SKIP_SYNC" = false ]; then
        sync
    else
        log_info "跳过同步"
    fi

    restart
    verify

    echo "============================================"
    log_success "🎉 部署完成!"
    echo "============================================"
    echo ""
    echo "访问: https://vidluxe.com.cn"
    echo ""
}

main "$@"
