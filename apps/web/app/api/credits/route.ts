/**
 * 额度查询 API
 *
 * GET - 查询用户当前额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableCredits, getOrCreateUserCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');

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
        hasUsedInviteCode, // 新增：是否已使用过邀请码
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
