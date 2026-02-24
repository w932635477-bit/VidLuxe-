/**
 * 额度消耗 API
 *
 * POST - 消耗额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { spendCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anonymousId, amount, description, taskId } = body;

    if (!anonymousId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

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
