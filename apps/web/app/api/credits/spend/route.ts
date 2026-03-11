/**
 * 额度消耗 API（安全增强版）
 *
 * POST - 消耗额度
 *
 * 安全措施：
 * 1. 速率限制（middleware 层）
 * 2. Origin/Referer 验证（防止 CSRF）
 * 3. 请求时间戳验证（防止重放攻击）
 * 4. 内部调用签名验证（可选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { spendCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

// 允许的来源域名
const ALLOWED_ORIGINS = [
  'vidluxe.com.cn',
  'www.vidluxe.com.cn',
  'vidluxe.cn',
  'www.vidluxe.cn',
  'localhost:3000',
  '146.56.193.40:3000',
];

// 请求时间戳有效期（5秒）
const TIMESTAMP_TOLERANCE = 5 * 1000;

/**
 * 验证请求来源
 */
function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 开发环境跳过验证
  if (process.env.NODE_ENV === 'development') {
    return { valid: true };
  }

  // 至少需要一个来源头
  if (!origin && !referer) {
    return { valid: false, error: 'Missing origin header' };
  }

  // 检查 origin
  if (origin) {
    const originHost = (() => {
      try {
        return new URL(origin).host;
      } catch {
        return null;
      }
    })();

    if (!originHost || !ALLOWED_ORIGINS.some(allowed => originHost === allowed || originHost.endsWith('.' + allowed))) {
      return { valid: false, error: 'Invalid origin' };
    }
  }

  // 检查 referer
  if (referer) {
    const refererHost = (() => {
      try {
        return new URL(referer).host;
      } catch {
        return null;
      }
    })();

    if (!refererHost || !ALLOWED_ORIGINS.some(allowed => refererHost === allowed || refererHost.endsWith('.' + allowed))) {
      return { valid: false, error: 'Invalid referer' };
    }
  }

  return { valid: true };
}

/**
 * 验证请求时间戳（防止重放攻击）
 */
function validateTimestamp(request: NextRequest): { valid: boolean; error?: string } {
  const timestamp = request.headers.get('x-timestamp');

  if (!timestamp) {
    // 时间戳是可选的，但不提供时记录警告
    console.warn('[Credits Spend API] Request without timestamp');
    return { valid: true };
  }

  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid timestamp' };
  }

  const now = Date.now();
  const diff = Math.abs(now - requestTime);

  if (diff > TIMESTAMP_TOLERANCE) {
    console.warn(`[Credits Spend API] Timestamp out of range: diff=${diff}ms`);
    return { valid: false, error: 'Request expired' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证请求来源
    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
      console.warn('[Credits Spend API] Origin validation failed:', originCheck.error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized request' },
        { status: 403 }
      );
    }

    // 2. 验证时间戳
    const timestampCheck = validateTimestamp(request);
    if (!timestampCheck.valid) {
      return NextResponse.json(
        { success: false, error: timestampCheck.error },
        { status: 400 }
      );
    }

    // 3. 解析请求体
    const body = await request.json();
    const { anonymousId, amount, description, taskId } = body;

    // 4. 参数验证
    if (!anonymousId || typeof anonymousId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid anonymousId' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount (must be 1-100)' },
        { status: 400 }
      );
    }

    // 5. 记录请求日志（审计）
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    console.log('[Credits Spend API]', {
      anonymousId: anonymousId.substring(0, 12) + '...',
      amount,
      description,
      taskId,
      clientIP,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });

    // 6. 执行额度消耗
    const result = spendCredits({
      anonymousId,
      amount,
      description: description || '生成图片',
      taskId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      },
    });
  } catch (error) {
    console.error('[Credits Spend API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to spend credits' },
      { status: 500 }
    );
  }
}
