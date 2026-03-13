/**
 * API 限流中间件
 * 防止恶意刷接口
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 限流配置
const RATE_LIMIT_CONFIG = {
  // 每分钟最多请求数
  maxRequests: 30,
  // 时间窗口（毫秒）
  windowMs: 60000,
  // 白名单路径（不限流）
  whitelist: [
    '/api/health',
    '/_next',
    '/favicon.ico',
  ],
};

// 存储请求记录（生产环境应使用 Redis）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 清理过期记录（每分钟执行一次）
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * 获取客户端 IP
 */
function getClientIp(request: NextRequest): string {
  // 优先从 X-Forwarded-For 获取（经过代理）
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // 从 X-Real-IP 获取
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // 最后使用 request.ip（兼容旧版 Next.js 类型）
  return (request as any).ip || 'unknown';
}

/**
 * 检查是否在白名单中
 */
function isWhitelisted(pathname: string): boolean {
  return RATE_LIMIT_CONFIG.whitelist.some(path => pathname.startsWith(path));
}

/**
 * 限流中间件
 */
export function rateLimitMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  // 白名单路径不限流
  if (isWhitelisted(pathname)) {
    return null;
  }

  // 只对 API 路由限流
  if (!pathname.startsWith('/api/')) {
    return null;
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const key = `${ip}:${pathname}`;

  // 获取或创建请求记录
  let record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    // 创建新记录
    record = {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    };
    requestCounts.set(key, record);
    return null;
  }

  // 检查是否超过限制
  if (record.count >= RATE_LIMIT_CONFIG.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `请求过于频繁，请 ${retryAfter} 秒后再试`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
        },
      }
    );
  }

  // 增加计数
  record.count++;

  return null;
}
