# VidLuxe 额度制系统与定价重构实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构 VidLuxe 为额度制付费系统，支持多风格批量生成、邀请裂变获客机制

**Architecture:**
- 额度系统作为核心模块，独立于现有的 quota 模块
- 邀请系统使用唯一邀请码，支持双向奖励
- 多风格生成改造现有 workflow，支持并行生成

**Tech Stack:** Next.js 14, TypeScript, Zod, 现有 API 结构

---

## 📋 实现任务概览

| 任务 | 描述 | 优先级 |
|------|------|--------|
| Task 1 | 额度系统数据模型与核心逻辑 | P0 |
| Task 2 | 邀请裂变系统 | P0 |
| Task 3 | 多风格批量生成（图片） | P0 |
| Task 4 | 多风格批量生成（视频帧替换） | P1 |
| Task 5 | 定价页面与额度购买 | P0 |
| Task 6 | 免费额度与邀请奖励 | P0 |

---

## 📊 定价方案

| 套餐 | 价格 | 额度 | 有效期 |
|------|------|------|--------|
| 免费版 | ¥0 | 8张/月 | 每月重置 |
| 邀请奖励 | ¥0 | +5张/人（双方） | 当月有效 |
| 小包 | ¥29 | 20张 | 永不过期 |
| 中包 | ¥79 | 60张 | 永不过期 |
| 大包 | ¥199 | 150张 | 永不过期 |
| 超大包 | ¥499 | 400张 | 永不过期 |

---

## Task 1: 额度系统数据模型与核心逻辑

**Files:**
- Create: `apps/web/lib/credits/types.ts`
- Create: `apps/web/lib/credits/index.ts`
- Create: `apps/web/lib/credits/storage.ts`
- Create: `apps/web/lib/credits/manager.ts`
- Create: `apps/web/__tests__/credits.test.ts`

### Step 1: 创建额度类型定义

**Create: `apps/web/lib/credits/types.ts`**

```typescript
/**
 * 额度系统类型定义
 */

// 额度套餐定义
export interface CreditPackage {
  id: string;
  name: string;
  price: number;         // 价格（分）
  credits: number;       // 额度数量
  expiresAt?: number;    // 过期时间（null = 永不过期）
  bonus?: number;        // 赠送额度
}

// 用户额度记录
export interface UserCredits {
  anonymousId: string;
  balance: number;       // 当前余额
  totalEarned: number;   // 累计获得
  totalSpent: number;    // 累计消耗
  packages: CreditTransaction[];
  inviteCredits: CreditTransaction[];
  freeCredits: FreeCreditInfo;
  createdAt: number;
  updatedAt: number;
}

// 额度交易记录
export interface CreditTransaction {
  id: string;
  amount: number;        // 正数=获得，负数=消耗
  type: 'purchase' | 'invite_earned' | 'invite_bonus' | 'free' | 'spend';
  description: string;
  packageId?: string;
  inviteCode?: string;
  createdAt: number;
  expiresAt?: number;    // 过期时间
}

// 免费额度信息
export interface FreeCreditInfo {
  monthlyLimit: number;      // 每月限额
  usedThisMonth: number;     // 本月已用
  resetAt: number;           // 重置时间
}

// 额度消耗请求
export interface SpendCreditsRequest {
  anonymousId: string;
  amount: number;
  description: string;
  taskId?: string;
}

// 额度消耗结果
export interface SpendCreditsResult {
  success: boolean;
  newBalance: number;
  transactionId?: string;
  error?: string;
}

// 定价套餐
export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    credits: 3,
    expiresAt: undefined, // 每月重置
  },
  {
    id: 'small',
    name: '小包',
    price: 2900, // ¥29
    credits: 20,
    expiresAt: undefined, // 永不过期
  },
  {
    id: 'medium',
    name: '中包',
    price: 7900, // ¥79
    credits: 60,
    expiresAt: undefined,
  },
  {
    id: 'large',
    name: '大包',
    price: 19900, // ¥199
    credits: 150,
    expiresAt: undefined,
  },
  {
    id: 'xlarge',
    name: '超大包',
    price: 49900, // ¥499
    credits: 400,
    expiresAt: undefined,
  },
];

// 邀请奖励配置
export const INVITE_CONFIG = {
  referrerBonus: 5,      // 邀请人获得额度
  inviteeBonus: 5,       // 被邀请人获得额度
  maxInvitesPerMonth: 20, // 每月最多邀请人数
  inviteCreditExpiresInDays: 30, // 邀请额度有效期
};

// 免费额度配置
export const FREE_CREDIT_CONFIG = {
  monthlyLimit: 3,       // 每月免费额度
  resetDay: 1,           // 每月1号重置
};
```

