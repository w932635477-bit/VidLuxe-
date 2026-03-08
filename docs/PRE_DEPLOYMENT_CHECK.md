# VidLuxe 部署前全面检查报告

**检查日期**: 2026-03-08
**检查人**: Claude

---

## 1. 代码状态检查

### 1.1 本地代码状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 未提交更改 | ⚠️ 有 | 25 个文件有改动（主要是删除批量处理模块） |
| 本地领先远程 | ⚠️ 13 个提交 | 需要推送到 GitHub |
| 构建测试 | ✅ 通过 | `pnpm build` 成功 |

### 1.2 生产服务器状态

| 项目 | 状态 | 说明 |
|------|------|------|
| 服务运行 | ✅ 正常 | pm2 管理，运行 19 小时 |
| Git 版本 | ⚠️ 落后 | 服务器落后 13 个提交 |
| macOS 垃圾文件 | ⚠️ 存在 | 大量 `._` 开头的文件需清理 |

### 1.3 关键功能改动（自上次部署以来）

1. **统一额度系统** - 使用 `user_credits` 表
2. **视频模块简化** - 移除视频渲染，只保留图片增强
3. **新增滑动卡片结果** - EnhancedFramesResult 组件
4. **邀请码系统** - 完整实现
5. **删除批量处理** - 移除 ImageBatchFlow

---

## 2. 环境变量检查

### 2.1 本地 `.env.local`

```bash
# 需要注意的配置
NEXT_PUBLIC_BASE_URL=https://vidluxe.com  # ⚠️ 被注释，未生效
WECHAT_PAY_NOTIFY_URL=https://vidluxe.com.cn/api/webhook/wechat  # ✅ 正确
```

### 2.2 生产服务器

- 使用 `.env.local` 代替 `.env.production`
- 需要确认 `NEXT_PUBLIC_BASE_URL` 配置

### 2.3 建议修复

**必须配置**:
```bash
NEXT_PUBLIC_BASE_URL=https://vidluxe.com.cn
```

这影响邀请链接的生成格式。

---

## 3. 数据目录检查

### 3.1 生产服务器数据目录

```
/opt/vidluxe/apps/web/data/
├── credits/     # 积分数据 ✅
├── invite/      # 邀请码数据 ✅
├── quota.json   # 配额数据 ✅
└── tasks.json   # 任务数据 ✅
```

### 3.2 权限

- 所有者: `501:games` (macOS 用户)
- 需要确保 Node 进程有写入权限

---

## 4. 风险评估

### 4.1 高风险项 🔴

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据库迁移 | user_credits 表可能不存在 | 需要运行 Supabase 迁移 |
| 环境变量缺失 | 邀请链接生成错误 | 部署前配置 |
| 服务器数据丢失 | 积分/邀请数据 | 备份后部署 |

### 4.2 中风险项 🟡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| macOS 垃圾文件 | 仓库混乱 | 部署前清理 |
| 构建缓存 | 可能导致问题 | 建议清理 .next 目录 |
| 未提交的本地更改 | 部署不完整 | 提交后部署 |

### 4.3 低风险项 🟢

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| pm2 重启次数多 | 正常现象 | 无需处理 |

---

## 5. 部署计划

### 5.1 部署前准备（本地）

```bash
# 1. 提交所有更改
git add -A
git commit -m "feat: video module simplification and unified credits system"

# 2. 推送到 GitHub
git push origin main

# 3. 备份生产数据
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "tar -czvf /root/vidluxe-data-backup-$(date +%Y%m%d).tar.gz /opt/vidluxe/apps/web/data/"
```

### 5.2 部署步骤（服务器）

```bash
# SSH 连接
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40

# 1. 清理 macOS 垃圾文件
cd /opt/vidluxe
find . -name "._*" -type f -delete

# 2. 拉取最新代码
git fetch origin
git reset --hard origin/main

# 3. 配置环境变量
cat > apps/web/.env.production << 'EOF'
# 复制 .env.local 内容，并确保配置 NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_BASE_URL=https://vidluxe.com.cn
# ... 其他环境变量
EOF

# 4. 安装依赖
pnpm install

# 5. 构建
pnpm build

# 6. 重启服务
pm2 restart vidluxe

# 7. 检查日志
pm2 logs vidluxe --lines 50
```

### 5.3 部署后验证

```bash
# 1. 检查服务状态
pm2 status

# 2. 检查健康接口
curl https://vidluxe.com.cn/api/health

# 3. 检查积分 API
curl "https://vidluxe.com.cn/api/credits?anonymousId=test_$(date +%s)"

# 4. 检查邀请码 API
curl "https://vidluxe.com.cn/api/invite?anonymousId=test_$(date +%s)"
```

---

## 6. 回滚计划

如果部署失败：

```bash
# 1. 回滚到上一个版本
cd /opt/vidluxe
git checkout f4a45fb  # 上一个稳定版本

# 2. 重新构建
pnpm install
pnpm build

# 3. 重启服务
pm2 restart vidluxe

# 4. 恢复数据（如需要）
tar -xzvf /root/vidluxe-data-backup-*.tar.gz -C /
```

---

## 7. 数据库检查清单

### 7.1 Supabase 检查

- [ ] `user_credits` 表存在
- [ ] `credit_transactions` 表存在
- [ ] `spend_user_credits` RPC 函数存在
- [ ] `refund_user_credits` RPC 函数存在

### 7.2 检查命令

在 Supabase SQL Editor 中运行：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('user_credits', 'credit_transactions');

-- 检查 RPC 函数
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name LIKE '%credits%';
```

---

## 8. 建议的部署顺序

1. **先提交本地代码** → 推送到 GitHub
2. **备份数据库** → Supabase 导出
3. **备份服务器数据** → tar 打包
4. **检查 Supabase** → 确认表和函数存在
5. **部署到服务器** → 按步骤执行
6. **验证功能** → 运行 API 测试
7. **监控日志** → 观察 30 分钟

---

*报告生成时间: 2026-03-08*
