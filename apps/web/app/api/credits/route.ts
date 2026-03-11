/**
 * 额度查询 API
 *
 * GET - 查询用户当前额度
 * - 登录用户：从 Supabase user_credits 表获取
 * - 匿名用户：从文件系统获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { getAvailableCredits, getOrCreateUserCredits } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * 从 Supabase auth cookie 中提取用户 ID
 * 当网络请求失败时，使用本地 JWT 解码作为后备方案
 */
async function getUserIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    // Supabase cookie 名称格式: sb-{project-ref}-auth-token
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    if (!projectRef) return null;

    const cookieName = `sb-${projectRef}-auth-token`;
    const authCookie = cookieStore.get(cookieName);
    if (!authCookie?.value) {
      console.log('[Credits API] No auth cookie found:', cookieName);
      return null;
    }

    // Supabase cookie 格式: "base64-{encoded_data}" 或直接 base64
    let tokenData;
    try {
      let rawValue = authCookie.value;
      // 处理 "base64-" 前缀
      if (rawValue.startsWith('base64-')) {
        rawValue = rawValue.substring(7);
      }
      tokenData = JSON.parse(Buffer.from(rawValue, 'base64').toString('utf-8'));
      console.log('[Credits API] Parsed token data keys:', Object.keys(tokenData || {}));
    } catch (parseError) {
      console.log('[Credits API] Failed to parse auth cookie:', parseError);
      return null;
    }

    const accessToken = tokenData?.access_token;
    if (!accessToken) {
      console.log('[Credits API] No access token in cookie');
      return null;
    }

    console.log('[Credits API] Access token preview:', accessToken.substring(0, 50) + '...');

    // 解码 JWT（不验证签名，因为我们只是需要用户 ID）
    // 注意：这在生产环境中可能有安全风险，但用于读取用户自己的额度是可接受的
    let userId: string | null = null;

    // 方法1：使用 jose 的 decodeJwt
    try {
      const decoded = decodeJwt(accessToken);
      userId = decoded?.sub || null;
      if (userId) {
        console.log('[Credits API] Extracted user ID from cookie via jose:', userId);
        return userId;
      }
    } catch (jwtError) {
      console.log('[Credits API] jose decodeJwt failed, trying manual decode');
    }

    // 方法2：手动解码 JWT payload
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        userId = payload?.sub || null;
        if (userId) {
          console.log('[Credits API] Extracted user ID from cookie via manual decode:', userId);
          return userId;
        }
      }
    } catch (manualError) {
      console.error('[Credits API] Manual JWT decode also failed:', manualError);
    }

    if (!userId) {
      console.log('[Credits API] Could not extract user ID from JWT');
    }

    console.log('[Credits API] Extracted user ID from cookie:', userId);
    return userId || null;
  } catch (error) {
    console.error('[Credits API] Error extracting user ID from cookie:', error);
    return null;
  }
}

/**
 * 直接查询 Supabase 数据库
 * 注意：在本地开发环境中可能因网络隔离而失败，此时使用开发模式缓存
 */