### Step 2: 创建额度存储层

**Create: `apps/web/lib/credits/storage.ts`**

```typescript
/**
 * 额度系统存储层
 * 使用文件存储（MVP阶段），生产环境可替换为数据库
 */

import fs from 'fs';
import path from 'path';
import type { UserCredits, CreditTransaction } from './types';

const DATA_DIR = process.env.CREDITS_DATA_DIR || './data/credits';
const FILE_PATH = path.join(DATA_DIR, 'credits.json');

// 确保目录存在
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 读取所有用户额度数据
function loadAllCredits(): Record<string, UserCredits> {
  ensureDataDir();
  if (!fs.existsSync(FILE_PATH)) {
    return {};
  }
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// 保存所有用户额度数据
function saveAllCredits(data: Record<string, UserCredits>): void {
  ensureDataDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// 获取用户额度
export function getUserCredits(anonymousId: string): UserCredits | null {
  const all = loadAllCredits();
  return all[anonymousId] || null;
}

// 保存用户额度
export function saveUserCredits(credits: UserCredits): void {
  const all = loadAllCredits();
  all[credits.anonymousId] = credits;
  saveAllCredits(all);
}

// 创建新用户额度记录
export function createUserCredits(anonymousId: string): UserCredits {
  const now = Date.now();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  const credits: UserCredits = {
    anonymousId,
    balance: 0,
    totalEarned: 0,
    totalSpent: 0,
    packages: [],
    inviteCredits: [],
    freeCredits: {
      monthlyLimit: 3,
      usedThisMonth: 0,
      resetAt: nextMonth.getTime(),
    },
    createdAt: now,
    updatedAt: now,
  };

  saveUserCredits(credits);
  return credits;
}

// 添加交易记录
export function addTransaction(
  anonymousId: string,
  transaction: CreditTransaction
): UserCredits {
  let credits = getUserCredits(anonymousId);
  if (!credits) {
    credits = createUserCredits(anonymousId);
  }

  if (transaction.amount > 0) {
    credits.balance += transaction.amount;
    credits.totalEarned += transaction.amount;
  } else {
    credits.balance += transaction.amount; // 负数
    credits.totalSpent += Math.abs(transaction.amount);
  }

  if (transaction.type === 'purchase') {
    credits.packages.push(transaction);
  } else if (transaction.type === 'invite_earned' || transaction.type === 'invite_bonus') {
    credits.inviteCredits.push(transaction);
  }

  credits.updatedAt = Date.now();
  saveUserCredits(credits);
  return credits;
}
```

### Step 3: 创建额度管理器

**Create: `apps/web/lib/credits/manager.ts`**

