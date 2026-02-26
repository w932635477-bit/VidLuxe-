#!/bin/bash
# VidLuxe 部署脚本
# 在服务器上运行此脚本进行部署

set -e

echo "=========================================="
echo "  VidLuxe 部署脚本"
echo "=========================================="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装，请先运行 setup-server.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose 未安装，请先运行 setup-server.sh"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "apps/web/.env.production" ]; then
    log_warn ".env.production 文件不存在，从 .env.example 复制..."
    if [ -f "apps/web/.env.example" ]; then
        cp apps/web/.env.example apps/web/.env.production
        log_warn "请编辑 apps/web/.env.production 填入真实配置"
        exit 1
    else
        log_error ".env.example 文件也不存在，请手动创建 .env.production"
        exit 1
    fi
fi

# 拉取最新代码（如果是 git 仓库）
if [ -d ".git" ]; then
    log_info "拉取最新代码..."
    git pull
fi

# 构建并启动
log_info "构建 Docker 镜像..."
docker-compose build --no-cache

log_info "启动服务..."
docker-compose up -d

# 等待服务启动
log_info "等待服务启动..."
sleep 10

# 检查服务状态
log_info "检查服务状态..."
docker-compose ps

# 健康检查
log_info "执行健康检查..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        log_info "健康检查通过！"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "健康检查失败，请查看日志"
        docker-compose logs --tail=50
        exit 1
    fi
    log_info "等待服务就绪... ($i/30)"
    sleep 2
done

echo ""
log_info "=========================================="
log_info "  部署完成！"
log_info "=========================================="
echo ""
echo "服务状态:"
docker-compose ps
echo ""
echo "访问地址:"
echo "  - HTTP:  http://localhost"
echo "  - HTTPS: https://localhost (需要配置 SSL 证书)"
echo ""
echo "常用命令:"
echo "  - 查看日志: docker-compose logs -f"
echo "  - 重启服务: docker-compose restart"
echo "  - 停止服务: docker-compose down"
echo ""
