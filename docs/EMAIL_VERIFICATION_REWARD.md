# 邮箱验证奖励系统

## 📋 功能概述

为了引导用户验证邮箱，同时提供激励，我们实现了"验证邮箱送额度"功能。

## ✨ 功能特性

### 1. 智能提示横幅
- 未验证邮箱的用户在 /try 页面会看到顶部提示横幅
- 横幅内容："验证邮箱，获得 5 次免费额度 🎁"
- 提示用户验证后可以找回密码，还能获得额外奖励

### 2. 一键发送验证邮件
- 点击"发送验证邮件"按钮
- 系统自动发送验证邮件到用户邮箱
- 显示发送状态反馈

### 3. 自动发放奖励
- 用户点击邮件中的验证链接
- 系统自动验证邮箱
- 自动发放 5 次免费额度
- 显示"邮箱验证成功！已获得 5 次免费额度奖励"

### 4. 防重复领取
- 每个用户只能领取一次验证奖励
- 已验证用户不再显示提示横幅

## 🏗️ 技术实现

### API 端点

#### 1. 发送验证邮件
```
POST /api/auth/send-verification
```

**功能**: 发送邮箱验证邮件

**权限**: 需要登录

**响应**:
```json
{
  "success": true,
  "message": "验证邮件已发送，请检查收件箱"
}
```

#### 2. 验证回调
```
GET /api/auth/callback?code=xxx&verified=true
```

**功能**: 处理邮箱验证回调，自动发放奖励

**流程**:
1. 验证 code，建立会话
2. 检查是否是验证回调 (`verified=true`)
3. 调用奖励 API 发放额度
4. 重定向到 `/try?verified=success`

#### 3. 发放奖励
```
POST /api/auth/verify-reward
```

**功能**: 发放邮箱验证奖励

**请求体**:
```json
{
  "userId": "user-id",
  "email": "user@example.com"
}
```

**响应**:
```json
{
  "success": true,
  "amount": 5,
  "message": "恭喜！获得 5 次免费额度"
}
```

**逻辑**:
1. 检查用户是否已领取过奖励
2. 更新 `user_credits` 表，增加 5 次额度
3. 记录交易到 `credit_transactions` 表
4. 防止重复领取

### 前端组件

#### EmailVerificationBanner
位置: `/components/auth/EmailVerificationBanner.tsx`

**功能**:
- 检查用户邮箱验证状态
- 显示验证提示横幅
- 处理发送验证邮件
- 显示验证成功提示

**状态管理**:
- `show`: 是否显示横幅
- `loading`: 发送邮件加载状态
- `message`: 操作反馈消息
- `isVerified`: 邮箱是否已验证
- `showSuccess`: 是否显示成功提示

## 📊 数据库设计

### credit_transactions 表

新增交易类型: `email_verification_reward`

```sql
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

### 防重复逻辑

查询是否已领取:
```sql
SELECT id FROM credit_transactions
WHERE user_id = 'user-id'
  AND type = 'email_verification_reward'
LIMIT 1;
```

## 🎨 用户界面

### 验证提示横幅

**位置**: 页面顶部固定

**样式**:
- 金色渐变背景
- 毛玻璃效果
- 邮件图标 📧
- 礼物图标 🎁

**内容**:
```
验证邮箱，获得 5 次免费额度 🎁
验证后可以找回密码，还能获得额外奖励

[发送验证邮件] [✕]
```

### 验证成功提示

**位置**: 页面顶部固定

**样式**:
- 绿色渐变背景
- 庆祝图标 🎉

**内容**:
```
🎉 邮箱验证成功！
已获得 5 次免费额度奖励
```

**显示时长**: 5 秒后自动消失

## 🔄 完整流程

### 用户视角

1. **注册账号**
   - 填写邮箱和密码
   - 点击"注册"
   - 自动登录，跳转到 /try

2. **看到验证提示**
   - 页面顶部显示金色横幅
   - 提示可以获得 5 次免费额度

3. **发送验证邮件**
   - 点击"发送验证邮件"按钮
   - 看到"验证邮件已发送"提示

4. **验证邮箱**
   - 打开邮箱
   - 点击验证链接
   - 自动跳转回网站

5. **获得奖励**
   - 看到"邮箱验证成功！已获得 5 次免费额度奖励"
   - 额度自动增加 5 次
   - 验证提示横幅消失

### 系统流程

```
注册 → 自动登录 → 显示验证横幅
  ↓