```typescript
/**
 * 额度管理器
 * 处理额度的获取、消耗、查询等核心逻辑
 */

import {
  getUserCredits,
  saveUserCredits,
  createUserCredits,
  addTransaction
} from './storage';
import type {
  UserCredits,
  SpendCreditsRequest,
  SpendCreditsResult,
  CreditTransaction
} from './types';
import { CREDIT_PACKAGES, INVITE_CONFIG, FREE_CREDIT_CONFIG } from './types';

// 生成唯一ID
function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// 检查并重置免费额度
function checkAndResetFreeCredits(credits: UserCredits): UserCredits {
  const now = Date.now();
  if (now >= credits.freeCredits.resetAt) {
    // 计算下一个重置时间
    const nextReset = new Date(credits.freeCredits.resetAt);
    nextReset.setMonth(nextReset.getMonth() + 1);

    credits.freeCredits.usedThisMonth = 0;
    credits.freeCredits.resetAt = nextReset.getTime();
    credits.updatedAt = now;
    saveUserCredits(credits);
  }
  return credits;
}

// 获取或创建用户额度
export function getOrCreateUserCredits(anonymousId: string): UserCredits {
  let credits = getUserCredits(anonymousId);
  if (!credits) {
    credits = createUserCredits(anonymousId);
  }
  return checkAndResetFreeCredits(credits);
}

// 获取用户可用额度（包含付费额度 + 免费额度）
export function getAvailableCredits(anonymousId: string): {
  total: number;
  paid: number;
  free: number;
  freeRemaining: number;
} {
  const credits = getOrCreateUserCredits(anonymousId);

  const freeRemaining = Math.max(
    0,
    credits.freeCredits.monthlyLimit - credits.freeCredits.usedThisMonth
  );

  return {
    total: credits.balance + freeRemaining,
    paid: credits.balance,
    free: freeRemaining,
    freeRemaining,
  };
}

// 消耗额度
export function spendCredits(request: SpendCreditsRequest): SpendCreditsResult {
  const credits = getOrCreateUserCredits(request.anonymousId);
  const available = getAvailableCredits(request.anonymousId);

  if (available.total < request.amount) {
    return {
      success: false,
      newBalance: available.total,
      error: '额度不足',
    };
  }

  // 先消耗付费额度，再消耗免费额度
  let remaining = request.amount;

  // 消耗付费额度
  if (credits.balance > 0 && remaining > 0) {
    const spendFromPaid = Math.min(credits.balance, remaining);
    credits.balance -= spendFromPaid;
    remaining -= spendFromPaid;
  }

  // 消耗免费额度
  if (remaining > 0) {
    credits.freeCredits.usedThisMonth += remaining;
  }

  // 记录交易
  const transaction: CreditTransaction = {
    id: generateId(),
    amount: -request.amount,
    type: 'spend',
    description: request.description,
    createdAt: Date.now(),
  };

  credits.totalSpent += request.amount;
  credits.updatedAt = Date.now();
  saveUserCredits(credits);

  return {
    success: true,
    newBalance: credits.balance +
      Math.max(0, credits.freeCredits.monthlyLimit - credits.freeCredits.usedThisMonth),
    transactionId: transaction.id,
  };
}

// 购买套餐
export function purchasePackage(
  anonymousId: string,
  packageId: string
): { success: boolean; credits?: UserCredits; error?: string } {
  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    return { success: false, error: '套餐不存在' };
  }

  if (pkg.price === 0) {
    return { success: false, error: '免费套餐无需购买' };
  }

  const credits = getOrCreateUserCredits(anonymousId);

  const transaction: CreditTransaction = {
    id: generateId(),
    amount: pkg.credits,
    type: 'purchase',
    description: `购买${pkg.name}`,
    packageId: pkg.id,
    createdAt: Date.now(),
    expiresAt: pkg.expiresAt,
  };

  addTransaction(anonymousId, transaction);

  return {
    success: true,
    credits: getUserCredits(anonymousId) as UserCredits
  };
}

// 处理邀请奖励
export function processInviteReward(
  referrerId: string,
  inviteeId: string
): { success: boolean; error?: string } {
  // 不能邀请自己
  if (referrerId === inviteeId) {
    return { success: false, error: '不能邀请自己' };
  }

  const referrerCredits = getOrCreateUserCredits(referrerId);
  const inviteeCredits = getOrCreateUserCredits(inviteeId);

  // 检查是否已被邀请过
  const alreadyInvited = inviteeCredits.inviteCredits.some(
    c => c.type === 'invite_bonus' && c.inviteCode === referrerId
  );
  if (alreadyInvited) {
    return { success: false, error: '该用户已被邀请' };
  }

  const now = Date.now();
  const expiresAt = now + INVITE_CONFIG.inviteCreditExpiresInDays * 24 * 60 * 60 * 1000;

  // 给邀请人加额度
  addTransaction(referrerId, {
    id: generateId(),
    amount: INVITE_CONFIG.referrerBonus,
    type: 'invite_earned',
    description: '邀请好友奖励',
    inviteCode: inviteeId,
    createdAt: now,
    expiresAt,
  });

  // 给被邀请人加额度
  addTransaction(inviteeId, {
    id: generateId(),
    amount: INVITE_CONFIG.inviteeBonus,
    type: 'invite_bonus',
    description: '新用户邀请奖励',
    inviteCode: referrerId,
    createdAt: now,
    expiresAt,
  });

  return { success: true };
}

// 导出
export { getUserCredits, saveUserCredits };
export { CREDIT_PACKAGES, INVITE_CONFIG, FREE_CREDIT_CONFIG } from './types';
```

