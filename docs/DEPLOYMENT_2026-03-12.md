# 部署记录 - 2026-03-12

## 部署内容

### 邮箱验证奖励系统

**功能描述**: 引导用户验证邮箱，验证成功后自动发放 5 次免费额度奖励。

**部署时间**: 2026-03-12 21:30

**部署状态**: ✅ 已完成

---

## 新增文件

### API 端点

1. `/apps/web/app/api/auth/send-verification/route.ts`
   - 功能: 发送邮箱验证邮件
   - 权限: 需要登录
   - 响应: 发送状态

2. `/apps/web/app/api/auth/verify-reward/route.ts`
   - 功能: 发放邮箱验证奖励
   - 逻辑: 检查是否已领取，更新额度，记录交易
   - 奖励: 5 次免费额度

### 前端组件

3. `/apps/web/components/auth/EmailVerificationBanner.tsx`
   - 功能: 显示验证提示横幅
   - 样式: 金色渐变，毛玻璃效果
   - 交互: 发送验证邮件，显示成功提示

4. `/apps/web/components/features/try/InviteCard.tsx`
   - 功能: 邀请好友卡片
   - 位置: /try 页面底部

---

## 修改文件

### API 增强

1. `/apps/web/app/api/auth/callback/route.ts`
   - 新增: 验证回调处理
   - 新增: 自动发放奖励逻辑
   - 新增: Cache-Control 头防止 CDN 缓存

### 页面集成

2. `/apps/web/app/try/page.tsx`
   - 新增: EmailVerificationBanner 组件
   - 新增: InviteCard 组件
   - 调整: 底部 padding 适配邀请卡

---

## 数据库变更

### credit_transactions 表

**新增交易类型**: `email_verification_reward`

```sql
-- 示例记录
INSERT INTO credit_transactions (
  user_id,
  type,
  amount,
  balance_after,
  description
) VALUES (
  'user-id',
  'email_verification_reward',
  5,
  balance + 5,
  '邮箱验证奖励'
);
```

**防重复逻辑**: 通过查询 `type = 'email_verification_reward'` 防止重复领取

---

## 部署步骤

### 1. 上传文件

```bash
# 创建目录
ssh root@146.56.193.40 "mkdir -p /opt/vidluxe/apps/web/app/api/auth/{send-verification,verify-reward}"

# 上传新文件
scp apps/web/app/api/auth/send-verification/route.ts root@146.56.193.40:/opt/vidluxe/apps/web/app/api/auth/send-verification/
scp apps/web/app/api/auth/verify-reward/route.ts root@146.56.193.40:/opt/vidluxe/apps/web/app/api/auth/verify-reward/
scp apps/web/components/auth/EmailVerificationBanner.tsx root@146.56.193.40:/opt/vidluxe/apps/web/components/auth/
scp apps/web/components/features/try/InviteCard.tsx root@146.56.193.40:/opt/vidluxe/apps/web/components/features/try/

# 上传修改文件
scp apps/web/app/api/auth/callback/route.ts root@146.56.193.40:/opt/vidluxe/apps/web/app/api/auth/callback/
scp apps/web/app/try/page.tsx root@146.56.193.40:/opt/vidluxe/apps/web/app/try/
```

### 2. 构建应用

```bash
ssh root@146.56.193.40 "cd /opt/vidluxe/apps/web && pnpm build"
```

### 3. 部署静态文件

```bash
ssh root@146.56.193.40 "cd /opt/vidluxe/apps/web && \
  cp -r .next/static .next/standalone/apps/web/.next/ && \
  cp -r public .next/standalone/apps/web/"
```

### 4. 重启服务

```bash
ssh root@146.56.193.40 "cd /opt/vidluxe && pm2 restart vidluxe"
```

---

## 验证测试

### API 端点测试

```bash
# 健康检查
curl https://vidluxe.com.cn/api/health

# 验证邮件 API（需要登录）
curl -X POST https://vidluxe.com.cn/api/auth/send-verification
# 预期响应: {"error":"未登录"}
```

### 自动化测试

```bash
# 完整流程测试
node test-prod-verification.mjs

# 功能测试
node test-email-verification.mjs
```

---

## 功能流程

### 用户视角

1. **注册账号** → 自动登录到 /try
2. **看到验证提示** → 金色横幅显示 "验证邮箱，获得 5 次免费额度 🎁"
3. **发送验证邮件** → 点击按钮，收到邮件
4. **验证邮箱** → 点击邮件链接
5. **获得奖励** → 自动增加 5 次额度，显示成功提示

### 系统流程

```
注册 → 自动登录 → 显示验证横幅
  ↓
点击发送 → /api/auth/send-verification
  ↓
Supabase 发送邮件 → 用户收到邮件
  ↓
点击链接 → /api/auth/callback?verified=true
  ↓
验证成功 → /api/auth/verify-reward
  ↓
发放额度 → 记录交易 → 重定向 /try?verified=success
  ↓
显示成功提示 → 5 秒后消失
```

---

## 配置要求

### 环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://lklgluxnloqmyelxtpfi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# 基础 URL
NEXT_PUBLIC_BASE_URL=https://vidluxe.com.cn
```

### Supabase 设置

- ✅ 邮箱自动确认已启用（mailer_autoconfirm）
- ✅ 邮件重定向 URL: `https://vidluxe.com.cn/api/auth/callback?verified=true`

---

## 监控指标

建议监控以下指标：

- **验证率**: 验证用户数 / 注册用户数
- **发送成功率**: 成功发送邮件数 / 发送请求数
- **验证时长**: 注册到验证的平均时间
- **奖励发放成功率**: 成功发放奖励数 / 验证成功数

---

## 已知问题

### 1. Supabase 邮件限制

- 免费版有邮件发送速率限制
- 建议监控发送失败率
- 必要时升级到付费计划

### 2. 防刷机制

- 每个用户只能领取一次
- 通过 `credit_transactions` 表记录防止重复
- 建议添加 IP 限制防止批量注册

---

## 后续优化

### 短期（1-2 周）

- [ ] 添加邮件模板自定义
- [ ] 优化横幅显示时机
- [ ] 添加验证进度提示

### 中期（1-2 个月）

- [ ] A/B 测试不同奖励金额
- [ ] 添加验证提醒（3 天后再次提示）
- [ ] 统计验证转化率

### 长期（3-6 个月）

- [ ] 多级验证奖励（验证邮箱 +5，绑定手机 +10）
- [ ] 邀请好友验证额外奖励
- [ ] 验证用户专属功能

---

## 相关文档

- [邮箱验证奖励系统详细文档](./EMAIL_VERIFICATION_REWARD.md)
- [部署进度跟踪](./DEPLOY_PROGRESS.md)

---

**部署人员**: Claude Sonnet 4.6
**审核状态**: 待用户测试确认
**回滚方案**: 删除新增文件，恢复修改文件的 git 版本
