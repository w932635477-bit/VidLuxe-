/**
 * 邀请码存储层
 */

import fs from 'fs';
import path from 'path';
import { processInviteReward, INVITE_CONFIG } from '../credits';

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

  // 生成6位邀请码（带碰撞检测）
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    attempts++;
  } while (storage.codes[code] && attempts < maxAttempts);

  // 如果碰撞检测失败，抛出错误
  if (storage.codes[code]) {
    throw new Error('无法生成唯一邀请码，请重试');
  }

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

  // 检查邀请人邀请数量
  if (record.invitees.length >= 20) {
    return { success: false, error: '邀请人的邀请名额已用完' };
  }

  // 处理奖励
  const result = processInviteReward(record.ownerId, inviteeId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 更新记录
  record.invitees.push(inviteeId);
  record.totalEarned += INVITE_CONFIG.referrerBonus;
  saveStorage(storage);

  return { success: true };
}
