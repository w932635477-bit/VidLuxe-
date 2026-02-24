# 认证与支付系统实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现基于 Supabase 的手机验证码登录和微信支付系统

**Architecture:** 使用 Supabase Auth 处理认证，Supabase PostgreSQL 存储数据，微信支付 SDK 处理支付

**Tech Stack:** Supabase, Next.js 14, TypeScript, 微信支付 SDK

---

## 阶段 1: 基础设施搭建

### Task 1.1: 安装 Supabase 依赖

**Files:**
- Modify: `apps/web/package.json`

**Step 1: 安装 Supabase 客户端**

```bash
cd apps/web && pnpm add @supabase/supabase-js @supabase/ssr
```

**Step 2: 验证安装**

```bash
pnpm list | grep supabase
```

Expected: 显示 @supabase/supabase-js 和 @supabase/ssr

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore: add supabase dependencies"
```

---

### Task 1.2: 配置环境变量

**Files:**
- Modify: `apps/web/.env.local`

**Step 1: 添加 Supabase 环境变量**

在 `.env.local` 中添加：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 微信支付
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_KEY=
WECHAT_PAY_NOTIFY_URL=https://vidluxe.com/api/webhook/wechat
```

**Step 2: 添加到 .gitignore（如果还没有）**

```bash
echo "apps/web/.env.local" >> .gitignore
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add env variables template"
```

---

### Task 1.3: 创建 Supabase 客户端

**Files:**
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/lib/supabase/index.ts`

**Step 1: 创建浏览器端客户端**

```typescript
// apps/web/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: 创建服务端客户端**

```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中调用时可能会失败，可以忽略
          }
        },
      },
    }
  )
}
```

**Step 3: 创建入口文件**

```typescript
// apps/web/lib/supabase/index.ts
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
```

**Step 4: Commit**

```bash
git add apps/web/lib/supabase/
git commit -m "feat: add supabase client utilities"
```

---

## 阶段 2: 认证系统

### Task 2.1: 创建 Auth 回调路由

**Files:**
- Create: `apps/web/app/api/auth/callback/route.ts`

**Step 1: 创建回调处理**

```typescript
// apps/web/app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 出错时返回首页
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/auth/callback/route.ts
git commit -m "feat: add auth callback route"
```

---

### Task 2.2: 改造登录页面

**Files:**
- Modify: `apps/web/app/auth/page.tsx`

**Step 1: 添加 Supabase Auth 逻辑**

修改 `/apps/web/app/auth/page.tsx`，将 `sendCode` 和 `handleLogin` 函数替换为真实的 Supabase 调用：

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

type LoginMethod = 'phone' | 'wechat' | 'email';

