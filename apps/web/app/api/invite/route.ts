/**
 * 邀请码 API
 *
 * GET - 获取当前用户的邀请码和统计
 * POST - 生成新的邀请码
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateInviteCode, getInviteStats } from '@/lib/invite/storage';

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

    const stats = getInviteStats(anonymousId);

    // 如果没有邀请码，自动生成一个
    if (!stats.code) {
      const code = generateInviteCode(anonymousId);
      return NextResponse.json({
        success: true,
        data: {
          code,
          totalInvites: 0,
          totalEarned: 0,
          inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${code}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        code: stats.code,
        totalInvites: stats.totalInvites,
        totalEarned: stats.totalEarned,
        inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${stats.code}`,
      },
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get invite info' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId } = body;

    if (!anonymousId) {
      return NextResponse.json(
        { success: false, error: 'Missing anonymousId' },
        { status: 400 }
      );
    }

    const code = generateInviteCode(anonymousId);

    return NextResponse.json({
      success: true,
      data: {
        code,
        inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/try?invite=${code}`,
      },
    });
  } catch (error) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate invite code' },
      { status: 500 }
    );
  }
}
