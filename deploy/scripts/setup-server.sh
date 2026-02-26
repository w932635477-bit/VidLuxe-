#!/bin/bash
# VidLuxe 腾讯云服务器初始化脚本
# 支持 Ubuntu 22.04 / TencentOS Server 4 / CentOS 8+

set -e

echo "=========================================="
echo "  VidLuxe 服务器初始化脚本"
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

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 root 用户或 sudo 运行此脚本"
    exit 1
fi

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    log_info "检测到操作系统: $OS $OS_VERSION"
}

detect_os

# 安装基础工具
install_base_tools() {
    log_info "安装基础工具..."
    case $OS in
        ubuntu|debian)
            apt-get update && apt-get upgrade -y
            apt-get install -y curl wget git vim htop fail2ban certbot python3-certbot-nginx
            ;;
        centos|rhel|tencentos)
            yum install -y epel-release
            yum update -y
            yum install -y curl wget git vim htop fail2ban certbot python3-certbot-nginx
            ;;
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
}

install_base_tools

# 安装 Docker
log_info "安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    log_info "Docker 安装完成"
else
    log_warn "Docker 已安装，跳过..."
fi

# 安装 Docker Compose
log_info "安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_info "Docker Compose 安装完成"
else
    log_warn "Docker Compose 已安装，跳过..."
fi

# 配置防火墙 (firewalld for CentOS/TencentOS, ufw for Ubuntu)
configure_firewall() {
    log_info "配置防火墙..."
    case $OS in
        ubuntu|debian)
            apt-get install -y ufw
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing
            ufw allow 22/tcp
            ufw allow 80/tcp
            ufw allow 443/tcp
            ufw --force enable
            ufw status
            ;;
        centos|rhel|tencentos)
            systemctl enable firewalld
            systemctl start firewalld
            firewall-cmd --permanent --add-port=22/tcp
            firewall-cmd --permanent --add-port=80/tcp
            firewall-cmd --permanent --add-port=443/tcp
            firewall-cmd --reload
            firewall-cmd --list-ports
            ;;
    esac
}

configure_firewall

# 配置 Fail2ban
log_info "配置 Fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/secure
maxretry = 3
EOF

systemctl enable fail2ban
systemctl start fail2ban

# 优化系统参数
log_info "优化系统参数..."
cat >> /etc/sysctl.conf << EOF

# VidLuxe 优化配置
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
EOF

sysctl -p

# 创建应用目录
log_info "创建应用目录..."
mkdir -p /opt/vidluxe
mkdir -p /var/www/certbot

# 创建 SSL 临时证书目录（后续需要替换为真实证书）
mkdir -p /opt/vidluxe/deploy/ssl

# 设置权限
chown -R $SUDO_USER:$SUDO_USER /opt/vidluxe

# 完成
echo ""
log_info "=========================================="
log_info "  服务器初始化完成！"
log_info "=========================================="
echo ""
echo "下一步操作:"
echo "1. 上传项目代码到 /opt/vidluxe"
echo "2. 配置环境变量: cp apps/web/.env.example apps/web/.env.production"
echo "3. 编辑 .env.production 填入真实配置"
echo "4. 运行部署脚本: cd /opt/vidluxe && ./deploy/scripts/deploy.sh"
echo ""
