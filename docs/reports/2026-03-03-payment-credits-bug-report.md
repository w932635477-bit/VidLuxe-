# 支付与额度显示问题排查报告

**日期**: 2026-03-03
**严重程度**: 高（影响付费用户的核心功能）
**状态**: 已解决

---

## 问题概述

用户通过微信支付购买了29元的"尝鲜包"（10次额度），支付成功后返回 `/try` 页面，但额度显示仍为8次免费额度，购买的额度未显示。

---

## 问题表现

| 预期行为 | 实际行为 |
|---------|---------|
| 支付成功后显示 18 次额度（10付费+8免费） | 只显示 8 次免费额度 |
| 刷新页面后额度应该正确显示 | 刷新后仍然只显示 8 次 |
| 微信支付回调正常处理 | 回调解密失败 |

---

## 根本原因分析

### 1. 核心问题：两套独立的额度存储系统未同步

系统存在两套独立的额度存储机制：

```
┌─────────────────────────────────────────────────────────────────┐
│                        额度存储架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   匿名用户                        登录用户                       │
│   ┌─────────────────┐            ┌─────────────────┐           │
│   │  文件系统存储    │            │  Supabase 存储   │           │
│   │  /data/credits/ │            │  user_credits   │           │
│   │  credits.json   │            │  表             │           │
│   └────────┬────────┘            └────────┬────────┘           │
│            │                              │                     │
│            ▼                              ▼                     │
│   ┌─────────────────┐            ┌─────────────────┐           │
│   │ 使用 anonymousId │            │ 使用 user_id    │           │
│   │ 作为标识符       │            │ 作为标识符      │           │
│   └─────────────────┘            └─────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**问题所在**：

- 支付系统 (`payment/service.ts`) 将购买的额度写入 Supabase `user_credits` 表
- 前端额度查询 (`/api/credits`) 只查询文件系统存储
- **两套系统没有关联**，导致登录用户支付后看不到购买的额度

### 2. 代码问题定位

**修复前的 `/api/credits/route.ts`**:

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const anonymousId = searchParams.get('anonymousId');

  // ❌ 问题：直接查询文件系统，没有检查用户是否已登录
  const available = getAvailableCredits(anonymousId);
  const userCredits = getOrCreateUserCredits(anonymousId);

  return NextResponse.json({
    success: true,
    data: {
      total: available.total,
      // ...
    }
  });
}
```

**问题**：没有检查 Supabase 会话，直接使用了文件系统存储。

---

## 次要问题

### 2.1 微信支付回调解密错误

**错误日志**:
```
Decrypt notify resource error: SyntaxError: "[object Object]" is not valid JSON
```

**原因**: `wechatpay-node-v3` SDK 的 `decipher_gcm()` 方法返回的是已解析的对象，而非 JSON 字符串。代码尝试对对象调用 `JSON.parse()` 导致错误。

**修复** (`lib/wechat-pay/client.ts`):
```typescript
// 修复前
const decrypted = pay.decipher_gcm(...);
return JSON.parse(decrypted);  // ❌ decrypted 已经是对象

// 修复后
const decrypted = pay.decipher_gcm(...);
if (typeof decrypted === 'string') {
  return JSON.parse(decrypted);
} else if (typeof decrypted === 'object') {
  return decrypted;  // ✅ 直接返回对象
}
```

### 2.2 订单查询不支持 UUID 格式

**问题**: 前端传递 `order.id`（UUID 格式），但后端查询使用 `out_trade_no` 字段。

**修复** (`lib/payment/service.ts`):
```typescript
// 判断是 UUID 还是 out_trade_no
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrOutTradeNo);
const queryField = isUUID ? 'id' : 'out_trade_no';
```

### 2.3 私钥格式问题

**问题**: `.env.local` 中的私钥使用 `\n` 作为换行符占位，但代码没有转换为真正的换行符。

**修复** (`lib/wechat-pay/config.ts`):
```typescript
privateKey: (process.env.WECHAT_PAY_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
```

---

## 修复方案

