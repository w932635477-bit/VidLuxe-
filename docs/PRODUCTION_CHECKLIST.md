# VidLuxe 生产环境优化清单

## ✅ 已完成的工作

### 1. CDN 缓存问题解决
- ✅ HTML 不缓存策略（防止静态资源 404）
- ✅ 静态资源长期缓存（提升性能）
- ✅ Nginx 配置优化

### 2. 视频上传问题解决
- ✅ 创建 `api.vidluxe.com.cn` 子域名（绕过 CDN 200MB 限制）
- ✅ 支持 500MB 视频上传
- ✅ 关键帧提取和显示
- ✅ 完整视频流程测试通过

### 3. 额度系统修复
- ✅ Supabase API Key 配置正确
- ✅ 付费额度优先扣除
- ✅ 任务失败自动退款

---

## 🔧 建议优化项（按优先级排序）

### 优先级 1：关键功能稳定性

#### 1.1 监控和告警系统

**问题**：目前没有监控，无法及时发现故障。

**建议**：
```bash
# 安装 PM2 监控
pm2 install pm2-logrotate  # 日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 配置邮件告警
pm2 install pm2-slack  # 或使用钉钉/企业微信
```

**监控指标**：
- 服务是否在线
- CPU/内存使用率
- API 响应时间
- 错误率

#### 1.2 数据库备份

**问题**：Supabase 数据没有定期备份。

**建议**：
```bash
# 创建备份脚本
cat > /opt/vidluxe/scripts/backup-db.sh << 'EOF'
#!/bin/bash
# 每天备份 Supabase 数据
DATE=$(date +%Y%m%d)
BACKUP_DIR="/opt/vidluxe/backups"
mkdir -p $BACKUP_DIR

# 导出用户额度数据
curl -X GET "https://lklgluxnloqmyelxtpfi.supabase.co/rest/v1/user_credits?select=*" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  > "$BACKUP_DIR/user_credits_$DATE.json"

# 导出交易记录
curl -X GET "https://lklgluxnloqmyelxtpfi.supabase.co/rest/v1/credit_transactions?select=*" \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  > "$BACKUP_DIR/credit_transactions_$DATE.json"

# 保留最近 30 天的备份
find $BACKUP_DIR -name "*.json" -mtime +30 -delete
EOF

chmod +x /opt/vidluxe/scripts/backup-db.sh

# 添加到 crontab（每天凌晨 2 点执行）
echo "0 2 * * * /opt/vidluxe/scripts/backup-db.sh" | crontab -
```

#### 1.3 上传文件清理

**问题**：用户上传的视频和关键帧会一直占用磁盘空间。

**建议**：
```bash
# 创建清理脚本
cat > /opt/vidluxe/scripts/cleanup-uploads.sh << 'EOF'
#!/bin/bash
# 清理 7 天前的上传文件
UPLOAD_DIR="/opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads"

# 清理视频（7天前）
find "$UPLOAD_DIR/videos" -name "*.mp4" -mtime +7 -delete
find "$UPLOAD_DIR/videos" -name "*.mov" -mtime +7 -delete

# 清理关键帧（3天前，因为用户可能需要重新选择）
find "$UPLOAD_DIR/keyframes" -type d -mtime +3 -exec rm -rf {} +

# 清理图片（7天前）
find "$UPLOAD_DIR/images" -name "*.jpg" -mtime +7 -delete
find "$UPLOAD_DIR/images" -name "*.png" -mtime +7 -delete

echo "清理完成: $(date)"
EOF

chmod +x /opt/vidluxe/scripts/cleanup-uploads.sh

# 每天凌晨 3 点执行
echo "0 3 * * * /opt/vidluxe/scripts/cleanup-uploads.sh" | crontab -
```

#### 1.4 错误日志收集

**问题**：错误日志分散，难以追踪问题。

