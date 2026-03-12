# VidLuxe 运维手册

## 📋 日常运维检查清单

### 每日检查（5 分钟）

```bash
# 1. 检查服务状态
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 status"

# 2. 检查健康状态
curl -s https://vidluxe.com.cn/api/health | jq

# 3. 查看错误日志（最近 50 行）
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe --lines 50 --nostream | grep -i error"

# 4. 检查磁盘使用率
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "df -h /"

# 5. 检查内存使用
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "free -h"
```

### 每周检查（15 分钟）

```bash
# 1. 检查备份文件
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "ls -lh /opt/vidluxe/backups/ | tail -10"

# 2. 检查上传文件数量
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "find /opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads -type f | wc -l"

# 3. 查看访问日志统计
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "tail -1000 /var/log/nginx/access.log | awk '{print \$1}' | sort | uniq -c | sort -rn | head -10"

# 4. 检查 SSL 证书有效期
echo | openssl s_client -servername vidluxe.com.cn -connect vidluxe.com.cn:443 2>/dev/null | openssl x509 -noout -dates

# 5. 查看 CDN 缓存命中率
# 登录腾讯云控制台查看
```

### 每月检查（30 分钟）

```bash
# 1. 更新系统包
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "yum update -y"

# 2. 更新 Node.js 依赖（谨慎）
# cd /opt/vidluxe/apps/web && pnpm update

# 3. 审计用户额度数据
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cd /opt/vidluxe/apps/web && node scripts/verify-credits-system.cjs"

# 4. 清理旧日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "find /var/log -name '*.log' -mtime +30 -delete"

# 5. 检查安全更新
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "yum check-update --security"
```

---

## 🚨 故障排查

### 问题 1：网站无法访问

**症状**：浏览器显示「无法访问此网站」

**排查步骤**：

```bash
# 1. 检查服务器是否在线
ping 146.56.193.40

# 2. 检查 Nginx 状态
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "systemctl status nginx"

# 3. 检查 PM2 状态
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 status"

# 4. 检查端口是否监听
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "netstat -tlnp | grep -E '80|443|3000'"

# 5. 查看 Nginx 错误日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "tail -50 /var/log/nginx/error.log"
```

**解决方案**：

```bash
# 重启 Nginx
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "systemctl restart nginx"

# 重启 PM2
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 restart vidluxe"
```

### 问题 2：页面样式丢失

**症状**：页面显示但没有样式，控制台显示 404 错误

**排查步骤**：

```bash
# 1. 检查静态文件是否存在
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "ls -la /opt/vidluxe/apps/web/.next/standalone/apps/web/.next/static/"

# 2. 检查 Nginx 配置
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cat /etc/nginx/conf.d/vidluxe.conf | grep -A3 '_next/static'"

# 3. 测试静态文件访问
curl -I http://146.56.193.40/_next/static/css/xxx.css
```

**解决方案**：

```bash
# 重新部署
cd /Users/weilei/VidLuxe && ./scripts/deploy.sh

# 刷新 CDN 缓存
# 登录腾讯云控制台 → CDN → 缓存刷新
```

### 问题 3：视频上传失败

**症状**：用户上传视频时显示 413 或超时错误

**排查步骤**：

```bash
# 1. 检查 Nginx 配置
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "grep 'client_max_body_size' /etc/nginx/conf.d/*.conf"

# 2. 检查磁盘空间
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "df -h /opt/vidluxe"

# 3. 查看上传日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe --lines 100 | grep -i upload"
```

**解决方案**：

```bash
# 确保 Nginx 配置正确
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cat > /etc/nginx/conf.d/api-vidluxe.conf << 'EOF'
server {
    listen 80;
    server_name api.vidluxe.com.cn;
    client_max_body_size 500m;
    client_body_timeout 300s;
    # ... 其他配置
}
EOF
nginx -t && systemctl reload nginx"
```

### 问题 4：数据库连接失败

**症状**：用户登录或注册失败，显示「Failed to fetch」

**排查步骤**：

```bash
# 1. 测试 Supabase 连接
curl -I https://lklgluxnloqmyelxtpfi.supabase.co/auth/v1/health

# 2. 检查环境变量
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "grep SUPABASE /opt/vidluxe/apps/web/.next/standalone/apps/web/.env.local"

# 3. 查看相关日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe --lines 100 | grep -i supabase"
```

