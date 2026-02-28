/**
 * Next.js Middleware
 *
 * 实现 API 速率限制
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 内联速率限制逻辑（middleware 不能使用外部模块）
interface RateLimitConfig {
  interval: number;
  limit: number;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/upload': { interval: 60 * 1000, limit: 20 },
  '/api/enhance': { interval: 60 * 1000, limit: 10 },
  '/api/recognize': { interval: 60 * 1000, limit: 30 },
  '/api/invite': { interval: 60 * 1000, limit: 5 },
  'default': { interval: 60 * 1000, limit: 60 },
};

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, pathname: string) {
  const config = RATE_LIMIT_CONFIGS[pathname] || RATE_LIMIT_CONFIGS['default'];
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.interval };
    rateLimitStore.set(key, record);
  }

  if (record.count >= config.limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: config.limit - record.count, resetTime: record.resetTime };
}

function getClientIP(request: Request): string {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  return 'unknown';
}

const RATE_LIMITED_PATHS = [
  '/api/upload',
  '/api/enhance',
  '/api/recognize',
  '/api/invite',
  '/api/credits/spend',
  '/api/credits-v2/spend',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只对需要限制的 API 路径进行处理
  if (!RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 获取客户端 IP
  const ip = getClientIP(request);

  // 检查速率限制
  const { allowed, remaining, resetTime } = checkRateLimit(ip, pathname);

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    return NextResponse.json(
      {
        success: false,
        error: '请求过于频繁，请稍后再试',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(
            remaining + 1
          ),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
        },
      }
    );
  }

  // 添加速率限制头到响应
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.floor(resetTime / 1000)));

  return response;
}

export const config = {
  matcher: [
    '/api/upload/:path*',
    '/api/enhance/:path*',
    '/api/recognize/:path*',
    '/api/invite/:path*',
    '/api/credits/spend/:path*',
    '/api/credits-v2/spend/:path*',
  ],
};
