/**
 * 邀请码存储层
 */

import fs from 'fs';
import path from 'path';
import { processInviteReward, INVITE_CONFIG } from '../credits';
import { getUserCredits } from '../credits/storage';

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

// 使用邀请码（参考 Dropbox 模式）
export function applyInviteCode(
  code: string,
  inviteeId: string
): { success: boolean; error?: string; message?: string } {
  const storage = loadStorage();
  const record = storage.codes[code];

  // 1. 检查邀请码是否有效
  if (!record) {
    return { success: false, error: '邀请码无效' };
  }

  // 2. 不能使用自己的邀请码
  if (record.ownerId === inviteeId) {
    return { success: false, error: '不能使用自己的邀请码' };
  }

  // 3. 检查邀请人终身邀请上限
  if (record.invitees.length >= INVITE_CONFIG.maxInvitesLifetime) {
    return { success: false, error: '邀请人的邀请名额已用完' };
  }

  // 4. 检查被邀请人是否已经被任何人邀请过（每人只能被邀请一次）
  const inviteeCredits = getUserCredits(inviteeId);
  if (inviteeCredits) {
    const alreadyInvitedByAnyone = inviteeCredits.inviteCredits.some(
      c => c.type === 'invite_bonus'
    );
    if (alreadyInvitedByAnyone) {
      return { success: false, error: '您已经使用过邀请码了，每人只能被邀请一次' };
    }

    // 5. 检查是否是新用户（账户创建时间在指定时间窗口内）
    const accountAge = Date.now() - inviteeCredits.createdAt;
    const newUserWindowMs = INVITE_CONFIG.newUserWindowHours * 60 * 60 * 1000;
    if (accountAge > newUserWindowMs) {
      const hoursAgo = Math.floor(accountAge / (60 * 60 * 1000));
      return {
        success: false,
        error: `邀请码仅限新用户使用（账户创建${INVITE_CONFIG.newUserWindowHours}小时内），您的账户已创建${hoursAgo}小时`
      };
    }
  }

  // 6. 检查是否已经使用过这个特定的邀请码
  if (record.invitees.includes(inviteeId)) {
    return { success: false, error: '已经使用过该邀请码' };
  }

  // 7. 处理奖励
  const result = processInviteReward(record.ownerId, inviteeId);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 8. 更新邀请记录
  record.invitees.push(inviteeId);
  record.totalEarned += INVITE_CONFIG.referrerBonus;
  saveStorage(storage);

  return {
    success: true,
    message: `邀请成功！您获得了${INVITE_CONFIG.inviteeBonus}个额度，有效期${INVITE_CONFIG.inviteCreditExpiresInDays}天`
  };
}
