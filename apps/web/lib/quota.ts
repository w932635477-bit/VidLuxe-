/**
 * 额度管理模块
 *
 * 管理匿名用户的使用额度
 * 使用 JSON 文件持久化存储
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 额度信息
export interface QuotaInfo {
  anonymousId: string;
  usedCount: number;
  totalCount: number;
  resetAt: number; // 重置时间戳
  createdAt: number;
}

// 配置
const QUOTA_CONFIG = {
  // 存储文件路径
  storagePath: process.env.QUOTA_STORAGE_PATH || './data/quota.json',
  // 默认总额度
  defaultTotalCount: 10,
  // 重置周期（毫秒）- 24 小时
  resetPeriod: 24 * 60 * 60 * 1000,
};

/**
 * 额度管理类
 */
export class QuotaManager {
  private quotas: Map<string, QuotaInfo> = new Map();
  private storagePath: string;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), QUOTA_CONFIG.storagePath);
    this.ensureStorageDir();
    this.load();
  }

  // 确保存储目录存在
  private ensureStorageDir(): void {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // 从文件加载
  private load(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        const now = Date.now();

        // 只加载未过期的额度
        for (const [id, quota] of Object.entries(data) as [string, QuotaInfo][]) {
          if (quota.resetAt > now) {
            this.quotas.set(id, quota);
          }
        }

        console.log(`[QuotaManager] Loaded ${this.quotas.size} quotas`);
      }
    } catch (error) {
      console.error('[QuotaManager] Failed to load:', error);
    }
  }

  // 保存到文件
  private save(): void {
    try {
      const data: Record<string, QuotaInfo> = {};
      this.quotas.forEach((value, key) => {
        data[key] = value;
      });
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[QuotaManager] Failed to save:', error);
    }
  }

  /**
   * 获取或创建额度信息
   */
  getOrCreate(anonymousId: string): QuotaInfo {
    const now = Date.now();
    let quota = this.quotas.get(anonymousId);

    // 不存在或已过期，创建新的
    if (!quota || quota.resetAt <= now) {
      quota = {
        anonymousId,
        usedCount: 0,
        totalCount: QUOTA_CONFIG.defaultTotalCount,
        resetAt: now + QUOTA_CONFIG.resetPeriod,
        createdAt: now,
      };
      this.quotas.set(anonymousId, quota);
      this.save();
    }

    return quota;
  }

  /**
   * 检查是否有剩余额度
   */
  hasQuota(anonymousId: string): boolean {
    const quota = this.getOrCreate(anonymousId);
    return quota.usedCount < quota.totalCount;
  }

  /**
   * 获取剩余额度
   */
  getRemaining(anonymousId: string): number {
    const quota = this.getOrCreate(anonymousId);
    return Math.max(0, quota.totalCount - quota.usedCount);
  }

  /**
   * 扣减额度
   * @returns 是否成功扣减
   */
  deduct(anonymousId: string): boolean {
    const quota = this.getOrCreate(anonymousId);

    if (quota.usedCount >= quota.totalCount) {
      return false;
    }

    quota.usedCount++;
    this.quotas.set(anonymousId, quota);
    this.save();

    return true;
  }

  /**
   * 退还额度（任务失败时）
   */
  refund(anonymousId: string): void {
    const quota = this.quotas.get(anonymousId);
    if (quota && quota.usedCount > 0) {
      quota.usedCount--;
      this.quotas.set(anonymousId, quota);
      this.save();
    }
  }

  /**
   * 获取额度详情
   */
  getQuotaInfo(anonymousId: string): {
    used: number;
    total: number;
    remaining: number;
    resetAt: number;
    resetIn: number; // 秒
  } {
    const quota = this.getOrCreate(anonymousId);
    const now = Date.now();

    return {
      used: quota.usedCount,
      total: quota.totalCount,
      remaining: Math.max(0, quota.totalCount - quota.usedCount),
      resetAt: quota.resetAt,
      resetIn: Math.max(0, Math.ceil((quota.resetAt - now) / 1000)),
    };
  }

  /**
   * 重置额度（管理员）
   */
  reset(anonymousId: string): void {
    const now = Date.now();
    const quota: QuotaInfo = {
      anonymousId,
      usedCount: 0,
      totalCount: QUOTA_CONFIG.defaultTotalCount,
      resetAt: now + QUOTA_CONFIG.resetPeriod,
      createdAt: now,
    };
    this.quotas.set(anonymousId, quota);
    this.save();
  }

  /**
   * 增加额度（管理员）
   */
  addQuota(anonymousId: string, count: number): void {
    const quota = this.getOrCreate(anonymousId);
    quota.totalCount += count;
    this.quotas.set(anonymousId, quota);
    this.save();
  }

  /**
   * 清理过期记录
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    const toDelete: string[] = [];

    this.quotas.forEach((quota, id) => {
      if (quota.resetAt <= now) {
        toDelete.push(id);
        cleaned++;
      }
    });

    toDelete.forEach((id) => this.quotas.delete(id));

    if (cleaned > 0) {
      this.save();
      console.log(`[QuotaManager] Cleaned ${cleaned} expired quotas`);
    }

    return cleaned;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalUsers: number;
    activeUsers: number;
    totalUsed: number;
    totalRemaining: number;
  } {
    const now = Date.now();
    let activeUsers = 0;
    let totalUsed = 0;
    let totalRemaining = 0;

    this.quotas.forEach((quota) => {
      if (quota.resetAt > now) {
        activeUsers++;
        totalUsed += quota.usedCount;
        totalRemaining += Math.max(0, quota.totalCount - quota.usedCount);
      }
    });

    return {
      totalUsers: this.quotas.size,
      activeUsers,
      totalUsed,
      totalRemaining,
    };
  }
}

/**
 * 生成匿名 ID
 * 基于浏览器指纹或 IP
 */
export function generateAnonymousId(fingerprint?: string, ip?: string): string {
  const source = fingerprint || ip || 'anonymous';
  return crypto.createHash('sha256').update(source).digest('hex').substring(0, 16);
}

// 单例实例
let quotaManager: QuotaManager | null = null;

export function getQuotaManager(): QuotaManager {
  if (!quotaManager) {
    quotaManager = new QuotaManager();
  }
  return quotaManager;
}