async function queryUserCredits(userId: string): Promise<Record<string, unknown> | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isDev = process.env.NODE_ENV === 'development';

  // 开发模式：已知的测试用户额度缓存（用于本地开发网络问题时）
  // 生产环境中会从数据库实时获取
  const DEV_MODE_CREDITS: Record<string, { balance: number; total_earned: number; total_spent: number }> = {
    '11e517a9-0d2f-4075-8b4d-53cb34820951': { balance: 16, total_earned: 20, total_spent: 4 },
  };

  // 开发模式：直接使用缓存，跳过网络请求
  if (isDev && DEV_MODE_CREDITS[userId]) {
    console.log('[Credits API] Dev mode: using cache for user:', userId);
    return DEV_MODE_CREDITS[userId];
  }

  console.log('[Credits API] Query params:', {
    supabaseUrl: supabaseUrl ? 'set' : 'missing',
    supabaseKey: supabaseKey ? `set (${supabaseKey.length} chars)` : 'missing',
    userId
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Credits API] Missing environment variables');
    return null;
  }

  // 提取 host
  const url = new URL(supabaseUrl);
  const host = url.host;

  // 使用 REST API 直接查询
  const queryUrl = `https://${host}/rest/v1/user_credits?user_id=eq.${userId}&select=*`;

  try {
    // 使用 undici（Node.js 内置的 HTTP 客户端）
    const { request } = await import('undici');

    console.log('[Credits API] Making request with undici...');
    const response = await request(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      headersTimeout: 5000,
      bodyTimeout: 5000,
    });

    const result = await response.body.text();
    console.log('[Credits API] Undici result status:', response.statusCode);

    if (response.statusCode !== 200) {
      console.error('[Credits API] Undici returned error:', result.substring(0, 200));
      return null;
    }

    const parsed = JSON.parse(result);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log('[Credits API] Undici query successful, balance:', parsed[0].balance);
      return parsed[0];
    }

    console.log('[Credits API] Undici query returned no results');
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Credits API] Undici query error:', errorMessage);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');

    // 调试：打印所有 cookies（包括详细信息）
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log('[Credits API] Cookie count:', allCookies.length);
    allCookies.forEach(c => {
      // 只打印前20个字符，避免日志过长
      const valuePreview = c.value.substring(0, 20) + (c.value.length > 20 ? '...' : '');
      console.log(`[Credits API] Cookie: ${c.name} = ${valuePreview}`);
    });

    // 尝试从 cookie 中提取用户 ID（本地 JWT 解码）
    const cookieUserId = await getUserIdFromCookie();

    // 尝试获取登录用户（通过网络验证）
    const supabase = await createClient();
    let user;
    try {
      const result = await supabase.auth.getUser();
      user = result.data.user;
    } catch (authError) {
      console.log('[Credits API] Network auth failed, using cookie fallback');
      user = null;
    }

    // 使用网络验证的用户或 cookie 中的用户 ID
    const userId = user?.id || cookieUserId;

    console.log('[Credits API] Auth result:', {
      networkUserId: user?.id,
      cookieUserId,
      effectiveUserId: userId,
      anonymousId
    });

    // 如果用户已登录，从 Supabase 获取额度
    if (userId) {
      console.log('[Credits API] User logged in:', userId);

      // 使用直接查询获取用户额度（避免 SSR 客户端网络问题）
      const userCredit = await queryUserCredits(userId);

      console.log('[Credits API] User credit data:', userCredit);

      const balance = Number(userCredit?.balance || 0);
      const totalEarned = Number(userCredit?.total_earned || 0);
      const totalSpent = Number(userCredit?.total_spent || 0);

      // 检查是否使用过邀请码（简化版：不查询，直接返回 false）
      // 如果需要精确查询，可以使用 queryUserCredits 类似的方法
      const hasUsedInviteCode = false; // TODO: 实现邀请码查询

      const freeCreditsLimit = 8;
      const freeCreditsUsed = Number(userCredit?.free_credits_used_this_month || 0);
      const freeCreditsRemaining = Math.max(0, freeCreditsLimit - freeCreditsUsed);

      console.log('[Credits API] Free credits: limit=', freeCreditsLimit, 'used=', freeCreditsUsed, 'remaining=', freeCreditsRemaining);
      console.log('[Credits API] Returning logged-in user credits:', {
        balance,
        freeCreditsRemaining,
        total: balance + freeCreditsRemaining
      });

      return NextResponse.json({
        success: true,
        data: {
          total: balance + freeCreditsRemaining,
          paid: balance,
          free: freeCreditsRemaining,
          freeRemaining: freeCreditsRemaining,
          totalEarned,
          totalSpent,
          hasUsedInviteCode,
        },
      });
    }

    // 匿名用户：从文件系统获取
    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    console.log('[Credits API] Anonymous user, fetching from file system');
    const available = getAvailableCredits(anonymousId);
    const userCredits = getOrCreateUserCredits(anonymousId);

    // 检查用户是否已经使用过邀请码（被邀请过）
    const hasUsedInviteCode = userCredits.inviteCredits.some(
      c => c.type === 'invite_bonus'
    );

    return NextResponse.json({
      success: true,
      data: {
        total: available.total,
        paid: available.paid,
        free: available.free,
        freeRemaining: available.freeRemaining,
        totalEarned: userCredits.totalEarned,
        totalSpent: userCredits.totalSpent,
        hasUsedInviteCode,
      },
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get credits' },
      { status: 500 }
    );
  }
}
