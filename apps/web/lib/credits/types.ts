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