**建议**：
```bash
# 安装 Sentry（可选，免费版每月 5000 个事件）
# 或使用简单的日志聚合

# 创建错误日志监控脚本
cat > /opt/vidluxe/scripts/monitor-errors.sh << 'EOF'
#!/bin/bash
# 检查最近 5 分钟的错误日志
ERROR_COUNT=$(pm2 logs vidluxe --lines 1000 --nostream | grep -i "error" | wc -l)

if [ $ERROR_COUNT -gt 10 ]; then
  echo "警告：最近 5 分钟有 $ERROR_COUNT 个错误"
  # 发送告警（钉钉/企业微信/邮件）
fi
EOF

chmod +x /opt/vidluxe/scripts/monitor-errors.sh

# 每 5 分钟检查一次
echo "*/5 * * * * /opt/vidluxe/scripts/monitor-errors.sh" | crontab -
```

---

### 优先级 2：性能优化

#### 2.1 CDN 配置优化

**当前状态**：主域名使用 CDN，但 POST 请求限制 200MB。

**建议**：
1. **保持当前方案**：`api.vidluxe.com.cn` 不走 CDN（用于上传）
2. **优化 CDN 缓存规则**：
   - 静态资源（图片、CSS、JS）：缓存 1 年
   - HTML：不缓存
   - API 响应：不缓存

**腾讯云 CDN 配置**：
```
缓存规则：
- /_next/static/*  → 缓存 1 年
- /uploads/*       → 缓存 1 天
- /api/*           → 不缓存
- /*.html          → 不缓存
- /                → 不缓存
```

#### 2.2 图片压缩和优化

**问题**：增强后的图片可能很大（3-5MB），下载慢。

**建议**：
```typescript
// 在下载前压缩图片
async function compressImage(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  // 使用 Canvas 压缩
  const img = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // 限制最大尺寸
  const maxSize = 2048;
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
}
```

#### 2.3 数据库查询优化

**建议**：
```sql
-- 为常用查询添加索引
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- 为匿名用户额度添加索引
CREATE INDEX idx_anonymous_id ON user_credits(anonymous_id);
```

---

### 优先级 3：安全性

#### 3.1 API 限流

**问题**：没有限流，可能被恶意刷接口。