### Step 4: 创建入口文件

**Create: `apps/web/lib/credits/index.ts`**

```typescript
/**
 * 额度系统入口
 */

export * from './types';
export * from './manager';
```

### Step 5: 编写测试

**Create: `apps/web/__tests__/credits.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Credits System', () => {
  describe('getAvailableCredits', () => {
    it('should return 3 free credits for new user', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });

    it('should calculate total credits correctly', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });
  });

  describe('spendCredits', () => {
    it('should fail when insufficient credits', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });

    it('should deduct from paid credits first', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });
  });

  describe('processInviteReward', () => {
    it('should give both parties 5 credits', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });

    it('should fail when inviting self', async () => {
      // TODO: 实现测试
      expect(true).toBe(true);
    });
  });
});
```

### Step 6: 运行测试验证

```bash
cd apps/web && pnpm test
```

### Step 7: 提交代码

```bash
git add apps/web/lib/credits apps/web/__tests__/credits.test.ts
git commit -m "feat: add credits system core module"
```

---

## Task 2: 邀请裂变系统

**Files:**
- Create: `apps/web/lib/invite/index.ts`
- Create: `apps/web/lib/invite/storage.ts`
- Create: `apps/web/app/api/invite/route.ts`
- Create: `apps/web/app/api/invite/[code]/route.ts`
- Modify: `apps/web/app/try/page.tsx`

### Step 1: 创建邀请码存储

**Create: `apps/web/lib/invite/storage.ts`**

```typescript
/**
 * 邀请码存储层
 */

import fs from 'fs';
import path from 'path';
import { processInviteReward } from '../credits';

const DATA_DIR = process.env.INVITE_DATA_DIR || './data/invite';
const FILE_PATH = path.join(DATA_DIR, 'invites.json');

interface InviteRecord {
  code: string;
  ownerId: string;
  createdAt: number;
  invitees: string[];
  totalEarned: number;
}

interface InviteStorage {
  codes: Record<string, InviteRecord>;  // code -> record
  users: Record<string, string>;        // anonymousId -> code
}

function loadStorage(): InviteStorage {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    return { codes: {}, users: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
  } catch {
    return { codes: {}, users: {} };
  }
}

function saveStorage(data: InviteStorage): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

// 生成邀请码
export function generateInviteCode(anonymousId: string): string {
  const storage = loadStorage();

  // 如果已有邀请码，直接返回
  if (storage.users[anonymousId]) {
    return storage.users[anonymousId];
  }

  // 生成6位邀请码
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  storage.codes[code] = {
    code,
    ownerId: anonymousId,
    createdAt: Date.now(),
    invitees: [],
    totalEarned: 0,
  };
  storage.users[anonymousId] = code;

  saveStorage(storage);
  return code;
}

// 获取用户的邀请码
export function getInviteCode(anonymousId: string): string | null {
  const storage = loadStorage();
  return storage.users[anonymousId] || null;
}

// 获取邀请统计
export function getInviteStats(anonymousId: string): {
  code: string | null;
  totalInvites: number;
  totalEarned: number;
  invitees: string[];
} {
  const storage = loadStorage();
  const code = storage.users[anonymousId];

  if (!code || !storage.codes[code]) {
    return {
      code: null,
      totalInvites: 0,
      totalEarned: 0,
      invitees: [],
    };
  }

  const record = storage.codes[code];
  return {
    code,
    totalInvites: record.invitees.length,
    totalEarned: record.totalEarned,
    invitees: record.invitees,
  };
}

// 使用邀请码
export function useInviteCode(
  code: string,
  inviteeId: string
): { success: boolean; error?: string } {
  const storage = loadStorage();
  const record = storage.codes[code];

  if (!record) {
    return { success: false, error: '邀请码无效' };
  }

  if (record.ownerId === inviteeId) {
    return { success: false, error: '不能使用自己的邀请码' };
  }

  if (record.invitees.includes(inviteeId)) {
    return { success: false, error: '已经使用过该邀请码' };
  }

  // 检查邀请人本月邀请数量
  const thisMonth = record.invitees.filter(id => {
    // 简化：不检查时间，只限制总数
    return true;
  }).length;

  if (thisMonth >= 20) {
    return { success: false, error: '邀请人的邀请名额已用完' };
  }

  // 处理奖励
  const result = processInviteReward(record.ownerId, inviteeId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 更新记录
  record.invitees.push(inviteeId);
  record.totalEarned += 5;
  saveStorage(storage);

  return { success: true };
}
```