**解决方案**：

```bash
# 重新部署（确保环境变量正确）
cd /Users/weilei/VidLuxe && ./scripts/deploy.sh
```

### 问题 5：额度系统异常

**症状**：用户额度显示不正确或扣除失败

**排查步骤**：

```bash
# 1. 运行健康检查
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cd /opt/vidluxe/apps/web && node scripts/credits-health-check.cjs"

# 2. 审计特定用户
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cd /opt/vidluxe/apps/web && node scripts/audit-user.cjs 932635477@qq.com"

# 3. 查看额度日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe --lines 200 | grep -i credit"
```

**解决方案**：

```bash
# 如果发现数据不一致，可以手动修复
# 详见 /docs/PRODUCTION_CHECKLIST.md
```

---

## 🔄 常用操作

### 部署新版本

```bash
# 1. 在本地测试
cd /Users/weilei/VidLuxe
pnpm dev  # 测试功能

# 2. 构建并部署
pnpm build
./scripts/deploy.sh

# 3. 验证部署
curl -s https://vidluxe.com.cn/api/health | jq

# 4. 刷新 CDN（如果需要）
# 登录腾讯云控制台刷新
```

### 回滚到上一个版本

```bash
# 1. 查看备份
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "ls -lt /opt/vidluxe/backups/"

# 2. 恢复备份（需要手动实现）
# TODO: 创建回滚脚本
```

### 查看实时日志

```bash
# PM2 日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe"

# Nginx 访问日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "tail -f /var/log/nginx/access.log"

# Nginx 错误日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "tail -f /var/log/nginx/error.log"
```

### 重启服务

```bash
# 重启 PM2（优雅重启，不中断服务）
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 reload vidluxe"

# 重启 Nginx
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "systemctl reload nginx"

# 完全重启（会中断服务）
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 restart vidluxe && systemctl restart nginx"
```

### 清理磁盘空间

```bash
# 手动清理上传文件
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "/opt/vidluxe/scripts/cleanup-uploads.sh"

# 清理 PM2 日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 flush"

# 清理系统日志
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "journalctl --vacuum-time=7d"
```

---

## 📊 性能监控

### 关键指标

| 指标 | 正常范围 | 警告阈值 | 危险阈值 |
|------|---------|---------|---------|
| CPU 使用率 | < 50% | 70% | 90% |
| 内存使用率 | < 60% | 80% | 95% |
| 磁盘使用率 | < 70% | 80% | 90% |
| API 响应时间 | < 1s | 2s | 5s |
| 错误率 | < 1% | 5% | 10% |

### 监控命令

```bash
# CPU 和内存
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "top -bn1 | head -20"

# 磁盘 I/O
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "iostat -x 1 5"

# 网络流量
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "iftop -t -s 5"

# PM2 监控
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 monit"
```

---

## 🔐 安全检查

### 定期检查项

```bash
# 1. 检查 SSH 登录记录
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "last -20"

# 2. 检查失败的登录尝试
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "grep 'Failed password' /var/log/secure | tail -20"

# 3. 检查开放端口
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "netstat -tlnp"

# 4. 检查防火墙规则
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "iptables -L -n"

# 5. 检查文件权限
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "ls -la /opt/vidluxe/apps/web/.env.local"
```

---

## 📞 紧急联系方式

### 服务商

- **腾讯云**：95716
- **Supabase**：https://supabase.com/support

### 关键信息

- **服务器 IP**：146.56.193.40
- **SSH Key**：`~/.ssh/id_vidluxe`
- **域名**：vidluxe.com.cn
- **CDN**：腾讯云 CDN
- **数据库**：Supabase

---

## 📚 相关文档

- [生产环境检查清单](./PRODUCTION_CHECKLIST.md)
- [CDN 缓存规则](./CDN_CACHE_RULES.md)
- [部署指南](./DEPLOY_PROGRESS.md)
- [视频模块测试报告](./VIDEO_MODULE_TEST_REPORT.md)

---

**更新时间**: 2026-03-12
**维护人员**: VidLuxe 运维团队
