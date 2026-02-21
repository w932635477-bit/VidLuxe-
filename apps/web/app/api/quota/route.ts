/**
 * 额度查询 API
 *
 * GET /api/quota?anonymousId=xxx - 查询用户额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuotaManager, generateAnonymousId } from '@/lib/quota';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get('anonymousId');
    const fingerprint = searchParams.get('fingerprint');
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 生成或使用已有的匿名 ID
    const id = anonymousId || generateAnonymousId(fingerprint || undefined, ip);

    const quotaManager = getQuotaManager();
    const quotaInfo = quotaManager.getQuotaInfo(id);

    return NextResponse.json({
      success: true,
      anonymousId: id,
      quota: quotaInfo,
    });
  } catch (error) {
    console.error('[Quota API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get quota' },
      { status: 500 }
    );
  }
}
