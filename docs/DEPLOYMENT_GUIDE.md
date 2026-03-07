# VidLuxe 部署指南

## 📋 目录

1. [快速开始](#快速开始)
2. [部署脚本说明](#部署脚本说明)
3. [自动清理配置](#自动清理配置)
4. [常见问题](#常见问题)

---

## 快速开始

### 日常部署

```bash
# 标准部署（构建 + 同步 + 重启）
./scripts/deploy-optimized.sh

# 快速部署（跳过构建）
./scripts/deploy-optimized.sh --skip-build

# 最快部署（只同步必要文件）
./scripts/deploy-optimized.sh --fast
```

### 服务器清理

```bash
# 手动清理
./scripts/cleanup-server.sh

# 预览清理（不实际执行）
./scripts/cleanup-server.sh --dry-run

# 保留 7 天的文件
./scripts/cleanup-server.sh --days 7
```

---

## 部署脚本说明

### deploy-optimized.sh

**核心优化点：**

| 优化项 | 说明 |
|--------|------|
| **排除 uploads** | 不同步用户上传文件，| **排除缓存** | 不同步开发缓存 |
| **软链接策略** | standalone 中使用软链接指向实际 uploads |
| **增量同步** | rsync 只同步变更的文件 |

**排除规则：**

```bash
--exclude='standalone/apps/web/public/uploads/'  # 用户上传
--exclude='cache/webpack/*-development/'           # 开发缓存
--exclude='*.log'                                   # 日志文件
```

---

## 自动清理配置

### 设置 crontab 定时任务

在服务器上执行：

```bash
# 编辑 crontab
crontab -e
```

添加以下内容：

```cron
# VidLuxe 自动清理任务

# 每天凌晨 3 点清理旧文件（保留 3 天）
0 3 * * * /opt/vidluxe/scripts/auto-cleanup.sh >> /var/log/vidluxe-cleanup.log 2>&1

# 每周日凌晨 4 点清理 Docker
0 4 * * 0 docker system prune -af --volumes >> /var/log/vidluxe-cleanup.log 2>&1

# 每小时检查磁盘空间（超过 90% 发送告警）
0 * * * * /opt/vidluxe/scripts/disk-alert.sh
```

### 创建自动清理脚本

在服务器上创建 `/opt/vidluxe/scripts/auto-cleanup.sh`:

```bash
#!/bin/bash
# 自动清理脚本

KEEP_DAYS=3
DEPLOY_PATH="/opt/vidluxe"

# 清理旧的上传文件
find $DEPLOY_PATH/apps/web/public/uploads -type f -mtime +$KEEP_DAYS -delete

# 清理开发缓存
rm -rf $DEPLOY_PATH/apps/web/.next/cache/webpack/*-development 2>/dev/null

# 清理 PM2 日志
pm2 flush 2>/dev/null

# 记录
echo "$(date): Cleanup completed" >> /var/log/vidluxe-cleanup.log
```

---

## 常见问题

### Q: 磁盘空间不足怎么办？

```bash
# 1. 检查占用
du -sh /opt/vidluxe/apps/web/.next/*

# 2. 手动清理
./scripts/cleanup-server.sh

# 3. 检查是否有重复部署
ls -la /opt/
```

### Q: 部署后 uploads 丢失？

```bash
# 检查软链接
ls -la /opt/vidluxe/apps/web/.next/standalone/apps/web/public/

# 重新创建软链接
ssh root@146.56.193.40 "
  rm -rf /opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads
  ln -sf /opt/vidluxe/apps/web/public/uploads /opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads
"
```

### Q: 部署时间太长？

使用快速模式：
```bash
# 只同步必要文件（约 2-3 分钟）
./scripts/deploy-optimized.sh --fast --skip-build
```

---

## 参考资源

- [Next.js 官方部署文档](https://nextjs.org/docs/app/building-your-application/deploying)
- [rsync 排除规则最佳实践](https://blog.csdn.net/mChales_Liu/article/details/155384335)
- [Linux crontab 定时任务](https://juejin.cn/post/7529865318661963791)
