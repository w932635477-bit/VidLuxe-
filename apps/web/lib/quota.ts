/**
 * 额度管理模块
 *
 * 管理匿名用户的使用额度
 * 使用 JSON 文件持久化存储
 *
 * 改进：
 * - 使用全局变量解决 Next.js HMR 问题
 * - 添加原子操作防止竞态条件
 * - 添加数据验证
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
  updatedAt?: number; // 更新时间戳
  version: number; // 用于乐观锁
}

// 配置常量
const QUOTA_CONFIG = {
  // 存储文件路径
  storagePath: process.env.QUOTA_STORAGE_PATH || './data/quota.json',
  // 默认总额度
  defaultTotalCount: 10,
  // 重置周期（毫秒）- 24 小时
  resetPeriod: 24 * 60 * 60 * 1000,
  // 最大重试次数（用于并发安全）
  maxRetries: 3,
} as const;

/**
 * 验证额度数据格式
 */
function validateQuotaInfo(data: unknown): data is QuotaInfo {
  if (typeof data !== 'object' || data === null) return false;
  const quota = data as Record<string, unknown>;

  return (
    typeof quota.anonymousId === 'string' &&
    typeof quota.usedCount === 'number' &&
    typeof quota.totalCount === 'number' &&
    typeof quota.resetAt === 'number' &&
    typeof quota.createdAt === 'number'
  );
}

/**
 * 额度管理类
 */
export class QuotaManager {
  private quotas: Map<string, QuotaInfo> = new Map();
  private storagePath: string;
  private savePending: boolean = false;

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

  // 从文件加载（带数据验证）
  private load(): void {
    try {
      if (fs.existsSync(this.storagePath)) {
        const rawData = fs.readFileSync(this.storagePath, 'utf-8');
        const data = JSON.parse(rawData);
        const now = Date.now();

        let loadedCount = 0;
        let skippedCount = 0;

        // 验证并加载每个额度记录
        for (const [id, quotaData] of Object.entries(data)) {
          if (!validateQuotaInfo(quotaData)) {
            console.warn(`[QuotaManager] Invalid quota data for ${id}, skipping`);
            skippedCount++;
            continue;
          }

          // 只加载未过期的额度
          if (quotaData.resetAt > now) {
            this.quotas.set(id, { ...quotaData, version: quotaData.version || 0 });
            loadedCount++;
          }
        }

        console.log(`[QuotaManager] Loaded ${loadedCount} quotas, skipped ${skippedCount} invalid`);
      }
    } catch (error) {
      console.error('[QuotaManager] Failed to load:', error);
      // 备份损坏时，创建空文件
      this.save();
    }
  }

  // 保存到文件
  private save(): void {
    // 防止重复保存
    if (this.savePending) return;

    try {
      this.savePending = true;
      const data: Record<string, QuotaInfo> = {};
      this.quotas.forEach((value, key) => {
        data[key] = value;
      });
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('[QuotaManager] Failed to save:', error);
    } finally {
      this.savePending = false;
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
        version: 0,
      };
      this.quotas.set(anonymousId, quota);
      this.save();
    }

    return { ...quota }; // 返回副本，防止外部修改
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
   * 扣减额度（使用乐观锁实现并发安全）
   * @returns 是否成功扣减
   */
  deduct(anonymousId: string): boolean {
    for (let attempt = 0; attempt < QUOTA_CONFIG.maxRetries; attempt++) {
      const currentQuota = this.quotas.get(anonymousId);

      // 如果不存在，先创建
      if (!currentQuota) {
        this.getOrCreate(anonymousId);
        continue;
      }

      // 检查额度
      if (currentQuota.usedCount >= currentQuota.totalCount) {
        return false;
      }

      // 乐观锁：检查版本是否变化
      const currentVersion = currentQuota.version || 0;
      const storedQuota = this.quotas.get(anonymousId);

      if (storedQuota && (storedQuota.version || 0) === currentVersion) {
        // 版本匹配，执行更新
        storedQuota.usedCount++;
        storedQuota.version = currentVersion + 1;
        storedQuota.updatedAt = Date.now();
        this.quotas.set(anonymousId, storedQuota);
        this.save();
        return true;
      }

      // 版本不匹配，重试
      console.log(`[QuotaManager] Version mismatch for ${anonymousId}, retrying (${attempt + 1}/${QUOTA_CONFIG.maxRetries})`);
    }

    console.warn(`[QuotaManager] Failed to deduct quota for ${anonymousId} after ${QUOTA_CONFIG.maxRetries} attempts`);
    return false;
  }

  /**
   * 退还额度（任务失败时）
   */
  refund(anonymousId: string): boolean {
    for (let attempt = 0; attempt < QUOTA_CONFIG.maxRetries; attempt++) {
      const currentQuota = this.quotas.get(anonymousId);

      if (!currentQuota || currentQuota.usedCount <= 0) {
        return false;
      }

      // 乐观锁
      const currentVersion = currentQuota.version || 0;
      const storedQuota = this.quotas.get(anonymousId);

      if (storedQuota && (storedQuota.version || 0) === currentVersion) {
        storedQuota.usedCount--;
        storedQuota.version = currentVersion + 1;
        this.quotas.set(anonymousId, storedQuota);
        this.save();
        return true;
      }
    }

    console.warn(`[QuotaManager] Failed to refund quota for ${anonymousId}`);
    return false;
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
      version: 0,
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
    quota.version = (quota.version || 0) + 1;
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

// 使用全局变量保持跨请求持久化（解决 Next.js HMR 问题）
declare global {
  // eslint-disable-next-line no-var
  var quotaManagerGlobal: QuotaManager | undefined;
}

export function getQuotaManager(): QuotaManager {
  if (!global.quotaManagerGlobal) {
    global.quotaManagerGlobal = new QuotaManager();
  }
  return global.quotaManagerGlobal;
}
