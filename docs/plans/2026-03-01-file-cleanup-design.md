# 文件自动清理系统设计

**日期**: 2026-03-01
**状态**: 已批准
**目的**: 解决服务器磁盘空间问题，无需云存储

---

## 背景

- 服务器磁盘：50G，已用 68%，可用 17G
- `uploads/videos` 目录占用 22G
- Cloudflare R2 需要信用卡，不可用

## 用户需求

- 支付方式：微信/支付宝
- 文件保留期：6 小时（用户及时下载后不再需要）
- 使用量：刚上线，不确定

## 方案选择

| 方案 | 月成本 | 选择 |
|------|--------|------|
| 本地存储 + 自动清理 | ¥0 | ✅ 选择 |
| 腾讯云 COS | ~¥5-20 | ❌ |
| 七牛云 Kodo | ~¥0-10 | ❌ |

---

## 系统设计

### 架构

```
┌─────────────────────────────────────────────────────┐
│                    服务器 (腾讯云)                     │
│  ┌─────────────┐    ┌─────────────┐                 │
│  │ /uploads/   │    │  Cron Job   │                 │
│  │  - images/  │◄───│  每2小时执行  │                 │
│  │  - videos/  │    └─────────────┘                 │
│  │  - temp/    │            │                       │
│  └─────────────┘            ▼                       │
│                     删除 >6小时 的文件                │
└─────────────────────────────────────────────────────┘
```

### 清理规则

| 目录 | 清理对象 | 保留时间 |
|------|---------|---------|
| `/uploads/images/` | 原始图片 + 增强结果 | 6 小时 |
| `/uploads/videos/` | 视频帧 + 处理结果 | 6 小时 |
| `/uploads/temp/` | 临时文件 | 2 小时 |

### 实现方式

**Cron Job + Shell 脚本**

- 简单可靠，不依赖应用代码
- 即使应用重启也能正常运行

### 清理脚本

```bash
#!/bin/bash
# /opt/vidluxe/scripts/cleanup-files.sh

# 清理 6 小时前的文件
find /opt/vidluxe/apps/web/public/uploads/images -type f -mmin +360 -delete 2>/dev/null
find /opt/vidluxe/apps/web/public/uploads/videos -type f -mmin +360 -delete 2>/dev/null

# 清理 2 小时前的临时文件
find /opt/vidluxe/apps/web/public/uploads/temp -type f -mmin +120 -delete 2>/dev/null

# 清理空目录
find /opt/vidluxe/apps/web/public/uploads -type d -empty -delete 2>/dev/null

# 记录日志
echo "[$(date)] Cleanup completed" >> /var/log/vidluxe-cleanup.log
```

### Cron 配置

```
# 每 2 小时执行一次清理
0 */2 * * * /opt/vidluxe/scripts/cleanup-files.sh
```

---

## 容量估算

| 场景 | 每天上传 | 磁盘上同时存在 | 是否够用 |
|------|---------|---------------|----------|
| 保守估计 | 1 GB | 0.25 GB | ✅ |
| 中等使用 | 10 GB | 2.5 GB | ✅ |
| 高峰使用 | 50 GB | 12.5 GB | ✅ |

**结论**：即使每天上传 50GB，本地存储也完全够用。

---

## 部署步骤

1. 创建清理脚本文件
2. 添加执行权限
3. 配置 cron 任务
4. 验证清理功能
