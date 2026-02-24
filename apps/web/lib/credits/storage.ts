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
