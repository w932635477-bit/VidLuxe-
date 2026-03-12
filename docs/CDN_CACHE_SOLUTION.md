# CDN 缓存问题彻底解决方案

## 问题描述

每次部署后刷新CDN，页面会出现静态资源404错误，导致页面样式丢失。

## 根本原因

1. **BUILD_ID 变化**：每次构建，Next.js 生成新的 BUILD_ID
2. **静态资源文件名变化**：CSS/JS 文件名包含哈希值，随 BUILD_ID 变化
3. **CDN 缓存旧 HTML**：HTML 被 CDN 缓存，引用旧的静态资源文件名
4. **请求 404**：浏览器请求旧文件名 → 服务器上不存在 → 404

## 解决方案

### 1. Nginx 配置优化（已完成）

**关键配置**：
```nginx
location / {
    # 隐藏 Next.js 的缓存头
    proxy_hide_header Cache-Control;
    proxy_hide_header Expires;

    # 强制 HTML 不缓存
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
}

location /_next/static/ {
    # 静态资源长期缓存（文件名包含哈希，可以安全缓存）
    add_header Cache-Control "public, max-age=31536000, immutable";
}
```

**效果**：
- ✅ HTML 永远不被 CDN 缓存，每次都获取最新版本
- ✅ 静态资源（CSS/JS）长期缓存，提升性能
- ✅ 部署后无需手动刷新 CDN

### 2. 静态文件路径修正（已完成）

**问题**：Nginx 指向错误的静态文件目录

**修复**：
```nginx
# 修改前（错误）
location /_next/static/ {
    alias /opt/vidluxe/apps/web/.next/static/;  # ❌ 空目录
}

# 修改后（正确）
location /_next/static/ {
    alias /opt/vidluxe/apps/web/.next/standalone/apps/web/.next/static/;  # ✅ 正确路径
}
```

### 3. 部署流程优化（已完成）

**部署脚本**：`./scripts/deploy.sh`

**关键步骤**：
1. 本地构建
2. 同步 standalone 到服务器
3. 同步 static 到正确路径
4. 创建 File API polyfill
5. 使用 Node.js 20 启动服务
6. 验证 BUILD_ID 一致性
7. 健康检查

## 使用指南

### 日常部署

```bash
# 标准部署（推荐）
./scripts/deploy.sh

# 优化部署（更快）
./scripts/deploy-optimized.sh
```

### 首次部署后

**如果使用了腾讯云 CDN**，需要手动刷新一次：

1. 登录腾讯云控制台 → CDN → 缓存刷新
2. 选择「URL刷新」，输入：
   - `https://vidluxe.com.cn/`
   - `https://www.vidluxe.com.cn/`
3. 或选择「目录刷新」：
   - `https://vidluxe.com.cn/_next/static/`

**之后的部署**：无需手动刷新 CDN，HTML 不会被缓存

## 验证方法

### 1. 检查缓存头

```bash
# HTML 应该不缓存
curl -I https://vidluxe.com.cn/
# 应该看到：Cache-Control: no-cache, no-store, must-revalidate

# 静态资源应该长期缓存
curl -I https://vidluxe.com.cn/_next/static/css/xxx.css
# 应该看到：Cache-Control: public, max-age=31536000, immutable
```

### 2. 检查静态资源

```bash
# 查看服务器上的静态文件
ssh root@146.56.193.40 "ls -la /opt/vidluxe/apps/web/.next/standalone/apps/web/.next/static/"

# 应该看到 chunks/, css/, media/ 等目录
```

### 3. 浏览器测试

1. 打开开发者工具 → Network
2. 刷新页面
3. 检查所有 `_next/static/` 资源都是 200 状态

## 故障排查

### 问题：静态资源 404

**检查**：
```bash
# 1. 确认文件存在
ssh root@146.56.193.40 "ls /opt/vidluxe/apps/web/.next/standalone/apps/web/.next/static/css/"

# 2. 确认 Nginx 配置正确
ssh root@146.56.193.40 "cat /etc/nginx/conf.d/vidluxe.conf | grep -A3 '_next/static'"

# 3. 测试 Nginx
curl -I http://146.56.193.40/_next/static/css/[实际文件名].css
```

**解决**：
```bash
# 重新部署
./scripts/deploy.sh

# 重启 Nginx
ssh root@146.56.193.40 "systemctl restart nginx"
```

### 问题：页面样式丢失

**原因**：CDN 缓存了旧 HTML

**解决**：
1. 清除浏览器缓存（硬刷新：`Cmd + Shift + R`）
2. 刷新 CDN 缓存（见上文）
3. 等待 5-10 分钟让 CDN 生效

## 技术细节

### 为什么 HTML 不能缓存？

- HTML 包含静态资源的文件名（带哈希）
- 每次部署，哈希值变化
- 如果 HTML 被缓存，会引用旧的文件名 → 404

### 为什么静态资源可以长期缓存？

- 文件名包含内容哈希（如 `84e99d1aca2b7b38.css`）
- 内容变化 → 文件名变化 → 新 URL
- 旧文件可以安全缓存，不会冲突

### Next.js standalone 模式

- `output: 'standalone'` 生成独立部署包
- 静态文件在 `.next/standalone/apps/web/.next/static/`
- 需要手动同步到服务器

## 相关文件

- Nginx 配置：`/etc/nginx/conf.d/vidluxe.conf`
- 部署脚本：`./scripts/deploy.sh`
- PM2 配置：`/opt/vidluxe/ecosystem.config.js`
- 服务器路径：`/opt/vidluxe/apps/web/.next/standalone/`

## 更新日志

- **2026-03-12**：彻底解决 CDN 缓存问题
  - 修复 Nginx 静态文件路径
  - 配置 HTML 不缓存策略
  - 优化部署脚本
