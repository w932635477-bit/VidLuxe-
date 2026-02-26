#!/bin/bash
# VidLuxe 一键部署脚本
# 在腾讯云 WebShell 中执行此脚本

set -e

echo "
╔══════════════════════════════════════════════════════════════╗
║                    VidLuxe 一键部署                          ║
╚══════════════════════════════════════════════════════════════╝
"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# 1. 安装依赖
log_info "安装系统依赖..."
yum install -y epel-release > /dev/null 2>&1
yum install -y curl wget git vim htop > /dev/null 2>&1

# 2. 安装 Docker
if ! command -v docker &> /dev/null; then
    log_info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh > /dev/null 2>&1
    systemctl enable docker > /dev/null 2>&1
    systemctl start docker
    log_info "Docker 安装完成"
else
    log_warn "Docker 已安装"
fi

# 3. 安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_info "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose 2>/dev/null
    chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose 安装完成"
else
    log_warn "Docker Compose 已安装"
fi

# 4. 配置防火墙
log_info "配置防火墙..."
systemctl enable firewalld > /dev/null 2>&1
systemctl start firewalld > /dev/null 2>&1
firewall-cmd --permanent --add-port=22/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=80/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=443/tcp > /dev/null 2>&1
firewall-cmd --reload > /dev/null 2>&1
log_info "防火墙配置完成"

# 5. 创建应用目录
log_info "创建应用目录..."
mkdir -p /opt/vidluxe
cd /opt/vidluxe

# 6. 克隆代码（请替换为你的 Git 仓库地址）
log_info "克隆项目代码..."
if [ -d ".git" ]; then
    log_warn "代码已存在，拉取最新版本..."
    git pull
else
    # 使用当前目录的代码，稍后上传
    log_warn "请稍后上传代码到 /opt/vidluxe"
fi

echo "
╔══════════════════════════════════════════════════════════════╗
║                    初始化完成！                              ║
╚══════════════════════════════════════════════════════════════╝

Docker 版本: $(docker --version)
Docker Compose 版本: $(docker-compose --version)

下一步:
1. 上传项目代码到 /opt/vidluxe
2. 配置环境变量
3. 运行 docker-compose up -d

"
