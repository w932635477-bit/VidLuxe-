# 认证与支付流程修复方案B - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复登录系统与支付系统的跳转问题，确保用户登录后能正确恢复购买流程。

**Architecture:**
- 使用 sessionStorage 保存购买意图
- 改进 redirect 参数传递完整上下文
- 创建 /checkout 页面作为支付入口
- 统一所有成功跳转到 /try

**Tech Stack:** Next.js 15 App Router, Supabase Auth, React Context

---

## 问题回顾

| 问题 | 原因 | 修复方案 |
|------|------|----------|
| A: 登录状态丢失 | PricingSection未等待loading | 添加loading状态处理 |
| B: 跳转目标错误 | redirect参数是/pricing而非checkout | 传递packageId参数 |
| C: 成功跳转404 | /dashboard页面不存在 | 改为/try |

---

## Task 1: 修改 PricingSection - 添加 loading 状态和改进购买流程

**Files:**
- Modify: `apps/web/components/features/pricing/PricingSection.tsx`

**Step 1: 添加 loading 状态解构**

修改第264行附近：

```typescript
// 修改前
const { user } = useAuth();

// 修改后
const { user, loading: authLoading } = useAuth();
```

**Step 2: 修改 handlePurchase 函数**

修改第271-322行的 handlePurchase 函数：

```typescript
const handlePurchase = async (packageId: string, simulate = false) => {
  // 等待认证加载完成
  if (authLoading) {
    return;
  }

  if (!user) {
    // 保存购买意图到 sessionStorage
    sessionStorage.setItem('purchaseIntent', JSON.stringify({
      packageId,
      timestamp: Date.now()
    }));
    // 跳转到登录，带完整参数
    router.push(`/auth?redirect=/checkout?package=${packageId}`);
    return;
  }

  setLoading(true);
  setPurchasingId(packageId);

  try {
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId,
        userId: user.id,
        simulate
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'PAYMENT_NOT_CONFIGURED') {
        setSelectedPackage(PLANS.find(p => p.id === packageId) || null);
        setShowContactModal(true);
      } else {
        alert(data.error || '购买失败，请重试');
      }
      return;
    }

    // 模拟支付成功
    if (data.simulated) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/try?payment=success');
      }, 2000);
      return;
    }

    // 真实支付 - 跳转到checkout页面
    if (data.order?.id) {
      router.push(`/payment/checkout?orderId=${data.order.id}`);
    } else if (data.codeUrl) {
      // 如果直接返回二维码URL，也跳转到checkout
      router.push(`/payment/checkout?orderId=${data.order?.id || ''}`);
    } else {
      router.push('/try?payment=success');
    }
  } catch (err) {
    console.error('Purchase error:', err);
    alert('网络错误，请重试');
  } finally {
    setLoading(false);
    setPurchasingId(null);
  }
};
```

**Step 3: 在 PricingCard 中添加 authLoading 检查**

修改第234行的 button disabled 条件：

```typescript
// 修改前
disabled={loading && isPurchasing}

// 修改后
disabled={(loading && isPurchasing) || authLoading}
```

**Step 4: 验证修改**

```bash
pnpm web
# 访问 http://localhost:3000/pricing
# 测试未登录时点击购买按钮
```

**Step 5: Commit**

```bash
git add apps/web/components/features/pricing/PricingSection.tsx
git commit -m "fix: handle auth loading state and improve purchase redirect flow"
```

---

## Task 2: 创建 /checkout 页面

**Files:**
- Create: `apps/web/app/checkout/page.tsx`

**Step 1: 创建 checkout 页面**

```typescript
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const packageId = searchParams.get('package');

  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // 登录检查
  useEffect(() => {
    if (!loading && !user) {
      // 保存购买意图
      if (packageId) {
        sessionStorage.setItem('purchaseIntent', JSON.stringify({
          packageId,
          timestamp: Date.now()
        }));
      }
      router.push(`/auth?redirect=/checkout?package=${packageId || ''}`);
    }
  }, [user, loading, router, packageId]);

  // 恢复购买意图
  useEffect(() => {
    if (user && !loading) {
      const savedIntent = sessionStorage.getItem('purchaseIntent');
      if (savedIntent && !packageId) {
        try {
          const { packageId: savedPackageId, timestamp } = JSON.parse(savedIntent);
          // 10分钟内有效
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            router.replace(`/checkout?package=${savedPackageId}`);
          }
          sessionStorage.removeItem('purchaseIntent');
        } catch (e) {
          console.error('Failed to parse purchase intent:', e);
        }
      }
    }
  }, [user, loading, packageId, router]);

  // 创建订单
  useEffect(() => {
    if (user && packageId && !order && !processing) {
      createOrder();
    }
  }, [user, packageId, order, processing]);

  const createOrder = async () => {
    if (!user || !packageId) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'PAYMENT_NOT_CONFIGURED') {
          setError('支付功能暂未开放，请联系客服');
        } else {
          setError(data.error || '创建订单失败');
        }
        return;
      }

      setOrder(data);

      // 如果有订单ID，跳转到支付页面
      if (data.order?.id) {
        router.push(`/payment/checkout?orderId=${data.order.id}`);
      }
    } catch (err) {
      console.error('Create order error:', err);
      setError('网络错误，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 加载中
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录（等待跳转）
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff', padding: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>出错了</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>{error}</p>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#D4AF37',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            返回定价页面
          </Link>
        </div>
      </div>
    );
  }

  // 处理中
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>正在创建订单...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <p>加载中...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
```

