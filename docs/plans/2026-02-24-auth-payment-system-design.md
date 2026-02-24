# VidLuxe 认证与支付系统设计文档

> 创建时间：2026-02-24
> 状态：已确认，待实施

## 1. 概述

### 1.1 背景

VidLuxe 是一款 AI 驱动的高级感升级引擎，目标用户是小红书中腰部博主。当前系统已有：
- 额度系统（credits）- 完整的类型定义和管理逻辑
- 邀请系统 - 邀请奖励功能
- 定价页面 - UI 已完成，但支付是 mailto 方式
- 登录页面 - UI 已完成，但只是前端模拟

### 1.2 目标

实现完整的认证和支付系统，使产品能够：
1. 用户可以通过手机验证码登录
2. 用户可以通过微信支付购买额度套餐
3. 支付成功后自动发放额度

### 1.3 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 认证 | Supabase Auth | 内置手机/微信登录，无需自建 |
| 数据库 | Supabase PostgreSQL | 一体化方案，RLS 安全 |
| 支付 | 微信支付官方 SDK | MVP 优先，稳定可靠 |
| 存储 | Supabase Storage | 替代现有文件存储 |

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                          │
│  /auth ─ /dashboard ─ /pricing ─ /try ─ /api/callback           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Next.js API Routes                          │
│  /api/credits ─ /api/payment ─ /api/webhook ─ /api/auth/*       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Supabase     │     │   微信支付       │     │   支付宝         │
│  - Auth       │     │   API           │     │   API (后续)     │
│  - Database   │     │                 │     │                 │
│  - Storage    │     │                 │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

## 3. 认证系统设计

### 3.1 手机验证码登录流程

```
用户输入手机号
      │
      ▼
┌─────────────────┐
│ supabase.auth.  │  Supabase 发送短信
│   signInWithOtp │  (内置短信服务商)
└────────┬────────┘
         │
         ▼
用户输入验证码
         │
         ▼
┌─────────────────┐
│ supabase.auth.  │  验证成功
│   verifyOtp     │  创建/返回用户
└────────┬────────┘
         │
         ▼
跳转到 /dashboard
```

### 3.2 微信扫码登录流程（后续迭代）

```
用户点击微信登录
      │
      ▼
┌─────────────────┐
│ supabase.auth.  │  获取微信 OAuth URL
│ signInWithOAuth │
└────────┬────────┘
         │
         ▼
展示微信二维码
         │
         ▼
用户扫码授权
         │
         ▼
微信回调 → Supabase → /api/auth/callback
         │
         ▼
跳转到 /dashboard
```

### 3.3 前端集成示例

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 手机验证码登录
async function sendOTP(phone: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone: '+86' + phone
  })
  return { error }
}

async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: '+86' + phone,
    token,
    type: 'sms'
  })
  return { data, error }
}
```

## 4. 支付系统设计

### 4.1 微信支付流程

```
用户选择套餐
      │
      ▼
┌─────────────────┐
│ /api/payment/   │
│   create        │  创建微信支付订单
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  微信支付 JSAPI  │  唤起微信支付
│  或 H5 支付      │
└────────┬────────┘
         │
         ▼
用户完成支付
         │
         ▼
┌─────────────────┐
│ /api/webhook/   │  接收微信支付回调
│   wechat        │  更新用户额度
└────────┬────────┘
         │
         ▼
跳转到 /dashboard
```

### 4.2 API 端点设计

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/payment/create` | POST | 创建微信支付订单 |
| `/api/payment/query` | POST | 查询订单状态 |
| `/api/webhook/wechat` | POST | 微信支付回调 |

### 4.3 微信支付前置条件

1. **微信支付商户号**（需要企业资质）
   - 营业执照
   - 组织机构代码证
   - 法人身份证
   - 对公银行账户

2. **申请流程**：
   - 注册微信支付商户平台账号
   - 提交资质审核（约 1-5 个工作日）
   - 绑定结算账户
   - 获取 AppID、MchID、API Key

## 5. 数据库设计

### 5.1 表结构

```sql
-- ============================================
-- 1. 用户资料表（扩展 auth.users）
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,

  -- 基础信息
  phone text unique,
  email text unique,
  wechat_openid text unique,
  wechat_unionid text unique,
  nickname text,
  avatar_url text,

  -- 额度相关
  credits_balance int default 0,
  total_credits_earned int default 0,
  total_credits_spent int default 0,
  free_credits_used_this_month int default 0,
  free_credits_reset_at timestamptz,

  -- 邀请相关
  invite_code text unique default gen_random_uuid(),
  invited_by uuid references profiles(id),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. 额度交易记录表
-- ============================================
create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,

  amount int not null,               -- 正数=获得，负数=消耗
  type text not null,                -- purchase/invite_earned/invite_bonus/free/spend
  description text,

  -- 关联信息
  package_id text,
  order_id uuid references payment_orders(id),
  invite_code text,
  task_id text,                      -- 消耗时的任务 ID

  expires_at timestamptz,            -- 过期时间（邀请额度）
  created_at timestamptz default now(),

  constraint valid_type check (type in ('purchase', 'invite_earned', 'invite_bonus', 'free', 'spend'))
);

-- ============================================
-- 3. 支付订单表
-- ============================================
create table payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,

  -- 订单信息
  package_id text not null,
  amount int not null,               -- 金额（分）
  credits int not null,              -- 购买的额度数量

  -- 微信支付信息
  wechat_prepay_id text,
  wechat_out_trade_no text unique,

  -- 状态
  status text default 'pending',

  created_at timestamptz default now(),
  paid_at timestamptz,

  constraint valid_status check (status in ('pending', 'paid', 'failed', 'refunded'))
);

-- ============================================
-- 4. 支付回调日志表
-- ============================================
create table payment_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references payment_orders(id),
  provider text not null,            -- wechat/alipay
  raw_data jsonb,
  processed_at timestamptz default now()
);

-- ============================================
-- 5. 用户任务表（保留现有的任务系统）
-- ============================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,

  type text not null,
  status text default 'pending',
  input jsonb,
  output jsonb,

  credits_cost int default 1,

  created_at timestamptz default now(),
  completed_at timestamptz
);
```

### 5.2 行级安全策略（RLS）

```sql
-- profiles: 用户只能查看和修改自己的资料
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- credit_transactions: 用户只能查看自己的交易记录
create policy "Users can view own transactions"
  on credit_transactions for select
  using (auth.uid() = user_id);

-- payment_orders: 用户只能查看自己的订单
create policy "Users can view own orders"
  on payment_orders for select
  using (auth.uid() = user_id);
```

### 5.3 触发器

```sql
-- 自动创建用户资料
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, phone, email)
  values (new.id, new.phone, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## 6. MVP 范围

### 6.1 功能范围

| 模块 | MVP 包含 | 后续迭代 |
|------|----------|----------|
| **认证** | ✅ 手机验证码登录 | 微信扫码登录 |
| **支付** | ✅ 微信支付（H5/JSAPI） | 支付宝、退款功能 |
| **额度** | ✅ 查询/购买/消耗 | 额度过期处理、统计面板 |
| **用户** | ✅ 基础资料 | 头像上传、昵称修改 |
| **邀请** | ✅ 邀请奖励 | 邀请统计、排行榜 |

### 6.2 实施阶段

| 阶段 | 内容 | 预估时间 |
|------|------|----------|
| 阶段 1 | 基础设施（Supabase 项目、数据库、环境变量） | 1-2 天 |
| 阶段 2 | 认证系统（手机验证码、Session、登录页面改造） | 2-3 天 |
| 阶段 3 | 支付系统（微信支付 SDK、订单、回调、定价页面） | 3-4 天 |
| 阶段 4 | 额度系统迁移（迁移到 Supabase、API 更新） | 1-2 天 |
| 阶段 5 | 测试与上线（端到端测试、部署） | 1-2 天 |

## 7. 前置条件

### 7.1 需要准备的账号

1. **Supabase 账号**（免费）
   - 注册地址：https://supabase.com
   - 免费额度：50,000 MAU，500MB 数据库，100 条短信/月

2. **微信支付商户号**（需要企业资质）
   - 注册地址：https://pay.weixin.qq.com
   - 所需材料：营业执照、法人身份证、对公银行账户

### 7.2 域名要求

- 需要备案域名（微信支付要求）
- SSL 证书（Supabase 自动提供）

## 8. 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# 微信支付
WECHAT_PAY_APP_ID=xxx
WECHAT_PAY_MCH_ID=xxx
WECHAT_PAY_API_KEY=xxx
WECHAT_PAY_NOTIFY_URL=https://vidluxe.com/api/webhook/wechat
```

## 9. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 微信支付审核慢 | 延迟上线 | 提前准备材料，可先用测试环境开发 |
| Supabase 国内访问慢 | 用户体验差 | 选择 Singapore/Tokyo 区域 |
| 短信额度不够 | 用户无法登录 | 配置阿里云短信作为备用 |

## 10. 后续迭代

1. **支付宝支付** - 覆盖更多用户
2. **微信扫码登录** - 更便捷的登录体验
3. **退款功能** - 支持 7 天无理由退款
4. **额度统计面板** - 用户可查看消费明细
5. **邀请排行榜** - 激励用户邀请
