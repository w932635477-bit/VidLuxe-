/**
 * API 速率限制
 *
 * 基于 IP 地址的限制策略
 */

interface RateLimitConfig {
  interval: number; // 时间窗口（毫秒）
  limit: number;    // 最大请求数
}

// 不同 API 的速率限制配置
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 上传接口：每分钟最多 20 次
  '/api/upload': { interval: 60 * 1000, limit: 20 },
  // 增强接口：每分钟最多 10 次
  '/api/enhance': { interval: 60 * 1000, limit: 10 },
  // 识别接口：每分钟最多 30 次
  '/api/recognize': { interval: 60 * 1000, limit: 30 },
  // 邀请接口：每分钟最多 5 次
  '/api/invite': { interval: 60 * 1000, limit: 5 },
  // 默认：每分钟最多 60 次
  'default': { interval: 60 * 1000, limit: 60 },
};

// 内存存储（生产环境建议使用 Redis）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 清理过期记录（每 5 分钟）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * 检查是否超过速率限制
 */
export function checkRateLimit(
  ip: string,
  pathname: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMIT_CONFIGS[pathname] || RATE_LIMIT_CONFIGS['default'];
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  // 如果没有记录或已过期，创建新记录
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(key, record);
  }

  // 检查是否超限
  if (record.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // 增加计数
  record.count++;

  return {
    allowed: true,
    remaining: config.limit - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 获取客户端 IP
 */
export function getClientIP(request: Request): string {
  // 检查各种可能的 IP 头
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  return 'unknown';
}

/**
 * 需要速率限制的 API 路径
 */
export const RATE_LIMITED_PATHS = [
  '/api/upload',
  '/api/enhance',
  '/api/recognize',
  '/api/invite',
  '/api/credits/spend',
  '/api/credits-v2/spend',
];