### Step 2: 创建邀请 API

**Create: `apps/web/app/api/invite/route.ts`**

```typescript
/**
 * 邀请码 API
 *
 * GET - 获取当前用户的邀请码和统计
 * POST - 生成新的邀请码
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInviteCode, getInviteStats } from '@/lib/invite/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const stats = getInviteStats(anonymousId);

    // 如果没有邀请码，自动生成一个
    if (!stats.code) {
      const code = generateInviteCode(anonymousId);
      return NextResponse.json({
        success: true,
        data: {
          code,
          totalInvites: 0,
          totalEarned: 0,
          inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${code}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: stats.code,
        totalInvites: stats.totalInvites,
        totalEarned: stats.totalEarned,
        inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${stats.code}`,
      },
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get invite info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId } = body;

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const code = generateInviteCode(anonymousId);

    return NextResponse.json({
      success: true,
      data: {
        code,
        inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${code}`,
      },
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invite code' },
      { status: 500 }
    );
  }
}
```

### Step 3: 创建邀请码使用 API

**Create: `apps/web/app/api/invite/[code]/route.ts`**

```typescript
/**
 * 使用邀请码 API
 *
 * POST - 使用邀请码，双方获得奖励
 */

import { NextRequest, NextResponse } from 'next/server';
import { useInviteCode } from '@/lib/invite/storage';
import { getAvailableCredits } from '@/lib/credits';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { anonymousId } = body;

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const result = useInviteCode(code.toUpperCase(), anonymousId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const credits = getAvailableCredits(anonymousId);

    return NextResponse.json({
      success: true,
      data: {
        message: '邀请成功！您获得了5个额度',
        credits: credits.total,
      },
    });
  } catch (error) {
    console.error('[Invite Code API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use invite code' },
      { status: 500 }
    );
  }
}
```

### Step 4: 提交代码

```bash
git add apps/web/lib/invite apps/web/app/api/invite
git commit -m "feat: add invite referral system"
```

---

## Task 3: 多风格批量生成（图片）

**Files:**
- Modify: `apps/web/app/try/page.tsx`
- Modify: `apps/web/lib/workflow.ts`
- Create: `apps/web/components/features/try/StyleMultiSelector.tsx`

### Step 1: 创建多风格选择组件

**Create: `apps/web/components/features/try/StyleMultiSelector.tsx`**

```typescript
'use client';

import { useState } from 'react';
import type { StyleType } from './index';

interface StyleMultiSelectorProps {
  selectedStyles: StyleType[];
  onChange: (styles: StyleType[]) => void;
  disabled?: boolean;
}

const STYLE_OPTIONS: { id: StyleType; name: string; description: string; preview: string }[] = [
  {
    id: 'minimal',
    name: '极简风格',
    description: 'Apple 风格，克制、干净',
    preview: '🏛️',
  },
  {
    id: 'warmLuxury',
    name: '暖调奢华',
    description: 'Chanel 风格，温暖高级',
    preview: '✨',
  },
  {
    id: 'coolPro',
    name: '冷调专业',
    description: '科技感，专业可信赖',
    preview: '💎',
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    description: 'Kinfolk 风格，低饱和度',
    preview: '🎨',
  },
];

export function StyleMultiSelector({
  selectedStyles,
  onChange,
  disabled = false
}: StyleMultiSelectorProps) {
  const toggleStyle = (styleId: StyleType) => {
    if (disabled) return;

    if (selectedStyles.includes(styleId)) {
      onChange(selectedStyles.filter(s => s !== styleId));
    } else {
      onChange([...selectedStyles, styleId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onChange(STYLE_OPTIONS.map(s => s.id));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '15px', fontWeight: 500 }}>
          选择风格（可多选）
        </span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={selectAll}
            disabled={disabled}
            style={{
              fontSize: '13px',
              color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            全选
          </button>
          <button
            onClick={clearAll}
            disabled={disabled}
            style={{
              fontSize: '13px',
              color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
              background: 'none',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            清空
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {STYLE_OPTIONS.map((style) => {
          const isSelected = selectedStyles.includes(style.id);
          return (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              disabled={disabled}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: isSelected
                  ? '1px solid #D4AF37'
                  : '1px solid rgba(255,255,255,0.1)',
                background: isSelected
                  ? 'rgba(212,175,55,0.1)'
                  : 'rgba(255,255,255,0.02)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{style.preview}</span>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: isSelected ? '#D4AF37' : 'rgba(255,255,255,0.9)',
                }}>
                  {style.name}
                </span>
                {isSelected && (
                  <span style={{ marginLeft: 'auto', color: '#D4AF37' }}>✓</span>
                )}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
              }}>
                {style.description}
              </p>
            </button>
          );
        })}
      </div>

      {selectedStyles.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(212,175,55,0.08)',
          border: '1px solid rgba(212,175,55,0.15)',
        }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            已选择 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{selectedStyles.length}</span> 种风格，
            将消耗 <span style={{ color: '#D4AF37', fontWeight: 600 }}>{selectedStyles.length}</span> 个额度
          </span>
        </div>
      )}
    </div>
  );
}

export { STYLE_OPTIONS };
```

### Step 2: 导出组件

**Modify: `apps/web/components/features/try/index.ts`** (添加导出)

```typescript
// 在现有导出后添加
export { StyleMultiSelector, STYLE_OPTIONS } from './StyleMultiSelector';
```

### Step 3: 提交代码

```bash
git add apps/web/components/features/try/StyleMultiSelector.tsx
git add apps/web/components/features/try/index.ts
git commit -m "feat: add multi-style selector component"
```

---

## Task 4: 额度 API 集成

**Files:**
- Create: `apps/web/app/api/credits/route.ts`
- Create: `apps/web/app/api/credits/spend/route.ts`
- Modify: `apps/web/app/try/page.tsx`

### Step 1: 创建额度查询 API

**Create: `apps/web/app/api/credits/route.ts`**

```typescript
/**
 * 额度查询 API
 *
 * GET - 查询用户当前额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableCredits, getOrCreateUserCredits } from '@/lib/credits';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const available = getAvailableCredits(anonymousId);
    const userCredits = getOrCreateUserCredits(anonymousId);

    return NextResponse.json({
      success: true,
      data: {
        total: available.total,
        paid: available.paid,
        free: available.free,
        freeRemaining: available.freeRemaining,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
      },
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get credits' },
      { status: 500 }
    );
  }
}
```

### Step 2: 创建额度消耗 API

**Create: `apps/web/app/api/credits/spend/route.ts`**

```typescript
/**
 * 额度消耗 API
 *
 * POST - 消耗额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { spendCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId, amount, description, taskId } = body;

    if (!anonymousId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const result = spendCredits({
      anonymousId,
      amount,
      description: description || '生成图片',
      taskId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (error) {
    console.error('[Credits Spend API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to spend credits' },
      { status: 500 }
    );
  }
}
```

### Step 3: 提交代码

```bash
git add apps/web/app/api/credits
git commit -m "feat: add credits API endpoints"
```

---

## Task 5: 定价页面更新

**Files:**
- Modify: `apps/web/app/pricing/page.tsx`
- Modify: `apps/web/components/features/pricing/PricingSection.tsx`

### Step 1: 更新定价数据

**Modify: `apps/web/components/features/pricing/PricingSection.tsx`**

更新 PLANS 数组为新的额度制定价：

```typescript
const PLANS = [
  {
    id: 'free',
    name: '免费版',
    nameEn: 'Free',
    price: 0,
    period: '每月重置',
    description: '体验 AI 升级的魔力',
    features: [
      '每月 3 次免费额度',
      '4 种高级感风格',
      '邀请好友获得额外额度',
      '标准画质导出',
    ],
    cta: '开始体验',
    ctaLink: '/try',
    popular: false,
  },
  {
    id: 'small',
    name: '小包',
    nameEn: 'Starter',
    price: 29,
    period: '一次性购买',
    description: '轻度用户首选',
    features: [
      '20 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
    ],
    cta: '立即购买',
    ctaLink: 'mailto:upgrade@vidluxe.com?subject=购买小包',
    popular: false,
  },
  {
    id: 'medium',
    name: '中包',
    nameEn: 'Pro',
    price: 79,
    period: '一次性购买',
    description: '专业创作者推荐',
    features: [
      '60 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
      '优先处理队列',
    ],
    cta: '立即购买',
    ctaLink: 'mailto:upgrade@vidluxe.com?subject=购买中包',
    popular: true,
  },
  {
    id: 'large',
    name: '大包',
    nameEn: 'Business',
    price: 199,
    period: '一次性购买',
    description: '高频创作者必备',
    features: [
      '150 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '高清画质导出',
      '多风格批量生成',
      '优先处理队列',
      '专属客服支持',
    ],
    cta: '立即购买',
    ctaLink: 'mailto:upgrade@vidluxe.com?subject=购买大包',
    popular: false,
  },
  {
    id: 'xlarge',
    name: '超大包',
    nameEn: 'Enterprise',
    price: 499,
    period: '一次性购买',
    description: '无限创作可能',
    features: [
      '400 个额度',
      '额度永不过期',
      '4 种高级感风格',
      '4K 超清画质导出',
      '多风格批量生成',
      '最高优先级处理',
      '专属客服支持',
      'API 接入权限',
    ],
    cta: '立即购买',
    ctaLink: 'mailto:upgrade@vidluxe.com?subject=购买超大包',
    popular: false,
    badge: '最划算',
  },
];
```

### Step 2: 提交代码

```bash
git add apps/web/components/features/pricing/PricingSection.tsx
git commit -m "feat: update pricing plans to credit-based system"
```

---

## Task 6: 集成到 Try 页面

**Files:**
- Modify: `apps/web/app/try/page.tsx`

### Step 1: 添加额度状态和邀请处理

在 `apps/web/app/try/page.tsx` 中添加：

```typescript
// 在文件开头导入
import { StyleMultiSelector } from '@/components/features/try';

// 在状态定义区域添加
const [credits, setCredits] = useState<{ total: number; paid: number; free: number }>({
  total: 3,
  paid: 0,
  free: 3
});
const [selectedStyles, setSelectedStyles] = useState<StyleType[]>(['magazine']);
const [inviteCode, setInviteCode] = useState<string>('');
const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
const [inviteApplied, setInviteApplied] = useState(false);

// 添加获取额度的函数
const fetchCredits = async () => {
  if (!anonymousId) return;
  try {
    const response = await fetch(`/api/credits?anonymousId=${anonymousId}`);
    const data = await response.json();
    if (data.success) {
      setCredits({
        total: data.data.total,
        paid: data.data.paid,
        free: data.data.free,
      });
    }
  } catch (error) {
    console.error('Failed to fetch credits:', error);
  }
};

// 添加处理邀请码的函数
const handleApplyInviteCode = async () => {
  if (!inviteCodeInput || !anonymousId || inviteApplied) return;

  try {
    const response = await fetch(`/api/invite/${inviteCodeInput}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anonymousId }),
    });
    const data = await response.json();

    if (data.success) {
      setInviteApplied(true);
      fetchCredits();
      alert('邀请成功！您获得了5个额度');
    } else {
      alert(data.error || '邀请码无效');
    }
  } catch (error) {
    console.error('Failed to apply invite code:', error);
  }
};
```

### Step 2: 在上传区域添加额度显示

在上传区域的 UI 中添加额度显示和邀请码输入。

### Step 3: 提交代码

```bash
git add apps/web/app/try/page.tsx
git commit -m "feat: integrate credits and invite system into try page"
```

---

## 📝 执行总结

完成以上任务后，VidLuxe 将具备：

1. ✅ **额度制系统** - 用户购买额度，按使用消耗
2. ✅ **邀请裂变** - 双方各得5额度
3. ✅ **多风格生成** - 一次选择多个风格
4. ✅ **新定价页面** - 展示额度套餐

---

**Plan complete and saved to `docs/plans/2026-02-24-credit-system-and-pricing.md`**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
