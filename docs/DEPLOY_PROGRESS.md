# VidLuxe 腾讯云部署进度记录

**更新时间**: 2026-02-28 09:45

---

## 服务器信息

| 项目 | 值 |
|------|-----|
| IP 地址 | 146.56.193.40 |
| 操作系统 | TencentOS Server 4 |
| 配置 | 2核 4GB 1Mbps → 已升级带宽 |
| 域名 | vidluxe.com.cn (备案已通过) |
| SSL 证书 | ✅ Let's Encrypt (有效期至 2026-05-29) |

---

## 已完成

### ✅ 1. SSH 免密登录配置
- 本地密钥: `~/.ssh/id_vidluxe`
- 连接命令: `ssh -i ~/.ssh/id_vidluxe root@146.56.193.40`

### ✅ 2. 服务器环境配置
- Docker 24.0.7 (二进制安装)
- Node.js 20.20.0 (从 18 升级)
- pnpm 10.30.3
- pm2 (进程管理器)
- 防火墙: 已开放 22, 80, 443, 3000

### ✅ 3. 项目部署
- 代码位置: `/opt/vidluxe`
- 依赖安装: 完成
- 项目构建: 完成
- 服务启动: 完成 (pm2 管理)

### ✅ 4. 功能测试（2026-02-27）
- 图片上传 API: ✅ 正常
- AI 升级功能 (Nano Banana API): ✅ 正常
- 评分与反馈系统: ✅ 正常
- 全量页面测试: 5/6 通过 (/about 待创建)
- 全量 API 测试: ✅ 通过
- 四种风格测试: ✅ 全部通过 (magazine/soft/urban/vintage)

### ✅ 5. 性能优化（2026-02-27）
- 图片压缩: hero 11MB→3.6MB, comparisons 38MB→10MB
- 存储优化: 206MB→14MB (清理测试文件)
- CDN 配置: ⏳ 等待域名备案

### ✅ 6. 监控配置（2026-02-27）
- pm2-logrotate: 已安装 (50M 轮转, 保留 7 天, 压缩)
- 开机自启: systemd 服务已启用

### ✅ 7. 代码质量审查（2026-02-27）
- TypeScript: ✅ 无错误
- ESLint: 16 warnings (img 标签优化建议)
- 生产构建: ✅ 成功
- 敏感信息: ✅ 未暴露

### ✅ 8. 环境变量配置
文件: `/opt/vidluxe/apps/web/.env.production`
```
NANO_BANANA_API_KEY=<已配置>
REPLICATE_API_TOKEN=<已配置>
NEXT_PUBLIC_SUPABASE_URL=https://<项目>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<已配置>
SUPABASE_SERVICE_ROLE_KEY=<已配置>
STORAGE_USE_LOCAL=true
NEXT_PUBLIC_APP_URL=https://vidluxe.com.cn
```

### ✅ 9. 域名和 SSL 配置（2026-02-28）
- 域名: vidluxe.com.cn
- DNS 解析: @ → 146.56.193.40, www → 146.56.193.40
- Nginx 反向代理: ✅ 已配置
- SSL 证书: ✅ Let's Encrypt (有效期至 2026-05-29)
- HTTPS 重定向: ✅ 已配置
- 自动续期: ✅ 每天凌晨 3 点检查

---

## 当前访问地址

- **首页**: https://vidluxe.com.cn
- **试试页**: https://vidluxe.com.cn/try
- **健康检查**: https://vidluxe.com.cn/api/health
- **IP 访问**: http://146.56.193.40:3000 (备用)

---

## 待完成

### 🔄 1. CDN 配置
- [ ] 在腾讯云 CDN 控制台添加域名 vidluxe.com.cn
- [ ] 配置缓存规则
- [ ] 更新 DNS CNAME 记录

### 🔄 2. 页面完善
- [ ] 创建 /about 页面 (当前 404)

### 🔄 3. 代码优化（可选）
- [ ] 将 `<img>` 替换为 Next.js `<Image>` 组件
- [ ] 修复 React Hook 依赖警告

---

## 常用命令

```bash
# SSH 连接
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40

# 查看服务状态
pm2 status

# 查看日志
pm2 logs vidluxe

# 重启服务
pm2 restart vidluxe

# 更新代码后重新部署
cd /opt/vidluxe
git pull
pnpm install
pnpm build
pm2 restart vidluxe
```

---

## 已知问题

1. **图片加载**: 已优化，压缩后加载时间约 600ms
2. **/about 页面**: 待创建

---

## 腾讯云控制台信息

- 登录地址: https://cloud.tencent.com/login/subAccount/100045809194
- 用户名: vidluxe
- 实例 ID: ins-o10viqh2
- 区域: 南京一区
