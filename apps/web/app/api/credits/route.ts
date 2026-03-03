/**
 * 额度查询 API
 *
 * GET - 查询用户当前额度
 * - 登录用户：从 Supabase user_credits 表获取
 * - 匿名用户：从文件系统获取
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableCredits, getOrCreateUserCredits } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');

    // 尝试获取登录用户
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
