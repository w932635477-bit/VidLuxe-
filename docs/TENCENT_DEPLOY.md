# VidLuxe 腾讯云部署指南

## 概述

本指南帮助你将 VidLuxe 部署到腾讯云服务器（CVM）。

---

## 前置要求

1. **腾讯云服务器**
   - 推荐配置：2核4G 或以上
   - 操作系统：Ubuntu 22.04 LTS
   - 安全组开放端口：22（SSH）、80（HTTP）、443（HTTPS）

2. **域名**
   - 已购买域名
   - 已完成 ICP 备案（或备案进行中）

3. **本地开发环境**
   - Git
   - SSH 客户端

---

## 第一步：服务器初始化

### 1.1 SSH 登录服务器

```bash
# 替换为你的服务器 IP
ssh root@your-server-ip
```

### 1.2 上传并运行初始化脚本

方式一：直接下载（如果代码已推送到 GitHub）

```bash
# 创建目录
mkdir -p /opt/vidluxe
cd /opt/vidluxe

# 克隆代码（替换为你的仓库地址）
git clone https://github.com/your-username/vidluxe.git .

# 运行初始化脚本
chmod +x deploy/scripts/setup-server.sh
./deploy/scripts/setup-server.sh
```

方式二：手动复制脚本

```bash
# 在本地电脑执行
scp deploy/scripts/setup-server.sh root@your-server-ip:/root/

# 在服务器执行
ssh root@your-server-ip
chmod +x /root/setup-server.sh
/root/setup-server.sh
```

初始化脚本会自动安装：
- Docker
- Docker Compose
- Nginx
- 防火墙（UFW）
- Fail2ban（安全防护）

---

## 第二步：配置域名解析

在腾讯云 DNS 解析控制台添加记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | @ | 你的服务器 IP |
| A | www | 你的服务器 IP |

---

## 第三步：上传项目代码

### 方式一：Git 克隆（推荐）

```bash
ssh root@your-server-ip
cd /opt/vidluxe
git clone https://github.com/your-username/vidluxe.git .
```

### 方式二：SCP 上传

```bash
# 在本地电脑执行
scp -r . root@your-server-ip:/opt/vidluxe/
```

---

## 第四步：配置环境变量

```bash
ssh root@your-server-ip
cd /opt/vidluxe

# 复制配置模板
cp apps/web/.env.production.example apps/web/.env.production

# 编辑配置
vim apps/web/.env.production
```

**必须配置的环境变量：**

```bash
# 图片生成 API Key（从 evolink.ai 获取）
NANO_BANANA_API_KEY=your-real-api-key

# 你的域名
NEXT_PUBLIC_APP_URL=https://vidluxe.com
```

---

## 第五步：部署应用

```bash
cd /opt/vidluxe
./deploy/scripts/deploy.sh
```

这个脚本会：
1. 构建 Docker 镜像
2. 启动服务
3. 执行健康检查

---

## 第六步：配置 SSL 证书

### 方式一：Let's Encrypt（免费）

```bash
# 申请证书（替换为你的域名）
certbot certonly --webroot -w /var/www/certbot \
  -d vidluxe.com -d www.vidluxe.com

# 复制证书到部署目录
cp /etc/letsencrypt/live/vidluxe.com/fullchain.pem /opt/vidluxe/deploy/ssl/vidluxe.com.pem
cp /etc/letsencrypt/live/vidluxe.com/privkey.pem /opt/vidluxe/deploy/ssl/vidluxe.com.key

# 重启 Nginx
docker-compose restart nginx
```

### 方式二：腾讯云 SSL（推荐国内用户）

1. 登录腾讯云控制台
2. 进入「SSL 证书」服务
3. 申请免费证书（TrustAsia）
4. 下载 Nginx 格式证书
5. 上传到服务器：

```bash
# 上传证书文件
scp vidluxe.com_bundle.crt root@your-server-ip:/opt/vidluxe/deploy/ssl/vidluxe.com.pem
scp vidluxe.com.key root@your-server-ip:/opt/vidluxe/deploy/ssl/vidluxe.com.key

# 重启 Nginx
ssh root@your-server-ip
cd /opt/vidluxe
docker-compose restart nginx
```

---

## 第七步：验证部署

### 检查服务状态

```bash
docker-compose ps
```

### 检查日志

```bash
# 查看所有日志
docker-compose logs -f

# 只看 Web 服务日志
docker-compose logs -f web

# 只看 Nginx 日志
docker-compose logs -f nginx
```

### 健康检查

```bash
# 在服务器上
curl http://localhost:3000/api/health

# 在本地电脑（替换为你的域名）
curl https://vidluxe.com/api/health
```

---

## 常用运维命令

### 更新部署

```bash
cd /opt/vidluxe
git pull
docker-compose build --no-cache
docker-compose up -d
```

### 查看日志

```bash
# 实时日志
docker-compose logs -f

# 最近 100 行
docker-compose logs --tail=100
```

### 重启服务

```bash
docker-compose restart
```

### 停止服务

```bash
docker-compose down
```

### 清理旧镜像

```bash
docker system prune -a
```

---

## 故障排查

### 问题1：无法访问网站

```bash
# 检查防火墙
ufw status

# 检查 Docker 容器
docker-compose ps

# 检查端口监听
netstat -tlnp | grep -E '80|443|3000'
```

### 问题2：SSL 证书问题

```bash
# 检查证书文件
ls -la /opt/vidluxe/deploy/ssl/

# 检查 Nginx 配置
docker-compose exec nginx nginx -t
```

### 问题3：应用报错

```bash
# 查看应用日志
docker-compose logs web --tail=100

# 进入容器调试
docker-compose exec web sh
```

---

## 文件结构

```
/opt/vidluxe/
├── apps/
│   └── web/
│       ├── Dockerfile
│       ├── .env.production     # 生产环境变量
│       └── ...
├── deploy/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       └── vidluxe.conf
│   ├── ssl/
│   │   ├── vidluxe.com.pem     # SSL 证书
│   │   └── vidluxe.com.key
│   ├── scripts/
│   │   ├── setup-server.sh     # 服务器初始化
│   │   └── deploy.sh           # 部署脚本
│   └── logs/
│       └── nginx/
├── docker-compose.yml
└── ...
```

---

## 下一步

- [ ] 完成域名备案
- [ ] 配置 SSL 证书
- [ ] 设置自动备份
- [ ] 配置监控告警