**Step 2: 验证页面创建**

```bash
pnpm web
# 访问 http://localhost:3000/checkout?package=medium
# 应该跳转到登录页面（如果未登录）
```

**Step 3: Commit**

```bash
git add apps/web/app/checkout/page.tsx
git commit -m "feat: add checkout page with purchase intent preservation"
```

---

## Task 3: 修改 auth callback 默认跳转

**Files:**
- Modify: `apps/web/app/api/auth/callback/route.ts`

**Step 1: 修改默认跳转目标**

修改第11行：

```typescript
// 修改前
const next = searchParams.get('next') ?? '/dashboard'

// 修改后
const next = searchParams.get('next') ?? '/try'
```

**Step 2: 验证修改**

```bash
# 检查代码
grep -n "next.*dashboard" apps/web/app/api/auth/callback/route.ts
# 应该没有结果
```

**Step 3: Commit**

```bash
git add apps/web/app/api/auth/callback/route.ts
git commit -m "fix: change auth callback default redirect from /dashboard to /try"
```

---

## Task 4: 修改支付结果页面跳转

**Files:**
- Modify: `apps/web/app/payment/result/page.tsx`

**Step 1: 修改"查看订单"按钮**

修改第94行：

```typescript
// 修改前
href="/dashboard"

// 修改后
href="/try"
```

**Step 2: 修改按钮文字**

修改第106-108行：

```typescript
// 修改前
查看订单

// 修改后
返回首页
```

**Step 3: 验证修改**

```bash
grep -n "dashboard" apps/web/app/payment/result/page.tsx
# 应该没有结果
```

**Step 4: Commit**

```bash
git add apps/web/app/payment/result/page.tsx
git commit -m "fix: change payment result page redirect from /dashboard to /try"
```

---

## Task 5: 检查并清理其他 /dashboard 引用

**Files:**
- Check all files for `/dashboard` references

**Step 1: 搜索所有 dashboard 引用**

```bash
grep -rn "/dashboard" apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Step 2: 清理发现的引用**

根据搜索结果逐个修改。

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: remove all /dashboard references"
```

---

## Task 6: 端到端验证

**Step 1: 启动开发服务器**

```bash
pnpm web
```

**Step 2: 测试场景1 - 未登录购买流程**

1. 清除浏览器 cookies（登出状态）
2. 访问 http://localhost:3000/pricing
3. 点击任意付费套餐的"立即购买"
4. 预期：跳转到 /auth?redirect=/checkout?package=xxx
5. 登录
6. 预期：跳转到 /checkout?package=xxx
7. 预期：自动创建订单并跳转到 /payment/checkout

**Step 3: 测试场景2 - 已登录购买流程**

1. 确保已登录
2. 访问 http://localhost:3000/pricing
3. 点击任意付费套餐的"立即购买"
4. 预期：直接创建订单并跳转到 /payment/checkout

**Step 4: 测试场景3 - 支付成功跳转**

1. 在 /payment/result?status=success 页面
2. 点击"查看订单"按钮
3. 预期：跳转到 /try（不是 /dashboard）

**Step 5: 测试场景4 - OAuth 回调**

1. 使用 Google/GitHub OAuth 登录
2. 预期：成功后跳转到 /try（不是 /dashboard）

---

## 预期结果

### 修复前流程（有问题）
```
点击购买 → /auth?redirect=/pricing → 登录 → /pricing → 用户困惑
```

### 修复后流程（正确）
```
点击购买 → /auth?redirect=/checkout?package=xxx → 登录 → /checkout?package=xxx → /payment/checkout
```

---

## 文件修改汇总

| 文件 | 操作 | 改动说明 |
|------|------|----------|
| `components/features/pricing/PricingSection.tsx` | Modify | 添加loading处理，改进redirect |
| `app/checkout/page.tsx` | Create | 新建checkout页面 |
| `app/api/auth/callback/route.ts` | Modify | 默认跳转改为/try |
| `app/payment/result/page.tsx` | Modify | 按钮跳转改为/try |

---

## 回滚方案

如果出现问题，可以回滚：

```bash
git revert HEAD~4  # 回滚最近4个commit
```
