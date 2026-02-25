/**
 * 额度管理器
 * 处理额度的获取、消耗、查询等核心逻辑
 */

import {
  getUserCredits,
  saveUserCredits,
  createUserCredits,
  addTransaction,
  recordSpendTransaction
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
  const now = Date.now();

  // 计算过期的邀请额度
  const expiredInviteAmount = credits.inviteCredits
    .filter(c => c.expiresAt && c.expiresAt < now)
    .reduce((sum, c) => sum + c.amount, 0);

  // 有效余额 = 总余额 - 过期的邀请额度
  const validBalance = Math.max(0, credits.balance - expiredInviteAmount);

  const freeRemaining = Math.max(
    0,
    credits.freeCredits.monthlyLimit - credits.freeCredits.usedThisMonth
  );

  return {
    total: validBalance + freeRemaining,
    paid: validBalance,
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

  const now = Date.now();

  // 计算过期的邀请额度
  const expiredInviteAmount = credits.inviteCredits
    .filter(c => c.expiresAt && c.expiresAt < now)
    .reduce((sum, c) => sum + c.amount, 0);

  // 有效余额 = 总余额 - 过期的邀请额度
  const validBalance = Math.max(0, credits.balance - expiredInviteAmount);

  // 先消耗付费额度，再消耗免费额度
  let remaining = request.amount;

  // 消耗有效付费额度（包括有效邀请额度）
  if (validBalance > 0 && remaining > 0) {
    const spendFromPaid = Math.min(validBalance, remaining);
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

  // 保存余额变更并记录交易
  saveUserCredits(credits);
  recordSpendTransaction(request.anonymousId, transaction);

  // 重新计算可用额度返回
  const newAvailable = getAvailableCredits(request.anonymousId);

  return {
    success: true,
    newBalance: newAvailable.total,
    transactionId: transaction.id,
  };
}

// 退回额度（任务失败时调用）
export function refundCredits(
  anonymousId: string,
  amount: number,
  reason: string
): { success: boolean; newBalance: number; transactionId?: string } {
  const credits = getOrCreateUserCredits(anonymousId);

  // 直接增加余额（退回到付费额度）
  credits.balance += amount;
  credits.totalEarned += amount;
  credits.updatedAt = Date.now();

  // 记录退回交易
  const transaction: CreditTransaction = {
    id: generateId(),
    amount: amount,
    type: 'refund',
    description: `退回额度: ${reason}`,
    createdAt: Date.now(),
  };

  saveUserCredits(credits);
  recordSpendTransaction(anonymousId, transaction);

  const newAvailable = getAvailableCredits(anonymousId);

  return {
    success: true,
    newBalance: newAvailable.total,
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

  // 检查本月邀请次数限制
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartTime = monthStart.getTime();

  const invitesThisMonth = referrerCredits.inviteCredits.filter(
    c => c.type === 'invite_earned' && c.createdAt >= monthStartTime
  ).length;

  if (invitesThisMonth >= INVITE_CONFIG.maxInvitesPerMonth) {
    return { success: false, error: '本月邀请次数已达上限' };
  }

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