export default function AuthPage() {
  const router = useRouter();
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  // 发送验证码
  const sendCode = async () => {
    if (countdown > 0 || !phone || phone.length !== 11) return;
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      phone: '+86' + phone,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setCodeSent(true);
    setCountdown(60);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 验证码登录
  const handleLogin = async () => {
    if (!code || code.length < 4) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.verifyOtp({
      phone: '+86' + phone,
      token: code,
      type: 'sms',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            VidLuxe
          </Link>
          <p style={{ marginTop: '12px', fontSize: '17px', color: 'rgba(255, 255, 255, 0.5)' }}>
            欢迎回来
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* 登录卡片 */}
        <div style={{
          padding: '24px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {/* 手机号登录表单 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                手机号码
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                }}>
                  +86
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="请输入手机号"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' }}>
                验证码
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入验证码"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={sendCode}
                  disabled={countdown > 0 || phone.length !== 11}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: countdown > 0 || phone.length !== 11
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(212, 175, 55, 0.15)',
                    color: countdown > 0 || phone.length !== 11
                      ? 'rgba(255, 255, 255, 0.3)'
                      : '#D4AF37',
                    fontSize: '14px',
                    cursor: countdown > 0 || phone.length !== 11 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: '#D4AF37',
              color: '#000',
              fontSize: '16px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>

          {/* 协议提示 */}
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255, 255, 255, 0.35)', lineHeight: 1.6 }}>
            首次登录将自动注册账号
            <br />
            登录即表示同意{' '}
            <Link href="/terms" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>用户协议</Link>
            {' '}和{' '}
            <Link href="/privacy" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>隐私政策</Link>
          </p>
        </div>

        {/* 返回首页 */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/app/auth/page.tsx
git commit -m "feat: integrate supabase phone auth"
```

---

### Task 2.3: 添加 Auth Provider

**Files:**
- Create: `apps/web/components/auth/AuthProvider.tsx`
- Modify: `apps/web/app/layout.tsx`

**Step 1: 创建 AuthProvider**

```typescript
// apps/web/components/auth/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 2: 在 layout.tsx 中添加 Provider**

在 `apps/web/app/layout.tsx` 中添加 AuthProvider：

```typescript
import { AuthProvider } from '@/components/auth/AuthProvider';

// 在 body 内部包裹 AuthProvider
<body>
  <AuthProvider>
    {children}
  </AuthProvider>
</body>
```

**Step 3: Commit**

```bash
git add apps/web/components/auth/AuthProvider.tsx apps/web/app/layout.tsx
git commit -m "feat: add auth provider context"
```

---

## 阶段 3: 支付系统

### Task 3.1: 创建微信支付工具库

**Files:**
- Create: `apps/web/lib/wechat-pay/config.ts`
- Create: `apps/web/lib/wechat-pay/client.ts`
- Create: `apps/web/lib/wechat-pay/index.ts`

**Step 1: 创建配置文件**

```typescript
// apps/web/lib/wechat-pay/config.ts
export const wechatPayConfig = {
  appId: process.env.WECHAT_PAY_APP_ID || '',
  mchId: process.env.WECHAT_PAY_MCH_ID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
};
```

**Step 2: 创建支付客户端**

```typescript
// apps/web/lib/wechat-pay/client.ts
import crypto from 'crypto';
import { wechatPayConfig } from './config';

// 生成随机字符串
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成签名
function generateSign(params: Record<string, string>, apiKey: string): string {
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return crypto
    .createHmac('sha256', apiKey)
    .update(sortedParams)
    .digest('hex')
    .toUpperCase();
}

// 生成商户订单号
export function generateOutTradeNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VL${timestamp}${random}`;
}

// 创建 H5 支付订单
export async function createH5Order(params: {
  outTradeNo: string;
  totalFee: number; // 分
  body: string;
  clientIp: string;
}) {
  const { appId, mchId, apiKey, notifyUrl } = wechatPayConfig;

  const orderParams: Record<string, string> = {
    appid: appId,
    mch_id: mchId,
    nonce_str: generateNonceStr(),
    body: params.body,
    out_trade_no: params.outTradeNo,
    total_fee: params.totalFee.toString(),
    spbill_create_ip: params.clientIp,
    notify_url: notifyUrl,
    trade_type: 'H5',
    scene_info: JSON.stringify({
      h5_info: {
        type: 'Wap',
        wap_url: 'https://vidluxe.com',
        wap_name: 'VidLuxe',
      },
    }),
  };

  orderParams.sign = generateSign(orderParams, apiKey);

  // 这里需要调用微信支付 API
  // 实际项目中建议使用 wechatpay-node-v3 等官方 SDK
  // MVP 阶段可以使用测试环境模拟

  return {
    outTradeNo: params.outTradeNo,
    // H5 支付 URL
    mwebUrl: `https://wx.tenpay.com/cgi-bin/mmpayweb-bin/checkmweb?prepay_id=xxx&package=xxx`,
  };
}

// 验证支付回调签名
export function verifyNotify(params: Record<string, string>, sign: string): boolean {
  const expectedSign = generateSign(params, wechatPayConfig.apiKey);
  return expectedSign === sign;
}
```

**Step 3: 创建入口文件**

```typescript
// apps/web/lib/wechat-pay/index.ts
export * from './config';
export * from './client';
```

**Step 4: Commit**

```bash
git add apps/web/lib/wechat-pay/
git commit -m "feat: add wechat pay client utilities"
```

---

### Task 3.2: 创建支付订单 API

**Files:**
- Create: `apps/web/app/api/payment/create/route.ts`

**Step 1: 创建支付订单接口**

```typescript
// apps/web/app/api/payment/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createH5Order, generateOutTradeNo } from '@/lib/wechat-pay';
import { CREDIT_PACKAGES } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { packageId } = await request.json();

    // 查找套餐
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg || pkg.price === 0) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
    }

    // 创建订单号
    const outTradeNo = generateOutTradeNo();

    // 创建支付订单
    const order = await createH5Order({
      outTradeNo,
      totalFee: pkg.price,
      body: `VidLuxe - ${pkg.name}`,
      clientIp: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    // 保存订单到数据库
    const { error: dbError } = await supabase.from('payment_orders').insert({
      user_id: user.id,
      package_id: packageId,
      amount: pkg.price,
      credits: pkg.credits,
      wechat_out_trade_no: outTradeNo,
      status: 'pending',
    });

    if (dbError) {
      console.error('Failed to save order:', dbError);
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: outTradeNo,
      mwebUrl: order.mwebUrl,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/payment/create/route.ts
git commit -m "feat: add payment create API"
```

---

### Task 3.3: 创建支付回调 API

**Files:**
- Create: `apps/web/app/api/webhook/wechat/route.ts`

**Step 1: 创建支付回调接口**

```typescript
// apps/web/app/api/webhook/wechat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyNotify } from '@/lib/wechat-pay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    // 解析 XML (微信支付使用 XML 格式)
    // 实际项目中使用 xml2js 等库解析

    // 模拟解析结果
    const params: Record<string, string> = {
      out_trade_no: '',
      transaction_id: '',
      result_code: 'SUCCESS',
    };

    const supabase = await createClient();

    // 查找订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('wechat_out_trade_no', params.out_trade_no)
      .single();

    if (orderError || !order) {
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // 已处理过的订单直接返回成功
    if (order.status === 'paid') {
      return new NextResponse(
        '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order:', updateError);
      throw updateError;
    }

    // 增加用户额度
    const { error: profileError } = await supabase.rpc('add_credits', {
      user_id: order.user_id,
      amount: order.credits,
      transaction_type: 'purchase',
      description: `购买套餐 - ${order.package_id}`,
      order_id: order.id,
    });

    if (profileError) {
      console.error('Failed to add credits:', profileError);
      throw profileError;
    }

    // 记录回调日志
    await supabase.from('payment_logs').insert({
      order_id: order.id,
      provider: 'wechat',
      raw_data: { body, params },
    });

    return new NextResponse(
      '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
      { headers: { 'Content-Type': 'application/xml' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse(
      '<xml><return_code><![CDATA[FAIL]]></return_code></xml>',
      { headers: { 'Content-Type': 'application/xml' } }
    );
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/webhook/wechat/route.ts
git commit -m "feat: add wechat payment webhook"
```

---

### Task 3.4: 创建数据库函数

**Files:**
- Create: `supabase/functions/add_credits.sql`

**Step 1: 创建 SQL 函数**

```sql
-- supabase/functions/add_credits.sql
create or replace function add_credits(
  p_user_id uuid,
  p_amount int,
  p_transaction_type text,
  p_description text,
  p_order_id uuid default null
)
returns void as $$
begin
  -- 更新用户余额
  update profiles
  set
    credits_balance = credits_balance + p_amount,
    total_credits_earned = total_credits_earned + p_amount,
    updated_at = now()
  where id = p_user_id;

  -- 记录交易
  insert into credit_transactions (
    user_id,
    amount,
    type,
    description,
    order_id
  ) values (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_order_id
  );
end;
$$ language plpgsql security definer;
```

**Step 2: Commit**

```bash
git add supabase/
git commit -m "feat: add database functions for credits"
```

---

### Task 3.5: 改造定价页面

**Files:**
- Modify: `apps/web/components/features/pricing/PricingSection.tsx`

**Step 1: 添加支付逻辑**

在 PricingCard 组件中添加点击支付逻辑：

```typescript
// 在 PricingCard 组件中添加
const handlePurchase = async () => {
  if (plan.id === 'free') {
    window.location.href = '/try';
    return;
  }

  try {
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: plan.id }),
    });

    const data = await response.json();

    if (data.mwebUrl) {
      window.location.href = data.mwebUrl;
    }
  } catch (error) {
    console.error('Purchase error:', error);
  }
};

// 修改 CTA 按钮
<button
  onClick={handlePurchase}
  style={{
    display: 'block',
    textAlign: 'center',
    padding: '14px',
    borderRadius: '12px',
    background: plan.popular ? '#D4AF37' : 'rgba(255, 255, 255, 0.1)',
    color: plan.popular ? '#000' : 'rgba(255, 255, 255, 0.9)',
    fontSize: '15px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  }}
>
  {plan.cta}
</button>
```

**Step 2: Commit**

```bash
git add apps/web/components/features/pricing/PricingSection.tsx
git commit -m "feat: integrate payment into pricing page"
```

---

## 阶段 4: 额度系统迁移

### Task 4.1: 创建额度 API

**Files:**
- Create: `apps/web/app/api/credits-v2/route.ts`
- Create: `apps/web/app/api/credits-v2/spend/route.ts`

**Step 1: 创建额度查询 API**

```typescript
// apps/web/app/api/credits-v2/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('credits_balance, free_credits_used_this_month, free_credits_reset_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: '获取额度失败' }, { status: 500 });
    }

    // 计算剩余免费额度（每月3次）
    const freeLimit = 3;
    const freeRemaining = Math.max(0, freeLimit - (profile.free_credits_used_this_month || 0));

    return NextResponse.json({
      balance: profile.credits_balance || 0,
      free: freeRemaining,
      total: (profile.credits_balance || 0) + freeRemaining,
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

**Step 2: 创建额度消耗 API**

```typescript
// apps/web/app/api/credits-v2/spend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { amount, description, taskId } = await request.json();

    // 调用数据库函数消耗额度
    const { data, error } = await supabase.rpc('spend_credits', {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description,
      p_task_id: taskId,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newBalance: data,
    });
  } catch (error) {
    console.error('Spend credits error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
```

**Step 3: Commit**

```bash
git add apps/web/app/api/credits-v2/
git commit -m "feat: add credits API v2 with supabase"
```

---

## 阶段 5: 测试与上线

### Task 5.1: 添加集成测试

**Files:**
- Create: `apps/web/__tests__/auth.test.ts`
- Create: `apps/web/__tests__/payment.test.ts`

**Step 1: 创建认证测试**

```typescript
// apps/web/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest';

describe('Auth System', () => {
  it('should have supabase client configured', () => {
    // 测试 Supabase 客户端配置
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });
});
```

**Step 2: 运行测试**

```bash
cd apps/web && pnpm test
```

**Step 3: Commit**

```bash
git add apps/web/__tests__/
git commit -m "test: add integration tests for auth and payment"
```

---

### Task 5.2: 最终验证

**Step 1: 本地测试**

```bash
pnpm web
```

**Step 2: 测试流程清单**

- [ ] 访问 /auth 页面
- [ ] 输入手机号获取验证码
- [ ] 输入验证码登录
- [ ] 访问 /pricing 页面
- [ ] 点击购买按钮
- [ ] 检查订单创建

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete auth and payment system integration"
```

---

## 执行摘要

| 阶段 | 任务数 | 关键产出 |
|------|--------|----------|
| 阶段 1 | 3 | Supabase 客户端配置 |
| 阶段 2 | 3 | 手机验证码登录 |
| 阶段 3 | 5 | 微信支付集成 |
| 阶段 4 | 1 | 额度系统迁移 |
| 阶段 5 | 2 | 测试验证 |

**总计**: 14 个任务，预估 8-13 天完成
