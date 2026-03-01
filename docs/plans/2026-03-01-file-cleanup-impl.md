# 文件自动清理系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在服务器上配置自动清理脚本，每 2 小时删除超过 6 小时的上传文件，解决磁盘空间问题。

**Architecture:** 使用 Linux Cron Job + Shell 脚本，独立于应用运行，简单可靠。

**Tech Stack:** Bash, Cron, find 命令

---

## Task 1: 创建清理脚本

**服务器:** root@146.56.193.40

**Step 1: SSH 连接到服务器**

```bash
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40
```

**Step 2: 创建 scripts 目录**

```bash
mkdir -p /opt/vidluxe/scripts
```

**Step 3: 创建清理脚本**

```bash
cat > /opt/vidluxe/scripts/cleanup-files.sh << 'EOF'
#!/bin/bash
# VidLuxe 文件清理脚本
# 每 2 小时执行，清理超过保留时间的文件

UPLOADS_DIR="/opt/vidluxe/apps/web/public/uploads"
LOG_FILE="/var/log/vidluxe-cleanup.log"

# 记录开始时间
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting cleanup..." >> "$LOG_FILE"

# 清理 6 小时前的图片文件
find "$UPLOADS_DIR/images" -type f -mmin +360 -delete 2>/dev/null
image_count=$(find "$UPLOADS_DIR/images" -type f 2>/dev/null | wc -l)
echo "  Images remaining: $image_count" >> "$LOG_FILE"

# 清理 6 小时前的视频文件
find "$UPLOADS_DIR/videos" -type f -mmin +360 -delete 2>/dev/null
video_count=$(find "$UPLOADS_DIR/videos" -type f 2>/dev/null | wc -l)
echo "  Videos remaining: $video_count" >> "$LOG_FILE"

# 清理 2 小时前的临时文件
find "$UPLOADS_DIR/temp" -type f -mmin +120 -delete 2>/dev/null

# 清理空目录
find "$UPLOADS_DIR" -type d -empty -delete 2>/dev/null

# 记录磁盘使用情况
disk_usage=$(df -h /opt | tail -1 | awk '{print $5}' | tr -d '%')
available=$(df -h /opt | tail -1 | awk '{print $4}')
echo "  Disk usage: ${disk_usage}%, Available: ${available}" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleanup completed" >> "$LOG_FILE"
EOF
```

**Step 4: 添加执行权限**

```bash
chmod +x /opt/vidluxe/scripts/cleanup-files.sh
```

---

## Task 2: 配置 Cron 任务

**Step 1: 添加 cron 任务**

```bash
(crontab -l 2>/dev/null | grep -v "cleanup-files.sh"; echo "0 */2 * * * /opt/vidluxe/scripts/cleanup-files.sh") | crontab -
```

**Step 2: 验证 cron 配置**

```bash
crontab -l
```

Expected output:
```
0 */2 * * * /opt/vidluxe/scripts/cleanup-files.sh
```

---

## Task 3: 手动测试清理脚本

**Step 1: 检查当前磁盘使用**

```bash
df -h /opt
```

**Step 2: 检查 uploads 目录大小**

```bash
du -sh /opt/vidluxe/apps/web/public/uploads/*
```

**Step 3: 执行清理脚本（测试）**

```bash
/opt/vidluxe/scripts/cleanup-files.sh
```

**Step 4: 检查清理日志**

```bash
cat /var/log/vidluxe-cleanup.log
```

**Step 5: 再次检查磁盘使用**

```bash
df -h /opt
```

---

## Task 4: 验证与监控

**Step 1: 确认 cron 服务运行中**

```bash
systemctl status crond
```

Expected: `active (running)`

**Step 2: 设置日志轮转（可选）**

```bash
cat > /etc/logrotate.d/vidluxe-cleanup << 'EOF'
/var/log/vidluxe-cleanup.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
EOF
```

---

## 快速参考命令

```bash
# 手动执行清理
/opt/vidluxe/scripts/cleanup-files.sh

# 查看清理日志
tail -f /var/log/vidluxe-cleanup.log

# 查看磁盘使用
df -h /opt

# 查看 uploads 目录大小
du -sh /opt/vidluxe/apps/web/public/uploads/*

# 查看 cron 任务
crontab -l
```