点击发送 → 调用 /api/auth/send-verification
  ↓
Supabase 发送邮件 → 用户收到邮件
  ↓
点击链接 → /api/auth/callback?verified=true
  ↓
验证成功 → 调用 /api/auth/verify-reward
  ↓
发放额度 → 记录交易 → 重定向 /try?verified=success
  ↓
显示成功提示 → 5 秒后消失
```

## 🧪 测试

### 自动化测试

```bash
# 完整流程测试
node test-e2e-verification.mjs

# 功能测试
node test-email-verification.mjs
```

### 手动测试步骤

1. 注册新账号
2. 检查是否显示验证横幅
3. 点击"发送验证邮件"
4. 检查邮箱是否收到邮件
5. 点击邮件中的验证链接
6. 检查是否显示成功提示
7. 检查额度是否增加 5 次

## 📈 监控指标

建议监控以下指标:

- **验证率**: 验证用户数 / 注册用户数
- **发送成功率**: 成功发送邮件数 / 发送请求数
- **验证时长**: 注册到验证的平均时间
- **奖励发放成功率**: 成功发放奖励数 / 验证成功数

## ⚠️ 注意事项

### 1. Supabase 邮件限制

- 免费版有邮件发送速率限制
- 建议监控发送失败率
- 必要时升级到付费计划

### 2. 防刷机制

- 每个用户只能领取一次
- 通过 `credit_transactions` 表记录防止重复
- 建议添加 IP 限制防止批量注册

### 3. 用户体验

- 横幅可以关闭，不强制验证
- 验证是可选的，不影响基本功能
- 奖励作为激励，不是必须

## 🔧 配置

### 环境变量

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx

# 基础 URL
NEXT_PUBLIC_BASE_URL=https://vidluxe.com.cn
```

### 奖励金额

当前设置: 5 次免费额度

修改位置: `/app/api/auth/verify-reward/route.ts`

```typescript
const rewardAmount = 5; // 修改这里
```

## 📝 后续优化

### 短期（1-2 周）

1. 添加邮件模板自定义
2. 优化横幅显示时机
3. 添加验证进度提示

### 中期（1-2 个月）

1. A/B 测试不同奖励金额
2. 添加验证提醒（3 天后再次提示）
3. 统计验证转化率

### 长期（3-6 个月）

1. 多级验证奖励（验证邮箱 +5，绑定手机 +10）
2. 邀请好友验证额外奖励
3. 验证用户专属功能

## 🆘 故障排查

### 问题 1: 横幅不显示

**可能原因**:
- 用户未登录
- 邮箱已验证
- 组件未正确加载

**排查**:
1. 检查用户登录状态
2. 检查 `user.email_confirmed_at` 字段
3. 查看浏览器控制台错误

### 问题 2: 验证邮件未收到

**可能原因**:
- Supabase 速率限制
- 邮箱地址错误
- 邮件进入垃圾箱

**排查**:
1. 检查 API 响应状态
2. 查看服务器日志
3. 检查 Supabase Dashboard

### 问题 3: 奖励未发放

**可能原因**:
- 已经领取过
- 数据库连接失败
- Service Role Key 错误

**排查**:
1. 查询 `credit_transactions` 表
2. 检查服务器日志
3. 验证环境变量配置

## ✅ 部署清单

- [x] 创建 API 端点
- [x] 实现前端组件
- [x] 集成到 /try 页面
- [x] 测试完整流程
- [x] 部署到生产环境
- [x] 编写文档

---

**实现日期**: 2026-03-12
**版本**: 1.0.0
**状态**: ✅ 已完成并部署