### 主要修复：增强 `/api/credits` 支持登录用户

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const anonymousId = searchParams.get('anonymousId');

  // ✅ 新增：检查用户是否已登录
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // ✅ 登录用户：从 Supabase 获取额度
    const { data: userCredit } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const balance = userCredit?.balance || 0;
    const freeCredits = 8;

    return NextResponse.json({
      success: true,
      data: {
        total: balance + freeCredits,  // 付费 + 免费
        paid: balance,
        free: freeCredits,
        // ...
      }
    });
  }

  // 匿名用户：继续使用文件系统存储
  const available = getAvailableCredits(anonymousId);
  // ...
}
```

---

## 数据流修复前后对比

### 修复前

```
用户支付 → 微信回调 → 写入 Supabase user_credits
                              ↓
前端查询 → /api/credits → 只查文件系统 → 返回 8 次免费额度 ❌
```

### 修复后

```
用户支付 → 微信回调 → 写入 Supabase user_credits
                              ↓
前端查询 → /api/credits → 检查登录状态
                              ↓
                     已登录 → 查询 Supabase → 返回 28 次 ✅
                     未登录 → 查询文件系统 → 返回免费额度
```

---

## 验证结果

修复后，用户刷新页面，日志显示：

```
[Credits API] Cookie count: 1
[Credits API] Cookie: sb-lklgluxnloqmyelxtpfi-auth-token = base64-...
[Credits API] Auth result: {
  userId: '11e517a9-0d2f-4075-8b4d-53cb34820951',
  email: '932635477@qq.com'
}
[Credits API] User logged in: 11e517a9-0d2f-4075-8b4d-53cb34820951
[Credits API] User credit data: { balance: 20, ... }
[Credits API] Returning logged-in user credits: { balance: 20, freeCredits: 8, total: 28 }
```

前端正确显示：**28 次额度**（20 付费 + 8 免费）

---

## 修改文件清单

| 文件 | 修改内容 |
|------|---------|
| `apps/web/app/api/credits/route.ts` | 增加登录用户检测，从 Supabase 获取额度 |
| `apps/web/lib/wechat-pay/client.ts` | 修复回调解密，处理对象返回值 |
| `apps/web/lib/wechat-pay/config.ts` | 处理私钥 `\n` 转义 |
| `apps/web/lib/payment/service.ts` | 支持订单 UUID 查询 |
| `apps/web/.env.local` | 微信支付配置 |

---

## 经验教训

### 1. 多存储系统需要统一入口

当系统存在多套存储机制时（如匿名用户 vs 登录用户），应该有一个统一的数据访问层，而不是分散在各处。

**建议**:
```typescript
// 统一的额度服务
class CreditsService {
  async getCredits(identity: { userId?: string; anonymousId?: string }) {
    if (identity.userId) {
      return this.getFromSupabase(identity.userId);
    }
    return this.getFromFileSystem(identity.anonymousId);
  }
}
```

### 2. 支付流程需要端到端测试

这次问题在开发环境可能没有发现，因为：
- 开发环境可能没有完整的支付流程
- 匿名用户和登录用户的测试场景分开进行

**建议**: 添加 E2E 测试覆盖完整支付流程

### 3. 调试日志的重要性

添加详细的调试日志对于排查分布式系统问题非常关键：

```typescript
console.log('[Credits API] Cookies:', allCookies.map(c => c.name));
console.log('[Credits API] Auth result:', { userId, email, error });
```

### 4. SDK 返回值类型检查

第三方 SDK 的返回值类型可能与预期不同，需要防御性处理：

```typescript
// 防御性编程
if (typeof result === 'string') {
  return JSON.parse(result);
} else if (typeof result === 'object') {
  return result;
}
```

---

## 后续建议

1. **用户迁移工具**: 为从匿名转为登录的用户提供额度迁移功能
2. **统一存储**: 考虑将匿名用户数据也存储到 Supabase，使用 anonymousId 作为键
3. **监控告警**: 添加支付成功率监控，支付成功但额度未增加时告警
4. **退出登录**: 添加退出登录功能（当前 /auth 页面已登录用户会自动跳转）

---

**报告编写**: Claude
**审核状态**: 待确认