**建议**：
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
  const ip = request.ip || 'unknown';
  const now = Date.now();

  // 每分钟最多 20 个请求
  const limit = rateLimit.get(ip);

  if (limit) {
    if (now < limit.resetTime) {
      if (limit.count >= 20) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
      limit.count++;
    } else {
      rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    }
  } else {
    rateLimit.set(ip, { count: 1, resetTime: now + 60000 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 3.2 文件类型验证

**当前状态**：已有基本验证（魔数检测）。

**建议增强**：
```typescript
// 添加病毒扫描（可选）
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function scanFile(filePath: string): Promise<boolean> {
  try {
    // 使用 ClamAV 扫描
    await execAsync(`clamscan --no-summary ${filePath}`);
    return true;
  } catch {
    return false; // 发现病毒
  }
}
```

#### 3.3 环境变量安全

**建议**：
```bash
# 确保 .env.local 权限正确
chmod 600 /opt/vidluxe/apps/web/.env.local
chmod 600 /opt/vidluxe/apps/web/.next/standalone/apps/web/.env.local

# 定期轮换 API Key
# 1. Supabase Service Role Key
# 2. Nano Banana API Key
```

---

### 优先级 4：用户体验

#### 4.1 进度提示优化

**建议**：
```typescript
// 显示更详细的进度信息
const stages = [
  { progress: 0, message: '正在上传视频...' },
  { progress: 20, message: '正在分析视频...' },
  { progress: 40, message: '正在提取关键帧...' },
  { progress: 60, message: '正在增强图片...' },
  { progress: 80, message: '正在生成结果...' },
  { progress: 100, message: '完成！' },
];
```

#### 4.2 错误提示优化

**建议**：
```typescript
// 用户友好的错误提示
const errorMessages: Record<string, string> = {
  'File too large': '视频文件太大，请上传小于 500MB 的视频',
  'Invalid file type': '不支持的文件格式，请上传 MP4、MOV 或 WEBM 格式',
  'Insufficient credits': '额度不足，请充值后再试',
  'Network error': '网络错误，请检查网络连接后重试',
  'API error': 'AI 服务暂时不可用，请稍后再试',
};
```

#### 4.3 加载状态优化

**建议**：
```typescript
// 添加骨架屏
<div className="skeleton-loader">
  <div className="skeleton-image" />
  <div className="skeleton-text" />
</div>
```

---

### 优先级 5：运维自动化

#### 5.1 健康检查

**建议**：
```bash
# 创建健康检查脚本
cat > /opt/vidluxe/scripts/health-check.sh << 'EOF'
#!/bin/bash
# 检查服务健康状态

# 1. 检查 PM2 服务
if ! pm2 status | grep -q "online"; then
  echo "❌ PM2 服务异常"
  pm2 restart vidluxe
fi

# 2. 检查 Nginx
if ! systemctl is-active --quiet nginx; then
  echo "❌ Nginx 服务异常"
  systemctl restart nginx
fi

# 3. 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "⚠️ 磁盘使用率超过 80%: $DISK_USAGE%"
fi

# 4. 检查内存使用
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ $MEM_USAGE -gt 90 ]; then
  echo "⚠️ 内存使用率超过 90%: $MEM_USAGE%"
fi

# 5. 检查 API 响应
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ $HTTP_CODE -ne 200 ]; then
  echo "❌ API 健康检查失败: HTTP $HTTP_CODE"
  pm2 restart vidluxe
fi

echo "✅ 健康检查完成: $(date)"
EOF

chmod +x /opt/vidluxe/scripts/health-check.sh

# 每 5 分钟检查一次
echo "*/5 * * * * /opt/vidluxe/scripts/health-check.sh >> /var/log/vidluxe-health.log 2>&1" | crontab -
```

#### 5.2 自动部署脚本优化

**当前脚本**：`./scripts/deploy.sh`

**建议增强**：
```bash
# 添加回滚功能
cat > /opt/vidluxe/scripts/rollback.sh << 'EOF'
#!/bin/bash
# 回滚到上一个版本

BACKUP_DIR="/opt/vidluxe/backups"
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ 没有找到备份"
  exit 1
fi

echo "回滚到: $LATEST_BACKUP"
# 恢复备份...
EOF
```

#### 5.3 日志管理

**建议**：
```bash
# 配置日志轮转
cat > /etc/logrotate.d/vidluxe << 'EOF'
/root/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    create 0644 root root
}
EOF
```

---

## 📊 监控指标建议

### 关键指标

1. **可用性**
   - 服务在线时间 > 99.9%
   - API 响应时间 < 2s

2. **性能**
   - 视频上传成功率 > 95%
   - 图片生成成功率 > 90%
   - 平均处理时间 < 60s

3. **资源使用**
   - CPU 使用率 < 70%
   - 内存使用率 < 80%
   - 磁盘使用率 < 80%

4. **业务指标**
   - 日活用户数
   - 视频上传量
   - 额度消耗量
   - 付费转化率

---

## 🚀 快速实施计划

### 第 1 天：关键功能稳定性
- [ ] 配置 PM2 日志轮转
- [ ] 创建数据库备份脚本
- [ ] 创建上传文件清理脚本
- [ ] 配置健康检查

### 第 2 天：性能优化
- [ ] 优化 CDN 缓存规则
- [ ] 添加数据库索引
- [ ] 测试并优化 API 响应时间

### 第 3 天：安全性
- [ ] 添加 API 限流
- [ ] 检查环境变量权限
- [ ] 配置防火墙规则

### 第 4 天：监控和告警
- [ ] 配置监控系统
- [ ] 设置告警规则
- [ ] 测试告警通知

---

## 📝 运维检查清单

### 每日检查
- [ ] 查看 PM2 服务状态
- [ ] 检查错误日志
- [ ] 查看磁盘使用率
- [ ] 检查 API 响应时间

### 每周检查
- [ ] 检查备份是否正常
- [ ] 清理旧日志文件
- [ ] 检查安全更新
- [ ] 查看业务数据报表

### 每月检查
- [ ] 更新依赖包
- [ ] 检查 SSL 证书有效期
- [ ] 审计用户额度数据
- [ ] 优化数据库性能

---

## 🔗 相关文档

- [部署指南](./DEPLOY_PROGRESS.md)
- [CDN 缓存解决方案](./CDN_CACHE_SOLUTION.md)
- [视频模块测试报告](./VIDEO_MODULE_TEST_REPORT.md)
- [额度系统维护](../memory/MEMORY.md)

---

**更新时间**: 2026-03-12
**状态**: 生产环境运行中
