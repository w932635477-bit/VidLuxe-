/**
 * 使用邀请码 API
 *
 * POST - 使用邀请码，双方获得奖励
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyInviteCode } from '@/lib/invite/storage';
import { getAvailableCredits } from '@/lib/credits';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { anonymousId } = body;

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const result = applyInviteCode(code.toUpperCase(), anonymousId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const credits = getAvailableCredits(anonymousId);

    return NextResponse.json({
      success: true,
      data: {
        message: '邀请成功！您获得了5个额度',
        credits: credits.total,
      },
    });
  } catch (error) {
    console.error('[Invite Code API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use invite code' },
      { status: 500 }
    );
  }
}
