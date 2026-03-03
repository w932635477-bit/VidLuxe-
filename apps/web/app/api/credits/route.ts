/**
 * 额度查询 API
 *
 * GET - 查询用户当前额度
 * - 登录用户：从 Supabase user_credits 表获取
 * - 匿名用户：从文件系统获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAvailableCredits, getOrCreateUserCredits } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    // 尝试获取登录用户
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[Credits API] Auth result:', {
      userId: user?.id,
      email: user?.email,
      error: userError?.message,
      anonymousId
    });

    // 如果用户已登录，从 Supabase 获取额度
    if (user) {
      console.log('[Credits API] User logged in:', user.id);

      // 获取用户额度
      const { data: userCredit, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Credits API] Error fetching user credits:', error);
      }

      console.log('[Credits API] User credit data:', userCredit);

      const balance = userCredit?.balance || 0;
      const totalEarned = userCredit?.total_earned || 0;
      const totalSpent = userCredit?.total_spent || 0;

      // 检查是否使用过邀请码
      const { data: inviteTransaction } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'invite_bonus')
        .limit(1)
        .single();

      const hasUsedInviteCode = !!inviteTransaction;
      const freeCredits = 8;

      console.log('[Credits API] Returning logged-in user credits:', {
        balance,
        freeCredits,
        total: balance + freeCredits
      });

      return NextResponse.json({
        success: true,
        data: {
          total: balance + freeCredits,
          paid: balance,
          free: freeCredits,
          freeRemaining: freeCredits,
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
