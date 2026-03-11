# VidLuxe 额度系统安全审计与最佳实践对比报告

> 生成时间：2026-03-11
> 审计范围：用户额度存储、交易处理、并发控制、审计日志

---

## 📊 与业界最佳实践对比

### 对比参考来源

- [Stripe Ledger 系统设计](https://stripe.com/blog/ledger-stripe-system-for-tracking-and-validating-money-movement)
- [SaaS Credits 工作流最佳实践](https://colorwhistle.com/saas-credits-workflow/)
- [支付系统账本陷阱](https://medium.com/slope-stories/solving-the-five-most-common-pitfalls-from-building-a-payments-ledger-0afe1a6eceae)
- [双花问题解决方案](https://medium.com/codetodeploy/solving-the-double-spend-system-design-patterns-for-bulletproof-fintech-ee5d73f33415)

---

## 🔴 关键差距分析

### 1. 并发控制（最严重）

| 最佳实践 | 当前实现 | 风险等级 |
|---------|---------|----------|
| 数据库行级锁 + 乐观锁版本号 | 登录用户：✅ 有 FOR UPDATE 锁 | 低 |
| 原子性读-改-写操作 | 匿名用户：❌ 读-改-写分离，无锁 | **极高** |
| 事务边界保护 | 匿名用户：❌ 无事务 | **极高** |

**问题代码位置**：`/apps/web/lib/credits/storage.ts:47-52`

```typescript
// 当前实现（不安全）
export function saveUserCredits(credits: UserCredits): void {
  const all = loadAllCredits();  // 1. 读
  all[credits.anonymousId] = credits;  // 2. 改
  saveAllCredits(all);  // 3. 写 - 不是原子操作！
}
```

**并发攻击场景**：
```
时间线 | 请求A | 请求B | 文件状态
-------|--------|--------|----------
T1 | loadAll() -> balance=10 | - | {balance:10}
T2 | - | loadAll() -> balance=10 | {balance:10}
T3 | balance=9, save() | - | {balance:9}
T4 | - | balance=9, save() | {balance:9}
结果 | 消费1次 | 消费1次 | 只扣1次！
```

---

### 2. 幂等性控制

| 最佳实践 | 当前实现 | 风险等级 |
|---------|---------|----------|
| 唯一请求ID去重 | ❌ task_id 未用于去重 | 高 |
| 交易记录唯一约束 | ❌ credit_transactions 无 task_id 唯一约束 | 高 |
| 重试安全 | ❌ 重复请求会重复扣费 | 高 |

**问题代码位置**：`/apps/web/app/api/enhance/route.ts:161`

```typescript
// 当前实现
const { data: spendResult } = await supabase.rpc('spend_user_credits', {
  p_user_id: user.id,
  p_amount: 1,
  p_description: `生成图片`,
  p_task_id: null,  // ❌ 传 null，无法关联任务防重
});
```

---

### 3. 身份验证

| 最佳实践 | 当前实现 | 风险等级 |
|---------|---------|----------|
| 用户身份验证 | 登录用户：✅ Supabase Auth | - |
| API 调用鉴权 | `/api/credits/spend`：❌ 无任何验证 | **极高** |
| JWT 签名验证 | `/api/credits`：❌ 不验证签名 | 中 |

**问题代码位置**：`/apps/web/app/api/credits/spend/route.ts:12-29`

```typescript
// 当前实现（任何人可调用！）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { anonymousId, amount, description } = body;

  // ❌ 没有验证请求来源！
  // ❌ 只要知道 anonymousId 就可以消费他人额度！

  const result = spendCredits({ anonymousId, amount, description });
  return NextResponse.json({ success: true, data: result });
}
```

---

### 4. 审计日志

| 最佳实践 | 当前实现 | 风险等级 |
|---------|---------|----------|
| 不可变交易记录 | ✅ credit_transactions 表 | 良好 |
| 完整上下文记录 | ⚠️ 缺少 request_id、ip、user_agent | 中 |
| 余额验证作业 | ❌ 无定期余额对账 | 中 |

---

### 5. 数据一致性保护

| 最佳实践 | 当前实现 | 风险等级 |
|---------|---------|----------|
| 双重写入问题 | ❌ spendCredits 写两个文件 | 高 |
| 崩溃恢复 | ❌ 无 WAL 或回滚机制 | 高 |
| 余额计算验证 | ❌ 无校验和机制 | 中 |

**问题代码位置**：`/apps/web/lib/credits/manager.ts:115-116`

```typescript
// 当前实现（两次独立写入）
saveUserCredits(credits);              // 写入 1
recordSpendTransaction(anonymousId, transaction);  // 写入 2 - 如果这之间崩溃？
```

---

## 🟢 现有设计优点

### 1. Supabase 登录用户处理良好

✅ 使用 `FOR UPDATE` 行级锁
✅ 在单个 RPC 函数内完成原子操作
✅ 交易记录与余额更新在同一事务

```sql
-- /supabase/migrations/004_spend_user_credits.sql:30-34
SELECT balance, COALESCE(free_credits_used_this_month, 0)
INTO v_balance, v_free_used
FROM user_credits
WHERE user_id = p_user_id
FOR UPDATE;  -- ✅ 正确使用行级锁
```

### 2. Webhook 幂等性设计良好

✅ 使用 webhook_events 表防止重复处理
✅ event_id 唯一约束

---

## 🔧 改进方案

### 优先级 P0：立即修复（数据安全）

#### 1. 废弃 `/api/credits/spend` 端点或添加鉴权

```typescript
// 改进方案：添加签名验证
import { createHmac } from 'crypto';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature');
  const body = await request.text();

  // 验证签名
  const expectedSig = createHmac('sha256', process.env.API_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... 继续处理
}
```

#### 2. 匿名用户迁移到数据库存储

**方案 A**：使用 Supabase 的 anonymous_id 字段

```sql
ALTER TABLE user_credits
ADD COLUMN anonymous_id VARCHAR(64) UNIQUE;

-- 匿名用户也使用相同的 RPC 函数
CREATE OR REPLACE FUNCTION spend_anonymous_credits(
  p_anonymous_id VARCHAR(64),
  p_amount INTEGER,
  p_description TEXT,
  p_task_id TEXT
) ...
```

**方案 B**：如果必须使用文件，添加文件锁

```typescript
import { lockSync, unlockSync } from 'proper-lockfile';

export function spendCredits(request: SpendCreditsRequest): SpendCreditsResult {
  const lockPath = path.join(DATA_DIR, request.anonymousId + '.lock');

  // 获取文件锁
  lockSync(lockPath);

  try {
    // 原子性读写操作
    const credits = getUserCredits(request.anonymousId);
    // ... 扣除逻辑
    saveUserCredits(credits);
  } finally {
    unlockSync(lockPath);
  }
}
```

### 优先级 P1：短期改进（1-2周）

#### 3. 添加 task_id 幂等性控制

```sql
-- 修改 credit_transactions 表
ALTER TABLE credit_transactions
ADD COLUMN task_id VARCHAR(128) UNIQUE;

-- 修改 RPC 函数
CREATE OR REPLACE FUNCTION spend_user_credits(
  p_user_id VARCHAR(128),
  p_amount INTEGER,
  p_description TEXT,
  p_task_id TEXT DEFAULT NULL
) ...
-- 检查 task_id 是否已处理
IF p_task_id IS NOT NULL THEN
  IF EXISTS (SELECT 1 FROM credit_transactions WHERE task_id = p_task_id) THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true, ...);
  END IF;
END IF;
```

#### 4. 添加余额验证作业

```typescript
// scripts/verify-balance-integrity.cjs
async function verifyBalanceIntegrity() {
  // 1. 获取所有用户
  const users = await getAllUsersWithCredits();

  for (const user of users) {
    // 2. 从交易记录计算余额
    const calculatedBalance = await calculateBalanceFromTransactions(user.id);

    // 3. 对比存储余额
    if (user.balance !== calculatedBalance) {
      // 4. 记录差异并发送告警
      await logDiscrepancy(user.id, user.balance, calculatedBalance);
      await sendAlert(user.id, user.balance, calculatedBalance);
    }
  }
}
```

### 优先级 P2：中期改进（1个月内）

#### 5. 完善审计日志

```sql
ALTER TABLE credit_transactions ADD COLUMN (
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(64),
  created_by VARCHAR(64)  -- 'system' | 'user' | 'admin'
);
```

#### 6. 实现双账本验证

```
┌──────────────────┐     ┌──────────────────┐
│   主账本          │     │   审计账本        │
│ (user_credits)   │     │ (credit_audit)   │
├──────────────────┤     ├──────────────────┤
│ user_id          │     │ transaction_id   │
│ balance          │     │ user_id          │
│ version          │     │ amount           │
│ last_verified_at │     │ running_balance  │
└──────────────────┘     │ verified_at      │
                         └──────────────────┘

每笔交易后，同时写入两个账本
定期对比两个账本的 running_balance 总和
```

---

## 📋 检查清单

### 部署前必须验证

- [ ] `/api/credits/spend` 已添加鉴权或已废弃
- [ ] 匿名用户存储已迁移到数据库或添加文件锁
- [ ] credit_transactions 表已添加 task_id 唯一约束
- [ ] enhance API 已传递 task_id 到 RPC 函数
- [ ] 余额验证作业已配置定时执行

### 每日健康检查

```bash
# 运行完整性验证
node scripts/verify-credits-system.cjs

# 检查余额一致性
node scripts/verify-balance-integrity.cjs
```

---

## 📚 参考资料

1. [Stripe Ledger 系统](https://stripe.com/blog/ledger-stripe-system-for-tracking-and-validating-money-movement) - 不可变交易日志
2. [SaaS Credits 工作流](https://colorwhistle.com/saas-credits-workflow/) - 使用量计费架构
3. [支付系统设计陷阱](https://medium.com/slope-stories/solving-the-five-most-common-pitfalls-from-building-a-payments-ledger-0afe1a6eceae) - 常见错误避免
4. [钱包+账本系统设计](https://www.linkedin.com/pulse/designing-wallet-immutable-ledger-system-daniel-cardoso-phwlf) - 余额验证作业

---

## 下一步行动

1. **立即**：关闭或添加鉴权到 `/api/credits/spend`
2. **本周**：为匿名用户添加数据库存储方案
3. **本月**：实现 task_id 幂等性控制和余额验证作业
